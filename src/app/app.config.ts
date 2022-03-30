import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';

@Injectable()
export class AppConfig {

  private config: Object = null;

  VERSION: string;

  constructor(private http: HttpClient) {
    this.VERSION = require('../../package.json').version;
  }

  /**
   * Use to get the data found in the second file (config file)
   */
  public getConfig(key = null) {
    if (key) {
      return this.config[key];
    }

    return this.config;
  }

  public load() {
    return new Promise((resolve, reject) => {
      this.http.get('config/env.json').subscribe(
        res => {
          this.config = res;
          resolve(res);
        },
        err => {
          console.error('Configuration file "config.json" could not be read');
          reject(err);
        }
      );
    });
  }
}
