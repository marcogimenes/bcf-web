import { Component, OnInit, AfterContentInit, Input, Output, NgZone, EventEmitter } from '@angular/core';
import { BiometriaService } from 'src/app/services/biometria.service';

import * as $ from 'jquery';

@Component({
  selector: 'app-biometria',
  templateUrl: './biometria.component.html',
  styleUrls: ['./biometria.component.scss']
})
export class BiometriaComponent implements OnInit, AfterContentInit {
  @Input() profissional;
  @Input() contexto;
  @Output() biometriaCaptured = new EventEmitter<any>();
  @Output() biometriaClosed = new EventEmitter<any>();
  @Output() biometriaLoading = new EventEmitter<any>();
  @Output() biometriaLoaded = new EventEmitter<any>();
  @Output() biometriaError = new EventEmitter<any>();

  tokenBiometrico: string;

  constructor(private biometriaService: BiometriaService) { }

  ngOnInit() {
    window.parent['setBiometriaJSF'] = data => {
      this.validarBiometria(data[0].value, this.contexto);
    }

    window['fechaCaptura'] = data => {
      this.biometriaClosed.emit();
    };
  }

  ngAfterContentInit(): void {
    this.biometriaLoading.emit(true);
    this.biometriaService.getHtmlModal(this.profissional.login, this.contexto, (data, tokenBiometrico) => {
      this.tokenBiometrico = tokenBiometrico;

      data = data.replace('paramDedos= ;', "paramDedos= '';");
      data = data.replace('<?xml version="1.0" encoding="UTF-8"?>', '');
      data = data.replace(/href="#"/g, 'href="javascript:void(0);"');


      $('#biometria').html(data);

      this.biometriaLoaded.emit(true);
    },
    error => {
      this.handleBiometriaError(error);
    });
  }

  validarBiometria(biometriaImage: string, contexto: string): void {
    this.biometriaService.validarBiometria(biometriaImage, this.tokenBiometrico, contexto,
      success => {
        this.biometriaCaptured.emit({
          biometria: biometriaImage,
          tokenBiometrico: this.tokenBiometrico
        });
      },
      error => {
        this.biometriaError.emit(error);
      }
    )
  }

  handleBiometriaError(error) {
    console.log(error);
    this.biometriaError.emit('Não foi possível realizar a autenticação biométrica');
  }

}
