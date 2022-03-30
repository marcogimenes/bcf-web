import { AppConfig } from './../app.config';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TimeService {

  batimentos_api_url: string;
  default_timeout = 60000; // 60 seconds

  constructor(private http: HttpClient, private config: AppConfig) {
    this.batimentos_api_url = this.config.getConfig('BATIMENTOS_FETAIS_API_BASE_URL') + ':uri?format=json';
  }

  getServerTime(): Observable<any> {
  return this.http.get(this.batimentos_api_url.replace(/:uri/g, `/time-now`))
    .pipe(
      timeout(this.default_timeout),
    );
  }

  getMonitoramentoTime(id: string): Observable<any> {
    return this.http.get(`${this.batimentos_api_url.replace(/:uri/g, `/monitoramentos/${id}/valid_and_total_duration_monitoramento/`)}`)
    .pipe(
      timeout(this.default_timeout)
    );
  }
}
