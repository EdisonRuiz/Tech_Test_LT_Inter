import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../app.routes';
import { AuthService } from '../services/auth.service';

@Component({ template: 'Test page' })
class GuardTestPage {}

describe.each([
  { session: 'admin', authenticated: true, admin: true },
  { session: 'student', authenticated: true, admin: false },
  { session: 'guest', authenticated: false, admin: false },
])('Admin routes for $session', ({ authenticated, admin }) => {
  it.each(['/students', '/logs', '/logs/log-1'])(
    'checks permissions before loading %s',
    async (url) => {
      const protectedPaths = new Set(['students', 'logs', 'logs/:logId']);
      const loadProtectedPage = vi.fn(async () => GuardTestPage);
      TestBed.configureTestingModule({
        providers: [
          provideRouter(
            routes.map((route) => route.loadComponent
              ? {
                  ...route,
                  loadComponent: protectedPaths.has(route.path ?? '')
                    ? loadProtectedPage
                    : async () => GuardTestPage,
                }
              : route)
          ),
          {
            provide: AuthService,
            useValue: {
              isAuthenticated: () => authenticated,
              isAdmin: () => admin,
            },
          },
        ],
      });
      const harness = await RouterTestingHarness.create();
      const router = TestBed.inject(Router);

      await harness.navigateByUrl(url);

      const expectedUrl = !authenticated
        ? router.serializeUrl(router.createUrlTree(['/login'], { queryParams: { returnUrl: url } }))
        : admin ? url : '/courses';
      expect(router.url).toBe(expectedUrl);
      if (admin) {
        expect(loadProtectedPage).toHaveBeenCalledOnce();
      } else {
        expect(loadProtectedPage).not.toHaveBeenCalled();
      }
    }
  );
});