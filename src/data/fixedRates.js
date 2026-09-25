/**
 * Tabela Oficial de Valores Fixos - Colégio Rodin 2027
 * 
 * Regras Estabelecidas:
 * 1. 6º ao 9º Ano do EF:
 *    - Anuidade: R$ 34.663,20 (13x de R$ 2.666,40)
 *    - Material: R$ 5.248,80 (12x de R$ 437,40)
 * 
 * 2. 1ª e 2ª Série do EM:
 *    - Anuidade: R$ 37.752,00 (13x de R$ 2.904,00)
 *    - Material: R$ 5.338,20 (12x de R$ 444,85)
 * 
 * 3. Terceirão (3ª Série EM / Pré-Vestibular):
 *    - Anuidade: R$ 43.243,20 (13x de R$ 3.326,40)
 *    - Material: R$ 7.575,60 (12x de R$ 631,30)
 */

export const FIXED_RATES_2027 = {
  EF_6_TO_9: {
    cycleLabel: 'Ensino Fundamental II (6º ao 9º Ano)',
    tuitionNominalTotal: '34.663,20',
    tuitionNominalNum: 34663.20,
    tuitionInstallmentsCount: 13,
    tuitionInstallmentValue: '2.666,40',
    tuitionInstallmentNum: 2666.40,
    tuitionExtenso: 'Trinta e quatro mil, seiscentos e sessenta e três reais e vinte centavos',
    tuitionInstallmentExtenso: 'Dois mil, seiscentos e sessenta e seis reais e quarenta centavos',

    materialTotalValue: '5.248,80',
    materialTotalNum: 5248.80,
    materialInstallmentsCount: 12,
    materialInstallmentValue: '437,40',
    materialInstallmentNum: 437.40,
    materialTotalExtenso: 'Cinco mil, duzentos e quarenta e oito reais e oitenta centavos',
    materialInstallmentExtenso: 'Quatrocentos e trinta e sete reais e quarenta centavos'
  },
  EM_1_TO_2: {
    cycleLabel: 'Ensino Médio (1ª e 2ª Série)',
    tuitionNominalTotal: '37.752,00',
    tuitionNominalNum: 37752.00,
    tuitionInstallmentsCount: 13,
    tuitionInstallmentValue: '2.904,00',
    tuitionInstallmentNum: 2904.00,
    tuitionExtenso: 'Trinta e sete mil, setecentos e cinquenta e dois reais',
    tuitionInstallmentExtenso: 'Dois mil, novecentos e quatro reais',

    materialTotalValue: '5.338,20',
    materialTotalNum: 5338.20,
    materialInstallmentsCount: 12,
    materialInstallmentValue: '444,85',
    materialInstallmentNum: 444.85,
    materialTotalExtenso: 'Cinco mil, trezentos e trinta e oito reais e vinte centavos',
    materialInstallmentExtenso: 'Quatrocentos e quarenta e quatro reais e oitenta e cinco centavos'
  },
  TERCEIRAO: {
    cycleLabel: 'Ensino Médio - Terceirão / Pré-Vestibular (3ª Série)',
    tuitionNominalTotal: '43.243,20',
    tuitionNominalNum: 43243.20,
    tuitionInstallmentsCount: 13,
    tuitionInstallmentValue: '3.326,40',
    tuitionInstallmentNum: 3326.40,
    tuitionExtenso: 'Quarenta e três mil, duzentos e quarenta e três reais e vinte centavos',
    tuitionInstallmentExtenso: 'Três mil, trezentos e vinte e seis reais e quarenta centavos',

    materialTotalValue: '7.575,60',
    materialTotalNum: 7575.60,
    materialInstallmentsCount: 12,
    materialInstallmentValue: '631,30',
    materialInstallmentNum: 631.30,
    materialTotalExtenso: 'Sete mil, quinhentos e setenta e cinco reais e sessenta centavos',
    materialInstallmentExtenso: 'Seiscentos e trinta e um reais e trinta centavos'
  }
};

/**
 * Configuração Padrão da Campanha de Rematrícula (utilizada como fallback e inicialização)
 */
export const DEFAULT_CAMPAIGN_CONFIG = {
  academicYear: 2027,
  isActive: true,
  announcementTitle: 'Campanha Oficial de Rematrícula Colégio Rodin',
  closedMessage: 'O período de rematrícula para este ciclo letivo está temporariamente suspenso ou em preparação pela Direção.',
  cycles: {
    EF_6_TO_9: {
      cycleLabel: 'Ensino Fundamental II (6º ao 9º Ano)',
      tuitionNominalTotal: 34663.20,
      tuitionInstallmentsCount: 13,
      materialTotalValue: 5248.80,
      materialInstallmentsCount: 12
    },
    EM_1_TO_2: {
      cycleLabel: 'Ensino Médio (1ª e 2ª Série)',
      tuitionNominalTotal: 37752.00,
      tuitionInstallmentsCount: 13,
      materialTotalValue: 5338.20,
      materialInstallmentsCount: 12
    },
    TERCEIRAO: {
      cycleLabel: 'Ensino Médio - Terceirão / Pré-Vestibular (3ª Série)',
      tuitionNominalTotal: 43243.20,
      tuitionInstallmentsCount: 13,
      materialTotalValue: 7575.60,
      materialInstallmentsCount: 12
    }
  }
};

/**
 * Identifica a chave de ciclo para qualquer série informada
 * @param {string} grade 
 * @returns {'EF_6_TO_9' | 'EM_1_TO_2' | 'TERCEIRAO'}
 */
export function getCycleKeyForGrade(grade) {
  const g = String(grade || '').toUpperCase();

  // Terceirão / 3ª Série EM / Pré-Vestibular
  if (
    g.includes('TERCEIR') ||
    g.includes('3ª SÉRIE') ||
    g.includes('3A SERIE') ||
    g.includes('3º EM') ||
    g.includes('3ª EM') ||
    g.includes('3º ANO EM') ||
    g.includes('PPV') ||
    g.includes('PRÉ') ||
    g.includes('PRE') ||
    g.includes('VESTIBULAR') ||
    (g.includes('3') && (g.includes('MÉDIO') || g.includes('MEDIO') || g.includes('EM')))
  ) {
    return 'TERCEIRAO';
  }

  // 1ª e 2ª Série do Ensino Médio
  if (
    g.includes('1ª SÉRIE') ||
    g.includes('1A SERIE') ||
    g.includes('1º ANO EM') ||
    g.includes('1ª EM') ||
    g.includes('1º EM') ||
    g.includes('2ª SÉRIE') ||
    g.includes('2A SERIE') ||
    g.includes('2º ANO EM') ||
    g.includes('2ª EM') ||
    g.includes('2º EM') ||
    (g.includes('MÉDIO') || g.includes('MEDIO') || g.includes('EM'))
  ) {
    return 'EM_1_TO_2';
  }

  // Padrão: 6º ao 9º Ano do Ensino Fundamental
  return 'EF_6_TO_9';
}

/**
 * Retorna os dados completos dos valores fixos para qualquer série informada (legado 2027)
 * @param {string} grade 
 * @returns {typeof FIXED_RATES_2027.EF_6_TO_9}
 */
export function getFixedRatesForGrade(grade) {
  const key = getCycleKeyForGrade(grade);
  return FIXED_RATES_2027[key] || FIXED_RATES_2027.EF_6_TO_9;
}

/**
 * Formata um número para o padrão de moeda brasileiro (BRL)
 */
function formatBRL(val) {
  const n = typeof val === 'number' ? val : (parseFloat(String(val).replace(/\./g, '').replace(',', '.')) || 0);
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Retorna os valores dinâmicos de anuidade e material com base na configuração ativa da campanha
 * @param {string} grade 
 * @param {typeof DEFAULT_CAMPAIGN_CONFIG} [config] 
 */
export function getDynamicRatesForGrade(grade, config) {
  const activeCfg = config || DEFAULT_CAMPAIGN_CONFIG;
  const cycleKey = getCycleKeyForGrade(grade);
  const cycleData = (activeCfg.cycles && activeCfg.cycles[cycleKey])
    ? activeCfg.cycles[cycleKey]
    : DEFAULT_CAMPAIGN_CONFIG.cycles[cycleKey];

  const tuitionNum = typeof cycleData.tuitionNominalTotal === 'number'
    ? cycleData.tuitionNominalTotal
    : (parseFloat(String(cycleData.tuitionNominalTotal).replace(/\./g, '').replace(',', '.')) || 34663.20);

  const tuitionInstCount = parseInt(cycleData.tuitionInstallmentsCount) || 13;
  const tuitionInstValNum = tuitionInstCount > 0 ? (tuitionNum / tuitionInstCount) : tuitionNum;

  const matNum = typeof cycleData.materialTotalValue === 'number'
    ? cycleData.materialTotalValue
    : (parseFloat(String(cycleData.materialTotalValue).replace(/\./g, '').replace(',', '.')) || 5248.80);

  const matInstCount = parseInt(cycleData.materialInstallmentsCount) || 12;
  const matInstValNum = matInstCount > 0 ? (matNum / matInstCount) : matNum;

  // Busca extensos de referência se disponíveis
  const legacy = FIXED_RATES_2027[cycleKey] || FIXED_RATES_2027.EF_6_TO_9;

  return {
    cycleKey,
    cycleLabel: cycleData.cycleLabel || legacy.cycleLabel,
    tuitionNominalTotal: formatBRL(tuitionNum),
    tuitionNominalNum: tuitionNum,
    tuitionInstallmentsCount: tuitionInstCount,
    tuitionInstallmentValue: formatBRL(tuitionInstValNum),
    tuitionInstallmentNum: tuitionInstValNum,
    materialTotalValue: formatBRL(matNum),
    materialTotalNum: matNum,
    materialInstallmentsCount: matInstCount,
    materialInstallmentValue: formatBRL(matInstValNum),
    materialInstallmentNum: matInstValNum,
    tuitionExtenso: legacy.tuitionExtenso,
    tuitionInstallmentExtenso: legacy.tuitionInstallmentExtenso,
    materialTotalExtenso: legacy.materialTotalExtenso,
    materialInstallmentExtenso: legacy.materialInstallmentExtenso
  };
}

/**
 * Retorna o valor nominal em texto da anuidade para uma série
 * @param {string} grade 
 * @param {typeof DEFAULT_CAMPAIGN_CONFIG} [config]
 * @returns {string} ex: '34.663,20'
 */
export function getNominalTuitionForGrade(grade, config) {
  if (config) {
    return getDynamicRatesForGrade(grade, config).tuitionNominalTotal;
  }
  return getFixedRatesForGrade(grade).tuitionNominalTotal;
}

/**
 * Retorna o pacote padrão de material didático da Livraria do Pensador
 * @param {string} grade 
 * @param {typeof DEFAULT_CAMPAIGN_CONFIG} [config]
 */
export function getStandardMaterialForGrade(grade, config) {
  if (config) {
    const rates = getDynamicRatesForGrade(grade, config);
    return {
      total: rates.materialTotalValue,
      totalNum: rates.materialTotalNum,
      installments: String(rates.materialInstallmentsCount),
      installmentValue: rates.materialInstallmentValue,
      installmentNum: rates.materialInstallmentNum,
      extenso: rates.materialTotalExtenso,
      installmentExtenso: rates.materialInstallmentExtenso
    };
  }
  const rates = getFixedRatesForGrade(grade);
  return {
    total: rates.materialTotalValue,
    totalNum: rates.materialTotalNum,
    installments: String(rates.materialInstallmentsCount),
    installmentValue: rates.materialInstallmentValue,
    installmentNum: rates.materialInstallmentNum,
    extenso: rates.materialTotalExtenso,
    installmentExtenso: rates.materialInstallmentExtenso
  };
}
