import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  downloadSignedContractPDF, 
  previewSignedContractPDF,
  downloadMaterialOrderPDF,
  previewMaterialOrderPDF,
  downloadAllContractsPDF
} from '../../lib/pdfGenerator';
import { BRAZILIAN_UFS, getCitiesByUF, parseCityStateString, cleanCityName } from '../../lib/brazilianLocations';
import { removeAccents } from '../../lib/formatters';
import { 
  FIXED_RATES_2027, 
  getFixedRatesForGrade, 
  getNominalTuitionForGrade, 
  getStandardMaterialForGrade 
} from '../../data/fixedRates';
export { FIXED_RATES_2027, getFixedRatesForGrade, getNominalTuitionForGrade, getStandardMaterialForGrade };
import { 
  PERCENTAGE_FILTERS, 
  SPREADSHEET_DISCOUNT_DESCRIPTIONS, 
  normalizeDiscountPct, 
  getDiscountDetails 
} from '../../data/spreadsheetDiscounts';
import {
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  ArrowLeft,
  UserCheck,
  Users,
  DollarSign,
  GraduationCap,
  MapPin,
  Sparkles,
  Printer,
  Save,
  Check,
  FileSignature,
  Filter,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Share2,
  Copy,
  ExternalLink,
  BookOpen,
  X,
  Activity,
  Plus,
  Percent,
  Edit2,
  Trash2,
  Settings
} from 'lucide-react';

// =========================================================================
// HELPERS MONETÁRIOS BRL ('2.000,00')
// =========================================================================
const parseBRLToNumber = (val) => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = val.toString().trim();
  if (str.includes(',')) {
    const clean = str.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    return parseFloat(clean) || 0;
  }
  // Se contiver ponto, verificar se é separador de milhar brasileiro (ex: '43.243')
  if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3 && parts[0].length >= 1)) {
      const clean = str.replace(/\./g, '').replace(/[^\d.-]/g, '');
      return parseFloat(clean) || 0;
    }
  }
  const clean = str.replace(/[^\d.-]/g, '');
  return parseFloat(clean) || 0;
};

const formatNumberToBRL = (val) => {
  const num = typeof val === 'number' ? val : parseBRLToNumber(val);
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Helper para conversão de datas vindas da planilha ou banco para formato aceito pelo input type="date" (YYYY-MM-DD)
export const toInputDateFormat = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') {
    if (!dateStr) return '';
    dateStr = String(dateStr);
  }
  let str = dateStr.trim();
  if (!str || str === '-' || str.toLowerCase() === 'none' || str.toLowerCase() === 'null') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  // Suporte a datas textuais em português (ex: "10 de janeiro de 2027" ou "10 de janeiro de 2026")
  const ptMonths = {
    janeiro: '01', jan: '01',
    fevereiro: '02', fev: '02',
    março: '03', marco: '03', mar: '03',
    abril: '04', abr: '04',
    maio: '05', mai: '05',
    junho: '06', jun: '06',
    julho: '07', jul: '07',
    agosto: '08', ago: '08',
    setembro: '09', set: '09',
    outubro: '10', out: '10',
    novembro: '11', nov: '11',
    dezembro: '12', dez: '12'
  };
  const textMatch = str.toLowerCase().match(/^(\d{1,2})\s+(?:de\s+)?([a-zçãé]+)\s+(?:de\s+)?(\d{4})$/);
  if (textMatch) {
    const [, d, monthName, y] = textMatch;
    const m = ptMonths[monthName];
    if (m) {
      return `${y}-${m}-${String(d).padStart(2, '0')}`;
    }
  }

  str = str.replace(/[`'"]/g, '').replace(/\/+/g, '/').replace(/-+/g, '-');
  if (str.includes('/') && str.includes('-')) str = str.replace(/-/g, '/');
  const slashParts = str.split('/');
  if (slashParts.length === 3) {
    let [d, m, y] = slashParts;
    d = d.trim().replace(/\D/g, '');
    m = m.trim().replace(/\D/g, '');
    y = y.trim().replace(/\D/g, '');
    if (y.length > 4) {
      if (y.startsWith('200') && y.length === 5) {
        y = '20' + y.slice(-2);
      } else {
        y = y.slice(-4);
      }
    } else if (y.length === 3 && y.startsWith('2')) {
      y = '20' + y.slice(1);
    } else if (y.length === 2) {
      y = (parseInt(y, 10) > 30 ? '19' : '20') + y;
    }
    if (d.length > 2) d = d.slice(-2);
    if (d && m && y) {
      let dInt = parseInt(d, 10) || 1;
      let mInt = parseInt(m, 10) || 1;
      if (mInt > 12 && dInt <= 12) {
        const temp = dInt; dInt = mInt; mInt = temp;
      }
      mInt = Math.max(1, Math.min(12, mInt));
      dInt = Math.max(1, Math.min(31, dInt));
      return `${String(y).padStart(4, '0')}-${String(mInt).padStart(2, '0')}-${String(dInt).padStart(2, '0')}`;
    }
  }
  const matchNoSlash = str.match(/^(\d{1,2})\/(\d{2})(\d{4})$/);
  if (matchNoSlash) {
    const [, d, m, y] = matchNoSlash;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const dashParts = str.split('-');
  if (dashParts.length === 3 && dashParts[0].length <= 2 && dashParts[2].length === 4) {
    const [d, m, y] = dashParts;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return '';
};

// Helper para exibição amigável brasileira DD/MM/YYYY
export const toDisplayDateFormat = (dateStr) => {
  if (!dateStr || dateStr === '—') return '—';
  const str = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split('-');
    return `${day}/${month}/${year}`;
  }
  const iso = toInputDateFormat(str);
  if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [year, month, day] = iso.split('-');
    return `${day}/${month}/${year}`;
  }
  return str;
};

// Helper para formato de resumo de meses (ex: "Jan a Dez")
export const formatCronogramaLabel = (startDateStr, endDateStr) => {
  const getMonthShort = (dStr, defaultMonth) => {
    if (!dStr) return defaultMonth;
    const iso = toInputDateFormat(dStr);
    if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const mInt = parseInt(iso.split('-')[1], 10);
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return months[mInt - 1] || defaultMonth;
    }
    const parts = String(dStr).split(' ');
    return parts[2] || defaultMonth;
  };
  const startMonth = getMonthShort(startDateStr, 'Jan');
  const endMonth = getMonthShort(endDateStr, 'Dez');
  return `${startMonth} a ${endMonth}`;
};


// Mapeamento automático de progressão de série (ex: 6º Ano -> 7º Ano)
const getNextGrade = (currentGrade) => {
  if (!currentGrade) return '6º Ano EF';
  const g = currentGrade.toUpperCase();
  if (g.includes('6º ANO') || g.includes('6° ANO') || g.includes('6º EF') || g.includes('6 ANO')) return '7º Ano EF';
  if (g.includes('7º ANO') || g.includes('7° ANO') || g.includes('7º EF') || g.includes('7 ANO')) return '8º Ano EF';
  if (g.includes('8º ANO') || g.includes('8° ANO') || g.includes('8º EF') || g.includes('8 ANO')) return '9º Ano EF';
  if (g.includes('9º ANO') || g.includes('9° ANO') || g.includes('9º EF') || g.includes('9 ANO')) return '1ª Série EM';
  if (g.includes('1ª SÉRIE') || g.includes('1A SERIE') || g.includes('1º EM') || g.includes('1º ANO EM')) return '2ª Série EM';
  if (g.includes('2ª SÉRIE') || g.includes('2A SERIE') || g.includes('2º EM') || g.includes('2º ANO EM')) return '3ª Série EM';
  if (g.includes('3ª SÉRIE') || g.includes('3A SERIE') || g.includes('3º EM') || g.includes('TERCEIR')) return 'Pré-Vestibular (PPV)';
  return currentGrade;
};

// Obs: As funções getNominalTuitionForGrade e getStandardMaterialForGrade estão centralizadas em src/data/fixedRates.js e já foram exportadas no topo do arquivo.

// Opções de Descontos Padrão e Histórico de Parcerias (Ex: Le Perini 2025, Le Perini 2027, etc.)
export const INITIAL_DISCOUNT_OPTIONS = [
  { id: 'sem_desconto', name: 'Sem desconto', percentage: 0, reason: 'Anuidade integral conforme tabela padrão.' },
  { id: 'desc_5', name: '5%', percentage: 5, reason: 'Desconto de 5% na anuidade' },
  { id: 'desc_10', name: '10%', percentage: 10, reason: 'Desconto de 10% na anuidade' },
  { id: 'desc_15', name: '15%', percentage: 15, reason: 'Desconto de 15% na anuidade' },
  { id: 'desc_20', name: '20%', percentage: 20, reason: 'Desconto de 20% na anuidade' },
  { id: 'desc_25', name: '25%', percentage: 25, reason: 'Desconto de 25% na anuidade' },
  { id: 'desc_30', name: '30%', percentage: 30, reason: 'Desconto de 30% na anuidade' },
  { id: 'desc_35', name: '35%', percentage: 35, reason: 'Desconto de 35% na anuidade' },
  { id: 'desc_40', name: '40%', percentage: 40, reason: 'Desconto de 40% na anuidade' },
  { id: 'desc_45', name: '45%', percentage: 45, reason: 'Desconto de 45% na anuidade' },
  { id: 'desc_50', name: '50%', percentage: 50, reason: 'Desconto de 50% na anuidade' },
  { id: 'desc_60', name: '60%', percentage: 60, reason: 'Desconto de 60% na anuidade' },
  { id: 'desc_100', name: '100%', percentage: 100, reason: 'Bolsa 100% na anuidade' }
];

export default function ReenrollmentModule() {
  const { students, enrollments, saveReenrollment, createEnrollmentProposal, showToast, campaignConfig, setActiveTab } = useApp();

  // Estados da Lista e Filtros
  const [searchQuery, setSearchQuery] = useState(() => {
    try {
      const q = localStorage.getItem('rodin_pending_reenrollment_search');
      if (q) {
        localStorage.removeItem('rodin_pending_reenrollment_search');
        return q;
      }
    } catch (e) {}
    return '';
  });
  const [selectedStudentIdFilter, setSelectedStudentIdFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [percentageFilter, setPercentageFilter] = useState('all');
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [onlineLinkModal, setOnlineLinkModal] = useState(null);

  // Estado do Formulário Único de Rematrícula (TODOS OS DADOS EM APENAS UMA TELA)
  const [formData, setFormData] = useState({
    // Matrícula & Acadêmico
    rmNumber: '',
    academicYear: '2027',
    courseLevel: 'Ensino Fundamental',
    currentGrade: '',
    schoolShift: 'Manhã',
    classGroup: 'A',
    status: 'pending_reenrollment',
    schoolContractStatus: 'pending', // 'pending' | 'signed'
    materialContractStatus: 'pending', // 'pending' | 'signed'

    // Estudante
    studentName: '',
    studentGender: 'Masc.',
    studentBirthDate: '',
    studentBirthState: 'SP',
    studentBirthCity: 'Indaiatuba',
    studentNationality: 'Brasileiro(a)',
    studentRg: '',
    studentRgIssuer: 'SSP/SP',
    studentRgIssueDate: '',
    studentCpf: '',
    studentLandline: '',
    studentPhone: '',

    // Responsável Financeiro
    guardianRelation: 'Pai',
    guardianName: '',
    guardianGender: 'Masc.',
    guardianBirthDate: '',
    guardianOccupation: '',
    guardianMaritalStatus: 'Casado(a)',
    guardianRg: '',
    guardianRgIssuer: 'SSP/SP',
    guardianCpf: '',
    guardianNationality: 'Brasileiro(a)',
    guardianEmail: '',
    guardianLandline: '',
    guardianPhone: '',

    // Endereço Responsável (UF e Cidade Separados e Clicáveis)
    guardianAddressCep: '',
    guardianAddressStreet: '',
    guardianAddressNumber: '',
    guardianAddressComplement: '',
    guardianAddressNeighborhood: '',
    guardianAddressState: 'SP',
    guardianAddressCity: 'Indaiatuba',

    // Financeiro Balder - Oficial 2027 & Histórico 2026
    tuitionNominalTotal: '34.663,20',
    tuitionGrossTotal: '34.663,20',
    tuitionDiscountTotal: '34.663,20',
    tuitionDiscountType: 'Sem desconto',
    tuitionDiscountPercentage: 0,
    tuitionDiscountReason: '',
    tuitionPreviousYear2026: '',
    paymentPlanPreviousYear2026: '13',
    paymentPlanChoice: '13',
    installmentsCount: '13',
    firstInstallmentValue: '2.666,40',
    firstInstallmentSplit: 1,
    quotaDueDate: '15',
    regularInstallmentValue: '2.666,40',
    installmentDueDate: '1',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentNote: '* Boleto Bancário com vencimento mensal e sucessivo todo dia 01 de cada mês.',

    // Pedido de Material Didático (Livraria do Pensador LTDA - CNPJ 43.849.399/0001-92)
    materialBuyerName: '',
    materialBuyerCpf: '',
    materialTotalValue: '5.248,80',
    materialTotalExtenso: 'Cinco mil, duzentos e quarenta e oito reais e oitenta centavos',
    materialInstallmentsCount: '12',
    materialInstallmentValue: '437,40',
    materialInstallmentExtenso: 'Quatrocentos e trinta e sete reais e quarenta centavos',
    materialStartDueDate: '2027-01-10',
    materialEndDueDate: '2027-12-10',
    materialPaymentMethod: 'Boleto Bancário', 
    isBuyerSameAsFinancial: true
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saved' | 'saving'
  const autoSaveTimerRef = useRef(null);
  const isInitialStudentSelectionRef = useRef(false);
  const lastSavedSnapshotRef = useRef('');
  const wizardTopRef = useRef(null);

  // Função para retornar suavemente a tela ao topo do formulário
  const scrollToTop = () => {
    try {
      if (wizardTopRef.current) {
        wizardTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (e) {}

    try {
      const mainEl = document.querySelector('main');
      if (mainEl) {
        mainEl.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {}

    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement?.scrollTo?.({ top: 0, behavior: 'smooth' });
      document.body?.scrollTo?.({ top: 0, behavior: 'smooth' });
    } catch (e) {}
  };

  // Opções de desconto configuráveis com persistência local
  const [discountOptions, setDiscountOptions] = useState(() => {
    try {
      const saved = localStorage.getItem('rodin_discount_options_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(p => ({
            ...p,
            name: (p.name || '').replace(/\s*\(\s*\d+[\.,]?\d*%\s*(?:na anuidade)?\s*\)/gi, '').trim()
          }));
        }
      }
    } catch (e) {
      console.error('Erro ao ler opções de desconto do localStorage:', e);
    }
    return INITIAL_DISCOUNT_OPTIONS;
  });

  const [showNewDiscountModal, setShowNewDiscountModal] = useState(false);
  const [editingDiscountId, setEditingDiscountId] = useState(null);
  const [newDiscountForm, setNewDiscountForm] = useState({
    name: '',
    percentage: '',
    reason: ''
  });

  // Abrir modal para criar nova opção de desconto
  const handleOpenNewDiscount = () => {
    setEditingDiscountId(null);
    setNewDiscountForm({ name: '', percentage: '', reason: '' });
    setShowNewDiscountModal(true);
  };

  // Abrir modal para editar opção de desconto existente
  const handleOpenEditDiscount = (opt) => {
    if (!opt) return;
    setEditingDiscountId(opt.id);
    const cleanName = opt.name.replace(/\s*\(\s*\d+[\.,]?\d*%\s*(?:na anuidade)?\s*\)/gi, '').trim();
    setNewDiscountForm({
      name: cleanName,
      percentage: String(opt.percentage ?? 0),
      reason: opt.reason || ''
    });
    setShowNewDiscountModal(true);
  };

  // Garantir que descontos pré-existentes ou importados do aluno apareçam nas opções por percentual
  useEffect(() => {
    const pct = formData.tuitionDiscountPercentage !== undefined && formData.tuitionDiscountPercentage !== null
      ? Math.round(formData.tuitionDiscountPercentage > 1 ? formData.tuitionDiscountPercentage : formData.tuitionDiscountPercentage * 100)
      : (formData.tuitionDiscountType && String(formData.tuitionDiscountType).match(/\d+/) ? parseInt(String(formData.tuitionDiscountType).match(/\d+/)[0]) : 0);

    if (pct > 0) {
      const exists = discountOptions.some(o => o.percentage === pct);
      if (!exists) {
        const autoOpt = {
          id: `desc_${pct}`,
          name: `${pct}%`,
          percentage: pct,
          reason: formData.tuitionDiscountReason || `Desconto de ${pct}% na anuidade`
        };
        setDiscountOptions(prev => [...prev, autoOpt].sort((a, b) => (a.percentage || 0) - (b.percentage || 0)));
      }
    }
  }, [formData.tuitionDiscountPercentage, formData.tuitionDiscountType]);

  // Aplicar opção de desconto selecionada ou recém-criada
  const applyDiscountOption = (option) => {
    if (!option) return;
    const nominalStr = formData.tuitionNominalTotal || getNominalTuitionForGrade(formData.currentGrade);
    const nominalNum = parseBRLToNumber(nominalStr);
    const pct = typeof option.percentage === 'number' ? option.percentage : (parseFloat(option.percentage) || 0);
    const discountAmount = nominalNum * (pct / 100);
    const finalTuition = Math.max(0, nominalNum - discountAmount);
    const finalTuitionFormatted = formatNumberToBRL(finalTuition);

    const isAvista = formData.paymentPlanChoice === '1_avista_5off' || formData.paymentPlanChoice === '1';
    const count = parseInt(formData.paymentPlanChoice) || 13;

    let updatedFirst = formData.firstInstallmentValue;
    let updatedRegular = formData.regularInstallmentValue;

    if (pct === 100) {
      updatedFirst = '0,00';
      updatedRegular = '0,00';
    } else if (isAvista) {
      const discountedAvista = finalTuition * 0.95;
      updatedFirst = formatNumberToBRL(discountedAvista);
      updatedRegular = '0,00';
    } else {
      const parcelVal = count > 0 ? (finalTuition / count) : finalTuition;
      updatedFirst = formatNumberToBRL(parcelVal);
      updatedRegular = formatNumberToBRL(parcelVal);
    }

    const cleanOptName = (option.name || '').replace(/\s*\(\s*\d+[\.,]?\d*%\s*(?:na anuidade)?\s*\)/gi, '').trim();

    setFormData(prev => ({
      ...prev,
      tuitionNominalTotal: nominalStr,
      tuitionGrossTotal: finalTuitionFormatted,
      tuitionDiscountTotal: finalTuitionFormatted,
      tuitionDiscountType: cleanOptName,
      tuitionDiscountPercentage: pct / 100,
      tuitionDiscountReason: option.reason || (pct === 100 ? 'Bolsa Integral 100% na anuidade escolar' : (pct > 0 ? `${cleanOptName} (${pct}% na anuidade)` : 'Anuidade integral conforme tabela padrão.')),
      firstInstallmentValue: updatedFirst,
      regularInstallmentValue: updatedRegular
    }));
  };

  // Aplicar desconto diretamente por percentual selecionado (apenas porcentagem)
  const handleDiscountPercentageChange = (pct) => {
    const nominalStr = formData.tuitionNominalTotal || getNominalTuitionForGrade(formData.currentGrade);
    const nominalNum = parseBRLToNumber(nominalStr);
    const discountAmount = nominalNum * (pct / 100);
    const finalTuition = Math.max(0, nominalNum - discountAmount);
    const finalTuitionFormatted = formatNumberToBRL(finalTuition);

    const isAvista = formData.paymentPlanChoice === '1_avista_5off' || formData.paymentPlanChoice === '1';
    const count = parseInt(formData.paymentPlanChoice) || 13;

    let updatedFirst = formData.firstInstallmentValue;
    let updatedRegular = formData.regularInstallmentValue;

    if (pct === 100) {
      updatedFirst = '0,00';
      updatedRegular = '0,00';
    } else if (isAvista) {
      const discountedAvista = finalTuition * 0.95;
      updatedFirst = formatNumberToBRL(discountedAvista);
      updatedRegular = '0,00';
    } else {
      const parcelVal = count > 0 ? (finalTuition / count) : finalTuition;
      updatedFirst = formatNumberToBRL(parcelVal);
      updatedRegular = formatNumberToBRL(parcelVal);
    }

    setFormData(prev => ({
      ...prev,
      tuitionNominalTotal: nominalStr,
      tuitionGrossTotal: finalTuitionFormatted,
      tuitionDiscountTotal: finalTuitionFormatted,
      tuitionDiscountType: pct > 0 ? `${pct}%` : 'Sem desconto',
      tuitionDiscountPercentage: pct / 100,
      tuitionDiscountReason: pct === 100 ? (prev.tuitionDiscountReason || 'Bolsa Integral 100% na anuidade escolar') : (pct > 0 ? (prev.tuitionDiscountReason || `Desconto de ${pct}% na anuidade`) : 'Anuidade integral conforme tabela padrão.'),
      firstInstallmentValue: updatedFirst,
      regularInstallmentValue: updatedRegular
    }));
  };

  // Identificar qual ID de opção de desconto corresponde ao desconto atual do formulário
  const getCurrentDiscountOptionValue = () => {
    const pct = formData.tuitionDiscountPercentage !== undefined && formData.tuitionDiscountPercentage !== null
      ? Math.round(formData.tuitionDiscountPercentage > 1 ? formData.tuitionDiscountPercentage : formData.tuitionDiscountPercentage * 100)
      : null;

    if (pct === 0 || (pct === null && (!formData.tuitionDiscountType || formData.tuitionDiscountType.toLowerCase() === 'sem desconto'))) {
      return 'sem_desconto';
    }

    // Prioridade 1: Encontrar pelo percentual exato
    if (pct !== null && pct > 0) {
      const foundByPct = discountOptions.find(o => o.percentage === pct);
      if (foundByPct) return foundByPct.id;
    }

    // Prioridade 2: Encontrar pelo ID ou nome
    const currentType = (formData.tuitionDiscountType || '').trim();
    const cleanCurrent = currentType.replace(/\s+/g, ' ').replace(/\s*\(\s*\d+[\.,]?\d*%\s*(?:na anuidade)?\s*\)/gi, '').toLowerCase();
    const found = discountOptions.find(o => {
      const cleanOptName = o.name.replace(/\s*\(\s*\d+[\.,]?\d*%\s*(?:na anuidade)?\s*\)/gi, '').toLowerCase();
      return o.id === formData.tuitionDiscountType ||
        cleanOptName === cleanCurrent ||
        o.name.toLowerCase() === currentType.toLowerCase();
    });
    return found ? found.id : 'sem_desconto';
  };

  // Ao selecionar uma opção no select de descontos
  const handleDiscountSelectChange = (selectedVal) => {
    if (selectedVal === '__NEW__') {
      handleOpenNewDiscount();
      return;
    }
    if (selectedVal === '__MANAGE__') {
      const currentOpt = discountOptions.find(o => o.id === getCurrentDiscountOptionValue()) || discountOptions[1];
      handleOpenEditDiscount(currentOpt);
      return;
    }
    const found = discountOptions.find(o => o.id === selectedVal);
    if (found) {
      applyDiscountOption(found);
    }
  };

  // Criar ou editar opção de desconto
  const handleSaveDiscount = (e) => {
    if (e) e.preventDefault();
    if (!newDiscountForm.name.trim()) {
      showToast('Informe o nome da opção de desconto.', 'error');
      return;
    }
    const pct = parseFloat(String(newDiscountForm.percentage).replace(',', '.')) || 0;
    if (pct < 0 || pct > 100) {
      showToast('O percentual de desconto deve estar entre 0% e 100%.', 'error');
      return;
    }

    const cleanName = newDiscountForm.name.replace(/\s*\(\s*\d+[\.,]?\d*%\s*(?:na anuidade)?\s*\)/gi, '').trim();
    const defaultReason = newDiscountForm.reason.trim() || `${cleanName} (${pct}% na anuidade)`;

    let updatedOptions = [];
    let savedOption = null;

    if (editingDiscountId) {
      // Atualizando opção existente
      updatedOptions = discountOptions.map(opt => {
        if (opt.id === editingDiscountId) {
          savedOption = {
            ...opt,
            name: cleanName,
            percentage: pct,
            reason: defaultReason
          };
          return savedOption;
        }
        return opt;
      });
      showToast(`Opção "${cleanName}" atualizada com sucesso!`, 'success');
    } else {
      // Criando nova opção
      const newId = 'disc_' + Date.now();
      savedOption = {
        id: newId,
        name: cleanName,
        percentage: pct,
        reason: defaultReason
      };
      updatedOptions = [...discountOptions, savedOption];
      showToast(`Opção "${cleanName} (${pct}%)" criada com sucesso!`, 'success');
    }

    setDiscountOptions(updatedOptions);
    try {
      localStorage.setItem('rodin_discount_options_v4', JSON.stringify(updatedOptions));
    } catch (err) {
      console.error(err);
    }

    if (savedOption) {
      applyDiscountOption(savedOption);
    }
    setShowNewDiscountModal(false);
    setEditingDiscountId(null);
    setNewDiscountForm({ name: '', percentage: '', reason: '' });
  };

  // Excluir opção customizada
  const handleDeleteDiscountOption = (id) => {
    if (id === 'sem_desconto') {
      showToast('A opção "Sem desconto" é padrão do sistema e não pode ser excluída.', 'error');
      return;
    }
    const updated = discountOptions.filter(o => o.id !== id);
    setDiscountOptions(updated);
    try {
      localStorage.setItem('rodin_discount_options_v4', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    showToast('Opção de desconto removida.', 'info');
  };

  // Sincronização inteligente: atualiza o Responsável Financeiro e reflete no Comprador se vinculado
  const handleGuardianFieldChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (prev.isBuyerSameAsFinancial) {
        if (field === 'guardianName') updated.materialBuyerName = value;
        if (field === 'guardianCpf') updated.materialBuyerCpf = value;
      }
      return updated;
    });
  };

  // Desacoplamento estrito: se o usuário alterar ou apagar o Comprador, o Responsável Financeiro NÃO É ALTERADO
  const handleMaterialBuyerFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      isBuyerSameAsFinancial: false
    }));
  };

  // Alternar vínculo entre Comprador do Material e Responsável Financeiro
  const handleToggleSameBuyer = (checked) => {
    setFormData(prev => ({
      ...prev,
      isBuyerSameAsFinancial: checked,
      ...(checked ? {
        materialBuyerName: prev.guardianName || '',
        materialBuyerCpf: prev.guardianCpf || ''
      } : {})
    }));
  };

  // Ao selecionar um estudante para rematrícula, preencher todos os dados existentes
  const handleSelectStudent = (student) => {
    // Buscar se já possui registro de matrícula prévio para mesclar metadados financeiros
    const existingEnrollment = enrollments.find(
      e => e.studentId === student.id || e.rmNumber === student.rmNumber || e.cocCode === student.cocCode
    ) || {};

    const primaryGuardian = (student.guardians && student.guardians[0]) || {};

    const rm = student.rmNumber || student.cocCode || existingEnrollment.rmNumber || '2560';
    const nextGrade = getNextGrade(student.currentGrade || existingEnrollment.currentGrade);

    // Separar Cidade e UF do Estudante
    const studentBirthLoc = parseCityStateString(
      student.studentBirthCity || student.birthCity || existingEnrollment.studentBirthCity || 'Indaiatuba - SP'
    );

    const targetYear = String(campaignConfig?.academicYear || existingEnrollment.academicYear || '2027');
    const nominalVal = getNominalTuitionForGrade(nextGrade, campaignConfig);
    const nominalNum = parseBRLToNumber(nominalVal);
    const materialStd = getStandardMaterialForGrade(nextGrade, campaignConfig);

    // Detecção segura e completa de Bolsa / Desconto 100%
    const rawDiscountPct = existingEnrollment.tuitionDiscountPercentage !== undefined 
      ? existingEnrollment.tuitionDiscountPercentage 
      : (student.percentual_desconto_2027 !== undefined ? student.percentual_desconto_2027 : 0);
    const normalizedDiscountPct = normalizeDiscountPct(rawDiscountPct);

    const discountReasonText = String(
      existingEnrollment.tuitionDiscountReason || 
      student.observacao_desconto_2027 || 
      existingEnrollment.tuitionDiscountType || 
      student.tipo_desconto_2027 || 
      student.desconto_2026_detalhes || 
      ''
    );
    const has100Keyword = /100%|bolsa\s*100|permuta\s*100|integral\s*100/i.test(discountReasonText);
    const has0Amount = (existingEnrollment.tuitionDiscountTotal === 0 && existingEnrollment.tuitionDiscountTotal !== undefined && existingEnrollment.tuitionDiscountTotal !== null) ||
                       (student.valor_total_anuidade_2027 === 0 && student.valor_total_anuidade_2027 !== undefined && student.valor_total_anuidade_2027 !== null);

    const is100Discount = normalizedDiscountPct === 100 || has100Keyword || (has0Amount && (normalizedDiscountPct > 0 || has100Keyword));

    let grossVal = '0,00';
    if (is100Discount) {
      grossVal = '0,00';
    } else if (normalizedDiscountPct > 0) {
      // Prioridade máxima: o percentual de desconto ativo define o valor real de contrato
      grossVal = formatNumberToBRL(Math.max(0, nominalNum * (1 - normalizedDiscountPct / 100)));
    } else if (existingEnrollment.tuitionDiscountTotal !== undefined && existingEnrollment.tuitionDiscountTotal !== null && parseBRLToNumber(existingEnrollment.tuitionDiscountTotal) > 1000) {
      grossVal = formatNumberToBRL(existingEnrollment.tuitionDiscountTotal);
    } else if (student.valor_total_anuidade_2027 !== undefined && student.valor_total_anuidade_2027 !== null && parseBRLToNumber(student.valor_total_anuidade_2027) > 1000) {
      grossVal = formatNumberToBRL(student.valor_total_anuidade_2027);
    } else if (existingEnrollment.tuitionGrossTotal !== undefined && existingEnrollment.tuitionGrossTotal !== null && parseBRLToNumber(existingEnrollment.tuitionGrossTotal) > 1000) {
      grossVal = formatNumberToBRL(existingEnrollment.tuitionGrossTotal);
    } else {
      grossVal = nominalVal;
    }

    // Padrão do Colégio Rodin: 13 parcelas mensais por padrão
    const rawChoice = existingEnrollment.paymentPlanChoice || existingEnrollment.installmentsCount || '13';
    const initialPlanChoice = (rawChoice && String(rawChoice) !== '12')
      ? (String(rawChoice) === '1' || String(rawChoice) === '1_avista_5off' ? '1_avista_5off' : String(rawChoice))
      : '13';

    const countInst = initialPlanChoice === '1_avista_5off' ? '1' : initialPlanChoice;
    const countNum = parseInt(countInst) || 13;
    const grossNum = parseBRLToNumber(grossVal);
    const defaultParcelValue = formatNumberToBRL(countNum > 0 ? (grossNum / countNum) : grossNum);

    const firstVal = is100Discount ? '0,00' : (
      (existingEnrollment.firstInstallmentValue !== undefined && existingEnrollment.firstInstallmentValue !== null && parseBRLToNumber(existingEnrollment.firstInstallmentValue) > 50)
        ? formatNumberToBRL(existingEnrollment.firstInstallmentValue)
        : defaultParcelValue
    );

    const regVal = is100Discount ? '0,00' : (
      (existingEnrollment.regularInstallmentValue !== undefined && existingEnrollment.regularInstallmentValue !== null && parseBRLToNumber(existingEnrollment.regularInstallmentValue) > 50)
        ? formatNumberToBRL(existingEnrollment.regularInstallmentValue)
        : defaultParcelValue
    );

    const schoolSigned = existingEnrollment.schoolContractStatus !== undefined
      ? existingEnrollment.schoolContractStatus === 'signed'
      : (existingEnrollment.status === 'reenrolled' || existingEnrollment.status === 'active');

    const materialSigned = existingEnrollment.materialContractStatus !== undefined
      ? existingEnrollment.materialContractStatus === 'signed'
      : (existingEnrollment.status === 'reenrolled' || existingEnrollment.status === 'active');

    const bothSigned = schoolSigned && materialSigned;
    const consolidatedStatus = bothSigned
      ? 'reenrolled'
      : (schoolSigned || materialSigned ? 'partial_signed' : 'pending_reenrollment');

    const isCustomDownPayment = existingEnrollment.hasCustomFirstInstallment;
    const initialFirstVal = is100Discount ? '0,00' : ((!schoolSigned && !isCustomDownPayment) ? defaultParcelValue : firstVal);
    const initialRegVal = is100Discount ? '0,00' : ((!schoolSigned && !isCustomDownPayment) ? defaultParcelValue : regVal);

    const gState = primaryGuardian.guardianAddressState || primaryGuardian.addressState || existingEnrollment.guardianAddressState || 'SP';
    const gCity = cleanCityName(primaryGuardian.guardianAddressCity || primaryGuardian.addressCity || existingEnrollment.guardianAddressCity || 'Indaiatuba');

    const guardianNameVal = primaryGuardian.guardianName || primaryGuardian.name || existingEnrollment.guardianName || '';
    const guardianCpfVal = primaryGuardian.guardianCpf || primaryGuardian.cpf || existingEnrollment.guardianCpf || '';
    const buyerNameVal = existingEnrollment.materialBuyerName || guardianNameVal;
    const buyerCpfVal = existingEnrollment.materialBuyerCpf || guardianCpfVal;

    setFormData({
      // Matrícula & Acadêmico
      rmNumber: rm,
      academicYear: targetYear,
      courseLevel: (student.courseLevel || existingEnrollment.courseLevel || 'Ensino Fundamental').replace('Ensino Fundamental II', 'Ensino Fundamental'),
      currentGrade: nextGrade,
      schoolShift: student.schoolShift || existingEnrollment.schoolShift || 'Manhã',
      classGroup: student.classGroup || existingEnrollment.classGroup || 'A',
      status: consolidatedStatus,
      schoolContractStatus: schoolSigned ? 'signed' : 'pending',
      materialContractStatus: materialSigned ? 'signed' : 'pending',

      // Estudante
      studentName: student.studentName || student.name || existingEnrollment.studentName || '',
      studentGender: student.studentGender || student.gender || existingEnrollment.studentGender || 'Masc.',
      studentBirthDate: toInputDateFormat(student.studentBirthDate || student.birthDate || student.data_nascimento_estudante || existingEnrollment.studentBirthDate || existingEnrollment.birthDate || ''),
      studentBirthState: student.studentBirthState || studentBirthLoc.state || 'SP',
      studentBirthCity: cleanCityName(studentBirthLoc.city) || cleanCityName(student.studentBirthCity) || 'Indaiatuba',
      studentNationality: student.studentNationality || student.nationality || existingEnrollment.studentNationality || 'Brasileiro(a)',
      studentRg: student.studentRg || student.rg || existingEnrollment.studentRg || '',
      studentRgIssuer: student.studentRgIssuer || student.rgIssuer || existingEnrollment.studentRgIssuer || 'SSP/SP',
      studentRgIssueDate: toInputDateFormat(student.studentRgIssueDate || student.rgIssueDate || student.dataEmissaoRg || student.data_emissao_rg_estudante || existingEnrollment.studentRgIssueDate || existingEnrollment.rgIssueDate || ''),
      studentCpf: student.studentCpf || student.cpf || existingEnrollment.studentCpf || '',
      studentLandline: student.studentLandline || student.phoneLandline || primaryGuardian.guardianLandline || primaryGuardian.phoneLandline || existingEnrollment.studentLandline || '',
      studentPhone: student.studentPhone || student.phoneMobile || student.emergencyContact || primaryGuardian.guardianPhone || primaryGuardian.phoneMobile || existingEnrollment.studentPhone || '',

      // Responsável Financeiro
      guardianRelation: primaryGuardian.guardianRelation || primaryGuardian.kinshipRelation || existingEnrollment.guardianRelation || 'Pai',
      guardianName: guardianNameVal,
      guardianGender: primaryGuardian.guardianGender || primaryGuardian.gender || existingEnrollment.guardianGender || 'Masc.',
      guardianBirthDate: toInputDateFormat(primaryGuardian.guardianBirthDate || primaryGuardian.birthDate || primaryGuardian.data_nascimento_responsavel || student.guardianBirthDate || student.birthDateGuardian || student.data_nascimento_responsavel || existingEnrollment.guardianBirthDate || existingEnrollment.birthDate || ''),
      guardianOccupation: primaryGuardian.guardianOccupation || primaryGuardian.occupation || existingEnrollment.guardianOccupation || '',
      guardianMaritalStatus: primaryGuardian.guardianMaritalStatus || primaryGuardian.maritalStatus || existingEnrollment.guardianMaritalStatus || 'Casado(a)',
      guardianRg: primaryGuardian.guardianRg || primaryGuardian.rg || existingEnrollment.guardianRg || '',
      guardianRgIssuer: primaryGuardian.guardianRgIssuer || primaryGuardian.rgIssuer || existingEnrollment.guardianRgIssuer || 'SSP/SP',
      guardianCpf: guardianCpfVal,
      guardianNationality: primaryGuardian.guardianNationality || primaryGuardian.nationality || existingEnrollment.guardianNationality || 'Brasileiro(a)',
      guardianEmail: primaryGuardian.guardianEmail || primaryGuardian.email || existingEnrollment.guardianEmail || '',
      guardianLandline: primaryGuardian.guardianLandline || primaryGuardian.phoneLandline || existingEnrollment.guardianLandline || '',
      guardianPhone: primaryGuardian.guardianPhone || primaryGuardian.phoneMobile || existingEnrollment.guardianPhone || '',

      // Endereço (UF e Cidade Clicáveis)
      guardianAddressCep: primaryGuardian.guardianAddressCep || primaryGuardian.addressCep || existingEnrollment.guardianAddressCep || '',
      guardianAddressStreet: primaryGuardian.guardianAddressStreet || primaryGuardian.addressStreet || existingEnrollment.guardianAddressStreet || '',
      guardianAddressNumber: primaryGuardian.guardianAddressNumber || primaryGuardian.addressNumber || existingEnrollment.guardianAddressNumber || '',
      guardianAddressComplement: primaryGuardian.guardianAddressComplement || primaryGuardian.addressComplement || existingEnrollment.guardianAddressComplement || '',
      guardianAddressNeighborhood: primaryGuardian.guardianAddressNeighborhood || primaryGuardian.addressNeighborhood || existingEnrollment.guardianAddressNeighborhood || '',
      guardianAddressState: gState,
      guardianAddressCity: gCity,

      // Financeiro Balder - Oficial 2027 & Histórico 2026
      tuitionNominalTotal: nominalVal,
      tuitionGrossTotal: is100Discount ? '0,00' : grossVal,
      tuitionDiscountTotal: is100Discount ? '0,00' : grossVal,
      tuitionDiscountType: existingEnrollment.tuitionDiscountType || student.tipo_desconto_2027 || (is100Discount ? 'Bolsa 100%' : (normalizedDiscountPct > 0 ? `${normalizedDiscountPct}%` : 'Sem desconto')),
      tuitionDiscountPercentage: is100Discount ? 1.0 : (normalizedDiscountPct > 0 ? normalizedDiscountPct / 100 : (existingEnrollment.tuitionDiscountPercentage !== undefined ? existingEnrollment.tuitionDiscountPercentage : 0)),
      tuitionDiscountReason: existingEnrollment.tuitionDiscountReason || student.observacao_desconto_2027 || student.desconto_2026_detalhes || (is100Discount ? 'Bolsa Integral 100% na anuidade escolar' : 'Anuidade integral conforme tabela padrão Colégio Rodin 2027'),
      tuitionPreviousYear2026: existingEnrollment.tuitionPreviousYear2026 ? formatNumberToBRL(existingEnrollment.tuitionPreviousYear2026) : null,
      paymentPlanPreviousYear2026: existingEnrollment.paymentPlanPreviousYear2026 || null,
      paymentPlanChoice: initialPlanChoice,
      installmentsCount: countInst,
      firstInstallmentValue: initialFirstVal,
      firstInstallmentSplit: existingEnrollment.firstInstallmentSplit || 1,
      quotaDueDate: (!existingEnrollment.quotaDueDate || existingEnrollment.quotaDueDate === '10') ? '15' : (existingEnrollment.quotaDueDate || existingEnrollment.firstInstallmentDueDate || '15'),
      regularInstallmentValue: initialRegVal,
      installmentDueDate: (!existingEnrollment.installmentDueDate || existingEnrollment.installmentDueDate === '10') ? '1' : (existingEnrollment.installmentDueDate || '1'),
      paymentDate: existingEnrollment.paymentDate || (existingEnrollment.quotaDueDate && existingEnrollment.quotaDueDate.includes('-') ? existingEnrollment.quotaDueDate : new Date().toISOString().split('T')[0]),
      paymentNote: existingEnrollment.paymentNote || '* Boleto Bancário com vencimento mensal e sucessivo todo dia 01 de cada mês.',

      // Pedido de Material Didático (Livraria do Pensador LTDA - CNPJ 43.849.399/0001-92)
      materialBuyerName: buyerNameVal,
      materialBuyerCpf: buyerCpfVal,
      materialTotalValue: existingEnrollment.materialTotalValue !== undefined && existingEnrollment.materialTotalValue !== null
        ? (typeof existingEnrollment.materialTotalValue === 'number' ? formatNumberToBRL(existingEnrollment.materialTotalValue) : String(existingEnrollment.materialTotalValue))
        : materialStd.total,
      materialTotalExtenso: existingEnrollment.materialTotalExtenso || materialStd.extenso,
      materialInstallmentsCount: existingEnrollment.materialInstallmentsCount !== undefined && existingEnrollment.materialInstallmentsCount !== null
        ? String(existingEnrollment.materialInstallmentsCount)
        : '12',
      materialInstallmentValue: existingEnrollment.materialInstallmentValue !== undefined && existingEnrollment.materialInstallmentValue !== null
        ? (typeof existingEnrollment.materialInstallmentValue === 'number' ? formatNumberToBRL(existingEnrollment.materialInstallmentValue) : String(existingEnrollment.materialInstallmentValue))
        : materialStd.installmentValue,
      materialInstallmentExtenso: existingEnrollment.materialInstallmentExtenso || materialStd.installmentExtenso,
      materialStartDueDate: (() => {
        const d = toInputDateFormat(existingEnrollment.materialStartDueDate);
        if (!d || d.startsWith('2025') || d.startsWith('2026')) return `${targetYear}-01-10`;
        return d;
      })(),
      materialEndDueDate: (() => {
        const d = toInputDateFormat(existingEnrollment.materialEndDueDate);
        if (!d || d.startsWith('2025') || d.startsWith('2026')) return `${targetYear}-12-10`;
        return d;
      })(),
      materialPaymentMethod: (existingEnrollment.materialPaymentMethod && existingEnrollment.materialPaymentMethod.toLowerCase().includes('cart')) ? 'Cartão de Crédito' : 'Boleto Bancário',
      isBuyerSameAsFinancial: existingEnrollment.materialBuyerName 
        ? (existingEnrollment.materialBuyerName === guardianNameVal) 
        : true
    });

    // Se houver apenas um contrato pendente (ou ambos já assinados), direciona diretamente para a tela de gerar/baixar o PDF específico (Etapa 5)
    const isOnlyOnePending = (schoolSigned && !materialSigned) || (!schoolSigned && materialSigned);
    if (isOnlyOnePending || bothSigned) {
      setCurrentStep(5);
    } else {
      setCurrentStep(1);
    }

    setSelectedStudent(student);
    setIsSaved(false);
    isInitialStudentSelectionRef.current = true;
    setAutoSaveStatus('saved');
  };

  // Recálculo automático das parcelas e aplicação de 5% de desconto para À Vista
  const handleCalculateInstallments = (totalStr, planChoice, customFirstStr) => {
    const total = parseBRLToNumber(totalStr);

    if (total <= 0) {
      setFormData(prev => ({
        ...prev,
        tuitionGrossTotal: '0,00',
        tuitionDiscountTotal: '0,00',
        paymentPlanChoice: planChoice || prev.paymentPlanChoice || '13',
        installmentsCount: planChoice === '1_avista_5off' ? '1' : (planChoice || '13'),
        firstInstallmentValue: '0,00',
        regularInstallmentValue: '0,00'
      }));
      return;
    }

    if (planChoice === '1_avista_5off' || planChoice === '1') {
      const discountedTotal = total * 0.95; // 5% de desconto automático
      setFormData(prev => ({
        ...prev,
        tuitionGrossTotal: formatNumberToBRL(total),
        paymentPlanChoice: '1_avista_5off',
        installmentsCount: '1',
        firstInstallmentSplit: 1,
        firstInstallmentValue: formatNumberToBRL(discountedTotal),
        regularInstallmentValue: '0,00',
        paymentDate: prev.paymentDate || new Date().toISOString().split('T')[0],
        paymentNote: `* Pagamento à vista com 5% de desconto automático sobre a anuidade (Valor Final: R$ ${formatNumberToBRL(discountedTotal)}).`
      }));
      return;
    }

    const count = parseInt(planChoice) || 13;
    let first = (customFirstStr !== undefined && customFirstStr !== '') 
      ? parseBRLToNumber(customFirstStr) 
      : (total / count);

    let effectiveFirstStr = customFirstStr;
    // Bloquear valor maior que o valor com desconto
    if (first > total) {
      first = total;
      effectiveFirstStr = formatNumberToBRL(total);
    }

    const remainingTotal = Math.max(0, total - first);
    const regular = count > 1 ? remainingTotal / (count - 1) : 0;

    setFormData(prev => ({
      ...prev,
      tuitionGrossTotal: formatNumberToBRL(total),
      paymentPlanChoice: String(count),
      installmentsCount: String(count),
      firstInstallmentValue: effectiveFirstStr !== undefined ? effectiveFirstStr : formatNumberToBRL(first),
      regularInstallmentValue: formatNumberToBRL(regular),
      paymentNote: '* Boleto Bancário com vencimento mensal e sucessivo todo dia: 1º.'
    }));
  };

  // Recalcular quando altera o valor nominal da anuidade
  const handleNominalChange = (nominalRaw) => {
    const nominalNum = parseBRLToNumber(nominalRaw);
    const pctRaw = formData.tuitionDiscountPercentage || 0;
    const pct = pctRaw > 1 ? (pctRaw / 100) : pctRaw;
    const finalNum = Math.max(0, nominalNum * (1 - pct));
    const finalFormatted = formatNumberToBRL(finalNum);

    setFormData(prev => ({
      ...prev,
      tuitionNominalTotal: nominalRaw,
      tuitionGrossTotal: finalFormatted,
      tuitionDiscountTotal: finalFormatted
    }));

    handleCalculateInstallments(finalFormatted, formData.paymentPlanChoice);
  };

  // Aplicação interativa de desconto (tipo ou porcentagem)
  const handleApplyDiscount = (nominalStr, discountPctVal, discountTypeVal) => {
    const nominal = parseBRLToNumber(nominalStr || formData.tuitionNominalTotal || formData.tuitionGrossTotal);
    const pct = typeof discountPctVal === 'number' ? discountPctVal : (parseFloat(discountPctVal) || 0);
    const clampedPct = Math.min(100, Math.max(0, pct));
    const discountAmount = nominal * (clampedPct / 100);
    const finalTuition = Math.max(0, nominal - discountAmount);
    const finalTuitionFormatted = formatNumberToBRL(finalTuition);
    const nominalFormatted = formatNumberToBRL(nominal);

    const count = parseInt(formData.paymentPlanChoice) || 13;
    const isAvista = formData.paymentPlanChoice === '1_avista_5off' || formData.paymentPlanChoice === '1';

    if (isAvista) {
      const discountedAvista = finalTuition * 0.95;
      setFormData(prev => ({
        ...prev,
        tuitionNominalTotal: nominalFormatted,
        tuitionGrossTotal: finalTuitionFormatted,
        tuitionDiscountTotal: finalTuitionFormatted,
        tuitionDiscountPercentage: clampedPct / 100,
        tuitionDiscountType: discountTypeVal !== undefined ? discountTypeVal : prev.tuitionDiscountType,
        firstInstallmentValue: formatNumberToBRL(discountedAvista),
        regularInstallmentValue: '0,00'
      }));
    } else {
      const regular = count > 0 ? (finalTuition / count) : finalTuition;
      setFormData(prev => ({
        ...prev,
        tuitionNominalTotal: nominalFormatted,
        tuitionGrossTotal: finalTuitionFormatted,
        tuitionDiscountTotal: finalTuitionFormatted,
        tuitionDiscountPercentage: clampedPct / 100,
        tuitionDiscountType: discountTypeVal !== undefined ? discountTypeVal : prev.tuitionDiscountType,
        firstInstallmentValue: formatNumberToBRL(regular),
        regularInstallmentValue: formatNumberToBRL(regular)
      }));
    }
  };

  // Recalcular porcentagem quando o usuário edita a anuidade final diretamente
  const handleDirectTuitionChange = (finalRaw) => {
    const finalNum = parseBRLToNumber(finalRaw);
    const nominalNum = parseBRLToNumber(formData.tuitionNominalTotal) || finalNum;
    
    let pct = 0;
    if (nominalNum > 0 && finalNum < nominalNum) {
      pct = ((nominalNum - finalNum) / nominalNum);
    }

    setFormData(prev => ({
      ...prev,
      tuitionGrossTotal: finalRaw,
      tuitionDiscountTotal: finalRaw,
      tuitionDiscountPercentage: pct
    }));

    handleCalculateInstallments(finalRaw, formData.paymentPlanChoice);
  };

  // Busca CEP via ViaCEP API com auto-seleção de UF e Cidade
  const handleCepLookup = async (cepVal) => {
    const cleanCep = cepVal.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, guardianAddressCep: cepVal }));

    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          const ufFound = data.uf ? data.uf.toUpperCase() : prev.guardianAddressState;
          const cityFound = data.localidade || prev.guardianAddressCity;

          setFormData(prev => ({
            ...prev,
            guardianAddressStreet: data.logradouro || prev.guardianAddressStreet,
            guardianAddressNeighborhood: data.bairro || prev.guardianAddressNeighborhood,
            guardianAddressState: ufFound,
            guardianAddressCity: cityFound
          }));
          showToast(`CEP localizado: ${data.logradouro}, ${data.bairro} - ${cityFound}/${ufFound}`);
        } else {
          showToast('CEP não encontrado. Selecione o estado e cidade manualmente.', 'error');
        }
      } catch (err) {
        console.error('Erro ViaCEP:', err);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  // Helper para montar objeto do estudante atualizado
  const buildUpdatedStudentObject = () => ({
    ...(selectedStudent || {}),
    id: selectedStudent ? selectedStudent.id : `std-${formData.rmNumber}`,
    rmNumber: formData.rmNumber,
    cocCode: formData.rmNumber,
    name: formData.studentName,
    studentName: formData.studentName,
    birthDate: toInputDateFormat(formData.studentBirthDate),
    studentBirthDate: toInputDateFormat(formData.studentBirthDate),
    rgIssueDate: toInputDateFormat(formData.studentRgIssueDate),
    studentRgIssueDate: toInputDateFormat(formData.studentRgIssueDate),
    studentBirthCity: cleanCityName(formData.studentBirthCity),
    studentBirthState: formData.studentBirthState,
    currentGrade: formData.currentGrade,
    courseLevel: formData.courseLevel,
    schoolShift: formData.schoolShift,
    guardians: [
      {
        guardianName: formData.guardianName,
        guardianRelation: formData.guardianRelation,
        guardianCpf: formData.guardianCpf,
        guardianRg: formData.guardianRg,
        birthDate: toInputDateFormat(formData.guardianBirthDate),
        guardianBirthDate: toInputDateFormat(formData.guardianBirthDate),
        guardianEmail: formData.guardianEmail,
        guardianPhone: formData.guardianPhone,
        guardianAddressState: formData.guardianAddressState,
        guardianAddressCity: formData.guardianAddressCity
      }
    ]
  });

  // Montar objeto padronizado para PDF e Armazenamento (suporte aos dois contratos independentes)
  const buildEnrollmentDataObject = (customSchoolStatus, customMaterialStatus) => {
    const fullAddress = `${formData.guardianAddressStreet}, nº ${formData.guardianAddressNumber}${formData.guardianAddressComplement ? ' (' + formData.guardianAddressComplement + ')' : ''} - ${formData.guardianAddressNeighborhood}, ${formData.guardianAddressCity}/${formData.guardianAddressState}`;

    const studentBirthFull = formData.studentBirthState ? `${cleanCityName(formData.studentBirthCity)}/${formData.studentBirthState}` : cleanCityName(formData.studentBirthCity);

    let schoolStatus = formData.schoolContractStatus || 'pending';
    let materialStatus = formData.materialContractStatus || 'pending';

    if (customSchoolStatus === 'reenrolled') {
      schoolStatus = 'signed';
      materialStatus = 'signed';
    } else if (customSchoolStatus === 'pending_reenrollment') {
      schoolStatus = 'pending';
      materialStatus = 'pending';
    } else if (customSchoolStatus !== undefined) {
      schoolStatus = customSchoolStatus;
      if (customMaterialStatus !== undefined) {
        materialStatus = customMaterialStatus;
      }
    }

    const consolidatedStatus = (schoolStatus === 'signed' && materialStatus === 'signed')
      ? 'reenrolled'
      : (schoolStatus === 'signed' || materialStatus === 'signed' ? 'partial_signed' : 'pending_reenrollment');

    return {
      id: `enr-${formData.academicYear}-${formData.rmNumber}`,
      studentId: selectedStudent ? selectedStudent.id : `std-${formData.rmNumber}`,
      rmNumber: formData.rmNumber,
      cocCode: formData.rmNumber,
      enrollmentCode: `RM ${formData.rmNumber}`,
      academicYear: parseInt(formData.academicYear),
      courseLevel: formData.courseLevel,
      currentGrade: formData.currentGrade,
      schoolShift: formData.schoolShift,
      classGroup: formData.classGroup,
      status: consolidatedStatus,
      schoolContractStatus: schoolStatus,
      materialContractStatus: materialStatus,
      signedAt: (schoolStatus === 'signed' || materialStatus === 'signed') ? (formData.signedAt || new Date().toISOString()) : null,

      // Aluno
      studentName: formData.studentName,
      studentGender: formData.studentGender,
      studentBirthDate: formData.studentBirthDate,
      studentBirthCity: cleanCityName(formData.studentBirthCity),
      studentBirthState: formData.studentBirthState,
      studentNationality: formData.studentNationality,
      studentRg: formData.studentRg,
      studentRgIssuer: formData.studentRgIssuer,
      studentRgIssueDate: formData.studentRgIssueDate,
      studentCpf: formData.studentCpf,
      studentPhone: formData.studentPhone,

      // Responsável
      guardianRelation: formData.guardianRelation,
      guardianName: formData.guardianName,
      guardianGender: formData.guardianGender,
      guardianBirthDate: formData.guardianBirthDate,
      guardianOccupation: formData.guardianOccupation,
      guardianMaritalStatus: formData.guardianMaritalStatus,
      guardianRg: formData.guardianRg,
      guardianRgIssuer: formData.guardianRgIssuer,
      guardianCpf: formData.guardianCpf,
      guardianNationality: formData.guardianNationality,
      guardianEmail: formData.guardianEmail,
      guardianLandline: formData.guardianLandline,
      guardianPhone: formData.guardianPhone,
      guardianAddress: fullAddress,
      guardianAddressCep: formData.guardianAddressCep,
      guardianAddressStreet: formData.guardianAddressStreet,
      guardianAddressNumber: formData.guardianAddressNumber,
      guardianAddressComplement: formData.guardianAddressComplement,
      guardianAddressNeighborhood: formData.guardianAddressNeighborhood,
      guardianAddressCity: formData.guardianAddressCity,
      guardianAddressState: formData.guardianAddressState,

      // Financeiro Balder - Oficial 2027 & Histórico 2026
      tuitionNominalTotal: parseBRLToNumber(formData.tuitionNominalTotal || formData.tuitionGrossTotal),
      tuitionGrossTotal: parseBRLToNumber(formData.tuitionGrossTotal),
      tuitionDiscountTotal: parseBRLToNumber(formData.tuitionGrossTotal),
      tuitionDiscountType: formData.tuitionDiscountType || 'Sem desconto',
      tuitionDiscountPercentage: formData.tuitionDiscountPercentage || 0,
      tuitionDiscountReason: formData.tuitionDiscountReason || '',
      tuitionPreviousYear2026: parseBRLToNumber(formData.tuitionPreviousYear2026),
      paymentPlanPreviousYear2026: formData.paymentPlanPreviousYear2026 || '13',
      installmentsCount: parseInt(formData.installmentsCount),
      paymentPlanChoice: formData.paymentPlanChoice,
      firstInstallmentValue: parseBRLToNumber(formData.firstInstallmentValue),
      firstInstallmentSplit: parseInt(formData.firstInstallmentSplit || 1),
      quotaDueDate: formData.quotaDueDate || '15',
      regularInstallmentValue: parseBRLToNumber(formData.regularInstallmentValue),
      installmentDueDate: formData.installmentDueDate || '1',
      paymentDate: formData.paymentDate || (formData.paymentPlanChoice === '1_avista_5off' ? (formData.quotaDueDate || new Date().toISOString().split('T')[0]) : ''),
      paymentNote: formData.paymentNote,

      // Pedido de Material Didático (Livraria do Pensador LTDA - CNPJ 43.849.399/0001-92)
      materialBuyerName: formData.materialBuyerName || formData.guardianName,
      materialBuyerCpf: formData.materialBuyerCpf || formData.guardianCpf,
      materialTotalValue: parseBRLToNumber(formData.materialTotalValue),
      materialTotalExtenso: formData.materialTotalExtenso || '',
      materialInstallmentsCount: parseInt(formData.materialInstallmentsCount) || 12,
      materialInstallmentValue: parseBRLToNumber(formData.materialInstallmentValue),
      materialInstallmentExtenso: formData.materialInstallmentExtenso || '',
      materialStartDueDate: formData.materialStartDueDate || '2027-01-10',
      materialEndDueDate: formData.materialEndDueDate || '2027-12-10',
      materialPaymentMethod: formData.materialPaymentMethod || 'Boleto Bancário', 

      // Identificação da Assinatura Presencial
      signatureSha256: 'PRESENCIAL_FISICO_SETOR_MATRICULAS',
      isPresencial: true
    };
  };

  // Ação 1: Salvar Apenas os Dados Cadastrais e do Contrato (NÃO altera o status)
  const handleSaveContractData = (silent = false) => {
    if (!formData.studentName.trim()) {
      if (!silent) showToast('Por favor, informe o nome do estudante.', 'error');
      return false;
    }
    if (!formData.guardianName.trim()) {
      if (!silent) showToast('Por favor, informe o nome do responsável financeiro.', 'error');
      return false;
    }
    if (!formData.guardianCpf.trim()) {
      if (!silent) showToast('Por favor, informe o CPF do responsável.', 'error');
      return false;
    }

    const enrollmentData = buildEnrollmentDataObject(formData.schoolContractStatus, formData.materialContractStatus);
    const updatedStudent = buildUpdatedStudentObject();

    saveReenrollment(enrollmentData, updatedStudent);
    lastSavedSnapshotRef.current = JSON.stringify(formData);
    setIsSaved(true);
    setAutoSaveStatus('saved');
    if (!silent) {
      showToast(`Dados cadastrais e contratuais de ${formData.studentName} salvos com sucesso!`);
    }
    return true;
  };

  // Salvamento Automático em Tempo Real (Auto-save)
  useEffect(() => {
    if (!selectedStudent || !formData.studentName) return;

    if (isInitialStudentSelectionRef.current) {
      isInitialStudentSelectionRef.current = false;
      lastSavedSnapshotRef.current = JSON.stringify(formData);
      return;
    }

    const currentSnapshot = JSON.stringify(formData);
    if (currentSnapshot === lastSavedSnapshotRef.current) {
      return;
    }

    setAutoSaveStatus('saving');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      try {
        if (formData.studentName.trim() && formData.guardianName.trim()) {
          const enrollmentData = buildEnrollmentDataObject(formData.schoolContractStatus, formData.materialContractStatus);
          const updatedStudent = buildUpdatedStudentObject();
          saveReenrollment(enrollmentData, updatedStudent);
          lastSavedSnapshotRef.current = currentSnapshot;
          setIsSaved(true);
        }
      } catch (err) {
        console.error('Erro no salvamento automático:', err);
      } finally {
        setAutoSaveStatus('saved');
      }
    }, 600);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, selectedStudent]);

  // Navegação de etapa com salvamento garantido e retorno ao topo
  const handleStepChange = (newStep) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    if (selectedStudent && formData.studentName?.trim() && formData.guardianName?.trim()) {
      try {
        const enrollmentData = buildEnrollmentDataObject(formData.schoolContractStatus, formData.materialContractStatus);
        const updatedStudent = buildUpdatedStudentObject();
        saveReenrollment(enrollmentData, updatedStudent);
        lastSavedSnapshotRef.current = JSON.stringify(formData);
        setIsSaved(true);
        setAutoSaveStatus('saved');
      } catch (err) {
        console.error('Erro ao salvar ao mudar etapa:', err);
      }
    }
    setCurrentStep(newStep);

    // Retorna a visualização para o topo da tela
    scrollToTop();
    setTimeout(() => {
      scrollToTop();
    }, 50);
  };

  // Garante retorno ao topo sempre que a etapa for alterada
  useEffect(() => {
    if (selectedStudent) {
      scrollToTop();
      const timer = setTimeout(() => scrollToTop(), 60);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Ação 2: Alternar Status do Contrato Escolar (Colégio Rodin / Balder Educacional)
  const handleToggleSchoolContractStatus = () => {
    if (!formData.studentName.trim()) {
      showToast('Por favor, informe o nome do estudante.', 'error');
      return;
    }

    const newSchoolStatus = formData.schoolContractStatus === 'signed' ? 'pending' : 'signed';
    const currentMaterialStatus = formData.materialContractStatus || 'pending';
    const newConsolidatedStatus = (newSchoolStatus === 'signed' && currentMaterialStatus === 'signed')
      ? 'reenrolled'
      : (newSchoolStatus === 'signed' || currentMaterialStatus === 'signed' ? 'partial_signed' : 'pending_reenrollment');

    setFormData(prev => ({
      ...prev,
      schoolContractStatus: newSchoolStatus,
      status: newConsolidatedStatus
    }));

    const enrollmentData = buildEnrollmentDataObject(newSchoolStatus, currentMaterialStatus);
    const updatedStudent = buildUpdatedStudentObject();
    saveReenrollment(enrollmentData, updatedStudent);
    setIsSaved(true);

    if (newSchoolStatus === 'signed') {
      showToast(`🎓 Contrato de Anuidade de ${formData.studentName} marcado como ASSINADO!`);
    } else {
      showToast(`Contrato de Anuidade de ${formData.studentName} alterado para PENDENTE.`);
    }
  };

  // Ação 3: Alternar Status do Pedido de Material Didático (Livraria do Pensador LTDA)
  const handleToggleMaterialContractStatus = () => {
    if (!formData.studentName.trim()) {
      showToast('Por favor, informe o nome do estudante.', 'error');
      return;
    }

    const currentSchoolStatus = formData.schoolContractStatus || 'pending';
    const newMaterialStatus = formData.materialContractStatus === 'signed' ? 'pending' : 'signed';
    const newConsolidatedStatus = (currentSchoolStatus === 'signed' && newMaterialStatus === 'signed')
      ? 'reenrolled'
      : (currentSchoolStatus === 'signed' || newMaterialStatus === 'signed' ? 'partial_signed' : 'pending_reenrollment');

    setFormData(prev => ({
      ...prev,
      materialContractStatus: newMaterialStatus,
      status: newConsolidatedStatus
    }));

    const enrollmentData = buildEnrollmentDataObject(currentSchoolStatus, newMaterialStatus);
    const updatedStudent = buildUpdatedStudentObject();
    saveReenrollment(enrollmentData, updatedStudent);
    setIsSaved(true);

    if (newMaterialStatus === 'signed') {
      showToast(`📚 Pedido de Material Didático de ${formData.studentName} marcado como ASSINADO!`);
    } else {
      showToast(`Pedido de Material Didático de ${formData.studentName} alterado para PENDENTE.`);
    }
  };

  // Ação 4: Alternar Ambos os Contratos Simultaneamente (Marcar Ambos ou Reverter Ambos)
  const handleToggleBothStatus = () => {
    if (!formData.studentName.trim()) {
      showToast('Por favor, informe o nome do estudante.', 'error');
      return;
    }

    const bothSigned = formData.schoolContractStatus === 'signed' && formData.materialContractStatus === 'signed';
    const nextVal = bothSigned ? 'pending' : 'signed';
    const newConsolidatedStatus = nextVal === 'signed' ? 'reenrolled' : 'pending_reenrollment';

    setFormData(prev => ({
      ...prev,
      schoolContractStatus: nextVal,
      materialContractStatus: nextVal,
      status: newConsolidatedStatus
    }));

    const enrollmentData = buildEnrollmentDataObject(nextVal, nextVal);
    const updatedStudent = buildUpdatedStudentObject();
    saveReenrollment(enrollmentData, updatedStudent);
    setIsSaved(true);

    if (nextVal === 'signed') {
      showToast(`🎉 Sucesso! AMBOS os contratos de ${formData.studentName} foram marcados como ASSINADOS!`);
    } else {
      showToast(`Ambos os contratos de ${formData.studentName} foram alterados para PENDENTES.`);
    }
  };

  // Alias para retrocompatibilidade
  const handleToggleReenrolledStatus = handleToggleBothStatus;

  // Ação: Baixar PDF Oficial do Requerimento de Rematrícula (Assinatura Presencial Física à Caneta - Sem Hash)
  const handleDownloadPDF = () => {
    try {
      const data = buildEnrollmentDataObject();
      downloadSignedContractPDF(data, {
        signatureImage: null,
        signatureDataUrl: null,
        isPresencial: true
      });
      showToast(`PDF do Requerimento de Rematrícula de ${formData.studentName} baixado com sucesso!`);
    } catch (err) {
      console.error('Erro ao gerar PDF presencial:', err);
      showToast(`Erro ao gerar PDF: ${err.message || 'Falha na geração do documento'}`, 'error');
    }
  };

  // Ação: Pré-visualizar PDF Oficial em nova aba
  const handlePreviewPDF = () => {
    try {
      const data = buildEnrollmentDataObject();
      previewSignedContractPDF(data, {
        signatureImage: null,
        signatureDataUrl: null,
        isPresencial: true
      });
    } catch (err) {
      console.error('Erro ao pré-visualizar PDF:', err);
      showToast(`Erro ao pré-visualizar PDF: ${err.message}`, 'error');
    }
  };

  // Ação: Pré-visualizar PDF do Pedido de Material Didático em nova aba
  const handlePreviewMaterialPDF = () => {
    try {
      const data = buildEnrollmentDataObject();
      previewMaterialOrderPDF(data, {
        signatureImage: null,
        signatureDataUrl: null,
        isPresencial: true
      });
    } catch (err) {
      console.error('Erro ao pré-visualizar PDF de material:', err);
      showToast(`Erro ao pré-visualizar PDF de material: ${err.message}`, 'error');
    }
  };

  // Ação: Baixar PDF do Pedido de Material Didático (Livraria do Pensador LTDA)
  const handleDownloadMaterialPDF = () => {
    try {
      const data = buildEnrollmentDataObject();
      downloadMaterialOrderPDF(data);
      showToast(`PDF do Pedido de Material Didático baixado com sucesso!`);
    } catch (err) {
      console.error('Erro ao gerar PDF de material:', err);
      showToast(`Erro ao gerar PDF de material: ${err.message}`, 'error');
    }
  };

  // Ação: Baixar Ambos os Contratos (Requerimento + Material Didático)
  const handleDownloadAllPDF = () => {
    try {
      const data = buildEnrollmentDataObject();
      downloadAllContractsPDF(data);
      showToast(`Pacote completo de contratos baixado com sucesso!`);
    } catch (err) {
      console.error('Erro ao baixar ambos os PDFs:', err);
      showToast(`Erro: ${err.message}`, 'error');
    }
  };

  // Ação: Gerar Link para Assinatura Online (com Hash SHA-256 e Auditoria pelo Portal)
  const handleGenerateOnlineLink = async () => {
    // Salvar antes para garantir que os dados fiquem sincronizados
    const enrollmentData = buildEnrollmentDataObject();
    enrollmentData.isPresencial = false;
    delete enrollmentData.signatureSha256;

    const updatedStudent = {
      ...(selectedStudent || {}),
      id: selectedStudent ? selectedStudent.id : `std-${formData.rmNumber}`,
      rmNumber: formData.rmNumber,
      cocCode: formData.rmNumber,
      name: formData.studentName,
      studentName: formData.studentName,
      studentBirthCity: cleanCityName(formData.studentBirthCity),
      studentBirthState: formData.studentBirthState,
      currentGrade: formData.currentGrade,
      courseLevel: formData.courseLevel,
      schoolShift: formData.schoolShift,
      guardians: [
        {
          guardianName: formData.guardianName,
          guardianRelation: formData.guardianRelation,
          guardianCpf: formData.guardianCpf,
          guardianRg: formData.guardianRg,
          guardianEmail: formData.guardianEmail,
          guardianPhone: formData.guardianPhone,
          guardianAddressState: formData.guardianAddressState,
          guardianAddressCity: formData.guardianAddressCity
        }
      ]
    };

    saveReenrollment(enrollmentData, updatedStudent);

    // Gerar proposta ou recuperar ID
    const proposal = await createEnrollmentProposal(enrollmentData);
    const linkUrl = `${window.location.origin}/#matricular/${proposal.id}?code=${proposal.accessCode || 'ROD-2027'}`;

    setOnlineLinkModal({
      id: proposal.id,
      code: proposal.accessCode || 'ROD-2027',
      url: linkUrl,
      studentName: formData.studentName,
      guardianName: formData.guardianName,
      guardianPhone: formData.guardianPhone,
      guardianEmail: formData.guardianEmail
    });

    showToast('Link de assinatura online gerado com sucesso!');
  };

  // Filtragem da Lista de Estudantes por Nome ou RM (Insensível a acentos e maiúsculas/minúsculas)
  const cleanQuery = removeAccents(searchQuery);
  const filteredStudents = selectedStudentIdFilter
    ? students.filter(student => student.id === selectedStudentIdFilter)
    : (cleanQuery
        ? students.filter(student => {
            const name = removeAccents(student.studentName || student.name || '');
            const rm = String(student.rmNumber || student.cocCode || '').toLowerCase();
            return name.includes(cleanQuery) || rm.includes(cleanQuery);
          })
        : []);

  // Estatísticas Rápidas
  const totalStudents = students.length;
  const reenrolledCount = enrollments.filter(e => e.status === 'reenrolled').length;
  const pendingCount = Math.max(0, totalStudents - reenrolledCount);
  const renewalRate = totalStudents > 0 ? Math.round((reenrolledCount / totalStudents) * 100) : 0;

  // Listas de cidades dinâmicas baseadas na UF selecionada
  const studentCitiesList = getCitiesByUF(formData.studentBirthState, formData.studentBirthCity);
  const guardianCitiesList = getCitiesByUF(formData.guardianAddressState, formData.guardianAddressCity);

  // Status de pendência individual para direcionamento inteligente
  const isOnlySchoolPending = formData.schoolContractStatus === 'pending' && formData.materialContractStatus === 'signed';
  const isOnlyMaterialPending = formData.schoolContractStatus === 'signed' && formData.materialContractStatus === 'pending';
  const isOnlyOnePending = isOnlySchoolPending || isOnlyMaterialPending;

  // Cálculo do valor à vista da anuidade total com 5% de desconto sobre o valor integral
  const totalTuitionNumber = parseBRLToNumber(formData.tuitionGrossTotal);
  const tuitionAvistaWithDiscount = totalTuitionNumber > 0 ? (totalTuitionNumber * 0.95) : 0;

  // =========================================================================
  // MODO 2: FLUXO EM 5 ETAPAS (ESTUDANTE, RESPONSÁVEL, MATERIAL, ANUIDADE, DOWNLOADS)
  // =========================================================================
  if (selectedStudent) {
    return (
      <div ref={wizardTopRef} className="w-full space-y-6 pb-20 animate-fadeIn">
        {/* Top Header Fixo da Rematrícula */}
        <div className="sticky top-0 z-30 bg-[#1E293B] text-white p-5 sm:p-7 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-700/50">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedStudent(null)}
              className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
              title="Voltar para a Lista de Rematrícula"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#FED7AA]">
                  Rematrícula {formData.academicYear || 2027}
                </span>
              </div>
              <h1 className="text-[20px] sm:text-[24px] font-black leading-tight">
                {formData.studentName || 'Ficha de Rematrícula'}
              </h1>
              <p className="text-[12px] text-[#94A3B8]">
                Série Atual: <strong className="text-white">{selectedStudent.currentGrade}</strong> → Nova Série 2027: <strong className="text-[#F45206]">{formData.currentGrade}</strong> • RM: <strong className="text-white">{formData.rmNumber}</strong>
              </p>
            </div>
          </div>

          {/* Botões Superiores de Ação Rápida */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            {/* Botão Alternar Contrato de Anuidade */}
            <button
              type="button"
              onClick={handleToggleSchoolContractStatus}
              className={`!py-2 !px-3.5 text-[11.5px] font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border ${
                formData.schoolContractStatus === 'signed'
                  ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] hover:bg-[#D1FAE5]'
                  : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA] hover:bg-[#FEE2E2]'
              }`}
              title="Clique para alternar o status do Contrato de Anuidade (Assinado / Pendente)"
            >
              {formData.schoolContractStatus === 'signed' ? <CheckCircle2 size={14} /> : <Clock size={14} className="text-[#DC2626]" />}
              <span>Anuidade: {formData.schoolContractStatus === 'signed' ? '✓ Assinado' : 'Pendente'}</span>
            </button>

            {/* Botão Alternar Material Didático */}
            <button
              type="button"
              onClick={handleToggleMaterialContractStatus}
              className={`!py-2 !px-3.5 text-[11.5px] font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border ${
                formData.materialContractStatus === 'signed'
                  ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] hover:bg-[#D1FAE5]'
                  : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA] hover:bg-[#FEE2E2]'
              }`}
              title="Clique para alternar o status do Pedido de Material (Assinado / Pendente)"
            >
              {formData.materialContractStatus === 'signed' ? <CheckCircle2 size={14} /> : <Clock size={14} className="text-[#DC2626]" />}
              <span>Material: {formData.materialContractStatus === 'signed' ? '✓ Assinado' : 'Pendente'}</span>
            </button>

            {/* Indicador Interativo de Salvamento Automático em Tempo Real */}
            <button
              type="button"
              onClick={() => handleSaveContractData(false)}
              className={`!py-2 !px-3 text-[11.5px] font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border ${
                autoSaveStatus === 'saving'
                  ? 'bg-amber-500/20 text-[#FED7AA] border-amber-500/30'
                  : 'bg-white/10 text-white/95 border-white/20 hover:bg-white/15'
              }`}
              title="Alterações salvas automaticamente. Clique para forçar salvamento manual."
            >
              {autoSaveStatus === 'saving' ? (
                <>
                  <RefreshCw size={13} className="animate-spin text-[#FED7AA]" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={13} className="text-[#10B981]" />
                  <span>Salvo automático</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* STEPPER DE ETAPAS INTERATIVO (1 A 5) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { step: 1, title: '1. Estudante', desc: 'Dados e Documentos', icon: GraduationCap },
            { step: 2, title: '2. Responsável', desc: 'Financeiro e Endereço', icon: Users },
            { step: 3, title: '3. Anuidade', desc: 'Plano Escolar 2027', icon: DollarSign },
            { step: 4, title: '4. Material Didático', desc: 'Livraria do Pensador', icon: BookOpen },
            { step: 5, title: "5. Download's 2027", desc: 'Baixar Contratos', icon: FileSignature }
          ].map((s) => {
            const Icon = s.icon;
            const isActive = currentStep === s.step;
            const isPast = currentStep > s.step;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => handleStepChange(s.step)}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  isActive
                    ? 'bg-white border-[#F45206] shadow-md ring-2 ring-[#F45206]/20'
                    : isPast
                    ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46] hover:bg-[#D1FAE5]'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                  isActive
                    ? 'bg-[#F45206] text-white shadow-sm'
                    : isPast
                    ? 'bg-[#059669] text-white'
                    : 'bg-[#E2E8F0] text-[#64748B]'
                }`}>
                  {isPast ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <div className="min-w-0">
                  <span className="text-[12px] font-black block truncate text-[#1E293B]">{s.title}</span>
                  <span className="text-[10px] text-[#64748B] block truncate">{s.desc}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* =================================================================
            CONTEÚDO DA ETAPA ATIVA
           ================================================================= */}
        <div className="space-y-6">
          {/* ETAPA 1: DADOS DO ESTUDANTE (ACADÊMICOS E PESSOAIS) */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              {/* PAINEL ACADÊMICO */}
              <div className="rodin-panel-card !p-5 sm:!p-7 space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#E2E8F0]">
                  <GraduationCap size={22} className="text-[#F45206]" />
                  <h2 className="text-[16px] sm:text-[18px] font-black text-[#1E293B]">
                    1.1 - DADOS ACADÊMICOS DO ESTUDANTE
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">Nível de Ensino / Curso:</label>
                    <select
                      value={formData.courseLevel === 'Ensino Fundamental II' ? 'Ensino Fundamental' : formData.courseLevel}
                      onChange={(e) => {
                        const newLevel = e.target.value;
                        const isMedio = newLevel === 'Ensino Médio';
                        const currentIsMedio = formData.currentGrade.includes('EM') || formData.currentGrade.includes('Série');
                        let nextGrade = formData.currentGrade;
                        if (isMedio && !currentIsMedio) nextGrade = '1ª Série EM';
                        if (!isMedio && currentIsMedio) nextGrade = '6º Ano EF';

                        const nominal = getNominalTuitionForGrade(nextGrade);
                        const mat = getStandardMaterialForGrade(nextGrade);
                        const countInst = parseInt(formData.installmentsCount) || 13;
                        const nominalNum = parseBRLToNumber(nominal);
                        const pctRaw = parseFloat(formData.tuitionDiscountPercentage) || 0;
                        const pctDec = pctRaw > 1 ? pctRaw / 100 : pctRaw;
                        const discountedNum = Math.max(0, nominalNum * (1 - pctDec));
                        const grossVal = formatNumberToBRL(pctDec > 0 ? discountedNum : nominalNum);
                        const parcVal = formatNumberToBRL(countInst > 0 ? (parseBRLToNumber(grossVal) / countInst) : parseBRLToNumber(grossVal));

                        setFormData({ 
                          ...formData, 
                          courseLevel: newLevel, 
                          currentGrade: nextGrade,
                          tuitionNominalTotal: nominal,
                          tuitionGrossTotal: grossVal,
                          tuitionDiscountTotal: grossVal,
                          firstInstallmentValue: parcVal,
                          regularInstallmentValue: parcVal,
                          materialTotalValue: mat.total,
                          materialTotalExtenso: mat.extenso,
                          materialInstallmentValue: mat.installmentValue,
                          materialInstallmentExtenso: mat.installmentExtenso
                        });
                      }}
                      className="form-select font-bold cursor-pointer"
                    >
                      <option value="Ensino Fundamental">Ensino Fundamental</option>
                      <option value="Ensino Médio">Ensino Médio</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Série / Ano de Rematrícula:</label>
                    <select
                      value={formData.currentGrade}
                      onChange={(e) => {
                        const nextGrade = e.target.value;
                        const nominal = getNominalTuitionForGrade(nextGrade);
                        const mat = getStandardMaterialForGrade(nextGrade);
                        const countInst = parseInt(formData.installmentsCount) || 13;
                        const nominalNum = parseBRLToNumber(nominal);
                        const pctRaw = parseFloat(formData.tuitionDiscountPercentage) || 0;
                        const pctDec = pctRaw > 1 ? pctRaw / 100 : pctRaw;
                        const discountedNum = Math.max(0, nominalNum * (1 - pctDec));
                        const grossVal = formatNumberToBRL(pctDec > 0 ? discountedNum : nominalNum);
                        const parcVal = formatNumberToBRL(countInst > 0 ? (parseBRLToNumber(grossVal) / countInst) : parseBRLToNumber(grossVal));

                        setFormData({ 
                          ...formData, 
                          currentGrade: nextGrade,
                          tuitionNominalTotal: nominal,
                          tuitionGrossTotal: grossVal,
                          tuitionDiscountTotal: grossVal,
                          firstInstallmentValue: parcVal,
                          regularInstallmentValue: parcVal,
                          materialTotalValue: mat.total,
                          materialTotalExtenso: mat.extenso,
                          materialInstallmentValue: mat.installmentValue,
                          materialInstallmentExtenso: mat.installmentExtenso
                        });
                      }}
                      className="form-select font-bold text-[#F45206] cursor-pointer"
                    >
                      {formData.courseLevel === 'Ensino Médio' ? (
                        <>
                          <option value="1ª Série EM">1ª Série EM</option>
                          <option value="2ª Série EM">2ª Série EM</option>
                          <option value="3ª Série EM">3ª Série EM</option>
                        </>
                      ) : (
                        <>
                          <option value="6º Ano EF">6º Ano EF</option>
                          <option value="7º Ano EF">7º Ano EF</option>
                          <option value="8º Ano EF">8º Ano EF</option>
                          <option value="9º Ano EF">9º Ano EF</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Turno:</label>
                    <select
                      value={formData.schoolShift || 'Manhã'}
                      onChange={(e) => setFormData({ ...formData, schoolShift: e.target.value })}
                      className="form-select font-bold"
                    >
                      <option value="Manhã">Manhã</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Integral">Integral</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* PAINEL PESSOAL DO ESTUDANTE */}
              <div className="rodin-panel-card !p-5 sm:!p-7 space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#E2E8F0]">
                  <UserCheck size={22} className="text-[#F45206]" />
                  <h2 className="text-[16px] sm:text-[18px] font-black text-[#1E293B]">
                    1.2 - DADOS PESSOAIS E DOCUMENTAÇÃO DO ESTUDANTE
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="form-group sm:col-span-2">
                    <label className="form-label">Nome Completo do Estudante: *</label>
                    <input
                      type="text"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      className="form-control font-bold"
                      placeholder="Nome completo do aluno"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sexo:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Masc.', 'Fem.'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setFormData({ ...formData, studentGender: g })}
                          className={`h-[42px] rounded-xl font-bold text-[13px] border transition-all flex items-center justify-center ${
                            formData.studentGender === g
                              ? 'bg-[#F45206] text-white border-[#F45206]'
                              : 'bg-white text-[#64748B] border-[#E2E8F0]'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Data de Nascimento:</label>
                    <input
                      type="date"
                      value={toInputDateFormat(formData.studentBirthDate)}
                      onChange={(e) => setFormData({ ...formData, studentBirthDate: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  {/* UF de Nascimento */}
                  <div className="form-group">
                    <label className="form-label">UF de Nascimento:</label>
                    <select
                      value={formData.studentBirthState}
                      onChange={(e) => {
                        const newUf = e.target.value;
                        const availableCities = getCitiesByUF(newUf);
                        const defaultCity = availableCities.includes(cleanCityName(formData.studentBirthCity))
                          ? cleanCityName(formData.studentBirthCity)
                          : (availableCities[0] || 'Indaiatuba');
                        setFormData({
                          ...formData,
                          studentBirthState: newUf,
                          studentBirthCity: defaultCity
                        });
                      }}
                      className="form-select font-bold cursor-pointer"
                    >
                      {BRAZILIAN_UFS.map((uf) => (
                        <option key={uf.uf} value={uf.uf}>{uf.uf} — {uf.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Cidade de Nascimento */}
                  <div className="form-group">
                    <label className="form-label">Cidade de Nascimento:</label>
                    <select
                      value={cleanCityName(formData.studentBirthCity)}
                      onChange={(e) => setFormData({ ...formData, studentBirthCity: cleanCityName(e.target.value) })}
                      className="form-select font-bold cursor-pointer"
                    >
                      {studentCitiesList.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nacionalidade:</label>
                    <input
                      type="text"
                      value={formData.studentNationality}
                      onChange={(e) => setFormData({ ...formData, studentNationality: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">RG do Estudante:</label>
                    <input
                      type="text"
                      value={formData.studentRg}
                      onChange={(e) => setFormData({ ...formData, studentRg: e.target.value })}
                      className="form-control font-mono font-bold"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Órgão Expedidor:</label>
                    <input
                      type="text"
                      value={formData.studentRgIssuer}
                      onChange={(e) => setFormData({ ...formData, studentRgIssuer: e.target.value })}
                      className="form-control font-mono uppercase"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Data de Emissão do RG:</label>
                    <input
                      type="date"
                      value={toInputDateFormat(formData.studentRgIssueDate)}
                      onChange={(e) => setFormData({ ...formData, studentRgIssueDate: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">CPF do Estudante:</label>
                    <input
                      type="text"
                      value={formData.studentCpf}
                      onChange={(e) => setFormData({ ...formData, studentCpf: e.target.value })}
                      className="form-control font-mono font-bold"
                    />
                  </div>

                  <div className="form-group sm:col-span-2">
                    <label className="form-label">Tel. Celular / WhatsApp do Estudante:</label>
                    <input
                      type="text"
                      value={formData.studentPhone}
                      onChange={(e) => setFormData({ ...formData, studentPhone: e.target.value })}
                      placeholder="(19) 90000-0000"
                      className="form-control font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 2: RESPONSÁVEL FINANCEIRO & ENDEREÇO */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              {/* PAINEL DO RESPONSÁVEL */}
              <div className="rodin-panel-card !p-5 sm:!p-7 space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#E2E8F0]">
                  <Users size={22} className="text-[#F45206]" />
                  <h2 className="text-[16px] sm:text-[18px] font-black text-[#1E293B]">
                    2.1 - QUALIFICAÇÃO DO RESPONSÁVEL FINANCEIRO (SIGNATÁRIO)
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="form-group">
                    <label className="form-label">Parentesco:</label>
                    <select
                      value={(() => {
                        const val = formData.guardianRelation;
                        if (['Pai', 'Mãe', 'Avô', 'Avó', 'Outro'].includes(val)) return val;
                        if (val === 'Avô / Avó' || val === 'Avô/Avó') return 'Avô';
                        if (val === 'Outro Responsável' || val === 'Tutor(a) Legal') return 'Outro';
                        return val || 'Pai';
                      })()}
                      onChange={(e) => setFormData({ ...formData, guardianRelation: e.target.value })}
                      className="form-select font-bold"
                    >
                      <option value="Pai">Pai</option>
                      <option value="Mãe">Mãe</option>
                      <option value="Avô">Avô</option>
                      <option value="Avó">Avó</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div className="form-group sm:col-span-2">
                    <label className="form-label">Nome Completo do Responsável: *</label>
                    <input
                      type="text"
                      value={formData.guardianName}
                      onChange={(e) => handleGuardianFieldChange('guardianName', e.target.value)}
                      className="form-control font-bold"
                      placeholder="Nome completo do responsável financeiro"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sexo do Responsável:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Masc.', 'Fem.'].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setFormData({ ...formData, guardianGender: g })}
                          className={`h-[42px] rounded-xl font-bold text-[13px] border transition-all flex items-center justify-center ${
                            formData.guardianGender === g
                              ? 'bg-[#F45206] text-white border-[#F45206]'
                              : 'bg-white text-[#64748B] border-[#E2E8F0]'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Data Nasc. Responsável:</label>
                    <input
                      type="date"
                      value={toInputDateFormat(formData.guardianBirthDate)}
                      onChange={(e) => setFormData({ ...formData, guardianBirthDate: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ocupação / Profissão:</label>
                    <input
                      type="text"
                      value={formData.guardianOccupation}
                      onChange={(e) => setFormData({ ...formData, guardianOccupation: e.target.value })}
                      className="form-control"
                      placeholder="Ex: Engenheiro(a), Advogado(a)"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estado Civil:</label>
                    <select
                      value={formData.guardianMaritalStatus}
                      onChange={(e) => setFormData({ ...formData, guardianMaritalStatus: e.target.value })}
                      className="form-select"
                    >
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viuvo(a)">Viúvo(a)</option>
                      <option value="União Estável">União Estável</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">RG do Responsável:</label>
                    <input
                      type="text"
                      value={formData.guardianRg}
                      onChange={(e) => setFormData({ ...formData, guardianRg: e.target.value })}
                      className="form-control font-mono font-bold"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Órgão Expedidor:</label>
                    <input
                      type="text"
                      value={formData.guardianRgIssuer}
                      onChange={(e) => setFormData({ ...formData, guardianRgIssuer: e.target.value })}
                      className="form-control font-mono uppercase"
                    />
                  </div>

                  <div className="form-group sm:col-span-2">
                    <label className="form-label">CPF do Responsável Financeiro: *</label>
                    <input
                      type="text"
                      value={formData.guardianCpf}
                      onChange={(e) => handleGuardianFieldChange('guardianCpf', e.target.value)}
                      className="form-control font-mono font-bold"
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nacionalidade:</label>
                    <input
                      type="text"
                      value={formData.guardianNationality}
                      onChange={(e) => setFormData({ ...formData, guardianNationality: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  <div className="form-group sm:col-span-2">
                    <label className="form-label">E-mail do Responsável: *</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="email"
                        value={formData.guardianEmail}
                        onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                        className="form-control !pl-10 font-bold"
                        placeholder="responsavel@email.com"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tel. Celular / WhatsApp: *</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                      <input
                        type="text"
                        value={formData.guardianPhone}
                        onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                        placeholder="(19) 90000-0000"
                        className="form-control !pl-10 font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PAINEL DE ENDEREÇO RESIDENCIAL */}
              <div className="rodin-panel-card !p-5 sm:!p-7 space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#E2E8F0]">
                  <MapPin size={22} className="text-[#F45206]" />
                  <h2 className="text-[16px] sm:text-[18px] font-black text-[#1E293B]">
                    2.2 - ENDEREÇO RESIDENCIAL DO RESPONSÁVEL
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* CEP com Busca Automática ViaCEP */}
                  <div className="form-group">
                    <label className="form-label">CEP Residencial: *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.guardianAddressCep}
                        onChange={(e) => handleCepLookup(e.target.value)}
                        placeholder="13330-000"
                        maxLength={9}
                        className="form-control font-mono font-bold"
                      />
                      {isLoadingCep && (
                        <div className="absolute right-3 top-2.5 text-[#F45206]">
                          <Sparkles size={16} className="animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group sm:col-span-2">
                    <label className="form-label">Rua / Logradouro: *</label>
                    <input
                      type="text"
                      value={formData.guardianAddressStreet}
                      onChange={(e) => setFormData({ ...formData, guardianAddressStreet: e.target.value })}
                      className="form-control font-bold"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Número: *</label>
                    <input
                      type="text"
                      value={formData.guardianAddressNumber}
                      onChange={(e) => setFormData({ ...formData, guardianAddressNumber: e.target.value })}
                      className="form-control font-bold"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Complemento:</label>
                    <input
                      type="text"
                      value={formData.guardianAddressComplement}
                      onChange={(e) => setFormData({ ...formData, guardianAddressComplement: e.target.value })}
                      placeholder="Apto, Bloco, etc."
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bairro: *</label>
                    <input
                      type="text"
                      value={formData.guardianAddressNeighborhood}
                      onChange={(e) => setFormData({ ...formData, guardianAddressNeighborhood: e.target.value })}
                      className="form-control"
                    />
                  </div>

                  {/* UF do Endereço */}
                  <div className="form-group">
                    <label className="form-label">UF do Endereço: *</label>
                    <select
                      value={formData.guardianAddressState}
                      onChange={(e) => {
                        const newUf = e.target.value;
                        const availableCities = getCitiesByUF(newUf);
                        const defaultCity = availableCities.includes(cleanCityName(formData.guardianAddressCity))
                          ? cleanCityName(formData.guardianAddressCity)
                          : (availableCities[0] || 'Indaiatuba');
                        setFormData({
                          ...formData,
                          guardianAddressState: newUf,
                          guardianAddressCity: defaultCity
                        });
                      }}
                      className="form-select font-bold cursor-pointer"
                    >
                      {BRAZILIAN_UFS.map((uf) => (
                        <option key={uf.uf} value={uf.uf}>{uf.uf} — {uf.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Cidade do Endereço */}
                  <div className="form-group">
                    <label className="form-label">Cidade: *</label>
                    <select
                      value={cleanCityName(formData.guardianAddressCity)}
                      onChange={(e) => setFormData({ ...formData, guardianAddressCity: cleanCityName(e.target.value) })}
                      className="form-select font-bold cursor-pointer"
                    >
                      {guardianCitiesList.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 3: ANUIDADE ESCOLAR & CONDIÇÕES FINANCEIRAS (BALDER EDUCACIONAL) */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rodin-panel-card !p-5 sm:!p-7 space-y-6">
                {/* Cabeçalho Padronizado */}
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#E2E8F0]">
                  <DollarSign size={24} className="text-[#F45206]" />
                  <div>
                    <h2 className="text-[17px] sm:text-[19px] font-black text-[#1E293B]">
                      3. ANUIDADE ESCOLAR 2027
                    </h2>
                  </div>
                </div>

                {/* Bloco 1: Valores da Anuidade e Desconto Oficial (Padrão e Sem Duplicações) */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Campo 1: Valor Normal (Fixo e Padrão da Série - Não Alterável) */}
                    <div className="form-group">
                      <label className="form-label">Valor Normal:</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-[12px] text-[#94A3B8] pointer-events-none">
                          R$
                        </span>
                        <input
                          type="text"
                          readOnly
                          value={formData.tuitionNominalTotal || getNominalTuitionForGrade(formData.currentGrade)}
                          className="form-control !pl-10 font-black text-[#475569] bg-[#F8FAFC] border-[#CBD5E1] cursor-not-allowed"
                          title="Valor nominal padrão da série conforme tabela oficial Colégio Rodin 2027 (não editável)"
                        />
                      </div>
                    </div>

                    {/* Campo 2: Desconto (%) - Digitado diretamente de 0 a 100% */}
                    <div className="form-group">
                      <label className="form-label">Desconto (%):</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={(() => {
                            const raw = formData.tuitionDiscountPercentage;
                            if (raw === undefined || raw === null || raw === '') return 0;
                            const num = Number(raw);
                            if (isNaN(num)) return 0;
                            return num > 1 ? num : Math.round(num * 10000) / 100;
                          })()}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              handleDiscountPercentageChange(0);
                              return;
                            }
                            let num = parseFloat(val);
                            if (isNaN(num)) num = 0;
                            if (num < 0) num = 0;
                            if (num > 100) num = 100;
                            handleDiscountPercentageChange(num);
                          }}
                          className="form-control font-black text-[16px] text-[#1E293B] border-[#CBD5E1] bg-white focus:border-[#4338CA] focus:ring-1 focus:ring-[#4338CA]"
                          placeholder="0"
                          title="Digite a porcentagem de desconto de 0% a 100%"
                        />
                      </div>
                    </div>

                    {/* Campo 3: Valor de Contrato (Final com Desconto - Travado / Calculado pelo Desconto) */}
                    <div className="form-group">
                      <label className="form-label">Valor de Contrato: *</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-[12px] text-[#94A3B8] pointer-events-none">
                          R$
                        </span>
                        <input
                          type="text"
                          readOnly
                          value={formData.tuitionGrossTotal}
                          className="form-control !pl-10 font-black text-[16px] text-[#1E293B] bg-[#F8FAFC] border-[#CBD5E1] cursor-not-allowed"
                          title="Valor final da anuidade para o contrato escolar (calculado automaticamente pelo percentual de desconto)"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Observações / Detalhes do Desconto */}
                  <div className="form-group">
                    <label className="form-label">Descrição do Desconto:</label>
                    <input
                      type="text"
                      list="form-planilha-descriptions"
                      value={formData.tuitionDiscountReason || ''}
                      onChange={(e) => setFormData({ ...formData, tuitionDiscountReason: e.target.value })}
                      className="form-control font-medium text-[#1E293B] bg-white border-[#CBD5E1]"
                      placeholder="Ex: Parceria Le Perini 25% na anuidade"
                    />
                    <datalist id="form-planilha-descriptions">
                      {SPREADSHEET_DISCOUNT_DESCRIPTIONS.map((desc, idx) => (
                        <option key={idx} value={desc} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <hr className="border-[#E2E8F0]" />

                {/* Bloco 2: Condições de Pagamento e Parcelamento */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-[#F45206]" />
                    <span className="text-[13.5px] font-bold text-[#1E293B]">
                      Plano de Pagamento
                    </span>
                  </div>

                  {/* Formulário Dinâmico: À Vista vs Parcelado */}
                  {formData.paymentPlanChoice === '1_avista_5off' || formData.paymentPlanChoice === '1' ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="form-group">
                          <label className="form-label">Valor de Contrato: *</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-[12px] text-[#94A3B8] pointer-events-none">
                              R$
                            </span>
                            <input
                              type="text"
                              readOnly
                              value={formData.tuitionGrossTotal}
                              className="form-control !pl-10 font-black text-[16px] text-[#1E293B] bg-[#F8FAFC] border-[#CBD5E1] cursor-not-allowed"
                              title="Valor final da anuidade para o contrato escolar (calculado automaticamente pelo percentual de desconto)"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Número de Parcelas:</label>
                          <select
                            value={formData.paymentPlanChoice}
                            onChange={(e) => {
                              const choice = e.target.value;
                              handleCalculateInstallments(formData.tuitionGrossTotal, choice);
                            }}
                            className="form-select font-bold"
                          >
                            <option value="1_avista_5off">
                              1x de R$ {formatNumberToBRL(tuitionAvistaWithDiscount)} (à vista com 5% de desconto)
                            </option>
                            <option value="13">13 parcelas mensais</option>
                            <option value="12">12 parcelas mensais</option>
                            <option value="11">11 parcelas mensais</option>
                            <option value="10">10 parcelas mensais</option>
                            <option value="9">9 parcelas mensais</option>
                            <option value="8">8 parcelas mensais</option>
                            <option value="7">7 parcelas mensais</option>
                            <option value="6">6 parcelas mensais</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="form-group">
                          <label className="form-label">Valor com 5% de Desconto (À Vista):</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-[12px] text-[#94A3B8] pointer-events-none">
                              R$
                            </span>
                            <input
                              type="text"
                              value={formData.firstInstallmentValue}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^\d.,]/g, '');
                                const maxTotal = parseBRLToNumber(formData.tuitionGrossTotal);
                                const num = parseBRLToNumber(raw);
                                if (maxTotal > 0 && num > maxTotal) {
                                  handleCalculateInstallments(formData.tuitionGrossTotal, formData.paymentPlanChoice, formatNumberToBRL(maxTotal));
                                  return;
                                }
                                handleCalculateInstallments(formData.tuitionGrossTotal, formData.paymentPlanChoice, raw);
                              }}
                              onBlur={(e) => {
                                const maxTotal = parseBRLToNumber(formData.tuitionGrossTotal);
                                let num = parseBRLToNumber(e.target.value);
                                if (maxTotal > 0 && num > maxTotal) {
                                  num = maxTotal;
                                }
                                if (num > 0) {
                                  const formatted = formatNumberToBRL(num);
                                  handleCalculateInstallments(formData.tuitionGrossTotal, formData.paymentPlanChoice, formatted);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                              }}
                              className="form-control !pl-10 font-black text-[#15803D]"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Data do Pagamento:</label>
                          <input
                            type="date"
                            value={toInputDateFormat(formData.paymentDate || formData.quotaDueDate || '')}
                            onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value, quotaDueDate: e.target.value })}
                            className="form-control font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Linha 1: Valor de Contrato e Número de Parcelas */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="form-group">
                          <label className="form-label">Valor de Contrato: *</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-[12px] text-[#94A3B8] pointer-events-none">
                              R$
                            </span>
                            <input
                              type="text"
                              readOnly
                              value={formData.tuitionGrossTotal}
                              className="form-control !pl-10 font-black text-[16px] text-[#1E293B] bg-[#F8FAFC] border-[#CBD5E1] cursor-not-allowed"
                              title="Valor final da anuidade para o contrato escolar (calculado automaticamente pelo percentual de desconto)"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Número de Parcelas:</label>
                          <select
                            value={formData.paymentPlanChoice}
                            onChange={(e) => {
                              const choice = e.target.value;
                              handleCalculateInstallments(formData.tuitionGrossTotal, choice);
                            }}
                            className="form-select font-bold"
                          >
                            <option value="1_avista_5off">
                              1x de R$ {formatNumberToBRL(tuitionAvistaWithDiscount)} (à vista com 5% de desconto)
                            </option>
                            <option value="13">13 parcelas mensais</option>
                            <option value="12">12 parcelas mensais</option>
                            <option value="11">11 parcelas mensais</option>
                            <option value="10">10 parcelas mensais</option>
                            <option value="9">9 parcelas mensais</option>
                            <option value="8">8 parcelas mensais</option>
                            <option value="7">7 parcelas mensais</option>
                            <option value="6">6 parcelas mensais</option>
                          </select>
                        </div>
                      </div>

                      {/* Linha 2: Tudo da 1ª Parcela */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="form-group">
                          <label className="form-label">Valor da 1ª Parcela:</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-[12px] text-[#94A3B8] pointer-events-none">
                              R$
                            </span>
                            <input
                              type="text"
                              value={formData.firstInstallmentValue}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^\d.,]/g, '');
                                const maxTotal = parseBRLToNumber(formData.tuitionGrossTotal);
                                const num = parseBRLToNumber(raw);
                                if (maxTotal > 0 && num > maxTotal) {
                                  handleCalculateInstallments(formData.tuitionGrossTotal, formData.paymentPlanChoice, formatNumberToBRL(maxTotal));
                                  return;
                                }
                                handleCalculateInstallments(formData.tuitionGrossTotal, formData.paymentPlanChoice, raw);
                              }}
                              onBlur={(e) => {
                                const maxTotal = parseBRLToNumber(formData.tuitionGrossTotal);
                                let num = parseBRLToNumber(e.target.value);
                                if (maxTotal > 0 && num > maxTotal) {
                                  num = maxTotal;
                                }
                                if (num > 0) {
                                  const formatted = formatNumberToBRL(num);
                                  handleCalculateInstallments(formData.tuitionGrossTotal, formData.paymentPlanChoice, formatted);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                                }
                              }}
                              className="form-control !pl-10 font-bold"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Parcelamento da 1ª Parcela (em até 3x):</label>
                          <select
                            value={Math.min(formData.firstInstallmentSplit || 1, 3)}
                            onChange={(e) => setFormData({ ...formData, firstInstallmentSplit: parseInt(e.target.value) || 1 })}
                            className="form-select font-bold"
                          >
                            {[1, 2, 3].map((split) => {
                              const firstNum = parseBRLToNumber(formData.firstInstallmentValue);
                              const val = firstNum > 0 ? (firstNum / split) : 0;
                              return (
                                <option key={split} value={split}>
                                  {`${split}x de R$ ${formatNumberToBRL(val)}`}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Vencimento das cotas da 1ª parcela:</label>
                          <input
                            type="text"
                            value={formData.quotaDueDate || '15'}
                            onChange={(e) => setFormData({ ...formData, quotaDueDate: e.target.value })}
                            className="form-control font-bold"
                            placeholder="15"
                          />
                        </div>
                      </div>

                      {/* Linha 3: Valor das Demais Parcelas e Vencimento das Demais Parcelas */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="form-group">
                          <label className="form-label">Valor das Demais Parcelas:</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-[12px] text-[#94A3B8] pointer-events-none">
                              R$
                            </span>
                            <input
                              type="text"
                              readOnly
                              value={formData.regularInstallmentValue}
                              className="form-control !pl-10 font-black bg-[#F1F5F9] cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Vencimento das Demais Parcelas:</label>
                          <input
                            type="text"
                            value={formData.installmentDueDate || '1'}
                            onChange={(e) => setFormData({ ...formData, installmentDueDate: e.target.value })}
                            className="form-control font-bold"
                            placeholder="1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 4: PEDIDO DE MATERIAL DIDÁTICO (LIVRARIA DO PENSADOR LTDA) */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rodin-panel-card !p-5 sm:!p-7 space-y-5">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#E2E8F0]">
                  <BookOpen size={24} className="text-[#F45206]" />
                  <div>
                    <h2 className="text-[17px] sm:text-[19px] font-black text-[#1E293B]">
                      4. PEDIDO DE MATERIAL DIDÁTICO (LIVRARIA DO PENSADOR LTDA)
                    </h2>
                  </div>
                </div>


                {/* Checkbox de Sincronização */}
                <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-[#CBD5E1] shadow-2xs">
                  <input
                    type="checkbox"
                    id="reenroll_isBuyerSameAsFinancial"
                    checked={formData.isBuyerSameAsFinancial}
                    onChange={(e) => handleToggleSameBuyer(e.target.checked)}
                    className="w-4 h-4 text-[#F45206] rounded border-[#CBD5E1] focus:ring-[#F45206]"
                  />
                  <label htmlFor="reenroll_isBuyerSameAsFinancial" className="text-[13px] font-bold text-[#1E293B] cursor-pointer">
                    Comprador do Material Didático é o mesmo Responsável Financeiro pela Anuidade.
                  </label>
                </div>

                {/* Dados do Comprador */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Nome do Comprador do Material Didático: *</label>
                    <input
                      type="text"
                      value={formData.materialBuyerName}
                      onChange={(e) => handleMaterialBuyerFieldChange('materialBuyerName', e.target.value)}
                      placeholder="Nome completo do comprador"
                      className="form-control font-bold"
                    />
                    <span className="text-[10.5px] text-[#64748B] mt-1 block">
                      Nome que constará no Pedido da Livraria do Pensador LTDA (não afeta o responsável escolar).
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">CPF do Comprador do Material: *</label>
                    <input
                      type="text"
                      value={formData.materialBuyerCpf}
                      onChange={(e) => handleMaterialBuyerFieldChange('materialBuyerCpf', e.target.value)}
                      placeholder="000.000.000-00"
                      className="form-control font-mono font-bold"
                    />
                    <span className="text-[10.5px] text-[#64748B] mt-1 block">
                      CPF para emissão do pedido e boletos bancários da Livraria.
                    </span>
                  </div>
                </div>

                {/* Condições Comerciais do Pedido de Material */}
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-4">
                  <div className="border-b border-[#E2E8F0] pb-2.5">
                    <strong className="text-[13.5px] font-black text-[#1E293B] block">
                      Condições Comerciais e Parcelamento do Material Didático
                    </strong>
                    <span className="text-[11px] text-[#64748B]">
                      Conforme tabela de valores e parcelas da Livraria do Pensador LTDA
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Valor Total */}
                    <div className="form-group">
                      <label className="form-label">Valor Total do Material Didático: *</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-[12px] text-[#94A3B8] pointer-events-none">
                          R$
                        </span>
                        <input
                          type="text"
                          readOnly
                          value={formData.materialTotalValue || '5.248,80'}
                          className="form-control !pl-10 font-black text-[#1E293B] bg-[#F8FAFC] border-[#CBD5E1] cursor-not-allowed"
                          title="Valor padrão fixo por série do material didático da Livraria do Pensador LTDA (não possui desconto)"
                        />
                      </div>
                    </div>

                    {/* Número de Parcelas */}
                    <div className="form-group">
                      <label className="form-label">Parcelas (Material Didático): *</label>
                      <select
                        value={formData.materialInstallmentsCount || '12'}
                        onChange={(e) => {
                          const nParc = parseInt(e.target.value) || 12;
                          const totalNum = parseBRLToNumber(formData.materialTotalValue);
                          const parcVal = nParc > 0 ? (totalNum / nParc) : totalNum;
                          setFormData({
                            ...formData,
                            materialInstallmentsCount: e.target.value,
                            materialInstallmentValue: formatNumberToBRL(parcVal)
                          });
                        }}
                        className="form-select font-bold text-[#4338CA] cursor-pointer"
                      >
                        {[12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((cnt) => (
                          <option key={cnt} value={String(cnt)}>
                            {cnt === 1 ? '1 parcela (à vista)' : `${cnt} parcelas mensais`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Valor de Cada Parcela */}
                    <div className="form-group">
                      <label className="form-label">Valor de Cada Parcela: *</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-[12px] text-[#94A3B8] pointer-events-none">
                          R$
                        </span>
                        <input
                          type="text"
                          readOnly
                          value={formData.materialInstallmentValue || ''}
                          className="form-control !pl-10 font-black text-[#4338CA] bg-[#F8FAFC] border-[#CBD5E1] cursor-not-allowed"
                          placeholder="0,00"
                          title="Valor de cada parcela do material didático (Livraria do Pensador)"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    {/* Início Vencimento */}
                    <div className="form-group">
                      <label className="form-label">Início do Vencimento: *</label>
                      <input
                        type="date"
                        value={toInputDateFormat(formData.materialStartDueDate)}
                        onChange={(e) => setFormData({ ...formData, materialStartDueDate: e.target.value })}
                        className="form-control font-bold text-[#1E293B]"
                      />
                    </div>

                    {/* Final Vencimento */}
                    <div className="form-group">
                      <label className="form-label">Término do Vencimento: *</label>
                      <input
                        type="date"
                        value={toInputDateFormat(formData.materialEndDueDate)}
                        onChange={(e) => setFormData({ ...formData, materialEndDueDate: e.target.value })}
                        className="form-control font-bold text-[#1E293B]"
                      />
                    </div>

                    {/* Forma de Cobrança */}
                    <div className="form-group">
                      <label className="form-label">Forma de Cobrança:</label>
                      <select
                        value={formData.materialPaymentMethod && formData.materialPaymentMethod.toLowerCase().includes('cart') ? 'Cartão de Crédito' : 'Boleto Bancário'}
                        onChange={(e) => setFormData({ ...formData, materialPaymentMethod: e.target.value })}
                        className="form-select font-bold text-[#1E293B] cursor-pointer"
                      >
                        <option value="Boleto Bancário">Boleto Bancário</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ETAPA 5: REVISÃO, ASSINATURA E DOWNLOADS DOS CONTRATOS EM ETAPAS */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="rodin-panel-card !p-5 sm:!p-7 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFF0E6] text-[#F45206] flex items-center justify-center shrink-0">
                      <FileSignature size={24} />
                    </div>
                    <div>
                      <h2 className="text-[17px] sm:text-[20px] font-black text-[#1E293B]">
                        5. Download's 2027
                      </h2>
                    </div>
                  </div>
                </div>

                {/* BANNER INTELIGENTE: ACELERAÇÃO QUANDO HÁ APENAS 1 CONTRATO PENDENTE (EM VERMELHO) */}
                {isOnlyMaterialPending && (
                  <div className="bg-gradient-to-r from-[#FEF2F2] via-[#FEE2E2]/70 to-[#FEF2F2] border-2 border-[#EF4444] p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#DC2626] text-white flex items-center justify-center shrink-0 shadow-md">
                        <BookOpen size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-[#DC2626] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                            Ação Pendente
                          </span>
                          <h4 className="text-[14.5px] font-black text-[#991B1B]">
                            Gerar Pedido de Material Didático (Pendente)
                          </h4>
                        </div>
                        <p className="text-[12px] text-[#B91C1C] mt-0.5">
                          O Requerimento de Anuidade já foi assinado! Resta apenas emitir e colher a assinatura do Material Didático.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={handlePreviewMaterialPDF}
                        className="btn-secondary-rodin !py-2.5 !px-3.5 text-[12px] !border-[#EF4444] !text-[#DC2626] bg-white shadow-xs hover:bg-[#FEF2F2]"
                      >
                        <Eye size={14} /> Ver PDF
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadMaterialPDF}
                        className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-black !py-2.5 !px-4 rounded-xl text-[12px] flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <Download size={14} /> Baixar PDF
                      </button>
                    </div>
                  </div>
                )}

                {isOnlySchoolPending && (
                  <div className="bg-gradient-to-r from-[#FEF2F2] via-[#FEE2E2]/70 to-[#FEF2F2] border-2 border-[#EF4444] p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#DC2626] text-white flex items-center justify-center shrink-0 shadow-md">
                        <FileSignature size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-[#DC2626] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                            Ação Pendente
                          </span>
                          <h4 className="text-[14.5px] font-black text-[#991B1B]">
                            Gerar Requerimento de Anuidade (Pendente)
                          </h4>
                        </div>
                        <p className="text-[12px] text-[#B91C1C] mt-0.5">
                          O Pedido de Material Didático já foi assinado! Resta apenas emitir e colher a assinatura da Anuidade Escolar.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={handlePreviewPDF}
                        className="btn-secondary-rodin !py-2.5 !px-3.5 text-[12px] !border-[#EF4444] !text-[#DC2626] bg-white shadow-xs hover:bg-[#FEF2F2]"
                      >
                        <Eye size={14} /> Ver PDF
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadPDF}
                        className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-black !py-2.5 !px-4 rounded-xl text-[12px] shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download size={14} /> Baixar PDF
                      </button>
                    </div>
                  </div>
                )}

                {/* BLOCO CENTRAL: DOWNLOADS DOS CONTRATOS */}
                <div className="p-4 sm:p-6 bg-gradient-to-br from-white to-[#FFF0E6]/50 border-2 border-[#FED7AA] rounded-3xl shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card 1: Requerimento de Matrícula (Balder) */}
                    <div className={`bg-white rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all ${
                      isOnlySchoolPending
                        ? 'ring-4 ring-[#DC2626]/20 border-2 border-[#DC2626] shadow-md relative'
                        : 'border border-[#CBD5E1] shadow-2xs hover:shadow-md'
                    }`}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-[14px] font-black text-[#1E293B] block">
                            Requerimento de Matrícula
                          </strong>
                          <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border shrink-0 ${
                            formData.schoolContractStatus === 'signed'
                              ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                              : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                          }`}>
                            {formData.schoolContractStatus === 'signed' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                            {formData.schoolContractStatus === 'signed' ? 'Assinado' : 'Pendente'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handlePreviewPDF}
                            className={`btn-secondary-rodin !py-2 !px-3 text-[11.5px] flex-1 justify-center ${
                              isOnlySchoolPending ? '!border-[#EF4444]/40 !text-[#DC2626]' : ''
                            }`}
                          >
                            <Eye size={13} /> Ver PDF
                          </button>
                          <button
                            type="button"
                            onClick={handleDownloadPDF}
                            className={`!py-2 !px-3 text-[11.5px] flex-1 justify-center rounded-xl font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer ${
                              isOnlySchoolPending
                                ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
                                : 'btn-primary-rodin'
                            }`}
                          >
                            <Download size={13} /> Baixar
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleToggleSchoolContractStatus}
                          className={`w-full text-[11px] font-bold py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            formData.schoolContractStatus === 'signed'
                              ? 'bg-[#F8FAFC] text-[#64748B] border-[#CBD5E1] hover:bg-[#F1F5F9]'
                              : 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] hover:bg-[#D1FAE5]'
                          }`}
                        >
                          {formData.schoolContractStatus === 'signed' ? 'Reverter Status para Pendente' : '✓ Marcar Anuidade como Assinada'}
                        </button>
                      </div>
                    </div>

                    {/* Card 2: Pedido de Material Didático (Pensador) */}
                    <div className={`bg-white rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all ${
                      isOnlyMaterialPending
                        ? 'ring-4 ring-[#DC2626]/20 border-2 border-[#DC2626] shadow-md relative'
                        : 'border border-[#CBD5E1] shadow-2xs hover:shadow-md'
                    }`}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-[14px] font-black text-[#1E293B] block">
                            Pedido de Material Didático
                          </strong>
                          <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border shrink-0 ${
                            formData.materialContractStatus === 'signed'
                              ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                              : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                          }`}>
                            {formData.materialContractStatus === 'signed' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                            {formData.materialContractStatus === 'signed' ? 'Assinado' : 'Pendente'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-[#F1F5F9]">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handlePreviewMaterialPDF}
                            className={`btn-secondary-rodin !py-2 !px-3 text-[11.5px] flex-1 justify-center ${
                              isOnlyMaterialPending ? '!border-[#EF4444]/40 !text-[#DC2626]' : ''
                            }`}
                          >
                            <Eye size={13} /> Ver PDF
                          </button>
                          <button
                            type="button"
                            onClick={handleDownloadMaterialPDF}
                            className={`!py-2 !px-3 rounded-xl text-[11.5px] flex-1 justify-center flex items-center gap-1 shadow-xs transition-colors font-bold cursor-pointer ${
                              isOnlyMaterialPending
                                ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
                                : 'btn-primary-rodin'
                            }`}
                          >
                            <Download size={13} /> Baixar
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleToggleMaterialContractStatus}
                          className={`w-full text-[11px] font-bold py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            formData.materialContractStatus === 'signed'
                              ? 'bg-[#F8FAFC] text-[#64748B] border-[#CBD5E1] hover:bg-[#F1F5F9]'
                              : 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] hover:bg-[#D1FAE5]'
                          }`}
                        >
                          {formData.materialContractStatus === 'signed' ? 'Reverter Status para Pendente' : '✓ Marcar Material como Assinado'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BARRA INFERIOR DE NAVEGAÇÃO ENTRE AS ETAPAS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                if (currentStep > 1) {
                  handleStepChange(currentStep - 1);
                } else {
                  setSelectedStudent(null);
                }
              }}
              className="btn-secondary-rodin !py-2.5 !px-4 text-[12.5px] w-full sm:w-auto justify-center"
            >
              <ArrowLeft size={16} />
              {currentStep === 1 ? 'Voltar para Lista' : 'Etapa Anterior'}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => handleStepChange(currentStep + 1)}
                className="btn-primary-rodin !py-2.5 !px-6 text-[13px] w-full sm:w-auto justify-center shadow-md font-bold"
              >
                Próxima Etapa ({currentStep + 1}/5) →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  handleSaveContractData();
                  showToast('Rematrícula e contratos gravados com sucesso!');
                }}
                className="btn-primary-rodin !py-2.5 !px-6 text-[13px] w-full sm:w-auto justify-center shadow-lg font-black !bg-[#059669] hover:!bg-[#047857]"
              >
                <CheckCircle2 size={16} /> Concluir e Salvar Rematrícula
              </button>
            )}
          </div>
        </div>

        {/* MODAL: LINK DE ASSINATURA ONLINE */}
        {onlineLinkModal && (
          <div className="fixed inset-0 z-50 bg-[#0F172A]/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#E2E8F0] space-y-6 relative animate-scaleUp">
              {/* Botão Fechar */}
              <button
                onClick={() => setOnlineLinkModal(null)}
                className="absolute top-5 right-5 text-[#94A3B8] hover:text-[#1E293B] p-2 rounded-full hover:bg-[#F1F5F9] transition-colors"
                title="Fechar"
              >
                <X size={20} />
              </button>

              {/* Cabeçalho */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center font-black shadow-inner shrink-0">
                  <Share2 size={28} />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#16A34A] block">
                    PORTAL DIGITAL DO RESPONSÁVEL
                  </span>
                  <h3 className="text-[19px] sm:text-[21px] font-black text-[#1E293B]">
                    Link de Assinatura Online
                  </h3>
                  <p className="text-[12px] text-[#64748B]">
                    Aluno: <strong>{onlineLinkModal.studentName}</strong> • Resp: <strong>{onlineLinkModal.guardianName}</strong>
                  </p>
                </div>
              </div>

              {/* Informação sobre Hash */}
              <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] text-[#475569] space-y-1">
                <div className="font-bold text-[#1E293B] flex items-center gap-1.5">
                  <Sparkles size={15} className="text-[#F45206]" /> Assinatura com Certificado Digital
                </div>
                <p>
                  Quando o responsável acessar este link e desenhar a assinatura na tela, o sistema gerará automaticamente o <strong>Hash SHA-256</strong>, <strong>IP</strong> e o <strong>Certificado de Auditoria</strong> no PDF final.
                </p>
              </div>

              {/* Código de Acesso */}
              <div className="flex items-center justify-between p-3.5 bg-[#FFF7ED] border border-[#FED7AA] rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-[#9A3412] uppercase block">Código de Acesso do Responsável</span>
                  <span className="text-[16px] font-black text-[#C2410C] tracking-wider">{onlineLinkModal.code}</span>
                </div>
                <div className="text-[11px] text-[#9A3412] text-right font-medium">
                  Utilizado para segurança e validação
                </div>
              </div>

              {/* Campo do Link */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                  Link Direto de Assinatura:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={onlineLinkModal.url}
                    className="w-full bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 text-[12px] text-[#334155] font-mono select-all focus:outline-hidden"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(onlineLinkModal.url);
                      showToast('Link de assinatura copiado para a área de transferência!');
                    }}
                    className="btn-secondary-rodin !py-2.5 !px-4 text-[12px] shrink-0"
                    title="Copiar Link"
                  >
                    <Copy size={16} /> Copiar
                  </button>
                </div>
              </div>

              {/* Ações Rápidas de Envio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Enviar WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?phone=${(onlineLinkModal.guardianPhone || '').replace(/\D/g, '')}&text=${encodeURIComponent(`Olá ${onlineLinkModal.guardianName}! Segue o link exclusivo do Colégio Rodin para conferência e assinatura online da rematrícula de ${onlineLinkModal.studentName}: ${onlineLinkModal.url} (Código: ${onlineLinkModal.code})`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-3 px-4 rounded-xl text-[12px] flex items-center justify-center gap-2 shadow-sm transition-colors text-center"
                >
                  <Phone size={16} /> Enviar via WhatsApp
                </a>

                {/* Abrir Link em Nova Aba */}
                <a
                  href={onlineLinkModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1E293B] hover:bg-[#0F172A] text-white font-bold py-3 px-4 rounded-xl text-[12px] flex items-center justify-center gap-2 shadow-sm transition-colors text-center"
                >
                  <ExternalLink size={16} /> Abrir Portal do Pai
                </a>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CRIAR OU EDITAR OPÇÃO DE DESCONTO / BENEFÍCIO */}
        {showNewDiscountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] w-full max-w-lg overflow-hidden animate-scaleUp max-h-[90vh] flex flex-col">
              {/* Topo do Modal */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#F45206] flex items-center justify-center font-black text-[15px]">
                    {editingDiscountId ? <Edit2 size={16} /> : '%'}
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-[#1E293B]">
                      {editingDiscountId ? 'Editar Nome / Opção de Desconto' : 'Criar Nova Opção de Desconto'}
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      {editingDiscountId 
                        ? 'Altere o nome e as regras desta opção cadastrada' 
                        : 'Cadastre uma nova regra ou convênio de desconto'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewDiscountModal(false);
                    setEditingDiscountId(null);
                  }}
                  className="text-[#94A3B8] hover:text-[#1E293B] p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Corpo com Scroll */}
              <div className="p-6 space-y-5 overflow-y-auto">
                <form onSubmit={handleSaveDiscount} className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">
                      {editingDiscountId ? 'Editar Nome do Desconto: *' : 'Nome do Desconto / Benefício: *'}
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={newDiscountForm.name}
                      onChange={(e) => setNewDiscountForm({ ...newDiscountForm, name: e.target.value })}
                      placeholder="Ex: Desconto Le Perini 2027"
                      className="form-control font-bold text-[#1E293B]"
                    />
                    <span className="text-[11px] text-[#64748B] mt-1 block">
                      Nome identificador que aparece no menu de seleção.
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Percentual de Desconto (%): *</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        required
                        value={newDiscountForm.percentage}
                        onChange={(e) => setNewDiscountForm({ ...newDiscountForm, percentage: e.target.value })}
                        placeholder="Ex: 20"
                        className="form-control font-black text-[#1E293B] !pr-10"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-[13px] text-[#64748B] pointer-events-none">
                        %
                      </span>
                    </div>
                    <span className="text-[11px] text-[#64748B] mt-1 block">
                      Informe a porcentagem aplicada (ex: 20 para 20%, 25 para 25%).
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Observações / Detalhes (Opcional):</label>
                    <input
                      type="text"
                      value={newDiscountForm.reason}
                      onChange={(e) => setNewDiscountForm({ ...newDiscountForm, reason: e.target.value })}
                      placeholder="Ex: Parceria Le Perini 20% na anuidade"
                      className="form-control font-medium text-[#334155]"
                    />
                  </div>

                  {/* Simulação em tempo real */}
                  {newDiscountForm.percentage !== '' && !isNaN(parseFloat(newDiscountForm.percentage)) && (
                    <div className="p-3 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] space-y-1">
                      <div className="flex items-center justify-between text-[11.5px] font-bold text-[#9A3412]">
                        <span>Simulação ({formData.currentGrade || 'Série Padrão'}):</span>
                        <span>Tabela: R$ {formData.tuitionNominalTotal || getNominalTuitionForGrade(formData.currentGrade)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[13px] font-black text-[#EA580C]">
                        <span>Anuidade Final com {newDiscountForm.percentage}%:</span>
                        <span>
                          R$ {formatNumberToBRL(
                            Math.max(0, parseBRLToNumber(formData.tuitionNominalTotal || getNominalTuitionForGrade(formData.currentGrade)) * (1 - (parseFloat(newDiscountForm.percentage) || 0) / 100))
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewDiscountModal(false);
                        setEditingDiscountId(null);
                      }}
                      className="px-4 py-2 rounded-xl text-[13px] font-bold text-[#64748B] hover:text-[#1E293B] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary px-5 py-2 rounded-xl text-[13px] font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      <Check size={16} />
                      {editingDiscountId ? 'Salvar Alterações no Nome' : 'Salvar e Aplicar Desconto'}
                    </button>
                  </div>
                </form>

                {/* Lista de Opções Existentes para Edição Rápida */}
                <div className="border-t border-[#E2E8F0] pt-4 mt-2">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[12px] font-bold text-[#1E293B] flex items-center gap-1.5">
                      <Settings size={13} className="text-[#64748B]" />
                      Opções Cadastradas no Menu (Clique para Editar):
                    </span>
                    {editingDiscountId && (
                      <button
                        type="button"
                        onClick={handleOpenNewDiscount}
                        className="text-[11px] font-bold text-[#F45206] hover:underline cursor-pointer"
                      >
                        + Criar Nova Opção
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(() => {
                          // Exibir apenas a % única de forma limpa e ordenada
                          const seenPcts = new Set();
                          const selectOpts = [];

                          for (const opt of discountOptions) {
                            const pctKey = opt.percentage ?? 0;
                            if (!seenPcts.has(pctKey)) {
                              seenPcts.add(pctKey);
                              selectOpts.push(opt);
                            }
                          }

                          selectOpts.sort((a, b) => (a.percentage || 0) - (b.percentage || 0));

                          return selectOpts.map((opt) => {
                            const displayLabel = opt.percentage > 0 
                              ? `${opt.percentage}%` 
                              : 'Sem desconto';
                            return (
                              <option key={opt.id} value={opt.id}>
                                {displayLabel}
                              </option>
                            );
                          });
                        })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // MODO 1: TELA INICIAL — BUSCA E LISTA DE ALUNOS PARA REMATRÍCULA
  // =========================================================================
  const hasSearch = Boolean(searchQuery.trim()) || Boolean(selectedStudentIdFilter);

  return (
    <div className={`w-full flex flex-col items-center transition-all duration-300 ${
      !hasSearch
        ? 'min-h-[calc(100vh-140px)] justify-center pb-12'
        : 'min-h-0 pt-6 sm:pt-10 pb-20 animate-fadeIn'
    }`}>
      {/* PAINEL PRINCIPAL COM BUSCA E TABELA DE ALUNOS */}
      <div className="rodin-panel-card !p-4 sm:!p-5 space-y-4 transition-all duration-300 w-full max-w-5xl shadow-lg border border-[#E2E8F0]">
        {/* Banner se Campanha estiver Inativa/Pausada */}
        {!campaignConfig?.isActive && (
          <div className="bg-[#FFF7ED] border border-[#FDBA74] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px] text-[#C2410C]">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={20} className="text-[#EA580C] shrink-0" />
              <div>
                <strong className="block font-bold">Campanha de Rematrícula {campaignConfig?.academicYear || 2027} Pausada</strong>
                <span className="text-[#9A3412]">{campaignConfig?.closedMessage || 'O período de rematrícula para este ciclo está suspenso.'}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('config-rematricula')}
              className="text-[11.5px] font-bold bg-white text-[#EA580C] border border-[#FDBA74] hover:bg-[#FFEDD5] px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Gerenciar Campanha
            </button>
          </div>
        )}

        {/* CAMPO DE BUSCA EXCLUSIVO POR NOME OU RM DO ALUNO */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-3 text-[#64748B]" size={19} />
          <input
            type="text"
            placeholder="Buscar por Nome do Aluno..."
            value={searchQuery}
            onChange={(e) => {
              setSelectedStudentIdFilter(null);
              setSearchQuery(e.target.value);
            }}
            className="form-control !pl-11 !pr-10 !py-2.5 text-[13px] w-full"
            autoFocus
          />
          {hasSearch && (
            <button
              onClick={() => {
                setSelectedStudentIdFilter(null);
                setSearchQuery('');
              }}
              className="absolute right-3 top-2.5 p-1 rounded-full text-[#94A3B8] hover:text-[#1E293B] hover:bg-[#F1F5F9] transition-colors"
              title="Limpar busca"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Tabela de Alunos com % e Descrição da Planilha */}
        {hasSearch && (
          <div className="overflow-x-auto custom-scrollbar animate-clean-fade pt-2">
            <table className="w-full border-collapse min-w-[780px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[11px] font-black text-[#64748B] uppercase tracking-wider bg-[#F8FAFC]">
                  <th className="p-3 text-left rounded-l-xl">Aluno</th>
                  <th className="p-3 text-left">Responsável Financeiro</th>
                  <th className="p-3 text-left min-w-[145px] whitespace-nowrap">Status</th>
                  <th className="p-3 text-left rounded-r-xl min-w-[140px] whitespace-nowrap">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[13px]">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const rm = student.rmNumber || student.cocCode || '2560';
                    const studentEnrollment = enrollments.find(e => e.studentId === student.id || e.rmNumber === rm);

                    const schoolSigned = studentEnrollment?.schoolContractStatus !== undefined
                      ? studentEnrollment.schoolContractStatus === 'signed'
                      : (studentEnrollment?.status === 'reenrolled' || studentEnrollment?.status === 'active');

                    const materialSigned = studentEnrollment?.materialContractStatus !== undefined
                      ? studentEnrollment.materialContractStatus === 'signed'
                      : (studentEnrollment?.status === 'reenrolled' || studentEnrollment?.status === 'active');

                    const bothSigned = schoolSigned && materialSigned;
                    const primaryGuardian = (student.guardians && student.guardians[0]) || {};
                    const studentFullName = student.studentName || student.name || '';

                    return (
                      <tr
                        key={student.id}
                        onDoubleClick={() => {
                          if (selectedStudentIdFilter === student.id) {
                            setSelectedStudentIdFilter(null);
                          } else {
                            setSelectedStudentIdFilter(student.id);
                            setSearchQuery(studentFullName);
                          }
                        }}
                        className={`transition-colors cursor-pointer ${
                          selectedStudentIdFilter === student.id
                            ? 'bg-[#FFF0E6] hover:bg-[#FFE5D4]'
                            : 'hover:bg-[#FFF0E6]/30'
                        }`}
                        title={
                          selectedStudentIdFilter === student.id
                            ? 'Dois cliques para voltar a exibir todos os resultados da pesquisa'
                            : 'Dois cliques para exibir apenas este(a) estudante'
                        }
                      >
                        {/* 1. Aluno */}
                        <td className="p-3.5 text-left">
                          <strong className="block text-[#1E293B] font-bold text-[13.5px] select-none" title={`RM: ${rm} • ${student.currentGrade || studentEnrollment?.currentGrade || 'Série 2027'}`}>
                            {studentFullName}
                          </strong>
                        </td>

                        {/* 2. Responsável Financeiro */}
                        <td className="p-3.5 text-left">
                          <strong className="block text-[#1E293B] font-medium text-[13px]" title={primaryGuardian.guardianPhone || studentEnrollment?.guardianPhone || ''}>
                            {primaryGuardian.guardianName || primaryGuardian.name || studentEnrollment?.guardianName || 'Não Informado'}
                          </strong>
                        </td>

                        {/* 4. Status Separado em Dois Contratos (Anuidade e Material) */}
                        <td className="p-3.5 text-left whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            {/* Status Contrato de Anuidade */}
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors whitespace-nowrap shrink-0 ${
                              schoolSigned
                                ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                                : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                            }`}>
                              {schoolSigned ? <CheckCircle2 size={11} className="shrink-0" /> : <Clock size={11} className="shrink-0 text-[#DC2626]" />}
                              <span>Anuidade: {schoolSigned ? 'Assinado' : 'Pendente'}</span>
                            </span>

                            {/* Status Material Didático */}
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors whitespace-nowrap shrink-0 ${
                              materialSigned
                                ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                                : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                            }`}>
                              {materialSigned ? <CheckCircle2 size={11} className="shrink-0" /> : <Clock size={11} className="shrink-0 text-[#DC2626]" />}
                              <span>Material: {materialSigned ? 'Assinado' : 'Pendente'}</span>
                            </span>
                          </div>
                        </td>

                        {/* 5. Botão de Ação */}
                        <td className="p-3.5 text-left whitespace-nowrap">
                          {(() => {
                            const isRowOnlyMaterial = schoolSigned && !materialSigned;
                            const isRowOnlySchool = !schoolSigned && materialSigned;

                            let btnLabel = 'Rematrícula';
                            let btnIcon = <RefreshCw size={14} className="shrink-0" />;
                            let btnClass = 'btn-primary-rodin shadow-xs';
                            let btnTitle = 'Iniciar ou continuar rematrícula';

                            if (bothSigned) {
                              btnLabel = 'Ver / Gerenciar';
                              btnIcon = <RefreshCw size={14} className="shrink-0 text-[#64748B]" />;
                              btnClass = 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] border border-[#CBD5E1]';
                              btnTitle = 'Ver ficha e gerenciar contratos';
                            } else if (isRowOnlyMaterial) {
                              btnLabel = 'Gerar Material';
                              btnIcon = <BookOpen size={14} className="shrink-0 text-white" />;
                              btnClass = 'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xs';
                              btnTitle = 'Anuidade já assinada! Abrir direto na emissão do Pedido de Material Didático pendente';
                            } else if (isRowOnlySchool) {
                              btnLabel = 'Gerar Anuidade';
                              btnIcon = <FileSignature size={14} className="shrink-0 text-white" />;
                              btnClass = 'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xs';
                              btnTitle = 'Material já assinado! Abrir direto na emissão do Requerimento de Anuidade pendente';
                            }

                            return (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectStudent(student);
                                  }}
                                  className={`!py-2 !px-3.5 text-[12px] font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${btnClass}`}
                                  title={btnTitle}
                                >
                                  {btnIcon}
                                  <span className="whitespace-nowrap">{btnLabel}</span>
                                </button>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="py-10 px-4 text-center text-[#64748B]">
                      Nenhum aluno encontrado para "{searchQuery}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
