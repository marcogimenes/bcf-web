import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { SettingsService } from '../services/settings.service';
import { LocalStorageService } from '../services/local-storage.service';
import { IntegracaoService } from './../services/integracao.service';
import { MonitoramentoService } from './../services/monitoramento.service';
import { NotificationsService, NotificationType } from 'angular2-notifications';

@Component({
  selector: 'app-elegible-list',
  templateUrl: './elegible-list.component.html',
})
export class ElegibleListComponent implements OnInit {
  loading = true;
  finalizarLoading: Array<Boolean> = [];
  // FormGroup Settings
  localSettingsForm: FormGroup;
  // Lists
  elegibleList: any = [];

  bases = [
    { label: 'Base Hapvida', value: 'hap' },
    { label: 'Base PSC', value: 'schosp' },
  ];

  setores_hosp = [];
  setores_hosp_loading = true;

  unidades_atendimento = [];
  unidades_atendimento_loading = true;

  postos = [];
  postos_loading = true;
  searchedPostos = [];


  constructor(
    private localStorage: LocalStorageService,
    private settingsService: SettingsService,
    private integracaoService: IntegracaoService,
    private notificationService: NotificationsService,
    private monitoramentoService: MonitoramentoService
  ) { }

  ngOnInit() {
    this.localStorage.getFromLocalStorage('locais').subscribe(async locais => {
      const [ local ] = locais;
      this.searchedPostos = locais;
      this.initFilterForm(local);
      await this.search(locais);
    });
  }


  async initFilterForm(local) {

    const { base, setor_hosp, unidade_atendimento, posto } = local;

    // Iniciando formulário
    this.localSettingsForm = new FormGroup({
      base: new FormControl(base, [Validators.required]),
      setor_hosp: new FormControl(setor_hosp, [Validators.required]),
      unidade_atendimento: new FormControl(unidade_atendimento, [Validators.required]),
      posto: new FormControl(null, [Validators.required]),
    });

    // Carregando os dados da API
    try {
      this.setores_hosp = await this.getSetores(base);
    } catch (error) {
      this.setores_hosp = [];
      console.error(error);
    }

    try {
      this.unidades_atendimento = await this.getUnidades(base);
    } catch (error) {
      this.unidades_atendimento = [];
      console.error(error);
    }

    try {
      this.postos = await this.getPostos(base, setor_hosp['value'], unidade_atendimento['value']);
    } catch (error) {
      this.postos = [];
      console.error(error);
    }

    // Configurando eventos de mudança de status
    // Caso a Base venha a ser alterada, recarregar os dados de unidade e setor
    this.localSettingsForm.get('base').valueChanges.subscribe(async base => {
      this.localSettingsForm.get('setor_hosp').setValue(null);

      try {
        this.setores_hosp = await this.getSetores(base);
      } catch (error) {
        this.setores_hosp = [];
        console.error(error);
      }

      this.localSettingsForm.get('unidade_atendimento').setValue(null);

      try {
        this.unidades_atendimento = await this.getUnidades(base);
      } catch (error) {
        this.unidades_atendimento = [];
        console.error(error);
      }
    });

    // Caso o setor venha a ser alterado, recarregar os dados relacionados a postos de atendimento
    this.localSettingsForm.get('setor_hosp').valueChanges.subscribe(async setor_hosp => {
      this.localSettingsForm.get('posto').setValue(null);
      const base = this.localSettingsForm.get('base').value;
      const unidade_atendimento = this.localSettingsForm.get('unidade_atendimento').value;

      if (base && setor_hosp?.value && unidade_atendimento) {
        try {
          this.postos = await this.getPostos(base, setor_hosp['value'], unidade_atendimento['value']);
        } catch (error) {
          this.postos = [];
          console.error(error);
        }
      } else {
        this.postos = [];
      }
    });

    // Caso a unidade venha a ser alterada, recarregar os dados relacionados a postos de atendimento
    this.localSettingsForm.get('unidade_atendimento').valueChanges.subscribe(async unidade_atendimento => {
      this.localSettingsForm.get('posto').setValue(null);
      const base = this.localSettingsForm.get('base').value;
      const setor_hosp = this.localSettingsForm.get('setor_hosp').value;

      if (base && setor_hosp && unidade_atendimento?.value) {
        try {
          this.postos = await this.getPostos(base, setor_hosp['value'], unidade_atendimento['value']);
        } catch (error) {
          this.postos = [];
          console.error(error);
        }
      } else {
        this.postos = [];
      }
    });
  }

  addToFilter() {
    if (this.validatePosto(this.localSettingsForm.value, this.searchedPostos)) {
      this.searchedPostos.push(this.localSettingsForm.value);
      this.search(this.searchedPostos);
    } else {
      this.notificationService.html(
        'Selecione Postos Diferentes',
        NotificationType.Warn,
        { timeOut: 2000 }
      );
    }
  }

  deleteFromList(index) {
    this.searchedPostos.splice(index, 1);
    this.search(this.searchedPostos);
  }

  validatePosto(addedForm, form) {
    const newPosto = addedForm.posto.value;
    const postos = form.map(places => places.posto.value);

    if (!postos.includes(newPosto)) {
      return true;
    }
    return false;
  }

  async search(locais) {
    this.elegibleList = [];
    const initPostos = locais.map(place => {
      return place.posto.value;
    });

    const initBases = new Set(locais.map(place => place.base));

    this.loading = true;
    for (const base of initBases) {
      try {
        const result = await this.integracaoService.getGestantesElegiveis(base, {'codigo_posto': initPostos}).toPromise();
        this.elegibleList.push(...result);
      } catch (e) {
        console.error(e);
      }
    }
    this.loading = false;
  }

  async getSetores(contexto) {
    this.setores_hosp_loading = true;
    const response = await this.settingsService.getSetoresHosp(contexto).toPromise();
    this.setores_hosp_loading = false;
    return response.map(setor => {
      return {
        label: setor['nm_setor_hosp'],
        value: setor['cd_setor_hosp'],
      };
    });
  }

  async getUnidades(contexto) {
    this.unidades_atendimento_loading = true;
    const response = await this.settingsService.getUnidades(contexto).toPromise();
    this.unidades_atendimento_loading = false;
    return response.map(unidade_atendimento => {
      return {
        label: unidade_atendimento['nm_unidade_atendimento'],
        value: unidade_atendimento['cd_unidade_atendimento'],
        cd_filial: unidade_atendimento['cd_filial'],
      };
    });
  }

  async getPostos(contexto, setor_hosp, unidade_atendimento) {
    this.postos_loading = true;
    const response = await this.settingsService.getPostos(contexto, setor_hosp, unidade_atendimento).toPromise();
    this.postos_loading = false;
    return response.map(posto => {
      return {
        label: posto['nm_setor'],
        value: posto['cd_setor'],
      };
    });
  }

  async finalizarMonitoramento(id: Number, index): Promise<void> {
    this.finalizarLoading = [];
    try {
      this.finalizarLoading[index] = true;
      const endMonitoramento = await this.monitoramentoService.finalizarMonitoramento(id).toPromise();
      this.finalizarLoading[index] = false;
    } catch (e) {
      this.finalizarLoading[index] = false;
      this.notificationService.html(
        'Falha ao tentar encerrar manualmente o monitoramento',
        NotificationType.Error,
        { timeOut: 2000 }
      );
      console.error(e);
    }
    this.search(this.searchedPostos);
  }
}
