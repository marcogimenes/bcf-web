import { User } from './../models/user.model';
import { Router } from '@angular/router';
import { AuthService } from './../services/auth.service';
import { UpdateHeaderService } from './../services/update-header.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { AppConfig } from '../app.config';

import { LocalStorageService } from '../services/local-storage.service';
import { PeriodosAlertasService } from '../services/periodos-alertas.service';
import { NotificationsConsumerService } from '../services/notifications-consumer.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit, OnDestroy {

  version;
  periodos_alertas_pendentes_counting = null;
  periodos_alertas_pendentes_interval;

  postos = [];
  locaisSubscription: Subscription;

  has_unread_notification = false;

  dashboardSalaControle = null;
  user: string;
  intervalUsernameUpdate = null;

  constructor(
    private config: AppConfig,
    private localStorageService: LocalStorageService,
    private periodosAlertasService: PeriodosAlertasService,
    private notificationsConsumerService: NotificationsConsumerService,
    private updateService: UpdateHeaderService,
    private authService: AuthService,
    private router: Router
  ) {
   }

  ngOnInit() {

    this.updateService.updated_observable$.subscribe(data => {
      this.dashboardSalaControle = data;
      clearInterval(this.periodos_alertas_pendentes_interval);
      this.periodos_alertas_pendentes_interval = null;

      this.intervalUsernameUpdate =  setInterval(() => {
        if(this.authService.isLoggedIn()) {
          this.user = this.authService.getUserSession();
        }
      }, this.intervalUsernameUpdate + 500);

    });

    this.locaisSubscription = this.localStorageService.watchFromLocalStorage('locais').subscribe(
      locais => {
        if (locais) {
          this.postos = locais.map(local => local.posto.value);
        }
      }
    );

    this.getPeriodosAlertaCounting();
    this.periodos_alertas_pendentes_interval = setInterval(() => this.getPeriodosAlertaCounting(), 10000);

    this.notificationsConsumerService.has_new_notification_subject.subscribe(has_notification => {
      this.has_unread_notification = has_notification;
    });

    this.version = `v${this.config.VERSION}`;
  }

  ngOnDestroy() {
    clearInterval(this.periodos_alertas_pendentes_interval);
    this.periodos_alertas_pendentes_interval = null;
    this.notificationsConsumerService.has_new_notification_subject.unsubscribe();
    this.locaisSubscription.unsubscribe();
    clearInterval(this.intervalUsernameUpdate);
    this.intervalUsernameUpdate = null;
  }

  getPeriodosAlertaCounting() {
    if (this.postos.length) {
      const params = {
        codigo_posto: this.postos,
        pendente: true,
        data_inicio_last_duration: 'PT72H',
      };

      this.periodosAlertasService.getCountPeriodoAlertas(params).subscribe(
        res => {
          if (res['count'] > 0) {
            if (res['count'] > 9) {
              this.periodos_alertas_pendentes_counting = '+9';
            } else {
              this.periodos_alertas_pendentes_counting = res['count'];
            }
          } else {
            this.periodos_alertas_pendentes_counting = null;
          }
        },
        error => {
          console.error(error);
          this.periodos_alertas_pendentes_counting = null;
        }
      );
    }
  }
  logout() {
    this.authService.logout();
    this.router.navigate(['login']);
  }
}
