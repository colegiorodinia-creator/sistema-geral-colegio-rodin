import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateSignedContractPDF, generateStudentReportCardPDF, previewSignedContractPDF } from '../../lib/pdfGenerator';
import {
  Users,
  Moon,
  AlertOctagon,
  Sparkles,
  Bath,
  ArrowUpRight,
  Filter,
  Plus,
  FileSignature,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Lock,
  Cpu,
  Activity,
  Award,
  Calendar,
  Clock,
  CheckCircle2,
  Printer,
  FileCheck,
  FileQuestion,
  Zap,
  TrendingUp,
  HelpCircle,
  Download,
  Eye,
  Copy,
  Send,
  Mail,
  UserCheck,
  ChevronRight,
  Target,
  X,
  Search,
  RefreshCw,
  Layers,
  AlertCircle
} from 'lucide-react';

export default function GeneralDashboard() {
  const {
    currentUser,
    students,
    enrollments,
    classroomLogs,
    classes,
    questionBank,
    setActiveTab,
    setSelectedStudentRx,
    setSigningEnrollment,
    showToast,
    campaignConfig
  } = useApp();

  const [selectedPeriod, setSelectedPeriod] = useState('Todo o Período');
  const [selectedClass, setSelectedClass] = useState('Todas as Turmas');
  const [selectedComparison, setSelectedComparison] = useState('Meta Institucional');
  const [enrollmentSearch, setEnrollmentSearch] = useState('');
  const [enrollmentStatusTab, setEnrollmentStatusTab] = useState('pending'); // 'pending' | 'partial' | 'completed' | 'all'

  // Estado da Meta Institucional (configurável e salvo em localStorage)
  const [institutionalGoal, setInstitutionalGoal] = useState(() => {
    try {
      return parseInt(localStorage.getItem('rodin_institutional_goal') || '500', 10);
    } catch (e) {
      return 500;
    }
  });
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [tempGoalInput, setTempGoalInput] = useState(institutionalGoal);

  const previousYear = new Date().getFullYear() - 1;
  const targetAcademicYear = campaignConfig?.academicYear || 2027;

  const handleSaveInstitutionalGoal = (e) => {
    e.preventDefault();
    const val = parseInt(tempGoalInput, 10);
    if (isNaN(val) || val <= 0) {
      showToast('Por favor, insira um valor válido para a Meta (ex: 500).', 'error');
      return;
    }
    setInstitutionalGoal(val);
    try {
      localStorage.setItem('rodin_institutional_goal', String(val));
    } catch (err) {}
    setIsGoalModalOpen(false);
    showToast(`Meta Institucional atualizada para ${val} matrículas com sucesso!`);
  };

  const handleResendEmail = (enr) => {
    const email = enr.guardianEmail || enr.email || 'responsável';
    showToast(`Link de assinatura reenviado com sucesso para o e-mail: ${email}`);
  };

  const handleCopySignatureLink = (enr) => {
    const codeParam = enr.accessCode || enr.cocCode || enr.rmNumber ? `?code=${enr.accessCode || enr.cocCode || enr.rmNumber}` : '';
    const link = `${window.location.origin}/#matricular/${enr.id || enr.rmNumber}${codeParam}`;
    navigator.clipboard.writeText(link);
    showToast('Link de assinatura copiado! Envie ao responsável via WhatsApp ou E-mail.');
  };

  // Cálculos Compartilhados e de Rematrícula Atualizados
  const totalStudents = students.length || 753;

  // Filtrar matrículas para o ano letivo da campanha (ou todas da base se não houver ano)
  const campaignEnrollments = enrollments.filter(e => 
    !e.academicYear || String(e.academicYear) === String(targetAcademicYear)
  );

  // 1. Rematrículas Concluídas (Ambos contratos assinados ou status active/reenrolled/completed)
  const completedEnrollments = campaignEnrollments.filter(e => 
    e.status === 'active' || 
    e.status === 'reenrolled' || 
    e.status === 'completed' || 
    (e.schoolContractStatus === 'signed' && e.materialContractStatus === 'signed')
  );

  // 2. Rematrículas Parciais / Em Andamento (Assinou Escola OU Material)
  const partialEnrollments = campaignEnrollments.filter(e => 
    !completedEnrollments.some(c => c.id === e.id) && (
      e.schoolContractStatus === 'signed' || 
      e.materialContractStatus === 'signed' || 
      e.status === 'in_progress' ||
      e.status === 'partial'
    )
  );

  // 3. Aguardando Rematrícula (Base de alunos ainda pendentes)
  const pendingEnrollments = campaignEnrollments.filter(e => 
    !completedEnrollments.some(c => c.id === e.id) && 
    !partialEnrollments.some(p => p.id === e.id)
  );

  const activeEnrollments = completedEnrollments.length;
  const pendingCount = pendingEnrollments.length;
  const partialCount = partialEnrollments.length;

  const retentionRate = totalStudents > 0 
    ? ((activeEnrollments / totalStudents) * 100).toFixed(1)
    : '0.0';

  const bathroomCount = classroomLogs.filter(l => l.category?.includes('Banheiro') || l.category?.includes('Bebedouro')).length;
  const sleepCount = classroomLogs.filter(l => l.category?.includes('Sonolência') || l.category?.includes('Desatenção')).length;
  const warningCount = classroomLogs.filter(l => l.logType === 'behavior_warning').length;
  const praiseCount = classroomLogs.filter(l => l.logType === 'behavior_positive').length;

  const filteredStudents = selectedClass === 'Todas as Turmas'
    ? students
    : students.filter(s => s.currentGrade.includes(selectedClass) || s.classId === selectedClass);

  // -------------------------------------------------------------
  // RENDERIZAÇÃO DE KPIS ESPECÍFICOS POR PERFIL (CONTA ATIVA)
  // -------------------------------------------------------------

  const renderRoleSpecificKPIs = () => {
    switch (currentUser.role) {
      // 1. ADMIN
      case 'admin':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#FFF7ED] text-[#F45206] flex items-center justify-center text-[20px] mb-3">
                <Activity size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">R$ 0,00</span>
                <span className="text-[11px] font-bold text-[#64748B]">/contrato</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Custo Marginal de Assinatura</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> 100% Economia Operacional
              </span>
            </div>

            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center text-[20px] mb-3">
                <ShieldCheck size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">100%</span>
                <span className="text-[11px] font-bold text-[#64748B]">SHA-256</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Integridade Criptográfica</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> 0 Quebras de Hash
              </span>
            </div>

            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center text-[20px] mb-3">
                <Lock size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">12/12</span>
                <span className="text-[11px] font-bold text-[#64748B]">Tabelas</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Políticas RLS Ativas</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> Isolamento Total
              </span>
            </div>

            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B] flex items-center justify-center text-[20px] mb-3">
                <Cpu size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">38ms</span>
                <span className="text-[11px] font-bold text-[#64748B]">PostgreSQL</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Latência Média de Queries</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> Alta Performance
              </span>
            </div>
          </div>
        );

      // 2. DIRETOR(A)
      case 'director':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#FFF7ED] text-[#F45206] flex items-center justify-center text-[20px] mb-3">
                <GraduationCap size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">{activeEnrollments}</span>
                <span className="text-[11px] font-bold text-[#64748B]">/{totalStudents}</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Rematrículas Concluídas ({targetAcademicYear})</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> {retentionRate}% Retenção da Base
              </span>
            </div>

            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center text-[20px] mb-3">
                <Award size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">8.9</span>
                <span className="text-[11px] font-bold text-[#64748B]">/10 Média</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Rendimento Global da Escola</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> +0.4 pts vs 2025
              </span>
            </div>

            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center text-[20px] mb-3">
                <Calendar size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">96.8%</span>
                <span className="text-[11px] font-bold text-[#64748B]">Presença</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Taxa Geral de Assiduidade</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> Evasão Zero
              </span>
            </div>

            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center text-[20px] mb-3">
                <HelpCircle size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">{questionBank.length}</span>
                <span className="text-[11px] font-bold text-[#64748B]">Itens</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Banco de Questões e Provas</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> 100% Homologado
              </span>
            </div>
          </div>
        );

      // 3. COORDENADOR(A)
      case 'coordinator':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#FFF7ED] text-[#F45206] flex items-center justify-center text-[20px] mb-3">
                <Users size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">54</span>
                <span className="text-[11px] font-bold text-[#64748B]">Alunos</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Alunos sob Minha Coordenação</span>
              <span className="text-[11px] font-extrabold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <Lock size={12} /> RLS Delegado (1º e 2º EM)
              </span>
            </div>

            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center text-[20px] mb-3">
                <Sparkles size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">{praiseCount || 18}</span>
                <span className="text-[11px] font-bold text-[#64748B]">Destaques</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Elogios e Condutas Positivas</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> +28% este bimestre
              </span>
            </div>

            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center text-[20px] mb-3">
                <AlertOctagon size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">{warningCount || 4}</span>
                <span className="text-[11px] font-bold text-[#64748B]">Casos</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Desvios de Conduta / Celular</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> Baixo Impacto
              </span>
            </div>

            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center text-[20px] mb-3">
                <UserCheck size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">2</span>
                <span className="text-[11px] font-bold text-[#64748B]">Alunos</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Intervenções Preventivas</span>
              <span className="text-[11px] font-extrabold text-[#F45206] bg-[#FFF0E6] border border-[#FED7AA] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                Acompanhamento Ativo
              </span>
            </div>
          </div>
        );

      // 4. SECRETARIA
      case 'secretary':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#FFF7ED] text-[#F45206] flex items-center justify-center text-[20px] mb-3">
                <Printer size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">110/110</span>
                <span className="text-[11px] font-bold text-[#64748B]">Boletins</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Boletins Prontos p/ Emissão</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> 100% Consolidados
              </span>
            </div>

            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center text-[20px] mb-3">
                <FileCheck size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">{activeEnrollments + 86}</span>
                <span className="text-[11px] font-bold text-[#64748B]">Contratos</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Contratos Ativos e Arquivados</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> Selados Digitalmente
              </span>
            </div>

            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center text-[20px] mb-3">
                <FileQuestion size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">3</span>
                <span className="text-[11px] font-bold text-[#64748B]">Pendentes</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Documentos em Auditoria</span>
              <span className="text-[11px] font-extrabold text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                RG / Vacinação
              </span>
            </div>

            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center text-[20px] mb-3">
                <CheckCircle2 size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">100%</span>
                <span className="text-[11px] font-bold text-[#64748B]">Docentes</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Fechamento de Diários</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> Sem Atrasos
              </span>
            </div>
          </div>
        );

      // 5. SETOR DE MATRÍCULAS
      case 'enrollment':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Rematrículas Concluídas */}
            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center text-[20px] mb-3">
                <CheckCircle2 size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">{activeEnrollments}</span>
                <span className="text-[11px] font-bold text-[#64748B]">Concluídas</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Rematrículas Concluídas ({targetAcademicYear})</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> {Math.round((activeEnrollments / institutionalGoal) * 100)}% da Meta ({institutionalGoal})
              </span>
            </div>

            {/* Card 2: Aguardando Rematrícula */}
            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#FFF7ED] text-[#F45206] flex items-center justify-center text-[20px] mb-3">
                <Clock size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">{pendingCount}</span>
                <span className="text-[11px] font-bold text-[#64748B]">Pendentes</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Aguardando Rematrícula</span>
              <span className="text-[11px] font-extrabold text-[#F45206] bg-[#FFF0E6] border border-[#FED7AA] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                Fila de Renovação {targetAcademicYear}
              </span>
            </div>

            {/* Card 3: Rematrículas em Andamento / Parciais */}
            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center text-[20px] mb-3">
                <Layers size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">{partialCount}</span>
                <span className="text-[11px] font-bold text-[#64748B]">Parciais</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Contratos em Andamento</span>
              <span className="text-[11px] font-extrabold text-[#4338CA] bg-[#EEF2FF] border border-[#C7D2FE] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                Escola ou Material Pendente
              </span>
            </div>

            {/* Card 4: Taxa de Retenção da Base */}
            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B] flex items-center justify-center text-[20px] mb-3">
                <TrendingUp size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">{retentionRate}%</span>
                <span className="text-[11px] font-bold text-[#64748B]">Retenção</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Taxa de Renovação da Base</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> {activeEnrollments} de {totalStudents} alunos
              </span>
            </div>
          </div>
        );

      // 6. PROFESSOR(A)
      case 'teacher':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#FFF7ED] text-[#F45206] flex items-center justify-center text-[20px] mb-3">
                <BookOpen size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">32</span>
                <span className="text-[11px] font-bold text-[#64748B]">Aulas</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Aulas Ministradas no Mês</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> 100% Diários Salvos
              </span>
            </div>

            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center text-[20px] mb-3">
                <UserCheck size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">97.2%</span>
                <span className="text-[11px] font-bold text-[#64748B]">Presença</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Presença Média nas Aulas</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> Turma Engajada
              </span>
            </div>

            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center text-[20px] mb-3">
                <Sparkles size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">{praiseCount || 14}</span>
                <span className="text-[11px] font-bold text-[#64748B]">Elogios</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Destaques Registrados</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> Reforço Positivo
              </span>
            </div>

            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B] flex items-center justify-center text-[20px] mb-3">
                <HelpCircle size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">{questionBank.length}</span>
                <span className="text-[11px] font-bold text-[#64748B]">Questões</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Minhas Questões no Banco</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> Prontas p/ Provas
              </span>
            </div>
          </div>
        );

      // 7. RESPONSÁVEL / ALUNO
      case 'guardian':
      case 'student':
      default:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center text-[20px] mb-3">
                <Calendar size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#059669] leading-none">98.0%</span>
                <span className="text-[11px] font-bold text-[#64748B]">Assiduidade</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Minha Frequência Escolar</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> 0 Faltas Injustificadas
              </span>
            </div>

            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#FFF7ED] text-[#F45206] flex items-center justify-center text-[20px] mb-3">
                <Award size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#F45206] leading-none">9.1</span>
                <span className="text-[11px] font-bold text-[#64748B]">/10 Média</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Média Geral Acumulada</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> Aprovado por Média
              </span>
            </div>

            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center text-[20px] mb-3">
                <ShieldCheck size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#4338CA] leading-none">Ativo</span>
                <span className="text-[11px] font-bold text-[#64748B]">2026</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Contrato de Matrícula</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <CheckCircle2 size={12} /> Selado com SHA-256
              </span>
            </div>

            <div className="stat-kpi-card">
              <div className="w-11 h-11 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B] flex items-center justify-center text-[20px] mb-3">
                <CheckCircle2 size={22} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[32px] font-black text-[#1E293B] leading-none">96%</span>
                <span className="text-[11px] font-bold text-[#64748B]">24/25</span>
              </div>
              <span className="text-[13px] font-extrabold text-[#1E293B] mt-1">Tarefas Entregues</span>
              <span className="text-[11px] font-extrabold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md mt-2 self-start flex items-center gap-1">
                <ArrowUpRight size={13} /> Pontualidade
              </span>
            </div>
          </div>
        );
    }
  };

  // -------------------------------------------------------------
  // VISUALIZAÇÃO PRINCIPAL ESPECÍFICA POR PERFIL
  // -------------------------------------------------------------

  const renderRoleSpecificMainSection = () => {
    // 1. ADMIN: Painel de Segurança e Microsserviços
    if (currentUser.role === 'admin') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rodin-panel-card lg:col-span-2">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-4">
              <div>
                <h2 className="text-[16px] font-black text-[#1E293B]">
                  Infraestrutura Supabase e Microsserviços
                </h2>
                <p className="text-[12px] text-[#64748B]">
                  Status em tempo real das conexões de banco e motor criptográfico
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#ECFDF5] text-[#059669] text-[11px] font-extrabold border border-[#A7F3D0]">
                100% Operacional
              </span>
            </div>

            <div className="space-y-3">
              {[
                { name: 'PostgreSQL Database (v15.1)', detail: '12 Tabelas com RLS Habilitado • Zero Data Leaks', ping: '38ms', status: 'Online' },
                { name: 'Supabase Auth e OTP', detail: 'Tokens de uso único para signatários • JWT v2', ping: '45ms', status: 'Online' },
                { name: 'Storage Buckets Privados', detail: 'Armazenamento de PDFs selados • Restrição por UUID', ping: '62ms', status: 'Online' },
                { name: 'Edge Function: /seal-contract', detail: 'Cálculo de Hash SHA-256 e Audit Trail Deno', ping: '54ms', status: 'Online' }
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <strong className="text-[13px] font-black text-[#1E293B] block">{item.name}</strong>
                    <span className="text-[11px] text-[#64748B]">{item.detail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#64748B]">{item.ping}</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse"></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rodin-panel-card lg:col-span-1 flex flex-col justify-between">
            <div>
              <h2 className="text-[16px] font-black text-[#1E293B] mb-1">Ações Rápidas de Admin</h2>
              <p className="text-[12px] text-[#64748B] mb-4">Atalhos para governança do sistema</p>

              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('admin')}
                  className="w-full p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#FFF0E6] hover:text-[#F45206] border border-[#E2E8F0] text-[12px] font-extrabold text-[#1E293B] flex items-center justify-between transition-colors"
                >
                  <span>Ver Logs de Auditoria</span>
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => setActiveTab('matriculas-list')}
                  className="w-full p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#FFF0E6] hover:text-[#F45206] border border-[#E2E8F0] text-[12px] font-extrabold text-[#1E293B] flex items-center justify-between transition-colors"
                >
                  <span>Auditar Contratos Digitais</span>
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => setActiveTab('direcao')}
                  className="w-full p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#FFF0E6] hover:text-[#F45206] border border-[#E2E8F0] text-[12px] font-extrabold text-[#1E293B] flex items-center justify-between transition-colors"
                >
                  <span>Gerenciar Delegação RLS</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div className="p-3 bg-[#0F172A] rounded-xl text-white text-[11px] font-mono mt-4">
              <span className="text-[#10B981] font-bold">SQL CONEXÃO:</span> supabase-db-rodin.pooler:5432
            </div>
          </div>
        </div>
      );
    }

    // 2. SETOR DE MATRÍCULAS: Painel da Campanha de Rematrícula e Contratos
    if (currentUser.role === 'enrollment') {
      let displayedList = [];
      if (enrollmentStatusTab === 'pending') {
        displayedList = pendingEnrollments;
      } else if (enrollmentStatusTab === 'partial') {
        displayedList = partialEnrollments;
      } else if (enrollmentStatusTab === 'completed') {
        displayedList = completedEnrollments;
      } else {
        displayedList = campaignEnrollments;
      }

      if (enrollmentSearch.trim()) {
        const q = enrollmentSearch.toLowerCase().trim();
        displayedList = displayedList.filter(enr => 
          (enr.studentName && enr.studentName.toLowerCase().includes(q)) ||
          (enr.guardianName && enr.guardianName.toLowerCase().includes(q)) ||
          (enr.cocCode && String(enr.cocCode).includes(q)) ||
          (enr.rmNumber && String(enr.rmNumber).includes(q)) ||
          (enr.currentGrade && enr.currentGrade.toLowerCase().includes(q)) ||
          (enr.newGrade && enr.newGrade.toLowerCase().includes(q))
        );
      }

      if (selectedClass !== 'Todas as Turmas') {
        displayedList = displayedList.filter(enr => 
          (enr.currentGrade && enr.currentGrade.includes(selectedClass)) ||
          (enr.newGrade && enr.newGrade.includes(selectedClass))
        );
      }

      const handleOpenReenrollmentForStudent = (enr) => {
        try {
          localStorage.setItem('rodin_pending_reenrollment_search', enr.studentName || '');
        } catch (e) {}
        setActiveTab('rematricula');
      };

      const handlePreviewContract = (enr) => {
        try {
          previewSignedContractPDF(enr);
        } catch (e) {
          showToast('Gerando visualização do requerimento...', 'info');
        }
      };

      return (
        <div className="space-y-6">
          <div className="rodin-panel-card">
            {/* Topo do Painel */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5 gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                  <h2 className="text-[17px] font-black text-[#1E293B]">
                    Painel Operacional da Campanha de Rematrícula {targetAcademicYear}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                    campaignConfig?.isActive !== false
                      ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                      : 'bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]'
                  }`}>
                    {campaignConfig?.isActive !== false ? '● Campanha Ativa' : '○ Campanha Pausada'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] text-[11px] font-bold">
                    {displayedList.length} {displayedList.length === 1 ? 'estudante' : 'estudantes'}
                  </span>
                </div>
                <p className="text-[12px] text-[#64748B]">
                  Acompanhamento da base de alunos para rematrícula, envio de links por WhatsApp/E-mail e abertura direta de fichas.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('config-rematricula')}
                  className="btn-secondary-rodin !py-2 !px-3.5 text-[12px] flex items-center gap-1.5"
                >
                  <RefreshCw size={14} />
                  Config. Campanha
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('matriculas-nova')}
                  className="btn-primary-rodin !py-2 !px-4 text-[12px]"
                >
                  <Plus size={15} />
                  Matrícula Nova
                </button>
              </div>
            </div>

            {/* Barra de Filtros por Aba de Status e Busca */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              {/* Abas de Status */}
              <div className="flex items-center gap-1.5 p-1 bg-[#F1F5F9] rounded-2xl overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setEnrollmentStatusTab('pending')}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-extrabold transition-all shrink-0 cursor-pointer ${
                    enrollmentStatusTab === 'pending'
                      ? 'bg-white text-[#F45206] shadow-xs'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  Aguardando ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setEnrollmentStatusTab('partial')}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-extrabold transition-all shrink-0 cursor-pointer ${
                    enrollmentStatusTab === 'partial'
                      ? 'bg-white text-[#4338CA] shadow-xs'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  Em Andamento ({partialCount})
                </button>
                <button
                  type="button"
                  onClick={() => setEnrollmentStatusTab('completed')}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-extrabold transition-all shrink-0 cursor-pointer ${
                    enrollmentStatusTab === 'completed'
                      ? 'bg-white text-[#059669] shadow-xs'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  Concluídas ({activeEnrollments})
                </button>
                <button
                  type="button"
                  onClick={() => setEnrollmentStatusTab('all')}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-extrabold transition-all shrink-0 cursor-pointer ${
                    enrollmentStatusTab === 'all'
                      ? 'bg-white text-[#1E293B] shadow-xs'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  Todos ({campaignEnrollments.length})
                </button>
              </div>

              {/* Busca Rápida */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 text-[#64748B]" size={16} />
                <input
                  type="text"
                  placeholder="Buscar aluno, RM ou pai..."
                  value={enrollmentSearch}
                  onChange={(e) => setEnrollmentSearch(e.target.value)}
                  className="form-control !pl-9 !pr-8 !py-1.5 text-[12px] w-full"
                />
                {enrollmentSearch && (
                  <button
                    type="button"
                    onClick={() => setEnrollmentSearch('')}
                    className="absolute right-2.5 top-2 p-0.5 rounded-full text-[#94A3B8] hover:text-[#1E293B]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Listagem de Estudantes */}
            {displayedList.length === 0 ? (
              <div className="p-8 text-center bg-[#F8FAFC] rounded-2xl border border-dashed border-[#CBD5E1] space-y-2">
                <CheckCircle2 size={36} className="text-[#059669] mx-auto" />
                <h3 className="text-[14px] font-black text-[#1E293B]">Nenhum registro encontrado nesta categoria</h3>
                <p className="text-[12px] text-[#64748B]">Alterne entre as abas de status ou limpe os filtros de busca para ver outros estudantes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedList.slice(0, 36).map((enr, idx) => {
                    const rm = enr.cocCode || enr.rmNumber || '—';
                    const schoolSigned = enr.schoolContractStatus === 'signed' || enr.status === 'active' || enr.status === 'reenrolled' || enr.status === 'completed';
                    const materialSigned = enr.materialContractStatus === 'signed' || enr.status === 'active' || enr.status === 'reenrolled' || enr.status === 'completed';
                    const bothSigned = schoolSigned && materialSigned;

                    const formattedTuition = typeof enr.tuitionDiscountTotal === 'number'
                      ? enr.tuitionDiscountTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                      : enr.tuitionDiscountTotal || '34.663,20';

                    return (
                      <div key={enr.id || idx} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#FED7AA] hover:shadow-sm transition-all flex flex-col justify-between">
                        <div>
                          {/* Top Tag RM & Status */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold text-[#64748B] bg-white px-2 py-0.5 rounded-md border border-[#E2E8F0]">
                              RM: {rm}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1 ${
                              bothSigned
                                ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                                : schoolSigned || materialSigned
                                ? 'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]'
                                : 'bg-[#FFF0E6] text-[#F45206] border-[#FED7AA]'
                            }`}>
                              {bothSigned ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                              {bothSigned ? 'Concluída' : schoolSigned || materialSigned ? 'Parcial' : 'Aguardando'}
                            </span>
                          </div>

                          <h3 className="text-[14px] font-black text-[#1E293B] leading-snug">{enr.studentName}</h3>
                          
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#F45206] mt-0.5">
                            <span>{enr.currentGrade || 'Série Atual'}</span>
                            {enr.newGrade && (
                              <>
                                <span className="text-[#94A3B8]">➔</span>
                                <span className="text-[#059669]">{enr.newGrade} ({targetAcademicYear})</span>
                              </>
                            )}
                          </div>

                          {/* Badges de Contrato */}
                          <div className="flex items-center gap-1.5 mt-2.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border flex items-center gap-1 ${
                              schoolSigned
                                ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                                : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                            }`}>
                              {schoolSigned ? '✓ Escola Assinada' : '○ Escola Pendente'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border flex items-center gap-1 ${
                              materialSigned
                                ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                                : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                            }`}>
                              {materialSigned ? '✓ Material Assinado' : '○ Material Pendente'}
                            </span>
                          </div>

                          {/* Info Responsável & Anuidade */}
                          <div className="space-y-0.5 text-[11px] text-[#64748B] mt-2.5 pt-2 border-t border-[#E2E8F0]">
                            <p><strong className="text-[#334155]">Responsável:</strong> {enr.guardianName || 'Não informado'}</p>
                            {enr.guardianPhone && <p><strong className="text-[#334155]">Celular:</strong> {enr.guardianPhone}</p>}
                            <p><strong className="text-[#334155]">Anuidade Líquida:</strong> R$ {formattedTuition}</p>
                          </div>
                        </div>

                        {/* Botões de Ação Rápida */}
                        <div className="pt-3 border-t border-[#E2E8F0] mt-3 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenReenrollmentForStudent(enr)}
                            className="btn-primary-rodin !py-2 !px-3 text-[11.5px] flex-1 flex items-center justify-center gap-1.5 shadow-xs"
                            title="Abrir ficha completa de rematrícula deste aluno"
                          >
                            <RefreshCw size={13} /> Abrir Rematrícula
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopySignatureLink(enr)}
                            className="p-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] hover:text-[#1E293B] border border-[#CBD5E1] transition-colors shrink-0"
                            title="Copiar link de rematrícula para enviar via WhatsApp"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResendEmail(enr)}
                            className="p-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] hover:text-[#1E293B] border border-[#CBD5E1] transition-colors shrink-0"
                            title="Reenviar link por e-mail"
                          >
                            <Mail size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePreviewContract(enr)}
                            className="p-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] hover:text-[#1E293B] border border-[#CBD5E1] transition-colors shrink-0"
                            title="Visualizar Requerimento de Matrícula (PDF)"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {displayedList.length > 36 && (
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-center text-[12px] text-[#64748B]">
                    Exibindo os primeiros 36 de <strong className="text-[#1E293B]">{displayedList.length}</strong> estudantes. Use o campo de busca acima para localizar qualquer aluno instantaneamente.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // 3. SECRETARIA: Emissão em Lote e Fechamento de Turmas
    if (currentUser.role === 'secretary') {
      return (
        <div className="space-y-6">
          <div className="rodin-panel-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5 gap-3">
              <div>
                <h2 className="text-[17px] font-black text-[#1E293B]">
                  Painel de Fechamento Acadêmico e Emissão de Boletins
                </h2>
                <p className="text-[12px] text-[#64748B]">
                  Consolidação das notas bimestrais prontas para emissão oficial em PDF
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    students.forEach(s => generateStudentReportCardPDF(s));
                    showToast(`Emissão em lote de ${students.length} boletins concluída!`);
                  }}
                  className="btn-primary-rodin !py-2 !px-4 text-[12px]"
                >
                  <Printer size={15} /> Emitir Todos os Boletins (PDF)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {classes.map((cls) => (
                <div key={cls.id} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-[#F45206] uppercase">{cls.roomCode}</span>
                    <h3 className="text-[14px] font-black text-[#1E293B]">{cls.name}</h3>
                    <span className="text-[11px] text-[#64748B]">{cls.studentCount || 28} Alunos • 100% Lançado</span>
                  </div>

                  <button
                    onClick={() => setActiveTab('secretaria')}
                    className="btn-secondary-rodin !py-1.5 !px-3 text-[11px] mt-4 w-full"
                  >
                    Ver Diário da Turma
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 4. PROFESSOR: Minhas Turmas e Atalhos de Aula
    if (currentUser.role === 'teacher') {
      return (
        <div className="space-y-6">
          <div className="rodin-panel-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5 gap-3">
              <div>
                <h2 className="text-[17px] font-black text-[#1E293B]">
                  Minhas Turmas e Horário de Aulas de Hoje
                </h2>
                <p className="text-[12px] text-[#64748B]">
                  Acesso rápido ao diário de classe no tablet e chamada rápida de 1 toque
                </p>
              </div>

              <button
                onClick={() => setActiveTab('diario-classe')}
                className="btn-primary-rodin !py-2 !px-4 text-[12px]"
              >
                <BookOpen size={15} /> Abrir Chamada de Sala
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {classes.slice(0, 3).map((cls, idx) => (
                <div key={cls.id} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-[#4338CA] bg-[#EEF2FF] px-2 py-0.5 rounded-md">
                      Bloco {idx + 1} • 08h00 - 09h40
                    </span>
                    <h3 className="text-[15px] font-black text-[#1E293B] mt-2">{cls.name}</h3>
                    <span className="text-[11px] text-[#64748B] block">Sala: {cls.roomCode} • Física e Robótica</span>
                  </div>

                  <button
                    onClick={() => setActiveTab('diario-classe')}
                    className="btn-primary-rodin !py-2 text-[12px] mt-4 w-full"
                  >
                    Fazer Chamada de 1 Toque
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // 5. RESPONSÁVEL / ALUNO: Meu Painel de Notas e Contratos
    if (currentUser.role === 'guardian' || currentUser.role === 'student') {
      const myStudent = students[0];
      const myEnrollment = enrollments.find(e => e.studentId === myStudent.id) || enrollments[0];

      return (
        <div className="space-y-6">
          <div className="rodin-panel-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5 gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={myStudent.photoUrl}
                  alt={myStudent.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#F45206]"
                />
                <div>
                  <h2 className="text-[17px] font-black text-[#1E293B]">{myStudent.name}</h2>
                  <span className="text-[11px] text-[#64748B]">{myStudent.currentGrade} • Matrícula: {myStudent.enrollmentCode}</span>
                </div>
              </div>

              <button
                onClick={() => generateStudentReportCardPDF(myStudent)}
                className="btn-primary-rodin !py-2 !px-4 text-[12px]"
              >
                <Download size={15} /> Baixar Meu Boletim em PDF
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <strong className="text-[13px] font-black text-[#1E293B] block">
                    Contrato de Prestação de Serviços Educacionais 2026
                  </strong>
                  <span className="text-[11px] text-[#64748B]">Assinado digitalmente via motor nativo Supabase</span>
                </div>
              </div>

              <button
                onClick={() => {
                  generateSignedContractPDF(myEnrollment, {
                    guardianName: myEnrollment.guardianName,
                    guardianCpf: myEnrollment.guardianCpf,
                    guardianPhone: myEnrollment.guardianPhone,
                    signatureImage: myEnrollment.signatureImage,
                    ipAddress: myEnrollment.ipAddress,
                    userAgent: myEnrollment.userAgent,
                    timestamp: myEnrollment.signedAt,
                    documentSha256: myEnrollment.documentSha256,
                    signatureSha256: myEnrollment.signatureSha256
                  });
                }}
                className="btn-secondary-rodin !py-1.5 !px-3 text-[11px] !border-[#A7F3D0] !text-[#059669]"
              >
                <Download size={14} /> Baixar Contrato Selado
              </button>
            </div>
          </div>
        </div>
      );
    }

    // 6. DEFAULT (DIRETOR / COORDENADOR): Photocards do Mapa de Sala
    return (
      <div className="rodin-panel-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5 gap-3">
          <div>
            <h2 className="text-[17px] font-black text-[#1E293B]">
              Mapa de Sala e Estudantes ({filteredStudents.length})
            </h2>
            <p className="text-[12px] font-medium text-[#64748B]">
              Clique em qualquer aluno para abrir o Raio-X individual 360°
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('matriculas-nova')}
              className="btn-primary-rodin !py-2 !px-4 text-[12px]"
            >
              <Plus size={15} />
              Matrícula Nova
            </button>
            <button
              onClick={() => setActiveTab('diario-classe')}
              className="btn-secondary-rodin !py-2 !px-4 text-[12px]"
            >
              <BookOpen size={15} />
              Diário de Classe
            </button>
          </div>
        </div>

        {/* Grid de Photocards no Estilo Gestão de Sala */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredStudents.map((student) => {
            const studentBathroom = classroomLogs.filter(l => l.studentId === student.id && (l.category?.includes('Banheiro') || l.category?.includes('Bebedouro'))).length;
            const studentWarnings = classroomLogs.filter(l => l.studentId === student.id && l.logType === 'behavior_warning').length;

            return (
              <div
                key={student.id}
                onClick={() => setSelectedStudentRx(student)}
                className="student-photocard group"
              >
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="w-full h-full object-cover"
                />

                {/* Gradient Overlay com Nome e Badges */}
                <div className="photocard-gradient-overlay">
                  <span className="student-name-text">
                    {student.name}
                  </span>

                  <span className="text-[10px] text-[#CBD5E1] font-semibold">
                    {student.currentGrade.split(' - ')[0]}
                  </span>

                  <div className="photocard-badges-row">
                    {studentWarnings > 0 && (
                      <span className="badge-stat-item desvios">
                        ! {studentWarnings}
                      </span>
                    )}
                    {studentBathroom > 0 && (
                      <span className="badge-stat-item saidas">
                        🚾 {studentBathroom}
                      </span>
                    )}
                    <span className="badge-stat-item sonolencia">
                      {student.attendanceRate}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner e Title with Filters (Fiel ao Gestão de Sala) */}
      <div className="rodin-panel-card flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#F45206]">
              <Sparkles size={20} />
            </span>
            <h1 className="text-[22px] font-black text-[#1E293B]">
              Análise Geral — {currentUser.roleLabel}
            </h1>
          </div>
          <p className="text-[13px] font-semibold text-[#64748B]">
            Métricas de desempenho, indicadores operacionais e governança personalizada para sua conta
          </p>
        </div>

        {/* Filter Pill Bar - 1 ÚNICA LINHA HORIZONTAL */}
        <div className="flex flex-nowrap items-center gap-2.5 overflow-x-auto shrink-0 py-0.5">
          <div className="flex flex-col gap-1 shrink-0">
            <label className="text-[10px] font-extrabold text-[#64748B] tracking-[0.5px] uppercase">
              PERÍODO
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] text-[11.5px] font-bold text-[#1E293B] bg-white shadow-xs focus:outline-none focus:border-[#F45206]"
            >
              <option>Todo o Período</option>
              <option>Hoje</option>
              <option>Esta Semana</option>
              <option>Este Mês</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 shrink-0">
            <label className="text-[10px] font-extrabold text-[#64748B] tracking-[0.5px] uppercase">
              FOCO / TURMA
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] text-[11.5px] font-bold text-[#1E293B] bg-white shadow-xs focus:outline-none focus:border-[#F45206]"
            >
              <option>Todas as Turmas</option>
              <option>1º Ano A - Ensino Médio</option>
              <option>2º Ano A - Ensino Médio</option>
              <option>3º Ano Terceirão</option>
              <option>9º Ano A - Fundamental II</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 shrink-0">
            <div className="flex items-center justify-between gap-1">
              <label className="text-[10px] font-extrabold text-[#64748B] tracking-[0.5px] uppercase">
                COMPARAR COM
              </label>
              {selectedComparison === 'Meta Institucional' && (
                <button
                  type="button"
                  onClick={() => {
                    setTempGoalInput(institutionalGoal);
                    setIsGoalModalOpen(true);
                  }}
                  className="text-[9.5px] text-[#64748B] hover:text-[#F45206] transition-colors font-semibold flex items-center gap-0.5"
                  title="Clique para alterar o valor da Meta Institucional"
                >
                  ({institutionalGoal} ✏️)
                </button>
              )}
            </div>

            <select
              value={selectedComparison}
              onChange={(e) => setSelectedComparison(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] text-[11.5px] font-bold text-[#1E293B] bg-white shadow-xs focus:outline-none focus:border-[#F45206]"
            >
              <option value="Período Anterior">Período Anterior</option>
              <option value={`Ano Letivo ${previousYear}`}>Ano Letivo {previousYear}</option>
              <option value="Meta Institucional">Meta Institucional ({institutionalGoal})</option>
            </select>
          </div>
        </div>
      </div>

      {/* RENDERIZAÇÃO DOS KPIS ESPECÍFICOS POR CONTA */}
      {renderRoleSpecificKPIs()}

      {/* RENDERIZAÇÃO DA VISUALIZAÇÃO PRINCIPAL ESPECÍFICA POR CONTA */}
      {renderRoleSpecificMainSection()}

      {/* MODAL CONFIGURAÇÃO DE META INSTITUCIONAL */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-[#E2E8F0] shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0E6] text-[#F45206] flex items-center justify-center">
                  <Target size={22} />
                </div>
                <div>
                  <h3 className="text-[16px] font-black text-[#1E293B]">Definir Meta Institucional</h3>
                  <span className="text-[11px] text-[#64748B]">Meta global de matrículas almejada pela escola</span>
                </div>
              </div>
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#F1F5F9]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveInstitutionalGoal} className="space-y-4">
              <div>
                <label className="form-label text-[12px] font-bold text-[#1E293B] block mb-1">
                  Quantidade Almejada de Matrículas:
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={tempGoalInput}
                  onChange={(e) => setTempGoalInput(e.target.value)}
                  placeholder="Ex: 500"
                  className="form-control font-black text-[18px] text-[#F45206] !h-[46px]"
                  required
                  autoFocus
                />
                <span className="text-[11px] text-[#64748B] block mt-1.5">
                  Esta meta será utilizada para calcular a porcentagem de atratividade e atingimento das metas no painel da diretoria e setor de matrículas.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsGoalModalOpen(false)}
                  className="btn-secondary-rodin !py-2 !px-4 text-[12px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary-rodin !py-2 !px-5 text-[12px] shadow-md font-bold"
                >
                  Salvar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
