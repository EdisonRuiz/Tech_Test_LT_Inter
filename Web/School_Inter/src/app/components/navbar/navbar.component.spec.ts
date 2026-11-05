import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent admin menus', () => {
  beforeEach(() => {
    localStorage.removeItem('school_inter_jwt_token');
    localStorage.removeItem('school_inter_user_info');
    TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: NotificationService, useValue: { lastLogId: signal('log-1') } },
      ],
    });
  });

  afterEach(() => {
    TestBed.inject(AuthService).clearSession();
  });

  it.each([
    { sid: 'Admin', expected: true },
    { sid: 'Student', expected: false },
    { sid: 'admin', expected: false },
    { sid: undefined, expected: false },
  ])('shows admin menus only for sid=$sid', ({ sid, expected }) => {
    const claims = { sid, role: 'Admin', exp: Math.floor(Date.now() / 1000) + 3600 };
    const token = `header.${btoa(JSON.stringify(claims))}.signature`;
    const auth = TestBed.inject(AuthService);
    auth.setSession(token, 'user@campus.edu');
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const navbar = fixture.nativeElement as HTMLElement;

    expect(auth.isAdmin()).toBe(expected);
    expect(!!navbar.querySelector('a[href="/students"]')).toBe(expected);
    expect(!!navbar.querySelector('a[href="/logs"]')).toBe(expected);
    expect(!!navbar.querySelector('a[href="/logs/log-1"]')).toBe(expected);
    expect(navbar.querySelector('a[href="/courses"]')).not.toBeNull();
    expect(navbar.querySelector('a[href="/my-courses"]')).not.toBeNull();
    expect(navbar.querySelector('a[href="/students/create"]')).not.toBeNull();

    auth.clearSession();
    fixture.detectChanges();
    expect(auth.isAdmin()).toBe(false);
    expect(navbar.querySelector('a[href="/students"]')).toBeNull();
    expect(navbar.querySelector('a[href="/logs"]')).toBeNull();
  });

  it('does not treat an expired admin token as an admin session', () => {
    const claims = { sid: 'Admin', exp: Math.floor(Date.now() / 1000) - 60 };
    const auth = TestBed.inject(AuthService);
    auth.setSession(`header.${btoa(JSON.stringify(claims))}.signature`);

    expect(auth.isAdmin()).toBe(false);
  });
});