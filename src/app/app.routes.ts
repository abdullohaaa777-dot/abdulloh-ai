import { Routes } from '@angular/router';
import { ShellComponent } from './shared/shell.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { HomePage, AboutPage, FeaturesPage, TransplantPage, UrineAnalysisPage, PrivacyPage, TermsPage, ContactPage } from './features/public/pages';
import { LoginPage, RegisterPage } from './features/auth/auth.pages';
import { DashboardPage } from './features/dashboard/dashboard.page';
import { CaseDetailPage, CaseListPage, CaseNewPage } from './features/cases/cases.pages';
import { UrineBasicPage } from './features/urine-basic/urine-basic.page';
import { UrineStripPage } from './features/urine-strip/urine-strip.page';
import { TransplantTwinPage } from './features/transplant-twin/transplant-twin.page';
import { MonitoringPage } from './features/monitoring/monitoring.page';
import { AdminPage } from './features/admin/admin.page';
import { NotFoundPage } from './features/errors/not-found.page';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'about', component: AboutPage },
  { path: 'features', component: FeaturesPage },
  { path: 'transplant', component: TransplantPage },
  { path: 'urine-analysis', component: UrineAnalysisPage },
  { path: 'privacy', component: PrivacyPage },
  { path: 'terms', component: TermsPage },
  { path: 'contact', component: ContactPage },
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardPage },
      { path: 'cases', component: CaseListPage },
      { path: 'cases/new', component: CaseNewPage },
      { path: 'cases/:id', component: CaseDetailPage },
      { path: 'urine/basic', component: UrineBasicPage },
      { path: 'urine/strip', component: UrineStripPage },
      { path: 'transplant/twin', component: TransplantTwinPage },
      { path: 'monitoring', component: MonitoringPage },
      { path: 'admin', component: AdminPage, canActivate: [roleGuard(['admin'])] }
    ]
  },
  { path: '**', component: NotFoundPage }
];
