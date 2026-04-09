import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards';
import { AboutPage, ContactPage, FeaturesPage, HomePage, NotFoundPage, PrivacyPage, TermsPage, TransplantPage, UrineAnalysisPage } from './pages/public-pages';
import { AdminPage, AuthPage, CaseDetailPage, CaseNewPage, CasesPage, DashboardPage, MonitoringPage, ProtectedShell, TransplantTwinPage, UrineBasicPage, UrineStripPage } from './pages/protected-pages';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'about', component: AboutPage },
  { path: 'features', component: FeaturesPage },
  { path: 'transplant', component: TransplantPage },
  { path: 'urine-analysis', component: UrineAnalysisPage },
  { path: 'privacy', component: PrivacyPage },
  { path: 'terms', component: TermsPage },
  { path: 'contact', component: ContactPage },
  { path: 'login', component: AuthPage },
  { path: 'register', component: AuthPage },
  {
    path: '',
    component: ProtectedShell,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardPage },
      { path: 'cases', component: CasesPage },
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
