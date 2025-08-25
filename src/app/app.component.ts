import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      margin: 0;
      padding: 0;
    }

    .main-content {
      flex: 1;
      margin: 0;
      padding: 0;
      /* Remove the padding-top since we'll handle navbar in home component */
    }
  `]
})
export class AppComponent {
  title = 'ecommerce-frontend';
}