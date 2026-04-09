import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

export const roleGuard = (roles: Array<'patient' | 'doctor' | 'admin'>): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.user();
  if (user && roles.includes(user.role)) return true;
  return router.createUrlTree(['/dashboard']);
};
