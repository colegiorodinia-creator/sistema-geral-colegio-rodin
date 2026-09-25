import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generateStudentReportCardPDF } from '../../lib/pdfGenerator';
import { removeAccents } from '../../lib/formatters';
import {
  GraduationCap,
  Download,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  Printer,
  Sparkles
} from 'lucide-react';

export default function SecretaryModule() {
  const { classes, students, showToast } = useApp();

  const [selectedClassId, setSelectedClassId] = useState('cls-1em-a');
  const [searchQuery, setSearchQuery] = useState('');

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter(s => s.classId === selectedClassId || s.currentGrade.includes(currentClass.name.split(' - ')[0]));

  const normQuery = removeAccents(searchQuery);
  const filteredStudents = classStudents.filter(s =>
    removeAccents(s.name).includes(normQuery) ||
    removeAccents(s.enrollmentCode).includes(normQuery)
  );

  const handleDownloadSingleBulletin = (student) => {
    generateStudentReportCardPDF(student);
    showToast(`Boletim oficial de ${student.name} gerado com sucesso!`);
  };

  const handleDownloadBatchBulletins = () => {
    classStudents.forEach(student => {
      generateStudentReportCardPDF(student);
    });
    showToast(`Emissão em lote concluída: ${classStudents.length} boletins gerados em PDF.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="rodin-panel-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap size={20} className="text-[#F45206]" />
            <h1 className="text-[20px] font-black text-[#1E293B]">
              Secretaria Escolar e Emissão de Boletins
            </h1>
          </div>
          <p className="text-[12px] font-semibold text-[#64748B]">
            Fechamento acadêmico, controle de médias bimestrais e emissão em lote de documentos oficiais
          </p>
        </div>

        {/* Ações em Lote */}
        <div className="flex items-center gap-3">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-[13px] font-extrabold text-[#1E293B] bg-white shadow-sm focus:border-[#F45206] focus:outline-none"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleDownloadBatchBulletins}
            className="btn-primary-rodin !py-2 !px-4 text-[12px]"
          >
            <Printer size={15} />
            Emissão em Lote (PDF)
          </button>
        </div>
      </div>

      {/* Tabela de Alunos e Médias */}
      <div className="rodin-panel-card !p-0 overflow-hidden">
        <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[13px] text-[#1E293B]">
              Alunos da Turma: {currentClass.name}
            </span>
            <span className="text-[11px] font-bold text-[#F45206] bg-[#FFF0E6] px-2.5 py-0.5 rounded-full">
              {filteredStudents.length} Alunos
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Buscar aluno..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E2E8F0] text-[12px] font-semibold text-[#1E293B] bg-white focus:outline-none focus:border-[#F45206]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.5px]">
                <th className="py-3.5 px-5">Estudante</th>
                <th className="py-3.5 px-4">Matrícula</th>
                <th className="py-3.5 px-4">Média Global</th>
                <th className="py-3.5 px-4">Frequência</th>
                <th className="py-3.5 px-4">Situação</th>
                <th className="py-3.5 px-5 text-right">Boletim Oficial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[13px]">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <img
                        src={student.photoUrl}
                        alt={student.name}
                        className="w-9 h-9 rounded-full object-cover border-2 border-[#F45206]"
                      />
                      <div className="flex flex-col">
                        <strong className="text-[#1E293B] font-extrabold">{student.name}</strong>
                        <span className="text-[11px] text-[#64748B]">{student.currentGrade.split(' - ')[0]}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[12px] text-[#64748B]">
                    {student.enrollmentCode}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-[14px] font-black text-[#1E293B]">9.1</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-[12px] font-bold text-[#059669]">{student.attendanceRate}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[11px] font-extrabold text-[#059669]">
                      <CheckCircle2 size={12} /> Aprovado
                    </span>
                  </td>

                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => handleDownloadSingleBulletin(student)}
                      className="btn-secondary-rodin !py-1.5 !px-3 text-[11px]"
                      title="Baixar Boletim Escolar em PDF com Design do Colégio Rodin"
                    >
                      <Download size={14} /> Baixar PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
