import { Component, OnInit, NgZone, ViewChild, ElementRef } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { BiometriaService } from 'src/app/services/biometria.service';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { FormBuilder, FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { PeriodosAlertasService } from 'src/app/services/periodos-alertas.service';

import { NotificationsService, NotificationType } from 'angular2-notifications';
import { TipoCondutaService } from 'src/app/services/tipo-conduta.service';

@Component({
  selector: 'app-conduta-alerta',
  templateUrl: './conduta-alerta.component.html',
  styleUrls: ['./conduta-alerta.component.scss']
})
export class CondutaAlertaComponent implements OnInit {
  periodoAlerta: any;
  isShown = false;
  loading = false;

  profissionalSelected: any;
  profissionalOptions: any;
  profissionalDisplay: any = '';

  capturaBiometrica = '';

  biometriaError: string;

  condutaFormGroup: FormGroup;

  biometriaLoaded = false;
  textoOutroError = false;

  selectedChoies = [];

  cdChoicesCheckedPeriodoAlerta = [];

  @ViewChild('textarea', { static: false }) textarea: ElementRef;

  choices: any;

  constructor(public bsModalRef: BsModalRef,
    private bsModalService: BsModalService,
    private biometriaService: BiometriaService,
    private angularZone: NgZone,
    private periodoAlertaService: PeriodosAlertasService,
    private notificationService: NotificationsService,
    private formBuider: FormBuilder,
    private tipoService: TipoCondutaService) {

    this.profissionalOptions = Observable.create((observer: any) => {
      observer.next(this.profissionalDisplay);
    })
      .pipe(
        mergeMap(i => this.biometriaService.getProfissional(this.profissionalDisplay, this.periodoAlerta.monitoramento.contexto))
      );
  }

  async ngOnInit() {

    this.choices = await this.tipoService.getTipoConduta().toPromise();
    this.choices.results = [...this.choices.results, { codigo_conduta: 'outro', descricao: 'Outro' }];

    this.condutaFormGroup = this.formBuider.group({
      texto_outro: new FormControl(null),
      login_profissional: new FormControl(this.periodoAlerta.login_profissional, Validators.required),
      nome_profissional: new FormControl(this.periodoAlerta.nome_profissional, Validators.required),
      crm_profissional: new FormControl(this.periodoAlerta.crm_profissional, Validators.required),
      token: new FormControl(null, Validators.required),
      biometria_base64: new FormControl(null, Validators.required),
      tipo_conduta: this.buildChoices()
    });

    this.bsModalService.onShown.subscribe(reason => {
      this.isShown = true;
    });
    this.textoOutroChange();
    this.tipoCondutaChange();
  }

  textoOutroChange() {
    this.condutaFormGroup.get('texto_outro').valueChanges.subscribe(texto => {
      if (this.textoOutroError) {
        this.textoOutroError = false;
      }
    });
  }

  tipoCondutaChange() {
    this.condutaFormGroup.get('tipo_conduta').valueChanges.subscribe(tipos => {
      if (!this.selectedChoies.includes('outro')) {
        this.condutaFormGroup.get('texto_outro').setValue(null);
      }
    });
  }

  buildChoices() {
    let values = [];
    if (this.periodoAlerta.tipo_conduta.length > 0 || this.periodoAlerta.texto_outro) {
      const cdChoices = this.choices.results.map(choice => choice.codigo_conduta);
      this.cdChoicesCheckedPeriodoAlerta = this.periodoAlerta.tipo_conduta.map(choice => choice.codigo_conduta);

      values = cdChoices.map(choice => {
        if (this.cdChoicesCheckedPeriodoAlerta.includes(choice)) {
          return new FormControl(true);
        } else if (this.periodoAlerta.texto_outro && choice === 'outro') {
          return new FormControl(true);
        } else {
          return new FormControl(false);
        }
      });

    } else {
      values = this.choices.results.map(value => new FormControl(false));
    }

    return this.formBuider.array(values, this.validateCheckBoxMin());
  }

  validateCheckBoxMin(minimum = 1) {
    const validator = (formArray: FormArray) => {
      const totalChecked = formArray.controls
        .map(v => v.value)
        .reduce((total, current) => current ? total + current : total, 0);
      return totalChecked >= minimum ? null : { required: true };
    };
    return validator;
  }

  typeaheadProfissionalOnSelect(event) {
    this.profissionalSelected = event.item;
    this.loading = true;
  }

  clearProfissionalName(event) {
    this.profissionalDisplay = '';
    this.profissionalSelected = null;
    this.capturaBiometrica = null;
    this.biometriaError = null;
    this.biometriaLoaded = false;

    this.condutaFormGroup.reset();
  }

  onBiometriaLoading(event) {
    this.angularZone.run(() => {
      this.loading = true;
    });
  }

  onBiometriaLoaded(event) {
    this.angularZone.run(() => {
      this.loading = false;
      this.biometriaLoaded = true;
    });
  }

  onBiometriaCaptured(event) {
    this.angularZone.run(() => {
      this.capturaBiometrica = event.biometria;
      this.condutaFormGroup.get('biometria_base64').setValue(event.biometria);
      this.condutaFormGroup.get('token').setValue(event.tokenBiometrico);
      this.condutaFormGroup.get('login_profissional').setValue(this.profissionalSelected.login);
      this.condutaFormGroup.get('nome_profissional').setValue(this.profissionalSelected.nome);
      this.condutaFormGroup.get('crm_profissional').setValue(this.profissionalSelected.codigo_crm_medico);
    });
  }

  onBiometriaError(event) {
    this.angularZone.run(() => {
      this.biometriaError = event;
      this.loading = false;
      this.biometriaLoaded = false;

      this.condutaFormGroup.reset();
    });
  }

  salvarConduta() {
    const textoOutroRegex = new RegExp('<(?!\\s)*[a-zA-Z0-9]|<\\/(?!\\s)*[a-zA-Z0-9]');
    if (textoOutroRegex.test(this.condutaFormGroup.get('texto_outro').value)) {
      this.textoOutroError = true;
    } else {
      this.loading = true;

      const tipos = [...this.selectedChoies];

      if (tipos.includes('outro')) {
        tipos.splice(tipos.indexOf('outro'), 1);
      }

      const data = { ...this.condutaFormGroup.getRawValue(), tipo_conduta: tipos };

      this.periodoAlertaService.salvarCondutaAlerta(this.periodoAlerta, data).subscribe(
        res => {
          this.loading = false;
          this.bsModalRef.hide();
          this.notificationService.html('Conduta registrada com sucesso', NotificationType.Success, { timeOut: 1500 });
          this.periodoAlertaService.reloadPeriodosAlerta();
        },
        error => {
          this.loading = false;
          this.notificationService.html('Erro ao registrar conduta', NotificationType.Error, { timeOut: 1500 });
          console.error(error);
        }
      );
    }
  }

  onChoiceCheked(event) {
    if (event.target.checked) {
      this.selectedChoies.push(event.target.value);
    } else {
      const index = this.selectedChoies.indexOf(event.target.value);
      this.selectedChoies.splice(index, 1);
    }
  }

  onTextareaChange() {
    if (this.textarea.nativeElement.value.length > 143) {
      this.textarea.nativeElement.style.cssText = 'height:' + this.textarea.nativeElement.scrollHeight + 'px';
    }
    if (this.textarea.nativeElement.value.length < 143) {
      this.textarea.nativeElement.style.cssText = 'height: 40px';
    }
  }
}
