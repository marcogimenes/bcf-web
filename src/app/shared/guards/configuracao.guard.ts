import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { NotificationsService, NotificationType } from 'angular2-notifications';
import { LocalStorageService } from '../../services/local-storage.service';

@Injectable()
export class ConfiguracaoGuard implements CanActivate {

  constructor(
    private router: Router,
    private localStorage: LocalStorageService,
    private notificationsService: NotificationsService,
  ) { }

  canActivate(): Promise<boolean> | boolean {
    return new Promise((resolve, reject) => {
      const hasDuplicates = arrayOcorrencias => {
        return (new Set(arrayOcorrencias)).size !== arrayOcorrencias.length;
      };

      this.localStorage.getFromLocalStorage('locais').subscribe(locais => {
        const ocorrencias = locais.map(local => local.posto.value);

        if (!locais || locais.length === 0) {
          this.router.navigate(['configuracoes']);
          this.notificationsService.html('Tenha pelo menos 1 posto configurado', NotificationType.Warn);
          resolve(false);
        }
        if (hasDuplicates(ocorrencias)) {
          this.router.navigate(['configuracoes']);
          this.notificationsService.html('Não é possivel ter postos repetidos', NotificationType.Warn);
          resolve(false);
        }

        resolve(true);
      });
    });
  }
}
