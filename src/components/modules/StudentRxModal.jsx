import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, UserCheck, ShieldAlert, Award, Calendar, BookOpen, AlertTriangle, Coffee, Sparkles } from 'lucide-react';

export default function StudentRxModal({ student, onClose }) {
  const { classroomLogs } = useApp();

  if (!student) return null;

  const studentLogs = classroomLogs.filter(log => log.studentId === student.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-[94%] max-h-[90vh] overflow-y-auto border border-[#E2E8F0] shadow-2xl modal-container-popup flex flex-col custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-5">
          <div className="flex items-center gap-2">
            <UserCheck size={20} className="text-[#F45206]" />
            <h2 className="text-[17px] font-extrabold text-[#1E293B]">
              Raio-X do Aluno — Acompanhamento 360°
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F1F5F9] hover:bg-[#F45206] hover:text-white flex items-center justify-center text-[#64748B] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Info Card do Aluno */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] mb-5">
          <img
            src={student.photoUrl}
            alt={student.name}
            className="w-20 h-20 min-w-[80px] rounded-full object-cover border-3 border-[#F45206] shadow-md"
          />
          <div className="flex flex-col text-center sm:text-left min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h3 className="text-[16px] font-black text-[#1E293B]">{student.name}</h3>
              {student.condition && student.condition !== 'Normal' && (
                <span className="condition-pill tdah text-[10px]">{student.condition}</span>
              )}
            </div>
            <span className="text-[12px] font-bold text-[#F45206] mb-0.5">{student.currentGrade}</span>
            <span className="text-[11px] text-[#64748B]">
              Matrícula: {student.enrollmentCode} • CPF: {student.cpf}
            </span>
            <span className="text-[11px] text-[#64748B]">
              Responsável: {student.guardians?.[0]?.name} ({student.guardians?.[0]?.phone})
            </span>
          </div>
        </div>

        {/* Barras de Desempenho e Assiduidade */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
            <span className="text-[10px] font-extrabold text-[#64748B] uppercase block mb-1">
              Assiduidade / Frequência
            </span>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[18px] font-black text-[#1E293B]">{student.attendanceRate}</span>
              <span className="text-[10px] font-bold text-[#059669]">Excelente</span>
            </div>
            <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
              <div className="bg-[#10B981] h-full rounded-full w-[96%]"></div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
            <span className="text-[10px] font-extrabold text-[#64748B] uppercase block mb-1">
              Média Geral de Notas
            </span>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[18px] font-black text-[#1E293B]">9.1</span>
              <span className="text-[10px] font-bold text-[#F45206]">Acima da Média</span>
            </div>
            <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
              <div className="bg-[#F45206] h-full rounded-full w-[91%]"></div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
            <span className="text-[10px] font-extrabold text-[#64748B] uppercase block mb-1">
              Engajamento em Sala
            </span>
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[18px] font-black text-[#1E293B]">Alto</span>
              <span className="text-[10px] font-bold text-[#4338CA]">Ativo</span>
            </div>
            <div className="w-full bg-[#F1F5F9] h-2 rounded-full overflow-hidden">
              <div className="bg-[#4338CA] h-full rounded-full w-[88%]"></div>
            </div>
          </div>
        </div>

        {/* Linha do Tempo Pedagógica e Ocorrências */}
        <div className="border-t border-[#E2E8F0] pt-4">
          <h4 className="text-[13px] font-extrabold text-[#1E293B] mb-3 flex items-center gap-1.5">
            <BookOpen size={16} className="text-[#F45206]" />
            Histórico de Ocorrências e Diário de Bordo
          </h4>

          {studentLogs.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#F8FAFC] text-center text-[#64748B] text-[12px] font-medium border border-[#E2E8F0]">
              Nenhuma ocorrência disciplinar registrada para este aluno.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {studentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-3 text-[12px]"
                >
                  <div className="mt-0.5">
                    {log.logType === 'behavior_positive' && (
                      <span className="w-6 h-6 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                        <Sparkles size={14} />
                      </span>
                    )}
                    {log.logType === 'observation' && (
                      <span className="w-6 h-6 rounded-full bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center">
                        <Coffee size={14} />
                      </span>
                    )}
                    {log.logType === 'behavior_warning' && (
                      <span className="w-6 h-6 rounded-full bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center">
                        <AlertTriangle size={14} />
                      </span>
                    )}
                    {log.logType === 'attendance' && (
                      <span className="w-6 h-6 rounded-full bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center">
                        <Calendar size={14} />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="font-extrabold text-[#1E293B]">{log.category}</span>
                      <span className="text-[10px] text-[#94A3B8]">
                        {new Date(log.timestamp).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[#475569] text-[11px] leading-relaxed">{log.description}</p>
                    <span className="text-[10px] text-[#94A3B8] block mt-1">Registrado por: {log.teacherName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-[#E2E8F0] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#F1F5F9] text-[#1E293B] font-bold text-[12px] hover:bg-[#E2E8F0] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
