import { Component, Input, ViewChild, OnInit, OnChanges, Output, EventEmitter, OnDestroy, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';

import {
  ALERT_TYPE,
  ALERT_COLOR,
  ATR,
  SETOR_EMERGENCIA,
  MAX_MONITORAMENTO_DURATION,
  MAX_MONITORAMENTO_DURATION_HERAMED
} from '../shared/constants';

import { ModalsService } from '../shared/modals/modals.service';
import { LocalStorageService } from '../services/local-storage.service';
import { AudioService } from '../services/audio.service';
import { SettingsService } from '../services/settings.service';
import { TimeService } from './../services/time.service';

import { FthGraphComponent } from '../fth-graph/fth-graph.component';

@Component({
  selector: 'app-monitoramento-box-realtime-chart',
  templateUrl: './patient-box-realtime-chart.component.html'
})
export class PatientBoxRealtimeChartComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  @Input() monitoramento_data: any;
  @Input() monitoramento_piece_plot_data: Array<any> = [];
  @Input() monitoramento_alerts: Array<any> = [];
  @Input() monitoramento_alerts_periods: Array<any> = [];

  @Output() monitoramentoEncerrado = new EventEmitter<any>();

  @ViewChild('fth_graph', { static: true }) fth_graph: FthGraphComponent;

  // minutes * seconds * milliseconds
  MAX_MONITORAMENTO_ELAPSED_TIME = 10 * 60 * 1000;

  monitoringTimeInterval;
  monitoringTime;

  isSenai = false;
  leito = '';
  local_index: number;
  locaisSub: Subscription;

  plot_data = [];

  medicoes_list = [];
  alert_list = [];

  first_plot;
  last_plot;

  is_firing_alert = false;

  has_lost_focus = false;

  constructor(
    public modalsService: ModalsService,
    private audioService: AudioService,
    private localStorageService: LocalStorageService,
    private settingsService: SettingsService,
    private timeService: TimeService

  ) { }

  ngOnInit() {
    if (this.monitoramento_data['id_senai']) {
      this.isSenai = true;
      this.setMonitoramentoTime();
      this.getTimeByConfig(MAX_MONITORAMENTO_DURATION);
    } else {
      this.getTimeByConfig(MAX_MONITORAMENTO_DURATION_HERAMED);
    }

    this.locaisSub = this.localStorageService.watchFromLocalStorage('locais').subscribe(locais => {
      this.leito = this.getLeitoDisplay(locais);
      this.local_index = this.getMonitoramentoIndex(locais);
    });
  }

  setMonitoramentoTime() {
    this.monitoringTimeInterval = setInterval(() => {
      this.timeService.getMonitoramentoTime(this.monitoramento_data.id).subscribe(monitoringTime => {
        this.monitoringTime = monitoringTime['total_valid_duration'] * 1000;
        console.log(this.monitoringTime);
      });
    }, 30000);

    this.timeService.getMonitoramentoTime(this.monitoramento_data.id).subscribe(monitoringTime => {
      this.monitoringTime = monitoringTime;
      this.monitoringTime = monitoringTime['total_valid_duration'] * 1000;
    });
  }

  ngAfterViewInit() {
    document.getElementById(`monitoramento${this.monitoramento_data.id}`).addEventListener('animationend', this.encerrarMonitoramento);
  }

  ngOnChanges(changes) {
    if (changes['monitoramento_data']) {
      this.monitoramento_data['timestamp'] = new Date(this.monitoramento_data['timestamp']);
    }

    if (changes['monitoramento_piece_plot_data'] && Array.isArray(this.monitoramento_piece_plot_data)) {
      if (this.monitoramento_piece_plot_data.length) {
        this.medicoes_list = this.medicoes_list.concat(this.monitoramento_piece_plot_data);

        const first_medicao_duracao = this.medicoes_list[0]['duracao'];
        const last_medicao_duracao = this.medicoes_list[this.medicoes_list.length - 1]['duracao'];
        const total_seconds_duracao = last_medicao_duracao - first_medicao_duracao;

        if (total_seconds_duracao > this.fth_graph.max_time_seconds) {
          let next_first_index;

          for (let i = this.medicoes_list.length - 1; i >= 0; i--) {
            const duracao = last_medicao_duracao - this.medicoes_list[i]['duracao'];

            if (duracao <= this.fth_graph.max_time_seconds) {
              next_first_index = i;
            } else {
              break;
            }
          }

          this.medicoes_list = this.medicoes_list.slice(next_first_index, -1);
        }

        this.plot_data = this.generateDataSet(this.medicoes_list, this.alert_list);

        this.first_plot = this.plot_data[0];
        this.last_plot = this.plot_data[this.plot_data.length - 1];
      }

      if (this.last_plot) {
        // last received value equals -1 means that herabeat device has lost its focus
        this.has_lost_focus = this.last_plot['value'] === -1 ? true : false;
      }
    }

    if (changes['monitoramento_alerts'] && Array.isArray(this.monitoramento_alerts)) {
      const next_distinct_alerts_as_annotattions = this.monitoramento_alerts.filter(
        new_alert => !this.alert_list.find(alert => alert['id'] === new_alert['id'])
      );

      if (next_distinct_alerts_as_annotattions.length) {
        this.alert_list = this.alert_list.concat(next_distinct_alerts_as_annotattions);

        if (this.alert_list.length > this.fth_graph.max_time_seconds) {
          this.alert_list = this.alert_list.slice(this.alert_list.length - this.fth_graph.max_time_seconds - 1, -1);
        }

        this.plot_data = this.generateDataSet(this.medicoes_list, this.alert_list);

        // If the last alert happens after the first plot, it must be rendered. Otherwise, it must not.
        const last_alert_date = new Date(this.monitoramento_alerts[this.monitoramento_alerts.length - 1]['data_fim_alerta']);
        if (this.first_plot && last_alert_date > this.first_plot.date) {
          this.fireAlert();
        }
      }
    }
  }

  getTimeByConfig(config) {
    this.settingsService.getConfiguracao(config).subscribe(
      configuracao => {
        if (configuracao?.unidade === 'hours') {
          this.MAX_MONITORAMENTO_ELAPSED_TIME = configuracao.valor * 60 * 60 * 1000;  // hours * minutes * seconds * milliseconds
        } else if (configuracao?.unidade === 'minutes') {
          this.MAX_MONITORAMENTO_ELAPSED_TIME = configuracao.valor * 60 * 1000;  // minutes * seconds * milliseconds
        } else if (configuracao?.unidade === 'seconds') {
          this.MAX_MONITORAMENTO_ELAPSED_TIME = configuracao.valor * 1000;  // seconds * milliseconds
        }
      },
      err => {
        console.error(err);
      }
    );
  }

  generateDataSet(medicoes_list = [], alert_list = []) {
    const plot_data = medicoes_list.map(medicao => {
      const medicao_alert = alert_list.find(alert => alert['data_fim_alerta'] === medicao['tempo']);

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

    const aus_aceleracao_transitoria_alert_list = alert_list.filter(alert => alert['tipo'] === ATR);

    if (aus_aceleracao_transitoria_alert_list.length) {
      aus_aceleracao_transitoria_alert_list.forEach(alert => {
        let index_inicio_alerta = plot_data.findIndex(plot => plot.date.valueOf() === new Date(alert['data_inicio_alerta']).valueOf());
        const index_fim_alerta = plot_data.findIndex(plot => plot.date.valueOf() === new Date(alert['data_fim_alerta']).valueOf());

        if (index_fim_alerta >= 0) {
          index_inicio_alerta = index_inicio_alerta >= 0 ? index_inicio_alerta : 0;

          for (let i = index_inicio_alerta; i <= index_fim_alerta; i++) {
            if (!plot_data[i]['value_line_color']) {
              plot_data[i]['value_line_color'] = ALERT_COLOR[ATR];
            }
          }
        }
      });
    }

    return plot_data;
  }

  fireAlert() {
    this.is_firing_alert = true;
    this.audioService.playAlert(4, () => { this.is_firing_alert = false; });
  }

  getAlertDisplay(alert_type: string) {
    return ALERT_TYPE[alert_type] || '';
  }

  getLeitoDisplay(locais) {
    const codigoPosto = this.monitoramento_data.codigo_posto;

    const local = locais.filter(place => {
      return place.posto.value === codigoPosto;
    });

    const [{setor_hosp}] = local;

    if (setor_hosp['value'] === SETOR_EMERGENCIA) {
      if (this.monitoramento_data.nome_acomodacao && this.monitoramento_data.numero_leito) {
        return `${this.monitoramento_data.nome_acomodacao} / ${this.monitoramento_data.numero_leito}`;
      } else if (this.monitoramento_data.quarto) {
        return this.monitoramento_data.quarto;
      }
    } else {  // SETOR_INTERNACAO || SETOR_CIRURGICO
      if (this.monitoramento_data.codigo_acomodacao) {
        return this.monitoramento_data.codigo_acomodacao;
      } else if (this.monitoramento_data.quarto) {
        return this.monitoramento_data.quarto;
      }
    }

    return '-';
  }

  getMonitoramentoIndex(locais) {
    const codigoPosto = this.monitoramento_data.codigo_posto;

    let indexMonitoramento = 0;
    locais.forEach((place, index) => {
      if (place.posto.value === codigoPosto) {
        indexMonitoramento = index;
      }
    });

    return indexMonitoramento + 1;
  }

  encerrarMonitoramento = (event) => {
    this.monitoramentoEncerrado.emit(this.monitoramento_data);
  }

  ngOnDestroy() {
    document.getElementById(`monitoramento${this.monitoramento_data.id}`).removeEventListener(
      'animationend',
      this.encerrarMonitoramento
    );
    clearInterval(this.monitoringTimeInterval);
    this.locaisSub.unsubscribe();
  }
}
