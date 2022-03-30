import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { timeout, catchError, map } from "rxjs/operators";
import { AppConfig } from "../app.config";
import { AuthService } from "./auth.service";

@Injectable()
export class ReportService {
  batimentos_api_url: string;
  default_timeout = 300000; // 5 minutes

  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private authService: AuthService
  ) {
    this.batimentos_api_url =
      this.config.getConfig("BATIMENTOS_FETAIS_API_BASE_URL") + ":uri";
  }

  generateReportPDF(url: string, params: any): Observable<any> {
    return this.http
    .get(this.batimentos_api_url.replace(/:uri/g, url), {
      headers: this.authService.isLoggedIn()
        ? {
            Authorization: `Token ${this.authService.getAuthorizationToken()}`
          }
        : {},
      params: params,
      responseType: 'arraybuffer'
    })
    .pipe(
      timeout(this.default_timeout),
      map(
        (res) => new Blob([res], { type: 'application/pdf' })
      ),
      catchError(
        (res) => {
          const decoder = new TextDecoder('utf-8');

          try {
            res.error = JSON.parse(decoder.decode(res.error));
          } catch (err) {
            res.error = decoder.decode(res.error)
          }

          return throwError(res);
        }
      )
    );
  }
}
