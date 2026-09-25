import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Save,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';

export default function ReenrollmentSettingsPanel() {
  const { campaignConfig, updateCampaignConfig, DEFAULT_CAMPAIGN_CONFIG, setActiveTab, enrollments, students } = useApp();

  const [formState, setFormState] = useState(() => {
    return campaignConfig ? JSON.parse(JSON.stringify(campaignConfig)) : JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN_CONFIG));
  });

  const [activeTab, setActiveTabCycle] = useState('EF_6_TO_9');

  // Helpers de formatação
  const formatBRL = (val) => {
    const n = typeof val === 'number' ? val : (parseFloat(String(val).replace(/\./g, '').replace(',', '.')) || 0);
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseBRL = (val) => {
    if (typeof val === 'number') return val;
    const clean = String(val || '0').replace(/[^\d]/g, '');
    return (parseFloat(clean) || 0) / 100;
  };

  const handleCycleChange = (cycleKey, field, rawValue) => {
    setFormState(prev => {
      const currentCycle = prev.cycles[cycleKey] || {};
      return {
        ...prev,
        cycles: {
          ...prev.cycles,
          [cycleKey]: {
            ...currentCycle,
            [field]: rawValue
          }
        }
      };
    });
  };

  const handleSave = (e) => {
    e?.preventDefault();
    updateCampaignConfig(formState);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Tem certeza de que deseja restaurar os parâmetros da campanha para a tabela padrão original do Colégio Rodin?')) {
      setFormState(JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN_CONFIG)));
    }
  };

  const currentCycle = formState.cycles[activeTab] || {};
  const tuitionTotalNum = typeof currentCycle.tuitionNominalTotal === 'number' 
    ? currentCycle.tuitionNominalTotal 
    : parseBRL(currentCycle.tuitionNominalTotal);
  const tuitionCount = parseInt(currentCycle.tuitionInstallmentsCount) || 13;
  const tuitionParcelVal = tuitionCount > 0 ? (tuitionTotalNum / tuitionCount) : tuitionTotalNum;

  const matTotalNum = typeof currentCycle.materialTotalValue === 'number' 
    ? currentCycle.materialTotalValue 
    : parseBRL(currentCycle.materialTotalValue);
  const matCount = parseInt(currentCycle.materialInstallmentsCount) || 12;
  const matParcelVal = matCount > 0 ? (matTotalNum / matCount) : matTotalNum;

  // Estatísticas do colégio
  const totalStudents = students.length;
  const targetYear = formState.academicYear || 2027;

  return (
    <div className="w-full space-y-6 pb-20 animate-fadeIn max-w-5xl mx-auto">
      {/* Top Header Principal */}
      <div className="bg-[#1E293B] text-white p-6 sm:p-7 rounded-3xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F45206] text-white flex items-center justify-center shadow-lg shadow-[#F45206]/30 shrink-0">
            <Settings size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#FED7AA] bg-white/10 px-2.5 py-0.5 rounded-full">
                Gestão da Rematrícula
              </span>
              <span className="text-[11px] font-bold text-slate-300">
                • Ano Vigente: <strong className="text-white">{targetYear}</strong>
              </span>
            </div>
            <h1 className="text-[20px] sm:text-[24px] font-black leading-tight text-white mt-0.5">
              Configurações da Campanha de Rematrícula
            </h1>
            <p className="text-[12px] text-slate-300">
              Ative a campanha, defina o ano letivo alvo e parametrize valores oficiais de anuidade e material didático.
            </p>
          </div>
        </div>

        {/* Botão de Atalho para Rematrícula */}
        <button
          type="button"
          onClick={() => setActiveTab('rematricula')}
          className="btn-primary-rodin !py-2.5 !px-4 text-[12px] flex items-center gap-2 self-start md:self-auto shrink-0 shadow-sm"
        >
          <RefreshCw size={15} />
          <span>Ir para Rematrícula</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Card 1: Status da Campanha & Ano Letivo */}
      <div className="rodin-panel-card !p-5 sm:!p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9]">
          <div>
            <h2 className="text-[15px] font-black text-[#1E293B] flex items-center gap-2">
              <Calendar size={18} className="text-[#F45206]" />
              Status Operacional e Ano Letivo da Rematrícula
            </h2>
            <p className="text-[12px] text-[#64748B]">
              Controle a liberação da rematrícula e defina o ano de matrícula para novos contratos.
            </p>
          </div>

          {/* Toggle Switch Ativar/Pausar */}
          <button
            type="button"
            onClick={() => setFormState(prev => ({ ...prev, isActive: !prev.isActive }))}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-full text-[13px] font-bold border transition-all cursor-pointer shadow-xs ${
              formState.isActive
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]'
                : 'bg-[#F1F5F9] border-[#CBD5E1] text-[#64748B]'
            }`}
          >
            {formState.isActive ? <ToggleRight size={22} className="text-[#059669]" /> : <ToggleLeft size={22} className="text-[#94A3B8]" />}
            <span>{formState.isActive ? 'Campanha Ativa' : 'Campanha Pausada'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Ano Letivo Alvo */}
          <div>
            <label className="text-[11.5px] font-black uppercase text-[#475569] block mb-1.5">
              Ano Letivo da Rematrícula: *
            </label>
            <div className="relative">
              <input
                type="number"
                min="2026"
                max="2035"
                value={formState.academicYear || 2027}
                onChange={(e) => setFormState(prev => ({ ...prev, academicYear: parseInt(e.target.value) || 2027 }))}
                className="w-full text-[15px] font-black text-[#1E293B] bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-2.5 focus:bg-white focus:border-[#F45206] focus:ring-2 focus:ring-[#F45206]/20 transition-all outline-hidden"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10.5px] font-bold text-[#64748B] uppercase">
                Letivo
              </span>
            </div>
            <span className="text-[11px] text-[#94A3B8] block mt-1.5">
              Ex: 2027, 2028, 2029. Utilizado em novos contratos e requerimentos.
            </span>
          </div>

          {/* Mensagem quando desativada */}
          <div className="sm:col-span-2">
            <label className="text-[11.5px] font-black uppercase text-[#475569] block mb-1.5">
              Mensagem Informativa aos Pais e Operadores (quando pausada):
            </label>
            <input
              type="text"
              value={formState.closedMessage || ''}
              onChange={(e) => setFormState(prev => ({ ...prev, closedMessage: e.target.value }))}
              placeholder="Ex: O período de rematrícula para este ciclo está suspenso ou em preparação."
              className="w-full text-[13px] font-medium text-[#1E293B] bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-2.5 focus:bg-white focus:border-[#F45206] focus:ring-2 focus:ring-[#F45206]/20 transition-all outline-hidden"
            />
            <span className="text-[11px] text-[#94A3B8] block mt-1.5">
              Exibida caso a rematrícula seja acessada durante período de preparação ou encerramento.
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: Valores Oficiais por Ciclo Educacional */}
      <div className="rodin-panel-card !p-5 sm:!p-6 space-y-5">
        <div>
          <h2 className="text-[15px] font-black text-[#1E293B] flex items-center gap-2">
            <Layers size={18} className="text-[#F45206]" />
            Tabela de Valores Oficiais por Ciclo Educacional ({targetYear})
          </h2>
          <p className="text-[12px] text-[#64748B]">
            Configure os valores nominais padrão de anuidade e material didático para cada segmento educacional do colégio.
          </p>
        </div>

        {/* Abas dos 3 Ciclos */}
        <div className="flex flex-wrap gap-2 border-b border-[#F1F5F9] pb-3">
          {[
            { id: 'EF_6_TO_9', label: 'Ensino Fundamental II (6º ao 9º Ano)' },
            { id: 'EM_1_TO_2', label: 'Ensino Médio (1ª e 2ª Série)' },
            { id: 'TERCEIRAO', label: 'Terceirão / Pré-Vestibular (3ª Série)' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabCycle(tab.id)}
              className={`text-[12.5px] font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#FFF0E6] text-[#F45206] border border-[#F45206]/40 shadow-xs'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B] border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conteúdo do Ciclo Selecionado */}
        <div className="space-y-5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-black text-[#1E293B]">
              Segmento Selecionado: {formState.cycles[activeTab]?.cycleLabel || 'Ciclo de Ensino'}
            </span>
            <span className="text-[11px] font-bold text-[#64748B] bg-[#F1F5F9] px-3 py-1 rounded-md border border-[#E2E8F0]">
              Ciclo ID: {activeTab}
            </span>
          </div>

          {/* Anuidade Balder */}
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#1E293B] font-bold text-[13px]">
                <DollarSign size={17} className="text-[#059669]" />
                <span>Anuidade Escolar (Balder Educacional LTDA)</span>
              </div>
              <span className="text-[11px] font-semibold text-[#64748B]">
                Tabela Base {targetYear}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-black text-[#64748B] block mb-1">
                  Valor Integral Nominal (R$): *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#94A3B8]">
                    R$
                  </span>
                  <input
                    type="text"
                    value={typeof currentCycle.tuitionNominalTotal === 'number' ? formatBRL(currentCycle.tuitionNominalTotal) : currentCycle.tuitionNominalTotal}
                    onChange={(e) => {
                      const parsed = parseBRL(e.target.value);
                      handleCycleChange(activeTab, 'tuitionNominalTotal', parsed);
                    }}
                    className="w-full !pl-10 text-[14px] font-black text-[#1E293B] bg-white border border-[#CBD5E1] rounded-xl px-3 py-2.5 focus:border-[#F45206] focus:ring-2 focus:ring-[#F45206]/20 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-[#64748B] block mb-1">
                  Número de Parcelas Padrão: *
                </label>
                <select
                  value={currentCycle.tuitionInstallmentsCount || 13}
                  onChange={(e) => handleCycleChange(activeTab, 'tuitionInstallmentsCount', parseInt(e.target.value) || 13)}
                  className="w-full text-[13.5px] font-bold text-[#1E293B] bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 focus:border-[#F45206] outline-hidden cursor-pointer"
                >
                  <option value={13}>13 parcelas (Padrão Oficial Rodin)</option>
                  <option value={12}>12 parcelas mensais</option>
                  <option value={11}>11 parcelas mensais</option>
                  <option value={10}>10 parcelas mensais</option>
                  <option value={1}>1 parcela (À vista com 5% desc.)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black text-[#64748B] block mb-1">
                  Valor Mensal da Parcela Padrão:
                </label>
                <div className="w-full text-[14px] font-black text-[#059669] bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                  <span>R$ {formatBRL(tuitionParcelVal)}</span>
                  <span className="text-[11px] font-bold text-[#94A3B8]">/mês</span>
                </div>
              </div>
            </div>
          </div>

          {/* Material Didático Livraria do Pensador */}
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#1E293B] font-bold text-[13px]">
                <BookOpen size={17} className="text-[#4338CA]" />
                <span>Material Didático (Livraria do Pensador LTDA - CNPJ 43.849.399/0001-92)</span>
              </div>
              <span className="text-[11px] font-semibold text-[#64748B]">
                Kit Pedagógico {targetYear}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-black text-[#64748B] block mb-1">
                  Valor Total do Material (R$): *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#94A3B8]">
                    R$
                  </span>
                  <input
                    type="text"
                    value={typeof currentCycle.materialTotalValue === 'number' ? formatBRL(currentCycle.materialTotalValue) : currentCycle.materialTotalValue}
                    onChange={(e) => {
                      const parsed = parseBRL(e.target.value);
                      handleCycleChange(activeTab, 'materialTotalValue', parsed);
                    }}
                    className="w-full !pl-10 text-[14px] font-black text-[#1E293B] bg-white border border-[#CBD5E1] rounded-xl px-3 py-2.5 focus:border-[#4338CA] focus:ring-2 focus:ring-[#4338CA]/20 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-[#64748B] block mb-1">
                  Nº de Parcelas Material: *
                </label>
                <select
                  value={currentCycle.materialInstallmentsCount || 12}
                  onChange={(e) => handleCycleChange(activeTab, 'materialInstallmentsCount', parseInt(e.target.value) || 12)}
                  className="w-full text-[13.5px] font-bold text-[#1E293B] bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 focus:border-[#4338CA] outline-hidden cursor-pointer"
                >
                  <option value={12}>12 parcelas mensais</option>
                  <option value={10}>10 parcelas mensais</option>
                  <option value={8}>8 parcelas mensais</option>
                  <option value={6}>6 parcelas mensais</option>
                  <option value={1}>1 parcela (À vista)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black text-[#64748B] block mb-1">
                  Valor Mensal Parcela Material:
                </label>
                <div className="w-full text-[14px] font-black text-[#4338CA] bg-white border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                  <span>R$ {formatBRL(matParcelVal)}</span>
                  <span className="text-[11px] font-bold text-[#94A3B8]">/mês</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé do Painel com Ações de Salvamento */}
        <div className="pt-4 border-t border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-[12px] font-bold text-[#64748B] hover:text-[#DC2626] flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw size={15} /> Restaurar Tabela Padrão 2027
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="btn-primary-rodin !py-3 !px-6 text-[13px] font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#F45206]/20 cursor-pointer"
          >
            <Save size={16} /> Salvar Parâmetros da Campanha
          </button>
        </div>
      </div>
    </div>
  );
}
