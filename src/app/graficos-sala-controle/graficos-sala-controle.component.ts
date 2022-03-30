import { ActivatedRoute, Router } from '@angular/router';
import { NotificationsService, NotificationType } from 'angular2-notifications';
import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { RegistroAgendaService } from '../services/registro-agenda.service';
import { TimeService } from '../services/time.service';

@Component({
  selector: 'app-graficos-sala-controle',
  templateUrl: './graficos-sala-controle.component.html',
  styleUrls: ['./graficos-sala-controle.component.scss']
})

export class GraficosSalaControleComponent implements OnInit, OnDestroy {

  totalizadores = []
  totalizadoresGerais = {
    atrasados: 0,
    tolerancia: 0,
    prazo: 0
  }

  filiais = []
  loading = true;
  time = new Date();
  registrosAgendaInterval;
  time_update = 300000; // 5 minutes

  constructor(
    private registoAgendaService: RegistroAgendaService,
    private timeService: TimeService,
    private notifications: NotificationsService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  async ngOnInit() {
    try {
      await this.getFiliais()
      await this.getTotalizadores();

      this.registrosAgendaInterval = setInterval(async () => {
        await this.getFiliais();
        await this.getTotalizadores();

        this.timeService.getServerTime().subscribe(timeFromServer => {
          this.time = new Date(timeFromServer.now);
        });

      }, this.time_update);

      this.loading = false;

    } catch (error) {
      this.loading = false;
      console.log(error);
      this.notifications.html('Erro ao se comunicar com o servidor', NotificationType.Error);

    }

  }
  ngOnDestroy() {
    clearInterval(this.registrosAgendaInterval);
    this.time = null;
  }


  async getFiliais() {
    try {
      this.filiais = await this.registoAgendaService.getCount().toPromise();

    } catch(error) {
      if (error.status == 401) {
        this.router.navigate(['login']);
      }
    }
  }

  getTotalizadores() {
    this.totalizadoresGerais.atrasados = 0;
    this.totalizadoresGerais.tolerancia = 0;
    this.totalizadoresGerais.prazo = 0;

    this.filiais.forEach(filial => {
      this.totalizadoresGerais.atrasados += filial.atrasados;
      this.totalizadoresGerais.tolerancia += filial.tolerancia;
      this.totalizadoresGerais.prazo += filial.prazo;
    });

    this.totalizadores = [
      { description: 'Atrasados', percentage: this.getPorcentagem(this.totalizadoresGerais.atrasados, this.totalizadoresGerais.atrasados), type: 'danger', value: this.totalizadoresGerais.atrasados },
      { description: 'Na tolerância', percentage: this.getPorcentagem(this.totalizadoresGerais.tolerancia, this.totalizadoresGerais.tolerancia) , type: 'warning', value: this.totalizadoresGerais.tolerancia },
      { description: 'No prazo', percentage: this.getPorcentagem(this.totalizadoresGerais.prazo, this.totalizadoresGerais.prazo), type: 'success', value: this.totalizadoresGerais.prazo },
    ]
  }

  getPorcentagem(amostra, total): Number {
    return (amostra / total) * 100;
  }


}



