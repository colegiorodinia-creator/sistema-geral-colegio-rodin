import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Filter,
  AlertTriangle,
  Sparkles,
  Bath,
  Coffee,
  Calendar,
  UserCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function CoordinatorDashboard() {
  const { currentUser, classes, students, classroomLogs, setSelectedStudentRx } = useApp();

  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');

  // SIMULAÇÃO DA POLÍTICA DE ROW LEVEL SECURITY (RLS)
  // Coordenador enxerga apenas turmas em que classes.coordinator_id = currentUser.id (ou todas se for Admin/Diretor)
  const isDirectorOrAdmin = currentUser.role === 'admin' || currentUser.role === 'director';
  const assignedClasses = isDirectorOrAdmin
    ? classes
    : classes.filter(c => c.coordinatorId === currentUser.id);

  const assignedClassIds = assignedClasses.map(c => c.id);

  // Filtragem estrita dos logs conforme as turmas permitidas por RLS
  const allowedLogs = classroomLogs.filter(log =>
    assignedClassIds.includes(log.classId) || isDirectorOrAdmin
  );

  const filteredLogs = allowedLogs.filter(log => {
    if (selectedTypeFilter === 'all') return true;
    return log.logType === selectedTypeFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header com Badge RLS */}
      <div className="rodin-panel-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={20} className="text-[#F45206]" />
            <h1 className="text-[20px] font-black text-[#1E293B]">
              Painel da Coordenação Pedagógica
            </h1>
          </div>
          <p className="text-[12px] font-semibold text-[#64748B]">
            Feed de acompanhamento comportamental em tempo real com governança Row Level Security (RLS)
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EEF2FF] border border-[#C7D2FE] text-[11px] font-extrabold text-[#4338CA]">
          <Lock size={13} />
          <span>RLS: {assignedClasses.length} Turma(s) Atribuída(s)</span>
        </div>
      </div>

      {/* Turmas sob Gestão */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {assignedClasses.map((cls) => {
          const classLogsCount = classroomLogs.filter(l => l.classId === cls.id).length;
          const warningLogsCount = classroomLogs.filter(l => l.classId === cls.id && l.logType === 'behavior_warning').length;

          return (
            <div key={cls.id} className="stat-kpi-card !p-4">
              <span className="text-[10px] font-extrabold text-[#F45206] uppercase tracking-[0.5px]">
                {cls.gradeLevel}
              </span>
              <strong className="text-[14px] font-black text-[#1E293B] mt-0.5">{cls.name}</strong>
              <div className="flex items-center justify-between mt-3 text-[11px] text-[#64748B]">
                <span>{cls.studentCount || 28} Alunos</span>
                <span className="font-extrabold text-[#DC2626]">
                  {warningLogsCount} Ocorrência(s)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feed Pedagógico em Tempo Real */}
      <div className="rodin-panel-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5 gap-3">
          <div>
            <h2 className="text-[16px] font-black text-[#1E293B]">
              Feed de Ocorrências e Acompanhamento
            </h2>
            <p className="text-[12px] text-[#64748B]">
              Registros inseridos pelos professores no aplicativo de sala de aula
            </p>
          </div>

          {/* Filtro por Tipo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-colors ${
                selectedTypeFilter === 'all' ? 'bg-[#1E293B] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
              }`}
            >
              Todos ({allowedLogs.length})
            </button>

            <button
              onClick={() => setSelectedTypeFilter('behavior_warning')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-colors ${
                selectedTypeFilter === 'behavior_warning' ? 'bg-[#DC2626] text-white' : 'bg-[#FEF2F2] text-[#DC2626]'
              }`}
            >
              Advertências
            </button>

            <button
              onClick={() => setSelectedTypeFilter('behavior_positive')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-colors ${
                selectedTypeFilter === 'behavior_positive' ? 'bg-[#059669] text-white' : 'bg-[#ECFDF5] text-[#059669]'
              }`}
            >
              Elogios
            </button>
          </div>
        </div>

        {/* Lista de Ocorrências */}
        {filteredLogs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#F8FAFC] text-center text-[#64748B] text-[13px] font-semibold border border-[#E2E8F0]">
            Nenhum registro encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const student = students.find(s => s.id === log.studentId);

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all flex items-start gap-4"
                >
                  <div className="mt-0.5">
                    {log.logType === 'behavior_positive' && (
                      <span className="w-9 h-9 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                        <Sparkles size={18} />
                      </span>
                    )}
                    {log.logType === 'behavior_warning' && (
                      <span className="w-9 h-9 rounded-xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
                        <AlertTriangle size={18} />
                      </span>
                    )}
                    {log.logType === 'attendance' && (
                      <span className="w-9 h-9 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center">
                        <Bath size={18} />
                      </span>
                    )}
                    {log.logType === 'observation' && (
                      <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center">
                        <Coffee size={18} />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2">
                        <strong
                          onClick={() => student && setSelectedStudentRx(student)}
                          className="text-[14px] font-black text-[#1E293B] hover:text-[#F45206] cursor-pointer"
                        >
                          {log.studentName}
                        </strong>
                        <span className="text-[11px] font-bold text-[#F45206] bg-[#FFF0E6] px-2 py-0.5 rounded-md">
                          {log.category}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#94A3B8] font-medium">
                        {new Date(log.timestamp).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-[12px] text-[#475569] leading-relaxed mb-2">
                      {log.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                      <span>Docente: <strong>{log.teacherName}</strong></span>
                      {student && (
                        <button
                          onClick={() => setSelectedStudentRx(student)}
                          className="text-[#F45206] hover:underline font-bold flex items-center gap-1"
                        >
                          <UserCheck size={13} /> Abrir Raio-X 360°
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
