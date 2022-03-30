import { TimeService } from './../services/time.service';
import { NotificationsService, NotificationType } from 'angular2-notifications';
import { Component, OnChanges, SimpleChanges, Input } from '@angular/core';
import { ALERT_TYPE, ALERT_COLOR, TAQ, DSA, BRD, ATR } from '../shared/constants';
import { PatientService } from '../services/patient.service';
import { PeriodosAlertasService } from '../services/periodos-alertas.service';

@Component({
  selector: 'app-patient-detail',
  templateUrl: './patient-detail.component.html'
})
export class PatientDetailComponent implements OnChanges {

  @Input() patient: any;
  @Input() can_load_monitoramentos: boolean;

  patient_data: any;
  patient_monitoring_list: any;

  patient_plot_data = [];

  selected_monitoring: any = null;

  patient_alerts_desaceleracao = [];
  patient_alerts_taquicardia = [];
  patient_alerts_bradicardia = [];
  patient_alerts_ausencia_aceleracao_transitoria = [];

  loading = false;
  totalDurationValid: number;
  totalDuration: number;
  loadingDuration: boolean = false;

  constructor(
    private patientService: PatientService,
    private periodosAlertasService: PeriodosAlertasService,
    private notificationsService: NotificationsService,
    private timeService: TimeService
  ) {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['patient']) {
      this.patient_data = null;

      if (changes.patient.currentValue && changes.patient.currentValue !== changes.patient.previousValue) {
        this.loadPaciente();
      }
    }

    this.selected_monitoring = null;

    if (changes['can_load_monitoramentos']) {
      if (this.can_load_monitoramentos) {
        this.loading = true;
        await this.loadPacienteMonitoramentos();
        if (this.patient_monitoring_list['count']) {
          await this.onSelectChange(this.patient_monitoring_list['results'][0]);
        }
        this.loading = false;
      }
    }
  }

  async onSelectChange(monitoring) {
    this.selected_monitoring = monitoring;
    this.loading = true;
    this.loadingDuration = true;
    const medicoes_list = await this.loadPacienteMedicoes();
    const alerts_list = await this.loadAlertas();
    await this.loadAlertasPeriodos();
    this.generateDataSet(medicoes_list, alerts_list);
    this.getDurationValid();
    this.loading = false;
  }

  async loadPaciente() {
    try {
      const response = await this.patientService.getPaciente(this.patient.id).toPromise();
      this.patient_data = response;
    } catch (error) {
      console.error(error);
      this.notificationsService.html('Erro ao se conectar com a API', NotificationType.Error);
    }
  }

  async loadPacienteMonitoramentos() {
    try {
      const response = await this.patientService.getPacienteMonitoramentos(
        this.patient.id,
        {ordernar_por: '-timestamp', page_size: 'all'}
      ).toPromise();
      this.patient_monitoring_list = response;
    } catch (error) {
      console.error(error);
      this.notificationsService.html('Erro ao se conectar com a API', NotificationType.Error);
    }
  }

  async loadPacienteMedicoes() {
    try {
      const response = await this.patientService.getMonitoramentoMedicoes(
        this.selected_monitoring.id,
        {ordernar_por: 'tempo', page_size: 'all'}
      ).toPromise();

      return response['results'];
    } catch (error) {
      console.error(error);
      this.notificationsService.html('Erro ao se conectar com a API', NotificationType.Error);
    }
  }

  async loadAlertas() {
    try {
      const response = await this.patientService.getMonitoramentoAlertas(this.selected_monitoring.id, {
        ativo: true,
        ordernar_por: '-data_fim_alerta',
        page_size: 'all',
      }).toPromise();

      return response['results'];
    } catch (error) {
      console.error(error);
      this.notificationsService.html('Erro ao se conectar com a API', NotificationType.Error);
    }
  }

  async loadAlertasPeriodos() {
    try {
      const response = await this.periodosAlertasService.getPeriodosAlertas({
        monitoramento_id: this.selected_monitoring.id,
        ordering: '-data_inicio',
      }).toPromise();

      const results = response['results'];

      this.patient_alerts_desaceleracao = results.filter(periodo_alerta => periodo_alerta.tipo === DSA);
      this.patient_alerts_taquicardia = results.filter(periodo_alerta => periodo_alerta.tipo === TAQ);
      this.patient_alerts_bradicardia = results.filter(periodo_alerta => periodo_alerta.tipo === BRD);
      this.patient_alerts_ausencia_aceleracao_transitoria = results.filter(periodo_alerta => periodo_alerta.tipo === ATR);
    } catch (error) {
      console.error(error);
      this.notificationsService.html('Erro ao se conectar com a API', NotificationType.Error);
    }
  }

  generateDataSet(medicoes_list, alerts_list) {
    const plot_data = medicoes_list.map(medicao => {
      const medicao_alert = alerts_list.find(alert => alert['data_fim_alerta'] === medicao['tempo']);

      const plot = {
        value: medicao['valor'],
        base_line: medicao['linha_base'],
        date: new Date(medicao['tempo']),
      };

      if (medicao_alert) {
        plot['value_line_color'] = ALERT_COLOR[medicao_alert['tipo']];
      }

      return plot;
    });

    const aus_aceleracao_transitoria_alert_list = alerts_list.filter(alert => alert['tipo'] === ATR);

    if (aus_aceleracao_transitoria_alert_list.length) {
      aus_aceleracao_transitoria_alert_list.forEach(alert => {
        const index_inicio_alerta = plot_data.findIndex(plot => plot.date.valueOf() === new Date(alert['data_inicio_alerta']).valueOf());
        const index_fim_alerta = plot_data.findIndex(plot => plot.date.valueOf() === new Date(alert['data_fim_alerta']).valueOf());

        if (index_inicio_alerta >= 0 && index_fim_alerta >= 0) {
          for (let i = index_inicio_alerta; i <= index_fim_alerta; i++) {
            if (!plot_data[i]['value_line_color']) {
              plot_data[i]['value_line_color'] = ALERT_COLOR[ATR];
            }
          }
        }
      });
    }

    this.patient_plot_data = plot_data;
  }

  getAlertDisplay(alert_type: string) {
    return ALERT_TYPE[alert_type] || '';
  }

  getDurationValid() {
    this.timeService.getMonitoramentoTime(this.selected_monitoring.id).subscribe(monitoringTime => {
      this.totalDurationValid = monitoringTime['total_valid_duration'] * 1000;
      this.totalDuration = monitoringTime['total_time_monitoring'] * 1000;
      this.loadingDuration = false;

    }, error => {
      this.notificationsService.html('Erro ao buscar duração do monitoramento', NotificationType.Error);
      this.loadingDuration = false;
    });
  }
}
