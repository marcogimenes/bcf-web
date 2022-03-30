import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NotificationsConsumerService } from '../services/notifications-consumer.service';
import { SettingsService } from './../services/settings.service';

@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
})

export class NotificationListComponent implements OnInit {
  loading = false;
  batimentos_api_url: string;
  notificationForm: FormGroup;
  notificationList: any;
  // Pagination
  current_page = 1;
  page_size = 20;

  bases = [
    { label: 'Base Hapvida', value: 'hap' },
    { label: 'Base PSC', value: 'schosp' },
  ];

  setores_hosp = [];
  setores_hosp_loading = false;

  unidades_atendimento = [];
  unidades_atendimento_loading = false;

  postos = [];
  postos_loading = false;

  constructor(
    private notificationService: NotificationsConsumerService,
    private settingsService: SettingsService
  ) {}

  ngOnInit() {
    this.notificationService.newNotificationRead();
    this.initNotificationForm();
    this.filtrar();
  }

  initNotificationForm() {
    const today = new Date();
    this.notificationForm = new FormGroup({
      dateRange: new FormControl([today, today], [Validators.required, this.dateRangeValidator]),
      base: new FormControl(null),
      setor_hosp: new FormControl(null),
      unidade_atendimento: new FormControl(null),
      posto: new FormControl(null),
    });

    this.notificationForm.get('base').valueChanges.subscribe(base => {
      this.notificationForm.get('setor_hosp').setValue(null);
      this.loadPlaceItemsSetores(this.notificationForm.value);

      this.notificationForm.get('unidade_atendimento').setValue(null);
      this.loadPlaceItemsUnidades(this.notificationForm.value);
    });

    // Caso o setor venha a ser alterado
    this.notificationForm.get('setor_hosp').valueChanges.subscribe(setor_hosp => {
      this.notificationForm.get('posto').setValue(null);
      this.loadPlaceItemsPostos(this.notificationForm.value);
    });

    // Caso a unidade venha a ser alterada, recarregar os dados relacionados a postos de atendimento
    this.notificationForm.get('unidade_atendimento').valueChanges.subscribe(unidade_atendimento => {
      this.notificationForm.get('posto').setValue(null);
      this.loadPlaceItemsPostos(this.notificationForm.value);
    });
  }

  pageChanged(event) {
    if (
      (this.current_page > event.page) ||
      (this.current_page < event.page)
    ) {
      this.current_page = event.page;
      this.filtrar();
    }
  }

  loadPlaceItemsSetores(local) {
    const base = local?.base;
    if (base) {
      this.setores_hosp_loading = true;
      this.getSetores(base)
      .then(res => {
        this.setores_hosp = res;
      }).catch(err => {
        this.setores_hosp = [];
        console.error(err);
      }).finally(() => {
        this.setores_hosp_loading = false;
      });
    } else {
      this.setores_hosp = [];
    }
  }

  loadPlaceItemsUnidades(local) {
    const base = local?.base;
    if (base) {
      this.unidades_atendimento_loading = true;
      this.getUnidades(base)
      .then(res => {
        this.unidades_atendimento = res;
      }).catch(err => {
        console.error(err);
        this.unidades_atendimento = [];
      }).finally(() => {
        this.unidades_atendimento_loading = false;
      });
    } else {
      this.unidades_atendimento = [];
    }
  }

  loadPlaceItemsPostos(local) {
    const base = local?.base;
    const setor_hosp = local?.setor_hosp;
    const unidade_atendimento = local?.unidade_atendimento;

    if (base && setor_hosp && unidade_atendimento) {
      this.postos_loading = true;
      this.getPostos(base, setor_hosp.value, unidade_atendimento.value)
      .then(res => {
        this.postos = res;
      }).catch(err => {
        this.postos = [];
        console.error(err);
      }).finally(() => {
        this.postos_loading = false;
      });
    } else {
      this.postos = [];
    }
  }

  async getSetores(contexto) {
    const response = await this.settingsService.getSetoresHosp(contexto).toPromise();
    return response.map(setor => {
      return {
        label: setor['nm_setor_hosp'],
        value: setor['cd_setor_hosp'],
      };
    });
  }

  async getUnidades(contexto) {
    const response = await this.settingsService.getUnidades(contexto).toPromise();
    return response.map(unidade_atendimento => {
      return {
        label: unidade_atendimento['nm_unidade_atendimento'],
        value: unidade_atendimento['cd_unidade_atendimento'],
        cd_filial: unidade_atendimento['cd_filial'],
      };
    });
  }

  async getPostos(contexto, setor_hosp, unidade_atendimento) {
    const response = await this.settingsService.getPostos(contexto, setor_hosp, unidade_atendimento).toPromise();
    return response.map(posto => {
      return {
        label: posto['nm_setor'],
        value: posto['cd_setor'],
      };
    });
  }


  performFilter() {
    this.current_page = 1;
    this.filtrar();
  }

 async filtrar() {
    const { dateRange, unidade_atendimento, posto } = this.notificationForm.value;

    const date_after = this.dateFormat(dateRange[0]);
    const date_before = this.dateFormat(dateRange[1]);

    const params = {
      data_criacao_after: date_after,
      data_criacao_before: date_before,
      page: this.current_page,
      page_size: this.page_size,
      desconhecida: false,
      ordering: '-data_criacao',
    };

    if (unidade_atendimento) {
      params['codigo_filial'] = unidade_atendimento['cd_filial'];
    }

    if (posto) {
      params['codigo_posto'] = posto['value'];
    }

    this.loading = true;

    try {
      const notificationRequest = await this.notificationService.getNotifications(params).toPromise();
      this.notificationList = notificationRequest;
    } catch (error) {
      console.error(error);
    }

    this.loading = false;
  }

  dateFormat(date_param) {
    const date = date_param,
      day = date.getDate().toString(),
      dayF = day.length === 1 ? '0' + day : day,
      month = (date.getMonth() + 1).toString(), // +1 pois no getMonth Janeiro começa com zero.
      monthF = month.length === 1 ? '0' + month : month,
      yearF = date.getFullYear();
    return dayF + '/' + monthF + '/' + yearF;
  }

  dateRangeValidator(control: FormControl) {
    const value = control.value;
    if (
      value instanceof Array &&
      value.length === 2 &&
      value[0] instanceof Date &&
      value[1] instanceof Date &&
      value[0] <= value[1]
    ) {
      return null;
    }

    return {
      dateRange: {}
    };
  }
}
