import { ActivatedRoute } from '@angular/router';
import { UpdateHeaderService } from './../services/update-header.service';
import { Component, OnInit, OnChanges } from '@angular/core';

@Component({
  selector: 'app-graficos',
  templateUrl: './dashboard-sala-controle.component.html',
  styleUrls: []
})
export class DashboardSalaControleComponent implements OnInit {

  constructor(
    private updateHeaderService: UpdateHeaderService,
    private activateRoute: ActivatedRoute
  ) {

    this.updateHeaderService.updateHeader(); // Envia sinal true para atualizar o header para o dashboard da sala de controle


   }

  ngOnInit(): void {

  }
}
