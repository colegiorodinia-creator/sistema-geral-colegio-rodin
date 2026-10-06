import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { computeDashboardMetrics, RODIN_SERIES_LIST, DEFAULT_CAPACITIES, getStudentsByGrade } from '../../lib/dashboardMetrics';
import {
  RefreshCw,
  UserPlus,
  Target,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Search,
  BarChart3,
  GraduationCap,
  X,
  Percent,
  Tag,
  Check,
  Clock,
  UserCheck,
  SlidersHorizontal,
  Edit3,
  Save,
  RotateCcw
} from 'lucide-react';

export default function GeneralDashboard() {
  const {
    currentUser,
    students = [],
    enrollments = [],
    classes = [],
    setActiveTab,
    showToast,
    campaignConfig
  } = useApp();

  // Filtros
  const [selectedGrade, setSelectedGrade] = useState('Todas as Séries');
  const [selectedPeriodSegment, setSelectedPeriodSegment] = useState('Todos os Segmentos');
  const [comparisonTimeMode, setComparisonTimeMode] = useState('30_dias');


  // Período Personalizado
  const defaultCustomStart = '2026-09-01';
  const defaultCustomEnd = '2026-10-05';
  const [customStartDate, setCustomStartDate] = useState(defaultCustomStart);
  const [customEndDate, setCustomEndDate] = useState(defaultCustomEnd);
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);

  // Busca na tabela
  const [tableSearchQuery, setTableSearchQuery] = useState('');

  // Capacidades das Séries (Base padrão da escola com suporte a alteração e persistência)
  const [seriesCapacities, setSeriesCapacities] = useState(() => {
    try {
      const saved = localStorage.getItem('rodin_series_capacities');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return { ...DEFAULT_CAPACITIES, ...parsed };
      }
    } catch (e) {}
    return DEFAULT_CAPACITIES;
  });

  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState(null);
  const [tempCapacities, setTempCapacities] = useState({ ...DEFAULT_CAPACITIES });

  const openCapacityModal = (seriesId = null) => {
    setTempCapacities({ ...seriesCapacities });
    setEditingSeries(seriesId);
    setIsCapacityModalOpen(true);
  };

  const handleSaveCapacities = () => {
    setSeriesCapacities(tempCapacities);
    try {
      localStorage.setItem('rodin_series_capacities', JSON.stringify(tempCapacities));
    } catch (e) {}
    setIsCapacityModalOpen(false);
    setEditingSeries(null);
    if (showToast) showToast('Capacidade das turmas atualizada com sucesso!');
  };

  const handleResetCapacities = () => {
    setTempCapacities({ ...DEFAULT_CAPACITIES });
  };

  const totalCapacitySum = useMemo(() => {
    return Object.values(seriesCapacities).reduce((acc, val) => acc + (Number(val) || 0), 0);
  }, [seriesCapacities]);

  const targetAcademicYear = campaignConfig?.academicYear || 2027;

  // Cálculo das Métricas
  const metrics = useMemo(() => {
    return computeDashboardMetrics({
      enrollments,
      students,
      classes,
      selectedGrade,
      selectedPeriodSegment,
      comparisonTimeMode,
      customStartDate,
      customEndDate,
      institutionalGoal: totalCapacitySum,
      seriesCapacities,
      referenceDate: new Date()
    });
  }, [
    enrollments,
    students,
    classes,
    selectedGrade,
    selectedPeriodSegment,
    comparisonTimeMode,
    customStartDate,
    customEndDate,
    totalCapacitySum,
    seriesCapacities
  ]);

  const { kpi1, kpi2, kpi3, kpiDiscount, seriesBreakdown, isSixthGradeSelected } = metrics;

  const filteredSeries = useMemo(() => {
    return seriesBreakdown.filter(s => {
      if (selectedGrade !== 'Todas as Séries' && s.name !== selectedGrade) {
        return false;
      }
      if (selectedPeriodSegment !== 'Todos os Segmentos' && !s.level.includes(selectedPeriodSegment.replace(/\s*\(.*\)/, ''))) {
        return false;
      }
      if (tableSearchQuery.trim()) {
        const q = tableSearchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.level.toLowerCase().includes(q);
      }
      return true;
    });
  }, [seriesBreakdown, selectedGrade, selectedPeriodSegment, tableSearchQuery]);

  // -------------------------------------------------------------
  // VISÃO INDIVIDUAL DA TURMA SELECIONADA (APENAS QUANDO UMA TURMA É SELECIONADA)
  // -------------------------------------------------------------
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('all'); // 'all' | 'confirmed' | 'pending' | 'lp'

  const gradeStudents = useMemo(() => {
    if (selectedGrade === 'Todas as Séries' || selectedGrade === 'Todas as Turmas') {
      return [];
    }
    return getStudentsByGrade(selectedGrade, students, enrollments);
  }, [selectedGrade, students, enrollments]);

  const gradeConfirmedCount = useMemo(() => gradeStudents.filter(s => s.isConfirmed).length, [gradeStudents]);
  const gradePendingCount = useMemo(() => gradeStudents.filter(s => !s.isConfirmed).length, [gradeStudents]);
  const gradeLPCount = useMemo(() => gradeStudents.filter(s => s.isLePerini).length, [gradeStudents]);

  const filteredGradeStudents = useMemo(() => {
    return gradeStudents.filter(st => {
      if (studentStatusFilter === 'confirmed' && !st.isConfirmed) return false;
      if (studentStatusFilter === 'pending' && st.isConfirmed) return false;
      if (studentStatusFilter === 'lp' && !st.isLePerini) return false;

      if (studentSearchQuery.trim()) {
        const q = studentSearchQuery.toLowerCase();
        return st.name.toLowerCase().includes(q) || String(st.rm).includes(q);
      }
      return true;
    });
  }, [gradeStudents, studentStatusFilter, studentSearchQuery]);

  const getComparisonLabel = () => {
    switch (comparisonTimeMode) {
      case 'ano_anterior':
        return 'vs 2026';
      case '90_dias':
        return 'vs 90d atrás';
      case '30_dias':
        return 'vs 30d atrás';
      case '15_dias':
        return 'vs 15d atrás';
      case '7_dias':
        return 'vs 7d atrás';
      case 'personalizado':
        return 'vs anterior';
      default:
        return 'vs anterior';
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* ========================================================= */}
      {/* 1. CABEÇALHO LIMPO E FILTROS */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] shadow-xs flex flex-col gap-5">
        <div className="pb-4 border-b border-[#F1F5F9]">
          <h1 className="text-[20px] sm:text-[22px] font-black text-[#1E293B] tracking-tight uppercase">
            PAINEL GERAL
          </h1>
        </div>

        {/* Linha de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* FILTRO 1: POR SÉRIE */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide flex items-center gap-1">
              <GraduationCap size={12} className="text-[#F45206]" />
              Série
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] bg-white text-[12px] font-bold text-[#1E293B] focus:outline-none focus:border-[#F45206]"
            >
              <option value="Todas as Séries">Todas as Séries</option>
              <optgroup label="Ensino Fundamental II">
                <option value="6º Ano EF">6º Ano EF (Apenas Novos)</option>
                <option value="7º Ano EF">7º Ano EF</option>
                <option value="8º Ano EF">8º Ano EF</option>
                <option value="9º Ano EF">9º Ano EF</option>
              </optgroup>
              <optgroup label="Ensino Médio">
                <option value="1ª Série EM">1ª Série EM</option>
                <option value="2ª Série EM">2ª Série EM</option>
                <option value="3ª Série EM (Terceirão)">3ª Série EM (Terceirão)</option>
              </optgroup>
            </select>
          </div>

          {/* FILTRO 2: POR SEGMENTO */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide flex items-center gap-1">
              <Layers size={12} className="text-[#F45206]" />
              Segmento
            </label>
            <select
              value={selectedPeriodSegment}
              onChange={(e) => setSelectedPeriodSegment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] bg-white text-[12px] font-bold text-[#1E293B] focus:outline-none focus:border-[#F45206]"
            >
              <option value="Todos os Segmentos">Todos os Segmentos</option>
              <option value="Ensino Fundamental II">Ensino Fundamental II (6º ao 9º)</option>
              <option value="Ensino Médio">Ensino Médio (1ª a 3ª Série)</option>
            </select>
          </div>

          {/* FILTRO 3: COMPARAÇÃO POR TEMPO */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide flex items-center gap-1">
                <Calendar size={12} className="text-[#F45206]" />
                Comparar com
              </label>
              {comparisonTimeMode === 'personalizado' && (
                <button
                  type="button"
                  onClick={() => setIsCustomDateOpen(!isCustomDateOpen)}
                  className="text-[10px] font-bold text-[#F45206]"
                >
                  {isCustomDateOpen ? 'Fechar' : 'Datas'}
                </button>
              )}
            </div>

            <select
              value={comparisonTimeMode}
              onChange={(e) => {
                setComparisonTimeMode(e.target.value);
                if (e.target.value === 'personalizado') {
                  setIsCustomDateOpen(true);
                } else {
                  setIsCustomDateOpen(false);
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] bg-white text-[12px] font-bold text-[#1E293B] focus:outline-none focus:border-[#F45206]"
            >
              <option value="ano_anterior">Ano Anterior (2026)</option>
              <option value="90_dias">Últimos 3 Meses</option>
              <option value="30_dias">Últimos 30 Dias</option>
              <option value="15_dias">Últimos 15 Dias</option>
              <option value="7_dias">Últimos 7 Dias</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>
        </div>

        {/* Inputs de Data Personalizada */}
        {comparisonTimeMode === 'personalizado' && isCustomDateOpen && (
          <div className="p-3 rounded-xl bg-[#FFF7ED] border border-[#FED7AA] flex items-center gap-3 text-[12px]">
            <span className="font-bold text-[#7C2D12]">De:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-[#FED7AA] font-bold bg-white text-[#1E293B]"
            />
            <span className="font-bold text-[#7C2D12]">Até:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-[#FED7AA] font-bold bg-white text-[#1E293B]"
            />
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. OS 4 KPIS DIRETOS, LIMPOS E SEM POLUIÇÃO */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: % DE ALUNOS REMATRICULADOS */}
        <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FFF0E6] text-[#F45206] flex items-center justify-center">
                <RefreshCw size={18} className="stroke-[2.2]" />
              </div>
            </div>

            {isSixthGradeSelected ? (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[28px] font-black text-[#94A3B8] leading-none">
                    —
                  </span>
                </div>
                <h3 className="text-[12px] font-extrabold text-[#94A3B8] mt-2 uppercase tracking-wide">
                  % Rematriculados
                </h3>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[28px] font-black text-[#1E293B] leading-none">
                    {kpi1.rate}%
                  </span>
                  <span className="text-[11px] font-bold text-[#64748B]">
                    ({kpi1.confirmedCount}/{kpi1.totalEligible})
                  </span>
                </div>
                <h3 className="text-[12px] font-extrabold text-[#64748B] mt-2 uppercase tracking-wide">
                  % Rematriculados
                </h3>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#F1F5F9]">
            <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden mb-1.5">
              <div
                className="h-full rounded-full bg-[#F45206]"
                style={{
                  width: `${isSixthGradeSelected ? 0 : Math.min(100, kpi1.rate)}%`
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#64748B]">
              <span>
                {isSixthGradeSelected ? 'Inicia no 7º ano' : `${getComparisonLabel()} (${kpi1.prevRate}%)`}
              </span>
              {!isSixthGradeSelected && (
                <span className="font-bold text-[#059669]">+{kpi1.delta}%</span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 2: ALUNOS NOVOS */}
        <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                <UserPlus size={18} className="stroke-[2.2]" />
              </div>

              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                {kpi2.isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                +{kpi2.delta}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-black text-[#1E293B] leading-none">
                  {kpi2.count}
                </span>
                <span className="text-[11px] font-bold text-[#059669]">
                  Alunos
                </span>
              </div>

              <h3 className="text-[12px] font-extrabold text-[#64748B] mt-2 uppercase tracking-wide">
                Alunos Novos
              </h3>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between text-[10px] text-[#64748B]">
            <span>{getComparisonLabel()} ({kpi2.prevCount})</span>
            {isSixthGradeSelected ? (
              <span className="font-bold text-[#4338CA]">{kpi2.lpCount} Le Perini • {kpi2.regularCount} Gerais</span>
            ) : (
              <span className="font-bold text-[#059669]">Novos Ingressantes</span>
            )}
          </div>
        </div>

        {/* KPI 3: META GLOBAL / VAGAS (SEM RECEITA CONTRATADA) */}
        <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center">
                <Target size={18} className="stroke-[2.2]" />
              </div>

              <span className="text-[11px] font-black text-[#4338CA] bg-[#EEF2FF] px-2 py-0.5 rounded-full border border-[#C7D2FE]">
                {kpi3.achievementRate}% da Meta
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-black text-[#1E293B] leading-none">
                  {kpi3.totalConfirmed}
                </span>
                <span className="text-[11px] font-bold text-[#64748B]">
                  / {kpi3.goal} vagas
                </span>
              </div>

              <h3 className="text-[12px] font-extrabold text-[#64748B] mt-2 uppercase tracking-wide">
                Meta de Alunos
              </h3>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#F1F5F9]">
            <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden mb-1.5">
              <div
                className="bg-[#4338CA] h-full rounded-full"
                style={{ width: `${Math.min(100, kpi3.achievementRate)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#64748B]">
              <span>{getComparisonLabel()} ({kpi3.prevAchievementRate}%)</span>
              <span className="font-bold text-[#1E293B]">{kpi3.remainingVacancies} vagas livres</span>
            </div>
          </div>
        </div>

        {/* KPI 4: MÉDIA DE DESCONTO */}
        <div className="bg-white border border-[#E2E8F0] p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center">
                <Percent size={18} className="stroke-[2.2]" />
              </div>

              <span className="text-[10px] font-bold bg-[#FFFBEB] text-[#B45309] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                {kpiDiscount.delta <= 0 ? '▼' : '▲'} {Math.abs(kpiDiscount.delta)}%
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] font-black text-[#1E293B] leading-none">
                  {kpiDiscount.avgRate}%
                </span>
                <span className="text-[11px] font-bold text-[#D97706]">
                  Média Geral
                </span>
              </div>

              <h3 className="text-[12px] font-extrabold text-[#64748B] mt-2 uppercase tracking-wide">
                Desconto Médio na Anuidade
              </h3>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between text-[10px]">
            <span className="font-bold text-[#4338CA]">Le Perini: {kpiDiscount.avgLP}%</span>
            <span className="font-semibold text-[#64748B]">Geral: {kpiDiscount.avgRegular}%</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. BARRA DE COMPOSIÇÃO DAS MATRÍCULAS (LIMPA E DIRETA) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-[13px] font-black text-[#1E293B] uppercase tracking-wide flex items-center gap-2">
            <BarChart3 size={16} className="text-[#F45206]" />
            Composição das Matrículas
          </h2>

          {/* Legenda Direta */}
          <div className="flex items-center flex-wrap gap-3 text-[11px] font-bold">
            {isSixthGradeSelected ? (
              <>
                <span className="flex items-center gap-1.5 text-[#4338CA]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4338CA]" /> Novos Le Perini ({kpi1.lpCount})
                </span>
                <span className="flex items-center gap-1.5 text-[#059669]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" /> Novos Gerais ({kpi1.regularCount})
                </span>
                <span className="flex items-center gap-1.5 text-[#64748B]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]" /> Vagas Livres ({kpi3.remainingVacancies})
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5 text-[#1E293B]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F45206]" /> Rematrícula ({kpi1.regularCount})
                </span>
                <span className="flex items-center gap-1.5 text-[#4338CA]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4338CA]" /> Le Perini ({kpi1.lpCount})
                </span>
                <span className="flex items-center gap-1.5 text-[#059669]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" /> Alunos Novos ({kpi2.count})
                </span>
                <span className="flex items-center gap-1.5 text-[#64748B]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]" /> Vagas Livres ({kpi3.remainingVacancies})
                </span>
              </>
            )}
          </div>
        </div>

        {/* Barra Proporcional */}
        <div className="w-full h-7 rounded-xl overflow-hidden flex bg-[#F1F5F9] shadow-inner p-0.5 gap-0.5">
          {isSixthGradeSelected ? (
            <>
              <div
                className="bg-[#4338CA] rounded-lg flex items-center justify-center text-white text-[11px] font-black transition-all"
                style={{ width: `${kpi3.goal > 0 ? (kpi1.lpCount / kpi3.goal) * 100 : 0}%` }}
                title={`Novos Le Perini: ${kpi1.lpCount}`}
              >
                {kpi1.lpCount > 25 && `${kpi1.lpCount} Le Perini`}
              </div>

              <div
                className="bg-[#059669] rounded-lg flex items-center justify-center text-white text-[11px] font-black transition-all"
                style={{ width: `${kpi3.goal > 0 ? (kpi1.regularCount / kpi3.goal) * 100 : 0}%` }}
                title={`Novos Gerais: ${kpi1.regularCount}`}
              >
                {kpi1.regularCount > 20 && `${kpi1.regularCount} Gerais`}
              </div>

              <div
                className="bg-[#E2E8F0] rounded-lg flex items-center justify-center text-[#64748B] text-[11px] font-bold transition-all"
                style={{ width: `${kpi3.goal > 0 ? (kpi3.remainingVacancies / kpi3.goal) * 100 : 0}%` }}
                title={`Vagas Livres: ${kpi3.remainingVacancies}`}
              >
                {kpi3.remainingVacancies > 10 && `${kpi3.remainingVacancies} livres`}
              </div>
            </>
          ) : (
            <>
              <div
                className="bg-[#F45206] rounded-lg flex items-center justify-center text-white text-[11px] font-black transition-all"
                style={{ width: `${kpi3.goal > 0 ? (kpi1.regularCount / kpi3.goal) * 100 : 0}%` }}
                title={`Rematriculados Gerais: ${kpi1.regularCount}`}
              >
                {kpi1.regularCount > 40 && `${kpi1.regularCount}`}
              </div>

              <div
                className="bg-[#4338CA] rounded-lg flex items-center justify-center text-white text-[11px] font-black transition-all"
                style={{ width: `${kpi3.goal > 0 ? (kpi1.lpCount / kpi3.goal) * 100 : 0}%` }}
                title={`Le Perini: ${kpi1.lpCount}`}
              >
                {kpi1.lpCount > 35 && `${kpi1.lpCount}`}
              </div>

              <div
                className="bg-[#059669] rounded-lg flex items-center justify-center text-white text-[11px] font-black transition-all"
                style={{ width: `${kpi3.goal > 0 ? (kpi2.count / kpi3.goal) * 100 : 0}%` }}
                title={`Novos: ${kpi2.count}`}
              >
                {kpi2.count > 25 && `${kpi2.count}`}
              </div>

              <div
                className="bg-[#E2E8F0] rounded-lg flex items-center justify-center text-[#64748B] text-[11px] font-bold transition-all"
                style={{ width: `${kpi3.goal > 0 ? (kpi3.remainingVacancies / kpi3.goal) * 100 : 0}%` }}
                title={`Vagas Livres: ${kpi3.remainingVacancies}`}
              >
                {kpi3.remainingVacancies > 30 && `${kpi3.remainingVacancies} livres`}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. QUADRO POR SÉRIE (ENXUTO E DIRETO) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-[13px] font-black text-[#1E293B] uppercase tracking-wide flex items-center gap-2">
            <GraduationCap size={16} className="text-[#F45206]" />
            Ocupação por Série
          </h2>

          <div className="flex items-center gap-2.5">
            <div className="relative w-48">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Buscar série..."
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-[#CBD5E1] text-[11.5px] bg-white text-[#1E293B] focus:outline-none focus:border-[#F45206]"
              />
            </div>

            <button
              type="button"
              onClick={() => openCapacityModal()}
              className="px-3 py-1.5 rounded-lg bg-[#FFF0E6] hover:bg-[#FFE0CC] border border-[#FDBA74] text-[11.5px] font-extrabold text-[#F45206] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              title="Alterar a capacidade de alunos de cada série/turma"
            >
              <SlidersHorizontal size={13} />
              <span>Alterar Capacidade</span>
            </button>
          </div>
        </div>

        {/* Tabela de Séries */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[10.5px] font-black text-[#64748B] uppercase tracking-wider">
                <th className="py-2.5 px-3">Série / Ano</th>
                <th className="py-2.5 px-3 text-center">Rematriculados</th>
                <th className="py-2.5 px-3 text-center">Alunos Novos</th>
                <th className="py-2.5 px-3 text-center">Total</th>
                <th className="py-2.5 px-3 text-center">Capacidade</th>
                <th className="py-2.5 px-3 text-center">Desconto Médio</th>
                <th className="py-2.5 px-3 text-right">Ocupação (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-[12px]">
              {filteredSeries.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#FFFBF7] transition-colors cursor-pointer group"
                  onClick={() => setSelectedGrade(item.name)}
                >
                  <td className="py-2.5 px-3 font-extrabold text-[#1E293B]">
                    {item.name}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    {item.isNewOnly ? (
                      <span className="text-[10px] font-bold text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded">
                        Inicia no 7º Ano
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 font-bold">
                        <span className="text-[#F45206]">{item.reenrolledCount}</span>
                        <span className="text-[10px] text-[#4338CA] bg-[#EEF2FF] px-1.5 py-0.2 rounded font-extrabold">
                          {item.reenrolledLPCount} Le Perini
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-center font-bold text-[#059669]">
                    <div className="inline-flex items-center justify-center gap-1.5 font-bold">
                      <span>{item.newCount}</span>
                      {item.newLPCount > 0 && (
                        <span className="text-[10px] text-[#4338CA] bg-[#EEF2FF] px-1.5 py-0.2 rounded font-extrabold">
                          {item.newLPCount} Le Perini
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 text-center font-black text-[#1E293B]">
                    {item.totalConfirmed}
                  </td>

                  <td 
                    className="py-2.5 px-3 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCapacityModal(item.id);
                    }}
                  >
                    <span 
                      className="inline-flex items-center gap-1 font-bold text-[#1E293B] hover:text-[#F45206] hover:bg-[#FFF6F0] px-2 py-0.5 rounded-md transition-colors cursor-pointer border border-transparent hover:border-[#FDBA74]" 
                      title="Clique para alterar a capacidade desta turma"
                    >
                      <span>{item.capacity}</span>
                      <Edit3 size={11} className="text-[#94A3B8] group-hover:text-[#F45206] opacity-60 group-hover:opacity-100" />
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center font-bold text-[#D97706]">
                    {item.avgDiscount}%
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-14 bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.occupancyRate >= 95
                              ? 'bg-[#DC2626]'
                              : item.occupancyRate >= 80
                              ? 'bg-[#EA580C]'
                              : 'bg-[#059669]'
                          }`}
                          style={{ width: `${item.occupancyRate}%` }}
                        />
                      </div>
                      <span className="font-extrabold text-[11px] text-[#1E293B] w-7 text-right">
                        {item.occupancyRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. VISÃO INDIVIDUAL DA TURMA: QUEM ESTÁ MATRICULADO E QUEM NÃO ESTÁ */}
      {/* (EXIBIDA ESTRITAMENTE QUANDO UMA SÉRIE/TURMA ESPECÍFICA ESTIVER SELECIONADA) */}
      {/* ========================================================= */}
      {selectedGrade !== 'Todas as Séries' && selectedGrade !== 'Todas as Turmas' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] shadow-xs space-y-4 animate-fadeIn">
          {/* Topo da Seção com Título, Badges e Botão de Limpar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 rounded-xl bg-[#FFF0E6] text-[#F45206] flex items-center justify-center">
                <UserCheck size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[14px] sm:text-[15px] font-black text-[#1E293B] uppercase tracking-wide">
                    Alunos da Turma — {selectedGrade}
                  </h2>
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0E6] text-[#F45206] border border-[#FED7AA]">
                    {gradeStudents.length} alunos
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Acompanhamento individual de quem já confirmou matrícula e quem ainda está pendente nesta série
                </p>
              </div>
            </div>
          </div>

          {/* Cards Resumidos de Status da Turma */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0]">
              <span className="text-[10px] font-extrabold uppercase text-[#047857] block">
                Matriculados
              </span>
              <span className="text-[20px] font-black text-[#065F46] leading-none">
                {gradeConfirmedCount}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
              <span className="text-[10px] font-extrabold uppercase text-[#B45309] block">
                Não Matriculados / Pendentes
              </span>
              <span className="text-[20px] font-black text-[#92400E] leading-none">
                {gradePendingCount}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE]">
              <span className="text-[10px] font-extrabold uppercase text-[#4338CA] block">
                Le Perini
              </span>
              <span className="text-[20px] font-black text-[#3730A3] leading-none">
                {gradeLPCount}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="text-[10px] font-extrabold uppercase text-[#64748B] block">
                Total da Turma
              </span>
              <span className="text-[20px] font-black text-[#1E293B] leading-none">
                {gradeStudents.length}
              </span>
            </div>
          </div>

          {/* Barra de Filtros Rápidos e Campo de Busca */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            {/* Pílulas de Filtro */}
            <div className="flex items-center flex-wrap gap-1 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setStudentStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  studentStatusFilter === 'all'
                    ? 'bg-white text-[#1E293B] shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E293B]'
                }`}
              >
                Todos ({gradeStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setStudentStatusFilter('confirmed')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                  studentStatusFilter === 'confirmed'
                    ? 'bg-[#059669] text-white shadow-xs'
                    : 'text-[#059669] hover:bg-[#ECFDF5]'
                }`}
              >
                <span>Matriculados</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${studentStatusFilter === 'confirmed' ? 'bg-white/20' : 'bg-[#D1FAE5]'}`}>
                  {gradeConfirmedCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setStudentStatusFilter('pending')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                  studentStatusFilter === 'pending'
                    ? 'bg-[#D97706] text-white shadow-xs'
                    : 'text-[#D97706] hover:bg-[#FFFBEB]'
                }`}
              >
                <span>Pendentes</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${studentStatusFilter === 'pending' ? 'bg-white/20' : 'bg-[#FEF3C7]'}`}>
                  {gradePendingCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setStudentStatusFilter('lp')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                  studentStatusFilter === 'lp'
                    ? 'bg-[#4338CA] text-white shadow-xs'
                    : 'text-[#4338CA] hover:bg-[#EEF2FF]'
                }`}
              >
                <span>Le Perini</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${studentStatusFilter === 'lp' ? 'bg-white/20' : 'bg-[#E0E7FF]'}`}>
                  {gradeLPCount}
                </span>
              </button>
            </div>

            {/* Campo de Busca Rápida por Nome ou RM */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Buscar aluno ou RM..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#CBD5E1] text-[11.5px] bg-white text-[#1E293B] focus:outline-none focus:border-[#F45206]"
              />
              {studentSearchQuery && (
                <button
                  type="button"
                  onClick={() => setStudentSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#1E293B]"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Tabela de Alunos da Turma */}
          <div className="overflow-x-auto custom-scrollbar border border-[#E2E8F0] rounded-xl max-h-[500px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[#F8FAFC] z-10">
                <tr className="border-b border-[#E2E8F0] text-[10.5px] font-black text-[#64748B] uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Aluno</th>
                  <th className="py-2.5 px-3 text-center">RM</th>
                  <th className="py-2.5 px-3 text-center">Origem</th>
                  <th className="py-2.5 px-3 text-center">Desconto</th>
                  <th className="py-2.5 px-3 text-right">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-[12px]">
                {filteredGradeStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#64748B] font-bold text-[12px]">
                      Nenhum aluno encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredGradeStudents.map((st) => (
                    <tr
                      key={st.id}
                      className={`transition-colors hover:bg-[#FFFBF7] ${
                        !st.isConfirmed ? 'bg-[#FFFDF9]' : ''
                      }`}
                    >
                      {/* Nome */}
                      <td className="py-2.5 px-3.5">
                        <span className="font-extrabold text-[#1E293B] block">
                          {st.name}
                        </span>
                      </td>

                      {/* RM */}
                      <td className="py-2.5 px-3 text-center font-bold text-[#64748B] text-[11px]">
                        {st.rm}
                      </td>

                      {/* Origem */}
                      <td className="py-2.5 px-3 text-center">
                        {st.isLePerini ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]">
                            Le Perini
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#F1F5F9] text-[#64748B]">
                            Geral
                          </span>
                        )}
                      </td>

                      {/* Desconto */}
                      <td className="py-2.5 px-3 text-center font-bold text-[#D97706] text-[11.5px]">
                        {st.discountPercentage > 0 ? `${st.discountPercentage}%` : '—'}
                      </td>

                      {/* Status: Matriculado vs Pendente */}
                      <td className="py-2.5 px-3 text-right">
                        {st.isConfirmed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                            <Check size={11} className="stroke-[3]" />
                            <span>{st.statusLabel}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                            <Clock size={11} className="stroke-[2.5]" />
                            <span>Não Matriculado</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE ALTERAÇÃO DE CAPACIDADE DAS TURMAS */}
      {isCapacityModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E2E8F0] overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-[#F1F5F9] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FFF0E6] text-[#F45206] flex items-center justify-center">
                  <SlidersHorizontal size={16} />
                </div>
                <div>
                  <h3 className="text-[14px] font-black text-[#1E293B] uppercase tracking-wide">
                    Alterar Capacidade das Turmas
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Defina o número máximo de vagas por série/turma
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCapacityModalOpen(false)}
                className="p-1.5 text-[#94A3B8] hover:text-[#1E293B] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {RODIN_SERIES_LIST.map((series) => {
                const isSelected = editingSeries === series.id;
                return (
                  <div
                    key={series.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isSelected ? 'border-[#F45206] bg-[#FFFBF7] ring-2 ring-[#F45206]/20' : 'border-[#E2E8F0] bg-white'
                    }`}
                  >
                    <div>
                      <span className="text-[12px] font-black text-[#1E293B] block">
                        {series.name}
                      </span>
                      <span className="text-[10px] font-medium text-[#64748B]">
                        {series.level}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={tempCapacities[series.id] || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setTempCapacities(prev => ({
                            ...prev,
                            [series.id]: isNaN(val) ? '' : val
                          }));
                        }}
                        className="w-20 px-2.5 py-1.5 rounded-lg border border-[#CBD5E1] text-[13px] font-black text-[#1E293B] text-center focus:outline-none focus:border-[#F45206]"
                        autoFocus={isSelected}
                      />
                      <span className="text-[11px] font-bold text-[#64748B]">
                        vagas
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className="pt-2 flex items-center justify-between text-[11px] text-[#64748B] border-t border-[#F1F5F9]">
                <span>Total de Vagas da Escola:</span>
                <span className="text-[13px] font-black text-[#1E293B]">
                  {Object.values(tempCapacities).reduce((acc, v) => acc + (Number(v) || 0), 0)} vagas
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#F8FAFC] border-t border-[#F1F5F9] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleResetCapacities}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#64748B] hover:text-[#1E293B] hover:bg-[#E2E8F0] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Restaurar Padrão</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCapacityModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-[11.5px] font-bold text-[#64748B] hover:text-[#1E293B] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCapacities}
                  className="px-4 py-1.5 rounded-lg bg-[#F45206] hover:bg-[#D94100] text-white text-[11.5px] font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={13} />
                  <span>Salvar Capacidades</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
