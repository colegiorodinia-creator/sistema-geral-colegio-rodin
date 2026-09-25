import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Settings,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  DollarSign,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Save
} from 'lucide-react';

export default function ReenrollmentSettingsModal({ isOpen, onClose }) {
  const { campaignConfig, updateCampaignConfig, DEFAULT_CAMPAIGN_CONFIG } = useApp();

  const [formState, setFormState] = useState(() => {
    return campaignConfig ? JSON.parse(JSON.stringify(campaignConfig)) : JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN_CONFIG));
  });

  const [activeTab, setActiveTab] = useState('EF_6_TO_9');

  if (!isOpen) return null;

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
    onClose();
  };

  const handleResetToDefault = () => {
    if (window.confirm('Tem certeza de que deseja restaurar os parâmetros da campanha para a tabela padrão original?')) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] text-white flex items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#F45206] text-white flex items-center justify-center shadow-lg shadow-[#F45206]/30">
              <Settings size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-black tracking-tight text-white">
                  Configurações da Campanha de Rematrícula
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  Direção & Admin
                </span>
              </div>
              <p className="text-[11.5px] text-slate-400 font-medium">
                Ative a rematrícula, defina o ano letivo alvo e parametrize valores de anuidade e material didático.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 custom-scrollbar bg-[#F8FAFC]">
          {/* Card 1: Chave Geral da Campanha & Ano Letivo */}
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
              <div>
                <strong className="text-[13.5px] font-black text-[#1E293B] flex items-center gap-2">
                  <Calendar size={16} className="text-[#F45206]" />
                  Status Operacional da Rematrícula
                </strong>
                <p className="text-[11.5px] text-[#64748B]">
                  Controle a abertura da rematrícula e defina para qual ano letivo os alunos serão rematriculados.
                </p>
              </div>

              {/* Toggle Switch Ativar/Pausar */}
              <button
                type="button"
                onClick={() => setFormState(prev => ({ ...prev, isActive: !prev.isActive }))}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-all cursor-pointer ${
                  formState.isActive
                    ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]'
                    : 'bg-[#F1F5F9] border-[#CBD5E1] text-[#64748B]'
                }`}
              >
                {formState.isActive ? <ToggleRight size={20} className="text-[#059669]" /> : <ToggleLeft size={20} className="text-[#94A3B8]" />}
                <span>{formState.isActive ? 'Campanha Ativa' : 'Campanha Pausada'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Ano Letivo Alvo */}
              <div>
                <label className="text-[11px] font-black uppercase text-[#475569] block mb-1">
                  Ano Letivo Alvo: *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="2026"
                    max="2035"
                    value={formState.academicYear || 2027}
                    onChange={(e) => setFormState(prev => ({ ...prev, academicYear: parseInt(e.target.value) || 2027 }))}
                    className="w-full text-[14px] font-black text-[#1E293B] bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-[#F45206] focus:ring-2 focus:ring-[#F45206]/20 transition-all outline-hidden"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#64748B] uppercase">
                    Letivo
                  </span>
                </div>
                <span className="text-[10px] text-[#94A3B8] block mt-1">
                  Ex: 2027, 2028 ou 2029
                </span>
              </div>

              {/* Mensagem quando desativada */}
              <div className="sm:col-span-2">
                <label className="text-[11px] font-black uppercase text-[#475569] block mb-1">
                  Mensagem aos Pais/Operadores (quando pausada):
                </label>
                <input
                  type="text"
                  value={formState.closedMessage || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, closedMessage: e.target.value }))}
                  placeholder="Ex: O período de rematrícula para este ciclo está suspenso."
                  className="w-full text-[12px] font-medium text-[#1E293B] bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2.5 focus:bg-white focus:border-[#F45206] focus:ring-2 focus:ring-[#F45206]/20 transition-all outline-hidden"
                />
                <span className="text-[10px] text-[#94A3B8] block mt-1">
                  Exibida caso o portal ou módulo seja acessado durante pausa
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Valores Padrões de Anuidade e Material Didático por Ciclo */}
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-xs space-y-4">
            <div>
              <strong className="text-[13.5px] font-black text-[#1E293B] flex items-center gap-2">
                <Layers size={16} className="text-[#F45206]" />
                Tabela de Valores Oficiais por Ciclo Educacional
              </strong>
              <p className="text-[11.5px] text-[#64748B]">
                Defina os valores integrais da anuidade escolar e do kit de material didático da Livraria do Pensador para o ano letivo selecionado ({formState.academicYear}).
              </p>
            </div>

            {/* Abas dos 3 Ciclos */}
            <div className="flex flex-wrap gap-2 border-b border-[#F1F5F9] pb-2">
              {[
                { id: 'EF_6_TO_9', label: 'Fundamental II (6º ao 9º)' },
                { id: 'EM_1_TO_2', label: 'Ensino Médio (1ª e 2ª)' },
                { id: 'TERCEIRAO', label: 'Terceirão / Pré-Vestibular' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-[12px] font-bold py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#FFF0E6] text-[#F45206] border border-[#F45206]/40 shadow-xs'
                      : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#1E293B] border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Painel do Ciclo Ativo */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-black text-[#1E293B]">
                  {formState.cycles[activeTab]?.cycleLabel || 'Ciclo de Ensino'}
                </span>
                <span className="text-[10px] font-bold text-[#64748B] bg-[#F1F5F9] px-2.5 py-0.5 rounded-md">
                  Chave: {activeTab}
                </span>
              </div>

              {/* Seção Anuidade Balder */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <div className="flex items-center gap-2 text-[#1E293B] font-bold text-[12px]">
                  <DollarSign size={15} className="text-[#059669]" />
                  <span>Anuidade Escolar (Balder Educacional)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10.5px] font-black text-[#64748B] block mb-1">
                      Valor Integral (R$): *
                    </label>
                    <input
                      type="text"
                      value={typeof currentCycle.tuitionNominalTotal === 'number' ? formatBRL(currentCycle.tuitionNominalTotal) : currentCycle.tuitionNominalTotal}
                      onChange={(e) => {
                        const parsed = parseBRL(e.target.value);
                        handleCycleChange(activeTab, 'tuitionNominalTotal', parsed);
                      }}
                      className="w-full text-[13px] font-black text-[#1E293B] bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 focus:border-[#F45206] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-black text-[#64748B] block mb-1">
                      Número de Parcelas: *
                    </label>
                    <select
                      value={currentCycle.tuitionInstallmentsCount || 13}
                      onChange={(e) => handleCycleChange(activeTab, 'tuitionInstallmentsCount', parseInt(e.target.value) || 13)}
                      className="w-full text-[13px] font-bold text-[#1E293B] bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 focus:border-[#F45206] outline-hidden cursor-pointer"
                    >
                      <option value={13}>13 parcelas (Padrão Rodin)</option>
                      <option value={12}>12 parcelas</option>
                      <option value={11}>11 parcelas</option>
                      <option value={10}>10 parcelas</option>
                      <option value={1}>1 parcela (À vista)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-black text-[#64748B] block mb-1">
                      Valor da Parcela Padrão:
                    </label>
                    <div className="w-full text-[13px] font-black text-[#059669] bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 flex items-center justify-between">
                      <span>R$ {formatBRL(tuitionParcelVal)}</span>
                      <span className="text-[10px] text-[#94A3B8]">/mês</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção Material Didático Livraria do Pensador */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <div className="flex items-center gap-2 text-[#1E293B] font-bold text-[12px]">
                  <BookOpen size={15} className="text-[#4338CA]" />
                  <span>Material Didático (Livraria do Pensador LTDA)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10.5px] font-black text-[#64748B] block mb-1">
                      Valor Total Material (R$): *
                    </label>
                    <input
                      type="text"
                      value={typeof currentCycle.materialTotalValue === 'number' ? formatBRL(currentCycle.materialTotalValue) : currentCycle.materialTotalValue}
                      onChange={(e) => {
                        const parsed = parseBRL(e.target.value);
                        handleCycleChange(activeTab, 'materialTotalValue', parsed);
                      }}
                      className="w-full text-[13px] font-black text-[#1E293B] bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 focus:border-[#4338CA] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-black text-[#64748B] block mb-1">
                      Nº de Parcelas Material: *
                    </label>
                    <select
                      value={currentCycle.materialInstallmentsCount || 12}
                      onChange={(e) => handleCycleChange(activeTab, 'materialInstallmentsCount', parseInt(e.target.value) || 12)}
                      className="w-full text-[13px] font-bold text-[#1E293B] bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 focus:border-[#4338CA] outline-hidden cursor-pointer"
                    >
                      <option value={12}>12 parcelas mensais</option>
                      <option value={10}>10 parcelas mensais</option>
                      <option value={8}>8 parcelas mensais</option>
                      <option value={6}>6 parcelas mensais</option>
                      <option value={1}>1 parcela (À vista)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-black text-[#64748B] block mb-1">
                      Valor Parcela Material:
                    </label>
                    <div className="w-full text-[13px] font-black text-[#4338CA] bg-white border border-[#CBD5E1] rounded-xl px-3 py-2 flex items-center justify-between">
                      <span>R$ {formatBRL(matParcelVal)}</span>
                      <span className="text-[10px] text-[#94A3B8]">/mês</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-[11.5px] font-bold text-[#64748B] hover:text-[#DC2626] flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw size={14} /> Restaurar Padrões 2027
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary-rodin !py-2 !px-4 text-[12px]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary-rodin !py-2 !px-5 text-[12px] flex items-center gap-1.5 shadow-md shadow-[#F45206]/20"
            >
              <Save size={15} /> Salvar Parâmetros da Campanha
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
