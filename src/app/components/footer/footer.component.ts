// ========================================
// FIXED src/app/components/footer/footer.component.ts
// ========================================

import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3>EStore</h3>
          <p>Your trusted online shopping destination for quality products at great prices.</p>
          <div class="social-links">
            <button mat-icon-button>
              <mat-icon>facebook</mat-icon>
            </button>
            <button mat-icon-button>
              <mat-icon>twitter</mat-icon>
            </button>
            <button mat-icon-button>
              <mat-icon>instagram</mat-icon>
            </button>
          </div>
        </div>
        
        <div class="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a routerLink="/">Home</a></li>
            <li><a routerLink="/products">Products</a></li>
            <li><a routerLink="/cart">Cart</a></li>
            <li><a routerLink="/orders">Orders</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Customer Service</h4>
          <ul>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Shipping Info</a></li>
            <li><a href="#">Returns</a></li>
          </ul>
        </div>
        
        <div class="footer-section">
          <h4>Contact Info</h4>
          <div class="contact-info">
            <div class="contact-item">
              <mat-icon>phone</mat-icon>
              <span>+1 (555) 123-4567</span>
            </div>
            <div class="contact-item">
              <mat-icon>email</mat-icon>
              <span>support&#64;estore.com</span>
            </div>
            <div class="contact-item">
              <mat-icon>location_on</mat-icon>
              <span>123 Commerce St, City, State 12345</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="footer-bottom">
        <p>&copy; {{ currentYear }} EStore. All rights reserved.</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: #2c3e50;
      color: white;
      margin-top: auto;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 3rem 2rem 2rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .footer-section {
      h3, h4 {
        margin-bottom: 1rem;
        color: #ecf0f1;
      }

      p {
        color: #bdc3c7;
        line-height: 1.6;
        margin-bottom: 1rem;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          margin-bottom: 0.5rem;

          a {
            color: #bdc3c7;
            text-decoration: none;
            transition: color 0.3s ease;

            &:hover {
              color: #3498db;
            }
          }
        }
      }
    }

    .social-links {
      display: flex;
      gap: 0.5rem;

      button {
        color: #bdc3c7;
        
        &:hover {
          color: #3498db;
        }
      }
    }

    .contact-info {
      .contact-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
        color: #bdc3c7;

        mat-icon {
          font-size: 1.1rem;
          width: 1.1rem;
          height: 1.1rem;
        }
      }
    }

    .footer-bottom {
      border-top: 1px solid #34495e;
      padding: 1rem 2rem;
      text-align: center;
      background-color: #1a252f;

      p {
        margin: 0;
        color: #7f8c8d;
      }
    }

    @media (max-width: 768px) {
      .footer-content {
        padding: 2rem 1rem 1rem;
        grid-template-columns: 1fr;
        text-align: center;
      }

      .footer-bottom {
        padding: 1rem;
      }
    }
  `]
})
export class FooterComponent {  // ✅ CORRECT CLASS NAME
  currentYear = new Date().getFullYear();
}