import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Subject, Observable } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { PatientService } from '../services/patient.service';
import { ModalsService } from '../shared/modals/modals.service';
import { LocalStorageService } from '../services/local-storage.service';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-patient-list',
  templateUrl: './patient-list.component.html'
})
export class PatientListComponent implements OnInit {

  buscaPacienteInput: String;
  loading = true;

  searchTerm$ = new Subject<string>();
  pacientes_filter: any = {};
  // Modal
  active_modal: BsModalRef;
  // Pagination
  current_page: Number = 1;
  page_size: Number = 20;
  // FormGroup Settings
  local_settings_form: FormGroup;
  // Lists
  patient_list: any = [];

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
    private patientService: PatientService,
    public modalsService: ModalsService,
    private localStorage: LocalStorageService,
    private settingsService: SettingsService
  ) {
    this.search(this.searchTerm$).subscribe(response => {
      this.patient_list = response;
      this.loading = false;
    }, error => this.loading = false);
  }

  ngOnInit() {
    // Local storage com os settings de localização dos monitoramentos
    this.localStorage.getFromLocalStorage('locais').subscribe(locais => {
      const [ local ] = locais;
      const { base, unidade_atendimento } = local;

      this.filtraPacientes({
        'page': this.current_page,
        'page_size': this.page_size,
        'contexto': base,
        'codigo_posto': '',
        'codigo_unidade': unidade_atendimento ? unidade_atendimento['cd_filial'] : ''
      });

      // Carregando os dados dos filtros
      this.initFilterForm(local);
    });
  }

  async loadPacientes() {
    try {
      const response = await this.patientService.getPacientes().toPromise();
      this.patient_list = response;
      this.loading = false;
    } catch (error) {
      this.loading = false;
      console.error(error);
    }
  }

  filtraPacientes(filtros = {}) {
    this.pacientes_filter = { ...this.pacientes_filter, ...filtros };
    this.searchTerm$.next(this.pacientes_filter);
  }

  search(terms: Observable<string>) {
    return terms.pipe(
      debounceTime(400),
      switchMap(term => this.searchPacientes(term))
    );
  }

  searchPacientes(term) {
    this.loading = true;
    return this.patientService.getPacientes({...term});
  }

  clearPacienteName(event: any) {
    this.buscaPacienteInput = '';
  }

  pageChanged(event) {
    if (
      (this.current_page > event.page) ||
      (this.current_page < event.page)
    ) {
      this.current_page = event.page;
      this.filtrar(this.current_page);
    }
  }

  initFilterForm(local) {
    const { base, setor_hosp, unidade_atendimento } = local;
    // Iniciando formulário
    this.local_settings_form = new FormGroup({
      base: new FormControl(base, [Validators.required]),
      setor_hosp: new FormControl(setor_hosp, [Validators.required]),
      unidade_atendimento: new FormControl(unidade_atendimento, [Validators.required]),
      posto: new FormControl(null, [Validators.required]),
    });

    // Carregando os dados da API
    this.loadPlaceItemsSetores(local);
    this.loadPlaceItemsUnidades(local);
    this.loadPlaceItemsPostos(local);

    // Configurando eventos de mudança de status
    // Caso a Base venha a ser alterada, recarregar os dados de unidade e setor
    this.local_settings_form.get('base').valueChanges.subscribe(base => {
      this.local_settings_form.get('setor_hosp').setValue(null);
      this.loadPlaceItemsSetores(this.local_settings_form.value);

      this.local_settings_form.get('unidade_atendimento').setValue(null);
      this.loadPlaceItemsUnidades(this.local_settings_form.value);
    });

    // Caso o setor venha a ser alterado
    this.local_settings_form.get('setor_hosp').valueChanges.subscribe(setor_hosp => {
      this.local_settings_form.get('posto').setValue(null);
      this.loadPlaceItemsPostos(this.local_settings_form.value);
    });

    // Caso a unidade venha a ser alterada, recarregar os dados relacionados a postos de atendimento
    this.local_settings_form.get('unidade_atendimento').valueChanges.subscribe(unidade_atendimento => {
      this.local_settings_form.get('posto').setValue(null);
      this.loadPlaceItemsPostos(this.local_settings_form.value);
    });
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

  // Filtrar os pacientes
  filtrar(page_number?) {
    if (!page_number) {
      this.current_page = 1;
    }

    const{base, unidade_atendimento, posto} = this.local_settings_form.getRawValue();
    this.filtraPacientes({
      'q': this.buscaPacienteInput || '',
      'page': this.current_page,
      'page_size': this.page_size,
      'contexto': base,
      'codigo_posto': posto ? posto['value'] : '',
      'codigo_unidade': unidade_atendimento ? unidade_atendimento['cd_filial'] : ''
    });
  }
}
