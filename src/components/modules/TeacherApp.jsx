import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Sparkles,
  AlertTriangle,
  Bath,
  Coffee,
  Send,
  Calendar,
  UserCheck
} from 'lucide-react';

export default function TeacherApp() {
  const { classes, students, addClassroomLog, setSelectedStudentRx, showToast } = useApp();

  const [selectedClassId, setSelectedClassId] = useState('cls-1em-a');
  const [attendanceMap, setAttendanceMap] = useState({}); // { studentId: 'present' | 'absent' | 'late' }

  // Modal de Nova Ocorrência Rápida
  const [activeLogModalStudent, setActiveLogModalStudent] = useState(null);
  const [logType, setLogType] = useState('behavior_positive');
  const [category, setCategory] = useState('Excelente Participação');
  const [description, setDescription] = useState('');

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter(s => s.classId === selectedClassId || s.currentGrade.includes(currentClass.name.split(' - ')[0]));

  const handleToggleAttendance = (studentId, status) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveFullAttendance = () => {
    showToast(`Chamada da turma "${currentClass.name}" salva com sucesso!`);
  };

  const handleSaveLog = (e) => {
    e.preventDefault();
    if (!activeLogModalStudent) return;

    addClassroomLog({
      classId: selectedClassId,
      studentId: activeLogModalStudent.id,
      studentName: activeLogModalStudent.name,
      logType,
      category,
      description: description || `Registro de ${category} efetuado em sala de aula.`
    });

    setActiveLogModalStudent(null);
    setDescription('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header com Seletor de Turma */}
      <div className="rodin-panel-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen size={20} className="text-[#F45206]" />
            <h1 className="text-[20px] font-black text-[#1E293B]">
              Diário de Classe e Chamada Rápida (Tablet)
            </h1>
          </div>
          <p className="text-[12px] font-semibold text-[#64748B]">
            Interface touch-friendly otimizada para registro de presenças e ocorrências em sala
          </p>
        </div>

        {/* Seletor de Turma */}
        <div className="flex items-center gap-3">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-[13px] font-extrabold text-[#1E293B] bg-white shadow-sm focus:border-[#F45206] focus:outline-none"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.roomCode})
              </option>
            ))}
          </select>

          <button
            onClick={handleSaveFullAttendance}
            className="btn-primary-rodin !py-2 !px-4 text-[12px]"
          >
            <CheckCircle2 size={15} />
            Salvar Chamada
          </button>
        </div>
      </div>

      {/* Grid de Alunos para Chamada Rápida e Ocorrências de 1 Toque */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classStudents.map((student) => {
          const currentStatus = attendanceMap[student.id] || 'present';

          return (
            <div
              key={student.id}
              className="rodin-panel-card !p-4 flex flex-col justify-between hover:border-[#CBD5E1] transition-all"
            >
              {/* Top: Foto e Dados */}
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  onClick={() => setSelectedStudentRx(student)}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#F45206] cursor-pointer shadow-sm shrink-0"
                  title="Clique para ver o Raio-X 360°"
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <strong
                      onClick={() => setSelectedStudentRx(student)}
                      className="text-[13px] font-black text-[#1E293B] truncate cursor-pointer hover:text-[#F45206]"
                    >
                      {student.name}
                    </strong>
                    {student.condition && student.condition !== 'Normal' && (
                      <span className="condition-pill tdah text-[9px]">{student.condition}</span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#64748B]">
                    {student.enrollmentCode} • Presença: {student.attendanceRate}
                  </span>
                </div>
              </div>

              {/* Botões de Chamada Rápida de 1 Toque */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => handleToggleAttendance(student.id, 'present')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all ${
                    currentStatus === 'present'
                      ? 'bg-[#10B981] text-white shadow-sm'
                      : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                  }`}
                >
                  <CheckCircle2 size={13} /> Presente
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleAttendance(student.id, 'absent')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all ${
                    currentStatus === 'absent'
                      ? 'bg-[#DC2626] text-white shadow-sm'
                      : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                  }`}
                >
                  <XCircle size={13} /> Falta
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleAttendance(student.id, 'late')}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all ${
                    currentStatus === 'late'
                      ? 'bg-[#EA580C] text-white shadow-sm'
                      : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                  }`}
                >
                  <Clock size={13} /> Atraso
                </button>
              </div>

              {/* Botão de Registro de Ocorrência Rápida */}
              <button
                type="button"
                onClick={() => setActiveLogModalStudent(student)}
                className="w-full py-2 px-3 rounded-xl bg-[#F8FAFC] hover:bg-[#FFF0E6] hover:text-[#F45206] border border-[#E2E8F0] text-[11px] font-extrabold text-[#475569] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus size={14} /> Registrar Ocorrência / Elogio
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal de Registro de Ocorrência */}
      {activeLogModalStudent && (
        <div className="modal-overlay" onClick={() => setActiveLogModalStudent(null)}>
          <div
            className="bg-white rounded-3xl p-6 max-w-lg w-[94%] border border-[#E2E8F0] shadow-2xl modal-container-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeLogModalStudent.photoUrl}
                  alt={activeLogModalStudent.name}
                  className="w-9 h-9 rounded-full object-cover border-2 border-[#F45206]"
                />
                <div>
                  <h3 className="text-[14px] font-black text-[#1E293B]">
                    {activeLogModalStudent.name}
                  </h3>
                  <span className="text-[10px] font-semibold text-[#64748B]">
                    {currentClass.name}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveLogModalStudent(null)}
                className="w-7 h-7 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center hover:bg-[#F45206] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4">
              <div>
                <label className="form-label">Tipo de Registro</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLogType('behavior_positive');
                      setCategory('Excelente Participação');
                    }}
                    className={`py-2 px-3 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      logType === 'behavior_positive'
                        ? 'bg-[#ECFDF5] text-[#059669] border-2 border-[#10B981]'
                        : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                    }`}
                  >
                    <Sparkles size={14} /> Elogio / Destaque
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLogType('behavior_warning');
                      setCategory('Uso Indevido de Smartphone');
                    }}
                    className={`py-2 px-3 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      logType === 'behavior_warning'
                        ? 'bg-[#FEF2F2] text-[#DC2626] border-2 border-[#EF4444]'
                        : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                    }`}
                  >
                    <AlertTriangle size={14} /> Advertência / Desvio
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLogType('attendance');
                      setCategory('Ida ao Banheiro / Bebedouro');
                    }}
                    className={`py-2 px-3 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      logType === 'attendance'
                        ? 'bg-[#FFF7ED] text-[#EA580C] border-2 border-[#F97316]'
                        : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                    }`}
                  >
                    <Bath size={14} /> Saída ao Banheiro
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLogType('observation');
                      setCategory('Sonolência / Desatenção');
                    }}
                    className={`py-2 px-3 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                      logType === 'observation'
                        ? 'bg-[#EEF2FF] text-[#4338CA] border-2 border-[#6366F1]'
                        : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                    }`}
                  >
                    <Coffee size={14} /> Observação Pedagógica
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Categoria / Motivo</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-control"
                  placeholder="Ex: Excelente raciocínio no laboratório"
                />
              </div>

              <div>
                <label className="form-label">Observações Detalhadas (Opcional)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-control resize-none"
                  placeholder="Descreva o contexto pedagógico ou comportamental..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveLogModalStudent(null)}
                  className="btn-secondary-rodin !py-2 !px-4 text-[12px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary-rodin !py-2 !px-5 text-[12px]"
                >
                  <Send size={14} />
                  Salvar no Diário de Bordo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
