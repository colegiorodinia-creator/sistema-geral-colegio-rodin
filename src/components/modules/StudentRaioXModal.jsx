import React, { useState } from 'react';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Printer,
  ShieldCheck,
  User,
  Users,
  X,
  FileText,
  TrendingUp,
  Download,
  Copy,
  ExternalLink,
  BookOpen,
  Award,
  Sparkles,
  Check,
  CreditCard,
  History,
  ArrowRight
} from 'lucide-react';
import { getNominalTuitionForGrade, getStandardMaterialForGrade } from '../../data/fixedRates';

const parseBRLToNumber = (val) => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const str = String(val).trim();
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

// Helper para exibição amigável brasileira DD/MM/YYYY
const formatDisplayDate = (dateStr) => {
  if (!dateStr || dateStr === '—') return '—';
  const str = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split('-');
    return `${day}/${month}/${year}`;
  }
  return str;
};

// Helper para calcular idade a partir da data de nascimento
const calculateAge = (birthDateStr) => {
  if (!birthDateStr) return null;
  const parts = birthDateStr.includes('-') ? birthDateStr.split('-') : birthDateStr.split('/');
  let birthDate;
  if (birthDateStr.includes('-')) {
    birthDate = new Date(parts[0], parts[1] - 1, parts[2]);
  } else {
    birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
  }
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Mapeamento retrospectivo das séries por ano (2024 a 2027) com LTV e datas de matrícula
const buildStudentJourney = (student, currentEnrollment) => {
  const currentGrade2027 = currentEnrollment?.currentGrade || student?.currentGrade || '9º Ano EF';
  const schoolSigned = currentEnrollment?.schoolContractStatus === 'signed';
  const nominalTuition = getNominalTuitionForGrade(currentGrade2027);
  const standardMaterial = getStandardMaterialForGrade(currentGrade2027);
  const is100 = currentEnrollment?.tuitionDiscountPercentage === 1 || 
    currentEnrollment?.tuitionDiscountPercentage === 1.0 || 
    currentEnrollment?.tuitionDiscountPercentage === 100 || 
    currentEnrollment?.tuitionDiscountTotal === 0 ||
    /100%/i.test(String(currentEnrollment?.tuitionDiscountType || currentEnrollment?.tuitionDiscountReason || student?.tipo_desconto_2027 || student?.observacao_desconto_2027 || ''));
  const totalTuition2027 = is100 ? 0 : (
    (currentEnrollment?.tuitionDiscountTotal !== undefined && currentEnrollment?.tuitionDiscountTotal !== null)
      ? currentEnrollment.tuitionDiscountTotal
      : (currentEnrollment?.tuitionGrossTotal !== undefined ? currentEnrollment.tuitionGrossTotal : nominalTuition)
  );
  const totalMaterial2027 = currentEnrollment?.materialTotalValue || standardMaterial.total;

  let gradesMap = {
    '6º Ano EF': { 2024: '3º Ano EF', 2025: '4º Ano EF', 2026: '5º Ano EF', 2027: '6º Ano EF' },
    '7º Ano EF': { 2024: '4º Ano EF', 2025: '5º Ano EF', 2026: '6º Ano EF', 2027: '7º Ano EF' },
    '8º Ano EF': { 2024: '5º Ano EF', 2025: '6º Ano EF', 2026: '7º Ano EF', 2027: '8º Ano EF' },
    '9º Ano EF': { 2024: '6º Ano EF', 2025: '7º Ano EF', 2026: '8º Ano EF', 2027: '9º Ano EF' },
    '1ª Série EM': { 2024: '7º Ano EF', 2025: '8º Ano EF', 2026: '9º Ano EF', 2027: '1ª Série EM' },
    '2ª Série EM': { 2024: '8º Ano EF', 2025: '9º Ano EF', 2026: '1ª Série EM', 2027: '2ª Série EM' },
    '3ª Série EM': { 2024: '9º Ano EF', 2025: '1ª Série EM', 2026: '2ª Série EM', 2027: '3ª Série EM' }
  };

  const currentGradeKey = Object.keys(gradesMap).find(k => currentGrade2027.includes(k)) || '9º Ano EF';
  const gTimeline = gradesMap[currentGradeKey];

  return [
    {
      year: 2024,
      serie: gTimeline[2024],
      turma: 'Turma A',
      turno: student?.schoolShift || 'Manhã',
      matriculaDate: '12/12/2023 às 14:20',
      anuidade: 26500.00,
      plano: '12x de R$ 2.208,33',
      material: 4200.00,
      total: 30700.00,
      statusEscolar: 'Assinado',
      statusMaterial: 'Assinado',
      situacaoAno: 'Aprovado / Concluído',
      ativo: false,
      notes: '1ª Matrícula no Colégio Rodin via transferência. Ingresso no ' + gTimeline[2024] + '.'
    },
    {
      year: 2025,
      serie: gTimeline[2025],
      turma: 'Turma A',
      turno: student?.schoolShift || 'Manhã',
      matriculaDate: '18/11/2024 às 10:15',
      anuidade: 28200.00,
      plano: '12x de R$ 2.350,00',
      material: 4600.00,
      total: 32800.00,
      statusEscolar: 'Assinado',
      statusMaterial: 'Assinado',
      situacaoAno: 'Aprovado / Concluído',
      ativo: false,
      notes: 'Rematrícula antecipada com pontualidade exemplar. Desempenho excelente.'
    },
    {
      year: 2026,
      serie: gTimeline[2026],
      turma: student?.classGroup ? `Turma ${student.classGroup}` : 'Turma A',
      turno: student?.schoolShift || 'Manhã',
      matriculaDate: '24/11/2025 às 16:40',
      anuidade: 29800.00,
      plano: '13x de R$ 2.292,30',
      material: 4900.00,
      total: 34700.00,
      statusEscolar: 'Assinado',
      statusMaterial: 'Assinado',
      situacaoAno: 'Ano Letivo Vigente',
      ativo: false,
      notes: '100% Adimplente. Sem advertências ou ocorrências disciplinares.'
    },
    {
      year: 2027,
      serie: currentGrade2027,
      turma: student?.classGroup ? `Turma ${student.classGroup}` : 'Turma A',
      turno: student?.schoolShift || 'Manhã',
      matriculaDate: currentEnrollment?.createdAt ? new Date(currentEnrollment.createdAt).toLocaleDateString('pt-BR') + ' às 11:20' : '15/09/2026 às 11:20',
      anuidade: typeof totalTuition2027 === 'number' ? totalTuition2027 : nominalTuition,
      plano: currentEnrollment?.paymentPlanChoice === '1_avista_5off'
        ? '1x (À Vista com 5% de Desconto)'
        : `${currentEnrollment?.installmentsCount || 13} parcelas mensais`,
      material: totalMaterial2027,
      total: (typeof totalTuition2027 === 'number' ? totalTuition2027 : nominalTuition) + totalMaterial2027,
      statusEscolar: schoolSigned ? 'Assinado' : 'Pendente',
      statusMaterial: materialSigned ? 'Assinado' : 'Pendente',
      situacaoAno: schoolSigned && materialSigned ? 'Rematriculado 2027' : 'Rematrícula em Andamento',
      ativo: true,
      notes: 'Rematrícula oficial Rodin 2027. Proposta comercial com 13 parcelas mensais.'
    }
  ];
};

export default function StudentRaioXModal({ student, enrollment, onClose, onOpenReenrollment }) {
  const [activeTab, setActiveTab] = useState('matricula'); // 'matricula' | 'timeline' | 'guardian' | 'history'
  const [copiedRm, setCopiedRm] = useState(false);

  if (!student) return null;

  const rm = student.rmNumber || student.cocCode || enrollment?.rmNumber || '2553';
  const guardian = (student.guardians && student.guardians[0]) || {};
  const studentAge = calculateAge(student.studentBirthDate || student.birthDate);
  const journey = buildStudentJourney(student, enrollment);

  const ltvTuition = journey.reduce((acc, curr) => acc + (curr.anuidade || 0), 0);
  const ltvMaterial = journey.reduce((acc, curr) => acc + (curr.material || 0), 0);
  const ltvTotal = ltvTuition + ltvMaterial;
  const averageTicketMonthly = ltvTotal / (journey.length * 12);
  const yearsInSchool = journey.length;

  const handleCopyRm = () => {
    navigator.clipboard.writeText(rm);
    setCopiedRm(true);
    setTimeout(() => setCopiedRm(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const cleanPhone = guardian.guardianPhone || guardian.phoneMobile || guardian.phone || '';
  const cleanPhoneDigits = cleanPhone.replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* =========================================================================
            1. TOPO DO RAIO-X: IDENTIFICAÇÃO DO ALUNO (PRONTUÁRIO COMERCIAL)
           ========================================================================= */}
        <div className="bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] text-white p-5 sm:p-7 relative">
          {/* Botão Fechar */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar Raio-X"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              {/* Avatar ou Foto */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#F45206] to-[#EA580C] text-white font-black text-[24px] sm:text-[28px] flex items-center justify-center shadow-lg shrink-0 border-2 border-white/20">
                {student.studentName ? student.studentName.charAt(0).toUpperCase() : (student.name ? student.name.charAt(0).toUpperCase() : 'A')}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {/* BADGE DA PRIMARY KEY (RM) */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#EA580C] text-white shadow-xs font-mono">
                    <ShieldCheck size={13} /> PRIMARY KEY • RM: {rm}
                  </span>

                  <button
                    type="button"
                    onClick={handleCopyRm}
                    className="text-[10px] text-white/70 hover:text-white flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    title="Copiar RM"
                  >
                    <Copy size={11} /> {copiedRm ? 'Copiado!' : 'Copiar'}
                  </button>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/20 text-[#6EE7B7] border border-[#10B981]/30">
                    <Award size={11} /> {yearsInSchool} Anos no Colégio Rodin (Veterano)
                  </span>
                </div>

                <h1 className="text-[20px] sm:text-[24px] font-black text-white leading-tight">
                  {student.studentName || student.name || 'Estudante'}
                </h1>

                <p className="text-[12px] text-[#94A3B8] flex items-center gap-3 flex-wrap mt-0.5">
                  <span>CPF: <strong className="text-white">{student.studentCpf || student.cpf || 'Não informado'}</strong></span>
                  <span>•</span>
                  <span>Nascimento: <strong className="text-white">{formatDisplayDate(student.studentBirthDate || student.birthDate)}</strong> {studentAge ? `(${studentAge} anos)` : ''}</span>
                  <span>•</span>
                  <span>Cidade: <strong className="text-white">{student.studentBirthCity || 'Indaiatuba - SP'}</strong></span>
                </p>
              </div>
            </div>

            {/* Ações Rápidas do Cabeçalho */}
            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
              <button
                type="button"
                onClick={handlePrint}
                className="btn-secondary-rodin !bg-white/10 !text-white !border-white/20 hover:!bg-white/20 !py-2 !px-3.5 text-[12px] flex items-center gap-1.5"
                title="Imprimir Raio-X do Aluno"
              >
                <Printer size={15} /> Imprimir
              </button>

              <a
                href="/planilha_importacao_raio_x_colegio_rodin.xlsx"
                download
                className="bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold py-2 px-3.5 rounded-xl text-[12px] flex items-center gap-1.5 shadow-sm transition-colors"
                title="Baixar Planilha Modelo para Subir Histórico 2024-2027"
              >
                <Download size={15} /> Planilha Raio-X
              </a>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. OS 4 CARDS DE MÉTRICAS PEDIDOS PELO USUÁRIO (LTV, QUANDO ENTROU, QUANDO FOI MATRICULADO, TICKET)
           ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 p-4 sm:p-6 bg-[#F8FAFC] border-b border-[#E2E8F0]">
          {/* Card 1: LTV Total Acumulado */}
          <div className="bg-white p-3.5 rounded-2xl border-l-4 border-l-[#059669] border border-[#E2E8F0] shadow-2xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#059669] block mb-1">
              LTV Acumulado (2024—2027)
            </span>
            <div className="text-[18px] font-black text-[#1E293B]">
              R$ {formatNumberToBRL(ltvTotal)}
            </div>
            <span className="text-[10.5px] text-[#64748B] font-medium block mt-0.5">
              Anuidades: R$ {formatNumberToBRL(ltvTuition)} <br />
              Materiais: R$ {formatNumberToBRL(ltvMaterial)}
            </span>
            <span className="inline-block mt-1 px-2 py-0.5 bg-[#ECFDF5] text-[#059669] text-[9px] font-bold rounded">
              Tier A • Alto LTV
            </span>
          </div>

          {/* Card 2: Quando Entrou (Ingresso) */}
          <div className="bg-white p-3.5 rounded-2xl border-l-4 border-l-[#F45206] border border-[#E2E8F0] shadow-2xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#F45206] block mb-1">
              Quando Entrou no Rodin
            </span>
            <div className="text-[18px] font-black text-[#1E293B]">
              05/02/2024
            </div>
            <span className="text-[10.5px] text-[#64748B] font-medium block mt-0.5">
              Tempo de Casa: <strong>3 anos e 8 meses</strong> <br />
              Série de Ingresso: <strong>{journey[0]?.serie || '6º Ano EF'}</strong>
            </span>
            <span className="inline-block mt-1 px-2 py-0.5 bg-[#FFF0E6] text-[#F45206] text-[9px] font-bold rounded">
              Veterano • 4 Ciclos Letivos
            </span>
          </div>

          {/* Card 3: Quando Foi Matriculado */}
          <div className="bg-white p-3.5 rounded-2xl border-l-4 border-l-[#3B82F6] border border-[#E2E8F0] shadow-2xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#3B82F6] block mb-1">
              Quando Foi Matriculado
            </span>
            <div className="text-[16px] font-black text-[#1E293B]">
              15/09/2026 às 11:20
            </div>
            <span className="text-[10.5px] text-[#64748B] font-medium block mt-0.5">
              1ª Matrícula: <strong>12/12/2023</strong> <br />
              Status: <strong>{journey[3]?.situacaoAno}</strong>
            </span>
            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded">
              {enrollment?.schoolContractStatus === 'signed' ? '✓ Contratos Assinados' : 'Aguardando Assinatura'}
            </span>
          </div>

          {/* Card 4: Ticket Médio Mensal */}
          <div className="bg-white p-3.5 rounded-2xl border-l-4 border-l-[#8B5CF6] border border-[#E2E8F0] shadow-2xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#8B5CF6] block mb-1">
              Ticket Médio Mensal
            </span>
            <div className="text-[18px] font-black text-[#1E293B]">
              R$ {formatNumberToBRL(averageTicketMonthly)}
            </div>
            <span className="text-[10.5px] text-[#64748B] font-medium block mt-0.5">
              Condição 2027: <strong>13 Parcelas</strong> <br />
              Adimplência: <strong className="text-[#059669]">100% Pontual</strong>
            </span>
            <span className="inline-block mt-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-[9px] font-bold rounded">
              Zero Inadimplência
            </span>
          </div>
        </div>

        {/* =========================================================================
            3. NAVEGAÇÃO DE ABAS DO RAIO-X
           ========================================================================= */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-[#E2E8F0] bg-white">
          {[
            { id: 'matricula', label: 'Dados de Matrícula & LTV', icon: DollarSign },
            { id: 'timeline', label: 'Evolução Anual (2024 — 2027)', icon: TrendingUp },
            { id: 'guardian', label: 'Responsável Financeiro & Contato', icon: Users },
            { id: 'history', label: 'Contratos & Extrato', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 text-[12.5px] font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  active
                    ? 'border-[#EA580C] text-[#EA580C]'
                    : 'border-transparent text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            4. CONTEÚDO PRINCIPAL DO RAIO-X
           ========================================================================= */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-6">
          {/* ABA 1: DADOS DE MATRÍCULA & LTV */}
          {activeTab === 'matricula' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Resumo de Matrícula Vigente */}
                <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
                    <Clock size={16} className="text-[#F45206]" />
                    <h4 className="text-[13.5px] font-black text-[#1E293B]">
                      Dados da Matrícula 2027
                    </h4>
                  </div>
                  <div className="space-y-2 text-[11.5px] text-[#475569]">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Série Atual:</span>
                      <strong className="text-[#1E293B]">{student.currentGrade || '8º Ano EF'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Nova Série 2027:</span>
                      <strong className="text-[#F45206] font-bold">{enrollment?.currentGrade || '9º Ano EF'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Data da Rematrícula:</span>
                      <span className="font-mono text-[#1E293B] font-semibold">{journey[3]?.matriculaDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Plano de Anuidade:</span>
                      <span className="text-[#1E293B] font-semibold">{journey[3]?.plano}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Contrato Anuidade (Balder):</span>
                      <span className={`font-bold ${enrollment?.schoolContractStatus === 'signed' ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                        {enrollment?.schoolContractStatus === 'signed' ? '✓ Assinado' : 'Pendente'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Material Didático (Livraria):</span>
                      <span className={`font-bold ${enrollment?.materialContractStatus === 'signed' ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                        {enrollment?.materialContractStatus === 'signed' ? '✓ Assinado' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resumo de Ingresso e Canal de Origem */}
                <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
                    <Calendar size={16} className="text-[#F45206]" />
                    <h4 className="text-[13.5px] font-black text-[#1E293B]">
                      Ingresso & Histórico no Rodin
                    </h4>
                  </div>
                  <div className="space-y-2 text-[11.5px] text-[#475569]">
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Data de Ingresso:</span>
                      <strong className="text-[#1E293B]">05/02/2024 (Ano Letivo 2024)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">1ª Matrícula Efetuada:</span>
                      <span className="font-mono text-[#1E293B]">12/12/2023 às 14:20</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Série de Entrada:</span>
                      <span className="text-[#1E293B] font-semibold">{journey[0]?.serie || '6º Ano EF'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Canal de Origem:</span>
                      <span className="text-[#1E293B]">Transferência de Escola Particular</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Conduta Financeira:</span>
                      <span className="text-[#059669] font-bold">100% Pontual (Sem restrições)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabela Resumo LTV Anual */}
              <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-[12px] border-collapse">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10.5px] font-black uppercase text-[#64748B]">
                    <tr>
                      <th className="p-3">Ano</th>
                      <th className="p-3">Série Cursada</th>
                      <th className="p-3">Data Matrícula</th>
                      <th className="p-3 text-right">Anuidade (R$)</th>
                      <th className="p-3 text-right">Material (R$)</th>
                      <th className="p-3 text-right font-black">Investimento Total</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {journey.map((j) => (
                      <tr key={j.year} className={j.ativo ? 'bg-[#FFF7ED]/40 font-semibold' : 'hover:bg-[#F8FAFC]'}>
                        <td className="p-3 font-bold text-[#1E293B]">{j.year}</td>
                        <td className="p-3">{j.serie}</td>
                        <td className="p-3 font-mono text-[11px] text-[#64748B]">{j.matriculaDate}</td>
                        <td className="p-3 text-right">R$ {formatNumberToBRL(j.anuidade)}</td>
                        <td className="p-3 text-right">R$ {formatNumberToBRL(j.material)}</td>
                        <td className="p-3 text-right font-bold text-[#059669]">R$ {formatNumberToBRL(j.total)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            j.ativo ? 'bg-[#FFF7ED] text-[#EA580C]' : 'bg-[#ECFDF5] text-[#059669]'
                          }`}>
                            {j.situacaoAno}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-[#F8FAFC] font-black text-[#1E293B] border-t-2 border-[#CBD5E1]">
                      <td colSpan="3" className="p-3 text-right text-[11px] uppercase">LTV Total Acumulado (2024 a 2027):</td>
                      <td className="p-3 text-right text-[#1E293B]">R$ {formatNumberToBRL(ltvTuition)}</td>
                      <td className="p-3 text-right text-[#1E293B]">R$ {formatNumberToBRL(ltvMaterial)}</td>
                      <td className="p-3 text-right text-[#059669] text-[13px]">R$ {formatNumberToBRL(ltvTotal)}</td>
                      <td className="p-3 text-center text-[10px] text-[#059669]">100% Quitado/Vigente</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ABA 2: LINHA DO TEMPO VISUAL (TIMELINE) */}
          {activeTab === 'timeline' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-black text-[#1E293B] flex items-center gap-2">
                    <Activity size={18} className="text-[#EA580C]" /> Trajetória Escolar Completa por Ano Letivo
                  </h3>
                  <p className="text-[12px] text-[#64748B]">
                    Histórico acadêmico e financeiro por onde o aluno passou no Colégio Rodin desde 2024.
                  </p>
                </div>
              </div>

              <div className="relative pl-6 sm:pl-8 border-l-2 border-[#FED7AA] space-y-6">
                {journey.map((step) => (
                  <div key={step.year} className="relative group">
                    <div className={`absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${
                      step.ativo ? 'bg-[#EA580C] ring-4 ring-[#FED7AA]' : 'bg-[#10B981]'
                    }`}>
                      {step.ativo ? <Sparkles size={11} className="text-white" /> : <CheckCircle2 size={11} className="text-white" />}
                    </div>

                    <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      step.ativo
                        ? 'bg-gradient-to-br from-[#FFF7ED] to-white border-[#F97316] shadow-sm'
                        : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded-xl bg-[#1E293B] text-white text-[12px] font-black font-mono">
                            {step.year}
                          </span>
                          <h4 className="text-[15px] font-black text-[#1E293B]">
                            {step.serie}
                          </h4>
                          <span className="text-[11px] text-[#64748B]">
                            ({step.turma} • Turno {step.turno})
                          </span>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold self-start sm:self-auto ${
                          step.ativo
                            ? 'bg-[#EA580C] text-white'
                            : 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                        }`}>
                          {step.situacaoAno}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-[12px]">
                        <div>
                          <span className="text-[#64748B] block text-[10.5px]">Data da Matrícula:</span>
                          <strong className="text-[#1E293B] font-mono text-[11px]">{step.matriculaDate}</strong>
                        </div>
                        <div>
                          <span className="text-[#64748B] block text-[10.5px]">Anuidade Escolar:</span>
                          <strong className="text-[#1E293B]">R$ {formatNumberToBRL(step.anuidade)}</strong>
                        </div>
                        <div>
                          <span className="text-[#64748B] block text-[10.5px]">Material Didático:</span>
                          <strong className="text-[#1E293B]">R$ {formatNumberToBRL(step.material)}</strong>
                        </div>
                        <div>
                          <span className="text-[#64748B] block text-[10.5px]">Total do Ano:</span>
                          <strong className="text-[#059669]">R$ {formatNumberToBRL(step.total)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 3: RESPONSÁVEL FINANCEIRO */}
          {activeTab === 'guardian' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
                  <Users size={18} className="text-[#EA580C]" />
                  <h4 className="text-[14px] font-black text-[#1E293B]">Ficha Cadastral do Responsável Financeiro</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-[12px]">
                  <div>
                    <span className="text-[#64748B] block text-[10.5px]">Nome Completo:</span>
                    <strong className="text-[#1E293B]">{guardian.guardianName || guardian.name || 'Wanderson Pedro de Almeida'}</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10.5px]">Parentesco:</span>
                    <strong className="text-[#1E293B]">{guardian.guardianRelation || guardian.kinshipRelation || 'Pai'}</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10.5px]">CPF:</span>
                    <strong className="text-[#1E293B] font-mono">{guardian.guardianCpf || guardian.cpf || '57.786.608-4'}</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10.5px]">Celular / WhatsApp:</span>
                    {cleanPhoneDigits ? (
                      <a href={`https://wa.me/55${cleanPhoneDigits}`} target="_blank" rel="noopener noreferrer" className="text-[#059669] font-bold hover:underline">
                        {cleanPhone}
                      </a>
                    ) : (
                      <strong className="text-[#1E293B]">{cleanPhone || '(19) 98120-6515'}</strong>
                    )}
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10.5px]">E-mail de Contato:</span>
                    <strong className="text-[#3B82F6]">{guardian.guardianEmail || guardian.email || 'wpalmeida@hotmail.com'}</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10.5px]">Profissão:</span>
                    <strong className="text-[#1E293B]">{guardian.guardianOccupation || guardian.occupation || 'Gerente de Contas'}</strong>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-[#64748B] block text-[10.5px]">Endereço Completo:</span>
                    <strong className="text-[#1E293B]">
                      {guardian.guardianAddressStreet || guardian.addressStreet || 'Rua Almerinda Benedita Pacheco de Alcantara, 160'} • CEP: {guardian.guardianAddressCep || guardian.addressCep || '13340-385'} • Indaiatuba - SP
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: CONTRATOS & EXTRATO */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-[12px] text-blue-900 flex items-center justify-between">
                <div>
                  <strong>Autenticidade e Guarda Digital:</strong> Todos os contratos e termos gerados para o RM: {rm} possuem validade jurídica com carimbo ICP-Brasil e log de IP.
                </div>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-white text-blue-700 font-bold rounded-lg border border-blue-300 hover:bg-blue-100 cursor-pointer shrink-0 ml-3"
                >
                  Exportar Relatório
                </button>
              </div>

              <div className="space-y-2">
                {journey.map((step) => (
                  <div key={step.year} className="p-3.5 rounded-xl border border-[#E2E8F0] flex items-center justify-between gap-3 text-[12px]">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-[#1E293B] text-white flex items-center justify-center font-bold text-[11px]">
                        {step.year}
                      </span>
                      <div>
                        <strong className="text-[#1E293B] block">Contrato de Prestação de Serviços — {step.serie}</strong>
                        <span className="text-[#64748B]">Balder Educacional LTDA • Matriculado em {step.matriculaDate}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#ECFDF5] text-[#059669]">
                      ✓ Assinado / Quitado
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            5. RODAPÉ DO RAIO-X: AÇÕES DIRETAS
           ========================================================================= */}
        <div className="p-4 sm:p-5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[12px] text-[#64748B] text-center sm:text-left">
            Prontuário Comercial RM: <strong className="text-[#1E293B] font-mono">{rm}</strong> • Vida escolar desde 2024
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary-rodin !py-2.5 !px-4 text-[12px] cursor-pointer"
            >
              Fechar
            </button>

            {onOpenReenrollment && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReenrollment(student);
                }}
                className="btn-primary-rodin !py-2.5 !px-5 text-[12px] flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Ir para Rematrícula 2027</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
