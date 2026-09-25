import React from 'react';
import { useApp } from '../context/AppContext';
import RodinLogo from './RodinLogo';
import {
  LayoutDashboard,
  UserCheck,
  FileSignature,
  Users,
  GraduationCap,
  BookOpen,
  FolderLock,
  Layers,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Award,
  HelpCircle,
  UserPlus,
  RefreshCw,
  Settings,
  X
} from 'lucide-react';

export default function Sidebar({ onOpenRoleSwitcher }) {
  const {
    currentUser,
    logout,
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isMobileMenuOpen,
    setIsMobileMenuOpen
  } = useApp();

  const menuSections = [
    {
      title: 'GESTÃO OPERACIONAL',
      items: [
        { id: 'dashboard', label: 'Análise Geral', icon: LayoutDashboard, allowedRoles: ['admin', 'director', 'coordinator', 'secretary'] },
        { id: 'raiox', label: 'Raio-X do Aluno', icon: UserCheck, allowedRoles: ['admin', 'director', 'coordinator', 'teacher', 'secretary'] },
      ]
    },
    {
      title: 'MATRÍCULAS E CONTRATOS',
      items: [
        { id: 'matriculas-list', label: 'Gestão de Matrículas', icon: FileSignature, allowedRoles: ['admin', 'director', 'secretary'] },
        { id: 'rematricula', label: 'Rematrícula', icon: RefreshCw, allowedRoles: ['admin', 'director', 'enrollment', 'secretary'] },
        { id: 'config-rematricula', label: 'Config. Rematrícula', icon: Settings, allowedRoles: ['admin', 'director', 'secretary'] },
        { id: 'matriculas-nova', label: 'Matrícula Nova', icon: UserPlus, allowedRoles: ['admin'] }
      ]
    },
    {
      title: 'SALA DE AULA',
      items: [
        { id: 'diario-classe', label: 'Diário e Chamada Rápida', icon: BookOpen, allowedRoles: ['admin', 'director', 'coordinator', 'teacher'], highlight: true },
      ]
    },
    {
      title: 'COORDENAÇÃO E DIREÇÃO',
      items: [
        { id: 'coordenacao', label: 'Feed da Coordenação (RLS)', icon: ShieldCheck, allowedRoles: ['admin', 'director', 'coordinator'] },
        { id: 'direcao', label: 'Enturmação e Delegação', icon: Layers, allowedRoles: ['admin', 'director', 'coordinator'] },
        { id: 'banco-questoes', label: 'Banco de Questões e Provas', icon: HelpCircle, allowedRoles: ['admin', 'director', 'teacher'] },
      ]
    },
    {
      title: 'SECRETARIA E BOLETINS',
      items: [
        { id: 'secretaria', label: 'Emissão de Boletins (PDF)', icon: GraduationCap, allowedRoles: ['admin', 'director', 'secretary', 'coordinator'] },
      ]
    },
    {
      title: 'FAMÍLIA E ALUNO',
      items: [
        { id: 'portal-familia', label: 'Portal do Estudante e Pais', icon: Award, allowedRoles: ['admin', 'guardian', 'student'] },
      ]
    },
    {
      title: 'ADMINISTRAÇÃO',
      items: [
        { id: 'admin', label: 'Infra Supabase e Logs', icon: FolderLock, allowedRoles: ['admin'] },
      ]
    }
  ];

  const handleItemClick = (tabId) => {
    setActiveTab(tabId);
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const renderContent = (isMobile = false) => (
    <div className="flex flex-col justify-between h-full">
      {/* Top Header e Logo */}
      <div>
        <div className={`flex items-center mb-6 px-1 ${isSidebarCollapsed && !isMobile ? 'justify-center' : 'justify-between'}`}>
          {(!isSidebarCollapsed || isMobile) && (
            <div className="flex items-center py-1">
              <RodinLogo variant="color" className="h-10 sm:h-[42px] w-auto max-w-[200px]" alt="Colégio Rodin" />
            </div>
          )}

          {!isMobile ? (
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-8 h-8 min-w-[32px] rounded-lg border border-transparent hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#1E293B] flex items-center justify-center transition-colors"
              title={isSidebarCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
            >
              {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          ) : (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-8 h-8 rounded-lg bg-[#F1F5F9] text-[#64748B] flex items-center justify-center hover:bg-[#E2E8F0]"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Menu Navigation */}
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-190px)] pr-1 custom-scrollbar">
          {menuSections.map((section, idx) => {
              const visibleItems = section.items.filter(item =>
                item.allowedRoles.includes(currentUser.role) || currentUser.role === 'admin'
              );

              if (visibleItems.length === 0) return null;

              return (
                <div key={idx} className="flex flex-col gap-1">
                  {(!isSidebarCollapsed || isMobile) && (
                    <span className="text-[10px] font-extrabold text-[#64748B] tracking-[0.05em] px-2 mb-1 uppercase">
                      {section.title}
                    </span>
                  )}
                  {visibleItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-[13px] transition-all w-full text-left ${
                          isActive
                            ? 'bg-[#FFF0E6] text-[#F45206]'
                            : item.highlight
                            ? 'bg-[#EEF2FF] text-[#4338CA] hover:bg-[#E0E7FF]'
                            : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                        } ${isSidebarCollapsed && !isMobile ? 'justify-center px-0' : ''}`}
                        title={isSidebarCollapsed && !isMobile ? item.label : undefined}
                      >
                        <Icon size={18} className="shrink-0" />
                        {(!isSidebarCollapsed || isMobile) && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
        </div>
      </div>

      {/* Footer Profile e Role Switcher */}
      <div className="pt-2 border-t border-[#E2E8F0]">
        <div
          className={`flex items-center justify-between p-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] transition-all ${
            isSidebarCollapsed && !isMobile ? 'flex-col gap-2 p-1.5' : ''
          }`}
        >
          <div
            onClick={() => {
              onOpenRoleSwitcher();
              if (isMobile) setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
            title="Configurações do Meu Perfil (Nome, Foto, Senha)"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 min-w-[36px] rounded-full object-cover border-2 border-[#F45206]"
            />
            {(!isSidebarCollapsed || isMobile) && (
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-extrabold text-[#1E293B] truncate leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-semibold text-[#F45206] truncate">
                  {currentUser.roleLabel}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isMobile) setIsMobileMenuOpen(false);
              logout();
            }}
            className="text-[#64748B] hover:text-[#DC2626] p-1.5 rounded-lg hover:bg-[#FEF2F2] hover:border-[#FECACA] transition-colors cursor-pointer shrink-0"
            title="Sair do Sistema (Encerrar Sessão)"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Sidebar */}
      <aside
        className={`hidden lg:flex bg-white border-r border-[#E2E8F0] flex-col justify-between p-4 transition-all duration-300 z-30 select-none h-screen ${
          isSidebarCollapsed ? 'w-[76px] min-w-[76px]' : 'w-[265px] min-w-[265px]'
        }`}
      >
        {renderContent(false)}
      </aside>

      {/* 2. Mobile / Tablet Drawer & Backdrop */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fadeIn"
          />

          {/* Drawer Panel */}
          <div className="fixed top-0 bottom-0 left-0 w-[280px] max-w-[85vw] bg-white z-50 p-4 shadow-2xl flex flex-col justify-between animate-slideRight">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
