import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';

@Component({
  imports: [RouterOutlet, NavbarComponent, ToastContainerComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  template: `
    <app-navbar></app-navbar>

    <main class="app-shell">
      <section class="app-content">
        <router-outlet></router-outlet>
      </section>
    </main>

    <app-toast-container></app-toast-container>
  `,
})
export class App {}

