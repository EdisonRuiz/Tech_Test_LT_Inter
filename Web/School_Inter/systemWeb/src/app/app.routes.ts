import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'courses',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'students/create',
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'courses',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/courses/courses.component').then((m) => m.CoursesComponent),
  },
  {
    path: 'my-courses',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/my-courses/my-courses.component').then((m) => m.MyCoursesComponent),
  },
  {
    path: 'students',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/students/students.component').then((m) => m.StudentsComponent),
  },
  {
    path: 'logs/:logId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/log-detail/log-detail.component').then((m) => m.LogDetailComponent),
  },
  {
    path: '**',
    redirectTo: 'courses',
  },
];

