import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-loading-sala-controle',
  templateUrl: './loading-sala-controle.component.html',
})
export class LoadingSalaControleComponent implements OnInit {

  constructor() { }

  @Input() descricao: String;

  ngOnInit() {
  }

}
