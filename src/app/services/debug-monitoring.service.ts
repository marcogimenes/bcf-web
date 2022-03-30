import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfig } from '../app.config';
import {
  HAPVIDA_STATUS_RETORNO_PACIENTE_FOUND,
  HAPVIDA_STATUS_RETORNO_PACIENTE_NOT_FOUND,
  HAPVIDA_STATUS_RETORNO_PACIENTE_NOT_VALID,
} from './../shared/constants';
import { LocalStorageService } from './local-storage.service';

@Injectable()
export class DebugMonitoringService {
  batimentos_api_url: string;
  default_timeout = 60000; // 60 seconds
  attendance_code = null;
  monitoringHapvida = null;
  monitoringHeramed = null;
  monitoringBatimentos = null;

  constructor(
    private http: HttpClient,
    private config: AppConfig,
    private localStorage: LocalStorageService,
  ) {
    this.batimentos_api_url =
      this.config.getConfig('BATIMENTOS_FETAIS_API_BASE_URL') + ':uri';
  }

  expect(assertion) {
    if (assertion) {
      return 'ok';
    } else {
      return 'error';
    }
  }

  test(test_desc, func) {
    return {
      name: test_desc,
      status: func(),
    };
  }

  mountResponse(title, status, steps, msg_error = null) {
    return {
      title: title,
      status: status,
      steps: steps,
      msg_error: msg_error,
    };
  }

  printAllMonitoring(list_monitoring) {
    let printResponse = `Lista de monitoramentos ativos na Heramed:
    <ul>`;
    list_monitoring.forEach(monitoring => {
      printResponse += `<li>Nome: <strong>${monitoring.patient}</strong> <br />Número atendimento: <strong>${monitoring.patient_identifier}</strong> </li>`;
    });
    printResponse += `<ul />`;
    return printResponse;
  }

  async verifyAPIHeramed() {
    const stepsList = [];
    let test = null;
    // test: 1
    try {
      const response_api = await this.http
        .get(this.batimentos_api_url.replace(/:uri/g, '/live/monitoramentos/raw/'), {params: {status: 'running'}})
        .toPromise();
      if (Array.isArray(response_api)) {
        let monitoring = response_api.filter(monitoring => {
          return monitoring.patient_identifier === String(this.attendance_code);
        });
        if (monitoring.length > 1) {
          monitoring = [
            monitoring.reduce((a, b) => {
              return a.test_id > b.test_id ? a : b;
            }),
          ];
        }

        // test: 2
        test = this.test('Monitoramento registrado na Heramed', () =>
          this.expect(monitoring.length),
        );
        stepsList.push(test);

        //Todo: Adicionar lista de monitoramentos running da heramed

        if (test.status === 'error') {
          return this.mountResponse(
            'Verificação na Base Heramed',
            'error',
            stepsList,
            `Siga as intruções abaixo:<br />
            <ul>
              <li>Encerrar o monitoramento no aplicativo</li>
              <li>Fechar o aplicativo</li>
              <li>Verificar a conectividade do celular com a internet</li>
              <li>Reiniciar o monitoramento no aplicativo</li>
            </ul><br />${this.printAllMonitoring(response_api)}`,
          );
        }

        // test: 3
        test = this.test('Monitoramento em execução na Heramed', () =>
          this.expect(monitoring[0].status !== 'Stopped'),
        );
        stepsList.push(test);

        if (test.status === 'error') {
          return this.mountResponse(
            'Verificação na Base Heramed',
            'error',
            stepsList,
            `Monitoramento encontra-se encerrado.<br />
            Siga as intruções abaixo:<br />
            <ul>
              <li>Reiniciar o monitoramento no aplicativo</li>
            </ul>`,
          );
        }

        this.monitoringHeramed = monitoring[0];
        return this.mountResponse('Verificação na Base Heramed', 'ok', stepsList);
      }
    } catch (error) {
      return this.mountResponse('Verificação na Base Heramed', 'error', stepsList, 'API offline');
    }
  }

  async verifyAPIHapvida() {
    const stepsList = [];
    let test = null;
    const locais = await this.localStorage.getFromLocalStorage('locais').toPromise();
    const postosValues = locais.map(local => local.posto.value);

    // test: 4

    try {
      this.monitoringBatimentos = await this.http
        .get(
          this.batimentos_api_url.replace(
            /:uri/g,
            `/monitoramentos/${this.monitoringHeramed.test_id}/`,
          ),
        )
        .toPromise();
      // test: 5
      test = this.test('Paciente alocado no PEP', () =>
        this.expect(
          this.monitoringBatimentos.codigo_posto !== '' &&
            this.monitoringBatimentos.codigo_posto !== null,
        ),
      );
      stepsList.push(test);
    } catch (error) {
      console.log(error);
      if (error.status === 404) {
        return this.mountResponse(
          'Verificação na Base Hapvida',
          'error',
          stepsList,
          `Monitoramento não registrado na Base Hapvida<br />
          Siga as intruções abaixo:<br />
            <ul>
              <li>Verificar se o dashboard está com parametrizado corretamente (Setor, Unidade e Posto)</li>
            </ul>`,
        );
      }
      return this.mountResponse(
        'Verificação na Base Hapvida',
        'error',
        stepsList,
        'Hapvida Offline',
      );
    }

    if (test.status === 'error') {
      // test: 7
      try {
        const monitoringHapvida = await this.http
          .get(
            this.batimentos_api_url.replace(
              /:uri/g,
              `/integracao/${locais[0]?.base}/pacientes/${this.attendance_code}`,
            ),
          )
          .toPromise();
        // test: 8

        switch (monitoringHapvida[0].cd_status_retorno) {
          case HAPVIDA_STATUS_RETORNO_PACIENTE_NOT_FOUND:
            return this.mountResponse(
              'Verificação no PEP',
              'error',
              stepsList,
              `Código de atendimento ${this.attendance_code} inválido.<br />
              Siga as intruções abaixo:<br />
              <ul>
                <li>Encerrar o monitoramento no aplicativo</li>
                <li>Reiniciar o monitoramento no aplicativo com o código de atendimento correto</li>
              </ul>`,
            );
          case HAPVIDA_STATUS_RETORNO_PACIENTE_NOT_VALID:
            return this.mountResponse(
              'Verificação no PEP',
              'error',
              stepsList,
              `Paciente não alocado no PEP<br />
              Siga as intruções abaixo:<br />
              <ul>
                <li>Encerrar o monitoramento no aplicativo</li>
                <li>Verificar o PEP para alocar devidamente a paciente</li>
                <li>Reiniciar o monitoramento no aplicativo</li>
              </ul>`,
            );
          case HAPVIDA_STATUS_RETORNO_PACIENTE_FOUND:
            return this.mountResponse(
              'Verificação no PEP',
              'error',
              stepsList,
              `Erro na comunicação com o sistema de atendimentos (PEP)<br />
                Por favor, entre em contato com o suporte.`,
            );
        }
      } catch (error) {
        return this.mountResponse('Verificação no PEP', 'error', stepsList, 'API Hapvida offline');
      }
    } else {
      const postoIsDiff = postosValues.filter(value => value === String(this.monitoringBatimentos.codigo_posto));

      test = this.test('Paciente alocado para esta parametrização de dashboard', () =>
        this.expect(postoIsDiff.length),
      );
      stepsList.push(test);

      if (test.status === 'error') {
        return this.mountResponse(
          'Verificação Dashboard',
          'error',
          stepsList,
          `<strong>Paciente alocado em:</strong> ${this.monitoringBatimentos.nome_filial} | ${
            this.monitoringBatimentos.nome_posto
          } | ${this.monitoringBatimentos.nome_acomodacao} <br /><br />
              <strong>Dashboard configurado para:</strong>
              ${this.placesString(locais)}
              Siga as intruções abaixo:<br />
              <ul>
                <li>Encerrar o monitoramento no aplicativo</li>
                <li>Se a alocação da paciente estiver correta, deve ser encaminhada ao posto/sala correspondente </li>
                <li>Se não estiver correta, deve ser realocada no PEP para o posto/sala correto</li>
                <li>Reiniciar o monitoramento no aplicativo</li>
              </ul>`,
        );
      }
      return this.mountResponse('Verificação Dashboard', 'ok', stepsList);
    }
  }

  placesString(locais) {
    let placeString = '';
    locais.forEach((local) => {
      const baseString = `
        <ul>
        <li><b>Base</b>: ${local['base'] === 'hap' ? 'HAPVIDA' : 'SCHOSP'}</li>
        <li><b>Unidade</b>: ${local['unidade_atendimento'].label}</li>
        <li><b>Posto</b>: ${local['posto'].label}</li>
        </ul>
      `;
      placeString += baseString;
    });

    return placeString;
  }

  async verifyOurBase() {
    const stepsList = [];
    let test = null;

    // test: 6
    test = this.test('Monitoramento em execução na Base Hapvida', () =>
      this.expect(this.monitoringBatimentos.status === 'running'),
    );
    stepsList.push(test);

    if (test.status === 'error') {
      return this.mountResponse(
        'Verificação na Base Hapvida',
        'error',
        stepsList,
        `Monitoramento encontra-se parado devido inatividade.<br />
        Por favor, entre em contato com o suporte.`,
      );
    }

    return this.mountResponse('Verificação na Base Hapvida', 'ok', stepsList);
  }

  async debug(attendance_code: number) {
    this.attendance_code = attendance_code;

    const debug_verifications = {
      isInHeramed: this.verifyAPIHeramed.bind(this),
      parametersAreCorrect: this.verifyAPIHapvida.bind(this),
      isAlocate: this.verifyOurBase.bind(this),
    };

    const debug_reponse = [];

    for (const key in debug_verifications) {
      if (debug_verifications.hasOwnProperty(key)) {
        const response_verification = await debug_verifications[key]();

        debug_reponse.push(response_verification);
        if (response_verification.status === 'error') break;
      }
    }
    return debug_reponse;
  }
}
