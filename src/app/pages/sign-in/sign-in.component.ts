import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-30px)' }),
        animate('800ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('errorState', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ])
  ]
})
export class SignInComponent implements OnInit {
  loading = false;
  error: string | null = null;
  hidePassword = true;
  rememberMe = false;
  attemptCount = 0;
  maxAttempts = 5;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  constructor(
    private fb: FormBuilder, 
    private auth: AuthService, 
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Reset any previous authentication state
    this.resetForm();
    
    // Check if user is already logged in
    this.auth.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.redirectToDashboard();
        return;
      }
    });

    // Load remembered credentials if any
    this.loadRememberedCredentials();
    
    // Auto-focus on username field after a brief delay
    setTimeout(() => {
      const usernameField = document.querySelector('input[formControlName="name"]') as HTMLInputElement;
      if (usernameField) {
        usernameField.focus();
      }
    }, 500);
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.loading) {
      this.markFormGroupTouched();
      return;
    }

    // Check attempt limit
    if (this.attemptCount >= this.maxAttempts) {
      this.error = 'Too many failed attempts. Please contact support.';
      return;
    }

    this.clearError();
    this.loading = true;

    const { name, password } = this.form.value;

    try {
      await this.auth.login(name!, password!);
      
      // Handle remember me functionality
      if (this.rememberMe) {
        this.saveCredentials(name!);
      } else {
        this.clearSavedCredentials();
      }

      // Success feedback
      this.showSuccessMessage();
      this.redirectToDashboard();

    } catch (error: any) {
      this.handleLoginError(error);
    } finally {
      this.loading = false;
    }
  }

  private showSuccessMessage(): void {
    const userType = this.auth.isAdmin ? 'Admin' : 'User';
    this.snackBar.open(`Welcome back! Signed in as ${userType}`, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private redirectToDashboard(): void {
    // Determine redirect based on user role
    const target = this.auth.isAdmin ? '/admin/dashboard' : '/';
    
    // Add a small delay to show success state
    setTimeout(() => {
      this.router.navigateByUrl(target);
    }, 800);
  }

  private handleLoginError(error: any): void {
    this.attemptCount++;
    
    // Provide more specific error messages
    if (error?.status === 401) {
      this.error = 'Invalid username or password. Please try again.';
    } else if (error?.status === 403) {
      this.error = 'Account access denied. Please contact support.';
    } else if (error?.status === 429) {
      this.error = 'Too many login attempts. Please wait and try again.';
    } else if (error?.status === 0) {
      this.error = 'Connection failed. Please check your internet connection.';
    } else {
      this.error = error?.message || 'Sign-in failed. Please try again.';
    }

    // Show remaining attempts warning
    if (this.attemptCount >= 3 && this.attemptCount < this.maxAttempts) {
      const remaining = this.maxAttempts - this.attemptCount;
      this.error += ` (${remaining} attempt${remaining !== 1 ? 's' : ''} remaining)`;
    }

    // Clear password on error for security
    this.form.patchValue({ password: '' });
    
    // Focus back to username or password field based on error
    setTimeout(() => {
      const fieldToFocus = this.form.get('name')?.hasError('required') ? 'name' : 'password';
      const field = document.querySelector(`input[formControlName="${fieldToFocus}"]`) as HTMLInputElement;
      if (field) {
        field.focus();
      }
    }, 100);
  }

  // Navigation Methods for E-commerce
  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  navigateToProducts(): void {
    this.router.navigate(['/products']);
  }

  navigateToDemo(): void {
    this.router.navigate(['/demo']);
  }

  navigateToCart(): void {
    this.router.navigate(['/cart']);
  }

  navigateToContact(): void {
    this.router.navigate(['/contact']);
  }

  // Support Methods
  openSupport(): void {
    // Open support dialog or navigate to support page
    this.snackBar.open('Support: Email support@seeworld.com or call +1-800-GPS-HELP', 'Close', {
      duration: 5000,
      panelClass: ['info-snackbar']
    });
  }

  openForgotPassword(): void {
    // Navigate to forgot password or open dialog
    this.router.navigate(['/forgot-password']);
  }

  // Remember Me Functionality
  private saveCredentials(username: string): void {
    if (typeof Storage !== 'undefined') {
      localStorage.setItem('rememberedUsername', username);
      localStorage.setItem('rememberMe', 'true');
    }
  }

  private loadRememberedCredentials(): void {
    if (typeof Storage !== 'undefined') {
      const rememberedUsername = localStorage.getItem('rememberedUsername');
      const rememberMeFlag = localStorage.getItem('rememberMe');
      
      if (rememberedUsername && rememberMeFlag === 'true') {
        this.form.patchValue({ name: rememberedUsername });
        this.rememberMe = true;
      }
    }
  }

  private clearSavedCredentials(): void {
    if (typeof Storage !== 'undefined') {
      localStorage.removeItem('rememberedUsername');
      localStorage.removeItem('rememberMe');
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  private clearError(): void {
    this.error = null;
  }

  private resetForm(): void {
    this.form.reset();
    this.error = null;
    this.attemptCount = 0;
    this.hidePassword = true;
  }

  // Utility methods for template
  get isFormValid(): boolean {
    return this.form.valid;
  }

  get isUsernameInvalid(): boolean {
    const control = this.form.get('name');
    return !!(control && control.invalid && control.touched);
  }

  get isPasswordInvalid(): boolean {
    const control = this.form.get('password');
    return !!(control && control.invalid && control.touched);
  }

  get getUsernameError(): string {
    const control = this.form.get('name');
    if (control?.hasError('required')) {
      return 'Username is required';
    }
    if (control?.hasError('minlength')) {
      return 'Username must be at least 2 characters';
    }
    return '';
  }

  get getPasswordError(): string {
    const control = this.form.get('password');
    if (control?.hasError('required')) {
      return 'Password is required';
    }
    if (control?.hasError('minlength')) {
      return 'Password must be at least 4 characters';
    }
    return '';
  }

  // Handle keyboard shortcuts
  onKeydown(event: KeyboardEvent): void {
    // Enter key on form
    if (event.key === 'Enter' && !this.loading) {
      event.preventDefault();
      this.submit();
    }
    
    // Escape key to clear error
    if (event.key === 'Escape') {
      this.clearError();
    }
  }

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}