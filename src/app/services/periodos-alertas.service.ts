import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { AppConfig } from '../app.config';

@Injectable()
export class PeriodosAlertasService {
  batimentos_api_url: string;
  default_timeout = 60000; // 60 seconds

  periodos_alerta_posto = {};

  periodos_alertas_realtime_subject = new BehaviorSubject(null);
  reloadPeriodosAlertaSubject = new BehaviorSubject(null);

  constructor(private http: HttpClient, private config: AppConfig) {
    this.batimentos_api_url = this.config.getConfig('BATIMENTOS_FETAIS_API_BASE_URL') + ':uri?format=json';
  }

  getPeriodosAlertas(params = null): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, '/periodos-alerta/'), {params: params}).pipe(
      timeout(this.default_timeout),
      // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
    );
  }

  getCountPeriodoAlertas(params = null): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, '/periodos-alerta/count/'), {params: params}).pipe(
      timeout(this.default_timeout)
    );
  }

  reloadPeriodosAlerta() {
    this.reloadPeriodosAlertaSubject.next(true);
  }

  salvarCondutaAlerta(periodoAlerta: any, data: any): Observable<any> {
    return this.http.put(this.batimentos_api_url.replace(/:uri/g, `/periodos-alerta/${periodoAlerta.id}/`),
      data
    ).pipe(
      timeout(this.default_timeout)
    );
  }
}
