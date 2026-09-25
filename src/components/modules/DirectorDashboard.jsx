import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { removeAccents } from '../../lib/formatters';
import {
  Layers,
  Users,
  ShieldCheck,
  Plus,
  HelpCircle,
  FileSpreadsheet,
  CheckCircle2,
  BookOpen,
  UserPlus,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  Check
} from 'lucide-react';

export default function DirectorDashboard({ initialTab }) {
  const { activeTab, classes, students, questionBank, delegateClass, assignStudentClass, addQuestion, showToast } = useApp();

  const getStartingTab = () => {
    if (initialTab) return initialTab;
    if (activeTab === 'banco-questoes') return 'questions';
    return 'enturmacao';
  };

  const [selectedTab, setSelectedTab] = useState(getStartingTab());
  const [gradeFilter, setGradeFilter] = useState('all');
  const [searchStudent, setSearchStudent] = useState('');

  // Sincronizar quando o usuário clica no menu lateral
  React.useEffect(() => {
    if (activeTab === 'banco-questoes') {
      setSelectedTab('questions');
    } else if (activeTab === 'direcao') {
      setSelectedTab('enturmacao');
    }
  }, [activeTab]);

  // Form de Nova Questão
  const [newQuestion, setNewQuestion] = useState({
    subject: 'Física',
    gradeLevel: '1ª Série EM',
    difficulty: 'Média',
    content: '',
    correctOption: 'A',
    options: ['', '', '', '']
  });

  const handleAddQuestionSubmit = (e) => {
    e.preventDefault();
    if (!newQuestion.content || newQuestion.options.some(opt => !opt)) {
      showToast('Preencha o enunciado e todas as 4 alternativas.', 'error');
      return;
    }

    addQuestion(newQuestion);
    setNewQuestion({
      subject: 'Física',
      gradeLevel: '1ª Série EM',
      difficulty: 'Média',
      content: '',
      correctOption: 'A',
      options: ['', '', '', '']
    });
  };

  // Filtragem de alunos para enturmação
  const normQuery = removeAccents(searchStudent);
  const filteredStudents = students.filter(s => {
    const matchesSearch = removeAccents(s.name).includes(normQuery) ||
                          (s.cocCode && String(s.cocCode).toLowerCase().includes(normQuery));
    const matchesGrade = gradeFilter === 'all' || 
                         (s.currentGrade && s.currentGrade.includes(gradeFilter)) ||
                         (s.courseLevel && s.courseLevel.includes(gradeFilter));
    return matchesSearch && matchesGrade;
  });

  const pendingCount = students.filter(s => !s.classGroup || s.classGroup === 'Aguardando Enturmação').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="rodin-panel-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers size={20} className="text-[#F45206]" />
            <h1 className="text-[20px] font-black text-[#1E293B]">
              Direção Pedagógica e Orientação Educacional
            </h1>
          </div>
          <p className="text-[12px] font-semibold text-[#64748B]">
            Enturmação de alunos matriculados, delegação RLS para coordenadores e banco de questões
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar w-full md:w-auto">
          <button
            onClick={() => setSelectedTab('enturmacao')}
            className={`shrink-0 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-[12px] font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedTab === 'enturmacao'
                ? 'bg-[#F45206] text-white shadow-sm'
                : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
            }`}
          >
            <UserPlus size={14} />
            Enturmação de Alunos
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white text-[#F45206] text-[10px] font-black">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSelectedTab('delegation')}
            className={`shrink-0 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-[12px] font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedTab === 'delegation'
                ? 'bg-[#F45206] text-white shadow-sm'
                : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
            }`}
          >
            <ShieldCheck size={14} />
            Delegação de Turmas
          </button>

          <button
            onClick={() => setSelectedTab('questions')}
            className={`shrink-0 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-[12px] font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              selectedTab === 'questions'
                ? 'bg-[#F45206] text-white shadow-sm'
                : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
            }`}
          >
            <HelpCircle size={14} />
            Banco de Questões e Provas ({questionBank.length})
          </button>
        </div>
      </div>

      {/* =====================================================================
          ABA 1: ENTURMAÇÃO DE ALUNOS (DIRECIONAMENTO POR SÉRIE)
         ===================================================================== */}
      {selectedTab === 'enturmacao' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Card de Regra e Filtros */}
          <div className="rodin-panel-card !p-5 bg-gradient-to-r from-[#FFF0E6]/50 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F45206] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-[14px] font-black text-[#1E293B]">
                  Painel de Alocação de Turmas (Direção e Orientação)
                </h3>
                <p className="text-[12px] text-[#64748B] leading-tight mt-0.5">
                  O setor de matrículas define a série do estudante. Direcione cada aluno para a turma correspondente (Turma A, B ou C) com base no perfil e equilíbrio de sala.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto">
              <span className="text-[11px] font-bold text-[#64748B]">Total de Alunos: <strong className="text-[#1E293B]">{students.length}</strong></span>
              <span className="text-[11px] font-bold text-[#F45206] bg-[#FFF0E6] px-2.5 py-1 rounded-full border border-[#FED7AA]">
                {pendingCount} Pendentes
              </span>
            </div>
          </div>

          {/* Barra de Busca e Filtro por Série */}
          <div className="rodin-panel-card !p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Buscar por nome do aluno ou código COC..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E2E8F0] text-[13px] font-semibold text-[#1E293B] focus:outline-none focus:border-[#F45206] bg-[#F8FAFC]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[11px] font-extrabold text-[#64748B] uppercase shrink-0">Filtrar Série:</span>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#E2E8F0] text-[12px] font-bold text-[#1E293B] bg-[#F8FAFC] focus:outline-none focus:border-[#F45206]"
              >
                <option value="all">Todas as Séries</option>
                <option value="6º">6º Ano EF</option>
                <option value="7º">7º Ano EF</option>
                <option value="8º">8º Ano EF</option>
                <option value="9º">9º Ano EF</option>
                <option value="1ª">1ª Série EM</option>
                <option value="2ª">2ª Série EM</option>
                <option value="3ª">3ª Série EM</option>
              </select>
            </div>
          </div>

          {/* Tabela de Alocação de Turmas */}
          <div className="rodin-panel-card !p-0 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-extrabold text-[#64748B] uppercase tracking-[0.5px]">
                  <th className="py-3.5 px-5">Aluno e COC</th>
                  <th className="py-3.5 px-4">Série Contratada</th>
                  <th className="py-3.5 px-4">Perfil / Observação</th>
                  <th className="py-3.5 px-4">Status da Turma</th>
                  <th className="py-3.5 px-5 text-right">Direcionar / Alocar Turma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[13px]">
                {filteredStudents.map((std) => {
                  const isPending = !std.classGroup || std.classGroup === 'Aguardando Enturmação';

                  return (
                    <tr key={std.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={std.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100 e auto=format e fit=crop e q=80'}
                            alt={std.name}
                            className="w-9 h-9 rounded-full object-cover border border-[#E2E8F0]"
                          />
                          <div>
                            <strong className="text-[#1E293B] font-extrabold block">{std.name}</strong>
                            <span className="text-[11px] text-[#64748B] font-mono">COC {std.cocCode || '2560'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-bold text-[#1E293B] block">{std.currentGrade}</span>
                        <span className="text-[11px] text-[#64748B]">{std.courseLevel}</span>
                      </td>

                      <td className="py-4 px-4">
                        {std.condition && std.condition !== 'Normal' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5] text-[10px] font-extrabold">
                            {std.condition}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#94A3B8] font-semibold">Padrão</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FFF0E6] text-[#F45206] border border-[#FED7AA] text-[11px] font-extrabold">
                            Aguardando Enturmação
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[11px] font-extrabold">
                            <Check size={13} /> {std.classGroup}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            defaultValue={std.classGroup || ''}
                            onChange={(e) => {
                              const selectedGroup = e.target.value;
                              if (selectedGroup) {
                                assignStudentClass(std.id, `cls-${selectedGroup.toLowerCase()}`, selectedGroup);
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-[12px] font-bold text-[#1E293B] bg-white focus:outline-none focus:border-[#F45206] shadow-sm"
                          >
                            <option value="" disabled>Selecionar Turma...</option>
                            <option value="Turma A">Alocar Turma A</option>
                            <option value="Turma B">Alocar Turma B</option>
                            <option value="Turma C">Alocar Turma C</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          ABA 2: DELEGAÇÃO DE TURMAS (RLS ASSIGNMENT)
         ===================================================================== */}
      {selectedTab === 'delegation' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="rodin-panel-card">
            <h2 className="text-[16px] font-black text-[#1E293B] mb-2">
              Atribuição de Coordenadores por Turma (Ano Letivo 2027)
            </h2>
            <p className="text-[12px] text-[#64748B] mb-5">
              A política de Row Level Security (RLS) do Supabase garante que cada coordenador tenha acesso restrito às turmas atribuídas abaixo.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-[10px] font-extrabold text-[#F45206] uppercase tracking-[0.5px]">
                        {cls.roomCode}
                      </span>
                      <h3 className="text-[14px] font-black text-[#1E293B]">
                        {cls.name}
                      </h3>
                      <span className="text-[11px] text-[#64748B]">
                        {cls.studentCount || 28} Alunos Matriculados
                      </span>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#059669] text-[10px] font-extrabold border border-[#A7F3D0]">
                      RLS Ativo
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0]">
                    <label className="text-[11px] font-extrabold text-[#64748B] uppercase block mb-1.5">
                      Coordenador(a) / Orientador(a) Responsável:
                    </label>
                    <select
                      value={cls.coordinatorId || 'u-coordinator'}
                      onChange={(e) => delegateClass(cls.id, e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-[12px] font-bold text-[#1E293B] bg-white focus:outline-none focus:border-[#F45206]"
                    >
                      <option value="u-coordinator">Prof. Carlos Eduardo (Coordenador EM)</option>
                      <option value="u-director">Profa. Dra. Helena Siqueira (Diretora)</option>
                      <option value="u-admin">Matheus Brandão (Admin Geral)</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          ABA 3: BANCO DE QUESTÕES E MONTADOR DE PROVAS
         ===================================================================== */}
      {selectedTab === 'questions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Formulário de Cadastro de Questão */}
          <div className="rodin-panel-card lg:col-span-1">
            <h2 className="text-[15px] font-black text-[#1E293B] mb-1">
              Cadastrar Nova Questão
            </h2>
            <p className="text-[11px] text-[#64748B] mb-4">
              Submeta itens para a matriz de avaliações
            </p>

            <form onSubmit={handleAddQuestionSubmit} className="space-y-3 text-[12px]">
              <div>
                <label className="form-label">Disciplina</label>
                <select
                  value={newQuestion.subject}
                  onChange={(e) => setNewQuestion({ ...newQuestion, subject: e.target.value })}
                  className="form-select"
                >
                  <option>Física</option>
                  <option>Matemática</option>
                  <option>Língua Portuguesa</option>
                  <option>Química</option>
                  <option>Biologia</option>
                  <option>História</option>
                </select>
              </div>

              <div>
                <label className="form-label">Série / Nível</label>
                <select
                  value={newQuestion.gradeLevel}
                  onChange={(e) => setNewQuestion({ ...newQuestion, gradeLevel: e.target.value })}
                  className="form-select"
                >
                  <option>1ª Série EM</option>
                  <option>2ª Série EM</option>
                  <option>3ª Série EM</option>
                  <option>9º Ano EF</option>
                </select>
              </div>

              <div>
                <label className="form-label">Enunciado da Questão *</label>
                <textarea
                  rows={3}
                  required
                  value={newQuestion.content}
                  onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
                  placeholder="Digite o texto base e o comando da questão..."
                  className="form-control resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="form-label">Alternativas (A, B, C, D)</label>
                {['A', 'B', 'C', 'D'].map((letter, idx) => (
                  <div key={letter} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={newQuestion.correctOption === letter}
                      onChange={() => setNewQuestion({ ...newQuestion, correctOption: letter })}
                      className="text-[#F45206] focus:ring-[#F45206]"
                    />
                    <span className="font-extrabold text-[#1E293B] text-[11px]">{letter})</span>
                    <input
                      type="text"
                      required
                      placeholder={`Alternativa ${letter}`}
                      value={newQuestion.options[idx]}
                      onChange={(e) => {
                        const newOpts = [...newQuestion.options];
                        newOpts[idx] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: newOpts });
                      }}
                      className="form-control !py-1 !text-[11px]"
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="btn-primary-rodin w-full !py-2.5 mt-2"
              >
                <Plus size={15} />
                Adicionar ao Banco
              </button>
            </form>
          </div>

          {/* Listagem das Questões do Banco */}
          <div className="rodin-panel-card lg:col-span-2">
            <h2 className="text-[15px] font-black text-[#1E293B] mb-1">
              Banco de Questões Homologadas ({questionBank.length})
            </h2>
            <p className="text-[11px] text-[#64748B] mb-4">
              Itens prontos para diagramação e montagem de provas supervisionadas
            </p>

            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1 custom-scrollbar">
              {questionBank.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#FFF0E6] text-[#F45206] font-extrabold text-[10px]">
                        {q.subject}
                      </span>
                      <span className="text-[11px] text-[#64748B] font-bold">
                        {q.gradeLevel} • Dificuldade: {q.difficulty}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#94A3B8]">#{q.id}</span>
                  </div>

                  <p className="text-[12px] font-semibold text-[#1E293B] leading-relaxed">
                    {idx + 1}. {q.content}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                    {q.options?.map((opt, i) => {
                      const letter = ['A', 'B', 'C', 'D'][i];
                      const isCorrect = q.correctOption === letter;

                      return (
                        <div
                          key={i}
                          className={`p-2 rounded-xl border flex items-center gap-2 ${
                            isCorrect
                              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46] font-bold'
                              : 'bg-white border-[#E2E8F0] text-[#475569]'
                          }`}
                        >
                          <span className="font-extrabold">{letter})</span>
                          <span>{opt}</span>
                          {isCorrect && <CheckCircle2 size={13} className="ml-auto text-[#10B981]" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
