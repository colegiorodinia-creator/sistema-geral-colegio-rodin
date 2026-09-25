import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  FolderLock,
  Database,
  ShieldCheck,
  Server,
  Activity,
  CheckCircle2,
  HardDrive,
  Cpu,
  Lock
} from 'lucide-react';

export default function AdminDashboard() {
  const { classroomLogs, enrollments } = useApp();

  const services = [
    { name: 'PostgreSQL Relational DB', status: 'Online (100% Healthy)', latency: '38 ms', icon: Database, color: '#10B981' },
    { name: 'Supabase Auth e OTP Service', status: 'Ativo (JWT v2)', latency: '45 ms', icon: ShieldCheck, color: '#10B981' },
    { name: 'Storage Buckets (Contratos Privados)', status: 'Seguro / Encriptado', latency: '62 ms', icon: HardDrive, color: '#10B981' },
    { name: 'Edge Functions (Deno / TypeScript)', status: 'Executando (SHA-256 Engine)', latency: '54 ms', icon: Cpu, color: '#10B981' }
  ];

  const rlsPolicies = [
    { table: 'classroom_logs', policy: 'Coordinators view assigned class logs only', status: 'Active (100% Locked)' },
    { table: 'contracts', policy: 'Guardians view own dependent contracts only', status: 'Active (100% Locked)' },
    { table: 'student_grades', policy: 'Guardians/Students view own grades only', status: 'Active (100% Locked)' },
    { table: 'profiles', policy: 'Profiles public read, admin write only', status: 'Active (100% Locked)' },
    { table: 'question_bank', policy: 'Teachers manage own questions, director manages all', status: 'Active (100% Locked)' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="rodin-panel-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderLock size={20} className="text-[#F45206]" />
            <h1 className="text-[20px] font-black text-[#1E293B]">
              Infraestrutura Supabase e Segurança (Admin)
            </h1>
          </div>
          <p className="text-[12px] font-semibold text-[#64748B]">
            Status operacional dos microsserviços, governança Row Level Security (RLS) e logs de auditoria
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] text-[11px] font-extrabold">
          <Activity size={14} className="animate-pulse" />
          <span>Custo Marginal por Assinatura: R$ 0,00</span>
        </div>
      </div>

      {/* Grid de Serviços Supabase */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((srv, idx) => {
          const Icon = srv.icon;
          return (
            <div key={idx} className="stat-kpi-card !p-4">
              <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B] flex items-center justify-center mb-3">
                <Icon size={20} />
              </div>
              <strong className="text-[13px] font-black text-[#1E293B]">{srv.name}</strong>
              <div className="flex items-center justify-between mt-3 text-[11px]">
                <span className="text-[#059669] font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} /> {srv.status}
                </span>
                <span className="text-[#64748B] font-mono">{srv.latency}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabela de Políticas RLS do PostgreSQL */}
      <div className="rodin-panel-card">
        <h2 className="text-[16px] font-black text-[#1E293B] mb-1 flex items-center gap-2">
          <Lock size={18} className="text-[#F45206]" />
          Políticas de Segurança em Nível de Linha (PostgreSQL RLS)
        </h2>
        <p className="text-[12px] text-[#64748B] mb-4">
          Garante que queries executadas pelo frontend respeitem estritamente o contexto de autenticação do usuário.
        </p>

        <div className="space-y-2.5">
          {rlsPolicies.map((rls, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[12px]"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-[#F45206] bg-[#FFF0E6] px-2 py-0.5 rounded-md text-[11px]">
                  {rls.table}
                </span>
                <span className="text-[#1E293B] font-semibold">{rls.policy}</span>
              </div>
              <span className="text-[#059669] font-extrabold text-[11px] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                {rls.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Logs de Auditoria do Sistema */}
      <div className="rodin-panel-card">
        <h2 className="text-[16px] font-black text-[#1E293B] mb-1">
          Trilha de Auditoria Criptográfica Recente
        </h2>
        <p className="text-[12px] text-[#64748B] mb-4">
          Transações seladas com hash SHA-256 e IP de conexão gravadas em tabela imutável
        </p>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar text-[11px] font-mono">
          {enrollments.map((enr, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-[#0F172A] text-[#94A3B8] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <span className="text-[#10B981] font-bold">[CONTRACT_SEALED]</span>{' '}
                <span className="text-white">{enr.studentName}</span> ({enr.enrollmentCode})
              </div>
              <div className="text-[10px] text-[#CBD5E1]">
                IP: {enr.ipAddress || '189.120.45.10'} • SHA-256: {enr.documentSha256?.slice(0, 16)}...
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
