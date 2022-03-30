import { APP_INITIALIZER, NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgSelectModule } from '@ng-select/ng-select';
import { StorageModule } from '@ngx-pwa/local-storage';
import { NotificationAnimationType, SimpleNotificationsModule } from 'angular2-notifications';
import { Daterangepicker } from 'ng2-daterangepicker';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ModalModule } from 'ngx-bootstrap/modal';
import { PaginationModule } from 'ngx-bootstrap/pagination';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppConfig } from './app.config';

import { AlertaListComponent } from './alerta-list/alerta-list.component';
import { AuditReportComponent } from './audit-report/audit-report.component';
import { FthGraphComponent } from './fth-graph/fth-graph.component';
import { HeaderComponent } from './header/header.component';
import { PlacesListComponent } from './places-list/places-list.component';
import { PatientBoxRealtimeChartComponent } from './patient-box-realtime-chart/patient-box-realtime-chart.component';
import { PatientDetailComponent } from './patient-detail/patient-detail.component';
import { PatientListComponent } from './patient-list/patient-list.component';
import { RealtimePanelComponent } from './realtime-panel/realtime-panel.component';
import { SettingsComponent } from './settings/settings.component';
import { BiometriaComponent } from './shared/modals/biometria/biometria.component';
import { CondutaAlertaComponent } from './shared/modals/conduta-alerta/conduta-alerta.component';
import { PacienteModalComponent } from './shared/modals/paciente/paciente.component';
import { ConsultComponent } from './consult/consult.component';
import { NotificationListComponent } from './notification-list/notification-list.component';
import { ElegibleListComponent } from './elegible-list/elegible-list.component';
import { AttendanceStatusComponent } from './attendance-status/attendance-status.component';
import { AgendaComponent } from './agenda/agenda.component';

import { ConfiguracaoGuard } from './shared/guards/configuracao.guard';

import { DebugMonitoringService } from './services/debug-monitoring.service';
import { LocalStorageService } from './services/local-storage.service';
import { PatientService } from './services/patient.service';
import { PeriodosAlertasService } from './services/periodos-alertas.service';
import { ReportService } from './services/report.service';
import { SettingsService } from './services/settings.service';
import { WebSocketService } from './services/websocket.service';
import { IntegracaoService } from './services/integracao.service';
import { NotificationsConsumerService } from './services/notifications-consumer.service';
import { AudioService } from './services/audio.service';
import { ModalsService } from './shared/modals/modals.service';

import { NullBooleanStringPipe } from './shared/pipes/null-boolean-string-pipe';
import { SumIndexPipe } from './shared/pipes/sum-index-pipe';
import { MonitoramentoDurationPipe } from './shared/pipes/monitoramento-duration-pipe';
import { DashboardSalaControleComponent } from './dashboard-sala-controle/dashboard-sala-controle.component';
import { GraficosSalaControleComponent } from './graficos-sala-controle/graficos-sala-controle.component';
import { LoadingSalaControleComponent } from './loading-sala-controle/loading-sala-controle.component';
import { LoginSalaControleComponent } from './login-sala-controle/login-sala-controle.component';
import { DetalheDashboardComponent } from './detalhe-dashboard/detalhe-dashboard.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';



export function initConfig(config: AppConfig) {
  return () => config.load();
}

export function initIndexedDB(localStorageService: LocalStorageService) {
  return () => localStorageService.init();
}

@NgModule({
  declarations: [
    // Components
    AppComponent,
    HeaderComponent,
    PlacesListComponent,
    RealtimePanelComponent,
    PatientBoxRealtimeChartComponent,
    PatientListComponent,
    PatientDetailComponent,
    SettingsComponent,
    PacienteModalComponent,
    FthGraphComponent,
    AlertaListComponent,
    CondutaAlertaComponent,
    BiometriaComponent,
    AuditReportComponent,
    ConsultComponent,
    NotificationListComponent,
    ElegibleListComponent,
    AttendanceStatusComponent,
    AgendaComponent,
    GraficosSalaControleComponent,
    LoadingSalaControleComponent,

    // Pipes
    NullBooleanStringPipe,
    SumIndexPipe,
    MonitoramentoDurationPipe,
    DashboardSalaControleComponent,
    LoadingSalaControleComponent,
    LoginSalaControleComponent,
    DetalheDashboardComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    Daterangepicker,
    ProgressbarModule.forRoot(),
    StorageModule.forRoot({
      IDBDBName: 'batifet',
      LSPrefix: 'batifet_',
    }),
    PaginationModule.forRoot(),
    BsDropdownModule.forRoot(),
    ModalModule.forRoot(),
    TypeaheadModule.forRoot(),
    BsDatepickerModule.forRoot(),
    NgSelectModule,
    SimpleNotificationsModule.forRoot({
      timeOut: 4000,
      showProgressBar: false,
      maxStack: 3,
      animate: NotificationAnimationType.Scale,
      theClass: 'custom-notification',
      position: ['bottom', 'right'],
    }),
    InfiniteScrollModule,
  ],
  providers: [
    AppConfig,
    {
      provide: APP_INITIALIZER,
      useFactory: initConfig,
      deps: [AppConfig],
      multi: true,
    },
    LocalStorageService,
    {
      provide: APP_INITIALIZER,
      useFactory: initIndexedDB,
      deps: [LocalStorageService],
      multi: true,
    },
    ConfiguracaoGuard,
    AudioService,
    ModalsService,
    PatientService,
    PeriodosAlertasService,
    NotificationsConsumerService,
    ReportService,
    SettingsService,
    DebugMonitoringService,
    IntegracaoService,
    WebSocketService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
