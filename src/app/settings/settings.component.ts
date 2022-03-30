import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { NotificationsService, NotificationType } from 'angular2-notifications';

import { User } from '../models/user.model';

import { UNIDADE_MAP } from '../shared/constants';
import { groupBy } from '../shared/utils';

import { AuthService } from '../services/auth.service';
import { DebugMonitoringService } from '../services/debug-monitoring.service';
import { LocalStorageService } from '../services/local-storage.service';
import { SettingsService } from '../services/settings.service';
import { AudioService } from '../services/audio.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  settings_list = [];
  settings_grouped_list = [];
  settings_form: FormGroup;

  authenticatedUser: User = null;

  formPlace1: FormGroup;
  formPlace2: FormGroup;
  formPlace3: FormGroup;
  formPlace4: FormGroup;
  formPlace5: FormGroup;

  screenSettingsForm: FormGroup;

  loginForm: FormGroup;

  attendance_code: null;

  debug_validations = [];

  baseItems = [
    { label: 'Hapvida', value: 'hap' },
    { label: 'PSC', value: 'schosp' },
  ];

  placeItems = [
    {
      setores_hosp: [],
      setores_hosp_loading: false,

      unidades_atendimento: [],
      unidades_atendimento_loading: false,

      postos: [],
      postos_loading: false,
    },
    {
      setores_hosp: [],
      setores_hosp_loading: false,

      unidades_atendimento: [],
      unidades_atendimento_loading: false,

      postos: [],
      postos_loading: false,
    },
    {
      setores_hosp: [],
      setores_hosp_loading: false,

      unidades_atendimento: [],
      unidades_atendimento_loading: false,

      postos: [],
      postos_loading: false,
    },
    {
      setores_hosp: [],
      setores_hosp_loading: false,

      unidades_atendimento: [],
      unidades_atendimento_loading: false,

      postos: [],
      postos_loading: false,
    },
    {
      setores_hosp: [],
      setores_hosp_loading: false,

      unidades_atendimento: [],
      unidades_atendimento_loading: false,

      postos: [],
      postos_loading: false,
    },
  ];

  loading = true;
  unidade_map: any = UNIDADE_MAP;

  tab = 'dashboard';

  constructor(
    private localStorage: LocalStorageService,
    private settingsService: SettingsService,
    private debugMonitoringService: DebugMonitoringService,
    private notificationsService: NotificationsService,
    private authService: AuthService,
    private audioService: AudioService,
  ) { }

  ngOnInit() {
    this.localStorage.getFromLocalStorage('locais').subscribe(locais => {
      this.initLocalSettingsForm(locais);

      this.placeItems.forEach((place, index) => {
        const local = locais[index];
        if (local) {
          this.loadingPlaceItemsSetores(local, place);
          this.loadingPlaceItemsUnidades(local, place);
          this.loadingPlaceItemsPostos(local, place);
        }
      });
    });

    this.localStorage.getFromLocalStorage('screenSettings').subscribe(screenSetting => {
      this.initScreenSettingsForm(screenSetting);
    });

    // Iniciando form group de login
    this.loginForm = new FormGroup({
      username: new FormControl(null, Validators.required),
      password: new FormControl(null, Validators.required)
    });

    // Verificando se o usuário já está logado
    if (this.authService.isLoggedIn()) {
      this.authService.user().subscribe(
        res => {
          this.authenticatedUser = res['user'];
        }
      );
    }

    this.loading = true;
    this.getSettings()
    .then(settings => {
      this.settings_list = settings;
      this.settings_grouped_list = groupBy(this.settings_list, 'grupo_display');
      this.settings_form = this.settingsToFormGroup();
    })
    .catch(err => {
      console.error(err);
    })
    .finally(() => {
      this.loading = false;
    });
  }

  async getSettings() {
    const response = await this.settingsService.getConfiguracoes().toPromise();
    return response['results'];
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
        nm_filial: unidade_atendimento['nm_filial'],
      };
    });
  }

  async getPostos(contexto, setor_hosp, unidade_atendimento) {
    const response = await this.settingsService
      .getPostos(contexto, setor_hosp, unidade_atendimento)
      .toPromise();
    return response.map(posto => {
      return {
        label: posto['nm_setor'],
        value: posto['cd_setor'],
      };
    });
  }

  loadingPlaceItemsSetores(local, placeItems) {
    const base = local?.base;
    if (base) {
      placeItems.setores_hosp_loading = true;
      this.getSetores(base)
      .then(res => {
        placeItems.setores_hosp = res;
      }).catch(err => {
        placeItems.setores_hosp = [];
        console.error(err);
      }).finally(() => {
        placeItems.setores_hosp_loading = false;
      });
    } else {
      placeItems.setores_hosp = [];
    }
  }

  loadingPlaceItemsUnidades(local, placeItems) {
    const base = local?.base;
    if (base) {
      placeItems.unidades_atendimento_loading = true;
      this.getUnidades(base)
      .then(res => {
        placeItems.unidades_atendimento = res;
      }).catch(err => {
        console.error(err);
        placeItems.unidades_atendimento = [];
      }).finally(() => {
        placeItems.unidades_atendimento_loading = false;
      });
    } else {
      placeItems.unidades_atendimento = [];
    }
  }

  loadingPlaceItemsPostos(local, placeItems) {
    const base = local?.base;
    const setor_hosp = local?.setor_hosp;
    const unidade_atendimento = local?.unidade_atendimento;

    if (base && setor_hosp && unidade_atendimento) {
      placeItems.postos_loading = true;
      this.getPostos(base, setor_hosp.value, unidade_atendimento.value)
      .then(res => {
        placeItems.postos = res;
      }).catch(err => {
        placeItems.postos = [];
        console.error(err);
      }).finally(() => {
        placeItems.postos_loading = false;
      });
    } else {
      placeItems.postos = [];
    }
  }

  settingsToFormGroup() {
    const form_group = {};
    this.settings_list.forEach(setting => {
      form_group[setting.nome] = new FormControl(setting.valor, [
        Validators.required,
        Validators.min(0),
      ]);
    });
    return new FormGroup(form_group);
  }

  initScreenSettingsForm(screenSettings) {
    this.screenSettingsForm = new FormGroup({
      tela_polegadas: new FormControl(screenSettings['tela_polegadas'], [Validators.required]),
      tela_resh: new FormControl(screenSettings['tela_resh'], [Validators.required]),
      tela_resv: new FormControl(screenSettings['tela_resv'], [Validators.required]),
      graf_escala: new FormControl(screenSettings['graf_escala'], [Validators.required]),
    });
  }

  initLocalSettingsForm(locais) {
    this.formPlace1 = new FormGroup({
      base: new FormControl(locais[0]?.base, [Validators.required]),
      setor_hosp: new FormControl(locais[0]?.setor_hosp, [Validators.required]),
      unidade_atendimento: new FormControl(locais[0]?.unidade_atendimento, [Validators.required]),
      posto: new FormControl(locais[0]?.posto, [Validators.required]),
    });

    this.formPlace2 = new FormGroup({
      base: new FormControl(locais[1]?.base, [Validators.required]),
      setor_hosp: new FormControl(locais[1]?.setor_hosp, [Validators.required]),
      unidade_atendimento: new FormControl(locais[1]?.unidade_atendimento, [Validators.required]),
      posto: new FormControl(locais[1]?.posto, [Validators.required]),
    });

    this.formPlace3 = new FormGroup({
      base: new FormControl(locais[2]?.base, [Validators.required]),
      setor_hosp: new FormControl(locais[2]?.setor_hosp, [Validators.required]),
      unidade_atendimento: new FormControl(locais[2]?.unidade_atendimento, [Validators.required]),
      posto: new FormControl(locais[2]?.posto, [Validators.required]),
    });

    this.formPlace4 = new FormGroup({
      base: new FormControl(locais[3]?.base, [Validators.required]),
      setor_hosp: new FormControl(locais[3]?.setor_hosp, [Validators.required]),
      unidade_atendimento: new FormControl(locais[3]?.unidade_atendimento, [Validators.required]),
      posto: new FormControl(locais[3]?.posto, [Validators.required]),
    });

    this.formPlace5 = new FormGroup({
      base: new FormControl(locais[4]?.base, [Validators.required]),
      setor_hosp: new FormControl(locais[4]?.setor_hosp, [Validators.required]),
      unidade_atendimento: new FormControl(locais[4]?.unidade_atendimento, [Validators.required]),
      posto: new FormControl(locais[4]?.posto, [Validators.required]),
    });

    this.createValuesChanges(this.formPlace1, this.placeItems[0]);
    this.createValuesChanges(this.formPlace2, this.placeItems[1]);
    this.createValuesChanges(this.formPlace3, this.placeItems[2]);
    this.createValuesChanges(this.formPlace4, this.placeItems[3]);
    this.createValuesChanges(this.formPlace5, this.placeItems[4]);
  }

  createValuesChanges(form: FormGroup, placeItems) {
    form.get('base').valueChanges.subscribe(async base => {
      form.get('setor_hosp').setValue(null);
      this.loadingPlaceItemsSetores(form.value, placeItems);

      form.get('unidade_atendimento').setValue(null);
      this.loadingPlaceItemsUnidades(form.value, placeItems);
    });

    form.get('setor_hosp').valueChanges.subscribe(setor_hosp => {
      form.get('posto').setValue(null);
      this.loadingPlaceItemsPostos(form.value, placeItems);
    });

    form.get('unidade_atendimento').valueChanges.subscribe(unidade_atendimento => {
      form.get('posto').setValue(null);
      this.loadingPlaceItemsPostos(form.value, placeItems);
    });
  }

  async saveSettingsGeneralTab() {
    const screenSettings = this.screenSettingsForm.value;
    const locais_valid_forms_value = new Set(
      [this.formPlace1, this.formPlace2, this.formPlace3, this.formPlace4, this.formPlace5]
      .filter(formPlace => formPlace.valid)
      .map(formPlace => formPlace.value)
    );
    const arrayCodPostos = Array.from(locais_valid_forms_value).map(local => local.posto.value);

    const hasDuplicates = arrayOcorrencias => {
      return (new Set(arrayOcorrencias)).size !== arrayOcorrencias.length;
    };

    const promiceValidatorPostosIguais = new Promise((resolve, reject) => {
      if (hasDuplicates(arrayCodPostos)) {
        reject('Não é possivel ter postos repetidos');
      }
      resolve(true);
    });

    Promise.all([
      this.localStorage.setOnLocalStorage('screenSettings', screenSettings),
      promiceValidatorPostosIguais,
    ]).then(values => {
      this.localStorage.setOnLocalStorage('locais', Array.from(locais_valid_forms_value))
      .then( _ => this.notificationsService.html('Configurações aplicadas')
      );
    }).catch(err => {
      console.error(err);
      this.notificationsService.html(err, NotificationType.Warn);
    });
  }

  resetSettingsGeneralTab() {
    this.localStorage.getFromLocalStorage('screenSettings').subscribe(screenSettings => {
      this.initScreenSettingsForm(screenSettings);
    });

    this.localStorage.getFromLocalStorage('locais').subscribe(locais => {
      this.initLocalSettingsForm(locais);
    });
  }

  saveSettingsAlertaTab() {
    const alerts_form_value = this.settings_form.value;
    const promises_list = [];

    Object.keys(alerts_form_value).forEach(setting => {
      const initial_setting = this.settings_list.find(item => item.nome === setting);

      if (initial_setting && initial_setting.valor !== alerts_form_value[setting]) {
        promises_list.push(
          this.settingsService
            .patchConfiguracao(initial_setting.nome, { valor: alerts_form_value[setting] })
            .toPromise(),
        );
      }
    });

    if (!promises_list.length) {
      this.notificationsService.html('Não há alterações');
    } else {
      this.loading = true;
      Promise.all(promises_list)
        .then(values => {
          this.notificationsService.html('Configurações aplicadas');
        })
        .catch(error => {
          console.error(error);
          this.notificationsService.html(error);
        })
        .finally(async () => {
          try {
            this.settings_list = await this.getSettings();
          } catch (error) {
            console.error(error);
          }
          this.loading = false;
        });
    }
  }

  async resetSettingsAlertaTab() {
    this.loading = true;

    try {
      this.settings_list = await this.getSettings();
      this.settings_grouped_list = groupBy(this.settings_list, 'grupo_display');
      this.settings_form = this.settingsToFormGroup();
    } catch (error) {
      console.error(error);
    }

    this.loading = false;
  }

  emitSoundAlert() {
    this.audioService.playAlert();
  }

  changeTab(tab) {
    this.tab = tab;
  }

  login() {
    this.authService.login(this.loginForm.getRawValue()).subscribe(
      res => {
        this.authService.setAuthorizationToken(res['token']);
        this.authenticatedUser = res['user'];
        this.loginForm.reset();
      },
      error => {
        if (error.status == 400) {
          this.loginForm.setErrors(error.error['non_field_errors'][0]);
        } else {
          console.log(error);
          this.loginForm.setErrors(['Erro interno da aplicação']);
        }
      },
    );
  }

  logout() {
    this.authService.logout();
    this.authenticatedUser = null;
  }

  async debug_monitoring() {
    this.loading = true;

    this.debug_validations = await this.debugMonitoringService.debug(
      parseInt(this.attendance_code),
    );

    this.loading = false;
  }
}
