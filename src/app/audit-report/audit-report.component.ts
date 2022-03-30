import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NotificationsService, NotificationType } from 'angular2-notifications';
import { saveAs } from 'file-saver';
import { User } from '../models/user.model';
import { AuthService } from '../services/auth.service';
import { SettingsService } from '../services/settings.service';
import { ReportService } from './../services/report.service';
import { URL_PDF } from './../shared/constants';

@Component({
  selector: 'app-audit-report',
  templateUrl: './audit-report.component.html'
})
export class AuditReportComponent implements OnInit {
  loading = false;

  report_form: FormGroup;

  loading_autenticar = false;
  show_filters = false;

  authenticatedUser: User = null;
  loginForm: FormGroup;

  loading_map = {
    unidades_atendimento: false,
    convenios: false,
  };

  bases = [
    { label: 'Base Hapvida', value: 'hap' },
    { label: 'Base PSC', value: 'schosp' },
  ];

  motivosAtendimento = [
    { label: 'Todos', value: '' },
    { label: 'Emergência', value: '1' },
    { label: 'Eletivo', value: '2' },
  ];

  monitoramentos_zerados_items = [
    { label: 'Ignorar', value: 'IGNORAR' },
    { label: 'Todos', value: 'TODOS' },
    { label: 'Somente', value: 'SOMENTE' },
  ];

  defaultListZerados = [];

  unidades_atendimento = [];
  convenios = [];

  auditList = [
    { label: 'Monitoramentos e condutas', value: 'MONITORAMENTOS' },
    { label: 'Percentual de partos monitorados (%)', value: 'ACOMPANHAMENTOS_GRAFICO' },
    { label: 'Partos monitorados (analítico)', value: 'PARTOS' },
    { label: 'Gestantes elegíveis não monitoradas', value: 'ELEGIVEIS' },
    { label: 'Tabela de partos monitorados', value: 'ACOMPANHAMENTOS_TABELA' },
    { label: 'Tabela de partos monitorados/Assiduidade', value: 'ACOMPANHAMENTOS_TABELA_ASSIDUIDADE' },
    { label: 'Planilha de Partos Monitorados/Assiduidade', value: 'TABELA_PARTOS_CSV' }

  ];

  auditType = 'MONITORAMENTOS';

  constructor(
    private settingsService: SettingsService,
    private reportService: ReportService,
    private notificationService: NotificationsService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.initFilterForm();

    this.defaultListZerados = this.monitoramentos_zerados_items;

    // Iniciando form group de login
    this.loginForm = new FormGroup({
      username: new FormControl(null, Validators.required),
      password: new FormControl(null, Validators.required)
    });

    // Verificando se o usuário já está logado
    if (this.authService.isLoggedIn()) {
      this.loading_autenticar = true;
      this.authService.user().subscribe(res => {
        this.authenticatedUser = res['user'];
        this.loading_autenticar = false;
        this.show_filters = true;

      });
    }
  }

  initFilterForm() {
    // Inicializando intervalo do range para dia anterior
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Iniciando formulário
    this.report_form = new FormGroup({
      date_range: new FormControl(
        [yesterday, yesterday],
        [Validators.required, this.dateRangeValidator]
      ),
      base: new FormControl(this.bases[0].value, [Validators.nullValidator]),
      motivoAtendimento: new FormControl(this.motivosAtendimento[0].value, [Validators.nullValidator]),
      monitoramento_zerado: new FormControl(this.monitoramentos_zerados_items[0].value, [Validators.nullValidator]),
      unidade_atendimento: new FormControl(null, [Validators.nullValidator]),
      convenio: new FormControl(null, [Validators.nullValidator]),
      codigo_carteira: new FormControl(null, [Validators.nullValidator]),
      nome_paciente: new FormControl(null, [Validators.nullValidator])
    });

    const { base } = this.report_form.getRawValue();

    // Carregando os dados da API
    this.loading_map['unidades_atendimento'] = true;
    this.getUnidades(base).then(unidades_atendimento => {
      this.unidades_atendimento = unidades_atendimento;
    }).catch(err => {
      console.error(err);
      this.unidades_atendimento = [];
    }).finally(() => this.loading_map['unidades_atendimento'] = false);

    this.report_form.get('base').valueChanges.subscribe(base => {
      this.report_form.get('unidade_atendimento').setValue(null);
      this.report_form.get('convenio').setValue(null);

      this.loading_map['unidades_atendimento'] = true;
      this.getUnidades(base).then(unidades_atendimento => {
        this.unidades_atendimento = unidades_atendimento;
      }).catch(err => {
        console.error(err);
        this.unidades_atendimento = [];
      }).finally(() => this.loading_map['unidades_atendimento'] = false);
    });

    this.report_form.get('unidade_atendimento').valueChanges.subscribe(unidade_atendimento => {
      if (unidade_atendimento) {
        const { base } = this.report_form.getRawValue();

        this.loading_map['convenios'] = true;
        this.getConvenios(base, unidade_atendimento.value).then(convenios => {
          this.convenios = convenios;
        }).catch(err => {
          console.error(err);
          this.convenios = [];
        }).finally(() => this.loading_map['convenios'] = false);
      } else {
        this.report_form.get('convenio').setValue(null);
        this.convenios = [];
      }
    });
  }

  async getUnidades(contexto) {
    const response = await this.settingsService
      .getUnidades(contexto)
      .toPromise();
    return response.map(unidade_atendimento => {
      return {
        label: unidade_atendimento['nm_unidade_atendimento'],
        value: unidade_atendimento['cd_unidade_atendimento'],
        cd_filial: unidade_atendimento['cd_filial']
      };
    });
  }

  async getConvenios(contexto, codigo_unidade_atendimento) {
    const response = await this.settingsService
      .getConvenios(contexto, codigo_unidade_atendimento)
      .toPromise();
    return response.map(convenio => {
      return {
        label: convenio['nm_fantasia'],
        value: convenio['cd_convenio']
      };
    });
  }

  onChangeAuditType() {
    // Seta o valor default IGNORAR ao alterar o auditType
    this.report_form.get('monitoramento_zerado').setValue('IGNORAR');
    // Remove os item SOMENTE do filtro zerados se caso a clausula seja verdadeira, senao retorna ao default
    if (this.auditType === 'ACOMPANHAMENTOS_TABELA' || this.auditType === 'ACOMPANHAMENTOS_GRAFICO' || this.auditType === 'ACOMPANHAMENTOS_TABELA_ASSIDUIDADE' || this.auditType == 'TABELA_PARTOS_CSV') {
      this.monitoramentos_zerados_items = this.monitoramentos_zerados_items.filter(monitor => {
        return monitor.value !== 'SOMENTE';
      });

    } else {
      this.monitoramentos_zerados_items = this.defaultListZerados;
    }
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

  generatePdf() {
    const {
      date_range,
      unidade_atendimento,
      convenio,
      motivoAtendimento,
      codigo_carteira,
      nome_paciente,
      monitoramento_zerado,
    } = this.report_form.value;
    const date_after = this.dateFormat(date_range[0]);
    const date_before = this.dateFormat(date_range[1]);

    const params = {
      date_after: date_after,
      date_before: date_before
    };

    if (unidade_atendimento) {
      params['codigo_filial'] = unidade_atendimento.cd_filial;
    }

    if (convenio && this.auditType === 'MONITORAMENTOS') {
      params['codigo_convenio'] = convenio.value;
    }

    if (motivoAtendimento && (this.auditType === 'PARTOS' || this.auditType === 'ACOMPANHAMENTOS_GRAFICO'
      || this.auditType === 'ACOMPANHAMENTOS_TABELA' || this.auditType === 'ELEGIVEIS' || this.auditType === 'ACOMPANHAMENTOS_TABELA_ASSIDUIDADE' || this.auditType == 'TABELA_PARTOS_CSV')) {
      params['motivo_atendimento'] = motivoAtendimento;
    }

    if (codigo_carteira && (this.auditType === 'PARTOS' || this.auditType === 'ELEGIVEIS')) {
      params['codigo_carteira'] = codigo_carteira;
    }

    if (nome_paciente && (this.auditType === 'PARTOS' || this.auditType === 'ELEGIVEIS')) {
      params['nome_paciente'] = nome_paciente;
    }

    if (this.auditType === 'ACOMPANHAMENTOS_TABELA') {
      params['tipo'] = 'tabela';
    }

    if (this.auditType === 'ACOMPANHAMENTOS_TABELA_ASSIDUIDADE') {
      params['tipo'] = 'assiduidade';
    }

    if (this.auditType === 'TABELA_PARTOS_CSV') {
      params['tipo'] = 'tabela_partos_excel';
    }

    if (this.auditType === 'MONITORAMENTOS' || this.auditType === 'PARTOS'
      || this.auditType === 'ACOMPANHAMENTOS_TABELA' || this.auditType === 'ACOMPANHAMENTOS_GRAFICO' || this.auditType === 'ACOMPANHAMENTOS_TABELA_ASSIDUIDADE' || this.auditType == 'TABELA_PARTOS_CSV') {

      params['zerados'] = monitoramento_zerado;
    }

    this.loading = true;


    this.reportService
      .generateReportPDF(URL_PDF[this.auditType], params)
      .subscribe(
        blob => {
          this.loading = false;
          const filial_file_name = params['codigo_filial']
            ? `${unidade_atendimento['label']}-`
            : 'TODAS UNIDADES - ';
          const date_file_name =
            date_after === date_before
              ? date_after
              : `${date_after} - ${date_before}`;
          if (this.auditType === 'TABELA_PARTOS_CSV') {
            saveAs(
              blob,
              `${filial_file_name}RELATORIO ${this.auditType} [${date_file_name}].xlsx`
            );
          } else {
            saveAs(
              blob,
              `${filial_file_name}RELATORIO ${this.auditType} [${date_file_name}].pdf`
            );
          }
        },
        error => {
          this.loading = false;
          this.notificationService.html(
            error.error?.detail || 'Erro ao gerar relatório',
            NotificationType.Error,
            { timeOut: 2000 }
          );
        }
      );
  }

  login() {
    this.loading_autenticar = true;
    this.authService.login(this.loginForm.getRawValue()).subscribe(
      res => {
        this.authService.setAuthorizationToken(res['token']);
        this.authenticatedUser = res['user'];
        this.loginForm.reset();
        this.loading_autenticar = false;
        this.show_filters = true;
      },
      error => {
        if (error.status === 400) {
          this.loginForm.setErrors(error.error['non_field_errors'][0]);
        } else {
          console.log(error);
          this.loginForm.setErrors(['Erro interno da aplicação']);
        }
        this.loading_autenticar = false;
        this.show_filters = false;
      }
    );
  }

  logout() {
    this.authService.logout();
    this.authenticatedUser = null;
    this.show_filters = false;
  }
}
