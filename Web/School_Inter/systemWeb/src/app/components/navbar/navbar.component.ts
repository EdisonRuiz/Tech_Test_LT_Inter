import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="navbar-wrapper">
      <div class="navbar-container">
        <a class="brand" [routerLink]="authService.isAuthenticated() ? '/courses' : '/login'">
          <span class="brand-mark">SI</span>
          <div class="brand-text">
            <span class="brand-title">School Inter</span>
            <span class="brand-subtitle">Portal Académico</span>
          </div>
        </a>

        <button
          type="button"
          class="menu-toggle"
          (click)="mobileMenuOpen.set(!mobileMenuOpen())"
          aria-label="Abrir menú de navegación"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav class="nav-links" [class.open]="mobileMenuOpen()">
          @if (!authService.isAuthenticated()) {
            <a
              routerLink="/login"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
              class="nav-item"
            >
              Iniciar Sesión
            </a>
            <a
              routerLink="/register"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
              class="nav-item nav-item-primary"
            >
              Registro de Estudiante
            </a>
          } @else {
            <a
              routerLink="/courses"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
              class="nav-item"
            >
              Materias Disponibles
            </a>
            <a
              routerLink="/my-courses"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
              class="nav-item"
            >
              Mis Clases y Compañeros
            </a>
            <a
              routerLink="/students"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
              class="nav-item"
            >
              Gestión de Estudiantes
            </a>
            <a
              routerLink="/students/create"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
              class="nav-item"
            >
              Nuevo Estudiante
            </a>

            @if (notifications.lastLogId(); as lastLogId) {
              <a
                [routerLink]="['/logs', lastLogId]"
                routerLinkActive="active"
                (click)="closeMobileMenu()"
                class="nav-item nav-item-log"
                title="Consultar último log de excepción"
              >
                Log #{{ lastLogId.slice(0, 8) }}
              </a>
            }

            <div class="nav-divider"></div>

            <div class="user-Session">
              @if (authService.currentUser(); as user) {
                <span class="user-pill" [title]="user.email">
                  {{ user.fullName || user.email }}
                </span>
              }
              <button type="button" class="btn-logout" (click)="onLogout()">
                Cerrar Sesión
              </button>
            </div>
          }
        </nav>
      </div>
    </header>
  `,
})
export class NavbarComponent {
  readonly authService = inject(AuthService);
  readonly notifications = inject(NotificationService);
  readonly mobileMenuOpen = signal(false);

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  onLogout(): void {
    this.closeMobileMenu();
    this.authService.logout(true);
    this.notifications.info('Sesión cerrada', 'Has cerrado sesión correctamente.');
  }
}
