import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  generateSignedContractPDF, 
  previewSignedContractPDF, 
  getSignedContractPDFBlobUrl,
  downloadMaterialOrderPDF,
  previewMaterialOrderPDF,
  getMaterialOrderPDFBlobUrl,
  downloadAllContractsPDF
} from '../../lib/pdfGenerator';
import { BRAZILIAN_UFS, getCitiesByUF, parseCityStateString } from '../../lib/brazilianLocations';
import { removeAccents } from '../../lib/formatters';
import { getFixedRatesForGrade } from '../../data/fixedRates';
import RodinLogo from '../RodinLogo';
import signatureCanela from '../../assets/signatures/assinatura - canela.png';
import signatureElisangela from '../../assets/signatures/assinatura - elisangela.png';
import signatureKelly from '../../assets/signatures/assinatura - kelly.png';
import {
  FileSignature,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  X,
  Copy,
  ExternalLink,
  UserPlus,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  DollarSign,
  BookOpen,
  MapPin,
  UserCheck,
  Building,
  CreditCard,
  Sparkles,
  Info,
  GraduationCap,
  Users,
  Check,
  Lock,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  Loader2,
  Hash,
  Send,
  Eraser,
  PenTool,
  QrCode,
  Share2
} from 'lucide-react';

// =========================================================================
// HELPERS DE FORMATAÇÃO E PARSE MONETÁRIO BRL ('2.000,00')
// =========================================================================
const parseBRLToNumber = (val) => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = val.toString().trim();
  if (str.includes(',')) {
    const clean = str.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    return parseFloat(clean) || 0;
  }
  const clean = str.replace(/[^\d.-]/g, '');
  return parseFloat(clean) || 0;
};

const formatNumberToBRL = (val) => {
  const num = typeof val === 'number' ? val : parseBRLToNumber(val);
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const maskCurrencyBRL = (inputVal) => {
  const cleanDigits = inputVal.toString().replace(/\D/g, '');
  if (!cleanDigits) return '0,00';
  const num = parseFloat(cleanDigits) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// =========================================================================
// ASSINATURAS INSTITUCIONAIS PRÉ-ASSINADAS (BALDER EDUCACIONAL E TESTEMUNHAS)
// =========================================================================
const BalderSignatureSVG = () => (
  <div className="flex flex-col items-center justify-center">
    <svg viewBox="0 0 240 60" className="w-48 h-12 text-[#1E293B]">
      <path d="M 15 45 Q 35 10 55 35 T 85 20 T 115 40 Q 135 15 175 25 T 205 20 T 230 30" fill="none" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 45 25 Q 65 5 85 40" fill="none" stroke="#1E293B" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M 105 35 Q 135 30 185 32" fill="none" stroke="#1E293B" strokeWidth="1.2" />
      <path d="M 195 25 C 205 10 225 15 220 35" fill="none" stroke="#1E293B" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
    <span className="text-[9px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0] -mt-1">
      ✓ Assinado Digitalmente pela Balder Educacional
    </span>
  </div>
);

const ElisangelaSignatureSVG = () => (
  <div className="flex flex-col items-center justify-center">
    <svg viewBox="0 0 180 60" className="w-36 h-12 text-[#1E293B]">
      <path d="M 25 35 C 15 15, 55 10, 65 30 C 75 50, 35 55, 25 35 C 20 20, 45 15, 75 30 C 95 40, 125 35, 145 30 C 160 25, 170 35, 155 45" fill="none" stroke="#1E293B" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 35 40 C 55 25, 85 20, 105 38" fill="none" stroke="#1E293B" strokeWidth="1.2" />
      <path d="M 20 32 L 155 32" fill="none" stroke="#1E293B" strokeWidth="0.8" opacity="0.6" />
    </svg>
    <span className="text-[8.5px] font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.2 rounded border border-[#A7F3D0] -mt-1">
      ✓ Testemunha 1 (Assinada)
    </span>
  </div>
);

const KellySignatureSVG = () => (
  <div className="flex flex-col items-center justify-center">
    <svg viewBox="0 0 180 60" className="w-36 h-12 text-[#1E293B]">
      <path d="M 35 50 L 50 15 L 65 50 M 45 32 L 60 32" fill="none" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 70 48 C 65 20, 90 10, 90 30 C 90 50, 75 50, 70 48" fill="none" stroke="#1E293B" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 95 48 C 90 15, 120 10, 120 30 C 120 50, 100 50, 95 48" fill="none" stroke="#1E293B" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 30 52 Q 75 48 135 52" fill="none" stroke="#1E293B" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
    <span className="text-[8.5px] font-bold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.2 rounded border border-[#A7F3D0] -mt-1">
      ✓ Testemunha 2 (Assinada)
    </span>
  </div>
);

export default function EnrollmentModule({ isCreateMode = false }) {
  const {
    activeTab,
    enrollments,
    createEnrollmentProposal,
    completeEnrollmentByParent,
    getNextRM,
    setActiveTab,
    showToast,
    campaignConfig
  } = useApp();

  const getStartingViewMode = () => {
    if (activeTab === 'matriculas-nova' || isCreateMode) return 'proposal-creator';
    return 'list';
  };

  // Estados de Visualização: 'list' | 'proposal-creator' | 'parent-portal'
  const [viewMode, setViewMode] = useState(getStartingViewMode());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');

  // Anos Letivos dinâmicos (muda automaticamente conforme a data do sistema)
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  // Sincronizar em tempo real quando o usuário clica no menu lateral
  useEffect(() => {
    if (activeTab === 'matriculas-nova') {
      setViewMode('proposal-creator');
    } else if (activeTab === 'matriculas-list' || activeTab === 'matriculas') {
      setViewMode('list');
    }
  }, [activeTab, isCreateMode]);

  // Matrícula ativa no Portal do Pai
  const [parentEnrollment, setParentEnrollment] = useState(null);
  const [parentStep, setParentStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [generatedProposalModal, setGeneratedProposalModal] = useState(null);
  const [previewPdfModal, setPreviewPdfModal] = useState(null);

  // =========================================================================
  // 1. ESTADO: SETOR DE MATRÍCULAS DEFINE RM, CURSO, VALOR E PARCELAS (LIMPO)
  // =========================================================================
  const [proposalData, setProposalData] = useState({
    rmNumber: getNextRM ? getNextRM() : '',
    academicYear: String(new Date().getFullYear() + 1),
    courseLevel: '',
    schoolShift: '',
    currentGrade: '',
    tuitionGrossTotal: '',
    installmentsCount: '',
    firstInstallmentValue: '',
    firstInstallmentSplit: 1,
    firstInstallmentPaymentMethod: 'Cartão de Crédito (até 5x) ou Boleto',
    regularInstallmentValue: '',
    paymentNote: '* Boleto Bancário com vencimento mensal e sucessivo todo dia: 1º.',
    // Dados Opcionais Preliminares para Envio
    studentName: '',
    guardianName: '',
    guardianCpf: '',
    guardianPhone: '',
    guardianEmail: '',
    // Pedido de Material Didático (Livraria do Pensador LTDA - CNPJ 43.849.399/0001-92)
    materialBuyerName: '',
    materialBuyerCpf: '',
    materialTotalValue: '',
    materialInstallmentsCount: '10',
    materialStartDueDate: '10/01/2027',
    materialEndDueDate: '10/10/2027',
    materialPaymentMethod: 'Boleto Bancário (vencimento dia 10)',
    isBuyerSameAsFinancial: true
  });

  // =========================================================================
  // 2. ESTADO: DADOS A SEREM PREENCHIDOS E ASSINADOS PELO PAI
  // =========================================================================
  const [parentFormData, setParentFormData] = useState({
    // Dados Pessoais do Estudante (Obrigatórios)
    studentName: '',
    studentGender: '',
    studentBirthDate: '',
    studentBirthState: 'SP',
    studentBirthCity: 'Indaiatuba',
    studentRg: '',
    studentRgIssuer: '',
    studentRgIssueDate: '',
    studentCpf: '',
    studentNationality: 'Brasileiro(a)',
    studentPhone: '',
    // Dados do Responsável Financeiro (Obrigatórios)
    guardianRelation: '',
    guardianName: '',
    guardianGender: '',
    guardianBirthDate: '',
    guardianOccupation: '',
    guardianMaritalStatus: '',
    guardianRg: '',
    guardianRgIssuer: '',
    guardianCpf: '',
    guardianNationality: 'Brasileiro(a)',
    // Endereço Residencial do Responsável
    guardianAddressCep: '',
    guardianAddressStreet: '',
    guardianAddressNumber: '',
    guardianAddressComplement: '',
    guardianAddressNeighborhood: '',
    guardianAddressCity: 'Indaiatuba',
    guardianAddressState: 'SP',
    // Contato do Responsável
    guardianEmail: '',
    guardianLandline: '',
    guardianPhone: ''
  });

  // Canvas de Assinatura do Pai
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasParentSignature, setHasParentSignature] = useState(false);

  // Recalcular RM ao abrir modo criação
  useEffect(() => {
    if (getNextRM && viewMode === 'proposal-creator') {
      setProposalData(prev => ({ ...prev, rmNumber: getNextRM() }));
    }
  }, [viewMode, enrollments]);

  // Canvas Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasParentSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasParentSignature(false);
  };

  // Cálculo das parcelas da proposta pela Escola (Sem valores padrão forçados e sem apagar edições do usuário)
  const handleCalculateProposalInstallments = (totalBRL, countStr, firstBRL) => {
    const total = parseBRLToNumber(totalBRL);
    const count = parseInt(countStr) || 0;
    
    // Se o usuário passou um valor explícito para a 1ª parcela, respeitar exatamente o que ele digitou
    let first = (firstBRL !== null && firstBRL !== undefined && firstBRL !== '')
      ? parseBRLToNumber(firstBRL)
      : (count > 0 && total > 0 ? total / count : 0);

    const formattedFirst = (firstBRL !== null && firstBRL !== undefined && firstBRL !== '')
      ? (typeof firstBRL === 'string' ? firstBRL : formatNumberToBRL(first))
      : (first > 0 ? formatNumberToBRL(first) : '');

    let regular = 0;
    if (total > 0 && count > 1) {
      const remainingTotal = Math.max(0, total - first);
      regular = remainingTotal / (count - 1);
    }

    setProposalData(prev => ({
      ...prev,
      tuitionGrossTotal: total > 0 ? formatNumberToBRL(total) : (totalBRL || ''),
      installmentsCount: countStr !== undefined && countStr !== null ? countStr : prev.installmentsCount,
      firstInstallmentValue: formattedFirst || prev.firstInstallmentValue,
      regularInstallmentValue: count > 1 && total > 0 ? formatNumberToBRL(regular) : (count === 1 ? '0,00' : '')
    }));
  };

  // Sincronização inteligente: altera o Responsável Financeiro na Proposta
  const handleProposalGuardianFieldChange = (field, value) => {
    setProposalData(prev => {
      const updated = { ...prev, [field]: value };
      if (prev.isBuyerSameAsFinancial) {
        if (field === 'guardianName') updated.materialBuyerName = value;
        if (field === 'guardianCpf') updated.materialBuyerCpf = value;
      }
      return updated;
    });
  };

  // Desacoplamento obrigatório: alterar ou apagar o Comprador NUNCA altera o Responsável Financeiro
  const handleProposalMaterialBuyerFieldChange = (field, value) => {
    setProposalData(prev => ({
      ...prev,
      [field]: value,
      isBuyerSameAsFinancial: false
    }));
  };

  // Alternar vínculo do Comprador com o Responsável Financeiro na Proposta
  const handleProposalToggleSameBuyer = (checked) => {
    setProposalData(prev => ({
      ...prev,
      isBuyerSameAsFinancial: checked,
      ...(checked ? {
        materialBuyerName: prev.guardianName || '',
        materialBuyerCpf: prev.guardianCpf || ''
      } : {})
    }));
  };

  // Auto-preenchimento CEP (ViaCEP)
  const handleCepLookup = async (cepValue) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    setParentFormData(prev => ({ ...prev, guardianAddressCep: cepValue }));

    if (cleanCep.length === 8) {
      setIsLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setParentFormData(prev => ({
            ...prev,
            guardianAddressStreet: data.logradouro || prev.guardianAddressStreet,
            guardianAddressNeighborhood: data.bairro || prev.guardianAddressNeighborhood,
            guardianAddressCity: data.localidade || prev.guardianAddressCity,
            guardianAddressState: data.uf || prev.guardianAddressState
          }));
          showToast(`CEP Encontrado: ${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`);
        } else {
          showToast('CEP não localizado automaticamente. Preencha manualmente os campos de endereço.', 'error');
        }
      } catch (error) {
        console.error('Erro ao consultar ViaCEP:', error);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  // =========================================================================
  // VALIDAÇÃO RIGOROSA: NENHUM CAMPO PODE PASSAR VAZIO
  // =========================================================================
  const validateParentStep = (step) => {
    const errors = {};

    if (step === 1) {
      if (!parentFormData.studentName?.trim()) errors.studentName = 'Nome do estudante é obrigatório';
      if (!parentFormData.studentGender) errors.studentGender = 'Selecione o sexo';
      if (!parentFormData.studentBirthDate) errors.studentBirthDate = 'Data de nascimento é obrigatória';
      if (!parentFormData.studentBirthCity?.trim()) errors.studentBirthCity = 'Local de nascimento é obrigatório';
      if (!parentFormData.studentNationality?.trim()) errors.studentNationality = 'Nacionalidade é obrigatória';
      if (!parentFormData.studentRg?.trim()) errors.studentRg = 'RG é obrigatório';
      if (!parentFormData.studentRgIssuer?.trim()) errors.studentRgIssuer = 'Órgão expedidor é obrigatório';
      if (!parentFormData.studentRgIssueDate) errors.studentRgIssueDate = 'Data de emissão é obrigatória';
      if (!parentFormData.studentCpf?.trim()) errors.studentCpf = 'CPF é obrigatório';
      if (!parentFormData.studentPhone?.trim()) errors.studentPhone = 'Telefone do estudante é obrigatório';
    }

    if (step === 2) {
      if (!parentFormData.guardianRelation) errors.guardianRelation = 'Parentesco é obrigatório';
      if (!parentFormData.guardianName?.trim()) errors.guardianName = 'Nome do responsável é obrigatório';
      if (!parentFormData.guardianGender) errors.guardianGender = 'Sexo é obrigatório';
      if (!parentFormData.guardianBirthDate) errors.guardianBirthDate = 'Data de nascimento é obrigatória';
      if (!parentFormData.guardianOccupation?.trim()) errors.guardianOccupation = 'Ocupação é obrigatória';
      if (!parentFormData.guardianMaritalStatus) errors.guardianMaritalStatus = 'Estado civil é obrigatório';
      if (!parentFormData.guardianRg?.trim()) errors.guardianRg = 'RG é obrigatório';
      if (!parentFormData.guardianRgIssuer?.trim()) errors.guardianRgIssuer = 'Órgão expedidor é obrigatório';
      if (!parentFormData.guardianCpf?.trim()) errors.guardianCpf = 'CPF é obrigatório';
      if (!parentFormData.guardianNationality?.trim()) errors.guardianNationality = 'Nacionalidade é obrigatória';
      if (!parentFormData.guardianAddressCep?.trim()) errors.guardianAddressCep = 'CEP é obrigatório';
      if (!parentFormData.guardianAddressStreet?.trim()) errors.guardianAddressStreet = 'Logradouro é obrigatório';
      if (!parentFormData.guardianAddressNumber?.trim()) errors.guardianAddressNumber = 'Número é obrigatório';
      if (!parentFormData.guardianAddressNeighborhood?.trim()) errors.guardianAddressNeighborhood = 'Bairro é obrigatório';
      if (!parentFormData.guardianAddressCity?.trim()) errors.guardianAddressCity = 'Cidade é obrigatória';
      if (!parentFormData.guardianAddressState?.trim()) errors.guardianAddressState = 'UF é obrigatória';
      if (!parentFormData.guardianEmail?.trim() || !parentFormData.guardianEmail.includes('@')) errors.guardianEmail = 'E-mail válido é obrigatório';
      if (!parentFormData.guardianPhone?.trim()) errors.guardianPhone = 'Celular/WhatsApp é obrigatório';
    }

    setFormErrors(errors);
    const isValid = Object.keys(errors).length === 0;

    if (!isValid) {
      showToast('Preencha todos os campos obrigatórios para prosseguir.', 'error');
    }

    return isValid;
  };

  // Gerar Proposta pelo Setor de Matrículas (Com Validação dos Campos)
  const handleGenerateProposalSubmit = async (e) => {
    e.preventDefault();

    if (!proposalData.academicYear) {
      showToast('Por favor, selecione o Ano Letivo.', 'error');
      return;
    }
    if (!proposalData.courseLevel) {
      showToast('Por favor, selecione o Curso.', 'error');
      return;
    }
    if (!proposalData.schoolShift) {
      showToast('Por favor, selecione o Turno.', 'error');
      return;
    }
    if (!proposalData.currentGrade) {
      showToast('Por favor, selecione o Ano/Série/Modalidade.', 'error');
      return;
    }
    if (!proposalData.tuitionGrossTotal || parseBRLToNumber(proposalData.tuitionGrossTotal) <= 0) {
      showToast('Por favor, digite o Valor Total da Anuidade.', 'error');
      return;
    }
    if (!proposalData.installmentsCount) {
      showToast('Por favor, selecione a Quantidade de Parcelas.', 'error');
      return;
    }
    if (!proposalData.firstInstallmentValue || parseBRLToNumber(proposalData.firstInstallmentValue) <= 0) {
      showToast('Por favor, digite o Valor da 1ª Parcela.', 'error');
      return;
    }
    if (!proposalData.guardianEmail?.trim() || !proposalData.guardianEmail.includes('@')) {
      showToast('Por favor, digite um e-mail válido para o responsável.', 'error');
      return;
    }

    const generatedCode = `ROD-${Math.floor(1000 + Math.random() * 9000)}`;
    const proposalWithCode = { ...proposalData, accessCode: generatedCode };
    const created = await createEnrollmentProposal(proposalWithCode);

    try {
      const prevCodes = JSON.parse(localStorage.getItem('rodin_enrollment_codes') || '{}');
      prevCodes[created.id] = generatedCode;
      prevCodes[created.rmNumber] = generatedCode;
      localStorage.setItem('rodin_enrollment_codes', JSON.stringify(prevCodes));
    } catch (err) {}

    setGeneratedProposalModal(created);
  };

  // Abrir o Portal do Pai para uma Matrícula/Proposta via Hash Router
  const handleOpenParentPortal = (enrollment) => {
    const codeParam = enrollment.accessCode ? `?code=${enrollment.accessCode}` : '';
    window.location.hash = `#matricular/${enrollment.id}${codeParam}`;
  };

  const handleCopyLink = (enr) => {
    const link = `${window.location.origin}/#matricular/${enr.id}`;
    navigator.clipboard.writeText(link);
    showToast('Link de matrícula copiado! O responsável utilizará o código único recebido por e-mail para acessar.');
  };

  const handleResendEmail = (enr) => {
    const email = enr.guardianEmail || enr.email || 'responsável';
    showToast(`Link de assinatura reenviado com sucesso para o e-mail: ${email}`);
  };

  const normQuery = removeAccents(searchQuery);
  const filteredEnrollments = enrollments.filter(e => {
    const rm = String(e.rmNumber || e.cocCode || '');
    const matchesSearch = (e.studentName && removeAccents(e.studentName).includes(normQuery)) ||
                          (e.enrollmentCode && removeAccents(e.enrollmentCode).includes(normQuery)) ||
                          (e.guardianName && removeAccents(e.guardianName).includes(normQuery)) ||
                          (e.guardianCpf && e.guardianCpf.includes(searchQuery)) ||
                          rm.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesYear = yearFilter === 'all' || String(e.academicYear || 2027) === String(yearFilter);
    return matchesSearch && matchesStatus && matchesYear;
  });

  // =========================================================================
  // VIEW 1: PORTAL DO PAI (PREENCHER DADOS E ASSINAR O REQUERIMENTO)
  // Layout Amplo, Sem Cortes, 100% Responsivo e com 3 Assinaturas Prontas
  // =========================================================================
  if (viewMode === 'parent-portal' && parentEnrollment) {
    return (
      <div className="w-full space-y-6 pb-20 animate-fadeIn">
        {/* Banner Superior com Contexto do Pai */}
        <div className="bg-[#1E293B] text-white p-5 sm:p-7 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F45206] text-white flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
              R
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#FED7AA] block">
                Colégio Rodin — Balder Educacional LTDA
              </span>
              <h1 className="text-[20px] sm:text-[23px] font-black leading-tight">
                Preenchimento e Assinatura de Matrícula ({parentEnrollment.academicYear || 2027})
              </h1>
              <p className="text-[12px] text-[#94A3B8]">
                Curso: <strong className="text-white">{parentEnrollment.courseLevel}</strong> • Série: <strong className="text-[#F45206]">{parentEnrollment.currentGrade}</strong> • Turno: <strong className="text-white">{parentEnrollment.schoolShift}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-2.5 text-center">
              <span className="text-[10px] text-[#94A3B8] font-bold block uppercase">Registro Único</span>
              <strong className="text-[17px] font-mono font-black text-[#F45206]">RM {parentEnrollment.rmNumber}</strong>
            </div>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="btn-secondary-rodin !bg-white/10 !text-white !border-white/20 hover:!bg-white/20 !py-2.5 !px-4 text-[12px]"
            >
              Voltar
            </button>
          </div>
        </div>

        {/* Stepper Responsivo e Amplo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { step: 1, title: '1. Dados do Estudante', desc: 'Identificação e documentação' },
            { step: 2, title: '2. Responsável Financeiro', desc: 'Qualificação e endereço' },
            { step: 3, title: '3. Requerimento & Assinatura', desc: 'Revisão oficial e assinatura digital' }
          ].map((s) => (
            <div
              key={s.step}
              className={`p-4 rounded-2xl border transition-all flex items-center gap-3.5 ${
                parentStep === s.step
                  ? 'bg-white border-[#F45206] shadow-sm ring-2 ring-[#F45206]/20'
                  : parentStep > s.step
                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]'
                  : 'bg-white/80 border-[#E2E8F0] text-[#64748B]'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-[13px] shrink-0 ${
                parentStep === s.step
                  ? 'bg-[#F45206] text-white shadow-md'
                  : parentStep > s.step
                  ? 'bg-[#059669] text-white'
                  : 'bg-[#F1F5F9] text-[#64748B]'
              }`}>
                {parentStep > s.step ? <Check size={16} /> : s.step}
              </div>
              <div>
                <strong className={`block text-[13px] ${parentStep === s.step ? 'text-[#1E293B]' : ''}`}>{s.title}</strong>
                <span className="text-[11px] block">{s.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* =============================================================
            ETAPA 1 DO PAI: DADOS DO ESTUDANTE (TODOS OBRIGATÓRIOS)
           ============================================================= */}
        {parentStep === 1 && (
          <div className="rodin-panel-card !p-5 sm:!p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <UserCheck size={20} className="text-[#F45206]" />
                <h2 className="text-[16px] sm:text-[18px] font-black text-[#1E293B]">
                  1. DADOS PESSOAIS DO ESTUDANTE
                </h2>
              </div>
              <span className="text-[11px] font-bold text-[#F45206] bg-[#FFF0E6] px-3 py-1 rounded-full border border-[#FED7AA]">
                Todos os campos são obrigatórios (*)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Nome Completo */}
              <div className="form-group sm:col-span-2">
                <label className="form-label">Nome completo (sem abreviaturas) *</label>
                <input
                  type="text"
                  placeholder="Ex: Bruno Fialho de Almeida"
                  value={parentFormData.studentName}
                  onChange={(e) => setParentFormData({ ...parentFormData, studentName: e.target.value })}
                  className={`form-control font-bold ${formErrors.studentName ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
                {formErrors.studentName && <span className="text-[11px] text-[#EF4444] font-bold">{formErrors.studentName}</span>}
              </div>

              {/* Sexo */}
              <div className="form-group">
                <label className="form-label">Sexo: *</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Masc.', 'Fem.'].map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => setParentFormData({ ...parentFormData, studentGender: gender })}
                      className={`h-[44px] rounded-xl font-bold text-[13px] border transition-all flex items-center justify-center gap-2 ${
                        parentFormData.studentGender === gender
                          ? 'bg-[#F45206] text-white border-[#F45206] shadow-sm'
                          : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data de Nascimento */}
              <div className="form-group">
                <label className="form-label">Data de Nasc.: *</label>
                <input
                  type="date"
                  value={parentFormData.studentBirthDate}
                  onChange={(e) => setParentFormData({ ...parentFormData, studentBirthDate: e.target.value })}
                  className={`form-control ${formErrors.studentBirthDate ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
              </div>

              {/* UF Nasc. (Estado) */}
              <div className="form-group">
                <label className="form-label">UF de Nasc. (Estado): *</label>
                <select
                  value={parentFormData.studentBirthState || 'SP'}
                  onChange={(e) => {
                    const newUf = e.target.value;
                    const cities = getCitiesByUF(newUf);
                    setParentFormData({
                      ...parentFormData,
                      studentBirthState: newUf,
                      studentBirthCity: cities[0] || 'Indaiatuba'
                    });
                  }}
                  className="form-select font-bold cursor-pointer hover:border-[#F45206]"
                >
                  {BRAZILIAN_UFS.map((u) => (
                    <option key={u.uf} value={u.uf}>
                      {u.uf} — {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cidade Nasc. */}
              <div className="form-group">
                <label className="form-label">Cidade de Nasc. ({parentFormData.studentBirthState || 'SP'}): *</label>
                <select
                  value={parentFormData.studentBirthCity || 'Indaiatuba'}
                  onChange={(e) => setParentFormData({ ...parentFormData, studentBirthCity: e.target.value })}
                  className="form-select font-bold cursor-pointer hover:border-[#F45206]"
                >
                  {getCitiesByUF(parentFormData.studentBirthState || 'SP', parentFormData.studentBirthCity).map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nacionalidade */}
              <div className="form-group">
                <label className="form-label">Nacionalidade: *</label>
                <input
                  type="text"
                  value={parentFormData.studentNationality}
                  onChange={(e) => setParentFormData({ ...parentFormData, studentNationality: e.target.value })}
                  className={`form-control ${formErrors.studentNationality ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
              </div>

              {/* RG */}
              <div className="form-group">
                <label className="form-label">RG: *</label>
                <input
                  type="text"
                  placeholder="00.000.000-0"
                  value={parentFormData.studentRg}
                  onChange={(e) => setParentFormData({ ...parentFormData, studentRg: e.target.value })}
                  className={`form-control font-mono ${formErrors.studentRg ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
              </div>

              {/* Órg. Exp. */}
              <div className="form-group">
                <label className="form-label">Órg. Exp.: *</label>
                <input
                  type="text"
                  placeholder="SSP/SP"
                  value={parentFormData.studentRgIssuer}
                  onChange={(e) => setParentFormData({ ...parentFormData, studentRgIssuer: e.target.value })}
                  className={`form-control uppercase font-mono ${formErrors.studentRgIssuer ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
              </div>

              {/* Emissão (Data Expedição) */}
              <div className="form-group">
                <label className="form-label">Emissão (Data Expedição): *</label>
                <input
                  type="date"
                  value={parentFormData.studentRgIssueDate}
                  onChange={(e) => setParentFormData({ ...parentFormData, studentRgIssueDate: e.target.value })}
                  className={`form-control ${formErrors.studentRgIssueDate ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
              </div>

              {/* CPF */}
              <div className="form-group sm:col-span-2">
                <label className="form-label">CPF do Estudante: *</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={parentFormData.studentCpf}
                  onChange={(e) => setParentFormData({ ...parentFormData, studentCpf: e.target.value })}
                  className={`form-control font-mono font-bold ${formErrors.studentCpf ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
              </div>

              {/* Tel. Celular / WhatsApp */}
              <div className="form-group">
                <label className="form-label">Tel. Celular / WhatsApp: *</label>
                <input
                  type="text"
                  placeholder="(19) 98765-4321"
                  value={parentFormData.studentPhone}
                  onChange={(e) => setParentFormData({ ...parentFormData, studentPhone: e.target.value })}
                  className={`form-control font-bold ${formErrors.studentPhone ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => {
                  if (validateParentStep(1)) setParentStep(2);
                }}
                className="btn-primary-rodin !py-3 !px-8 text-[13px]"
              >
                Avançar para Responsável Financeiro <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* =============================================================
            ETAPA 2 DO PAI: DADOS DO RESPONSÁVEL FINANCEIRO (TODOS OBRIGATÓRIOS)
           ============================================================= */}
        {parentStep === 2 && (
          <div className="rodin-panel-card !p-5 sm:!p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <Users size={20} className="text-[#F45206]" />
                <h2 className="text-[16px] sm:text-[18px] font-black text-[#1E293B]">
                  2. RESPONSÁVEL FINANCEIRO (SIGNATÁRIO)
                </h2>
              </div>
              <span className="text-[11px] font-bold text-[#F45206] bg-[#FFF0E6] px-3 py-1 rounded-full border border-[#FED7AA]">
                Todos os campos são obrigatórios (*)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Parentesco */}
              <div className="form-group">
                <label className="form-label">Parentesco: *</label>
                <select
                  value={(() => {
                    const val = parentFormData.guardianRelation;
                    if (['Pai', 'Mãe', 'Avô', 'Avó', 'Outro'].includes(val)) return val;
                    if (val === 'Avô / Avó' || val === 'Avô/Avó') return 'Avô';
                    if (val === 'Outro Responsável' || val === 'Tutor(a) Legal' || val === 'Tio / Tia') return 'Outro';
                    return val || 'Pai';
                  })()}
                  onChange={(e) => setParentFormData({ ...parentFormData, guardianRelation: e.target.value })}
                  className="form-select font-bold"
                >
                  <option value="Pai">Pai</option>
                  <option value="Mãe">Mãe</option>
                  <option value="Avô">Avô</option>
                  <option value="Avó">Avó</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {/* Nome Completo */}
              <div className="form-group sm:col-span-2">
                <label className="form-label">Nome completo do responsável: *</label>
                <input
                  type="text"
                  placeholder="Ex: Wanderson Pedro de Almeida"
                  value={parentFormData.guardianName}
                  onChange={(e) => setParentFormData({ ...parentFormData, guardianName: e.target.value })}
                  className={`form-control font-bold ${formErrors.guardianName ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
              </div>

              {/* Sexo */}
              <div className="form-group">
                <label className="form-label">Sexo: *</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Masc.', 'Fem.'].map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => setParentFormData({ ...parentFormData, guardianGender: gender })}
                      className={`h-[44px] rounded-xl font-bold text-[13px] border transition-all flex items-center justify-center gap-2 ${
                        parentFormData.guardianGender === gender
                          ? 'bg-[#F45206] text-white border-[#F45206] shadow-sm'
                          : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Nasc. */}
              <div className="form-group">
                <label className="form-label">Data de Nasc.: *</label>
                <input
                  type="date"
                  value={parentFormData.guardianBirthDate}
                  onChange={(e) => setParentFormData({ ...parentFormData, guardianBirthDate: e.target.value })}
                  className={`form-control ${formErrors.guardianBirthDate ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
              </div>

              {/* Ocupação */}
              <div className="form-group">
                <label className="form-label">Ocupação / Profissão: *</label>
                <input
                  type="text"
                  placeholder="Ex: Engenheiro, Administrador"
                  value={parentFormData.guardianOccupation}
                  onChange={(e) => setParentFormData({ ...parentFormData, guardianOccupation: e.target.value })}
                  className={`form-control ${formErrors.guardianOccupation ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
              </div>

              {/* Estado Civil */}
              <div className="form-group">
                <label className="form-label">Estado Civil: *</label>
                <select
                  value={parentFormData.guardianMaritalStatus}
                  onChange={(e) => setParentFormData({ ...parentFormData, guardianMaritalStatus: e.target.value })}
                  className="form-select font-bold"
                >
                  <option>Casado(a)</option>
                  <option>Solteiro(a)</option>
                  <option>Divorciado(a)</option>
                  <option>União Estável</option>
                  <option>Viúvo(a)</option>
                </select>
              </div>

              {/* RG */}
              <div className="form-group">
                <label className="form-label">RG: *</label>
                <input
                  type="text"
                  placeholder="00.000.000-0"
                  value={parentFormData.guardianRg}
                  onChange={(e) => setParentFormData({ ...parentFormData, guardianRg: e.target.value })}
                  className={`form-control font-mono ${formErrors.guardianRg ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
              </div>

              {/* Órg. Exped. */}
              <div className="form-group">
                <label className="form-label">Órg. Exped.: *</label>
                <input
                  type="text"
                  placeholder="SSP/SP"
                  value={parentFormData.guardianRgIssuer}
                  onChange={(e) => setParentFormData({ ...parentFormData, guardianRgIssuer: e.target.value })}
                  className={`form-control uppercase font-mono ${formErrors.guardianRgIssuer ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
              </div>

              {/* CPF */}
              <div className="form-group">
                <label className="form-label">CPF do Responsável: *</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={parentFormData.guardianCpf}
                  onChange={(e) => setParentFormData({ ...parentFormData, guardianCpf: e.target.value })}
                  className={`form-control font-mono font-bold ${formErrors.guardianCpf ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
              </div>

              {/* Nacionalidade */}
              <div className="form-group sm:col-span-2">
                <label className="form-label">Nacionalidade: *</label>
                <input
                  type="text"
                  value={parentFormData.guardianNationality}
                  onChange={(e) => setParentFormData({ ...parentFormData, guardianNationality: e.target.value })}
                  className={`form-control ${formErrors.guardianNationality ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
              </div>

              {/* CEP com Busca ViaCEP */}
              <div className="form-group">
                <label className="form-label flex items-center justify-between">
                  <span>CEP: *</span>
                  {isLoadingCep && (
                    <span className="text-[#F45206] flex items-center gap-1 text-[10px]">
                      <Loader2 size={11} className="animate-spin" /> buscando...
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="13340-385"
                  value={parentFormData.guardianAddressCep}
                  onChange={(e) => handleCepLookup(e.target.value)}
                  onBlur={(e) => handleCepLookup(e.target.value)}
                  className={`form-control font-mono font-bold ${formErrors.guardianAddressCep ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
              </div>

              {/* Logradouro */}
              <div className="form-group sm:col-span-2">
                <label className="form-label">Logradouro (Rua / Avenida): *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Rua / Avenida"
                    value={parentFormData.guardianAddressStreet}
                    onChange={(e) => setParentFormData({ ...parentFormData, guardianAddressStreet: e.target.value })}
                    className={`form-control sm:col-span-2 ${formErrors.guardianAddressStreet ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                  />
                  <input
                    type="text"
                    placeholder="Nº *"
                    value={parentFormData.guardianAddressNumber}
                    onChange={(e) => setParentFormData({ ...parentFormData, guardianAddressNumber: e.target.value })}
                    className={`form-control font-bold ${formErrors.guardianAddressNumber ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                  />
                </div>
              </div>

              {/* Complemento */}
              <div className="form-group">
                <label className="form-label">Complemento: (Opcional)</label>
                <input
                  type="text"
                  placeholder="Apto 42, Bloco B"
                  value={parentFormData.guardianAddressComplement}
                  onChange={(e) => setParentFormData({ ...parentFormData, guardianAddressComplement: e.target.value })}
                  className="form-control"
                />
              </div>

              {/* Bairro */}
              <div className="form-group">
                <label className="form-label">Bairro: *</label>
                <input
                  type="text"
                  placeholder="Bairro"
                  value={parentFormData.guardianAddressNeighborhood}
                  onChange={(e) => setParentFormData({ ...parentFormData, guardianAddressNeighborhood: e.target.value })}
                  className={`form-control ${formErrors.guardianAddressNeighborhood ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
              </div>

              {/* UF Residencial (Estado) */}
              <div className="form-group">
                <label className="form-label">UF Residencial (Estado): *</label>
                <select
                  value={parentFormData.guardianAddressState || 'SP'}
                  onChange={(e) => {
                    const newUf = e.target.value;
                    const cities = getCitiesByUF(newUf);
                    setParentFormData({
                      ...parentFormData,
                      guardianAddressState: newUf,
                      guardianAddressCity: cities[0] || 'Indaiatuba'
                    });
                  }}
                  className="form-select font-bold cursor-pointer hover:border-[#F45206]"
                >
                  {BRAZILIAN_UFS.map((u) => (
                    <option key={u.uf} value={u.uf}>
                      {u.uf} — {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cidade Residencial */}
              <div className="form-group">
                <label className="form-label">Cidade Residencial ({parentFormData.guardianAddressState || 'SP'}): *</label>
                <select
                  value={parentFormData.guardianAddressCity || 'Indaiatuba'}
                  onChange={(e) => setParentFormData({ ...parentFormData, guardianAddressCity: e.target.value })}
                  className="form-select font-bold cursor-pointer hover:border-[#F45206]"
                >
                  {getCitiesByUF(parentFormData.guardianAddressState || 'SP', parentFormData.guardianAddressCity).map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* E-mail */}
              <div className="form-group sm:col-span-2">
                <label className="form-label">E-mail: *</label>
                <input
                  type="email"
                  placeholder="responsavel@email.com"
                  value={parentFormData.guardianEmail}
                  onChange={(e) => setParentFormData({ ...parentFormData, guardianEmail: e.target.value })}
                  className={`form-control font-semibold text-[#F45206] ${formErrors.guardianEmail ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
              </div>

              {/* Tel Celular / WhatsApp */}
              <div className="form-group">
                <label className="form-label">Tel. Celular / WhatsApp: *</label>
                <input
                  type="text"
                  placeholder="(19) 98120-6515"
                  value={parentFormData.guardianPhone}
                  onChange={(e) => setParentFormData({ ...parentFormData, guardianPhone: e.target.value })}
                  className={`form-control font-bold ${formErrors.guardianPhone ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setParentStep(1)}
                className="btn-secondary-rodin !py-3 !px-6"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateParentStep(2)) setParentStep(3);
                }}
                className="btn-primary-rodin !py-3 !px-8 text-[13px]"
              >
                Avançar para Requerimento & Assinatura <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* =============================================================
            ETAPA 3 DO PAI: REQUERIMENTO OFICIAL 2027 & ASSINATURA DIGITAL
            3 Assinaturas Prontas (Balder e Testemunhas) + 1 Espaço para o Pai
           ============================================================= */}
        {parentStep === 3 && (
          <div className="space-y-6">
            {/* Documento Timbrado Oficial */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-[#CBD5E1] shadow-lg space-y-6 text-[#1E293B]">
              {/* Header do Requerimento */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b-2 border-[#1E293B] gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F45206] text-white flex items-center justify-center font-black text-2xl">
                    R
                  </div>
                  <div>
                    <span className="text-[12px] font-bold tracking-tight text-[#64748B] block">colégio</span>
                    <strong className="text-[20px] font-black tracking-widest text-[#1E293B] block -mt-1">RODIN</strong>
                  </div>
                </div>

                <div className="text-center sm:text-right flex-1 sm:px-6">
                  <h2 className="text-[15px] sm:text-[17px] font-black uppercase tracking-tight text-[#1E293B]">
                    REQUERIMENTO DE MATRÍCULA - EDUCAÇÃO BÁSICA {parentEnrollment.academicYear || 2027}
                  </h2>
                  <p className="text-[11px] font-semibold text-[#475569]">
                    Termo de Adesão ao Instrumento de Adesão às Atividades Educacionais
                  </p>
                </div>

                <div className="border-2 border-[#1E293B] rounded-lg p-2 px-4 text-center shrink-0 self-start">
                  <span className="text-[10px] font-black text-[#64748B] block">RM:</span>
                  <strong className="text-[16px] font-black font-mono text-[#F45206] block">
                    {parentEnrollment.rmNumber}
                  </strong>
                </div>
              </div>

              {/* Cláusulas Legais (Ao diretor da escola, a-e) */}
              <div className="text-[11px] text-[#334155] leading-relaxed space-y-3 bg-[#F8FAFC] p-4 sm:p-5 rounded-2xl border border-[#E2E8F0]">
                <p className="font-bold text-[#1E293B]">Ao diretor da escola,</p>
                <p>
                  Na qualidade de responsável financeiro pelo(a) estudante adiante identificado(a) e nos termos da legislação em vigor, do Regimento Escolar, do Plano Escolar, da Cartilha de Direitos e Deveres dos Alunos, do KIT DE MATRÍCULA, requeiro sua matrícula declarando estar ciente de que:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10.5px]">
                  <div className="space-y-2">
                    <p><strong>a)</strong> a presente solicitação deve ser analisada pelos diversos setores da escola, dentre eles o Pedagógico e o Financeiro, podendo ser ou não deferida. Em caso de indeferimento, a escola comunicará o responsável/aluno em até 10 dias úteis após a assinatura do Requerimento de Matrícula e serão devolvidas integralmente todas as quantias pagas relativas à anuidade.</p>
                    <p><strong>b)</strong> o responsável financeiro obriga-se a disponibilizar o material didático integral (composto pelas modalidades física e digital, incluindo todos os acessos às plataformas de ensino) no início das aulas do ano letivo, sem o qual fica impossibilitada a prestação do serviço educacional.</p>
                  </div>
                  <div className="space-y-2">
                    <p><strong>c)</strong> este requerimento é parte integrante do Instrumento de Adesão às Atividades Educacionais ministradas pela Escola e será prenotado no Cartório Oficial de Registro de Imóveis, Títulos e Documentos e Civil de Pessoa Jurídica da Comarca de Indaiatuba/SP.</p>
                    <p><strong>d)</strong> aceito as condições do Regimento Escolar, da Proposta Pedagógica, do Plano Escolar, do Kit de Matrículas e valor da anuidade, plano e forma de pagamento pela qual optei.</p>
                  </div>
                </div>
              </div>

              {/* 1. DADOS PESSOAIS DO ESTUDANTE */}
              <div className="border border-[#CBD5E1] rounded-xl p-4 space-y-2 text-[12px]">
                <span className="text-[11px] font-black uppercase text-[#1E293B] block border-b pb-1">
                  1. DADOS PESSOAIS DO ESTUDANTE
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-[#64748B] block">Nome completo:</span>
                    <strong className="text-[#1E293B]">{parentFormData.studentName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Sexo:</span>
                    <strong>{parentFormData.studentGender}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Data de Nasc.:</span>
                    <strong>{parentFormData.studentBirthDate}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Local Nasc.:</span>
                    <span>{parentFormData.studentBirthCity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">RG / Órg. Exp.:</span>
                    <span>{parentFormData.studentRg} ({parentFormData.studentRgIssuer})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Emissão / CPF:</span>
                    <span>{parentFormData.studentRgIssueDate} | {parentFormData.studentCpf}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Nacionalidade:</span>
                    <span>{parentFormData.studentNationality}</span>
                  </div>
                </div>
              </div>

              {/* 2. DADOS ACADÊMICOS DO ESTUDANTE */}
              <div className="border border-[#CBD5E1] rounded-xl p-4 space-y-2 text-[12px]">
                <span className="text-[11px] font-black uppercase text-[#1E293B] block border-b pb-1">
                  2. DADOS ACADÊMICOS DO ESTUDANTE
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Curso:</span>
                    <strong>{parentEnrollment.courseLevel}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Turno:</span>
                    <strong>{parentEnrollment.schoolShift}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Ano/Série/Modalidade:</span>
                    <strong className="text-[#F45206]">{parentEnrollment.currentGrade}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Tel. Celular / WhatsApp:</span>
                    <span>{parentFormData.studentPhone}</span>
                  </div>
                </div>
              </div>

              {/* 3. DADOS FINANCEIROS (PLANO E FORMA DE PAGAMENTO) */}
              <div className="border border-[#CBD5E1] rounded-xl p-4 space-y-2 text-[12px]">
                <span className="text-[11px] font-black uppercase text-[#1E293B] block border-b pb-1">
                  3. DADOS FINANCEIROS DO ESTUDANTE (PLANO E FORMA DE PAGAMENTO)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Valor Total Anuidade:</span>
                    <strong className="text-[#F45206] text-[13px]">
                      R$ {formatNumberToBRL(parentEnrollment.tuitionGrossTotal)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Quant. Parcelas:</span>
                    <strong>{parentEnrollment.installmentsCount} parcelas</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Valor da 1ª Parcela:</span>
                    <strong className="block text-[#059669]">
                      R$ {formatNumberToBRL(parentEnrollment.firstInstallmentValue)}
                    </strong>
                    {parentEnrollment.firstInstallmentSplit > 1 ? (
                      <span className="text-[10px] text-[#F45206] font-bold block">
                        ({parentEnrollment.firstInstallmentSplit}x de R$ {formatNumberToBRL(parentEnrollment.firstInstallmentValue / parentEnrollment.firstInstallmentSplit)})
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#64748B] block">(À vista)</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Valor Parcelas Restantes*:</span>
                    <strong>R$ {formatNumberToBRL(parentEnrollment.regularInstallmentValue)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Venc. Cotas 1ª Parc.:</span>
                    <strong>Dia {parentEnrollment.quotaDueDate || parentEnrollment.firstInstallmentDueDate || '15'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Venc. Demais Parcelas:</span>
                    <strong>Todo dia {parentEnrollment.installmentDueDate || '1º'}</strong>
                  </div>
                </div>
                <p className="text-[10px] text-[#64748B] pt-1">
                  * Boleto Bancário com vencimento mensal e sucessivo.
                </p>
              </div>

              {/* 4. RESPONSÁVEL FINANCEIRO */}
              <div className="border border-[#CBD5E1] rounded-xl p-4 space-y-2 text-[12px]">
                <span className="text-[11px] font-black uppercase text-[#1E293B] block border-b pb-1">
                  4. RESPONSÁVEL FINANCEIRO
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-[#64748B] block">Nome ({parentFormData.guardianRelation}):</span>
                    <strong className="text-[#1E293B]">{parentFormData.guardianName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Sexo / Estado Civil:</span>
                    <span>{parentFormData.guardianGender} | {parentFormData.guardianMaritalStatus}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">Data Nasc. / Ocupação:</span>
                    <span>{parentFormData.guardianBirthDate} | {parentFormData.guardianOccupation}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">RG / Órg. Exped.:</span>
                    <span>{parentFormData.guardianRg} ({parentFormData.guardianRgIssuer})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">CPF:</span>
                    <strong>{parentFormData.guardianCpf}</strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-[#64748B] block">Endereço Completo:</span>
                    <span>{parentFormData.guardianAddressStreet}, nº {parentFormData.guardianAddressNumber} {parentFormData.guardianAddressComplement ? '- ' + parentFormData.guardianAddressComplement : ''} - {parentFormData.guardianAddressNeighborhood}, {parentFormData.guardianAddressCity}/{parentFormData.guardianAddressState} (CEP: {parentFormData.guardianAddressCep})</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-[#64748B] block">E-mail:</span>
                    <strong className="text-[#F45206]">{parentFormData.guardianEmail}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] block">WhatsApp:</span>
                    <strong>{parentFormData.guardianPhone}</strong>
                  </div>
                </div>
              </div>

              {/* SEÇÃO DE ASSINATURAS DO CONTRATO (3 PRONTAS + 1 ESPAÇO PARA O PAI) */}
              <div className="pt-4 border-t-2 border-[#1E293B] space-y-6">
                <div className="flex items-center justify-between">
                  <p className="font-black text-[13px] text-[#1E293B]">
                    Nestes termos peço deferimento,
                  </p>
                  <span className="text-[11px] font-bold text-[#64748B]">
                    Indaiatuba/SP, {new Date().toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {/* Grid das 4 Assinaturas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                  {/* ASSINATURA 1: RESPONSÁVEL FINANCEIRO (ESPAÇO EXCLUSIVO DO PAI) */}
                  <div className="border-2 border-dashed border-[#F45206] bg-[#FFF0E6]/30 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black uppercase text-[#F45206] flex items-center gap-1.5">
                        <PenTool size={14} /> Sua Assinatura (Responsável Financeiro) *
                      </span>
                      {hasParentSignature && (
                        <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                          ✓ Assinado no Quadro
                        </span>
                      )}
                    </div>

                    {/* Canvas Interativo para o Pai Desenhar a Assinatura */}
                    <div className="relative bg-white rounded-xl border border-[#FED7AA] overflow-hidden shadow-inner">
                      <canvas
                        ref={canvasRef}
                        width={640}
                        height={360}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-[180px] cursor-crosshair touch-none"
                      />
                      {!hasParentSignature && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-[12px] text-[#94A3B8] font-semibold">
                          ✍️ Desenhe ou assine com o mouse / toque aqui
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[11px] font-bold text-[#64748B] flex items-center gap-1 transition-colors"
                      >
                        <Eraser size={12} /> Limpar
                      </button>
                    </div>

                    <div className="border-t border-[#CBD5E1] pt-2 text-[11px]">
                      <strong className="block text-[#1E293B]">{parentFormData.guardianName || 'Nome do Responsável'}</strong>
                      <span className="text-[#64748B]">CPF: {parentFormData.guardianCpf || '000.000.000-00'}</span>
                    </div>
                  </div>

                  {/* ASSINATURA 2: BALDER EDUCACIONAL LTDA (JÁ PRONTA) */}
                  <div className="border border-[#CBD5E1] bg-[#F8FAFC] p-4 rounded-2xl space-y-3 flex flex-col justify-between">
                    <span className="text-[11px] font-black uppercase text-[#1E293B]">
                      BALDER EDUCACIONAL LTDA · CNPJ: 29.221.297/0001-05
                    </span>
                    <img src={signatureCanela} alt="Balder Educacional" className="h-12 w-auto object-contain mx-auto" />
                    <div className="border-t border-[#CBD5E1] pt-2 text-[11px]">
                      <strong className="block text-[#1E293B]">Direção / Balder Educacional</strong>
                      <span className="text-[#64748B]">Colégio Rodin - Indaiatuba / SP</span>
                    </div>
                  </div>

                  {/* ASSINATURA 3: TESTEMUNHA 1 - ELISANGELA C. SANTOS (JÁ PRONTA) */}
                  <div className="border border-[#CBD5E1] bg-[#F8FAFC] p-4 rounded-2xl space-y-3 flex flex-col justify-between">
                    <span className="text-[11px] font-black uppercase text-[#1E293B]">
                      Testemunha 1
                    </span>
                    <img src={signatureElisangela} alt="Elisangela C. Santos" className="h-12 w-auto object-contain mx-auto" />
                    <div className="border-t border-[#CBD5E1] pt-2 text-[11px]">
                      <strong className="block text-[#1E293B]">Elisangela C. Santos</strong>
                      <span className="text-[#64748B]">RG: 28.246.044-5 • CPF: 256.209.898-60</span>
                    </div>
                  </div>

                  {/* ASSINATURA 4: TESTEMUNHA 2 - KELLY C. M. SANTOS (JÁ PRONTA) */}
                  <div className="border border-[#CBD5E1] bg-[#F8FAFC] p-4 rounded-2xl space-y-3 flex flex-col justify-between">
                    <span className="text-[11px] font-black uppercase text-[#1E293B]">
                      Testemunha 2
                    </span>
                    <img src={signatureKelly} alt="Kelly C. M. Santos" className="h-12 w-auto object-contain mx-auto" />
                    <div className="border-t border-[#CBD5E1] pt-2 text-[11px]">
                      <strong className="block text-[#1E293B]">Kelly C. M. Santos</strong>
                      <span className="text-[#64748B]">RG: 25.242.096-2 • CPF: 194.797.828-47</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-[#94A3B8] text-right pt-2 border-t border-[#E2E8F0]">
                  Rua Padre Anchieta, 484, Vila Sfeir - Indaiatuba - SP
                </div>
              </div>
            </div>

            {/* Ações Finais */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
              <button
                type="button"
                onClick={() => setParentStep(2)}
                className="btn-secondary-rodin !py-3 !px-6 w-full sm:w-auto"
              >
                <ArrowLeft size={16} /> Voltar para Dados do Responsável
              </button>

              <button
                type="button"
                onClick={handleParentFinalSubmit}
                className="btn-primary-rodin !py-4 !px-10 text-[14px] shadow-lg w-full sm:w-auto flex items-center justify-center gap-2 font-black"
              >
                <FileSignature size={18} />
                Concluir Preenchimento e Enviar Matrícula Assinada
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: SETOR DE MATRÍCULAS GERA PROPOSTA & LINK PARA A FAMÍLIA
  // =========================================================================
  if (viewMode === 'proposal-creator') {
    return (
      <div className="w-full space-y-6 pb-16 animate-fadeIn">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => {
              setActiveTab('matriculas-list');
              setViewMode('list');
            }}
            className="btn-secondary-rodin !py-2 !px-3.5 text-[12px]"
          >
            <ArrowLeft size={15} /> Voltar para Lista de Matrículas
          </button>
          <span className="text-[12px] font-bold text-[#64748B]">
            Etapa do Setor de Matrículas: Parametrização e Emissão do Link
          </span>
        </div>

        <div className="rodin-panel-card !p-5 sm:!p-8 shadow-sm">
          {/* Header da Proposta */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-[#E2E8F0] mb-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF0E6] text-[#F45206] flex items-center justify-center shadow-sm shrink-0">
                <FileSignature size={22} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#F45206] block">
                  Colégio Rodin • Setor de Matrículas
                </span>
                <h1 className="text-[18px] sm:text-[22px] font-black text-[#1E293B] leading-tight">
                  Nova Proposta de Matrícula {proposalData.academicYear} — Gerar Link para Família
                </h1>
                <p className="text-[12px] text-[#64748B]">
                  Defina o curso, anuidade e parcelas. O pai receberá o link para preencher todos os dados e assinar.
                </p>
              </div>
            </div>

            {/* RM Gerado pelo Sistema */}
            <div className="bg-[#FFF0E6] border-2 border-[#FED7AA] rounded-2xl p-3 px-4 flex items-center gap-3 self-start md:self-auto shrink-0 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-[#F45206] text-white flex items-center justify-center font-bold">
                <Lock size={16} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] font-black text-[#64748B] uppercase block">
                    RM (Registro Único do Aluno)
                  </label>
                  <span className="text-[9px] font-black text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded border border-[#A7F3D0]">
                    Sistema
                  </span>
                </div>
                <span className="font-mono font-black text-[16px] text-[#F45206] block">
                  {proposalData.rmNumber}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleGenerateProposalSubmit} className="space-y-8">
            {/* Bloco 1: Parâmetros Acadêmicos */}
            <div className="bg-[#F8FAFC] rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
                <GraduationCap size={18} className="text-[#F45206]" />
                <h3 className="text-[14px] font-black text-[#1E293B]">
                  1. PARÂMETROS ACADÊMICOS DA PROPOSTA
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Ano Letivo */}
                <div className="form-group">
                  <label className="form-label">Ano Letivo: *</label>
                  <select
                    value={proposalData.academicYear}
                    onChange={(e) => setProposalData({ ...proposalData, academicYear: e.target.value })}
                    className="form-select font-bold text-[#1E293B]"
                  >
                    <option value="">Selecione o ano...</option>
                    <option value={String(nextYear)}>{nextYear} (Próximo Ano)</option>
                    <option value={String(currentYear)}>{currentYear} (Ano Corrente)</option>
                  </select>
                </div>

                {/* Curso */}
                <div className="form-group">
                  <label className="form-label">Curso: *</label>
                  <select
                    value={proposalData.courseLevel}
                    onChange={(e) => {
                      const level = e.target.value;
                      setProposalData({ ...proposalData, courseLevel: level, currentGrade: '' });
                    }}
                    className="form-select font-bold text-[#1E293B]"
                  >
                    <option value="">Selecione o curso...</option>
                    <option value="Ensino Fundamental">Ensino Fundamental</option>
                    <option value="Ensino Médio">Ensino Médio</option>
                    <option value="Terceirão / Pré-Vestibular">Terceirão / Pré-Vestibular</option>
                  </select>
                </div>

                {/* Turno (Manhã e Integral) */}
                <div className="form-group">
                  <label className="form-label">Turno: *</label>
                  <select
                    value={proposalData.schoolShift}
                    onChange={(e) => setProposalData({ ...proposalData, schoolShift: e.target.value })}
                    className="form-select font-bold text-[#1E293B]"
                  >
                    <option value="">Selecione o turno...</option>
                    <option value="Manhã">Manhã</option>
                    <option value="Integral">Integral</option>
                  </select>
                </div>

                {/* Ano/Série/Modalidade */}
                <div className="form-group">
                  <label className="form-label">Ano/Série/Modalidade: *</label>
                  <select
                    value={proposalData.currentGrade}
                    onChange={(e) => {
                      const selGrade = e.target.value;
                      if (selGrade) {
                        const rates = getFixedRatesForGrade(selGrade);
                        const count = parseInt(proposalData.installmentsCount) || rates.tuitionInstallmentsCount;
                        const parc = formatNumberToBRL(rates.tuitionNominalNum / count);
                        setProposalData(prev => ({
                          ...prev,
                          currentGrade: selGrade,
                          tuitionGrossTotal: rates.tuitionNominalTotal,
                          firstInstallmentValue: parc,
                          regularInstallmentValue: parc,
                          materialTotalValue: rates.materialTotalValue,
                          materialInstallmentsCount: String(rates.materialInstallmentsCount)
                        }));
                      } else {
                        setProposalData(prev => ({ ...prev, currentGrade: '' }));
                      }
                    }}
                    className="form-select font-bold text-[#1E293B]"
                    disabled={!proposalData.courseLevel}
                  >
                    <option value="">{proposalData.courseLevel ? 'Selecione a série...' : 'Selecione o curso primeiro'}</option>
                    {proposalData.courseLevel === 'Ensino Fundamental' || proposalData.courseLevel === 'Ensino Fundamental II' ? (
                      <>
                        <option value="6º Ano EF">6º Ano EF</option>
                        <option value="7º Ano EF">7º Ano EF</option>
                        <option value="8º Ano EF">8º Ano EF</option>
                        <option value="9º Ano EF">9º Ano EF</option>
                      </>
                    ) : proposalData.courseLevel === 'Ensino Médio' ? (
                      <>
                        <option value="1ª Série EM">1ª Série EM</option>
                        <option value="2ª Série EM">2ª Série EM</option>
                        <option value="3ª Série EM">3ª Série EM</option>
                      </>
                    ) : proposalData.courseLevel === 'Terceirão / Pré-Vestibular' ? (
                      <>
                        <option value="3ª Série EM (Terceirão)">3ª Série EM (Terceirão)</option>
                        <option value="Extensivo Pré-Vestibular">Extensivo Pré-Vestibular</option>
                      </>
                    ) : null}
                  </select>
                </div>
              </div>
            </div>

            {/* Bloco 2: Dados Financeiros (Plano e Parcelas em Real BRL) */}
            <div className="bg-[#F8FAFC] rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
                <CreditCard size={18} className="text-[#F45206]" />
                <h3 className="text-[14px] font-black text-[#1E293B]">
                  2. DADOS FINANCEIROS (PLANO E FORMA DE PAGAMENTO)
                </h3>
              </div>

              {/* Grid 100% Alinhado com Rótulos de Altura Padronizada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
                <div className="form-group flex flex-col">
                  <label className="form-label min-h-[38px] flex items-end leading-tight mb-1.5">
                    <span>Valor Total da Anuidade: *</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-[12px] text-[#94A3B8] pointer-events-none">
                      R$
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 34.663,20"
                      value={proposalData.tuitionGrossTotal}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d.,]/g, '');
                        const numVal = parseBRLToNumber(raw);
                        
                        setProposalData(prev => {
                          const count = parseInt(prev.installmentsCount) || 0;
                          let first = prev.firstInstallmentValue;
                          let regular = prev.regularInstallmentValue;
                          
                          if (count > 0 && numVal > 0) {
                            if (!first || parseBRLToNumber(first) === 0) {
                              first = formatNumberToBRL(numVal / count);
                            }
                            const firstNum = parseBRLToNumber(first);
                            if (count > 1) {
                              const remaining = Math.max(0, numVal - firstNum);
                              regular = formatNumberToBRL(remaining / (count - 1));
                            } else {
                              regular = '0,00';
                            }
                          }
                          return {
                            ...prev,
                            tuitionGrossTotal: raw,
                            firstInstallmentValue: first,
                            regularInstallmentValue: regular
                          };
                        });
                      }}
                      onBlur={(e) => {
                        const numVal = parseBRLToNumber(e.target.value);
                        if (numVal > 0) {
                          setProposalData(prev => ({
                            ...prev,
                            tuitionGrossTotal: formatNumberToBRL(numVal)
                          }));
                        }
                      }}
                      className="form-control !pl-10 font-bold !text-[#F45206] text-[15px]"
                    />
                  </div>
                </div>

                <div className="form-group flex flex-col">
                  <label className="form-label min-h-[38px] flex items-end leading-tight mb-1.5">
                    <span>Quant. de Parcelas: *</span>
                  </label>
                  <select
                    value={proposalData.installmentsCount}
                    onChange={(e) => {
                      const val = e.target.value;
                      const count = parseInt(val) || 0;
                      setProposalData(prev => {
                        const total = parseBRLToNumber(prev.tuitionGrossTotal);
                        let first = prev.firstInstallmentValue;
                        let regular = '';
                        
                        if (total > 0 && count > 0) {
                          if (!first || parseBRLToNumber(first) === 0) {
                            first = formatNumberToBRL(total / count);
                          }
                          const firstNum = parseBRLToNumber(first);
                          if (count > 1) {
                            const remaining = Math.max(0, total - firstNum);
                            regular = formatNumberToBRL(remaining / (count - 1));
                          } else {
                            first = formatNumberToBRL(total);
                            regular = '0,00';
                          }
                        }
                        return {
                          ...prev,
                          installmentsCount: val,
                          firstInstallmentValue: first,
                          regularInstallmentValue: regular
                        };
                      });
                    }}
                    className="form-select font-bold text-[#1E293B]"
                  >
                    <option value="">Selecione...</option>
                    {[13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((num) => (
                      <option key={num} value={num}>
                        {num === 1 ? '1 Parcela (À Vista)' : num === 13 ? '13 Parcelas (Matrícula + 12x)' : `${num} Parcelas Mensais`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group flex flex-col">
                  <label className="form-label min-h-[38px] flex items-end leading-tight mb-1.5">
                    <span>Valor da 1ª parcela: *</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-[12px] text-[#94A3B8] pointer-events-none">
                      R$
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 2.617,52"
                      value={proposalData.firstInstallmentValue}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d.,]/g, '');
                        const numVal = parseBRLToNumber(raw);
                        
                        setProposalData(prev => {
                          const total = parseBRLToNumber(prev.tuitionGrossTotal);
                          const count = parseInt(prev.installmentsCount) || 0;
                          let regular = prev.regularInstallmentValue;
                          
                          if (total > 0 && count > 1 && numVal > 0) {
                            const remaining = Math.max(0, total - numVal);
                            regular = formatNumberToBRL(remaining / (count - 1));
                          } else if (count === 1) {
                            regular = '0,00';
                          }
                          return {
                            ...prev,
                            firstInstallmentValue: raw,
                            regularInstallmentValue: regular
                          };
                        });
                      }}
                      onBlur={(e) => {
                        const numVal = parseBRLToNumber(e.target.value);
                        if (numVal > 0) {
                          setProposalData(prev => ({
                            ...prev,
                            firstInstallmentValue: formatNumberToBRL(numVal)
                          }));
                        }
                      }}
                      className="form-control !pl-10 font-bold text-[#1E293B]"
                    />
                  </div>
                </div>

                <div className="form-group flex flex-col">
                  <div className="min-h-[38px] flex items-end justify-between leading-tight mb-1.5">
                    <label className="form-label !mb-0">
                      Valor das demais parcelas*: *
                    </label>
                    <span className="text-[9.5px] font-extrabold text-[#059669] flex items-center gap-1 bg-[#ECFDF5] px-1.5 py-0.5 rounded border border-[#A7F3D0]">
                      <Lock size={10} /> Automático
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-[12px] text-[#94A3B8] pointer-events-none">
                      R$
                    </span>
                    <input
                      type="text"
                      readOnly
                      placeholder="0,00"
                      value={proposalData.regularInstallmentValue}
                      className="form-control !pl-10 font-black text-[#1E293B] bg-[#F1F5F9] border-[#CBD5E1] cursor-not-allowed select-none shadow-inner"
                      title="Calculado automaticamente pelo sistema: (Anuidade - 1ª Parcela) / (Nº Parcelas - 1)"
                    />
                  </div>
                </div>

                {/* Destaque: Opção de Pagamento da 1ª Parcela em até 5x */}
                <div className="sm:col-span-2 lg:col-span-4 p-4 sm:p-5 rounded-2xl bg-[#FFF0E6]/50 border-2 border-[#FED7AA] space-y-3.5 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#FED7AA] pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#F45206] text-white flex items-center justify-center font-bold shrink-0">
                        <CreditCard size={17} />
                      </div>
                      <div>
                        <strong className="text-[#1E293B] font-black text-[13.5px] block">
                          Condição de Pagamento da 1ª Parcela (Matrícula / Rematrícula)
                        </strong>
                        <span className="text-[11px] text-[#64748B] block">
                          A 1ª parcela pode ser quitada à vista ou dividida em até 3x no Cartão ou Boleto.
                        </span>
                      </div>
                    </div>
                    <span className="self-start sm:self-auto text-[11px] font-black text-[#059669] bg-[#ECFDF5] px-3 py-1 rounded-full border border-[#A7F3D0] shadow-2xs">
                      ✓ Permitido em até 3x
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Seletor de Parcelamento da 1ª Parcela */}
                    <div className="form-group flex flex-col">
                      <label className="form-label font-bold text-[12px] text-[#334155] mb-1.5 flex items-center justify-between">
                        <span>Parcelamento da 1ª Parcela: *</span>
                        <span className="text-[10px] text-[#F45206] font-black uppercase">Até 3x</span>
                      </label>
                      <select
                        value={Math.min(proposalData.firstInstallmentSplit || 1, 3)}
                        onChange={(e) => setProposalData(prev => ({ ...prev, firstInstallmentSplit: parseInt(e.target.value) || 1 }))}
                        className="form-select font-black text-[#1E293B] bg-white border-[#FED7AA] focus:border-[#F45206] focus:ring-1 focus:ring-[#F45206]"
                      >
                        {[1, 2, 3].map((split) => {
                          const firstNum = parseBRLToNumber(proposalData.firstInstallmentValue);
                          const splitVal = firstNum > 0 ? (firstNum / split) : 0;
                          return (
                            <option key={split} value={split}>
                              {`${split}x de R$ ${formatNumberToBRL(splitVal)}`}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Forma de Pagamento da 1ª Parcela */}
                    <div className="form-group flex flex-col">
                      <label className="form-label font-bold text-[12px] text-[#334155] mb-1.5">
                        Forma de Pagamento da 1ª Parcela: *
                      </label>
                      <select
                        value={proposalData.firstInstallmentPaymentMethod || 'Cartão de Crédito (até 3x) ou Boleto'}
                        onChange={(e) => setProposalData(prev => ({ ...prev, firstInstallmentPaymentMethod: e.target.value }))}
                        className="form-select font-bold text-[#1E293B] bg-white border-[#FED7AA]"
                      >
                        <option value="Cartão de Crédito (até 3x) ou Boleto">Cartão de Crédito (até 3x) ou Boleto</option>
                        <option value="Cartão de Crédito (em até 3x)">Cartão de Crédito (em até 3x)</option>
                        <option value="Boleto Bancário (em até 3x)">Boleto Bancário (em até 3x)</option>
                        <option value="PIX / Transferência (À Vista)">PIX / À Vista</option>
                      </select>
                    </div>

                    {/* Card de Resumo Visual da 1ª Parcela */}
                    <div className="bg-white p-3.5 rounded-xl border border-[#FED7AA] shadow-2xs flex flex-col justify-center">
                      <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">
                        Plano da 1ª Parcela:
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <strong className="text-[16px] font-black text-[#F45206]">
                          {(proposalData.firstInstallmentSplit || 1)}x de R$ {
                            formatNumberToBRL(
                              parseBRLToNumber(proposalData.firstInstallmentValue) / (proposalData.firstInstallmentSplit || 1)
                            )
                          }
                        </strong>
                        <span className="text-[11px] text-[#059669] font-bold">
                          {(proposalData.firstInstallmentSplit || 1) > 1 ? '(dividida)' : '(à vista)'}
                        </span>
                      </div>
                      <span className="text-[10.5px] text-[#475569] font-medium mt-0.5">
                        Total 1ª Parcela: R$ {proposalData.firstInstallmentValue || '0,00'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-4 p-4 rounded-xl bg-white border border-[#CBD5E1] text-[12px] space-y-1 mt-2">
                  <strong className="text-[#1E293B] block">
                    * Boleto Bancário com vencimento mensal e sucessivo todo dia: 1º.
                  </strong>
                  <p className="text-[#64748B]">
                    Esses valores serão fixados no Requerimento Oficial 2027 que o pai irá preencher e assinar.
                  </p>
                </div>
              </div>
            </div>

            {/* Bloco 3: Pedido de Material Didático (Livraria do Pensador LTDA - CNPJ: 43.849.399/0001-92) */}
            <div className="bg-[#F8FAFC] rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#E2E8F0] gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-[#F45206]" />
                  <h3 className="text-[14px] font-black text-[#1E293B]">
                    3. PEDIDO DE MATERIAL DIDÁTICO (LIVRARIA DO PENSADOR LTDA)
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                  CNPJ: 43.849.399/0001-92 • Empresa Parceira Exclusiva
                </span>
              </div>

              {/* Alerta de Desacoplamento do Comprador */}
              <div className="p-3.5 bg-[#FFF0E6]/60 border border-[#FED7AA] rounded-xl text-[12px] text-[#431407] space-y-1">
                <div className="font-black flex items-center gap-1.5 text-[#C2410C]">
                  <Sparkles size={14} /> Campo Independente de Comprador do Material Didático
                </div>
                <p className="text-[11.5px] text-[#78350F] leading-relaxed">
                  O pedido de material pedagógico é formalizado junto à <strong>Livraria do Pensador LTDA</strong>. O comprador é pré-preenchido automaticamente com o responsável financeiro, mas você pode personalizá-lo livremente — alterações ou exclusões no comprador <strong>não alteram o responsável financeiro da escola</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
                {/* Checkbox de Sincronização */}
                <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-2.5 bg-white p-3 rounded-xl border border-[#CBD5E1]">
                  <input
                    type="checkbox"
                    id="prop_isBuyerSameAsFinancial"
                    checked={proposalData.isBuyerSameAsFinancial}
                    onChange={(e) => handleProposalToggleSameBuyer(e.target.checked)}
                    className="w-4 h-4 text-[#F45206] rounded border-[#CBD5E1] focus:ring-[#F45206]"
                  />
                  <label htmlFor="prop_isBuyerSameAsFinancial" className="text-[12px] font-bold text-[#1E293B] cursor-pointer">
                    Comprador do Material é o mesmo Responsável Financeiro da Matrícula (preenchimento automático)
                  </label>
                </div>

                {/* Nome do Comprador do Material */}
                <div className="form-group flex flex-col">
                  <label className="form-label min-h-[38px] flex items-end leading-tight mb-1.5">
                    <span>Nome do Comprador do Material:</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nome completo do comprador"
                    value={proposalData.materialBuyerName}
                    onChange={(e) => handleProposalMaterialBuyerFieldChange('materialBuyerName', e.target.value)}
                    className="form-control font-semibold"
                  />
                  <span className="text-[10px] text-[#64748B] mt-1">
                    Não altera o responsável financeiro.
                  </span>
                </div>

                {/* CPF do Comprador do Material */}
                <div className="form-group flex flex-col">
                  <label className="form-label min-h-[38px] flex items-end leading-tight mb-1.5">
                    <span>CPF do Comprador:</span>
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={proposalData.materialBuyerCpf}
                    onChange={(e) => handleProposalMaterialBuyerFieldChange('materialBuyerCpf', e.target.value)}
                    className="form-control font-mono font-semibold"
                  />
                  <span className="text-[10px] text-[#64748B] mt-1">
                    Válido para a Livraria do Pensador.
                  </span>
                </div>

                {/* Valor Total do Material Didático */}
                <div className="form-group flex flex-col">
                  <label className="form-label min-h-[38px] flex items-end leading-tight mb-1.5">
                    <span>Valor Total do Material Didático:</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-extrabold text-[12px] text-[#94A3B8] pointer-events-none">
                      R$
                    </span>
                    <input
                      type="text"
                      placeholder="Ex: 5.248,80 (Opcional)"
                      value={proposalData.materialTotalValue}
                      onChange={(e) => setProposalData({ ...proposalData, materialTotalValue: e.target.value })}
                      className="form-control !pl-10 font-bold text-[#1E293B]"
                    />
                  </div>
                  <span className="text-[10px] text-[#64748B] mt-1">
                    Definido conforme a série/ano do aluno.
                  </span>
                </div>

                {/* Parcelas do Material Didático */}
                <div className="form-group flex flex-col">
                  <label className="form-label min-h-[38px] flex items-end leading-tight mb-1.5">
                    <span>Parcelas (Material Didático):</span>
                  </label>
                  <select
                    value={proposalData.materialInstallmentsCount || '12'}
                    onChange={(e) => setProposalData({ ...proposalData, materialInstallmentsCount: e.target.value })}
                    className="form-select font-bold text-[#1E293B]"
                  >
                    {[12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((cnt) => (
                      <option key={cnt} value={String(cnt)}>
                        {cnt === 1 ? '1 Parcela (À Vista)' : `${cnt}x Mensais`}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-[#64748B] mt-1">
                    Vencimentos fixados todo dia 10 de cada mês.
                  </span>
                </div>
              </div>
            </div>

            {/* Bloco 4: Destinatário do E-mail e Código Único */}
            <div className="bg-[#F8FAFC] rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
                <Mail size={18} className="text-[#F45206]" />
                <h3 className="text-[14px] font-black text-[#1E293B]">
                  4. DESTINATÁRIO DO E-MAIL COM CÓDIGO ÚNICO
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="form-group">
                  <label className="form-label">Nome Preliminar do Estudante:</label>
                  <input
                    type="text"
                    placeholder="Ex: Bruno Fialho (Opcional)"
                    value={proposalData.studentName}
                    onChange={(e) => setProposalData({ ...proposalData, studentName: e.target.value })}
                    className="form-control font-semibold"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nome do Pai / Responsável:</label>
                  <input
                    type="text"
                    placeholder="Ex: Wanderson Pedro (Opcional)"
                    value={proposalData.guardianName}
                    onChange={(e) => handleProposalGuardianFieldChange('guardianName', e.target.value)}
                    className="form-control font-semibold"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">E-mail do Pai / Responsável: *</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="email"
                      required
                      placeholder="responsavel@email.com"
                      value={proposalData.guardianEmail}
                      onChange={(e) => setProposalData({ ...proposalData, guardianEmail: e.target.value })}
                      className="form-control !pl-10 font-bold !text-[#F45206]"
                    />
                  </div>
                  <span className="text-[10.5px] text-[#64748B] block mt-1">
                    O link de matrícula e o <strong>Código Único de Acesso</strong> chegarão neste e-mail.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('matriculas-list');
                  setViewMode('list');
                }}
                className="btn-secondary-rodin !py-3 !px-6"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary-rodin !py-3.5 !px-10 text-[14px] shadow-lg flex items-center gap-2"
              >
                <Send size={17} />
                Gerar Proposta e Enviar Código Único por E-mail
              </button>
            </div>
          </form>
        </div>

        {/* Modal de Sucesso com Link Criado e Código Único */}
        {generatedProposalModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#FED7AA] space-y-6 animate-scaleUp">
              <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={32} />
              </div>

              <div className="text-center space-y-1">
                <span className="text-[10px] font-black text-[#059669] uppercase tracking-wider bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
                  E-mail com Código Único Pronto para Envio
                </span>
                <h2 className="text-[20px] font-black text-[#1E293B]">
                  Proposta RM {generatedProposalModal.rmNumber} Gerada!
                </h2>
                <p className="text-[12px] text-[#64748B]">
                  O link exclusivo com o código de validação foi vinculado ao e-mail do pai para preenchimento e assinatura digital.
                </p>
              </div>

              {/* Card Detalhado com E-mail, Código Único e Link */}
              <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#CBD5E1] space-y-3">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-[#64748B] font-bold flex items-center gap-1.5">
                    <Mail size={14} className="text-[#F45206]" /> E-mail Destino:
                  </span>
                  <strong className="text-[#1E293B] font-mono">
                    {generatedProposalModal.guardianEmail || 'responsavel@email.com'}
                  </strong>
                </div>

                <div className="flex items-center justify-between text-[12px] bg-white p-2.5 rounded-xl border border-[#FED7AA]">
                  <span className="text-[#64748B] font-bold">1ª Parcela (Matrícula):</span>
                  <strong className="text-[#F45206]">
                    R$ {formatNumberToBRL(generatedProposalModal.firstInstallmentValue)}
                    {generatedProposalModal.firstInstallmentSplit > 1
                      ? ` (em ${generatedProposalModal.firstInstallmentSplit}x de R$ ${formatNumberToBRL(parseBRLToNumber(generatedProposalModal.firstInstallmentValue) / generatedProposalModal.firstInstallmentSplit)})`
                      : ' (À Vista)'}
                  </strong>
                </div>

                {/* Código Único em Destaque */}
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm">
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#64748B] block">
                      Código Único de Acesso
                    </span>
                    <strong className="font-mono font-black text-[18px] text-[#F45206] tracking-wider">
                      {generatedProposalModal.accessCode || 'ROD-8392'}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedProposalModal.accessCode || 'ROD-8392');
                      showToast('Código Único copiado para a área de transferência!');
                    }}
                    className="btn-secondary-rodin !py-1.5 !px-3 text-[11px]"
                  >
                    <Copy size={12} /> Copiar Código
                  </button>
                </div>

                {/* Link Clicável */}
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-sm">
                  <div className="truncate flex-1 pr-2">
                    <span className="text-[10px] font-black uppercase text-[#64748B] block">
                      Link Seguro de Matrícula
                    </span>
                    <span className="font-mono text-[11px] text-[#1E293B] truncate block">
                      {window.location.origin}/#matricular/{generatedProposalModal.id}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(generatedProposalModal)}
                    className="btn-primary-rodin !py-1.5 !px-3 text-[11px] shrink-0"
                  >
                    <Copy size={12} /> Copiar Link
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const enr = generatedProposalModal;
                    setGeneratedProposalModal(null);
                    handleOpenParentPortal(enr);
                  }}
                  className="btn-primary-rodin !py-3 text-[12px] flex items-center justify-center gap-1.5"
                >
                  <ExternalLink size={15} /> Abrir como Responsável
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGeneratedProposalModal(null);
                    setActiveTab('matriculas-list');
                    setViewMode('list');
                  }}
                  className="btn-secondary-rodin !py-3 text-[12px]"
                >
                  Fechar e Ir para Lista
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: SETOR DE MATRÍCULAS — LISTA GERAL E ACOMPANHAMENTO
  // =========================================================================
  return (
    <div className="w-full space-y-6 pb-12">
      {/* Top Header */}
      <div className="rodin-panel-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileSignature size={22} className="text-[#F45206]" />
            <h1 className="text-[20px] font-black text-[#1E293B]">
              Gestão de Matrículas e Propostas Digitais (2027)
            </h1>
          </div>
          <p className="text-[12px] font-semibold text-[#64748B]">
            Emita o link com os valores e acompanhe o preenchimento e assinatura digital pelos pais
          </p>
        </div>

        <button
          onClick={() => {
            setActiveTab('matriculas-nova');
            setViewMode('proposal-creator');
          }}
          className="btn-primary-rodin !py-2.5 !px-5 text-[13px] self-start md:self-auto shadow-md"
        >
          <Plus size={16} />
          Nova Proposta (Gerar Link para Pai)
        </button>
      </div>

      {/* Filter e Search Bar */}
      <div className="rodin-panel-card !p-3.5 sm:!p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Buscar por RM, aluno, CPF ou responsável..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E2E8F0] text-[13px] font-semibold text-[#1E293B] focus:outline-none focus:border-[#F45206] bg-[#F8FAFC]"
          />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar w-full sm:w-auto">
          {/* Seletor de Ano Letivo */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] sm:text-[12px] font-extrabold bg-[#F8FAFC] border border-[#CBD5E1] text-[#1E293B] cursor-pointer outline-hidden shadow-2xs"
            title="Filtrar contratos por Ano Letivo"
          >
            <option value="all">Ano: Todos</option>
            <option value="2028">Ano 2028</option>
            <option value="2027">Ano 2027</option>
            <option value="2026">Ano 2026</option>
          </select>

          <button
            onClick={() => setStatusFilter('all')}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] sm:text-[12px] font-extrabold transition-colors whitespace-nowrap ${
              statusFilter === 'all' ? 'bg-[#1E293B] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
            }`}
          >
            Todos ({enrollments.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending_parent_completion')}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] sm:text-[12px] font-extrabold transition-colors whitespace-nowrap ${
              statusFilter === 'pending_parent_completion' ? 'bg-[#F45206] text-white' : 'bg-[#FFF0E6] text-[#F45206]'
            }`}
          >
            Aguardando Família
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] sm:text-[12px] font-extrabold transition-colors whitespace-nowrap ${
              statusFilter === 'active' ? 'bg-[#059669] text-white' : 'bg-[#ECFDF5] text-[#059669]'
            }`}
          >
            Concluídas e Assinadas
          </button>
        </div>
      </div>

      {/* Tabela Ampla e Responsiva de Matrículas */}
      <div className="rodin-panel-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.5px]">
                <th className="py-3.5 px-5">RM / Estudante</th>
                <th className="py-3.5 px-4">Curso / Série / Turno</th>
                <th className="py-3.5 px-4">Responsável Financeiro</th>
                <th className="py-3.5 px-4">Plano Financeiro</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[13px]">
              {filteredEnrollments.map((enr) => {
                const isSigned = enr.status === 'active';
                const rm = enr.rmNumber || enr.cocCode || '2560';

                return (
                  <tr key={enr.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <strong className="text-[#1E293B] font-extrabold">{enr.studentName}</strong>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#FFF0E6] text-[#F45206] border border-[#FED7AA]">
                            RM {rm}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
                            {enr.academicYear || 2027}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#64748B] font-mono">
                          {enr.studentCpf ? `CPF: ${enr.studentCpf}` : enr.enrollmentCode}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-bold text-[#475569] block">{enr.currentGrade}</span>
                      <span className="text-[10px] text-[#94A3B8]">{enr.courseLevel} • {enr.schoolShift || 'Manhã'}</span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1E293B]">{enr.guardianName || 'A preencher pelo pai'}</span>
                        <span className="text-[11px] text-[#64748B] flex items-center gap-1 truncate max-w-[200px]">
                          <Mail size={11} className="text-[#F45206] shrink-0" />
                          <span className="truncate">{enr.guardianEmail || 'E-mail a cadastrar'}</span>
                        </span>
                        {enr.accessCode && (
                          <span className="text-[10px] font-mono font-bold text-[#059669]">
                            Cód: {enr.accessCode}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-black text-[#1E293B]">
                          R$ {formatNumberToBRL(enr.tuitionGrossTotal || 34663.20)}
                        </span>
                        <span className="text-[10px] text-[#059669] font-bold">
                          {enr.installmentsCount || 13}x de R$ {formatNumberToBRL(enr.regularInstallmentValue || 2666.40)}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {isSigned ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[11px] font-extrabold text-[#059669]">
                          <CheckCircle2 size={13} /> Matrícula Assinada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF0E6] border border-[#FED7AA] text-[11px] font-extrabold text-[#F45206]">
                          <Clock size={13} /> Aguardando Pai
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isSigned ? (
                          <>
                            <button
                              onClick={() => handleResendEmail(enr)}
                              className="btn-primary-rodin !py-1.5 !px-3 text-[11px] flex items-center gap-1.5"
                              title="Reenviar e-mail com link de assinatura para o responsável"
                            >
                              <Mail size={13} /> Reenviar por E-mail
                            </button>

                            <button
                              onClick={() => handleCopyLink(enr)}
                              className="p-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] border border-[#CBD5E1] transition-colors"
                              title="Copiar Link de Matrícula"
                            >
                              <Copy size={14} />
                            </button>

                            <button
                              onClick={() => handleOpenParentPortal(enr)}
                              className="p-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] border border-[#CBD5E1] transition-colors"
                              title="Visualizar portal como responsável"
                            >
                              <ExternalLink size={14} />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 justify-end flex-wrap">
                            {/* Grupo 1: Requerimento de Matrícula (Balder Educacional) */}
                            <div className="flex items-center bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-0.5 shadow-2xs">
                              <button
                                onClick={() => {
                                  const blobUrl = getSignedContractPDFBlobUrl(enr);
                                  setPreviewPdfModal({
                                    docType: 'matricula',
                                    url: blobUrl,
                                    title: `Requerimento de Matrícula • ${enr.studentName} (RM ${enr.rmNumber})`,
                                    enrollment: enr
                                  });
                                }}
                                className="px-2 py-1 text-[11px] font-bold text-[#1E293B] hover:bg-white rounded-lg transition-colors flex items-center gap-1"
                                title="Visualizar Requerimento de Matrícula (Balder Educacional)"
                              >
                                <Eye size={12} className="text-[#F45206]" />
                                Matrícula
                              </button>
                              <button
                                onClick={() => generateSignedContractPDF(enr)}
                                className="p-1 text-[#059669] hover:bg-[#ECFDF5] rounded-lg transition-colors"
                                title="Baixar Requerimento de Matrícula (Balder Educacional)"
                              >
                                <Download size={12} />
                              </button>
                            </div>

                            {/* Grupo 2: Pedido de Material Didático (Livraria do Pensador) */}
                            <div className="flex items-center bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-0.5 shadow-2xs">
                              <button
                                onClick={() => {
                                  const blobUrl = getMaterialOrderPDFBlobUrl(enr);
                                  setPreviewPdfModal({
                                    docType: 'material',
                                    url: blobUrl,
                                    title: `Pedido de Material Didático • ${enr.studentName} (Livraria do Pensador)`,
                                    enrollment: enr
                                  });
                                }}
                                className="px-2 py-1 text-[11px] font-bold text-[#1D4ED8] hover:bg-white rounded-lg transition-colors flex items-center gap-1"
                                title="Visualizar Pedido de Material Didático (Livraria do Pensador LTDA)"
                              >
                                <BookOpen size={12} className="text-[#2563EB]" />
                                Material
                              </button>
                              <button
                                onClick={() => downloadMaterialOrderPDF(enr)}
                                className="p-1 text-[#1D4ED8] hover:bg-white rounded-lg transition-colors"
                                title="Baixar Pedido de Material Didático (Livraria do Pensador LTDA)"
                              >
                                <Download size={12} />
                              </button>
                            </div>

                            {/* Grupo 3: Baixar Ambos (Pacote Completo) */}
                            <button
                              onClick={() => downloadAllContractsPDF(enr)}
                              className="btn-secondary-rodin !py-1 !px-2 text-[10.5px] !border-[#F45206]/30 !text-[#F45206] hover:!bg-[#FFF0E6] flex items-center gap-1 font-extrabold shadow-2xs"
                              title="Baixar Ambos os Contratos (Requerimento + Material Didático)"
                            >
                              <Download size={12} />
                              Ambos
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Interativo de Pré-visualização com Abas (Matrícula Balder e Material Pensador) */}
      {previewPdfModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[94vh] flex flex-col overflow-hidden border border-[#E2E8F0]">
            {/* Header do Modal */}
            <div className="p-3.5 sm:px-6 bg-[#0F172A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <RodinLogo variant="white" className="h-7 sm:h-8 w-auto shrink-0" alt="Colégio Rodin" />
                <div className="min-w-0 border-l border-slate-700 pl-3">
                  <h3 className="text-[13.5px] sm:text-[14.5px] font-black tracking-wide truncate">
                    {previewPdfModal.title || 'Contratos da Matrícula'}
                  </h3>
                  <p className="text-[10.5px] text-[#94A3B8] truncate">
                    {previewPdfModal.enrollment?.studentName} • RM {previewPdfModal.enrollment?.rmNumber}
                  </p>
                </div>
              </div>

              {/* Abas Alternadoras no Header */}
              <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    if (previewPdfModal.docType !== 'matricula') {
                      if (previewPdfModal.url) URL.revokeObjectURL(previewPdfModal.url);
                      const blobUrl = getSignedContractPDFBlobUrl(previewPdfModal.enrollment);
                      setPreviewPdfModal({
                        ...previewPdfModal,
                        docType: 'matricula',
                        url: blobUrl,
                        title: `Requerimento de Matrícula • ${previewPdfModal.enrollment?.studentName} (Balder Educacional)`
                      });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                    previewPdfModal.docType === 'matricula'
                      ? 'bg-[#F45206] text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <FileSignature size={12} />
                  1. Matrícula (Balder)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (previewPdfModal.docType !== 'material') {
                      if (previewPdfModal.url) URL.revokeObjectURL(previewPdfModal.url);
                      const blobUrl = getMaterialOrderPDFBlobUrl(previewPdfModal.enrollment);
                      setPreviewPdfModal({
                        ...previewPdfModal,
                        docType: 'material',
                        url: blobUrl,
                        title: `Pedido de Material Didático • ${previewPdfModal.enrollment?.studentName} (Livraria do Pensador)`
                      });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                    previewPdfModal.docType === 'material'
                      ? 'bg-[#2563EB] text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <BookOpen size={12} />
                  2. Material (Pensador)
                </button>
              </div>

              {/* Ações de Download e Fechar */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    if (previewPdfModal.docType === 'material') {
                      downloadMaterialOrderPDF(previewPdfModal.enrollment);
                    } else {
                      generateSignedContractPDF(previewPdfModal.enrollment);
                    }
                  }}
                  className="btn-primary-rodin !py-1.5 !px-3 text-[11px] flex items-center gap-1.5 font-bold shadow"
                  title="Baixar o documento atualmente em exibição"
                >
                  <Download size={13} />
                  Baixar Atual
                </button>

                <button
                  onClick={() => downloadAllContractsPDF(previewPdfModal.enrollment)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white !py-1.5 !px-3 rounded-xl text-[11px] flex items-center gap-1.5 font-bold shadow transition-colors"
                  title="Baixar Ambos os Contratos (Pacote Completo)"
                >
                  <Download size={13} />
                  Baixar Ambos
                </button>

                <button
                  onClick={() => {
                    if (previewPdfModal.url) URL.revokeObjectURL(previewPdfModal.url);
                    setPreviewPdfModal(null);
                  }}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors ml-1"
                  title="Fechar Visualização"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Frame do PDF */}
            <div className="flex-1 bg-slate-100 relative">
              <iframe
                src={previewPdfModal.url}
                title={previewPdfModal.title || 'Contrato em PDF'}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
