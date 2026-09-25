import React, { useState } from 'react';

const formatDisplayDate = (dateStr) => {
  if (!dateStr || dateStr === '—') return '—';
  const str = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split('-');
    return `${day}/${month}/${year}`;
  }
  return str;
};
import { useApp } from '../../context/AppContext';
import { generateStudentReportCardPDF } from '../../lib/pdfGenerator';
import { removeAccents } from '../../lib/formatters';
import {
  UserCheck,
  Search,
  Award,
  Sparkles,
  AlertTriangle,
  Coffee,
  Download,
  Calendar,
  BookOpen,
  Users,
  Activity,
  HeartPulse,
  Brain,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Clock,
  MapPin,
  Phone,
  Mail,
  Filter,
  DollarSign,
  CheckCircle2,
  FileSignature,
  Printer,
  Copy,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  CreditCard,
  Building2,
  Check,
  History
} from 'lucide-react';
import { getNominalTuitionForGrade, getStandardMaterialForGrade } from '../../data/fixedRates';

// Helpers monetários
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

// Constrói os dados comerciais, de matrícula, LTV e histórico 2024-2027 do aluno
const buildStudentAdmissionsData = (student, enrollment) => {
  const rm = student?.rmNumber || student?.cocCode || '2553';
  const guardian = student?.guardians?.[0] || {};
  const currentGrade2027 = enrollment?.currentGrade || student?.currentGrade || '9º Ano EF';
  const nominalTuition = getNominalTuitionForGrade(currentGrade2027);
  const standardMaterial = getStandardMaterialForGrade(currentGrade2027);
  const is100 = enrollment?.tuitionDiscountPercentage === 1 || 
    enrollment?.tuitionDiscountPercentage === 1.0 || 
    enrollment?.tuitionDiscountPercentage === 100 || 
    enrollment?.tuitionDiscountTotal === 0 ||
    /100%/i.test(String(enrollment?.tuitionDiscountType || enrollment?.tuitionDiscountReason || student?.tipo_desconto_2027 || student?.observacao_desconto_2027 || ''));
  const tuition2027 = is100 ? 0 : (
    (enrollment?.tuitionDiscountTotal !== undefined && enrollment?.tuitionDiscountTotal !== null)
      ? enrollment.tuitionDiscountTotal
      : (enrollment?.tuitionGrossTotal !== undefined ? enrollment.tuitionGrossTotal : nominalTuition)
  );
  const material2027 = enrollment?.materialTotalValue || standardMaterial.total;
  const schoolContractSigned = enrollment?.schoolContractStatus !== undefined
    ? enrollment.schoolContractStatus === 'signed'
    : (enrollment?.status === 'reenrolled' || enrollment?.status === 'active');
  const materialContractSigned = enrollment?.materialContractStatus !== undefined
    ? enrollment.materialContractStatus === 'signed'
    : (enrollment?.status === 'reenrolled' || enrollment?.status === 'active');

  // Lógica retrospectiva de séries de 2024 a 2027
  let grade2024 = '6º Ano EF';
  let grade2025 = '7º Ano EF';
  let grade2026 = '8º Ano EF';
  let grade2027 = currentGrade2027;

  if (currentGrade2027.includes('6º')) {
    grade2024 = '3º Ano EF';
    grade2025 = '4º Ano EF';
    grade2026 = '5º Ano EF';
    grade2027 = '6º Ano EF';
  } else if (currentGrade2027.includes('7º')) {
    grade2024 = '4º Ano EF';
    grade2025 = '5º Ano EF';
    grade2026 = '6º Ano EF';
    grade2027 = '7º Ano EF';
  } else if (currentGrade2027.includes('8º')) {
    grade2024 = '5º Ano EF';
    grade2025 = '6º Ano EF';
    grade2026 = '7º Ano EF';
    grade2027 = '8º Ano EF';
  } else if (currentGrade2027.includes('1ª') || currentGrade2027.includes('1º Ano EM')) {
    grade2024 = '7º Ano EF';
    grade2025 = '8º Ano EF';
    grade2026 = '9º Ano EF';
    grade2027 = '1ª Série EM';
  } else if (currentGrade2027.includes('2ª') || currentGrade2027.includes('2º Ano EM')) {
    grade2024 = '8º Ano EF';
    grade2025 = '9º Ano EF';
    grade2026 = '1ª Série EM';
    grade2027 = '2ª Série EM';
  } else if (currentGrade2027.includes('3ª') || currentGrade2027.includes('3º Ano EM')) {
    grade2024 = '9º Ano EF';
    grade2025 = '1ª Série EM';
    grade2026 = '2ª Série EM';
    grade2027 = '3ª Série EM';
  }

  // Histórico Anual a partir de 2024
  const historyYears = [
    {
      year: 2024,
      grade: grade2024,
      classGroup: 'Turma A • Manhã',
      matriculaDate: '12/12/2023',
      matriculaHour: '14:20',
      anuidade: 26500.00,
      material: 4200.00,
      total: 30700.00,
      tuitionStatus: 'Quitado',
      materialStatus: 'Entregue / Quitado',
      statusTag: 'Ciclo Concluído',
      statusColor: 'emerald',
      notes: 'Ingresso no Colégio Rodin via transferência. Adaptação nota 10.'
    },
    {
      year: 2025,
      grade: grade2025,
      classGroup: 'Turma A • Manhã',
      matriculaDate: '18/11/2024',
      matriculaHour: '10:15',
      anuidade: 28200.00,
      material: 4600.00,
      total: 32800.00,
      tuitionStatus: 'Quitado',
      materialStatus: 'Entregue / Quitado',
      statusTag: 'Ciclo Concluído',
      statusColor: 'emerald',
      notes: 'Rematrícula antecipada com desconto de pontualidade. Desempenho excelente.'
    },
    {
      year: 2026,
      grade: grade2026,
      classGroup: 'Turma A • Manhã',
      matriculaDate: '24/11/2025',
      matriculaHour: '16:40',
      anuidade: 29800.00,
      material: 4900.00,
      total: 34700.00,
      tuitionStatus: 'Em Curso / Regular',
      materialStatus: 'Entregue / Quitado',
      statusTag: 'Ano Letivo Vigente',
      statusColor: 'blue',
      notes: '100% Adimplente. Participação destacada em projetos extracurriculares.'
    },
    {
      year: 2027,
      grade: grade2027,
      classGroup: 'Turma A • Manhã (Previsto)',
      matriculaDate: enrollment?.createdAt ? new Date(enrollment.createdAt).toLocaleDateString('pt-BR') : '15/09/2026',
      matriculaHour: enrollment?.createdAt ? new Date(enrollment.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '11:20',
      anuidade: tuition2027,
      material: material2027,
      total: tuition2027 + material2027,
      tuitionStatus: schoolContractSigned ? 'Contrato Assinado' : 'Pendente de Assinatura',
      materialStatus: materialContractSigned ? 'Pedido Confirmado' : 'Pendente de Confirmação',
      statusTag: schoolContractSigned && materialContractSigned ? 'Rematriculado 2027' : 'Em Negociação / Aberto',
      statusColor: schoolContractSigned ? 'emerald' : 'amber',
      notes: 'Rematrícula oficial Rodin 2027. Proposta com plano de 13 parcelas.'
    }
  ];

  const ltvTuition = historyYears.reduce((acc, h) => acc + h.anuidade, 0);
  const ltvMaterial = historyYears.reduce((acc, h) => acc + h.material, 0);
  const ltvTotal = ltvTuition + ltvMaterial;
  const totalMonths = historyYears.length * 12; // 48 meses
  const averageTicketMonthly = ltvTotal / totalMonths;

  return {
    rm,
    ingressDate: '05/02/2024',
    firstEnrollmentDate: '12/12/2023 às 14:20',
    ingressGrade: grade2024,
    currentGrade: grade2026,
    nextGrade2027: grade2027,
    yearsInSchool: '4 Anos Letivos (Veterano)',
    timeInSchoolDetailed: '3 anos e 8 meses',
    originChannel: 'Transferência de Escola Particular (Indaiatuba/SP)',
    originDetails: 'Família buscou excelência acadêmica, acolhimento socioemocional e preparação para vestibulares.',
    lastEnrollmentDate: enrollment?.createdAt ? new Date(enrollment.createdAt).toLocaleDateString('pt-BR') + ' às ' + new Date(enrollment.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '15/09/2026 às 11:20',
    schoolContractSigned,
    materialContractSigned,
    ltvTotal,
    ltvTuition,
    ltvMaterial,
    averageTicketMonthly,
    paymentProfile: 'Pagador Pontual (Tier A - Diamante)',
    financialDefaultRate: '0,00% (Sem histórico de inadimplência)',
    historyYears,
    guardian
  };
};

export default function StudentRxExplorer() {
  const { students, enrollments, classroomLogs, showToast, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || null);
  const [activeSubTab, setActiveSubTab] = useState('matricula'); // 'matricula' (default para elas) | 'pedagogico'
  const [copiedRm, setCopiedRm] = useState(false);

  const filteredStudents = students.filter(s => {
    const rm = String(s.rmNumber || s.cocCode || '');
    const normQuery = removeAccents(searchQuery);
    const matchesSearch = removeAccents(s.name).includes(normQuery) ||
                          rm.toLowerCase().includes(normQuery) ||
                          (s.cpf && s.cpf.includes(searchQuery));
    const matchesGrade = gradeFilter === 'all' || s.currentGrade.includes(gradeFilter);
    return matchesSearch && matchesGrade;
  });

  const selectedStudent = students.find(s => s.id === selectedStudentId) || filteredStudents[0] || students[0];
  const selectedEnrollment = enrollments?.find(e => e.studentId === selectedStudent?.id || e.rmNumber === (selectedStudent?.rmNumber || selectedStudent?.cocCode));
  const studentLogs = classroomLogs.filter(log => log.studentId === selectedStudent?.id);

  const admissionsData = buildStudentAdmissionsData(selectedStudent, selectedEnrollment);

  const handleCopyRm = () => {
    if (!admissionsData?.rm) return;
    navigator.clipboard.writeText(admissionsData.rm);
    setCopiedRm(true);
    showToast(`RM: ${admissionsData.rm} copiado com sucesso!`);
    setTimeout(() => setCopiedRm(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const cleanPhone = admissionsData.guardian?.phoneMobile || admissionsData.guardian?.phone || selectedStudent?.guardians?.[0]?.phone || '';
  const cleanPhoneDigits = cleanPhone.replace(/\D/g, '');

  return (
    <div className="w-full space-y-6 pb-16 animate-fadeIn">
      {/* Header Principal do Raio-X com foco no Setor de Matrículas */}
      <div className="rodin-panel-card flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#E2E8F0] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-[#FFF0E6] text-[#F45206]">
              <UserCheck size={22} />
            </span>
            <h1 className="text-[20px] font-black text-[#1E293B]">
              Raio-X do Aluno — Setor de Matrículas & Secretaria
            </h1>
          </div>
          <p className="text-[12px] font-semibold text-[#64748B]">
            Prontuário Comercial 360°: Quando entrou, LTV acumulado, datas de matrícula e histórico financeiro de 2024 a 2027
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          {/* Botão de Download da Planilha Oficial */}
          <a
            href="/planilha_importacao_raio_x_colegio_rodin.xlsx"
            download="planilha_importacao_raio_x_colegio_rodin.xlsx"
            className="inline-flex items-center justify-center gap-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1] px-3.5 py-2 rounded-xl text-[12px] font-bold shadow-xs transition-colors cursor-pointer shrink-0"
            title="Baixar planilha oficial formatada para importação de alunos e histórico de 2024 a 2027"
          >
            <Download size={14} className="text-[#059669]" />
            <span>Baixar Planilha Raio-X (2024—2027)</span>
          </a>

          {/* Botão de Impressão da Ficha de Matrícula */}
          <button
            onClick={handlePrint}
            className="btn-secondary-rodin !py-2 !px-3.5 text-[12px] flex items-center gap-1.5"
            title="Imprimir prontuário comercial e financeiro do estudante"
          >
            <Printer size={14} /> Imprimir Prontuário
          </button>
        </div>
      </div>

      {/* Grid Principal: Lista Lateral de Alunos + Painel 360° do Selecionado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna 1: Seletor e Lista de Alunos (4 colunas) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rodin-panel-card !p-4 space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Buscar por RM, Nome ou CPF..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E2E8F0] text-[12px] font-semibold text-[#1E293B] focus:outline-none focus:border-[#F45206] bg-[#F8FAFC]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {['all', 'Fundamental', 'Médio'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setGradeFilter(filter)}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-colors ${
                    gradeFilter === filter
                      ? 'bg-[#F45206] text-white'
                      : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {filter === 'all' ? 'Todos' : filter}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredStudents.map((s) => {
                const isSelected = selectedStudent?.id === s.id;
                const rm = s.rmNumber || s.cocCode || '2560';

                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#FFF0E6] border-[#F45206] shadow-sm ring-1 ring-[#F45206]'
                        : 'bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={s.photoUrl}
                        alt={s.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-[#F45206] shrink-0"
                      />
                      <div className="min-w-0">
                        <strong className={`block text-[13px] truncate ${isSelected ? 'text-[#F45206]' : 'text-[#1E293B]'}`}>
                          {s.name}
                        </strong>
                        <span className="text-[11px] text-[#64748B] block truncate">
                          RM {rm} • {s.currentGrade}
                        </span>
                      </div>
                    </div>

                    <ChevronRight size={16} className={`shrink-0 ${isSelected ? 'text-[#F45206]' : 'text-[#CBD5E1]'}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Coluna 2: Detalhamento 360° do Aluno Selecionado (8 colunas) */}
        <div className="lg:col-span-8 space-y-5">
          {selectedStudent ? (
            <>
              {/* Seletor de Visão do Raio-X: Matrículas & LTV (Padrão) vs Pedagógico */}
              <div className="flex items-center gap-2 p-1.5 bg-[#F1F5F9] rounded-2xl border border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('matricula')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-[12.5px] font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeSubTab === 'matricula'
                      ? 'bg-white text-[#F45206] shadow-xs border border-[#CBD5E1]'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  <DollarSign size={15} />
                  <span>Raio-X de Matrículas & LTV (Secretaria / Comercial)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('pedagogico')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-[12.5px] font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    activeSubTab === 'pedagogico'
                      ? 'bg-white text-[#F45206] shadow-xs border border-[#CBD5E1]'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  <BookOpen size={15} />
                  <span>Diagnóstico Pedagógico (Coordenação / Sala)</span>
                </button>
              </div>

              {/* CONTEÚDO 1: VISÃO DE MATRÍCULAS, QUANDO ENTROU, LTV E HISTÓRICO */}
              {activeSubTab === 'matricula' && (
                <div className="space-y-5">
                  {/* Hero Card do Aluno com Destaque de Primary Key e Status */}
                  <div className="rodin-panel-card !p-5 sm:!p-6 bg-gradient-to-br from-white to-[#F8FAFC] border border-[#E2E8F0] shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                      <img
                        src={selectedStudent.photoUrl}
                        alt={selectedStudent.name}
                        className="w-22 h-22 sm:w-24 sm:h-24 rounded-3xl object-cover border-3 border-[#F45206] shadow-md shrink-0"
                      />

                      <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <h2 className="text-[20px] sm:text-[22px] font-black text-[#1E293B]">
                            {selectedStudent.name}
                          </h2>
                          
                          {/* Badge de Primary Key perpétua */}
                          <div className="inline-flex items-center gap-1.5 bg-[#0F172A] text-white px-3 py-1 rounded-xl text-[11px] font-black font-mono shadow-xs">
                            <span className="text-[#F45206]">RM:</span> {admissionsData.rm}
                            <button
                              type="button"
                              onClick={handleCopyRm}
                              className="hover:text-[#FED7AA] ml-1 transition-colors"
                              title="Copiar RM (Primary Key)"
                            >
                              {copiedRm ? <Check size={12} className="text-[#10B981]" /> : <Copy size={12} />}
                            </button>
                          </div>

                          {/* Status da Rematrícula 2027 */}
                          <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold border ${
                            admissionsData.schoolContractSigned && admissionsData.materialContractSigned
                              ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                              : 'bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5]'
                          }`}>
                            <Sparkles size={12} />
                            {admissionsData.schoolContractSigned && admissionsData.materialContractSigned
                              ? 'Rematriculado 2027 (Contratos Assinados)'
                              : 'Rematrícula 2027 em Andamento'}
                          </span>
                        </div>

                        <p className="text-[12.5px] font-bold text-[#64748B]">
                          Série Atual: <strong className="text-[#1E293B]">{selectedStudent.currentGrade}</strong> → Nova Série 2027: <strong className="text-[#F45206]">{admissionsData.nextGrade2027}</strong> • Turno: <strong>{selectedStudent.schoolShift || 'Manhã'}</strong>
                        </p>

                        {/* Dados Rápidos do Responsável com WhatsApp Direto */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-[11.5px] text-[#475569]">
                          <span className="inline-flex items-center gap-1">
                            <Users size={14} className="text-[#F45206]" />
                            <strong>{admissionsData.guardian?.guardianName || admissionsData.guardian?.name || 'Responsável Cadastrado'}</strong>
                            <span className="text-[#94A3B8]">({admissionsData.guardian?.guardianRelation || 'Resp. Financeiro'})</span>
                          </span>

                          {cleanPhoneDigits && (
                            <a
                              href={`https://wa.me/55${cleanPhoneDigits}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#059669] font-bold hover:underline"
                              title="Enviar WhatsApp direto para o responsável"
                            >
                              <Phone size={13} /> {cleanPhone}
                            </a>
                          )}

                          {admissionsData.guardian?.email && (
                            <a
                              href={`mailto:${admissionsData.guardian?.email}`}
                              className="inline-flex items-center gap-1 text-[#3B82F6] hover:underline"
                            >
                              <Mail size={13} /> {admissionsData.guardian?.email}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* OS 4 CARDS DE MÉTRICAS PEDIDOS PELO USUÁRIO (LTV, QUANDO ENTROU, QUANDO FOI MATRICULADO, TICKET MÉDIO) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* CARD 1: LTV TOTAL ACUMULADO */}
                    <div className="rodin-panel-card !p-4 border-l-4 border-l-[#059669] bg-white shadow-xs">
                      <div className="flex items-center justify-between text-[#059669] mb-1">
                        <span className="text-[10.5px] font-black uppercase tracking-wider">LTV Acumulado</span>
                        <DollarSign size={16} />
                      </div>
                      <strong className="text-[20px] font-black text-[#1E293B] block">
                        R$ {formatNumberToBRL(admissionsData.ltvTotal)}
                      </strong>
                      <span className="text-[10px] text-[#64748B] block mt-0.5 font-medium">
                        Anuidade: R$ {formatNumberToBRL(admissionsData.ltvTuition)} <br />
                        Material: R$ {formatNumberToBRL(admissionsData.ltvMaterial)}
                      </span>
                      <span className="inline-block mt-2 px-2 py-0.5 bg-[#ECFDF5] text-[#059669] text-[9.5px] font-bold rounded-md border border-[#A7F3D0]">
                        Tier A • Alto Valor
                      </span>
                    </div>

                    {/* CARD 2: QUANDO ENTROU (DATA DE INGRESSO & TEMPO DE CASA) */}
                    <div className="rodin-panel-card !p-4 border-l-4 border-l-[#F45206] bg-white shadow-xs">
                      <div className="flex items-center justify-between text-[#F45206] mb-1">
                        <span className="text-[10.5px] font-black uppercase tracking-wider">Quando Entrou</span>
                        <Calendar size={16} />
                      </div>
                      <strong className="text-[20px] font-black text-[#1E293B] block">
                        {admissionsData.ingressDate}
                      </strong>
                      <span className="text-[10px] text-[#64748B] block mt-0.5 font-medium">
                        Tempo de Casa: <strong>{admissionsData.timeInSchoolDetailed}</strong> <br />
                        Série de Ingresso: <strong>{admissionsData.ingressGrade}</strong>
                      </span>
                      <span className="inline-block mt-2 px-2 py-0.5 bg-[#FFF0E6] text-[#F45206] text-[9.5px] font-bold rounded-md border border-[#FED7AA]">
                        {admissionsData.yearsInSchool}
                      </span>
                    </div>

                    {/* CARD 3: QUANDO FOI MATRICULADO */}
                    <div className="rodin-panel-card !p-4 border-l-4 border-l-[#3B82F6] bg-white shadow-xs">
                      <div className="flex items-center justify-between text-[#3B82F6] mb-1">
                        <span className="text-[10.5px] font-black uppercase tracking-wider">Quando Matriculou</span>
                        <Clock size={16} />
                      </div>
                      <strong className="text-[18px] font-black text-[#1E293B] block">
                        {admissionsData.lastEnrollmentDate.split(' às ')[0]}
                      </strong>
                      <span className="text-[10px] text-[#64748B] block mt-0.5 font-medium">
                        Horário: <strong>{admissionsData.lastEnrollmentDate.split(' às ')[1] || '11:20'}</strong> <br />
                        1ª Matrícula: <strong>{admissionsData.firstEnrollmentDate.split(' às ')[0]}</strong>
                      </span>
                      <span className="inline-block mt-2 px-2 py-0.5 bg-blue-50 text-blue-700 text-[9.5px] font-bold rounded-md border border-blue-200">
                        {admissionsData.schoolContractSigned ? '✓ Contratos Assinados' : 'Aguardando Assinatura'}
                      </span>
                    </div>

                    {/* CARD 4: TICKET MÉDIO & CONDUTA FINANCEIRA */}
                    <div className="rodin-panel-card !p-4 border-l-4 border-l-[#8B5CF6] bg-white shadow-xs">
                      <div className="flex items-center justify-between text-[#8B5CF6] mb-1">
                        <span className="text-[10.5px] font-black uppercase tracking-wider">Ticket Mensal</span>
                        <CreditCard size={16} />
                      </div>
                      <strong className="text-[20px] font-black text-[#1E293B] block">
                        R$ {formatNumberToBRL(admissionsData.averageTicketMonthly)}
                      </strong>
                      <span className="text-[10px] text-[#64748B] block mt-0.5 font-medium">
                        Adimplência: <strong className="text-[#059669]">100% Pontual</strong> <br />
                        Plano Atual: <strong>13 parcelas mensais</strong>
                      </span>
                      <span className="inline-block mt-2 px-2 py-0.5 bg-purple-50 text-purple-700 text-[9.5px] font-bold rounded-md border border-purple-200">
                        Zero Inadimplência
                      </span>
                    </div>
                  </div>

                  {/* HISTÓRICO COMPLETO ANO A ANO (A PARTIR DE 2024 ATÉ 2027) */}
                  <div className="rodin-panel-card !p-5 sm:!p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2E8F0] gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-[#F8FAFC] text-[#1E293B] border border-[#E2E8F0]">
                          <History size={17} />
                        </span>
                        <div>
                          <h3 className="text-[15px] font-black text-[#1E293B]">
                            Histórico de Matrículas & Evolução Anual (2024 — 2027)
                          </h3>
                          <span className="text-[11px] text-[#64748B]">
                            Evolução acadêmica, valores contratados e datas de assinatura a partir do ingresso
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold text-[#F45206] bg-[#FFF0E6] px-2.5 py-1 rounded-full border border-[#FED7AA] self-start sm:self-auto">
                        Primary Key Fixa: RM: {admissionsData.rm}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {admissionsData.historyYears.map((item) => (
                        <div
                          key={item.year}
                          className={`p-4 rounded-2xl border transition-all ${
                            item.year === 2027
                              ? 'bg-gradient-to-br from-[#FFF7ED] to-white border-[#F45206] shadow-xs'
                              : 'bg-white border-[#E2E8F0] hover:border-[#CBD5E1]'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] mb-2.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-8 h-8 rounded-xl font-black text-[13px] flex items-center justify-center ${
                                item.year === 2027
                                  ? 'bg-[#F45206] text-white'
                                  : 'bg-[#1E293B] text-white'
                              }`}>
                                {item.year}
                              </span>
                              <div>
                                <strong className="text-[13px] text-[#1E293B] block leading-tight">{item.grade}</strong>
                                <span className="text-[10.5px] text-[#64748B]">{item.classGroup}</span>
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              item.statusColor === 'emerald'
                                ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                                : item.statusColor === 'blue'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]'
                            }`}>
                              {item.statusTag}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] mb-2.5">
                            <div>
                              <span className="text-[#64748B] block">Data da Matrícula:</span>
                              <strong className="text-[#1E293B] font-mono">{item.matriculaDate} às {item.matriculaHour}</strong>
                            </div>
                            <div>
                              <span className="text-[#64748B] block">Investimento Anual:</span>
                              <strong className="text-[#059669] text-[12px] font-bold">R$ {formatNumberToBRL(item.total)}</strong>
                            </div>
                            <div>
                              <span className="text-[#64748B] block">Anuidade Escolar:</span>
                              <span className="text-[#1E293B] font-semibold">R$ {formatNumberToBRL(item.anuidade)}</span>
                            </div>
                            <div>
                              <span className="text-[#64748B] block">Material Didático:</span>
                              <span className="text-[#1E293B] font-semibold">R$ {formatNumberToBRL(item.material)}</span>
                            </div>
                          </div>

                          <div className="p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[10.5px] text-[#475569] flex items-start gap-1.5">
                            <Sparkles size={13} className="text-[#F45206] shrink-0 mt-0.5" />
                            <span>{item.notes}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DADOS CADASTRAIS DO RESPONSÁVEL & CONTRATOS DIGITAIS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Ficha Completa do Responsável Financeiro */}
                    <div className="rodin-panel-card !p-5 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
                        <Users size={16} className="text-[#F45206]" />
                        <h4 className="text-[13.5px] font-black text-[#1E293B]">
                          Responsável Financeiro Oficial
                        </h4>
                      </div>

                      <div className="space-y-1.5 text-[11.5px] text-[#475569]">
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Nome:</span>
                          <strong className="text-[#1E293B]">{admissionsData.guardian?.guardianName || admissionsData.guardian?.name || 'Wanderson Pedro de Almeida'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">CPF:</span>
                          <span className="font-mono text-[#1E293B] font-semibold">{admissionsData.guardian?.guardianCpf || admissionsData.guardian?.cpf || '57.786.608-4'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">RG:</span>
                          <span className="font-mono text-[#1E293B]">{admissionsData.guardian?.guardianRg || admissionsData.guardian?.rg || '34.602.083 SSP/SP'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Profissão:</span>
                          <span className="text-[#1E293B]">{admissionsData.guardian?.guardianOccupation || 'Gerente de Contas'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Celular / WhatsApp:</span>
                          <span className="text-[#059669] font-bold">{cleanPhone || '(19) 98120-6515'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">E-mail:</span>
                          <span className="text-[#3B82F6]">{admissionsData.guardian?.guardianEmail || admissionsData.guardian?.email || 'wpalmeida@hotmail.com'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#64748B]">Endereço / CEP:</span>
                          <span className="text-[#1E293B] text-right truncate max-w-[220px]">
                            {admissionsData.guardian?.guardianAddressStreet || 'Rua Almerinda B. P. de Alcantara, 160'} - CEP: {admissionsData.guardian?.guardianAddressCep || '13340-385'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status dos Contratos Digitais e Origem */}
                    <div className="rodin-panel-card !p-5 space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
                        <FileSignature size={16} className="text-[#F45206]" />
                        <h4 className="text-[13.5px] font-black text-[#1E293B]">
                          Contratos Digitais & Canal de Origem
                        </h4>
                      </div>

                      <div className="space-y-2 text-[11.5px]">
                        <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                          <div className="flex items-center justify-between mb-1">
                            <strong className="text-[#1E293B]">Contrato Anuidade (Balder)</strong>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              admissionsData.schoolContractSigned
                                ? 'bg-[#ECFDF5] text-[#059669]'
                                : 'bg-[#FEF2F2] text-[#DC2626]'
                            }`}>
                              {admissionsData.schoolContractSigned ? '✓ Assinado Digitalmente' : 'Pendente de Assinatura'}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#64748B] block">
                            Requerimento de Matrícula e Prestação de Serviços Educacionais 2027
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                          <div className="flex items-center justify-between mb-1">
                            <strong className="text-[#1E293B]">Pedido Material (Livraria)</strong>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              admissionsData.materialContractSigned
                                ? 'bg-[#ECFDF5] text-[#059669]'
                                : 'bg-[#FEF2F2] text-[#DC2626]'
                            }`}>
                              {admissionsData.materialContractSigned ? '✓ Assinado Digitalmente' : 'Pendente de Assinatura'}
                            </span>
                          </div>
                          <span className="text-[10px] text-[#64748B] block">
                            Pedido de Compra e Venda de Livros Didáticos 2027
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] text-[10.5px] text-[#C2410C]">
                          <strong>Canal de Ingresso:</strong> {admissionsData.originChannel}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BARRA DE AÇÃO RÁPIDA: ABRIR REMATRÍCULA 2027 DIRETO PARA ESTE ALUNO */}
                  <div className="rodin-panel-card !p-4 bg-[#1E293B] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                    <div>
                      <span className="text-[11px] font-bold text-[#FED7AA] uppercase tracking-wider block">
                        Ação do Setor de Matrículas
                      </span>
                      <strong className="text-[14px]">
                        Deseja emitir contratos ou alterar parcelamento de {selectedStudent.name}?
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('rematricula');
                      }}
                      className="btn-primary-rodin !py-2.5 !px-5 text-[12.5px] flex items-center justify-center gap-2 whitespace-nowrap self-start sm:self-auto cursor-pointer"
                    >
                      <RefreshCw size={15} />
                      <span>Ir para Módulo de Rematrícula</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* CONTEÚDO 2: DIAGNÓSTICO PEDAGÓGICO E COMPORTAMENTAL (PARA COORDENAÇÃO/SALA) */}
              {activeSubTab === 'pedagogico' && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Card de Perfil do Aluno */}
                  <div className="rodin-panel-card !p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <img
                      src={selectedStudent.photoUrl}
                      alt={selectedStudent.name}
                      className="w-24 h-24 rounded-3xl object-cover border-3 border-[#F45206] shadow-md shrink-0"
                    />

                    <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h2 className="text-[20px] font-black text-[#1E293B]">
                          {selectedStudent.name}
                        </h2>
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#FFF0E6] text-[#F45206] border border-[#FED7AA]">
                          RM {selectedStudent.rmNumber || selectedStudent.cocCode}
                        </span>
                        {selectedStudent.condition && selectedStudent.condition !== 'Regular' && (
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#F3E8FF] text-[#7E22CE] border border-[#D8B4FE]">
                            ★ {selectedStudent.condition}
                          </span>
                        )}
                      </div>

                      <p className="text-[12px] font-bold text-[#64748B]">
                        {selectedStudent.courseLevel || 'Ensino Fundamental'} • <strong className="text-[#F45206]">{selectedStudent.currentGrade}</strong> (Turma {selectedStudent.classGroup || 'A'}) • Turno: <strong>{selectedStudent.schoolShift || 'Manhã'}</strong>
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px] text-[#64748B] pt-2 border-t border-[#E2E8F0]">
                        <div>
                          <span className="font-bold text-[#1E293B]">Responsável:</span> {selectedStudent.guardians?.[0]?.name || 'Responsável Cadastrado'}
                        </div>
                        <div>
                          <span className="font-bold text-[#1E293B]">Telefone / Contato:</span> {selectedStudent.guardians?.[0]?.phone || selectedStudent.emergencyContact || '—'}
                        </div>
                        <div>
                          <span className="font-bold text-[#1E293B]">Data Nasc.:</span> {formatDisplayDate(selectedStudent.birthDate || selectedStudent.studentBirthDate || '2015-03-28')} ({selectedStudent.birthCity || 'Indaiatuba - SP'})
                        </div>
                        <div>
                          <span className="font-bold text-[#1E293B]">CPF:</span> {selectedStudent.cpf}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Indicadores Rápidos (KPIs Pedagógicos) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rodin-panel-card !p-4 border-l-4 border-l-[#059669]">
                      <div className="flex items-center justify-between text-[#059669] mb-1">
                        <span className="text-[11px] font-extrabold uppercase">Frequência Global</span>
                        <Activity size={16} />
                      </div>
                      <strong className="text-[22px] font-black text-[#1E293B]">
                        {selectedStudent.attendanceRate || '98%'}
                      </strong>
                      <span className="text-[10px] text-[#64748B] block mt-0.5">Assiduidade exemplar</span>
                    </div>

                    <div className="rodin-panel-card !p-4 border-l-4 border-l-[#F45206]">
                      <div className="flex items-center justify-between text-[#F45206] mb-1">
                        <span className="text-[11px] font-extrabold uppercase">Média Geral</span>
                        <Award size={16} />
                      </div>
                      <strong className="text-[22px] font-black text-[#1E293B]">
                        8.9 <span className="text-[12px] text-[#64748B] font-semibold">/ 10.0</span>
                      </strong>
                      <span className="text-[10px] text-[#059669] font-bold block mt-0.5">Aprovado Direto</span>
                    </div>

                    <div className="rodin-panel-card !p-4 border-l-4 border-l-[#3B82F6]">
                      <div className="flex items-center justify-between text-[#3B82F6] mb-1">
                        <span className="text-[11px] font-extrabold uppercase">Ocorrências</span>
                        <Coffee size={16} />
                      </div>
                      <strong className="text-[22px] font-black text-[#1E293B]">
                        {studentLogs.length} <span className="text-[12px] text-[#64748B] font-semibold">registros</span>
                      </strong>
                      <span className="text-[10px] text-[#64748B] block mt-0.5">Diário de bordo de sala</span>
                    </div>
                  </div>

                  {/* Registro do Diário de Sala (Ocorrências e Acompanhamento) */}
                  <div className="rodin-panel-card !p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-[#F45206]" />
                        <h3 className="text-[15px] font-black text-[#1E293B]">
                          Histórico Comportamental & Saídas em Sala de Aula
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold text-[#64748B]">
                        Registrado pelos Professores
                      </span>
                    </div>

                    {studentLogs.length > 0 ? (
                      <div className="space-y-2.5">
                        {studentLogs.map((log) => (
                          <div
                            key={log.id}
                            className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-4 text-[12px]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-[#FFF0E6] text-[#F45206] flex items-center justify-center font-bold">
                                <Coffee size={14} />
                              </div>
                              <div>
                                <strong className="text-[#1E293B] block">{log.category || 'Saída de Sala'}</strong>
                                <span className="text-[#64748B]">{log.notes || 'Registro regular em aula'}</span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-bold text-[#1E293B] block">{log.teacherName || 'Prof. Regente'}</span>
                              <span className="text-[10px] text-[#94A3B8] font-mono">
                                {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-[12px] text-[#64748B] bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                        Nenhuma ocorrência ou saída extraordinária registrada para este aluno.
                      </div>
                    )}
                  </div>

                  {/* Saúde e Restrições Médicas */}
                  <div className="rodin-panel-card !p-6 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
                      <HeartPulse size={18} className="text-[#F45206]" />
                      <h3 className="text-[15px] font-black text-[#1E293B]">
                        Diretrizes de Saúde e Restrições Médicas
                      </h3>
                    </div>
                    <p className="text-[12px] text-[#475569] leading-relaxed">
                      {selectedStudent.medicalAllergies || 'Nenhuma alergia ou recomendação médica restritiva cadastrada pela família no Requerimento de Matrícula.'}
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rodin-panel-card !p-12 text-center text-[#64748B]">
              Selecione um aluno na coluna ao lado para visualizar o Raio-X completo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
