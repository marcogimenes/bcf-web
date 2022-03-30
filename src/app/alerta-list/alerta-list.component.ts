import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { BsModalRef } from 'ngx-bootstrap/modal/public_api';
import { SettingsService } from '../services/settings.service';
import { LocalStorageService } from '../services/local-storage.service';
import { ModalsService } from '../shared/modals/modals.service';
import { PeriodosAlertasService } from '../services/periodos-alertas.service';

@Component({
  selector: 'app-alerta-list',
  templateUrl: './alerta-list.component.html'
})
export class AlertaListComponent implements OnInit {
  loading = true;
  tab = 'pendentes';

  // Modal
  active_modal: BsModalRef;
  // Pagination
  current_page: Number = 1;
  page_size: Number = 20;
  // FormGroup Settings
  local_settings_form: FormGroup;
  // Lists
  periodosAlerta: any = [];

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

  constructor(
    private periodoAlertaService: PeriodosAlertasService,
    private localStorage: LocalStorageService,
    private settingsService: SettingsService,
    private modalService: ModalsService
  ) { }

  ngOnInit() {
    // Local storage com os settings de localização dos monitoramentos
    this.localStorage.getFromLocalStorage('locais').subscribe(locais => {
      const [local] = locais;
      // Carregando os dados dos filtros
      this.initFilterForm(local);
      this.filtrarPeriodosAlerta();

      this.periodoAlertaService.reloadPeriodosAlertaSubject.subscribe(
        next => {
          this.filtrarPeriodosAlerta();
        }
      );
    });
  }

  async loadPeriodosAlerta(filters: any) {
    this.loading = true;
    try {
      const response = await this.periodoAlertaService.getPeriodosAlertas(filters).toPromise();
      this.periodosAlerta = response;
      this.loading = false;
    } catch (error) {
      console.error(error);
    }
  }

  filtrarPeriodosAlerta(filtros = {}) {
    if (Object.keys(filtros).length) {
      this.loadPeriodosAlerta(filtros);
    } else {
      const { base, unidade_atendimento, posto } = this.local_settings_form.getRawValue();
      const filters = {
        'page': this.current_page,
        'page_size': this.page_size,
        'contexto': base,
        'codigo_posto': posto ? posto['value'] : '',
        'codigo_unidade': unidade_atendimento ? unidade_atendimento['cd_filial'] : '',
        'pendente': this.tab === 'pendentes',
        'ordering': '-data_inicio',
      };

      this.loadPeriodosAlerta(filters);
    }
  }

  pageChanged(event) {
    if (
      (this.current_page > event.page) ||
      (this.current_page < event.page)
    ) {
      this.current_page = event.page;
      this.filtrarPeriodosAlerta();
    }
  }

  async initFilterForm(local) {
    const { base, setor_hosp, unidade_atendimento } = local;

    // Iniciando formulário
    this.local_settings_form = new FormGroup({
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
    this.local_settings_form.get('base').valueChanges.subscribe(async base => {
      this.local_settings_form.get('setor_hosp').setValue(null);

      try {
        this.setores_hosp = await this.getSetores(base);
      } catch (error) {
        this.setores_hosp = [];
        console.error(error);
      }

      this.local_settings_form.get('unidade_atendimento').setValue(null);

      try {
        this.unidades_atendimento = await this.getUnidades(base);
      } catch (error) {
        this.unidades_atendimento = [];
        console.error(error);
      }
    });

    // Caso o setor venha a ser alterado
    this.local_settings_form.get('setor_hosp').valueChanges.subscribe(setor_hosp => {
      this.local_settings_form.get('posto').setValue(null);
    });

    // Caso a unidade venha a ser alterada, recarregar os dados relacionados a postos de atendimento
    this.local_settings_form.get('unidade_atendimento').valueChanges.subscribe(unidade_atendimento => {
      this.local_settings_form.get('posto').setValue(null);
    });

    this.local_settings_form.get('posto').valueChanges.subscribe(async posto => {
      const base = this.local_settings_form.get('base').value;
      const setor_hosp = this.local_settings_form.get('setor_hosp').value;
      const unidade_atendimento = this.local_settings_form.get('unidade_atendimento').value;

      if (!setor_hosp || !unidade_atendimento) {
        this.postos = [];
      } else if (!posto) {
        try {
          this.postos = await this.getPostos(base, setor_hosp['value'], unidade_atendimento['value']);
        } catch (error) {
          this.postos = [];
          console.error(error);
        }
      }
    });
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

  changeTab(tab) {
    this.current_page = 1;
    this.tab = tab;

    this.filtrarPeriodosAlerta();
  }

  performFilter() {
    this.current_page = 1;
    this.filtrarPeriodosAlerta();
  }

  openCondutaAlertaModal(periodoAlerta) {
    this.modalService.openCondutaAlertaModal(periodoAlerta);
  }

}
