export const TAQ = "TAQ";
export const BRD = "BRD";
export const DSA = "DSA";
export const ATR = "ATR";

export const ALERT_TYPE = {
  TAQ: "Taquicardia",
  BRD: "Bradicardia",
  DSA: "Desaceleração",
  ATR: "Aus. Acel. Transitória"
};

// src/assets/styles/_colors.scss
export const ALERT_COLOR = {
  TAQ: "#E4AE20",
  BRD: "#8E19D6",
  DSA: "#E55934",
  ATR: "#9BC53D"
};

export const UNIDADE_MAP = {
  minutes: 'Minutos',
  seconds: 'Segundos',
  bpm: 'BPM',
};

export const SETOR_EMERGENCIA = 'E';
export const SETOR_INTERNACAO = 'I';
export const SETOR_CIRURGICO = 'C';

export const DATE_PICKER_OPTIONS: any = {
  autoUpdateInput: false,
  // autoApply: true,
  linkedCalendars: false,
  applyButtonClasses: "btn-primary",
  showDropdowns: true,
  minDate: "01/01/2019",
  opens: "right",
  locale: {
    format: "DD/MM/YYYY",
    applyLabel: "Aplicar",
    cancelLabel: "Limpar",
    customRangeLabel: "Período livre",
    firstDay: 0,
    daysOfWeek: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
    monthNames: [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ],
  },
  alwaysShowCalendars: true,
  maxDate: new Date() // now
};

// Configurações
export const MAX_MONITORAMENTO_DURATION = 'MAX_MONITORAMENTO_DURATION';
export const MAX_MONITORAMENTO_DURATION_HERAMED = 'MAX_MONITORAMENTO_DURATION_HERAMED';

// STATUS RETORNO API
export const VALIDACAO_BIOMETRICA_OK = 302;
export const HAPVIDA_STATUS_RETORNO_PACIENTE_FOUND = '-20000';
export const HAPVIDA_STATUS_RETORNO_PACIENTE_NOT_FOUND = '-20001';
export const HAPVIDA_STATUS_RETORNO_PACIENTE_NOT_VALID = '-20003';

// ENDPOINTS GENERATE PDF
export const URL_PDF = {
  MONITORAMENTOS: '/auditoria/relatorio-monitoramentos/',
  ACOMPANHAMENTOS_TABELA: '/auditoria/relatorio-acompanhamento/',
  ACOMPANHAMENTOS_TABELA_ASSIDUIDADE: '/auditoria/relatorio-acompanhamento/',
  TABELA_PARTOS_CSV: '/auditoria/relatorio-acompanhamento/',
  ACOMPANHAMENTOS_GRAFICO: '/auditoria/relatorio-acompanhamento/',
  PARTOS: '/auditoria/relatorio-partos/',
  ELEGIVEIS: '/auditoria/relatorio-gestantes-nao-monitoradas/'
};
