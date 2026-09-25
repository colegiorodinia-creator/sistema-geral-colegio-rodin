import React from 'react';
import { useApp } from '../../context/AppContext';
import { generateSignedContractPDF, generateStudentReportCardPDF, previewSignedContractPDF } from '../../lib/pdfGenerator';
import {
  Award,
  BookOpen,
  Calendar,
  FileSignature,
  Download,
  Eye,
  ShieldCheck,
  CheckCircle2,
  Bell,
  Sparkles
} from 'lucide-react';

export default function FamilyPortal() {
  const { students, enrollments } = useApp();

  const student = students[0]; // Gabriel Mendes Siqueira (exemplo da família)
  const studentEnrollment = enrollments.find(e => e.studentId === student.id) || enrollments[0];

  const subjects = [
    { name: 'Língua Portuguesa e Literatura', b1: 9.0, b2: 8.5, b3: 9.5, b4: 8.8, avg: 8.95 },
    { name: 'Matemática e Raciocínio Lógico', b1: 8.5, b2: 9.0, b3: 8.0, b4: 9.2, avg: 8.67 },
    { name: 'Física e Mecânica Clássica', b1: 8.0, b2: 7.5, b3: 8.5, b4: 8.0, avg: 8.00 },
    { name: 'Química Geral e Orgânica', b1: 9.2, b2: 8.8, b3: 9.0, b4: 9.4, avg: 9.10 },
    { name: 'Biologia e Meio Ambiente', b1: 9.5, b2: 9.0, b3: 9.5, b4: 9.8, avg: 9.45 },
    { name: 'Filosofia e Sociologia', b1: 10.0, b2: 9.5, b3: 10.0, b4: 9.8, avg: 9.82 }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header do Aluno / Família */}
      <div className="rodin-panel-card flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <img
            src={student.photoUrl}
            alt={student.name}
            className="w-16 h-16 rounded-full object-cover border-3 border-[#F45206] shadow-md shrink-0"
          />
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-[20px] font-black text-[#1E293B]">{student.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0E6] text-[#F45206] text-[10px] font-extrabold">
                {student.currentGrade}
              </span>
            </div>
            <span className="text-[12px] text-[#64748B] block">
              Matrícula: {student.enrollmentCode} • Responsável: {student.guardians[0].name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => generateStudentReportCardPDF(student)}
            className="btn-primary-rodin !py-2 !px-4 text-[12px]"
          >
            <Download size={15} />
            Baixar Boletim Completo
          </button>
        </div>
      </div>

      {/* Cards de Desempenho Rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-kpi-card">
          <span className="text-[11px] font-extrabold text-[#64748B] uppercase">Frequência Global</span>
          <span className="text-[30px] font-black text-[#059669] mt-1">{student.attendanceRate}</span>
          <span className="text-[11px] text-[#64748B]">Assiduidade exemplar</span>
        </div>

        <div className="stat-kpi-card">
          <span className="text-[11px] font-extrabold text-[#64748B] uppercase">Média Geral Ponderada</span>
          <span className="text-[30px] font-black text-[#F45206] mt-1">9.0</span>
          <span className="text-[11px] text-[#059669] font-bold">Aprovado por Média</span>
        </div>

        <div className="stat-kpi-card">
          <span className="text-[11px] font-extrabold text-[#64748B] uppercase">Tarefas Concluídas</span>
          <span className="text-[30px] font-black text-[#4338CA] mt-1">98%</span>
          <span className="text-[11px] text-[#64748B]">24 de 25 entregas pontuais</span>
        </div>
      </div>

      {/* Notas por Disciplina */}
      <div className="rodin-panel-card">
        <h2 className="text-[16px] font-black text-[#1E293B] mb-4 flex items-center gap-2">
          <Award size={18} className="text-[#F45206]" />
          Rendimento por Disciplina (Ano Letivo 2026)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-extrabold text-[#1E293B] truncate">{sub.name}</h3>
                <span className="text-[14px] font-black text-[#F45206]">{sub.avg.toFixed(1)}</span>
              </div>

              <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center pt-2 border-t border-[#E2E8F0]">
                <div className="bg-white p-1 rounded-lg border border-[#E2E8F0]">
                  <span className="text-[#94A3B8] block">1ºB</span>
                  <strong>{sub.b1.toFixed(1)}</strong>
                </div>
                <div className="bg-white p-1 rounded-lg border border-[#E2E8F0]">
                  <span className="text-[#94A3B8] block">2ºB</span>
                  <strong>{sub.b2.toFixed(1)}</strong>
                </div>
                <div className="bg-white p-1 rounded-lg border border-[#E2E8F0]">
                  <span className="text-[#94A3B8] block">3ºB</span>
                  <strong>{sub.b3.toFixed(1)}</strong>
                </div>
                <div className="bg-white p-1 rounded-lg border border-[#E2E8F0]">
                  <span className="text-[#94A3B8] block">4ºB</span>
                  <strong>{sub.b4.toFixed(1)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contratos Digitais Assinados com Selo de Integridade */}
      <div className="rodin-panel-card">
        <h2 className="text-[16px] font-black text-[#1E293B] mb-2 flex items-center gap-2">
          <FileSignature size={18} className="text-[#F45206]" />
          Documentos e Contratos Digitais Selados
        </h2>
        <p className="text-[12px] text-[#64748B] mb-4">
          Acesse os contratos assinados e autenticados eletronicamente pelo motor nativo Supabase
        </p>

        {studentEnrollment && (
          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>
              <div>
                <strong className="text-[13px] font-black text-[#1E293B] block">
                  Contrato de Prestação de Serviços Educacionais 2026
                </strong>
                <span className="text-[11px] text-[#64748B]">
                  Assinado em: {new Date(studentEnrollment.signedAt || studentEnrollment.createdAt).toLocaleDateString('pt-BR')} • Status: Ativo
                </span>
                <span className="text-[10px] font-mono text-[#94A3B8] block truncate max-w-md">
                  SHA-256: {studentEnrollment.documentSha256}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  previewSignedContractPDF(studentEnrollment);
                }}
                className="btn-secondary-rodin !py-2 !px-3.5 text-[12px] !border-[#CBD5E1] !text-[#1E293B] hover:!bg-[#F8FAFC] flex items-center gap-1.5 font-bold shadow-sm"
                title="Visualizar Requerimento Oficial em PDF"
              >
                <Eye size={15} className="text-[#F45206]" /> Visualizar
              </button>
              <button
                onClick={() => {
                  generateSignedContractPDF(studentEnrollment);
                }}
                className="btn-secondary-rodin !py-2 !px-3.5 text-[12px] !border-[#A7F3D0] !text-[#059669] hover:!bg-[#ECFDF5] flex items-center gap-1.5 font-bold shadow-sm"
                title="Baixar Requerimento Oficial em PDF"
              >
                <Download size={15} /> Baixar PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
