import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL, ApiErrorLog } from '../types/api.types';
import { LogService } from './log.service';

describe('LogService', () => {
  let service: LogService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LogService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it.each(['\r\n', '\n'])(
    'fills detail with only the messages and preserves the payload with %j line endings',
    (lineEnding) => {
      const message = 'Student cannot register courses from the same teacher.';
      const payload = {
        logId: 'log-1',
        id: 'log-1',
        timestamp: '2026-11-05T18:14:23.785Z',
        level: 'Error',
        message: 'Domain exception recorded',
        detail: '',
        content: [
          'LogId: log-1',
          'CreatedAtUtc: 2026-11-05T18:09:30Z',
          'Type: TestInter.Domain.Exceptions.DomainException',
          `Message: ${message}`,
          'StackTrace:',
          `TestInter.Domain.Exceptions.DomainException: ${message}`,
          '   at TestInter.Domain.Entities.Student.ReplaceEnrollments() in C:\\Student.cs:line 70',
          '--- End of stack trace from previous location ---',
          '   at Microsoft.AspNetCore.Authentication.AuthenticationMiddleware.Invoke()',
        ].join(lineEnding),
      };
      let log: ApiErrorLog | undefined;
      service.getLogById('log-1').subscribe((result) => {
        log = result;
      });

      httpTesting.expectOne(`${API_BASE_URL}/api/logs/log-1`).flush(payload);

      expect(log).toEqual({ ...payload, detail: `${message}\n${message}` });
    }
  );

  it('preserves an existing detail', () => {
    let detail: string | undefined;
    service.getLogById('log-1').subscribe((log) => {
      detail = log.detail;
    });

    httpTesting.expectOne(`${API_BASE_URL}/api/logs/log-1`).flush({
      detail: 'Existing detail',
      content: 'Message: Another message\nStackTrace:\nSystem.Exception: Stack message',
    });

    expect(detail).toBe('Existing detail');
  });

  it('keeps detail empty when content is absent', () => {
    let detail: string | undefined;
    service.getLogById('log-1').subscribe((log) => {
      detail = log.detail;
    });

    httpTesting.expectOne(`${API_BASE_URL}/api/logs/log-1`).flush({ logId: 'log-1' });

    expect(detail).toBe('');
  });

  it('extracts inline stack messages and inner exception messages without frames', () => {
    let detail: string | undefined;
    service.getLogById('log-1').subscribe((log) => {
      detail = log.detail;
    });

    httpTesting.expectOne(`${API_BASE_URL}/api/logs/log-1`).flush({
      content: [
        'Message: Request failed.',
        'StackTrace: System.InvalidOperationException: Operation failed.',
        ' ---> System.ArgumentException: Invalid course.',
        '   at TestInter.Update()',
      ].join('\n'),
    });

    expect(detail).toBe('Request failed.\nOperation failed.\nInvalid course.');
  });
});