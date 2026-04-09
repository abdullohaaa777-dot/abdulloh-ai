import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { SeoService } from '../../core/seo.service';

@Component({ standalone: true, imports: [FormsModule], template: `
<h1>Login</h1>
<input [(ngModel)]="email" placeholder="Email" />
<input [(ngModel)]="password" placeholder="Password" type="password" />
<button (click)="submit()">Kirish</button>
<p>{{error()}}</p>` })
export class LoginPage implements OnInit {
  private auth = inject(AuthService); private router = inject(Router); private seo = inject(SeoService);
  email = ''; password = ''; error = signal('');
  ngOnInit(){ this.seo.setPage('Login','Hisobga kirish.', true); }
  async submit(){ const r = await this.auth.login(this.email, this.password); if (r.error) this.error.set(r.error); else void this.router.navigateByUrl('/dashboard'); }
}

@Component({ standalone: true, imports: [FormsModule], template: `
<h1>Register</h1>
<input [(ngModel)]="fullName" placeholder="Full name" />
<input [(ngModel)]="email" placeholder="Email" />
<input [(ngModel)]="password" placeholder="Password" type="password" />
<select [(ngModel)]="role"><option value="patient">patient</option><option value="doctor">doctor</option><option value="admin">admin</option></select>
<button (click)="submit()">Ro‘yxatdan o‘tish</button>
<p>{{error()}}</p>` })
export class RegisterPage implements OnInit {
  private auth = inject(AuthService); private router = inject(Router); private seo = inject(SeoService);
  fullName = ''; email = ''; password = ''; role: 'patient'|'doctor'|'admin' = 'patient'; error = signal('');
  ngOnInit(){ this.seo.setPage('Register','Hisob yaratish.', true); }
  async submit(){ const r = await this.auth.register(this.email, this.password, this.fullName, this.role); if (r.error) this.error.set(r.error); else void this.router.navigateByUrl('/dashboard'); }
}
