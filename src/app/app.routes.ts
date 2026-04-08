import { Routes } from '@angular/router';
import { AuthComponent } from './components/auth/auth';
import { DashboardComponent } from './components/dashboard/dashboard';
import { CaseListComponent } from './components/case-list/case-list';
import { CaseFormComponent } from './components/case-form/case-form';
import { CaseDetailComponent } from './components/case-detail/case-detail';
import { DigitalTwinComponent } from './components/digital-twin/digital-twin';
import { MonitoringComponent } from './components/monitoring/monitoring';
import { TelemedicineComponent } from './components/telemedicine/telemedicine';
import { AdminAnalyticsComponent } from './components/admin-analytics/admin-analytics';
import { CysticFibrosisComponent } from './components/cystic-fibrosis/cystic-fibrosis';
import { ScenarioSimulatorComponent } from './components/scenario-simulator/scenario-simulator';
import { TreatmentAdherenceComponent } from './components/treatment-adherence/treatment-adherence';
import { DermatologyAIComponent } from './components/dermatology-ai/dermatology-ai';
import { authGuard, guestGuard } from './guards/auth.guard';
import { LandingPageComponent } from './pages/landing/landing-page';
import { AboutPageComponent } from './pages/static/about-page';
import { FeaturesPageComponent } from './pages/static/features-page';
import { PrivacyPageComponent } from './pages/static/privacy-page';
import { ContactPageComponent } from './pages/static/contact-page';

export const routes: Routes = [
  { path: '', component: LandingPageComponent, data: { title: 'AbdullohAI Clinical | Explainable Clinical Decision Support', description: 'Clinical AI platform for differential diagnosis, red-flag triage, and explainable lab-based decision support.', canonical: '/' } },
  { path: 'about', component: AboutPageComponent, data: { title: 'About | AbdullohAI Clinical', description: 'Learn about AbdullohAI Clinical and its medical decision-support mission.', canonical: '/about' } },
  { path: 'features', component: FeaturesPageComponent, data: { title: 'Features | AbdullohAI Clinical', description: 'Explore explainable differential diagnosis, risk analytics, and longitudinal monitoring workflows.', canonical: '/features' } },
  { path: 'privacy', component: PrivacyPageComponent, data: { title: 'Privacy & Security | AbdullohAI Clinical', description: 'Privacy-first clinical AI architecture, access controls, and compliance-oriented design.', canonical: '/privacy' } },
  { path: 'contact', component: ContactPageComponent, data: { title: 'Contact | AbdullohAI Clinical', description: 'Contact the AbdullohAI Clinical team for pilots, partnerships, and product questions.', canonical: '/contact' } },
  { path: 'login', component: AuthComponent, canActivate: [guestGuard], data: { title: 'Clinician Login | AbdullohAI Clinical', description: 'Secure sign in for AbdullohAI Clinical users.', canonical: '/login' } },
  {
    path: 'app',
    component: DashboardComponent,
    canActivate: [authGuard],
    data: { title: 'Clinical Workspace | AbdullohAI Clinical', description: 'Secure clinical workspace dashboard for case management and AI-supported analysis.', canonical: '/app/dashboard' },
    children: [
      { path: 'dashboard', component: CaseListComponent, data: { title: 'Dashboard | AbdullohAI Clinical' } },
      { path: 'digital-twin', component: DigitalTwinComponent, data: { title: 'Digital Twin | AbdullohAI Clinical' } },
      { path: 'dermatology-ai', component: DermatologyAIComponent, data: { title: 'Dermatology AI | AbdullohAI Clinical' } },
      { path: 'monitoring', component: MonitoringComponent, data: { title: 'Monitoring | AbdullohAI Clinical' } },
      { path: 'telemedicine', component: TelemedicineComponent, data: { title: 'Telemedicine | AbdullohAI Clinical' } },
      { path: 'analytics', component: AdminAnalyticsComponent, data: { title: 'Analytics | AbdullohAI Clinical' } },
      { path: 'cystic-fibrosis', component: CysticFibrosisComponent, data: { title: 'Cystic Fibrosis | AbdullohAI Clinical' } },
      { path: 'simulator', component: ScenarioSimulatorComponent, data: { title: 'Scenario Simulator | AbdullohAI Clinical' } },
      { path: 'adherence', component: TreatmentAdherenceComponent, data: { title: 'Treatment Adherence | AbdullohAI Clinical' } },
      { path: 'new-case', component: CaseFormComponent, data: { title: 'New Case | AbdullohAI Clinical' } },
      { path: 'case/:id', component: CaseDetailComponent, data: { title: 'Case Detail | AbdullohAI Clinical' } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
