import { AuthGuard } from './shared/guards/auth.guard';
import { LoginSalaControleComponent } from './login-sala-controle/login-sala-controle.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RealtimePanelComponent } from './realtime-panel/realtime-panel.component';
import { PatientListComponent } from './patient-list/patient-list.component';
import { AuditReportComponent } from './audit-report/audit-report.component';
import { SettingsComponent } from './settings/settings.component';
import { ConfiguracaoGuard } from './shared/guards/configuracao.guard';
import { AlertaListComponent } from './alerta-list/alerta-list.component';
import { ConsultComponent } from './consult/consult.component';
import { NotificationListComponent } from './notification-list/notification-list.component';
import { DashboardSalaControleComponent } from './dashboard-sala-controle/dashboard-sala-controle.component';
import { GraficosSalaControleComponent } from './graficos-sala-controle/graficos-sala-controle.component';
import { DetalheDashboardComponent } from './detalhe-dashboard/detalhe-dashboard.component';

const routes: Routes = [
  { path: '', component: RealtimePanelComponent, canActivate: [ ConfiguracaoGuard ] },
  { path: 'pacientes', component: PatientListComponent, canActivate: [ ConfiguracaoGuard ] },
  // { path: 'pacientes/:id', component: PatientDetailComponent, canActivate: [ ConfiguracaoGuard ] },
  { path: 'alertas', component: AlertaListComponent, canActivate: [ConfiguracaoGuard]},
  { path: 'configuracoes', component:  SettingsComponent},
  { path: 'relatorios', component: AuditReportComponent },
  { path: 'consulta', component: ConsultComponent, canActivate: [ ConfiguracaoGuard ] },
  { path: 'notificacoes', component: NotificationListComponent, canActivate: [ ConfiguracaoGuard ] },
  { path: 'login', component: LoginSalaControleComponent},
  { path: 'dashboard', component: DashboardSalaControleComponent, canActivateChild: [ AuthGuard ],
    children: [
      { path: '', component: GraficosSalaControleComponent },
      { path: 'detalhes', component: DetalheDashboardComponent },
    ]
  },
  { path: '**', redirectTo: ''}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
