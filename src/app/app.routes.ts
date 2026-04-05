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

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  {
    path: '',
    component: DashboardComponent,
    children: [
      { path: 'dashboard', component: CaseListComponent },
      { path: 'digital-twin', component: DigitalTwinComponent },
      { path: 'dermatology-ai', component: DermatologyAIComponent },
      { path: 'monitoring', component: MonitoringComponent },
      { path: 'telemedicine', component: TelemedicineComponent },
      { path: 'analytics', component: AdminAnalyticsComponent },
      { path: 'cystic-fibrosis', component: CysticFibrosisComponent },
      { path: 'simulator', component: ScenarioSimulatorComponent },
      { path: 'adherence', component: TreatmentAdherenceComponent },
      { path: 'new-case', component: CaseFormComponent },
      { path: 'case/:id', component: CaseDetailComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'auth' }
];
