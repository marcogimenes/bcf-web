import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppConfig } from '../app.config';

import { User } from '../models/user.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

  batimentos_api_url: string;
  default_timeout = 60000; // 60 seconds

  constructor(private http: HttpClient, private config: AppConfig) {
    this.batimentos_api_url = this.config.getConfig('BATIMENTOS_FETAIS_API_BASE_URL') + ':uri?format=json';
  }

  login(data: { username: string, password: string}) {
    return this.http.post(
        this.batimentos_api_url.replace(/:uri/g, '/auth/login/'),
        data
    )
  }

  logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
  }

  setAuthorizationToken(token: string) {
    sessionStorage.setItem('token', token);
  }

  setUserSession(user: string) {
    sessionStorage.setItem('user', user);
  }
  getUserSession() {
    return sessionStorage.getItem('user');
  }

  getAuthorizationToken() {
      return sessionStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return this.getAuthorizationToken() !== null;
  }

  user() {
    return this.http.get(
        this.batimentos_api_url.replace(/:uri/g, '/auth/user/'),
        {
          headers: this.isLoggedIn() ? {
            'Authorization': `Token ${this.getAuthorizationToken()}`
          } : {}
        }
    )
  }

}
