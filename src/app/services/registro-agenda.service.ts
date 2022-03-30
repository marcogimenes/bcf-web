import { AuthService } from './auth.service';
import { AppConfig } from './../app.config';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RegistroAgendaService {

  batimentos_api_url: string;
  default_timeout = 60000; // 60 seconds

  constructor(private http: HttpClient, private config: AppConfig, private authService: AuthService) {
    this.batimentos_api_url = this.config.getConfig('BATIMENTOS_FETAIS_API_BASE_URL') + ':uri?format=json';
  }

  getRegistroAgenda(params = null): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(':uri', '/registros-agenda/'), {
      headers: this.authService.isLoggedIn() && params.from
      ? {
          Authorization: `Token ${this.authService.getAuthorizationToken()}`
        }
      : {},

       params,

    }).pipe(
      timeout(this.default_timeout)
    );
  }
  getCount(): Observable<any>{
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, '/registros-agenda/count/'), {
      headers: this.authService.isLoggedIn()
        ? {
            Authorization: `Token ${this.authService.getAuthorizationToken()}`
          }
        : {},
    })
    .pipe(
      timeout(this.default_timeout),
    )
  }
}
