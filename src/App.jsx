import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import RoleSwitcherModal from './components/RoleSwitcherModal';
import SignatureModal from './components/modules/SignatureModal';
import StudentRxModal from './components/modules/StudentRxModal';
import LoginScreen from './components/LoginScreen';

// Modulos
import GeneralDashboard from './components/modules/GeneralDashboard';
import StudentRxExplorer from './components/modules/StudentRxExplorer';
import EnrollmentModule from './components/modules/EnrollmentModule';
import ReenrollmentModule from './components/modules/ReenrollmentModule';
import ReenrollmentSettingsPanel from './components/modules/ReenrollmentSettingsPanel';
import ParentEnrollmentPortal from './components/modules/ParentEnrollmentPortal';
import TeacherApp from './components/modules/TeacherApp';
import CoordinatorDashboard from './components/modules/CoordinatorDashboard';
import DirectorDashboard from './components/modules/DirectorDashboard';
import SecretaryModule from './components/modules/SecretaryModule';
import FamilyPortal from './components/modules/FamilyPortal';
import AdminDashboard from './components/modules/AdminDashboard';

export default function App() {
  const { 
    isAuthenticated,
    activeTab, 
    setActiveTab, 
    signingEnrollment, 
    setSigningEnrollment, 
    selectedStudentRx, 
    setSelectedStudentRx,
    setIsMobileMenuOpen 
  } = useApp();
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [hashRoute, setHashRoute] = useState(window.location.hash);
  // Escutar alterações de hash na URL (ex: #matricular/enr-2027-2565 ou #rematricula)
  React.useEffect(() => {
    const handleHashChange = () => {
      const currentHash = window.location.hash;
      setHashRoute(currentHash);
      if (currentHash === '#rematricula') {
        setActiveTab('rematricula');
      }
    };

    if (window.location.hash === '#rematricula') {
      setActiveTab('rematricula');
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [setActiveTab]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Se a URL for um link público de matrícula do responsável:
  if (hashRoute && hashRoute.startsWith('#matricular/')) {
    const cleanRoute = hashRoute.replace('#matricular/', '');
    const [enrollmentId] = cleanRoute.split('?');

    return (
      <div className="w-screen h-screen overflow-y-auto custom-scrollbar bg-[#F8FAFC]">
        <ParentEnrollmentPortal
          enrollmentId={enrollmentId}
          onExit={() => {
            window.location.hash = '';
            setHashRoute('');
            setActiveTab('matriculas-list');
          }}
        />
      </div>
    );
  }

  const renderActiveTab = () => {
    // Restrição estrita de acesso por cargo (Negação por Padrão)
    if (currentUser?.role === 'enrollment' && !['rematricula', 'config-rematricula', 'matriculas', 'matriculas-list', 'matriculas-nova'].includes(activeTab)) {
      return <ReenrollmentModule />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <GeneralDashboard />;
      case 'raiox':
        return <StudentRxExplorer />;
      case 'matriculas':
      case 'matriculas-list':
        return <EnrollmentModule key="matriculas-list" isCreateMode={false} />;
      case 'rematricula':
        return <ReenrollmentModule />;
      case 'config-rematricula':
        return <ReenrollmentSettingsPanel />;
      case 'matriculas-nova':
        return <EnrollmentModule key="matriculas-nova" isCreateMode={true} />;
      case 'diario-classe':
        return <TeacherApp />;
      case 'coordenacao':
        return <CoordinatorDashboard />;
      case 'direcao':
        return <DirectorDashboard initialTab="enturmacao" />;
      case 'banco-questoes':
        return <DirectorDashboard initialTab="questions" />;
      case 'secretaria':
        return <SecretaryModule />;
      case 'portal-familia':
        return <FamilyPortal />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <ReenrollmentModule />;
    }
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Sidebar Lateral com Design Fiel ao Gestão de Sala */}
      <Sidebar onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)} />

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Menu apenas para telas móveis/celular */}
        <div className="lg:hidden p-3 bg-white border-b border-[#E2E8F0] flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-[#F8FAFC] text-[#1E293B] border border-[#E2E8F0] flex items-center gap-2 text-[12px] font-bold"
          >
            <Menu size={18} />
            <span>Menu</span>
          </button>
          <span className="text-[12px] font-black text-[#F45206]">Colégio Rodin</span>
        </div>

        {/* Conteúdo Dinâmico Scrollável */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {renderActiveTab()}
          </div>
        </main>
      </div>

      {/* Modais Globais */}
      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
      />

      {signingEnrollment && (
        <SignatureModal
          enrollment={signingEnrollment}
          onClose={() => setSigningEnrollment(null)}
        />
      )}

      {selectedStudentRx && (
        <StudentRxModal
          student={selectedStudentRx}
          onClose={() => setSelectedStudentRx(null)}
        />
      )}
    </div>
  );
}
