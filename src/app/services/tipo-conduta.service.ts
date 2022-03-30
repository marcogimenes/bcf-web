import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfig } from '../app.config';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TipoCondutaService {

  batimentos_api_url: string;
  default_timeout = 60000; // 60 seconds

  constructor(private http: HttpClient,
              private config: AppConfig) {

    this.batimentos_api_url = this.config.getConfig('BATIMENTOS_FETAIS_API_BASE_URL') + ':uri?format=json';
  }

  getTipoConduta(): Observable<any>{
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, '/tipo-conduta/'))
    .pipe(
      timeout(this.default_timeout),
    )
  }
}
