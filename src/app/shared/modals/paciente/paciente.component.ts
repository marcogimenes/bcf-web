import { Component, OnInit } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-modal-paciente',
  templateUrl: './paciente.component.html'
})
export class PacienteModalComponent implements OnInit {

  patient: any;
  isShown = false;

  constructor(public bsModalRef: BsModalRef, private bsModalService: BsModalService) { }

  ngOnInit() {
    this.bsModalService.onShown.subscribe(reason => {
      this.isShown = true;
    });
  }
}
