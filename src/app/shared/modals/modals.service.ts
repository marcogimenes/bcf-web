import { Injectable } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { PacienteModalComponent } from './paciente/paciente.component';
import { CondutaAlertaComponent } from './conduta-alerta/conduta-alerta.component';

@Injectable()
export class ModalsService {

  constructor(private modalService: BsModalService) {}

  openPatientModal(patient) {
    const initialState = {
      patient
    };
    this.modalService.show(PacienteModalComponent, {initialState, ...{ class: 'modal-xl' }});
  }

  openCondutaAlertaModal(periodoAlerta) {
    const initialState = {
      periodoAlerta
    };
    this.modalService.show(CondutaAlertaComponent, {
      initialState, ...{class: 'modal-xl'}
    });
  }

}
