import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StorageMap, JSONSchema } from '@ngx-pwa/local-storage';

// key that is used to access the data in local storage
const STORAGE_KEY = 'local_batfet';

interface Local {
  base: string;
  setor_hosp: object;
  unidade_atendimento: object;
  posto: object;
}

interface ScreenSettings {
  tela_polegadas: number;
  tela_resh: number;
  tela_resv: number;
  graf_escala: number;
}

const locaisSchema: JSONSchema = {
  type: 'array',
  minItems: 0,
  items: {
    type: 'object',
    properties: {
      base: { type: 'string' },
      setor_hosp: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          value: { type: 'string' },
        },
        required: ['label', 'value']
      },
      unidade_atendimento: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          value: { type: 'string' },
          cd_filial: { type: 'string' },
          nm_filial: { type: 'string' },
        },
        required: ['label', 'value']
      },
      posto: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          value: { type: 'string' },
        },
        required: ['label', 'value']
      },
    },
    required: ['base', 'setor_hosp', 'unidade_atendimento', 'posto']
  }
};

const screenSettingsSchema: JSONSchema = {
  type: 'object',
  properties: {
    tela_polegadas: { type: 'number' },
    tela_resh: { type: 'number' },
    tela_resv: { type: 'number' },
    graf_escala: { type: 'number' },
  },
  required: ['tela_polegadas', 'tela_resh', 'tela_resv', 'graf_escala'],
};

const DEFAULT_CONFIGS = {
  locais: [],
  screenSettings: {
    tela_polegadas: 31.5,
    tela_resh: 1366,
    tela_resv: 768,
    graf_escala: 3,
  }
};

const SCHEMA_MAP = {
  locais: locaisSchema,
  screenSettings: screenSettingsSchema,
};

@Injectable()
export class LocalStorageService {

  constructor(
    private storage: StorageMap,
  ) {}

  public async init() {
    await this.migrateFromOldStorage();
    await this.validateStorage();
  }

  private migrateFromOldStorage(): Promise<any> {
    const promises_list: Promise<any>[] = [];

    const old_data = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    window.localStorage.removeItem(STORAGE_KEY);

    if (old_data) {
      const { validIndex, locais, screenSettings } = old_data;

      if (validIndex && locais) {
        const locais_filtered = [];
        validIndex.forEach((element, index) => {
          if (element) {
            locais_filtered.push(locais[index]);
          }
        });
        promises_list.push(this.setOnLocalStorage('locais', locais_filtered));
      }

      if (screenSettings) {
        promises_list.push(this.setOnLocalStorage('screenSettings', screenSettings));
      }
    }

    return Promise.all(promises_list);
  }

  private validateStorage(): Promise<any> {
    const locaisPromise = new Promise((resolve, reject) => {
      this.storage.get<Local[]>('locais', locaisSchema).subscribe(
        locais => {
          if (locais === undefined) {  // if key doesn't exist
            this.setOnLocalStorage('locais', DEFAULT_CONFIGS['locais']).then(stored_value => resolve(stored_value));
          } else {
            resolve(locais);
          }
        },
        error => {  // if value is invalid
          this.setOnLocalStorage('locais', DEFAULT_CONFIGS['locais']).then(stored_value => resolve(stored_value));
        }
      );
    });

    const screenSettingsPromise = new Promise((resolve, reject) => {
      this.storage.get<ScreenSettings>('screenSettings', screenSettingsSchema).subscribe(
        screenSettings => {
          if (screenSettings === undefined) {  // if key doesn't exist
            this.setOnLocalStorage('screenSettings', DEFAULT_CONFIGS['screenSettings']).then(stored_value => resolve(stored_value));
          } else {
            resolve(screenSettings);
          }
        },
        error => {  // if value is invalid
          this.setOnLocalStorage('screenSettings', DEFAULT_CONFIGS['screenSettings']).then(stored_value => resolve(stored_value));
        }
      );
    });

    return Promise.all([
      locaisPromise,
      screenSettingsPromise,
    ]);
  }

  setOnLocalStorage(key: string, value: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (SCHEMA_MAP[key]) {
        this.storage.set(key, value, SCHEMA_MAP[key]).subscribe(
          (stored_value) => resolve(stored_value),
          error => reject(error),
        );
      } else {
        reject();
      }
    });
  }

  getFromLocalStorage(key: string): Observable<any> {
    return this.storage.get(key);
  }

  watchFromLocalStorage(key: string): Observable<any> {
    return this.storage.watch(key);
  }
}
