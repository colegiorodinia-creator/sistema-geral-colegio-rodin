import React from 'react';
import { useApp } from '../context/AppContext';
import { ChevronRight, User, Menu, LogOut } from 'lucide-react';

export default function Header({ onOpenRoleSwitcher }) {
  const { currentUser, activeTab, setIsMobileMenuOpen, logout } = useApp();

  const getBreadcrumb = () => {
    switch (activeTab) {
      case 'rematricula':
        return { module: 'Campanha 2027', current: 'Rematrícula de Alunos' };
      case 'config-rematricula':
        return { module: 'Campanha 2027', current: 'Configuração da Rematrícula' };
      case 'dashboard':
        return { module: 'Gestão Operacional', current: 'Análise Geral' };
      case 'raiox':
        return { module: 'Gestão Operacional', current: 'Raio-X do Aluno (360°)' };
      case 'matriculas':
      case 'matriculas-list':
      case 'matriculas-nova':
        return { module: 'Setor de Matrículas', current: 'Gestão de Matrículas (2027)' };
      case 'diario-classe':
        return { module: 'Sala de Aula (Tablet)', current: 'Chamada Rápida e Diário de Bordo' };
      case 'coordenacao':
        return { module: 'Coordenação Pedagógica', current: 'Feed de Ocorrências (RLS Ativo)' };
      case 'direcao':
        return { module: 'Direção Pedagógica', current: 'Enturmação e Delegação de Turmas' };
      case 'banco-questoes':
        return { module: 'Corpo Docente', current: 'Banco de Questões e Montador de Provas' };
      case 'secretaria':
        return { module: 'Secretaria Escolar', current: 'Emissão de Boletins e Histórico' };
      case 'portal-familia':
        return { module: 'Portal da Família e Aluno', current: 'Meu Rendimento e Contratos' };
      case 'admin':
        return { module: 'Painel do Administrador', current: 'Infraestrutura Supabase e Logs' };
      default:
        return { module: 'Sistema Geral', current: 'Visão Geral' };
    }
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="h-[64px] sm:h-[68px] bg-white border-b border-[#E2E8F0] px-3.5 sm:px-6 flex items-center justify-between z-20 select-none shrink-0">
      {/* Left: Mobile Menu Toggle + Breadcrumb Navigation */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#1E293B] border border-[#E2E8F0] flex items-center justify-center transition-colors"
          title="Abrir Menu de Navegação"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 text-[12px] sm:text-[13px] font-semibold min-w-0">
          <span className="hidden sm:inline text-[#64748B] hover:text-[#1E293B] cursor-pointer transition-colors truncate">
            {breadcrumb.module}
          </span>
          <ChevronRight size={14} className="hidden sm:inline text-[#CBD5E1] shrink-0" />
          <span className="text-[#1E293B] font-extrabold truncate max-w-[140px] sm:max-w-none">
            {breadcrumb.current}
          </span>
        </div>
      </div>

      {/* Right User State Pill + Logout */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[11px] font-extrabold text-[#059669]">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
          <span>Supabase RLS Conectado</span>
        </div>

        <button
          onClick={onOpenRoleSwitcher}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-[#FFF0E6] border border-[#FED7AA] text-[11px] sm:text-[12px] font-extrabold text-[#F45206] hover:bg-[#FFE6D5] transition-colors cursor-pointer"
          title="Configurações do Meu Perfil"
        >
          <User size={13} className="shrink-0" />
          <span className="truncate max-w-[80px] sm:max-w-none">
            {currentUser.roleLabel.split(' ')[0]}
          </span>
          <span className="hidden xs:inline-block text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full bg-[#F45206] text-white uppercase tracking-wider font-black">
            {currentUser.role}
          </span>
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[11px] sm:text-[12px] font-extrabold text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
          title="Encerrar Sessão e Voltar para Login"
        >
          <LogOut size={13} className="shrink-0" />
          <span className="hidden xs:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
