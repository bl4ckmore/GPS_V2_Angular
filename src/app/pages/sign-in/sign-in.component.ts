import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent {
  loading = false;
  error: string | null = null;

  form = this.fb.group({
    name: ['', Validators.required],
    password: ['', Validators.required]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  async submit() {
    if (this.form.invalid || this.loading) return;
    this.error = null;
    this.loading = true;
    const { name, password } = this.form.value;
    try {
      await this.auth.login(name!, password!);
      this.router.navigate(['/admin']); // default landing for CRUD area
    } catch (e: any) {
      this.error = e?.message || 'Sign-in failed';
    } finally {
      this.loading = false;
    }
  }
}
