import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, throwError, of } from 'rxjs';
import { catchError, timeout, retryWhen, flatMap } from 'rxjs/operators';
import { AppConfig } from '../app.config';

@Injectable()
export class PatientService {

  batimentos_api_url: string;
  default_timeout = 60000; // 60 seconds

  constructor(private http: HttpClient, private config: AppConfig) {
    this.batimentos_api_url = this.config.getConfig('BATIMENTOS_FETAIS_API_BASE_URL') + ':uri?format=json';
  }

  getPacientes(params = null): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, '/pacientes/'), {params: params})
      .pipe(
        timeout(this.default_timeout),
        // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
      );
  }

  getPaciente(paciente_id: number | string): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, `/pacientes/${paciente_id}/`))
      .pipe(
        timeout(this.default_timeout),
        // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
      );
  }

  postAssociarMonitoramento({codigo_unidade, codigo_carteira}): Observable<any> {
    return this.http.post(this.batimentos_api_url.replace(/:uri/g, `/monitoramentos/associar/`), {codigo_unidade, codigo_carteira})
      .pipe(
        timeout(this.default_timeout),
        retryWhen(errors => interval(4000).pipe(flatMap(count => count === 3 ? throwError('Giving up') : of(count))))
        // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
      );
  }

  getPacienteMonitoramentos(paciente_id: number | string, params = null): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, `/pacientes/${paciente_id}/monitoramentos/`), {params: params})
      .pipe(
        timeout(this.default_timeout),
        // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
      );
  }

  getMonitoramentoMedicoes(monitoramento_id: number | string, params = null): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, `/monitoramentos/${monitoramento_id}/medicoes/`), {params: params})
      .pipe(
        timeout(this.default_timeout),
        // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
      );
  }

  getMonitoramentoAlertas(monitoramento_id: number | string, params = null): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, `/monitoramentos/${monitoramento_id}/alertas/`), {params: params})
      .pipe(
        timeout(this.default_timeout),
        // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
      );
  }

  getMedicoes(params): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, '/medicoes/'), {params: params})
      .pipe(
        timeout(this.default_timeout),
        // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
      );
  }

  getMedicoesCSV(paciente_id: number | string): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, `/pacientes/${paciente_id}/csv/`))
      .pipe(
        timeout(this.default_timeout),
        // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
      );
  }

  getAlertas(params): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, '/alertas/'), {params: params})
      .pipe(
        timeout(this.default_timeout),
        // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
      );
  }

  // Utilizado para realizar uma requisição com uma url vinda do backend. Exemplo: (paginação)
  getFromUrl(url: string): Observable<any> {
    return this.http.get(url)
      .pipe(
        timeout(this.default_timeout),
        // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
      );
  }
}
