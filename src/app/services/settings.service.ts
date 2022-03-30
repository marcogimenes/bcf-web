import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { AuthService } from './auth.service';

@Injectable()
export class SettingsService {

  batimentos_api_url: string;
  default_timeout = 60000; // 60 seconds

  constructor(private http: HttpClient,
              private config: AppConfig,
              private authService: AuthService) {
    this.batimentos_api_url = this.config.getConfig('BATIMENTOS_FETAIS_API_BASE_URL') + ':uri?format=json';
  }

  getConfiguracoes(): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, '/configuracoes/'))
      .pipe(
        timeout(this.default_timeout),
        // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
      );
  }

  getConfiguracao(configuracao_nome: string): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, `/configuracoes/${configuracao_nome}/`))
      .pipe(
        timeout(this.default_timeout),
        // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
      );
  }

  patchConfiguracao(configuracao_nome: string, payload: Object): Observable<any> {
    return this.http.patch(
      this.batimentos_api_url.replace(/:uri/g, `/configuracoes/${configuracao_nome}/`),
      payload,
      this.authService.isLoggedIn() ? {
        headers: {
          'Authorization': `Token ${this.authService.getAuthorizationToken()}`
        }
      } : {}
    ).pipe(
        timeout(this.default_timeout),
        // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
      );
  }

  getSetoresHosp(contexto): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, `/integracao/${contexto}/setores-hospitalar/`))
      .pipe(
        timeout(this.default_timeout),
        // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
      );
  }

  getUnidades(contexto): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, `/integracao/${contexto}/unidades-atendimento/`))
      .pipe(
        timeout(this.default_timeout),
        // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
      );
  }

  getPostos(contexto, codigo_setor, codigo_unidade_atendimento): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, `/integracao/${contexto}/postos/${codigo_setor}/${codigo_unidade_atendimento}/`))
      .pipe(
        timeout(this.default_timeout),
        // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
      );
  }

  getSalas(contexto, codigo_posto): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, `/integracao/${contexto}/postos/${codigo_posto}/salas/`))
      .pipe(
        timeout(this.default_timeout),
        // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
      );
  }

  getConvenios(contexto, codigo_unidade_atendimento): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, `/integracao/${contexto}/unidades/${codigo_unidade_atendimento}/convenios/`))
      .pipe(
        timeout(this.default_timeout),
        // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
      );
  }
}
