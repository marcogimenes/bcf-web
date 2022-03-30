import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { LocalStorageService } from '../services/local-storage.service';
import { IntegracaoService } from '../services/integracao.service';

import {
  HAPVIDA_STATUS_RETORNO_PACIENTE_FOUND,
  HAPVIDA_STATUS_RETORNO_PACIENTE_NOT_FOUND,
  HAPVIDA_STATUS_RETORNO_PACIENTE_NOT_VALID,
} from '../shared/constants';

@Component({
  selector: 'app-attendance-status',
  templateUrl: './attendance-status.component.html'
})
export class AttendanceStatusComponent implements OnInit {
  consult_form: FormGroup;

  places = [];
  bases = [
    { label: 'Hapvida', value: 'hap' },
    { label: 'PSC', value: 'schosp' },
  ];

  errorCodigoInvalido = false;
  errorPacienteNaoAlocado = false;
  errorDashNaoParametrizado = false;

  errorMessage = '';
  successMessage = '';

  loading = false;

  constructor(
    private localStorage: LocalStorageService,
    private integracaoService: IntegracaoService,
  ) { }

  ngOnInit(): void {
    this.localStorage.getFromLocalStorage('locais').subscribe(locais => {
      const [ local ] = locais;
      this.places = locais;
      this.initForm(local);
    });
  }

  initForm({ base }) {
    this.consult_form = new FormGroup({
      base: new FormControl(base, [Validators.required]),
      attendance_code: new FormControl(null, [Validators.required])
    });
  }

  async consultar() {
    this.errorCodigoInvalido = false;
    this.errorDashNaoParametrizado = false;
    this.errorPacienteNaoAlocado = false;
    this.errorMessage = '';
    this.successMessage = '';

    const { base, attendance_code } = this.consult_form.value;

    this.loading = true;
    try {
      const hapvidaResult = await this.integracaoService.getAtendimento(base, attendance_code).toPromise();
      const atendimento = hapvidaResult[0];

      if (atendimento.cd_status_retorno === HAPVIDA_STATUS_RETORNO_PACIENTE_NOT_FOUND || atendimento.cd_sexo === 'M') {
        this.errorCodigoInvalido = true;
        this.errorMessage = 'O código digitado é inválido. Por favor, verifique o código de atendimento da gestante corretamente, e certifique-se que a base está correta';
      } else if (atendimento.cd_status_retorno === HAPVIDA_STATUS_RETORNO_PACIENTE_NOT_VALID) {
        this.errorPacienteNaoAlocado = true;
        this.errorMessage = `A gestante <b>${atendimento.nm_paciente}</b> encontra-se sem alocação. Por favor, aloque-a antes de começar um monitoramento`;
      } else if (atendimento.cd_status_retorno === HAPVIDA_STATUS_RETORNO_PACIENTE_FOUND
        && !this.searchInDash(atendimento.cd_posto)) {
            this.errorDashNaoParametrizado = true;
            this.errorMessage = `
            Para o monitoramento da gestante <b>${atendimento.nm_paciente}</b> ser registrado e exibido no dashboard (TV) é necessário que esteja alocada em um dos postos abaixo:
            <ul> ${this.placesString()} </ul>
            `;
      } else {
        this.successMessage = `A gestante <b>${atendimento.nm_paciente}</b> está apta a ser monitorada`;
      }
    } catch (error) {
      console.error('Error Api Hapvida');
    }

    this.loading = false;
  }

  searchInDash(cdPosto) {
    const search = this.places.filter(place => place['posto'].value === cdPosto);
    if (search.length === 0) {
      return false;
    }
    return true;
  }

  placesString() {
    let placeString = '';
    this.places.forEach((place) => {
      let baseString = `
        <li>
        <b>Base</b>: ${place['base'] === 'hap' ? 'HAPVIDA' : 'SCHOSP'} <br>
        <b>Unidade</b>: ${place['unidade_atendimento'].label} <br>
        <b>Posto</b>: ${place['posto'].label} <br>
        </li>
        <br>
      `;
      placeString += baseString;
    });

    return placeString;
  }
}
