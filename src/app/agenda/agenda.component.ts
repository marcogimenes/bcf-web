import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { LocalStorageService } from '../services/local-storage.service';
import { SETOR_EMERGENCIA } from '../shared/constants';
import { howLong } from '../shared/utils';
import { RegistroAgendaService } from './../services/registro-agenda.service';
import { TimeService } from './../services/time.service';
const millisecondsPerSecond = 1000;
const secondsPerMinute = 60;
const millisecondsPerMinute = millisecondsPerSecond * secondsPerMinute;

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
})
export class AgendaComponent implements OnInit, OnDestroy {

  registrosAgendaList: any = [];
  locais = [];
  registrosAgendaInterval;
  timeInterval;
  almostMinutesRange = 20; // minutos
  lateMinutesRange = 5; // minutos

  time = new Date();

  constructor(
    private localStorage: LocalStorageService,
    private registroAgendaService: RegistroAgendaService,
    private timeService: TimeService
    ) { }

  ngOnInit() {
    this.localStorage.getFromLocalStorage('locais').subscribe(locais =>  {
      this.locais = locais;
      this.getRegistrosAgenda(this.locais);
    });

    this.registrosAgendaInterval = setInterval(() => this.getRegistrosAgenda(this.locais), 20000);

    this.setClock();
  }

  @HostListener('document:visibilitychange')
  onVisibilityChange() {
    clearInterval(this.timeInterval);
    this.timeInterval = null;
    if (!document.hidden) {
      this.setClock();
      this.getRegistrosAgenda(this.locais);
    }
  }

  setClock() {
    this.timeInterval = setInterval(() => {
      this.time = new Date(this.time.setMilliseconds(this.time.getMilliseconds() + 500));
    }, 500);

    this.timeService.getServerTime().subscribe(timeFromServer => {
      this.time = new Date(timeFromServer.now);
    });

  }

  async getRegistrosAgenda(locais) {
    const initPostos = locais.map(place => {
      return place.posto.value;
    });

    const params = {
      'monitoramento_linked': false,
      'codigo_posto': initPostos,
      'ordering': 'data_prevista_inicio',
    };

    try {
      const registrosAgenda = await this.registroAgendaService.getRegistroAgenda(params).toPromise();

      const registroAgendaIndexed = this.setRegistroAgendaIndexByPosto(initPostos, registrosAgenda);

      const registroAgendaLeito = this.getLocalLeito(registroAgendaIndexed);

      this.registrosAgendaList = registroAgendaLeito.map(registro => this.statusAgenda(registro, this.time));

      this.registrosAgendaList.sort((a, b) => {
        if (a?.status == 'late' && b?.status == 'on-tolerance') {
          return -1;
        }
        if (a?.status == 'on-tolerance' && b?.status == 'on-time') {
          return -1;
        }

        return 0;

      });

    } catch (e) {
      console.error(e);
    }
  }

  setRegistroAgendaIndexByPosto(postos, registrosAgenda) {
    const registros = registrosAgenda.map(registro => {

      if (registro['data_prevista_inicio']) {
        registro['data_prevista_inicio'] = new Date(registro['data_prevista_inicio']);

      }
      const index = postos.indexOf(registro['codigo_posto']) + 1;

      return {...registro, 'index_posto': index};
    });

    return registros;
  }

  showStatus(registro) {
    if (registro.is_primeiro_registro || this.time.getTime() > registro?.data_prevista_inicio.getTime() - registro?.tolerancia * 60000) {
      return true;
    }
  }

  ngOnDestroy() {
    clearInterval(this.registrosAgendaInterval);
    clearInterval(this.timeInterval);
    this.timeInterval = null;
    this.registrosAgendaInterval = null;
  }

  timer(registro) {
    return howLong(registro, this.time);
  }

  getLocalLeito(registroAgenda) {
    const postoSetor = {};
    this.locais.forEach(place => {
      postoSetor[place.posto.value] = place.setor_hosp.value;
    });

    const registroAgendaLeito = registroAgenda.map( registro => {
      if (postoSetor[registro.codigo_posto] === SETOR_EMERGENCIA) {
        if (registro.nome_acomodacao && registro.numero_leito) {
          const leito = `${registro.nome_acomodacao} / ${registro.numero_leito}`;
          return {...registro, leito };
        }
      } else {  // SETOR_INTERNACAO || SETOR_CIRURGICO
        if (registro.codigo_acomodacao) {
          const leito = registro.codigo_acomodacao;
          return { ...registro, leito };
        }
      }
      return { ...registro, leito: '-' };
    });
    return registroAgendaLeito;
  }

  statusAgenda(registro, time) {
    if (registro.data_prevista_inicio) {
      if (registro?.is_primeiro_registro) {
        if (this.isRegistroAgendaOnToleranceBack(registro, time)) {
          return {...registro,  status: 'on-tolerance'};
        }
        if (registro?.data_prevista_inicio.getTime() < time.getTime()) {
          return {...registro, status: 'late'};
        }
        return {...registro,  status: 'on-time'};
      }
      if ( this.isRegistroAgendaOnToleranceBack(registro, time) ||
         time.getTime() <= registro.data_prevista_inicio.getTime() + registro.tolerancia * millisecondsPerMinute ) {
        return {...registro, status: 'on-tolerance'};
      }
      if (time.getTime() > registro.data_prevista_inicio.getTime() + registro.tolerancia * millisecondsPerMinute) {
        return {...registro, status: 'late'};
      }
    }
    return registro;
  }

  /**
     * Verifica se a data prevista do registro agenda menos a tolerância,
     * é menor que a hora atual, porém a hora atual não deve ser maior que a data prevista do registro.
     * @param registro Registro que vem da api
     * @param time Hora atual
     * @returns boolean.
  */
  isRegistroAgendaOnToleranceBack(registro, time): boolean {
    if (time.getTime() > registro.data_prevista_inicio.getTime() - registro.tolerancia * millisecondsPerMinute
        && time.getTime() <= registro.data_prevista_inicio.getTime()) {
          return true;
        }
    return false;
  }

}
