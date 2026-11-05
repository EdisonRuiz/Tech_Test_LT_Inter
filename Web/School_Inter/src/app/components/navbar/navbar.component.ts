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
          <svg id="Capa_1" data-name="Capa 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.24 31.96" class="prospero size-full object-contain"><path d="M16.97,7.18c1.93,0,3.5-1.57,3.5-3.5S18.9.18,16.97.18s-3.5,1.57-3.5,3.5,1.57,3.5,3.5,3.5"></path><path d="M19.38,17.04c-.51,0-1.01-.18-1.42-.55-2.85-2.59-6.21-4.06-10.01-4.36-2.9-.23-4.98.34-5,.35-1.12.32-2.28-.32-2.6-1.44-.32-1.12.33-2.28,1.44-2.61.42-.12,10.4-2.88,19,4.95.86.78.92,2.11.14,2.97-.42.46-.98.69-1.56.69Z"></path><path d="M19.88,31.58c-1.05,0-1.96-.79-2.09-1.86-.5-4.31-2.3-7.36-5.35-9.06-2.35-1.31-4.64-1.34-4.67-1.34-1.16,0-2.1-.93-2.11-2.09,0-1.16.94-2.11,2.1-2.11.14,0,3.24,0,6.52,1.76,3.04,1.63,6.84,5.1,7.68,12.36.13,1.15-.69,2.2-1.85,2.33-.08,0-.16.01-.24.01Z"></path><path d="M11.45,23.74c-1.56-1.08-3.51-1.71-5.34-1.71-1.37,0-2.62.33-3.7.98-.72.43-1.03,1.2-.81,2,.23.84.95,1.43,1.74,1.43h0c.31,0,.62-.09.92-.27.07-.04.22-.1.28-.13,0,0,.02,0,.04-.02.48-.15.84-.25,1.02-.29.04,0,.13-.01.21-.02.05,0,.09,0,.11-.01.13,0,.25-.01.38-.01.05,0,.09,0,.14,0,.33,0,.52.03.81.09.78.17,1.5.51,2.33,1.09.25.18.56.27.88.27.66,0,1.32-.37,1.64-.92.49-.85.22-1.9-.64-2.5Z"></path></svg>
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
            @if (authService.isAdmin()) {
              <a
                routerLink="/students"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: true }"
                (click)="closeMobileMenu()"
                class="nav-item"
              >
                Gestión de Estudiantes
              </a>
              <a
                routerLink="/logs"
                routerLinkActive="active"
                (click)="closeMobileMenu()"
                class="nav-item"
              >
                LOG
              </a>
              <a
              routerLink="/students/create"
              routerLinkActive="active"
              (click)="closeMobileMenu()"
              class="nav-item"
            >
              Nuevo Estudiante
            </a>
            }           

            @if (authService.isAdmin()) {
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
