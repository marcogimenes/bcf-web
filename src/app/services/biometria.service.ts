import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { catchError, timeout, map } from 'rxjs/operators';

import { VALIDACAO_BIOMETRICA_OK } from '../shared/constants';
import { AppConfig } from '../app.config';
import * as $ from 'jquery'

@Injectable({
  providedIn: 'root'
})
export class BiometriaService {
  batimentos_api_url: string;
  default_timeout = 10000; // 10 seconds

  periodos_alertas_realtime_subject = new BehaviorSubject(null);

  constructor(private http: HttpClient,
              private config: AppConfig) {
    this.batimentos_api_url = this.config.getConfig('BATIMENTOS_FETAIS_API_BASE_URL') + ':uri?format=json';
  }

  getPeriodosAlertas(params = null): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, '/periodos-alerta/'), {params: params}).pipe(
      timeout(this.default_timeout),
      // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
    );
  }

  getProfissional(nomeProfissional:string, contexto: string): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, `/integracao/${contexto}/profissionais/`), {
      params: {'nome': nomeProfissional}
    })
    .pipe(
      timeout(this.default_timeout),
      map((response: Response) => {
        return response['lista_profissionais'] ? response['lista_profissionais'] : [];
      })
    );
  }

  async getHtmlModal(loginProfissional: string, contexto: string, successCallback: CallableFunction, errorCallback: CallableFunction) {
    try {
      const tokenBiometrico = await this.http.get(
        this.batimentos_api_url.replace(/:uri/g, `/integracao/${contexto}/biometria/token/`)
      ).pipe(
        map((res: Response) => res['biometria']['token'])
      ).toPromise().catch(
        error => {
          errorCallback(error);
        }
      );

      const urlBiometrica = await this.http.get(
        this.batimentos_api_url.replace(/:uri/g, `/integracao/${contexto}/biometria/${loginProfissional}/formulario-bio-url/`),
        {
          params: {
            'token': tokenBiometrico
          }
        }
      ).pipe(
        map((res: Response) => res['biometria']['url'])
      ).toPromise().catch(error=>{
        errorCallback(error);
      });

      const data = $.ajax({
        dataType: 'html',
        url: urlBiometrica,
        success: function(data) {
          successCallback(data, tokenBiometrico);
        }
      });
    } catch (e) {
      errorCallback(e);
    }
  }

  async validarBiometria(biometriaImage: string, tokenBiometrico: string, contexto: string, success: CallableFunction, error: CallableFunction) {
    try {
      const validacao = await this.http.post(
        this.batimentos_api_url.replace(/:uri/g, `/integracao/${contexto}/biometria/validar/`),
        {
          token: tokenBiometrico,
          data: biometriaImage
        }
      ).toPromise().catch(error => {
        error(error);
      });

      if (validacao['biometria']['codigo_validacao'] && validacao['biometria']['codigo_validacao'] === VALIDACAO_BIOMETRICA_OK) {
        success();
      } else {
        error(validacao['biometria']['mensagem_validacao']);
      }
    } catch(e) {
      error(e)
      return false;
    }
  }
}
