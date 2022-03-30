import { Location } from '@angular/common';
import { TimeService } from './../services/time.service';
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { SettingsService } from '../services/settings.service';
import { RegistroAgendaService } from '../services/registro-agenda.service';
import { NotificationsService, NotificationType } from 'angular2-notifications';
import { ActivatedRoute, Router } from '@angular/router';
import { howLong, statusAgenda } from '../shared/utils';

@Component({
  selector: 'app-detalhe-dashboard',
  templateUrl: './detalhe-dashboard.component.html'
})
export class DetalheDashboardComponent implements OnInit {
  loading = false;
  spinnerLoading = false;
  localSettingsForm: FormGroup;
  bases = [
    { label: 'Todas as Bases', value: '' },
    { label: 'Base Hapvida', value: 'hap' },
    { label: 'Base PSC', value: 'schosp' },
  ];

  setores_hosp = [{ label: 'Todas os Setores', value: ''} ];
  setores_hosp_loading = false;

  unidades_atendimento = [{value: '', cd_filial: '', label: 'Todas as Unidades'}];
  unidades_atendimento_loading = false;

  postos = [{value: '', label: 'Todas os Postos'}];
  postos_loading = false;

  registrosAgenda = [];

  current_page = 1;
  page_size: Number = 25;

  time = new Date();
  totalRegistros;
  codigoFilial;
  codigoSetor;

  constructor(
    private settingsService: SettingsService,
    private registroAgendaService: RegistroAgendaService,
    private timeService: TimeService,
    private notificationService: NotificationsService,
    private activatedRouter: ActivatedRoute,
    private location: Location,
    private router: Router,
  ) { }

  async ngOnInit() {
    this.activatedRouter.queryParams.subscribe((data) => {
      if (Object.keys(data).length > 0) {
      this.codigoFilial = data.codigo_filial;
     }
    });

    this.loading = true;
    this.initFilterForm();

    await this.getRegistroAgendaList();
    this.loading = false;
  }

  async initFilterForm() {

    // Iniciando formulário
    this.localSettingsForm = new FormGroup({
      base: new FormControl(this.bases[0], [Validators.required]),
      setor_hosp: new FormControl(this.setores_hosp[0], [Validators.required]),
      unidade_atendimento: new FormControl(this.unidades_atendimento[0], [Validators.required]),
      posto: new FormControl(this.postos[0], [Validators.required]),
    });

    // Configurando eventos de mudança de status
    // Caso a Base venha a ser alterada, recarregar os dados de unidade e setor
    this.localSettingsForm.get('base').valueChanges.subscribe(async base => {
      this.localSettingsForm.get('setor_hosp').setValue(null);

      try {
        this.setores_hosp = [{ label: 'Todas os Setores', value: ''}];
        if (base.value) {
          this.setores_hosp = [...this.setores_hosp, ...await this.getSetores(base.value)];
        }

      } catch (error) {
        this.setores_hosp = [{ label: 'Todas os Setores', value: ''}];
        console.error(error);
      }

      this.localSettingsForm.get('unidade_atendimento').setValue(null);

      try {
        this.unidades_atendimento = [{ label: 'Todos as Unidades', value: '', cd_filial: ''}];
        if (base.value) {
          this.unidades_atendimento = [ {value: '', label: 'Todas as Unidades'} , ...await this.getUnidades(base.value)];
        }
      } catch (error) {
        this.unidades_atendimento = [{ label: 'Todos as Unidades', cd_filial: '', value: '' }];
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
          this.postos = [{value: '', label: 'Todos os Postos'}];

          if (base.value && unidade_atendimento.value) {
            this.postos = [...this.postos, ...await this.getPostos(base.value, setor_hosp['value'], unidade_atendimento['value'])];
          }
        } catch (error) {
          this.postos = [{value: '', label: 'Todos os Postos'}];
          console.error(error);
        }
      } else {
        this.postos = [{value: '', label: 'Todos os Postos'}];
      }
    });

    // Caso a unidade venha a ser alterada, recarregar os dados relacionados a postos de atendimento
    this.localSettingsForm.get('unidade_atendimento').valueChanges.subscribe(async unidade_atendimento => {
      this.localSettingsForm.get('posto').setValue(null);
      const base = this.localSettingsForm.get('base').value.value;

      const setor_hosp = this.localSettingsForm.get('setor_hosp').value;

      if (base && setor_hosp && unidade_atendimento?.value) {
        try {
          this.postos = [{value: '', label: 'Todos os Postos'}];
          this.postos = [{ value: '', label: 'Todos os Postos' }, ...await this.getPostos(base, setor_hosp['value'], unidade_atendimento['value'])];
        } catch (error) {
          this.postos = [{value: '', label: 'Todos os Postos'}];
          console.error(error);
        }
      } else {
        this.postos = [{value: '', label: 'Todos os Postos'}];
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

  async getRegistroAgendaList() {
    this.registrosAgenda = [...this.registrosAgenda];
    const { unidade_atendimento, posto, setor_hosp } = this.localSettingsForm.getRawValue();

    this.codigoSetor = setor_hosp?.value ? setor_hosp?.value : '';
    this.codigoFilial = unidade_atendimento ? unidade_atendimento['cd_filial'] ? unidade_atendimento['cd_filial'] : this.codigoFilial : '';

    const params = {
      'from': 'control_room',
      'page': this.current_page,
      'codigo_posto': posto ? posto['value'] : '',
      'codigo_filial': this.codigoFilial ? this.codigoFilial : '',
      'codigo_setor': this.codigoSetor,
      'page_size': this.page_size,
      'ordering': 'data_prevista_inicio',
      'monitoramento_linked': false,
    };
    try {
      this.timeService.getServerTime().subscribe(timeFromServer => {
        this.time = new Date(timeFromServer.now);
      });

      const response = await this.registroAgendaService.getRegistroAgenda(params).toPromise();
      this.totalRegistros = response.count;
      const registroStatus = response.results.map(registro => {
        if (registro['data_prevista_inicio']) {
          registro['data_prevista_inicio'] = new Date(registro['data_prevista_inicio']);
        }
        return statusAgenda(registro, this.time);
      });
      this.registrosAgenda = [ ...this.registrosAgenda, ...registroStatus];

      this.registrosAgenda.sort((a, b) => {
        if (a?.status == 'late' && b?.status == 'on-tolerance') {
          return -1;
        }
        if (a?.status == 'on-tolerance' && b?.status == 'on-time') {
          return -1;
        }

        return 0;

      });

    } catch (e) {
      this.loading = false;
      this.notificationService.html(
        'Falha ao tentar buscar monitoramentos agendados',
        NotificationType.Error,
        { timeOut: 2000 }
      );
      this.router.navigate(['login']);
      console.error(e);
    }
  }


  timer(registro) {
    return howLong(registro, this.time);
  }

  getSetorCod(registro) {
    const mapSetor = {
      I: 'INT.',
      E: 'EMG.',
      C: 'CIR.'
    };

    return registro?.codigo_setor ? mapSetor[registro.codigo_setor] : '-';

  }

  async filtrar() {
    this.loading = true;
    this.current_page = 1;
    this.registrosAgenda = [];
    this.location.replaceState('dashboard/detalhes'); // Limpa as queryParams da url ao fazer um filtro
    this.codigoFilial = '';
    await this.getRegistroAgendaList();
    this.loading = false;
  }

  async onScroll() {
    if (this.registrosAgenda.length < this.totalRegistros) {
        this.spinnerLoading = true;
        this.current_page += 1;
        await this.getRegistroAgendaList();
        this.spinnerLoading = false;
    }
  }

  async update() {
    this.loading = true;
    this.registrosAgenda = [];
    this.current_page = 1;
    await this.getRegistroAgendaList();
    this.loading = false;
  }
}
