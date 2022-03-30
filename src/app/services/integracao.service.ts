import { AppConfig } from './../app.config';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class IntegracaoService {

  batimentos_api_url: string;
  default_timeout = 60000; // 60 seconds

  constructor(private http: HttpClient, private config: AppConfig) {
    this.batimentos_api_url = this.config.getConfig('BATIMENTOS_FETAIS_API_BASE_URL') + ':uri?format=json';
  }

  getGestantesElegiveis(contexto, params = null): Observable<any> {
    return this.http.get(
      this.batimentos_api_url.replace(/:uri/g, `/integracao/${contexto}/gestantes-elegiveis-ultimo-monitoramento/`),
      {params: params}
    )
    .pipe(
      timeout(this.default_timeout),
    );
  }

  getAtendimento(contexto, codigo_atendimento: string): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, `/integracao/${contexto}/pacientes/${codigo_atendimento}/`))
    .pipe(
      timeout(this.default_timeout)
    );
  }
}
