import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationsService, NotificationType } from 'angular2-notifications';
import { WebSocketService } from '../services/websocket.service';
import { LocalStorageService } from '../services/local-storage.service';
import { WS } from '../ws/ws';
import { groupBy } from '../shared/utils';

@Component({
  selector: 'app-realtime-panel',
  templateUrl: './realtime-panel.component.html'
})
export class RealtimePanelComponent implements OnInit, OnDestroy {
  ws_connections: WS[] = [];

  WEBSOCKET_RECONNECTION_INTERVAL_PERIOD = 30000; // 30 seconds

  monitoramentos = [];
  monitoramentos_posto = {};
  monitoramentos_datasets = {};
  monitoramentos_alerts = {};
  monitoramentos_alerts_periods = {};

  parametrizacoes = [];

  constructor(
    private websocketService: WebSocketService,
    private notificationsService: NotificationsService,
    private localStorage: LocalStorageService,
  ) { }

  ngOnInit() {
    this.localStorage.getFromLocalStorage('locais').subscribe(locais => {
      locais.forEach(local => {
        const {base, posto: {value}} = local;
        this.parametrizacoes.push({base, posto: value});
      });

      this.parametrizacoes.forEach(obj => {
        this.loadLive(obj.base, obj.posto);
      });
    });
  }

  ngOnDestroy() {
    this.clearAllWebsocketConnections();
  }

  loadLive(base: string, posto: string) {
    const ws = this.websocketService.connectWsLive(base, posto, this.WEBSOCKET_RECONNECTION_INTERVAL_PERIOD);
    this.ws_connections.push(ws);

    ws.getAsObservable().subscribe(
      event => {
        if (event instanceof Event && event.type === 'open') {
          // this.notificationsService.remove();
          // this.notificationsService.html('Conexão estabelecida', NotificationType.Success, {timeOut: 1500});
        } else if (event instanceof MessageEvent) {
          try {
            const data = JSON.parse(event.data);

            if (data.messageType === 'MONITORAMENTOS') {
              this.loadMonitoramentos(data.content, posto);
            } else if (data.messageType === 'ALERTAS') {
              this.loadAlertas(data.content);
            } else if (data.messageType === 'MEDICOES') {
              this.loadMedicoes(data.content);
            } else if (data.messageType === 'PERIODOS_ALERTA') {
              this.loadPeriodoAlerta(data.content);
            }
          } catch (err) {
            console.error(err);
          }
        } else if (event instanceof CloseEvent) {
          if (event.code !== 1000) {
            this.notificationsService.html(
              `Conexão perdida. Tentando reconectar em ${this.WEBSOCKET_RECONNECTION_INTERVAL_PERIOD / 1000} segundos... (Error Code: ${event.code})`,
              NotificationType.Success,
              {timeOut: this.WEBSOCKET_RECONNECTION_INTERVAL_PERIOD - 1000}
            );
          }
        } else {  // event instanceof Event && event.type === 'error'
          console.error(event);
          this.notificationsService.html(
            `Não foi possível conectar. Tentando novamente em ${this.WEBSOCKET_RECONNECTION_INTERVAL_PERIOD / 1000} segundos...`,
            NotificationType.Success,
            {timeOut: this.WEBSOCKET_RECONNECTION_INTERVAL_PERIOD - 1000}
          );
        }
      },
      error => {
        console.error(error);
      }
    );
  }

  loadMonitoramentos(content, posto) {
    const { results } = content;

    if (results) {

      this.monitoramentos_posto[posto] = results;

      const arr = [];
      Object.keys(this.monitoramentos_posto).forEach(monitoramento => {
        arr.push(...this.monitoramentos_posto[monitoramento]);
      });

      arr.sort((monitoramento1, monitoramento2) => {
        if (monitoramento1['qtd_alertas'] > monitoramento2['qtd_alertas']){
          return -1;
        } else if (monitoramento2['qtd_alertas'] > monitoramento1['qtd_alertas']) {
          return 1;
        } else {
          if(monitoramento1['id_senai'] && monitoramento2['id_senai']) {
            const monitoramento_time1 =  monitoramento1['time_valid'];
            const monitoramento_time2 =  monitoramento2['time_valid'];

            if (monitoramento_time1 > monitoramento_time2) {
              return -1;
            } else if (monitoramento_time2 > monitoramento_time1) {
              return 1;
            }

          } else if (!(monitoramento1['id_senai'] && monitoramento2['id_senai'])) {
            const monitoramento_date1 = new Date(monitoramento1['timestamp']);
            const monitoramento_date2 = new Date(monitoramento2['timestamp']);

            if (monitoramento_date1.valueOf() > monitoramento_date2.valueOf()) {
              return -1;
            } else if (monitoramento_date2.valueOf() > monitoramento_date1.valueOf()) {
              return 1;
            }
          }
          return 0;
        }
      });

      this.monitoramentos.forEach(monitoramento => {
        if (!arr.find((novoMonitoramento) => monitoramento.id === novoMonitoramento.id)) {
          monitoramento['encerrado'] = true;
          arr.push(monitoramento);
        }
      });

      this.monitoramentos = arr;
    }
  }

  loadMedicoes(content) {

    const { results } = content;

    if (results?.length) {

      const datasets = groupBy(results, 'monitoramento_id');

      for (const key in datasets) {
        if (datasets.hasOwnProperty(key)) {
          this.monitoramentos_datasets[key] = datasets[key];
        }
      }
    }
  }

  loadAlertas(content) {

    const { results } = content;

    if (results?.length) {
      const alerts = groupBy(results, 'monitoramento_id');
      for (const key in alerts) {
        if (alerts.hasOwnProperty(key)) {
          this.monitoramentos_alerts[key] = alerts[key];
        }
      }
    }
  }

  loadPeriodoAlerta(content) {

    const { results } = content;

    if (results?.length) {

      const datasets = groupBy(results, 'monitoramento_id');

      for (const key in datasets) {
        if (datasets.hasOwnProperty(key)) {
          this.monitoramentos_alerts_periods[key] = datasets[key];
        }
      }
    }
  }

  clearAllWebsocketConnections() {
    this.ws_connections.forEach(ws => ws.destroy());
    this.ws_connections = [];
  }

  trackMonitoramentoElement(index: number, monitoramento: any) {
    return monitoramento ? monitoramento.id : null;
  }

  removeMonitoramento(monitoramento) {
    this.monitoramentos.splice(this.monitoramentos.indexOf(monitoramento), 1);
  }
}
