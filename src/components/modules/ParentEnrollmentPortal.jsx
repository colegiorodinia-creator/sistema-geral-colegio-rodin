import React, { useState, useRef } from 'react';
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
import RodinLogo from '../RodinLogo';
import signatureCanela from '../../assets/signatures/assinatura - canela.png';
import signatureElisangela from '../../assets/signatures/assinatura - elisangela.png';
import signatureKelly from '../../assets/signatures/assinatura - kelly.png';
import thinkerMarkBlack from '../../assets/logo/thinker-mark-black-transparent.png';
import {
  isValidCPF,
  maskCPF,
  maskRG,
  maskPhone,
  maskCEP,
  formatName,
  formatIssuer
} from '../../lib/formatters';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  FileSignature,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Check,
  Download,
  Eye,
  X,
  ExternalLink,
  Mail,
  Building,
  KeyRound,
  FileText,
  BookOpen,
  ShoppingBag,
  RefreshCw,
  Sparkles,
  Layers
} from 'lucide-react';

// SVGs das 3 Assinaturas Prontas Institucionais
const BalderSignatureSVG = () => (
  <div className="flex flex-col items-center justify-center">
    <svg viewBox="0 0 180 50" className="w-28 h-9 text-[#1E293B]">
      <path d="M 20 38 C 35 12, 60 8, 80 28 C 100 48, 120 12, 160 24" fill="none" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 45 35 Q 95 15 145 35" fill="none" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
    <span className="text-[8px] font-bold text-[#059669] bg-[#ECFDF5] px-1 py-0.2 rounded border border-[#A7F3D0]">
      ✓ Balder Educacional
    </span>
  </div>
);

const ElisangelaSignatureSVG = () => (
  <div className="flex flex-col items-center justify-center">
    <svg viewBox="0 0 180 50" className="w-28 h-9 text-[#1E293B]">
      <path d="M 25 30 Q 50 12, 75 30 T 125 30 T 155 20" fill="none" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 35 34 C 55 20, 85 16, 105 32" fill="none" stroke="#1E293B" strokeWidth="1.2" />
      <path d="M 20 26 L 155 26" fill="none" stroke="#1E293B" strokeWidth="0.8" opacity="0.6" />
    </svg>
    <span className="text-[8px] font-bold text-[#059669] bg-[#ECFDF5] px-1 py-0.2 rounded border border-[#A7F3D0]">
      ✓ Testemunha 1
    </span>
  </div>
);

const KellySignatureSVG = () => (
  <div className="flex flex-col items-center justify-center">
    <svg viewBox="0 0 180 50" className="w-28 h-9 text-[#1E293B]">
      <path d="M 35 42 L 50 12 L 65 42 M 45 26 L 60 26" fill="none" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 70 40 C 65 16, 90 8, 90 24 C 90 40, 75 40, 70 40" fill="none" stroke="#1E293B" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 95 40 C 90 12, 120 8, 120 24 C 120 40, 100 40, 95 40" fill="none" stroke="#1E293B" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M 30 44 Q 75 40 135 44" fill="none" stroke="#1E293B" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
    <span className="text-[8px] font-bold text-[#059669] bg-[#ECFDF5] px-1 py-0.2 rounded border border-[#A7F3D0]">
      ✓ Testemunha 2
    </span>
  </div>
);

// Lista Completa de Nacionalidades e Naturalidades
const ALL_NATIONALITIES = [
  'Brasileiro(a)',
  'Naturalizado(a) Brasileiro(a)',
  'Afegão(ã)',
  'Sul-Africano(a)',
  'Alemão(ã)',
  'Angolano(a)',
  'Argentino(a)',
  'Australiano(a)',
  'Austríaco(a)',
  'Belga',
  'Boliviano(a)',
  'Canadense',
  'Chileno(a)',
  'Chinês(a)',
  'Colombiano(a)',
  'Coreano(a)',
  'Cubano(a)',
  'Dinamarquês(a)',
  'Egípcio(a)',
  'Equatoriano(a)',
  'Espanhol(a)',
  'Norte-Americano(a) (EUA)',
  'Francês(a)',
  'Grego(a)',
  'Guatemalteco(a)',
  'Haitiano(a)',
  'Holandês(a)',
  'Indiano(a)',
  'Inglês(a) / Britânico(a)',
  'Iraniano(a)',
  'Irlandês(a)',
  'Israelense',
  'Italiano(a)',
  'Japonês(a)',
  'Libanês(a)',
  'Mexicano(a)',
  'Moçambicano(a)',
  'Norueguês(a)',
  'Paraguaio(a)',
  'Peruano(a)',
  'Polonês(a)',
  'Português(a)',
  'Russo(a)',
  'Sírio(a)',
  'Sueco(a)',
  'Suíço(a)',
  'Turco(a)',
  'Ucraniano(a)',
  'Uruguaio(a)',
  'Venezuelano(a)',
  'Outra Nacionalidade'
];

export default function ParentEnrollmentPortal({
  enrollmentId,
  onExit
}) {
  const { enrollments, completeEnrollmentByParent, showToast } = useApp();

  // Extrair o RM numérico correto do ID (ex: 'enr-2027-2565' -> '2565')
  const cleanId = enrollmentId || '';
  const rawSuffix = cleanId.split('-').pop() || '2565';
  const rmFromId = rawSuffix.length > 4 ? rawSuffix.slice(-4) : rawSuffix;

  // Buscar todas as propostas gravadas no contexto e no localStorage
  let allEnrollments = [...enrollments];
  try {
    const stored = localStorage.getItem('rodin_enrollments');
    if (stored) {
      const parsed = JSON.parse(stored);
      allEnrollments = [...parsed, ...enrollments];
    }
  } catch (e) {}

  const foundEnrollment = allEnrollments.find(e => 
    e.id === enrollmentId || 
    String(e.rmNumber) === String(rmFromId) || 
    String(e.id).endsWith(`-${rmFromId}`) || 
    String(e.cocCode) === String(rmFromId)
  );

  const enrollment = foundEnrollment || {
    id: enrollmentId || `enr-2027-${rmFromId}`,
    rmNumber: rmFromId,
    studentName: '',
    enrollmentCode: `RM ${rmFromId}`,
    courseLevel: 'Ensino Fundamental',
    currentGrade: '6º Ano EF',
    schoolShift: 'Manhã',
    academicYear: 2027,
    tuitionGrossTotal: 34663.20,
    installmentsCount: 13,
    firstInstallmentValue: 2666.40,
    regularInstallmentValue: 2666.40,
    paymentNote: '* Boleto Bancário com vencimento mensal e sucessivo todo dia: 1º.',
    guardianEmail: 'responsavel@email.com',
    accessCode: `ROD-${rmFromId}`,
    status: 'pending_parent_completion'
  };

  // Recuperar códigos específicos gravados para esta proposta
  let storedCodes = {};
  try {
    const rawCodes = localStorage.getItem('rodin_enrollment_codes');
    if (rawCodes) storedCodes = JSON.parse(rawCodes);
  } catch (err) {}

  const targetCode = (
    enrollment.accessCode || 
    foundEnrollment?.accessCode || 
    storedCodes[enrollmentId] || 
    storedCodes[rmFromId] || 
    `ROD-${rmFromId}`
  ).trim().toUpperCase();

  // O campo SEMPRE inicia totalmente vazio para que o pai digite o código recebido no e-mail
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [codeAttempts, setCodeAttempts] = useState(0);

  // Estados do Formulário do Pai
  const [parentStep, setParentStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedEnrollment, setCompletedEnrollment] = useState(null);
  const [activeContractTab, setActiveContractTab] = useState('matricula'); // 'matricula' | 'material'
  const [firstInstallmentSplit, setFirstInstallmentSplit] = useState(enrollment.firstInstallmentSplit || 1);
  const [firstInstallmentPaymentMethod, setFirstInstallmentPaymentMethod] = useState(enrollment.firstInstallmentPaymentMethod || 'Cartão de Crédito (até 5x) ou Boleto');

  const [parentFormData, setParentFormData] = useState({
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
    guardianAddressCep: '',
    guardianAddressStreet: '',
    guardianAddressNumber: '',
    guardianAddressComplement: '',
    guardianAddressNeighborhood: '',
    guardianAddressState: 'SP',
    guardianAddressCity: 'Indaiatuba',
    guardianEmail: '',
    guardianLandline: '',
    guardianPhone: '',
    // Pedido de Material Didático (Livraria do Pensador LTDA - CNPJ 43.849.399/0001-92)
    materialBuyerName: enrollment.materialBuyerName || enrollment.guardianName || '',
    materialBuyerCpf: enrollment.materialBuyerCpf || enrollment.guardianCpf || '',
    materialTotalValue: enrollment.materialTotalValue || 5248.80,
    materialInstallmentsCount: enrollment.materialInstallmentsCount || 12,
    materialStartDueDate: enrollment.materialStartDueDate || '2027-02-10',
    materialEndDueDate: enrollment.materialEndDueDate || '2027-07-10',
    materialPaymentMethod: enrollment.materialPaymentMethod || 'Boleto Bancário (vencimento dia 10)',
    isBuyerSameAsFinancial: true
  });

  // Manipulador do Responsável Financeiro (Atualiza Comprador automaticamente se estiver sincronizado)
  const handleFinancialFieldChange = (field, value) => {
    setParentFormData(prev => {
      const next = { ...prev, [field]: value };
      if (prev.isBuyerSameAsFinancial) {
        if (field === 'guardianName') next.materialBuyerName = value;
        if (field === 'guardianCpf') next.materialBuyerCpf = value;
      }
      return next;
    });
  };

  // Manipulador do Comprador do Material (NUNCA altera o Responsável Financeiro da escola)
  const handleBuyerFieldChange = (field, value) => {
    setParentFormData(prev => ({
      ...prev,
      [field]: value,
      isBuyerSameAsFinancial: false
    }));
  };

  // Alternar vínculo com o Responsável Financeiro
  const handleToggleSameBuyer = (same) => {
    setParentFormData(prev => ({
      ...prev,
      isBuyerSameAsFinancial: same,
      materialBuyerName: same ? prev.guardianName : prev.materialBuyerName,
      materialBuyerCpf: same ? prev.guardianCpf : prev.materialBuyerCpf
    }));
  };

  // Canvas de Assinatura
  const canvasRef = useRef(null);
  const contractScrollRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasParentSignature, setHasParentSignature] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAcceptedContract, setHasAcceptedContract] = useState(false);
  const [previewPdfModal, setPreviewPdfModal] = useState(null);

  // Manipulador de Scroll do Contrato para Liberação do Aceite
  const handleContractScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight <= clientHeight || scrollHeight - scrollTop - clientHeight <= 30) {
      setHasScrolledToBottom(true);
    }
  };

  // Validar Código Único de Acesso Digitado pelo Pai (ESTRITO + RATE LIMITING)
  const handleVerifyAccessCode = (e) => {
    e?.preventDefault();

    if (codeAttempts >= 5) {
      setCodeError('Limite de 5 tentativas excedido. Por razões de segurança, aguarde antes de tentar novamente.');
      return;
    }

    const cleanInput = accessCodeInput.trim().toUpperCase().replace(/\s+/g, '');

    if (!cleanInput) {
      setCodeError('Por favor, digite o Código Único de Acesso recebido em seu e-mail.');
      return;
    }

    // Apenas o código EXATO desta proposta é autorizado
    const isMatch = cleanInput === targetCode;

    if (isMatch) {
      setCodeError('');
      setIsCodeVerified(true);
      showToast('Código de Acesso Validado com Sucesso!');
    } else {
      const nextCount = codeAttempts + 1;
      setCodeAttempts(nextCount);
      if (nextCount >= 5) {
        setCodeError('Limite de 5 tentativas excedido. Por razões de segurança, o acesso foi bloqueado temporariamente.');
      } else {
        setCodeError(`Código de acesso incorreto (${nextCount}/5 tentativas). Verifique o e-mail cadastrado.`);
      }
    }
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
          showToast(`CEP: ${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`);
        } else {
          showToast('CEP não localizado. Preencha manualmente os campos de endereço.', 'error');
        }
      } catch (error) {
        console.error('Erro ViaCEP:', error);
      } finally {
        setIsLoadingCep(false);
      }
    }
  };

  // Validação Rigorosa com Conferência Real de CPF e Campos
  const validateParentStep = (step) => {
    const errors = {};

    if (step === 1) {
      // 1. Nome do Estudante (Pelo menos 2 palavras)
      const nameParts = (parentFormData.studentName || '').trim().split(/\s+/);
      if (!parentFormData.studentName?.trim() || nameParts.length < 2) {
        errors.studentName = 'Digite o nome e sobrenome completo do estudante';
      }
      if (!parentFormData.studentGender) errors.studentGender = 'Selecione o sexo';
      if (!parentFormData.studentBirthDate) errors.studentBirthDate = 'Data de nascimento obrigatória';
      if (!parentFormData.studentBirthCity?.trim()) errors.studentBirthCity = 'Local de nascimento obrigatório';
      if (!parentFormData.studentNationality?.trim()) errors.studentNationality = 'Nacionalidade obrigatória';
      
      // 2. RG do Estudante
      const cleanRg = (parentFormData.studentRg || '').trim().replace(/[^0-9X]/gi, '');
      if (!cleanRg || cleanRg.length < 5) {
        errors.studentRg = 'RG obrigatório (mín. 5 dígitos)';
      }
      if (!parentFormData.studentRgIssuer?.trim()) errors.studentRgIssuer = 'Órgão exp. obrigatório';
      if (!parentFormData.studentRgIssueDate) errors.studentRgIssueDate = 'Data de expedição do RG obrigatória';

      // 3. Validação Oficial do CPF do Estudante
      if (!isValidCPF(parentFormData.studentCpf)) {
        errors.studentCpf = 'CPF inválido (conforme algoritmo oficial da Receita)';
      }

      // 4. Telefone do Aluno
      const cleanPhone = (parentFormData.studentPhone || '').replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        errors.studentPhone = 'Telefone/WhatsApp inválido (DDD + número)';
      }
    }

    if (step === 2) {
      if (!parentFormData.guardianRelation) errors.guardianRelation = 'Parentesco obrigatório';
      
      // 1. Nome do Responsável (Pelo menos 2 palavras)
      const guardianNameParts = (parentFormData.guardianName || '').trim().split(/\s+/);
      if (!parentFormData.guardianName?.trim() || guardianNameParts.length < 2) {
        errors.guardianName = 'Digite o nome completo do responsável';
      }
      if (!parentFormData.guardianGender) errors.guardianGender = 'Selecione o sexo';
      if (!parentFormData.guardianBirthDate) errors.guardianBirthDate = 'Data de nascimento obrigatória';
      if (!parentFormData.guardianOccupation?.trim()) errors.guardianOccupation = 'Ocupação obrigatória';
      if (!parentFormData.guardianMaritalStatus) errors.guardianMaritalStatus = 'Estado civil obrigatório';

      // 2. RG do Responsável
      const cleanRg = (parentFormData.guardianRg || '').trim().replace(/[^0-9X]/gi, '');
      if (!cleanRg || cleanRg.length < 5) errors.guardianRg = 'RG obrigatório';
      if (!parentFormData.guardianRgIssuer?.trim()) errors.guardianRgIssuer = 'Órgão exp. obrigatório';

      // 3. Validação Oficial do CPF do Responsável
      if (!isValidCPF(parentFormData.guardianCpf)) {
        errors.guardianCpf = 'CPF do responsável inválido (conforme Receita Federal)';
      }

      if (!parentFormData.guardianNationality?.trim()) errors.guardianNationality = 'Nacionalidade obrigatória';

      // 4. CEP
      const cleanCep = (parentFormData.guardianAddressCep || '').replace(/\D/g, '');
      if (cleanCep.length !== 8) errors.guardianAddressCep = 'CEP deve conter 8 dígitos';

      if (!parentFormData.guardianAddressStreet?.trim()) errors.guardianAddressStreet = 'Logradouro obrigatório';
      if (!parentFormData.guardianAddressNumber?.trim()) errors.guardianAddressNumber = 'Número obrigatório';
      if (!parentFormData.guardianAddressNeighborhood?.trim()) errors.guardianAddressNeighborhood = 'Bairro obrigatório';
      if (!parentFormData.guardianAddressCity?.trim()) errors.guardianAddressCity = 'Cidade obrigatória';
      if (!parentFormData.guardianAddressState?.trim()) errors.guardianAddressState = 'UF obrigatória';

      // 5. E-mail e Celular
      if (!parentFormData.guardianEmail?.trim() || !/^\S+@\S+\.\S+$/.test(parentFormData.guardianEmail)) {
        errors.guardianEmail = 'E-mail válido obrigatório';
      }

      const cleanPhone = (parentFormData.guardianPhone || '').replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        errors.guardianPhone = 'Celular/WhatsApp inválido (DDD + número)';
      }
    }

    if (step === 3) {
      const buyerNameParts = (parentFormData.materialBuyerName || '').trim().split(/\s+/);
      if (!parentFormData.materialBuyerName?.trim() || buyerNameParts.length < 2) {
        errors.materialBuyerName = 'Digite o nome e sobrenome completo do comprador do material';
      }
      if (!isValidCPF(parentFormData.materialBuyerCpf)) {
        errors.materialBuyerCpf = 'CPF do comprador do material inválido (conforme Receita Federal)';
      }
      const val = typeof parentFormData.materialTotalValue === 'number'
        ? parentFormData.materialTotalValue
        : parseFloat(String(parentFormData.materialTotalValue || '0').replace(/\./g, '').replace(',', '.'));
      if (!val || val <= 0) {
        errors.materialTotalValue = 'Valor total do material é obrigatório';
      }
      if (!parentFormData.materialInstallmentsCount || parseInt(parentFormData.materialInstallmentsCount) < 1) {
        errors.materialInstallmentsCount = 'Número de parcelas inválido';
      }
      if (!parentFormData.materialStartDueDate) {
        errors.materialStartDueDate = 'Data de vencimento inicial obrigatória';
      }
      if (!parentFormData.materialEndDueDate) {
        errors.materialEndDueDate = 'Data de vencimento final obrigatória';
      }
    }

    setFormErrors(errors);
    const isValid = Object.keys(errors).length === 0;

    if (!isValid) {
      const firstError = Object.values(errors)[0];
      showToast(firstError || 'Preencha todos os campos obrigatórios corretamente.', 'error');
    }

    return isValid;
  };

  // Canvas Handlers Calibrados (Precisão Absoluta no Mouse e Touch)
  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (!hasAcceptedContract) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasPoint(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasPoint(e);

    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 3.5;
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

  // Submissão Final do Requerimento
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!hasParentSignature) {
      showToast('Por favor, assine digitalmente no campo indicado antes de enviar.', 'error');
      return;
    }

    const canvas = canvasRef.current;
    const signatureDataUrl = canvas.toDataURL('image/png');

    setIsSubmitting(true);
    try {
      // Dados Padronizados e Higienizados para o Banco
      const fullData = {
        ...parentFormData,
        studentName: formatName(parentFormData.studentName),
        studentGender: parentFormData.studentGender || 'Masc.',
        studentBirthDate: parentFormData.studentBirthDate,
        studentBirthCity: formatName(parentFormData.studentBirthCity),
        studentNationality: parentFormData.studentNationality || 'Brasileiro(a)',
        studentRg: maskRG(parentFormData.studentRg),
        studentRgIssuer: formatIssuer(parentFormData.studentRgIssuer),
        studentRgIssueDate: parentFormData.studentRgIssueDate,
        studentCpf: maskCPF(parentFormData.studentCpf),
        studentPhone: maskPhone(parentFormData.studentPhone),
        guardianRelation: parentFormData.guardianRelation || 'Pai',
        guardianName: formatName(parentFormData.guardianName),
        guardianGender: parentFormData.guardianGender || 'Masc.',
        guardianBirthDate: parentFormData.guardianBirthDate,
        guardianOccupation: formatName(parentFormData.guardianOccupation),
        guardianMaritalStatus: parentFormData.guardianMaritalStatus,
        guardianRg: maskRG(parentFormData.guardianRg),
        guardianRgIssuer: formatIssuer(parentFormData.guardianRgIssuer),
        guardianCpf: maskCPF(parentFormData.guardianCpf),
        guardianNationality: parentFormData.guardianNationality || 'Brasileiro(a)',
        guardianAddressCep: maskCEP(parentFormData.guardianAddressCep),
        guardianAddressStreet: formatName(parentFormData.guardianAddressStreet),
        guardianAddressNumber: parentFormData.guardianAddressNumber,
        guardianAddressComplement: parentFormData.guardianAddressComplement,
        guardianAddressNeighborhood: formatName(parentFormData.guardianAddressNeighborhood),
        guardianAddressCity: formatName(parentFormData.guardianAddressCity),
        guardianAddressState: (parentFormData.guardianAddressState || 'SP').trim().toUpperCase(),
        guardianEmail: parentFormData.guardianEmail,
        guardianLandline: parentFormData.guardianLandline || '',
        guardianPhone: maskPhone(parentFormData.guardianPhone),
        rmNumber: enrollment.rmNumber,
        courseLevel: enrollment.courseLevel || 'Ensino Fundamental',
        currentGrade: enrollment.currentGrade || '6º Ano EF',
        schoolShift: enrollment.schoolShift || 'Manhã',
        academicYear: enrollment.academicYear || 2027,
        tuitionGrossTotal: enrollment.tuitionGrossTotal || 34663.20,
        installmentsCount: enrollment.installmentsCount || 12,
        firstInstallmentValue: enrollment.firstInstallmentValue || 2666.40,
        firstInstallmentSplit: parseInt(firstInstallmentSplit) || 1,
        firstInstallmentPaymentMethod: firstInstallmentPaymentMethod || 'Cartão de Crédito (até 5x) ou Boleto',
        regularInstallmentValue: enrollment.regularInstallmentValue || 2666.40,
        paymentNote: enrollment.paymentNote || '* Boleto Bancário com vencimento mensal e sucessivo todo dia: 1º.',
        // Dados do Pedido de Material Didático (Livraria do Pensador LTDA - CNPJ 43.849.399/0001-92)
        materialBuyerName: formatName(parentFormData.materialBuyerName || parentFormData.guardianName),
        materialBuyerCpf: maskCPF(parentFormData.materialBuyerCpf || parentFormData.guardianCpf),
        materialTotalValue: typeof parentFormData.materialTotalValue === 'number' ? parentFormData.materialTotalValue : (parseFloat(String(parentFormData.materialTotalValue || enrollment.materialTotalValue || '5248.80').replace(/\./g, '').replace(',', '.')) || 5248.80),
        materialInstallmentsCount: parseInt(parentFormData.materialInstallmentsCount) || enrollment.materialInstallmentsCount || 6,
        materialStartDueDate: parentFormData.materialStartDueDate || enrollment.materialStartDueDate || '2027-02-10',
        materialEndDueDate: parentFormData.materialEndDueDate || enrollment.materialEndDueDate || '2027-07-10',
        materialPaymentMethod: parentFormData.materialPaymentMethod || enrollment.materialPaymentMethod || 'Boleto Bancário (vencimento dia 10)'
      };

      const completed = await completeEnrollmentByParent(enrollment.id, fullData, signatureDataUrl);
      const recordToSave = {
        ...fullData,
        id: enrollment.id,
        rmNumber: enrollment.rmNumber,
        signatureImage: signatureDataUrl,
        signatureDataUrl: signatureDataUrl,
        signatureSha256: completed?.signatureSha256 || '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1',
        signedAt: new Date().toISOString(),
        status: 'active'
      };

      setCompletedEnrollment(recordToSave);
      showToast('Matrícula concluída e assinada digitalmente com sucesso!');
    } catch (err) {
      console.error('Erro ao finalizar matrícula:', err);
      showToast('Erro ao processar assinatura. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // TELA 1: AUTENTICAÇÃO COM CÓDIGO ÚNICO DE ACESSO
  // =========================================================================
  if (!isCodeVerified) {
    return (
      <div className="min-h-full w-full flex items-center justify-center p-3 sm:p-6 animate-fadeIn my-auto">
        <div className="max-w-md w-full bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-[#FED7AA] space-y-4">
          <div className="text-center space-y-2">
            <RodinLogo variant="color" className="h-14 sm:h-16 w-auto max-w-[240px] mx-auto mb-1" alt="Colégio Rodin" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F45206] block">
              Portal Oficial do Responsável
            </span>
            <h1 className="text-[18px] sm:text-[20px] font-black text-[#1E293B] leading-tight">
              Acesso ao Requerimento de Matrícula {enrollment.academicYear || 2027}
            </h1>
            <p className="text-[11.5px] text-[#64748B]">
              Para sua segurança e proteção de dados (LGPD), digite o <strong>Código Único de Acesso</strong> enviado para o seu e-mail.
            </p>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-1.5 text-[11.5px]">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] font-bold">Registro da Vaga:</span>
              <span className="font-mono font-black text-[#F45206] bg-[#FFF0E6] px-2 py-0.5 rounded border border-[#FED7AA]">
                RM {enrollment.rmNumber}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] font-bold">Série / Curso:</span>
              <strong className="text-[#1E293B]">{enrollment.currentGrade} ({enrollment.schoolShift})</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B] font-bold">E-mail Destinatário:</span>
              <strong className="text-[#1E293B] font-mono">{enrollment.guardianEmail || 'responsavel@email.com'}</strong>
            </div>
          </div>

          <form onSubmit={handleVerifyAccessCode} className="space-y-3.5">
            <div className="form-group !mb-0">
              <label className="form-label flex items-center justify-between !mb-1 text-[11.5px]">
                <span>CÓDIGO ÚNICO DE ACESSO: *</span>
                <span className="text-[9.5px] text-[#059669] font-bold flex items-center gap-1">
                  <ShieldCheck size={11} /> PROTEGIDO
                </span>
              </label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F45206]" />
                <input
                  type="text"
                  required
                  placeholder="Ex: ROD-8392"
                  value={accessCodeInput}
                  onChange={(e) => {
                    setAccessCodeInput(e.target.value);
                    setCodeError('');
                  }}
                  className={`form-control !pl-10 font-mono font-black text-[15px] uppercase tracking-wider text-[#1E293B] !h-[42px] ${
                    codeError ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''
                  }`}
                  autoFocus
                />
              </div>
              {codeError ? (
                <span className="text-[10.5px] text-[#EF4444] font-bold block mt-1">{codeError}</span>
              ) : (
                <span className="text-[10px] text-[#64748B] block mt-1">
                  Localize o e-mail do Colégio Rodin com o assunto contendo o código de validação.
                </span>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary-rodin w-full !py-3 text-[13px] shadow-lg flex items-center justify-center gap-2"
            >
              <Lock size={15} />
              Validar Código e Acessar Formulário
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TELA 2: MATRÍCULA CONCLUÍDA E SELADA COM SUCESSO
  // =========================================================================
  if (completedEnrollment) {
    return (
      <div className="min-h-full w-full flex items-center justify-center p-3 sm:p-6 animate-fadeIn my-auto">
        <div className="max-w-lg w-full bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-[#A7F3D0] text-center space-y-4">
          <div className="flex justify-center mb-1">
            <RodinLogo variant="color" className="h-12 sm:h-14 w-auto max-w-[220px]" alt="Colégio Rodin" />
          </div>

          <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={32} />
          </div>

          <div className="space-y-1">
            <span className="text-[9.5px] font-black uppercase tracking-wider text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
              Matrícula e Requerimento Assinados com Sucesso
            </span>
            <h1 className="text-[20px] font-black text-[#1E293B]">
              Parabéns! Matrícula RM {completedEnrollment.rmNumber} Concluída!
            </h1>
            <p className="text-[11.5px] text-[#64748B]">
              O requerimento oficial {enrollment.academicYear || 2027} foi selado digitalmente e enviado com cópia para o setor de matrículas.
            </p>
          </div>

          <div className="p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-2 text-left text-[11.5px]">
            <div className="flex justify-between">
              <span className="text-[#64748B] font-bold">Estudante:</span>
              <strong className="text-[#1E293B]">{completedEnrollment.studentName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-bold">Curso / Série:</span>
              <strong className="text-[#1E293B]">{completedEnrollment.currentGrade} ({completedEnrollment.schoolShift})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-bold">Responsável Financeiro:</span>
              <strong className="text-[#1E293B]">{completedEnrollment.guardianName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B] font-bold">Comprador do Material:</span>
              <strong className="text-[#1E293B]">{completedEnrollment.materialBuyerName || completedEnrollment.guardianName}</strong>
            </div>
            <div className="pt-1.5 border-t border-[#E2E8F0]">
              <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-mono">
                <ShieldCheck size={13} className="text-[#059669]" /> Selo Digital SHA-256: {completedEnrollment.signatureSha256?.substring(0, 24)}...
              </span>
            </div>
          </div>

          {/* Download dos Contratos em Etapas */}
          <div className="space-y-2.5 text-left pt-1">
            <h4 className="text-[12px] font-black text-[#1E293B] uppercase tracking-wide flex items-center gap-1.5">
              <Download size={14} className="text-[#F45206]" /> Download dos Contratos Oficiais em Etapas:
            </h4>

            {/* Etapa 1: Requerimento de Matrícula (Balder Educacional) */}
            <div className="p-3 rounded-2xl border border-[#CBD5E1] bg-white hover:border-[#F45206]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFF0E6] text-[#F45206] flex items-center justify-center shrink-0 font-black text-[12px]">
                  1
                </div>
                <div>
                  <strong className="text-[12px] text-[#1E293B] block">Requerimento de Matrícula Escolar</strong>
                  <span className="text-[10px] text-[#64748B] block">Balder Educacional LTDA • CNPJ 29.221.297/0001-05</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const blobUrl = getSignedContractPDFBlobUrl(completedEnrollment);
                    setPreviewPdfModal({
                      url: blobUrl,
                      title: `Requerimento de Matrícula • ${completedEnrollment.studentName} (RM ${completedEnrollment.rmNumber})`,
                      enrollment: completedEnrollment,
                      type: 'matricula'
                    });
                  }}
                  className="btn-secondary-rodin !py-1.5 !px-2.5 text-[11px] flex items-center gap-1 font-bold"
                  title="Pré-visualizar Requerimento"
                >
                  <Eye size={13} className="text-[#F45206]" /> Ver
                </button>
                <button
                  type="button"
                  onClick={() => generateSignedContractPDF(completedEnrollment)}
                  className="btn-primary-rodin !py-1.5 !px-3 text-[11px] flex items-center gap-1 font-bold shadow-xs"
                  title="Baixar Requerimento em PDF"
                >
                  <Download size={13} /> Baixar PDF
                </button>
              </div>
            </div>

            {/* Etapa 2: Pedido de Material Didático (Livraria do Pensador) */}
            <div className="p-3 rounded-2xl border border-[#CBD5E1] bg-white hover:border-[#F45206]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0 font-black text-[12px]">
                  2
                </div>
                <div>
                  <strong className="text-[12px] text-[#1E293B] block">Pedido de Material Didático</strong>
                  <span className="text-[10px] text-[#64748B] block">Livraria do Pensador LTDA • CNPJ 43.849.399/0001-92</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const blobUrl = getMaterialOrderPDFBlobUrl(completedEnrollment);
                    setPreviewPdfModal({
                      url: blobUrl,
                      title: `Pedido de Material Didático • ${completedEnrollment.studentName}`,
                      enrollment: completedEnrollment,
                      type: 'material'
                    });
                  }}
                  className="btn-secondary-rodin !py-1.5 !px-2.5 text-[11px] flex items-center gap-1 font-bold"
                  title="Pré-visualizar Pedido de Material"
                >
                  <Eye size={13} className="text-[#059669]" /> Ver
                </button>
                <button
                  type="button"
                  onClick={() => downloadMaterialOrderPDF(completedEnrollment)}
                  className="bg-[#059669] hover:bg-[#047857] text-white !py-1.5 !px-3 rounded-xl text-[11px] flex items-center gap-1 font-bold shadow-xs transition-colors"
                  title="Baixar Pedido de Material em PDF"
                >
                  <Download size={13} /> Baixar PDF
                </button>
              </div>
            </div>

            {/* Etapa 3: Baixar Pacote Completo (Todos os Contratos em 1 clique) */}
            <button
              type="button"
              onClick={() => downloadAllContractsPDF(completedEnrollment)}
              className="btn-primary-rodin w-full !py-3 text-[12px] shadow-lg flex items-center justify-center gap-2 font-black mt-2"
              title="Baixar Ambos os Contratos Oficiais com 1 Clique"
            >
              <Download size={16} />
              Baixar Todos os Contratos (Pacote Completo)
            </button>
          </div>
        </div>

        {/* Modal Interativo de Pré-visualização do PDF Oficial */}
        {previewPdfModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-[#E2E8F0] text-left">
              {/* Header do Modal */}
              <div className="p-3.5 sm:px-6 bg-[#0F172A] text-white flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <RodinLogo variant="white" className="h-7 sm:h-8 w-auto shrink-0" alt="Colégio Rodin" />
                  <div className="min-w-0 border-l border-slate-700 pl-3">
                    <h3 className="text-[13.5px] sm:text-[14.5px] font-black tracking-wide truncate">
                      {previewPdfModal.title || 'Requerimento Oficial de Matrícula'}
                    </h3>
                    <p className="text-[10.5px] text-[#94A3B8] truncate">
                      Colégio Rodin • Requerimento de Matrícula com 4 Assinaturas e Auditoria
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      if (previewPdfModal.type === 'material') {
                        downloadMaterialOrderPDF(previewPdfModal.enrollment);
                      } else {
                        generateSignedContractPDF(previewPdfModal.enrollment);
                      }
                    }}
                    className="btn-primary-rodin !py-1.5 !px-3.5 text-[11.5px] flex items-center gap-1.5 font-bold shadow"
                    title="Baixar Arquivo PDF Oficial com nome completo"
                  >
                    <Download size={14} />
                    Baixar PDF Oficial
                  </button>
                  <button
                    onClick={() => setPreviewPdfModal(null)}
                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors ml-1"
                    title="Fechar Visualização"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Iframe com o PDF nativo */}
              <div className="flex-1 bg-slate-100 relative">
                <iframe
                  src={previewPdfModal.url}
                  title="PDF Preview"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // TELA 3: FORMULÁRIO COMPLETO DO PAI (PADRONIZAÇÃO COMPLETA & MÁSCARAS)
  // =========================================================================
  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col justify-start gap-2.5 sm:gap-3.5 py-2 sm:py-3 px-2 sm:px-4 lg:px-6 animate-fadeIn">
      {/* 1. Header Banner Compacto */}
      <div className="bg-[#1E293B] text-white rounded-2xl p-2.5 sm:p-3 px-4 sm:px-5 shadow-sm border border-[#334155] flex flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <RodinLogo variant="white" className="h-8 sm:h-9 w-auto max-w-[155px] shrink-0" alt="Colégio Rodin" />
          <div className="min-w-0 border-l border-[#334155] pl-3.5">
            <div className="flex items-center gap-2">
              <span className="text-[8.5px] font-extrabold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.2 rounded border border-[#A7F3D0] shrink-0">
                🔒 Autenticado
              </span>
            </div>
            <h1 className="text-[13px] sm:text-[15px] font-black leading-tight text-white truncate">
              Requerimento de Matrícula {enrollment.academicYear || 2027} — <span className="text-[#FED7AA] font-bold text-[12px]">{enrollment.currentGrade} ({enrollment.schoolShift})</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[12px] font-mono font-black text-[#F45206] bg-white/10 px-2.5 py-1 rounded-xl border border-white/20">
            RM {enrollment.rmNumber}
          </span>
        </div>
      </div>

      {/* 2. Stepper Compacto em Linha */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
        {[
          { step: 1, title: '1. Dados do Estudante' },
          { step: 2, title: '2. Responsável Financeiro' },
          { step: 3, title: '3. Pedido de Material Didático' },
          { step: 4, title: '4. Revisão & Assinatura' }
        ].map((s) => (
          <div
            key={s.step}
            className={`py-1.5 px-3 rounded-xl border transition-all flex items-center gap-2 ${
              parentStep === s.step
                ? 'bg-white border-[#F45206] shadow-xs ring-1 ring-[#F45206]'
                : parentStep > s.step
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]'
                : 'bg-white/80 border-[#E2E8F0] text-[#64748B]'
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
              parentStep === s.step
                ? 'bg-[#F45206] text-white shadow-xs'
                : parentStep > s.step
                ? 'bg-[#059669] text-white'
                : 'bg-[#F1F5F9] text-[#64748B]'
            }`}>
              {parentStep > s.step ? <Check size={11} /> : s.step}
            </div>
            <span className={`text-[11.5px] font-extrabold truncate ${parentStep === s.step ? 'text-[#1E293B]' : ''}`}>
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {/* 3. ETAPA 1: DADOS DO ESTUDANTE (COM CONFERÊNCIA OFICIAL DE CPF & MÁSCARAS) */}
      {parentStep === 1 && (
        <div className="rodin-panel-card !p-3.5 sm:!p-4 space-y-3 shadow-sm border border-[#E2E8F0]">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-1.5">
              <UserCheck size={16} className="text-[#F45206]" />
              <h2 className="text-[14px] font-black text-[#1E293B]">
                1. DADOS PESSOAIS DO ESTUDANTE
              </h2>
            </div>
            <span className="text-[9.5px] font-bold text-[#F45206] bg-[#FFF0E6] px-2 py-0.5 rounded-full border border-[#FED7AA]">
              Todos os campos são obrigatórios (*)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 lg:gap-3 text-[12px]">
            {/* Linha 1 */}
            <div className="form-group lg:col-span-2 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Nome completo (sem abreviaturas) *</label>
              <input
                type="text"
                placeholder="Ex: Bruno Fialho de Almeida"
                value={parentFormData.studentName}
                onChange={(e) => {
                  setParentFormData({ ...parentFormData, studentName: e.target.value });
                  if (formErrors.studentName) setFormErrors({ ...formErrors, studentName: null });
                }}
                onBlur={(e) => setParentFormData({ ...parentFormData, studentName: formatName(e.target.value) })}
                className={`form-control font-bold !h-[36px] text-[12px] ${formErrors.studentName ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              />
              {formErrors.studentName && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.studentName}</span>}
            </div>

            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Sexo: *</label>
              <div className="grid grid-cols-2 gap-1">
                {['Masc.', 'Fem.'].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setParentFormData({ ...parentFormData, studentGender: gender })}
                    className={`h-[36px] rounded-xl font-bold text-[11px] border transition-all flex items-center justify-center ${
                      parentFormData.studentGender === gender
                        ? 'bg-[#1E293B] text-white border-[#1E293B]'
                        : 'bg-white text-[#64748B] border-[#CBD5E1] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {gender === 'Masc.' ? 'Masc.' : 'Fem.'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Data de Nascimento: *</label>
              <input
                type="date"
                value={parentFormData.studentBirthDate}
                onChange={(e) => {
                  setParentFormData({ ...parentFormData, studentBirthDate: e.target.value });
                  if (formErrors.studentBirthDate) setFormErrors({ ...formErrors, studentBirthDate: null });
                }}
                className={`form-control font-bold !h-[36px] text-[12px] ${formErrors.studentBirthDate ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              />
              {formErrors.studentBirthDate && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.studentBirthDate}</span>}
            </div>

            {/* UF Nasc. (Estado) */}
            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">UF de Nasc. (Estado): *</label>
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
                className="form-select font-bold !h-[36px] text-[12px] cursor-pointer hover:border-[#F45206]"
              >
                {BRAZILIAN_UFS.map((u) => (
                  <option key={u.uf} value={u.uf}>
                    {u.uf} — {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cidade Nasc. */}
            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Cidade Nasc. ({parentFormData.studentBirthState || 'SP'}): *</label>
              <select
                value={parentFormData.studentBirthCity || 'Indaiatuba'}
                onChange={(e) => setParentFormData({ ...parentFormData, studentBirthCity: e.target.value })}
                className="form-select font-bold !h-[36px] text-[12px] cursor-pointer hover:border-[#F45206]"
              >
                {getCitiesByUF(parentFormData.studentBirthState || 'SP', parentFormData.studentBirthCity).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Linha 2 */}
            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Nacionalidade: *</label>
              <select
                value={parentFormData.studentNationality}
                onChange={(e) => {
                  setParentFormData({ ...parentFormData, studentNationality: e.target.value });
                  if (formErrors.studentNationality) setFormErrors({ ...formErrors, studentNationality: null });
                }}
                className={`form-select font-bold !h-[36px] text-[12px] ${formErrors.studentNationality ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              >
                {ALL_NATIONALITIES.map((nat) => (
                  <option key={nat} value={nat}>
                    {nat}
                  </option>
                ))}
              </select>
              {formErrors.studentNationality && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.studentNationality}</span>}
            </div>

            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">RG do Estudante: *</label>
              <input
                type="text"
                placeholder="52.345.678-9"
                value={parentFormData.studentRg}
                onChange={(e) => {
                  setParentFormData({ ...parentFormData, studentRg: maskRG(e.target.value) });
                  if (formErrors.studentRg) setFormErrors({ ...formErrors, studentRg: null });
                }}
                className={`form-control font-mono font-bold !h-[36px] text-[12px] ${formErrors.studentRg ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              />
              {formErrors.studentRg && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.studentRg}</span>}
            </div>

            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Órgão Expedidor: *</label>
              <select
                value={parentFormData.studentRgIssuer}
                onChange={(e) => {
                  setParentFormData({ ...parentFormData, studentRgIssuer: e.target.value });
                  if (formErrors.studentRgIssuer) setFormErrors({ ...formErrors, studentRgIssuer: null });
                }}
                className={`form-select font-bold !h-[36px] text-[12px] ${formErrors.studentRgIssuer ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              >
                <option value="">Selecione...</option>
                <option value="SSP/SP">SSP/SP</option>
                <option value="SSP/MG">SSP/MG</option>
                <option value="SSP/RJ">SSP/RJ</option>
                <option value="SSP/PR">SSP/PR</option>
                <option value="SSP/SC">SSP/SC</option>
                <option value="SSP/RS">SSP/RS</option>
                <option value="SSP/BA">SSP/BA</option>
                <option value="SSP/GO">SSP/GO</option>
                <option value="SSP/DF">SSP/DF</option>
                <option value="DETRAN/SP">DETRAN/SP</option>
                <option value="DETRAN/RJ">DETRAN/RJ</option>
                <option value="POLÍCIA CIVIL">POLÍCIA CIVIL</option>
                <option value="POLÍCIA FEDERAL">POLÍCIA FEDERAL (DPF)</option>
                <option value="OUTRO">OUTRO ÓRGÃO</option>
              </select>
              {formErrors.studentRgIssuer && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.studentRgIssuer}</span>}
            </div>

            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Data Exp. do RG: *</label>
              <input
                type="date"
                value={parentFormData.studentRgIssueDate}
                onChange={(e) => {
                  setParentFormData({ ...parentFormData, studentRgIssueDate: e.target.value });
                  if (formErrors.studentRgIssueDate) setFormErrors({ ...formErrors, studentRgIssueDate: null });
                }}
                className={`form-control font-bold !h-[36px] text-[12px] ${formErrors.studentRgIssueDate ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              />
              {formErrors.studentRgIssueDate && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.studentRgIssueDate}</span>}
            </div>

            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px] flex items-center justify-between">
                <span>CPF do Estudante: *</span>
                {isValidCPF(parentFormData.studentCpf) && (
                  <span className="text-[9px] text-[#059669] font-bold">✓ Válido</span>
                )}
              </label>
              <input
                type="text"
                placeholder="123.456.789-00"
                maxLength={14}
                value={parentFormData.studentCpf}
                onChange={(e) => {
                  const formatted = maskCPF(e.target.value);
                  setParentFormData({ ...parentFormData, studentCpf: formatted });
                  if (formErrors.studentCpf) setFormErrors({ ...formErrors, studentCpf: null });
                }}
                className={`form-control font-mono font-bold !h-[36px] text-[12px] ${formErrors.studentCpf ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              />
              {formErrors.studentCpf && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.studentCpf}</span>}
            </div>

            {/* Linha 3: Telefone + Botão Avançar no mesmo bloco horizontal no Desktop */}
            <div className="form-group lg:col-span-2 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Tel. Celular / WhatsApp do Aluno: *</label>
              <input
                type="text"
                placeholder="(19) 98120-6515"
                maxLength={15}
                value={parentFormData.studentPhone}
                onChange={(e) => {
                  setParentFormData({ ...parentFormData, studentPhone: maskPhone(e.target.value) });
                  if (formErrors.studentPhone) setFormErrors({ ...formErrors, studentPhone: null });
                }}
                className={`form-control font-bold !h-[36px] text-[12px] ${formErrors.studentPhone ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              />
              {formErrors.studentPhone && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.studentPhone}</span>}
            </div>

            <div className="lg:col-span-3 flex items-end justify-end pt-2 lg:pt-0">
              <button
                type="button"
                onClick={() => {
                  if (validateParentStep(1)) setParentStep(2);
                }}
                className="btn-primary-rodin !py-2.5 !px-6 text-[12px] flex items-center gap-1.5 w-full lg:w-auto justify-center shadow-md font-black"
              >
                Avançar para Dados do Responsável <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ETAPA 2: DADOS DO RESPONSÁVEL FINANCEIRO (COM CONFERÊNCIA DE CPF E ENDEREÇO) */}
      {parentStep === 2 && (
        <div className="rodin-panel-card !p-3.5 sm:!p-4 space-y-3 shadow-sm border border-[#E2E8F0]">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-1.5">
              <Building size={16} className="text-[#F45206]" />
              <h2 className="text-[14px] font-black text-[#1E293B]">
                2. QUALIFICAÇÃO DO RESPONSÁVEL FINANCEIRO
              </h2>
            </div>
            <span className="text-[9.5px] font-bold text-[#F45206] bg-[#FFF0E6] px-2 py-0.5 rounded-full border border-[#FED7AA]">
              Todos os campos são obrigatórios (*)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 lg:gap-3 text-[12px]">
            {/* Linha 1 */}
            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Parentesco: *</label>
              <select
                value={(() => {
                  const val = parentFormData.guardianRelation;
                  if (['Pai', 'Mãe', 'Avô', 'Avó', 'Outro'].includes(val)) return val;
                  if (val === 'Avô / Avó' || val === 'Avô/Avó') return 'Avô';
                  if (val === 'Outro Responsável' || val === 'Tutor(a) Legal') return 'Outro';
                  return val || '';
                })()}
                onChange={(e) => {
                  setParentFormData({ ...parentFormData, guardianRelation: e.target.value });
                  if (formErrors.guardianRelation) setFormErrors({ ...formErrors, guardianRelation: null });
                }}
                className={`form-select font-bold !h-[36px] text-[12px] ${formErrors.guardianRelation ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              >
                <option value="">Selecione...</option>
                <option value="Pai">Pai</option>
                <option value="Mãe">Mãe</option>
                <option value="Avô">Avô</option>
                <option value="Avó">Avó</option>
                <option value="Outro">Outro</option>
              </select>
              {formErrors.guardianRelation && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.guardianRelation}</span>}
            </div>

            <div className="form-group lg:col-span-2 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Nome do Responsável *</label>
              <input
                type="text"
                placeholder="Ex: Wanderson Pedro de Almeida"
                value={parentFormData.guardianName}
                onChange={(e) => {
                  handleFinancialFieldChange('guardianName', e.target.value);
                  if (formErrors.guardianName) setFormErrors({ ...formErrors, guardianName: null });
                }}
                onBlur={(e) => handleFinancialFieldChange('guardianName', formatName(e.target.value))}
                className={`form-control font-bold !h-[36px] text-[12px] ${formErrors.guardianName ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              />
              {formErrors.guardianName && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.guardianName}</span>}
            </div>

            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Sexo: *</label>
              <div className="grid grid-cols-2 gap-1">
                {['Masc.', 'Fem.'].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => setParentFormData({ ...parentFormData, guardianGender: gender })}
                    className={`h-[36px] rounded-xl font-bold text-[11px] border transition-all flex items-center justify-center ${
                      parentFormData.guardianGender === gender
                        ? 'bg-[#1E293B] text-white border-[#1E293B]'
                        : 'bg-white text-[#64748B] border-[#CBD5E1] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    {gender === 'Masc.' ? 'Masc.' : 'Fem.'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Data Nasc.: *</label>
              <input
                type="date"
                value={parentFormData.guardianBirthDate}
                onChange={(e) => {
                  setParentFormData({ ...parentFormData, guardianBirthDate: e.target.value });
                  if (formErrors.guardianBirthDate) setFormErrors({ ...formErrors, guardianBirthDate: null });
                }}
                className={`form-control font-bold !h-[36px] text-[12px] ${formErrors.guardianBirthDate ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              />
              {formErrors.guardianBirthDate && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.guardianBirthDate}</span>}
            </div>

            {/* Linha 2 */}
            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Ocupação: *</label>
              <input
                type="text"
                placeholder="Ex: Engenheiro"
                value={parentFormData.guardianOccupation}
                onChange={(e) => {
                  setParentFormData({ ...parentFormData, guardianOccupation: e.target.value });
                  if (formErrors.guardianOccupation) setFormErrors({ ...formErrors, guardianOccupation: null });
                }}
                onBlur={(e) => setParentFormData({ ...parentFormData, guardianOccupation: formatName(e.target.value) })}
                className={`form-control font-bold !h-[36px] text-[12px] ${formErrors.guardianOccupation ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              />
              {formErrors.guardianOccupation && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.guardianOccupation}</span>}
            </div>

            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Estado Civil: *</label>
              <select
                value={parentFormData.guardianMaritalStatus}
                onChange={(e) => {
                  setParentFormData({ ...parentFormData, guardianMaritalStatus: e.target.value });
                  if (formErrors.guardianMaritalStatus) setFormErrors({ ...formErrors, guardianMaritalStatus: null });
                }}
                className={`form-select font-bold !h-[36px] text-[12px] ${formErrors.guardianMaritalStatus ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              >
                <option value="">Selecione...</option>
                <option value="Casado(a)">Casado(a)</option>
                <option value="Solteiro(a)">Solteiro(a)</option>
                <option value="Divorciado(a)">Divorciado(a)</option>
                <option value="União Estável">União Estável</option>
                <option value="Viúvo(a)">Viúvo(a)</option>
              </select>
              {formErrors.guardianMaritalStatus && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.guardianMaritalStatus}</span>}
            </div>

            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">RG: *</label>
              <input
                type="text"
                placeholder="34.567.890-1"
                value={parentFormData.guardianRg}
                onChange={(e) => {
                  setParentFormData({ ...parentFormData, guardianRg: maskRG(e.target.value) });
                  if (formErrors.guardianRg) setFormErrors({ ...formErrors, guardianRg: null });
                }}
                className={`form-control font-mono font-bold !h-[36px] text-[12px] ${formErrors.guardianRg ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              />
              {formErrors.guardianRg && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.guardianRg}</span>}
            </div>

            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Órgão Expedidor: *</label>
              <select
                value={parentFormData.guardianRgIssuer}
                onChange={(e) => {
                  setParentFormData({ ...parentFormData, guardianRgIssuer: e.target.value });
                  if (formErrors.guardianRgIssuer) setFormErrors({ ...formErrors, guardianRgIssuer: null });
                }}
                className={`form-select font-bold !h-[36px] text-[12px] ${formErrors.guardianRgIssuer ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              >
                <option value="">Selecione...</option>
                <option value="SSP/SP">SSP/SP</option>
                <option value="SSP/MG">SSP/MG</option>
                <option value="SSP/RJ">SSP/RJ</option>
                <option value="SSP/PR">SSP/PR</option>
                <option value="SSP/SC">SSP/SC</option>
                <option value="SSP/RS">SSP/RS</option>
                <option value="SSP/BA">SSP/BA</option>
                <option value="SSP/GO">SSP/GO</option>
                <option value="SSP/DF">SSP/DF</option>
                <option value="DETRAN/SP">DETRAN/SP</option>
                <option value="DETRAN/RJ">DETRAN/RJ</option>
                <option value="POLÍCIA CIVIL">POLÍCIA CIVIL</option>
                <option value="POLÍCIA FEDERAL">POLÍCIA FEDERAL (DPF)</option>
                <option value="OUTRO">OUTRO ÓRGÃO</option>
              </select>
              {formErrors.guardianRgIssuer && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.guardianRgIssuer}</span>}
            </div>

            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px] flex items-center justify-between">
                <span>CPF: *</span>
                {isValidCPF(parentFormData.guardianCpf) && (
                  <span className="text-[9px] text-[#059669] font-bold">✓ Válido</span>
                )}
              </label>
              <input
                type="text"
                placeholder="123.456.789-00"
                maxLength={14}
                value={parentFormData.guardianCpf}
                onChange={(e) => {
                  const formatted = maskCPF(e.target.value);
                  handleFinancialFieldChange('guardianCpf', formatted);
                  if (formErrors.guardianCpf) setFormErrors({ ...formErrors, guardianCpf: null });
                }}
                className={`form-control font-mono font-bold !h-[36px] text-[12px] ${formErrors.guardianCpf ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              />
              {formErrors.guardianCpf && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.guardianCpf}</span>}
            </div>

            {/* Linha 3: Endereço com CEP */}
            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">CEP: *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="13330-000"
                  maxLength={9}
                  value={parentFormData.guardianAddressCep}
                  onChange={(e) => {
                    const formatted = maskCEP(e.target.value);
                    handleCepLookup(formatted);
                    if (formErrors.guardianAddressCep) setFormErrors({ ...formErrors, guardianAddressCep: null });
                  }}
                  className={`form-control font-mono font-bold !h-[36px] text-[12px] ${formErrors.guardianAddressCep ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
                {isLoadingCep && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[#F45206] font-bold animate-pulse">
                    ...
                  </span>
                )}
              </div>
              {formErrors.guardianAddressCep && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.guardianAddressCep}</span>}
            </div>

            <div className="form-group lg:col-span-2 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Logradouro (Rua / Av): *</label>
              <input
                type="text"
                placeholder="Rua Exemplo"
                value={parentFormData.guardianAddressStreet}
                onChange={(e) => {
                  setParentFormData({ ...parentFormData, guardianAddressStreet: e.target.value });
                  if (formErrors.guardianAddressStreet) setFormErrors({ ...formErrors, guardianAddressStreet: null });
                }}
                className={`form-control font-bold !h-[36px] text-[12px] ${formErrors.guardianAddressStreet ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              />
              {formErrors.guardianAddressStreet && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.guardianAddressStreet}</span>}
            </div>

            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Número: *</label>
              <input
                type="text"
                placeholder="123"
                value={parentFormData.guardianAddressNumber}
                onChange={(e) => {
                  setParentFormData({ ...parentFormData, guardianAddressNumber: e.target.value });
                  if (formErrors.guardianAddressNumber) setFormErrors({ ...formErrors, guardianAddressNumber: null });
                }}
                className={`form-control font-bold !h-[36px] text-[12px] ${formErrors.guardianAddressNumber ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              />
              {formErrors.guardianAddressNumber && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.guardianAddressNumber}</span>}
            </div>

            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Complemento:</label>
              <input
                type="text"
                placeholder="Apto 42"
                value={parentFormData.guardianAddressComplement}
                onChange={(e) => setParentFormData({ ...parentFormData, guardianAddressComplement: e.target.value })}
                className="form-control !h-[36px] text-[12px]"
              />
            </div>

            {/* Linha 4: Bairro, Cidade, UF, Email e Celular */}
            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Bairro: *</label>
              <input
                type="text"
                placeholder="Centro"
                value={parentFormData.guardianAddressNeighborhood}
                onChange={(e) => {
                  setParentFormData({ ...parentFormData, guardianAddressNeighborhood: e.target.value });
                  if (formErrors.guardianAddressNeighborhood) setFormErrors({ ...formErrors, guardianAddressNeighborhood: null });
                }}
                className={`form-control font-bold !h-[36px] text-[12px] ${formErrors.guardianAddressNeighborhood ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              />
              {formErrors.guardianAddressNeighborhood && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.guardianAddressNeighborhood}</span>}
            </div>

            {/* UF Residencial (Estado) */}
            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">UF Residencial: *</label>
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
                className="form-select font-bold !h-[36px] text-[12px] cursor-pointer hover:border-[#F45206]"
              >
                {BRAZILIAN_UFS.map((u) => (
                  <option key={u.uf} value={u.uf}>
                    {u.uf} — {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cidade Residencial */}
            <div className="form-group lg:col-span-1 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Cidade ({parentFormData.guardianAddressState || 'SP'}): *</label>
              <select
                value={parentFormData.guardianAddressCity || 'Indaiatuba'}
                onChange={(e) => setParentFormData({ ...parentFormData, guardianAddressCity: e.target.value })}
                className="form-select font-bold !h-[36px] text-[12px] cursor-pointer hover:border-[#F45206]"
              >
                {getCitiesByUF(parentFormData.guardianAddressState || 'SP', parentFormData.guardianAddressCity).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group lg:col-span-1.5 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">E-mail Principal: *</label>
              <input
                type="email"
                placeholder="responsavel@email.com"
                value={parentFormData.guardianEmail}
                onChange={(e) => {
                  setParentFormData({ ...parentFormData, guardianEmail: e.target.value });
                  if (formErrors.guardianEmail) setFormErrors({ ...formErrors, guardianEmail: null });
                }}
                className={`form-control font-bold text-[#F45206] !h-[36px] text-[12px] ${formErrors.guardianEmail ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              />
              {formErrors.guardianEmail && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.guardianEmail}</span>}
            </div>

            <div className="form-group lg:col-span-1.5 !mb-0">
              <label className="form-label !mb-0.5 text-[11px]">Celular / WhatsApp: *</label>
              <input
                type="text"
                placeholder="(19) 98120-6515"
                maxLength={15}
                value={parentFormData.guardianPhone}
                onChange={(e) => {
                  setParentFormData({ ...parentFormData, guardianPhone: maskPhone(e.target.value) });
                  if (formErrors.guardianPhone) setFormErrors({ ...formErrors, guardianPhone: null });
                }}
                className={`form-control font-bold !h-[36px] text-[12px] ${formErrors.guardianPhone ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
              />
              {formErrors.guardianPhone && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.guardianPhone}</span>}
            </div>
          </div>

          <div className="flex justify-between pt-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setParentStep(1)}
              className="btn-secondary-rodin !py-2 !px-4 text-[12px] flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Voltar
            </button>
            <button
              type="button"
              onClick={() => {
                if (validateParentStep(2)) {
                  if (!parentFormData.materialBuyerName) {
                    setParentFormData(prev => ({
                      ...prev,
                      materialBuyerName: prev.guardianName,
                      materialBuyerCpf: prev.guardianCpf
                    }));
                  }
                  setParentStep(3);
                }
              }}
              className="btn-primary-rodin !py-2.5 !px-6 text-[12px] flex items-center gap-1.5 shadow-md font-black"
            >
              Avançar para Pedido de Material <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          NOVA ETAPA 3: PEDIDO DE MATERIAL DIDÁTICO (LIVRARIA DO PENSADOR LTDA)
          CNPJ: 43.849.399/0001-92 - COMPRADOR DESVINCULADO DO RESP. FINANCEIRO
         ========================================================================= */}
      {parentStep === 3 && (
        <div className="rodin-panel-card !p-3.5 sm:!p-5 space-y-4 shadow-sm border border-[#E2E8F0]">
          {/* Topo do Pedido de Material */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center text-white shrink-0 shadow-sm">
                <BookOpen size={18} className="text-[#F45206]" />
              </div>
              <div>
                <h2 className="text-[15px] sm:text-[16px] font-black text-[#1E293B]">
                  3. PEDIDO DE MATERIAL DIDÁTICO
                </h2>
                <p className="text-[11px] text-[#64748B]">
                  Livraria do Pensador LTDA • CNPJ 43.849.399/0001-92 — Rua Padre José de Anchieta, 484, sala 1, Indaiatuba/SP
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-3 py-1 rounded-full border border-[#A7F3D0] shrink-0 self-start sm:self-auto">
              Material Didático Selecionado Colégio Rodin {enrollment.academicYear || 2027}
            </span>
          </div>

          {/* Aviso Explicativo da Separação Legal das Empresas e Comprador */}
          <div className="p-3 bg-[#FFF7ED] rounded-xl border border-[#FED7AA] flex items-start gap-2.5 text-[11.5px] text-[#9A3412]">
            <AlertTriangle size={16} className="text-[#F45206] shrink-0 mt-0.5" />
            <div>
              <strong className="block text-[#7C2D12]">Comprador do Material Didático:</strong>
              O material é comercializado pela <strong>Livraria do Pensador LTDA</strong>. O comprador pode ser o mesmo responsável financeiro ou outra pessoa (mãe, pai, avó, parente ou terceiro).
              <span className="block mt-0.5 text-[#C2410C] font-semibold">
                * Caso altere ou apague o nome do comprador abaixo, os dados do Responsável Financeiro da escola (Etapa 2) NÃO serão alterados.
              </span>
            </div>
          </div>

          {/* Bloco 1: Identificação do Comprador do Material Didático */}
          <div className="p-3.5 bg-[#F8FAFC] rounded-2xl border border-[#CBD5E1] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-[12px] font-black text-[#1E293B] flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-[#F45206]" />
                Dados do Comprador do Material Didático:
              </label>

              {/* Botão / Checkbox de Sincronização Inteligente */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#475569] cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-[#CBD5E1] shadow-2xs hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={parentFormData.isBuyerSameAsFinancial}
                    onChange={(e) => handleToggleSameBuyer(e.target.checked)}
                    className="w-3.5 h-3.5 text-[#F45206] rounded border-[#CBD5E1] focus:ring-[#F45206]"
                  />
                  <span>Mesmo do Responsável Financeiro</span>
                </label>
                {!parentFormData.isBuyerSameAsFinancial && (
                  <button
                    type="button"
                    onClick={() => handleToggleSameBuyer(true)}
                    className="text-[10px] font-bold text-[#2563EB] hover:underline flex items-center gap-0.5"
                    title="Copiar dados cadastrados do Responsável Financeiro"
                  >
                    <RefreshCw size={11} /> Re-sincronizar
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Nome do Comprador */}
              <div className="form-group sm:col-span-2 !mb-0">
                <label className="form-label !mb-0.5 text-[11px] flex items-center justify-between">
                  <span>Nome do Comprador (resp. fin.): *</span>
                  {parentFormData.isBuyerSameAsFinancial ? (
                    <span className="text-[9.5px] text-[#059669] font-bold">✓ Vinculado ao Resp. Financeiro</span>
                  ) : (
                    <span className="text-[9.5px] text-[#D97706] font-bold">✎ Personalizado separadamente</span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="Nome completo do comprador do material"
                  value={parentFormData.materialBuyerName}
                  onChange={(e) => {
                    handleBuyerFieldChange('materialBuyerName', e.target.value);
                    if (formErrors.materialBuyerName) setFormErrors({ ...formErrors, materialBuyerName: null });
                  }}
                  onBlur={(e) => handleBuyerFieldChange('materialBuyerName', formatName(e.target.value))}
                  className={`form-control font-bold !h-[36px] text-[12px] ${formErrors.materialBuyerName ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
                {formErrors.materialBuyerName && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.materialBuyerName}</span>}
              </div>

              {/* CPF do Comprador */}
              <div className="form-group !mb-0">
                <label className="form-label !mb-0.5 text-[11px] flex items-center justify-between">
                  <span>CPF do Comprador: *</span>
                  {isValidCPF(parentFormData.materialBuyerCpf) && (
                    <span className="text-[9px] text-[#059669] font-bold">✓ Válido</span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  value={parentFormData.materialBuyerCpf}
                  onChange={(e) => {
                    const formatted = maskCPF(e.target.value);
                    handleBuyerFieldChange('materialBuyerCpf', formatted);
                    if (formErrors.materialBuyerCpf) setFormErrors({ ...formErrors, materialBuyerCpf: null });
                  }}
                  className={`form-control font-mono font-bold !h-[36px] text-[12px] ${formErrors.materialBuyerCpf ? '!border-[#EF4444] !bg-[#FEF2F2]' : ''}`}
                />
                {formErrors.materialBuyerCpf && <span className="text-[10px] text-[#EF4444] font-bold block mt-0.5">{formErrors.materialBuyerCpf}</span>}
              </div>
            </div>
          </div>

          {/* Bloco 2: Dados Acadêmicos do Estudante e Kit Didático Vinculado */}
          <div className="p-3.5 bg-[#FFFFFF] rounded-2xl border border-[#CBD5E1] space-y-2.5">
            <h4 className="text-[12px] font-black text-[#1E293B] uppercase flex items-center gap-1.5">
              <Layers size={14} className="text-[#F45206]" /> Detalhamento do Estudante & Série:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px]">
              <div className="col-span-2">
                <span className="text-[9.5px] text-[#64748B] block font-bold">NOME DO ESTUDANTE:</span>
                <strong className="text-[#1E293B] block truncate">{parentFormData.studentName || 'Estudante'}</strong>
              </div>
              <div>
                <span className="text-[9.5px] text-[#64748B] block font-bold">ANO LETIVO:</span>
                <strong className="text-[#F45206] block">{enrollment.academicYear || 2027}</strong>
              </div>
              <div>
                <span className="text-[9.5px] text-[#64748B] block font-bold">SÉRIE / TURMA:</span>
                <strong className="text-[#1E293B] block truncate">{enrollment.currentGrade || '6º Ano EF'}</strong>
              </div>
              <div>
                <span className="text-[9.5px] text-[#64748B] block font-bold">TURNO:</span>
                <strong className="text-[#1E293B] block">{enrollment.schoolShift || 'Manhã'}</strong>
              </div>
            </div>

            {/* Resumo do Kit Didático Correspondente */}
            <div className="p-2.5 rounded-xl bg-[#F0FDF4] border border-[#A7F3D0] text-[11px] text-[#14532D]">
              <div className="flex items-center justify-between mb-1">
                <strong className="font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-[#059669]" />
                  {String(enrollment.currentGrade).includes('1ª') || String(enrollment.currentGrade).includes('2ª')
                    ? 'Kit Vinculado: ANEXO II — Ensino Médio (1ª e 2ª Séries)'
                    : String(enrollment.currentGrade).includes('3ª') || String(enrollment.currentGrade).includes('Terceir')
                    ? 'Kit Vinculado: ANEXO III — Ensino Médio (Terceirão)'
                    : 'Kit Vinculado: ANEXO I — Ensino Fundamental (6º ao 9º Anos)'}
                </strong>
                <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-[#A7F3D0]">
                  Sistema COC + Plataformas Digitais
                </span>
              </div>
              <p className="text-[10.5px] text-[#166534] leading-snug">
                Inclui livros multidisciplinares, apostilas de teoria e exercícios, acesso integral à Plataforma Jornada COC Educação, materiais de educação bilíngue, inteligência emocional e redação.
              </p>
            </div>
          </div>

          {/* Bloco 3: Condições Comerciais do Pedido de Material Didático */}
          <div className="p-3.5 bg-[#FFF0E6]/50 rounded-2xl border border-[#FED7AA] space-y-3">
            <h4 className="text-[12px] font-black text-[#1E293B] uppercase flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CreditCard size={14} className="text-[#F45206]" /> Condições Financeiras do Material Didático:
              </span>
              <span className="text-[10px] font-bold text-[#C2410C]">
                Vencimento dia 10 de cada mês
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[11.5px]">
              {/* Valor Total */}
              <div className="form-group !mb-0">
                <label className="form-label !mb-0.5 text-[11px]">Valor Total (R$): *</label>
                <input
                  type="text"
                  value={typeof parentFormData.materialTotalValue === 'number' ? parentFormData.materialTotalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : parentFormData.materialTotalValue}
                  onChange={(e) => {
                    const cleanVal = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.')) || 0;
                    setParentFormData(prev => ({ ...prev, materialTotalValue: cleanVal }));
                  }}
                  className="form-control font-bold !h-[36px] text-[12px] bg-white"
                />
              </div>

              {/* Número de Parcelas */}
              <div className="form-group !mb-0">
                <label className="form-label !mb-0.5 text-[11px]">Número de Parcelas: *</label>
                <select
                  value={parentFormData.materialInstallmentsCount}
                  onChange={(e) => setParentFormData(prev => ({ ...prev, materialInstallmentsCount: parseInt(e.target.value) }))}
                  className="form-select font-bold !h-[36px] text-[12px] bg-white"
                >
                  <option value={1}>1x (À vista com desconto)</option>
                  <option value={4}>4 parcelas mensais</option>
                  <option value={6}>6 parcelas mensais (Padrão)</option>
                  <option value={8}>8 parcelas mensais</option>
                  <option value={10}>10 parcelas mensais</option>
                </select>
              </div>

              {/* Vencimento Inicial */}
              <div className="form-group !mb-0">
                <label className="form-label !mb-0.5 text-[11px]">Vencimento Inicial: *</label>
                <input
                  type="date"
                  value={parentFormData.materialStartDueDate}
                  onChange={(e) => setParentFormData(prev => ({ ...prev, materialStartDueDate: e.target.value }))}
                  className="form-control font-bold !h-[36px] text-[12px] bg-white"
                />
              </div>

              {/* Vencimento Final */}
              <div className="form-group !mb-0">
                <label className="form-label !mb-0.5 text-[11px]">Vencimento Final: *</label>
                <input
                  type="date"
                  value={parentFormData.materialEndDueDate}
                  onChange={(e) => setParentFormData(prev => ({ ...prev, materialEndDueDate: e.target.value }))}
                  className="form-control font-bold !h-[36px] text-[12px] bg-white"
                />
              </div>
            </div>

            <div className="p-2 bg-white rounded-xl border border-[#FED7AA] text-[10.5px] text-[#475569] flex items-center justify-between">
              <span>
                <strong>Parcelamento estimado:</strong> {parentFormData.materialInstallmentsCount}x de R${' '}
                {(
                  (typeof parentFormData.materialTotalValue === 'number'
                    ? parentFormData.materialTotalValue
                    : parseFloat(String(parentFormData.materialTotalValue || 5248.80).replace(/\./g, '').replace(',', '.')) || 5248.80) /
                  (parseInt(parentFormData.materialInstallmentsCount) || 6)
                ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="font-bold text-[#F45206]">
                Boleto Bancário ou Cartão de Crédito / Débito
              </span>
            </div>
          </div>

          {/* Bloco 4: Quadro Oficial de Informações sobre o Material Didático */}
          <div className="p-3 bg-white rounded-2xl border border-[#CBD5E1] space-y-1.5 text-[11px] text-[#475569]">
            <strong className="text-[11.5px] text-[#1E293B] block uppercase text-center font-black pb-1 border-b border-[#E2E8F0]">
              INFORMAÇÕES SOBRE O MATERIAL DIDÁTICO
            </strong>
            <p>
              • A escola adotará o material didático que atenda seu planejamento pedagógico e indicará esse material para aquisição pelos alunos, sendo a <strong>Livraria do Pensador Ltda</strong> uma das opções para isso.
            </p>
            <p>
              • O material didático é entregue aos alunos na própria escola ao longo do ano, em datas por ela estabelecidas, para conveniência do estudante ou seu responsável financeiro. As datas de entrega seguem a programação das disciplinas, independentemente do cronograma de pagamento, que varia conforme a opção de plano escolhida.
            </p>
          </div>

          {/* Botões de Navegação */}
          <div className="flex justify-between pt-2 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setParentStep(2)}
              className="btn-secondary-rodin !py-2 !px-4 text-[12px] flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Voltar para Responsável Financeiro
            </button>
            <button
              type="button"
              onClick={() => {
                if (validateParentStep(3)) setParentStep(4);
              }}
              className="btn-primary-rodin !py-2.5 !px-6 text-[12px] flex items-center gap-1.5 shadow-md font-black"
            >
              Avançar para Revisão & Assinatura <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          ETAPA 4: REVISÃO DOS 2 CONTRATOS & ASSINATURA DIGITAL COMPARTILHADA
         ========================================================================= */}
      {parentStep === 4 && (
        <form onSubmit={handleFinalSubmit} className="space-y-4">
          {/* Navegador em Abas dos 2 Contratos Legais */}
          <div className="bg-white border border-[#CBD5E1] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-[16px] font-black text-[#1E293B] flex items-center gap-2">
                  <FileSignature className="text-[#F45206]" size={20} />
                  4. Revisão dos Contratos e Assinatura Digital
                </h3>
                <p className="text-[11.5px] text-[#64748B] mt-0.5">
                  Alterne entre as abas abaixo para conferir o Requerimento de Matrícula e o Pedido de Material Didático.
                </p>
              </div>

              {/* Seletor de Abas */}
              <div className="flex items-center gap-1.5 bg-[#F1F5F9] p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveContractTab('matricula')}
                  className={`py-1.5 px-3 rounded-lg text-[11.5px] font-bold transition-all flex items-center gap-1.5 ${
                    activeContractTab === 'matricula'
                      ? 'bg-white text-[#F45206] shadow-xs font-black'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  <FileText size={13} />
                  1. Matrícula (Balder)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveContractTab('material')}
                  className={`py-1.5 px-3 rounded-lg text-[11.5px] font-bold transition-all flex items-center gap-1.5 ${
                    activeContractTab === 'material'
                      ? 'bg-white text-[#059669] shadow-xs font-black'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  <BookOpen size={13} />
                  2. Material (Pensador)
                </button>
              </div>
            </div>

            {/* ABA 1: CONTRATO DE MATRÍCULA ESCOLAR */}
            {activeContractTab === 'matricula' && (
              <div className="space-y-3">
                {/* Resumo do Aluno e Anuidade Escolar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11.5px]">
                  <div>
                    <span className="text-[10px] font-bold text-[#F45206] uppercase block">ALUNO(A)</span>
                    <strong className="text-[#1E293B] block">{parentFormData.studentName || 'Estudante'}</strong>
                    <span className="text-[#64748B] text-[10.5px]">RM {enrollment.rmNumber} • {enrollment.currentGrade} ({enrollment.schoolShift})</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#F45206] uppercase block">RESPONSÁVEL FINANCEIRO</span>
                    <strong className="text-[#1E293B] block">{parentFormData.guardianName}</strong>
                    <span className="text-[#64748B] text-[10.5px]">CPF: {parentFormData.guardianCpf} • Tel: {parentFormData.guardianPhone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#F45206] uppercase block">ANUIDADE ESCOLAR</span>
                    {(() => {
                      const is100 = enrollment.tuitionDiscountPercentage === 1 || 
                        enrollment.tuitionDiscountPercentage === 1.0 || 
                        enrollment.tuitionDiscountPercentage === 100 || 
                        enrollment.tuitionDiscountTotal === 0 ||
                        /100%/i.test(String(enrollment.tuitionDiscountType || enrollment.tuitionDiscountReason || ''));
                      const displayTuition = is100 ? '0,00' : (
                        enrollment.tuitionDiscountTotal !== undefined && enrollment.tuitionDiscountTotal !== null
                          ? (typeof enrollment.tuitionDiscountTotal === 'number' ? enrollment.tuitionDiscountTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : enrollment.tuitionDiscountTotal)
                          : (typeof enrollment.tuitionGrossTotal === 'number' ? enrollment.tuitionGrossTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : enrollment.tuitionGrossTotal)
                      );
                      const displayRegVal = is100 ? '0,00' : (
                        typeof enrollment.regularInstallmentValue === 'number' ? enrollment.regularInstallmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : enrollment.regularInstallmentValue
                      );
                      return (
                        <>
                          <strong className="text-[#1E293B] block text-[13px]">
                            R$ {displayTuition} {is100 ? <span className="text-[#059669] text-[11px] font-bold">(Bolsa 100%)</span> : null}
                          </strong>
                          <span className="text-[#059669] font-bold text-[10.5px]">
                            {is100 ? 'Isento de Parcelas' : (enrollment.installmentsCount > 1 ? `${enrollment.installmentsCount - 1}x R$ ${displayRegVal}` : 'À Vista')}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Texto do Contrato Escolar */}
                <div
                  ref={contractScrollRef}
                  onScroll={handleContractScroll}
                  className="border border-[#CBD5E1] rounded-xl bg-[#FFFFFF] p-4 text-[11.5px] text-[#334155] leading-relaxed max-h-64 overflow-y-auto space-y-3 custom-scrollbar shadow-inner relative"
                >
                  <div className="text-center pb-2 border-b border-[#E2E8F0]">
                    <strong className="text-[#1E293B] text-[12.5px] block uppercase">
                      INSTRUMENTO PARTICULAR DE CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS
                    </strong>
                    <span className="text-[10.5px] text-[#64748B]">BALDER EDUCACIONAL LTDA — CNPJ nº 29.221.297/0001-05</span>
                  </div>

                  <p>
                    <strong>QUALIFICAÇÃO DAS PARTES:</strong> De um lado, <strong>BALDER EDUCACIONAL LTDA</strong> (Colégio Rodin), inscrita no CNPJ/MF sob o nº 29.221.297/0001-05, com sede em Indaiatuba/SP, doravante denominada <strong>CONTRATADA</strong>, e de outro lado o(a) <strong>RESPONSÁVEL FINANCEIRO(A)</strong> contratante devidamente qualificado(a), doravante denominado(a) <strong>CONTRATANTE</strong>.
                  </p>

                  <p>
                    <strong>CLÁUSULA 1ª - DO OBJETO:</strong> O presente contrato tem por objeto a prestação de serviços educacionais pela CONTRATADA em favor do ALUNO(A) beneficiário(a), para o ano letivo de <strong>{enrollment.academicYear || 2027}</strong>, correspondente ao nível e série especificados na Ficha de Matrícula, em conformidade com a LDB (Lei nº 9.394/1996) e com o Regimento Escolar do Colégio Rodin.
                  </p>

                  <p>
                    <strong>CLÁUSULA 2ª - DA VIGÊNCIA E RENOVAÇÃO:</strong> O contrato vigorará por prazo determinado correspondente ao ano letivo de {enrollment.academicYear || 2027}, iniciando-se na data da sua assinatura eletrônica e encerrando-se com o término do período letivo.
                  </p>

                  <p>
                    <strong>CLÁUSULA 3ª - DA ANUIDADE E FORMA DE PAGAMENTO:</strong> Pelos serviços educacionais prestados, o(a) CONTRATANTE pagará à CONTRATADA o valor total da anuidade escolar acordado, subdividido na parcela de reserva e parcelas mensais vincendas no 1º dia útil de cada mês.
                  </p>

                  <p>
                    <strong>CLÁUSULA 4ª - DAS OBRIGAÇÕES DA CONTRATADA:</strong> Ministrar as aulas e atividades curriculares programadas, fornecer suporte pedagógico, manter o ambiente escolar seguro e adequado ao desenvolvimento integral do estudante.
                  </p>

                  <p>
                    <strong>CLÁUSULA 5ª - DAS OBRIGAÇÕES DO CONTRATANTE:</strong> Cumprir os prazos de pagamento, zelar pela assiduidade e pontualidade do estudante (frequência mínima de 75% exigida por lei), adquirir o material didático pedagógico exigido (Sistema COC e plataformas tecnológicas integradas Edify/LIV/TRIEduc) e garantir a utilização do uniforme escolar oficial.
                  </p>

                  <p>
                    <strong>CLÁUSULA 8ª - DO TRATAMENTO DE DADOS PESSOAIS (LGPD):</strong> O CONTRATANTE expressamente autoriza o tratamento dos dados pessoais nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
                  </p>

                  <p>
                    <strong>CLÁUSULA 10ª - DA VALIDADE JURÍDICA E FORO:</strong> As partes reconhecem a plena validade jurídica e eficácia da assinatura eletrônica realizada neste portal (MP nº 2.200-2/2001 e Art. 784, III do CPC). Fica eleito o Foro da Comarca de Indaiatuba/SP.
                  </p>
                </div>
              </div>
            )}

            {/* ABA 2: PEDIDO DE MATERIAL DIDÁTICO (LIVRARIA DO PENSADOR) */}
            {activeContractTab === 'material' && (
              <div className="space-y-3">
                {/* Resumo do Pedido de Material */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-xl bg-[#F0FDF4] border border-[#A7F3D0] text-[11.5px]">
                  <div>
                    <span className="text-[10px] font-bold text-[#059669] uppercase block">COMPRADOR DO MATERIAL</span>
                    <strong className="text-[#1E293B] block">{parentFormData.materialBuyerName || parentFormData.guardianName}</strong>
                    <span className="text-[#64748B] text-[10.5px]">CPF: {parentFormData.materialBuyerCpf || parentFormData.guardianCpf}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#059669] uppercase block">FORNECEDORA / LIVRARIA</span>
                    <strong className="text-[#1E293B] block">Livraria do Pensador LTDA</strong>
                    <span className="text-[#64748B] text-[10.5px]">CNPJ 43.849.399/0001-92 • Indaiatuba/SP</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#059669] uppercase block">VALOR TOTAL DO MATERIAL</span>
                    <strong className="text-[#1E293B] block text-[13px]">
                      R$ {(typeof parentFormData.materialTotalValue === 'number' ? parentFormData.materialTotalValue : parseFloat(String(parentFormData.materialTotalValue || 5248.80).replace(/\./g, '').replace(',', '.')) || 5248.80).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                    <span className="text-[#059669] font-bold text-[10.5px]">
                      {parentFormData.materialInstallmentsCount} parcelas • Vencimento dia 10
                    </span>
                  </div>
                </div>

                {/* Texto das Condições Gerais do Pedido de Material Didático */}
                <div className="border border-[#CBD5E1] rounded-xl bg-[#FFFFFF] p-4 text-[11.5px] text-[#334155] leading-relaxed max-h-64 overflow-y-auto space-y-3 custom-scrollbar shadow-inner relative">
                  <div className="text-center pb-2 border-b border-[#E2E8F0]">
                    <strong className="text-[#1E293B] text-[12.5px] block uppercase">
                      CONDIÇÕES GERAIS DO PEDIDO DE MATERIAL DIDÁTICO
                    </strong>
                    <span className="text-[10.5px] text-[#64748B]">LIVRARIA DO PENSADOR LTDA — CNPJ nº 43.849.399/0001-92</span>
                  </div>

                  <p>
                    <strong>1.</strong> O conjunto de material didático é entregue ao longo do ano letivo, independentemente do cronograma de pagamento, em datas estabelecidas pela escola.
                  </p>
                  <p>
                    <strong>2.</strong> Aos pagamentos efetuados após o vencimento serão aplicados multa de 2%, correção pela taxa SELIC e juros de mora de 1% ao mês.
                  </p>
                  <p>
                    <strong>3.</strong> O pagamento poderá ser realizado à vista ou de forma parcelada, mediante boleto bancário, a ser emitido no ato do pedido, ou por cartão de crédito ou débito, conforme a opção do responsável financeiro. O vencimento das parcelas ocorrerá no dia 10 (dez) de cada mês.
                  </p>
                  <p>
                    <strong>4.</strong> O inadimplemento de qualquer pagamento acarretará a imediata suspensão da entrega do material pela editora.
                  </p>
                  <p>
                    <strong>5.</strong> A desistência do pedido poderá ser feita, por escrito, até 20 dias antes do início das aulas, ocasião em que serão restituídos os valores pagos.
                  </p>
                  <p>
                    <strong>7.</strong> A Livraria do Pensador LTDA vende somente "kits" completos para cada modalidade de ensino, conforme o plano e a forma de pagamento em vigência no momento da compra.
                  </p>
                  <p>
                    <strong>10.</strong> Fazem parte do conjunto de materiais tanto as versões impressas como digitais do Sistema de Ensino adotado pela Escola, inclusive acesso a portais de internet e senhas.
                  </p>
                  <p>
                    <strong>13.</strong> Tratamento e compartilhamento de dados pessoais nos termos da Lei nº 13.709/2018 (LGPD).
                  </p>
                </div>
              </div>
            )}

            {/* Declaração de Aceite Obrigatório de Ambos os Documentos */}
            <div className={`p-3 rounded-xl border transition-all flex items-start gap-2.5 ${hasScrolledToBottom ? 'bg-[#FFF7ED] border-[#FED7AA]' : 'bg-[#F8FAFC] border-[#E2E8F0] opacity-80'}`}>
              <input
                type="checkbox"
                id="acceptContractCheckbox"
                required
                checked={hasAcceptedContract}
                disabled={!hasScrolledToBottom}
                onChange={(e) => setHasAcceptedContract(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#F45206] rounded border-[#FED7AA] focus:ring-[#F45206] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              />
              <div className="flex-1">
                <label htmlFor="acceptContractCheckbox" className={`text-[12px] font-bold leading-tight ${hasScrolledToBottom ? 'text-[#1E293B] cursor-pointer' : 'text-[#64748B] cursor-not-allowed'}`}>
                  Declaro que li atentamente e concordo com todas as cláusulas do <strong>Contrato de Prestação de Serviços Educacionais (Balder Educacional LTDA)</strong> e do <strong>Pedido de Material Didático (Livraria do Pensador LTDA - CNPJ 43.849.399/0001-92)</strong>.
                </label>
                {!hasScrolledToBottom ? (
                  <span className="text-[10.5px] font-bold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded border border-[#FDE68A] flex items-center gap-1 mt-1.5 w-fit">
                    👇 Role o quadro do contrato até o final para liberar este aceite
                  </span>
                ) : !hasAcceptedContract ? (
                  <span className="text-[10.5px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE] flex items-center gap-1 mt-1.5 w-fit">
                    ✓ Leitura concluída! Marque a caixinha ao lado para concordar
                  </span>
                ) : (
                  <span className="text-[10.5px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0] flex items-center gap-1 mt-1.5 w-fit">
                    ✓ Termos de ambos os contratos aceitos
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Seção de Assinaturas Institucionais e Canvas Digital do Responsável */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
            {/* Coluna Esquerda: Folha Timbrada & Condições de Pagamento */}
            <div className="lg:col-span-7 bg-white border border-[#CBD5E1] rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between text-[#1E293B] shadow-xs">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                  <div>
                    <h3 className="text-[13.5px] font-black text-[#1E293B] uppercase leading-none">
                      COLÉGIO RODIN & LIVRARIA DO PENSADOR — DOCUMENTOS DIGITAIS
                    </h3>
                    <span className="text-[9.5px] text-[#64748B]">Balder Educacional LTDA (CNPJ 29.221.297/0001-05) • Livraria do Pensador LTDA (CNPJ 43.849.399/0001-92)</span>
                  </div>
                  <span className="font-mono font-black text-[14px] text-[#F45206] bg-[#FFF0E6] px-2 py-0.5 rounded border border-[#FED7AA]">
                    RM {enrollment.rmNumber}
                  </span>
                </div>

                {/* Resumo Consolidado Compacto */}
                <div className="grid grid-cols-2 gap-2 p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[11px]">
                  <div>
                    <span className="font-bold text-[#F45206] block">ALUNO:</span>
                    <strong>{parentFormData.studentName}</strong>
                    <span className="text-[10px] text-[#64748B] block">{enrollment.courseLevel} • {enrollment.currentGrade} ({enrollment.schoolShift})</span>
                  </div>
                  <div>
                    <span className="font-bold text-[#F45206] block">RESPONSÁVEL / COMPRADOR:</span>
                    <strong>{parentFormData.guardianName}</strong>
                    <span className="text-[10px] text-[#64748B] block">Comprador: {parentFormData.materialBuyerName || parentFormData.guardianName}</span>
                  </div>
                </div>

                {/* Opção de Pagamento da 1ª Parcela (em até 5x) */}
                <div className="p-2.5 rounded-xl bg-[#FFF0E6]/80 border border-[#FED7AA] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-[#1E293B] flex items-center gap-1.5">
                      <CreditCard size={14} className="text-[#F45206]" />
                      Pagamento da 1ª Parcela (Matrícula):
                    </span>
                    <span className="text-[9.5px] font-black text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                      Até 3x sem juros
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {[1, 2, 3].map((split) => {
                      const firstValNum = typeof enrollment.firstInstallmentValue === 'number'
                        ? enrollment.firstInstallmentValue
                        : parseFloat(String(enrollment.firstInstallmentValue || 2617.52).replace(/\./g, '').replace(',', '.')) || 2617.52;
                      const splitVal = firstValNum / split;
                      const isSelected = (firstInstallmentSplit || 1) === split;

                      return (
                        <button
                          key={split}
                          type="button"
                          onClick={() => setFirstInstallmentSplit(split)}
                          className={`py-1 px-1 rounded-lg text-center border transition-all ${
                            isSelected
                              ? 'bg-[#F45206] text-white border-[#F45206] shadow-2xs font-black'
                              : 'bg-white hover:bg-[#FFF0E6] text-[#1E293B] border-[#FED7AA] font-bold'
                          }`}
                        >
                          <span className="text-[10px] block leading-tight">
                            {split === 1 ? '1x (À vista)' : `${split}x`}
                          </span>
                          <span className={`text-[9px] block leading-tight ${isSelected ? 'text-white font-black' : 'text-[#F45206]'}`}>
                            R$ {splitVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quadro Financeiro Duplo: Anuidade + Material */}
                <div className="p-2 rounded-xl bg-[#FFF0E6] border border-[#FED7AA] text-[11px] grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg border border-[#FED7AA]">
                    <span className="text-[9px] text-[#64748B] block font-bold">ANUIDADE ESCOLAR (BALDER):</span>
                    {(() => {
                      const is100 = enrollment.tuitionDiscountPercentage === 1 || 
                        enrollment.tuitionDiscountPercentage === 1.0 || 
                        enrollment.tuitionDiscountPercentage === 100 || 
                        enrollment.tuitionDiscountTotal === 0 ||
                        /100%/i.test(String(enrollment.tuitionDiscountType || enrollment.tuitionDiscountReason || ''));
                      const displayTuition = is100 ? '0,00' : (
                        enrollment.tuitionDiscountTotal !== undefined && enrollment.tuitionDiscountTotal !== null
                          ? (typeof enrollment.tuitionDiscountTotal === 'number' ? enrollment.tuitionDiscountTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : enrollment.tuitionDiscountTotal)
                          : (typeof enrollment.tuitionGrossTotal === 'number' ? enrollment.tuitionGrossTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : enrollment.tuitionGrossTotal)
                      );
                      return (
                        <>
                          <strong className="text-[12px] text-[#1E293B]">
                            R$ {displayTuition} {is100 ? <span className="text-[#059669] text-[10px] font-bold block">(Bolsa 100%)</span> : null}
                          </strong>
                          <span className="text-[9.5px] text-[#059669] block font-bold">
                            {is100 ? 'Isento' : `${enrollment.installmentsCount} parcelas`}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-[#A7F3D0]">
                    <span className="text-[9px] text-[#059669] block font-bold">MATERIAL DIDÁTICO (PENSADOR):</span>
                    <strong className="text-[12px] text-[#059669]">
                      R$ {(typeof parentFormData.materialTotalValue === 'number' ? parentFormData.materialTotalValue : parseFloat(String(parentFormData.materialTotalValue || 5248.80).replace(/\./g, '').replace(',', '.')) || 5248.80).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                    <span className="text-[9.5px] text-[#475569] block font-semibold">
                      {parentFormData.materialInstallmentsCount} parcelas (dia 10)
                    </span>
                  </div>
                </div>
              </div>

              {/* Cláusulas Condensadas */}
              <div className="text-[9.5px] text-[#475569] leading-tight space-y-1 pt-2 mt-2 border-t border-[#E2E8F0]">
                <p><strong>a)</strong> Declaro acatar as normas do Regimento Escolar desta Instituição para o ano letivo.</p>
                <p><strong>b)</strong> O Requerimento e o Pedido de Material constituem títulos executivos extrajudiciais.</p>
                <p><strong>c)</strong> A assinatura digital única abaixo é aplicada a ambos os documentos legais com hash SHA-256.</p>
              </div>
            </div>

            {/* Coluna Direita: Assinaturas Institucionais + Canvas do Pai */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-2">
              {/* Assinaturas Institucionais */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="p-1.5 bg-white rounded-xl border border-[#CBD5E1] text-center flex flex-col items-center justify-between h-[75px]">
                  <img src={signatureCanela} alt="Balder Educacional" className="h-8 w-auto object-contain mx-auto my-auto" />
                  <span className="text-[7.5px] font-bold text-[#059669] bg-[#ECFDF5] px-1 py-0.2 rounded border border-[#A7F3D0] block w-full truncate">✓ Balder Educacional</span>
                </div>
                <div className="p-1.5 bg-white rounded-xl border border-[#CBD5E1] text-center flex flex-col items-center justify-between h-[75px]">
                  <img src={signatureElisangela} alt="Testemunha" className="h-8 w-auto object-contain mx-auto my-auto" />
                  <span className="text-[7.5px] font-bold text-[#059669] bg-[#ECFDF5] px-1 py-0.2 rounded border border-[#A7F3D0] block w-full truncate">✓ Testemunha Oficial</span>
                </div>
              </div>

              {/* Assinatura Digital do Responsável/Comprador (Canvas Interativo) */}
              <div className="p-2.5 bg-[#FFF0E6] rounded-2xl border-2 border-[#F45206] text-center space-y-1.5 shadow-xs flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px] font-black text-[#1E293B]">
                  <span>ASSINATURA DIGITAL DO RESPONSÁVEL / COMPRADOR</span>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[9.5px] text-[#EF4444] font-bold hover:underline"
                  >
                    Limpar
                  </button>
                </div>

                <div className="relative flex-1 flex items-center justify-center min-h-[120px]">
                  <canvas
                    ref={canvasRef}
                    width={640}
                    height={300}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="bg-white rounded-xl border border-[#FED7AA] cursor-crosshair w-full h-full min-h-[120px] touch-none shadow-inner"
                  />
                  {!hasAcceptedContract ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[10.5px] text-[#C2410C] font-bold bg-[#FFF7ED]/95 rounded-xl pointer-events-auto cursor-not-allowed text-center p-3 gap-1 border border-[#FDBA74]">
                      <span className="text-[13px]">🔒 Assinatura Bloqueada</span>
                      <span>Role os termos até o final e marque a caixa de aceite para assinar.</span>
                    </div>
                  ) : !hasParentSignature ? (
                    <span className="absolute inset-0 flex items-center justify-center text-[10.5px] text-[#94A3B8] font-bold pointer-events-none">
                      ✍ Desenhe sua assinatura digital aqui
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                  <strong className="text-[#1E293B] truncate">{parentFormData.guardianName}</strong>
                  <span className="font-bold text-[#059669]">
                    {hasParentSignature ? '✓ Assinatura Pronta' : 'Aguardando Assinatura'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ações Finais */}
          <div className="flex items-center gap-3 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setParentStep(3)}
              className="btn-secondary-rodin !py-3 !px-5 text-[12px] flex items-center justify-center gap-1.5 font-bold"
            >
              <ArrowLeft size={14} /> Voltar para Pedido de Material
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !hasParentSignature || !hasAcceptedContract}
              className="btn-primary-rodin !py-3 !px-6 text-[12.5px] shadow-lg flex-1 flex items-center justify-center gap-2 font-black disabled:opacity-50"
            >
              <FileSignature size={16} />
              {isSubmitting ? 'Criptografando Documentos...' : `Finalizar Matrícula & Pedido de Material ${enrollment.academicYear || 2027}`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
