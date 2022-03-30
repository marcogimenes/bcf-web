import { UpdateHeaderService } from './update-header.service';
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import { Observable, BehaviorSubject } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { NotificationsService, NotificationType } from 'angular2-notifications';

import { AppConfig } from '../app.config';

@Injectable({ providedIn: 'root'})
export class NotificationsConsumerService implements OnDestroy {
  batimentos_api_url: string;
  default_timeout = 60000; // 60 seconds

  consumer_interval_ref;
  consumer_interval_time = 30000;  // 30 seconds
  max_notification_open_time = 120000;  // 2 minutes

  last_notification = null;
  has_new_notification_subject = new BehaviorSubject(false);

  hasDashboardSalaControle = null;


  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private router: Router,
    private _notificationsService: NotificationsService,
    private headerService: UpdateHeaderService,

  ) {

    this.batimentos_api_url = this.config.getConfig('BATIMENTOS_FETAIS_API_BASE_URL') + ':uri?format=json';

    this.headerService.updated_observable$.subscribe(res => {
      this.hasDashboardSalaControle = res;
    });

    setTimeout(() => {
      if (!this.consumer_interval_ref && !this.hasDashboardSalaControle) {
        this.getNewNotifications()
        this.consumer_interval_ref = setInterval(() => this.getNewNotifications(), this.consumer_interval_time);
      }
    }, 500);
  }

  ngOnDestroy() {
    if (this.consumer_interval_ref) {
      clearInterval(this.consumer_interval_ref);
      this.consumer_interval_ref = null;
    }
  }

  async getNewNotifications() {
    try {
      if (this.last_notification === null) {  // there is no base notification
        const response = await this.getNotifications({
          ordering: '-data_criacao',
          desconhecida: false,
          page_size: 1,
        }).toPromise();

        const { results } = response;

        if (results.length) {
          this.last_notification = results[0];  // there is only a single result
        }
      } else {
        const response = await this.getNotifications({
          id_gt: this.last_notification.id,
          ordering: 'data_criacao',
          desconhecida: false,
          page_size: 'all',
        }).toPromise();

        const { results } = response;

        if (results.length) {
          this.newNotificationUnread();
          this.last_notification = results[results.length - 1];  // update last notification
          for (const new_notification of response['results']) {
            this._notificationsService.html(
              this.mountNotification(new_notification.mensagem),
              NotificationType.Success,
              {timeOut: this.max_notification_open_time}
            );
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  getNotifications(params = null): Observable<any> {
    return this.http.get(this.batimentos_api_url.replace(/:uri/g, '/notificacoes/'), {params: params}).pipe(
      timeout(this.default_timeout),
      // catchError((error: any): any => this.errorHandler(error, this.classificacao_api_unreachable_message)),
    );
  }

  mountNotification(message: string) {
    return `<i class="fas fa-exclamation-triangle"></i> <div class="notification-message">${message}</div>`;
  }

  newNotificationUnread() {
    if (this.router.url !== '/notificacoes') {
      this.has_new_notification_subject.next(true);
    }
  }

  newNotificationRead() {
    this.has_new_notification_subject.next(false);
  }
}
