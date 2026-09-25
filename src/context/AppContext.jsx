import React, { createContext, useContext, useState, useEffect } from 'react';
import { ALL_CLASSES_2027, ALL_STUDENTS_2027, ALL_ENROLLMENTS_2027 } from '../data/initialData2027';
import { FIXED_RATES_2027, getFixedRatesForGrade, DEFAULT_CAMPAIGN_CONFIG, getDynamicRatesForGrade, isLePeriniStudent, calculateRodinInstallments } from '../data/fixedRates';
import { syncEnrollmentToSupabase, fetchProfilesFromSupabase } from '../lib/supabaseStorage';

const AppContext = createContext();

export const PRESET_USERS = [
  { id: 'a0000000-0000-0000-0000-000000000008', name: 'Kelly Cristina Vilani', email: 'kelly.vilani@colegiorodin.com.br', role: 'enrollment', roleLabel: 'Setor de Matrículas', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
  { id: 'a0000000-0000-0000-0000-000000000009', name: 'Elisangela Cordeiro Santos', email: 'elisangela.santos@colegiorodin.com.br', role: 'enrollment', roleLabel: 'Setor de Matrículas', avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80' },
  { id: 'a0000000-0000-0000-0000-000000000010', name: 'Setor de Matrículas', email: 'matriculas@colegiorodin.com.br', password: 'Rod!n2027Mat', role: 'enrollment', roleLabel: 'Setor de Matrículas', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' }
];

export const getDefaultTabForRole = (role) => {
  switch (role) {
    case 'admin':
      return 'dashboard';
    case 'director':
      return 'direcao';
    case 'coordinator':
      return 'coordenacao';
    case 'teacher':
      return 'diario-classe';
    case 'secretary':
      return 'secretaria';
    case 'enrollment':
      return 'rematricula';
    case 'guardian':
    case 'student':
      return 'portal-familia';
    default:
      return 'dashboard';
  }
};

const INITIAL_CLASSES = [
  { id: 'cls-6ef-a', name: '6º Ano A - Fundamental II', gradeLevel: '6º Ano EF', academicYear: 2027, roomCode: 'SALA-201', coordinatorId: 'u-coordinator', studentCount: 28 },
  { id: 'cls-9ef-a', name: '9º Ano A - Fundamental II', gradeLevel: '9º Ano EF', academicYear: 2027, roomCode: 'SALA-204', coordinatorId: 'u-coordinator', studentCount: 24 },
  { id: 'cls-1em-a', name: '1º Ano A - Ensino Médio', gradeLevel: '1ª Série EM', academicYear: 2027, roomCode: 'SALA-101', coordinatorId: 'u-coordinator', studentCount: 28 },
  { id: 'cls-2em-a', name: '2º Ano A - Ensino Médio', gradeLevel: '2ª Série EM', academicYear: 2027, roomCode: 'SALA-102', coordinatorId: 'u-coordinator', studentCount: 26 },
  { id: 'cls-3em-terceirao', name: '3º Ano Terceirão - Pré-Vestibular', gradeLevel: '3ª Série EM', academicYear: 2027, roomCode: 'SALA-103', coordinatorId: 'u-coordinator', studentCount: 32 }
];

// Dados Iniciais Baseados na Planilha Oficial do Colégio Rodin 2027
const INITIAL_STUDENTS = [
  {
    id: 'std-2560',
    rmNumber: '2560',
    cocCode: '2560',
    name: 'Bruno Fialho de Almeida',
    studentName: 'Bruno Fialho de Almeida',
    enrollmentCode: 'RM 2560',
    gender: 'Masc.',
    studentGender: 'Masc.',
    birthDate: '2015-03-28',
    studentBirthDate: '2015-03-28',
    birthCity: 'Indaiatuba - SP',
    studentBirthCity: 'Indaiatuba - SP',
    nationality: 'Brasileiro(a)',
    studentNationality: 'Brasileiro(a)',
    rg: '67.246.698-3',
    studentRg: '67.246.698-3',
    rgIssuer: 'SSP/SP',
    studentRgIssuer: 'SSP/SP',
    rgIssueDate: '2021-08-23',
    studentRgIssueDate: '2021-08-23',
    cpf: '510.866.158-40',
    studentCpf: '510.866.158-40',
    studentPhone: '(19) 98120-6515',
    courseLevel: 'Ensino Fundamental',
    currentGrade: '6º Ano EF',
    classGroup: 'A',
    schoolShift: 'Manhã',
    schoolUnit: 'Colégio Rodin - Indaiatuba',
    condition: 'Superdotação',
    medicalAllergies: 'Nenhuma restrição alimentar cadastrada.',
    emergencyContact: '(19) 98120-6515',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    attendanceRate: '98%',
    guardians: [
      {
        id: 'g-2560-1',
        name: 'Wanderson Pedro de Almeida',
        guardianName: 'Wanderson Pedro de Almeida',
        kinshipRelation: 'Pai',
        guardianRelation: 'Pai',
        gender: 'Masc.',
        guardianGender: 'Masc.',
        cpf: '57.786.608-4',
        guardianCpf: '57.786.608-4',
        rg: '34.602.083',
        guardianRg: '34.602.083',
        rgIssuer: 'SSP/SP',
        guardianRgIssuer: 'SSP/SP',
        birthDate: '1982-05-11',
        guardianBirthDate: '1982-05-11',
        occupation: 'Gerente de Contas',
        guardianOccupation: 'Gerente de Contas',
        maritalStatus: 'Casado(a)',
        guardianMaritalStatus: 'Casado(a)',
        nationality: 'Brasileiro(a)',
        guardianNationality: 'Brasileiro(a)',
        email: 'wpalmeida@hotmail.com',
        guardianEmail: 'wpalmeida@hotmail.com',
        phoneMobile: '(19) 98120-6515',
        guardianPhone: '(19) 98120-6515',
        phoneLandline: '(19) 3875-1100',
        guardianLandline: '(19) 3875-1100',
        addressCep: '13340-385',
        guardianAddressCep: '13340-385',
        addressStreet: 'Rua Almerinda Benedita Pacheco de Alcantara',
        guardianAddressStreet: 'Rua Almerinda Benedita Pacheco de Alcantara',
        addressNumber: '160',
        guardianAddressNumber: '160',
        addressComplement: 'Casa 1',
        guardianAddressComplement: 'Casa 1',
        addressNeighborhood: 'Jardim Jequitibá',
        guardianAddressNeighborhood: 'Jardim Jequitibá',
        addressCity: 'Indaiatuba',
        guardianAddressCity: 'Indaiatuba',
        addressState: 'SP',
        guardianAddressState: 'SP',
        isFinancial: true,
        isPedagogical: true
      }
    ]
  },
  {
    id: 'std-2553',
    cocCode: '2553',
    name: 'Christian Pereira Machado de Campos',
    enrollmentCode: 'ROD-2027-2553',
    gender: 'Masculino',
    birthDate: '2014-09-19',
    birthCity: 'Indaiatuba - SP',
    nationality: 'Brasileiro(a)',
    rg: '600.376.580-18',
    rgIssuer: 'SSP/SP',
    rgIssueDate: '2018-09-19',
    cpf: '544.358.398-06',
    courseLevel: 'Ensino Fundamental',
    currentGrade: '6º Ano A - Fundamental II',
    classGroup: 'A',
    schoolShift: 'Manhã',
    schoolUnit: 'Colégio Rodin - Indaiatuba',
    condition: 'Normal',
    medicalAllergies: 'Intolerância leve a lactose.',
    emergencyContact: '(19) 99425-0269',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300 e auto=format e fit=crop e q=80',
    attendanceRate: '96%',
    guardians: [
      {
        id: 'g-2553-1',
        name: 'Natan Machado de Campos Neto',
        kinshipRelation: 'Pai',
        cpf: '247.950.638-00',
        rg: '30.505.709-1',
        rgIssuer: 'SSP/SP',
        birthDate: '1981-11-26',
        occupation: 'Diretor Financeiro',
        maritalStatus: 'Casado(a)',
        nationality: 'Brasileiro',
        email: 'natanneto2000@gmail.com',
        phoneMobile: '(19) 99425-0269',
        addressCep: '13338-530',
        addressStreet: 'Homero Paulo Lourenço Barnabé',
        addressNumber: '345',
        addressComplement: '',
        addressNeighborhood: 'Parque São Lourenço',
        addressCity: 'Indaiatuba',
        addressState: 'SP',
        isFinancial: true,
        isPedagogical: true
      }
    ]
  },
  {
    id: 'std-2564',
    cocCode: '2564',
    name: 'Letícia Carli Medeiros Silva',
    enrollmentCode: 'ROD-2027-2564',
    gender: 'Feminino',
    birthDate: '2015-08-31',
    birthCity: 'Campina Grande - PB',
    nationality: 'Brasileira',
    rg: '66.723.850-5',
    rgIssuer: 'SSP/PB',
    rgIssueDate: '2019-02-11',
    cpf: '134.069.664-97',
    courseLevel: 'Ensino Fundamental',
    currentGrade: '6º Ano A - Fundamental II',
    classGroup: 'A',
    schoolShift: 'Manhã',
    schoolUnit: 'Colégio Rodin - Indaiatuba',
    condition: 'TDAH',
    medicalAllergies: 'Alergia a dipirona.',
    emergencyContact: '(19) 98121-9200',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300 e auto=format e fit=crop e q=80',
    attendanceRate: '95%',
    guardians: [
      {
        id: 'g-2564-1',
        name: 'Yhalle Batista de Lucena',
        kinshipRelation: 'Pai',
        cpf: '084.261.824-45',
        rg: '32.402.443-5',
        rgIssuer: 'SSP/PB',
        birthDate: '1990-09-07',
        occupation: 'Engenheiro de Software',
        maritalStatus: 'Casado(a)',
        nationality: 'Brasileiro',
        email: 'yhalle07@gmail.com',
        phoneMobile: '(19) 98121-9200',
        addressCep: '13339-420',
        addressStreet: 'Rua Honduras',
        addressNumber: '134',
        addressComplement: '',
        addressNeighborhood: 'Jardim América',
        addressCity: 'Indaiatuba',
        addressState: 'SP',
        isFinancial: true,
        isPedagogical: true
      }
    ]
  },
  {
    id: 'std-1918',
    cocCode: '1918',
    name: 'Davi Peres Prandini',
    enrollmentCode: 'ROD-2027-1918',
    gender: 'Masculino',
    birthDate: '2010-04-18',
    birthCity: 'Indaiatuba - SP',
    nationality: 'Brasileiro',
    rg: '65.523.619-3',
    rgIssuer: 'SSP/SP',
    rgIssueDate: '2021-11-23',
    cpf: '564.238.668-99',
    courseLevel: 'Ensino Médio',
    currentGrade: '1º Ano A - Ensino Médio',
    classGroup: 'A',
    schoolShift: 'Manhã',
    schoolUnit: 'Colégio Rodin - Indaiatuba',
    condition: 'TEA',
    medicalAllergies: 'Nenhuma.',
    emergencyContact: '(19) 97519-1290',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300 e auto=format e fit=crop e q=80',
    attendanceRate: '97%',
    guardians: [
      {
        id: 'g-1918-1',
        name: 'Paulo Roberto Lopes Vieira',
        kinshipRelation: 'Pai',
        cpf: '305.241.008-37',
        rg: '22.999.728-4',
        rgIssuer: 'SSP/SP',
        birthDate: '1973-04-30',
        occupation: 'Analista de Sistemas',
        maritalStatus: 'Casado',
        nationality: 'Brasileiro',
        email: 'plvieira@iname.com',
        phoneMobile: '(19) 97519-1290',
        addressCep: '13343-580',
        addressStreet: 'Rua Sérgio Vieira de Mello',
        addressNumber: '125',
        addressComplement: '',
        addressNeighborhood: 'Jardim Sevilha',
        addressCity: 'Indaiatuba',
        addressState: 'SP',
        isFinancial: true,
        isPedagogical: true
      }
    ]
  }
];

const INITIAL_ENROLLMENTS = [
  {
    id: 'enr-2027-2560',
    studentId: 'std-2560',
    cocCode: '2560',
    studentName: 'Bruno Fialho de Almeida',
    enrollmentCode: 'ROD-2027-2560',
    courseLevel: 'Ensino Fundamental',
    currentGrade: '6º Ano A - Fundamental II',
    academicYear: 2027,
    status: 'active',
    schoolContractStatus: 'signed',
    materialContractStatus: 'signed',
    createdAt: '2026-08-21T14:30:00Z',
    contractId: 'ctr-2560',
    guardianName: 'Wanderson Pedro de Almeida',
    guardianRelation: 'Pai',
    guardianEmail: 'wpalmeida@hotmail.com',
    guardianPhone: '(19) 98120-6515',
    guardianCpf: '57.786.608-4',
    guardianAddress: 'Rua Almerinda Benedita Pacheco de Alcantara, 160 - Jd Jequitibá, Indaiatuba/SP',
    // Valores do Contrato
    tuitionGrossTotal: 34663.20,
    tuitionDiscountTotal: 32930.04,
    tuitionDiscountReason: 'Desconto de 5% a partir da 2ª parcela, mais 5% pontualidade',
    installmentsCount: 13,
    firstInstallmentValue: 2666.40,
    regularInstallmentValue: 2521.97,
    materialTotalValue: 5248.80,
    materialInstallmentsCount: 12,
    materialInstallmentValue: 437.40,
    materialStartDueDate: '2027-02-10',
    documentSha256: '9f83ca4628f89e273d489b09a473fa58b87e21a8d052a7c49122394c8e76c12e',
    signatureSha256: '4a3b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b',
    signedAt: '2026-08-21T10:15:32.412Z',
    ipAddress: '189.120.45.10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
  },
  {
    id: 'enr-2027-2553',
    studentId: 'std-2553',
    cocCode: '2553',
    studentName: 'Christian Pereira Machado de Campos',
    enrollmentCode: 'ROD-2027-2553',
    courseLevel: 'Ensino Fundamental',
    currentGrade: '6º Ano A - Fundamental II',
    academicYear: 2027,
    status: 'pending_signature',
    schoolContractStatus: 'signed',
    materialContractStatus: 'pending',
    createdAt: '2026-08-28T11:00:00Z',
    contractId: 'ctr-2553',
    guardianName: 'Natan Machado de Campos Neto',
    guardianRelation: 'Pai',
    guardianEmail: 'natanneto2000@gmail.com',
    guardianPhone: '(19) 99425-0269',
    guardianCpf: '247.950.638-00',
    guardianAddress: 'Homero Paulo Lourenço Barnabé, 345 - Pq São Lourenço, Indaiatuba/SP',
    tuitionGrossTotal: 34663.20,
    tuitionDiscountTotal: 34663.20,
    tuitionDiscountReason: 'Tabela Padrão (Sem Desconto)',
    installmentsCount: 13,
    firstInstallmentValue: 2666.40,
    regularInstallmentValue: 2666.40,
    materialTotalValue: 5248.80,
    materialInstallmentsCount: 12,
    materialInstallmentValue: 437.40,
    materialStartDueDate: '2027-02-10',
    documentSha256: '7c82ab9102ef89123847acb89129038471209384710293847102938471029384'
  },
  {
    id: 'enr-2027-2564',
    studentId: 'std-2564',
    cocCode: '2564',
    studentName: 'Letícia Carli Medeiros Silva',
    enrollmentCode: 'ROD-2027-2564',
    courseLevel: 'Ensino Fundamental',
    currentGrade: '6º Ano A - Fundamental II',
    academicYear: 2027,
    status: 'pending_signature',
    schoolContractStatus: 'pending',
    materialContractStatus: 'pending',
    createdAt: '2026-08-29T15:20:00Z',
    contractId: 'ctr-2564',
    guardianName: 'Yhalle Batista de Lucena',
    guardianRelation: 'Pai',
    guardianEmail: 'yhalle07@gmail.com',
    guardianPhone: '(19) 98121-9200',
    guardianCpf: '084.261.824-45',
    guardianAddress: 'Rua Honduras, 134 - Jardim América, Indaiatuba/SP',
    tuitionGrossTotal: 34663.20,
    tuitionDiscountTotal: 27730.56,
    tuitionDiscountReason: 'Desconto LePerini - 20% na Anuidade',
    installmentsCount: 13,
    firstInstallmentValue: 2133.12,
    regularInstallmentValue: 2133.12,
    materialTotalValue: 5248.80,
    materialInstallmentsCount: 12,
    materialInstallmentValue: 437.40,
    materialStartDueDate: '2027-02-10',
    documentSha256: 'b391f82736481029384710293847102938471029384710293847102938471029'
  }
];

const INITIAL_LOGS = [
  { id: 'log-1', classId: 'cls-6ef-a', studentId: 'std-2560', studentName: 'Bruno Fialho de Almeida', teacherName: 'Prof. André Castilho', logType: 'behavior_positive', category: 'Excelente Participação', description: 'Demonstrou raciocínio excepcional no laboratório de robótica ao resolver o desafio de cinemática.', timestamp: '2026-08-28T09:40:00Z' },
  { id: 'log-2', classId: 'cls-6ef-a', studentId: 'std-2564', studentName: 'Letícia Carli Medeiros Silva', teacherName: 'Prof. André Castilho', logType: 'observation', category: 'Sonolência / Desatenção', description: 'Apresentou sinais de cansaço durante o segundo bloco. Foi orientada com pausa ativa.', timestamp: '2026-08-28T10:15:00Z' },
  { id: 'log-3', classId: 'cls-1em-a', studentId: 'std-1918', studentName: 'Davi Peres Prandini', teacherName: 'Prof. André Castilho', logType: 'behavior_warning', category: 'Uso Indevido de Smartphone', description: 'Utilização de aparelho celular durante explicação sem finalidade pedagógica.', timestamp: '2026-08-27T14:20:00Z' },
  { id: 'log-4', classId: 'cls-6ef-a', studentId: 'std-2560', studentName: 'Bruno Fialho de Almeida', teacherName: 'Prof. André Castilho', logType: 'attendance', category: 'Ida ao Banheiro / Bebedouro', description: 'Saída breve autorizada às 10:05.', timestamp: '2026-08-30T10:05:00Z' }
];

const INITIAL_QUESTIONS = [
  { id: 'q-1', subject: 'Física', gradeLevel: '1ª Série EM', difficulty: 'Média', content: 'Um móvel parte do repouso e atinge uma velocidade de 30 m/s em um intervalo de 6 segundos. Qual a sua aceleração média escalar?', correctOption: 'A', options: ['5,0 m/s²', '4,0 m/s²', '6,0 m/s²', '180 m/s²'] },
  { id: 'q-2', subject: 'Matemática', gradeLevel: '6º Ano EF', difficulty: 'Fácil', content: 'Calcule o valor da expressão numérica: 15 + 4 × (12 - 3) ÷ 6.', correctOption: 'B', options: ['18', '21', '24', '19'] },
  { id: 'q-3', subject: 'Língua Portuguesa', gradeLevel: '3ª Série EM', difficulty: 'Média', content: 'No contexto do Modernismo Brasileiro de 1922, qual obra de Mário de Andrade representa o herói sem nenhum caráter?', correctOption: 'B', options: ['Pauliceia Desvairada', 'Macunaíma', 'Amar, Verbo Intransitivo', 'Serafim Ponte Grande'] }
];

export function AppProvider({ children }) {
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('rodin_all_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return PRESET_USERS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('rodin_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          // Checar se rodin_all_users possui versão com avatar atualizado
          const allSaved = localStorage.getItem('rodin_all_users');
          if (allSaved) {
            const allParsed = JSON.parse(allSaved);
            const found = allParsed.find(u => u.id === parsed.id || (u.email && u.email.toLowerCase() === parsed.email?.toLowerCase()));
            if (found && found.avatar) {
              return { ...parsed, avatar: found.avatar, name: found.name || parsed.name };
            }
          }
          return parsed;
        }
      }
    } catch (e) {}
    return PRESET_USERS[0];
  });

  // Função para sincronizar perfis atualizados diretamente da tabela public.profiles do Supabase
  const refreshUsersFromSupabase = async () => {
    try {
      const dbProfiles = await fetchProfilesFromSupabase();
      if (dbProfiles && Array.isArray(dbProfiles) && dbProfiles.length > 0) {
        setUsers(prevUsers => {
          const updated = prevUsers.map(u => {
            const match = dbProfiles.find(p => p.id === u.id || (p.email && p.email.toLowerCase() === (u.email || '').toLowerCase()));
            if (match && match.avatar_url) {
              return {
                ...u,
                name: match.name || u.name,
                email: match.email || u.email,
                avatar: match.avatar_url
              };
            }
            return u;
          });

          // Adicionar novos usuários cadastrados no Supabase
          dbProfiles.forEach(p => {
            const exists = updated.some(u => u.id === p.id || (u.email && u.email.toLowerCase() === (p.email || '').toLowerCase()));
            if (!exists) {
              updated.push({
                id: p.id,
                name: p.name || 'Setor de Matrículas',
                email: p.email,
                password: p.email === 'matriculas@colegiorodin.com.br' ? 'Rod!n2027Mat' : 'rodin2027',
                role: p.role || 'enrollment',
                roleLabel: p.role_label || 'Setor de Matrículas',
                avatar: p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              });
            }
          });

          try {
            localStorage.setItem('rodin_all_users', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        // Sincronizar o usuário atualmente logado caso a foto dele tenha mudado no Supabase
        setCurrentUser(curr => {
          if (!curr) return curr;
          const match = dbProfiles.find(p => p.id === curr.id || (p.email && p.email.toLowerCase() === (curr.email || '').toLowerCase()));
          if (match && match.avatar_url && match.avatar_url !== curr.avatar) {
            const newCurr = {
              ...curr,
              name: match.name || curr.name,
              email: match.email || curr.email,
              avatar: match.avatar_url
            };
            try {
              localStorage.setItem('rodin_current_user', JSON.stringify(newCurr));
            } catch (e) {}
            return newCurr;
          }
          return curr;
        });
      }
    } catch (err) {
      console.warn('Sincronização de perfis com Supabase indisponível no momento:', err);
    }
  };

  useEffect(() => {
    refreshUsersFromSupabase();
  }, []);

  const updateUserProfile = (updatedUser) => {
    if (!updatedUser) return;
    setCurrentUser(updatedUser);
    setUsers(prev => {
      const newUsers = prev.map(u => 
        (u.id === updatedUser.id || (u.email && u.email.toLowerCase() === (updatedUser.email || '').toLowerCase()))
          ? { ...u, ...updatedUser }
          : u
      );
      try {
        localStorage.setItem('rodin_all_users', JSON.stringify(newUsers));
      } catch (e) {}
      return newUsers;
    });
    try {
      localStorage.setItem('rodin_current_user', JSON.stringify(updatedUser));
    } catch (e) {}
  };

  const [activeTab, setActiveTab] = useState('rematricula');
  const [classes, setClasses] = useState(ALL_CLASSES_2027 && ALL_CLASSES_2027.length > 0 ? ALL_CLASSES_2027 : INITIAL_CLASSES);

  // Cache Buster para garantir tagueamento Le Perini (DLP) exato da planilha oficial (2027)
  const DB_VERSION = 'rodin_2027_v12_exact_le_perini_dlp';
  try {
    if (typeof window !== 'undefined' && localStorage.getItem('rodin_db_version') !== DB_VERSION) {
      localStorage.removeItem('rodin_students');
      localStorage.removeItem('rodin_enrollments');
      localStorage.removeItem('rodin_campaign_config');
      localStorage.removeItem('rodin_signing_enrollment');
      localStorage.removeItem('rodin_pending_reenrollment_search');
      localStorage.setItem('rodin_db_version', DB_VERSION);
    }
  } catch (e) {}

  const [students, setStudents] = useState(() => {
    try {
      const saved = localStorage.getItem('rodin_students');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 50) {
          return parsed.map(s => {
            const enr = (ALL_ENROLLMENTS_2027 || []).find(e => e.rmNumber === s.rmNumber || e.cocCode === s.cocCode);
            return {
              ...s,
              isLePerini: isLePeriniStudent(s, enr)
            };
          });
        }
      }
    } catch (e) {}
    const base = (ALL_STUDENTS_2027 && ALL_STUDENTS_2027.length > 0) ? ALL_STUDENTS_2027 : INITIAL_STUDENTS;
    return base.map(s => {
      const enr = (ALL_ENROLLMENTS_2027 || []).find(e => e.rmNumber === s.rmNumber || e.cocCode === s.cocCode);
      return {
        ...s,
        isLePerini: isLePeriniStudent(s, enr)
      };
    });
  });

  const [enrollments, setEnrollments] = useState(() => {
    try {
      const saved = localStorage.getItem('rodin_enrollments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 50) {
          return parsed.map(e => {
            const std = (ALL_STUDENTS_2027 || []).find(s => s.rmNumber === e.rmNumber || s.cocCode === e.cocCode);
            return {
              ...e,
              isLePerini: isLePeriniStudent(std, e),
              schoolContractStatus: e.schoolContractStatus || (e.status === 'active' || e.status === 'reenrolled' ? 'signed' : 'pending'),
              materialContractStatus: e.materialContractStatus || (e.status === 'active' || e.status === 'reenrolled' ? 'signed' : 'pending'),
              materialStartDueDate: (e.materialStartDueDate && !e.materialStartDueDate.includes('2026') && !e.materialStartDueDate.includes('2025')) ? e.materialStartDueDate : '2027-01-10',
              materialEndDueDate: (e.materialEndDueDate && !e.materialEndDueDate.includes('2026') && !e.materialEndDueDate.includes('2025')) ? e.materialEndDueDate : '2027-12-10',
              materialPaymentMethod: (e.materialPaymentMethod && e.materialPaymentMethod.toLowerCase().includes('cart')) ? 'Cartão de Crédito' : 'Boleto Bancário'
            };
          });
        }
      }
    } catch (e) {}
    const base = (ALL_ENROLLMENTS_2027 && ALL_ENROLLMENTS_2027.length > 0) ? ALL_ENROLLMENTS_2027 : INITIAL_ENROLLMENTS;
    return base.map(e => {
      const std = (ALL_STUDENTS_2027 || []).find(s => s.rmNumber === e.rmNumber || s.cocCode === e.cocCode);
      return {
        ...e,
        isLePerini: isLePeriniStudent(std, e)
      };
    });
  });

  const [classroomLogs, setClassroomLogs] = useState(INITIAL_LOGS);
  const [questionBank, setQuestionBank] = useState(INITIAL_QUESTIONS);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [signingEnrollment, setSigningEnrollment] = useState(null);
  const [selectedStudentRx, setSelectedStudentRx] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = localStorage.getItem('rodin_is_authenticated');
    return saved !== null ? saved === 'true' : true;
  });

  const login = (user) => {
    if (!user) return;
    const freshUser = users.find(u => u.id === user.id || (u.email && u.email.toLowerCase() === (user.email || '').toLowerCase())) || user;
    setCurrentUser(freshUser);
    setIsAuthenticated(true);
    const targetTab = getDefaultTabForRole(freshUser.role);
    setActiveTab(targetTab);
    localStorage.setItem('rodin_is_authenticated', 'true');
    localStorage.setItem('rodin_current_user', JSON.stringify(freshUser));
    showToast(`Bem-vindo(a), ${freshUser.name}!`);
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('rodin_is_authenticated', 'false');
    if (typeof window !== 'undefined') {
      window.location.hash = '';
    }
    setSigningEnrollment(null);
    setSelectedStudentRx(null);
    setIsMobileMenuOpen(false);
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  // Configuração da Campanha de Rematrícula (Ano Letivo, Ativa/Pausada e Valores por Ciclo)
  const [campaignConfig, setCampaignConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('rodin_campaign_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.cycles) return parsed;
      }
    } catch (e) {}
    return DEFAULT_CAMPAIGN_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem('rodin_campaign_config', JSON.stringify(campaignConfig));
    } catch (e) {}
  }, [campaignConfig]);

  const updateCampaignConfig = (newConfig) => {
    setCampaignConfig(prev => {
      const updated = typeof newConfig === 'function' ? newConfig(prev) : { ...prev, ...newConfig };
      try {
        localStorage.setItem('rodin_campaign_config', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast('Parâmetros da campanha de rematrícula atualizados com sucesso!');
  };

  useEffect(() => {
    localStorage.setItem('rodin_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('rodin_enrollments', JSON.stringify(enrollments));
    } catch (e) {}
  }, [enrollments]);

  useEffect(() => {
    try {
      localStorage.setItem('rodin_students', JSON.stringify(students));
    } catch (e) {}
  }, [students]);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper Criptográfico Nativo SHA-256 via WebCrypto API
  const calculateSHA256 = async (textOrBuffer) => {
    const encoder = new TextEncoder();
    const data = typeof textOrBuffer === 'string' ? encoder.encode(textOrBuffer) : textOrBuffer;
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Gera automaticamente o próximo RM único e sequencial do sistema
  const getNextRM = () => {
    const allRMs = [
      ...students.map(s => parseInt(s.rmNumber || s.cocCode || 0)),
      ...enrollments.map(e => parseInt(e.rmNumber || e.cocCode || 0))
    ].filter(n => !isNaN(n) && n > 0);

    const maxRM = allRMs.length > 0 ? Math.max(...allRMs) : 2569;
    return (maxRM + 1).toString();
  };

  // Criar Nova Matrícula com Estrutura Completa do Requerimento 2027 (RM Registro Único pelo Sistema)
  const createEnrollment = async (data) => {
    const rm = data.rmNumber || getNextRM();
    const newStudentId = `std-${rm}`;
    const enrollmentCode = `RM ${rm}`;
    const contractId = `ctr-${rm}`;

    // Hash SHA-256 baseado em todos os metadados do contrato e requerimento
    const contractRawText = `REQUERIMENTO_RODIN_2027_RM_${rm}_${data.studentName}_${data.guardianCpf || data.guardianFinancialCpf}_${data.tuitionGrossTotal}_${Date.now()}`;
    const documentSha256 = await calculateSHA256(contractRawText);

    const fullAddress = `${data.guardianAddressStreet || ''}, ${data.guardianAddressNumber || ''} ${data.guardianAddressComplement ? '- ' + data.guardianAddressComplement : ''} - ${data.guardianAddressNeighborhood || ''}, ${data.guardianAddressCity || 'Indaiatuba'}/${data.guardianAddressState || 'SP'}`;

    const newStudent = {
      id: newStudentId,
      rmNumber: rm,
      cocCode: rm,
      name: data.studentName,
      studentName: data.studentName,
      enrollmentCode,
      gender: data.studentGender || data.gender || 'Masc.',
      studentGender: data.studentGender || data.gender || 'Masc.',
      birthDate: data.studentBirthDate || data.birthDate,
      studentBirthDate: data.studentBirthDate || data.birthDate,
      birthCity: data.studentBirthCity || data.birthCity || 'Indaiatuba - SP',
      studentBirthCity: data.studentBirthCity || data.birthCity || 'Indaiatuba - SP',
      nationality: data.studentNationality || data.nationality || 'Brasileiro(a)',
      studentNationality: data.studentNationality || data.nationality || 'Brasileiro(a)',
      rg: data.studentRg || data.rg,
      studentRg: data.studentRg || data.rg,
      rgIssuer: data.studentRgIssuer || data.rgIssuer || 'SSP/SP',
      studentRgIssuer: data.studentRgIssuer || data.rgIssuer || 'SSP/SP',
      rgIssueDate: data.studentRgIssueDate || data.rgIssueDate,
      studentRgIssueDate: data.studentRgIssueDate || data.rgIssueDate,
      cpf: data.studentCpf || data.cpf,
      studentCpf: data.studentCpf || data.cpf,
      studentPhone: data.studentPhone || '',
      courseLevel: data.courseLevel || 'Ensino Fundamental',
      currentGrade: data.currentGrade || '6º Ano EF',
      classGroup: data.classGroup || 'A',
      schoolShift: data.schoolShift || 'Manhã',
      schoolUnit: 'Colégio Rodin - Indaiatuba',
      condition: data.condition || 'Normal',
      medicalAllergies: data.medicalAllergies || 'Nenhuma.',
      emergencyContact: data.studentPhone || data.guardianPhone || data.guardianFinancialPhone,
      photoUrl: data.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      attendanceRate: '100%',
      guardians: [
        {
          id: `g-${Date.now()}-1`,
          name: data.guardianName || data.guardianFinancialName,
          guardianName: data.guardianName || data.guardianFinancialName,
          kinshipRelation: data.guardianRelation || data.guardianFinancialRelation || 'Pai',
          guardianRelation: data.guardianRelation || data.guardianFinancialRelation || 'Pai',
          gender: data.guardianGender || 'Masc.',
          guardianGender: data.guardianGender || 'Masc.',
          cpf: data.guardianCpf || data.guardianFinancialCpf,
          guardianCpf: data.guardianCpf || data.guardianFinancialCpf,
          rg: data.guardianRg || data.guardianFinancialRg,
          guardianRg: data.guardianRg || data.guardianFinancialRg,
          rgIssuer: data.guardianRgIssuer || data.guardianFinancialRgIssuer || 'SSP/SP',
          guardianRgIssuer: data.guardianRgIssuer || data.guardianFinancialRgIssuer || 'SSP/SP',
          birthDate: data.guardianBirthDate || data.guardianFinancialBirthDate,
          guardianBirthDate: data.guardianBirthDate || data.guardianFinancialBirthDate,
          occupation: data.guardianOccupation || data.guardianFinancialOccupation || 'Profissional',
          guardianOccupation: data.guardianOccupation || data.guardianFinancialOccupation || 'Profissional',
          maritalStatus: data.guardianMaritalStatus || data.guardianFinancialMaritalStatus || 'Casado(a)',
          guardianMaritalStatus: data.guardianMaritalStatus || data.guardianFinancialMaritalStatus || 'Casado(a)',
          nationality: data.guardianNationality || data.guardianFinancialNationality || 'Brasileiro(a)',
          guardianNationality: data.guardianNationality || data.guardianFinancialNationality || 'Brasileiro(a)',
          email: data.guardianEmail || data.guardianFinancialEmail,
          guardianEmail: data.guardianEmail || data.guardianFinancialEmail,
          phoneMobile: data.guardianPhone || data.guardianFinancialPhone,
          guardianPhone: data.guardianPhone || data.guardianFinancialPhone,
          phoneLandline: data.guardianLandline || data.guardianFinancialLandline || '',
          guardianLandline: data.guardianLandline || data.guardianFinancialLandline || '',
          addressCep: data.guardianAddressCep || '13340-385',
          guardianAddressCep: data.guardianAddressCep || '13340-385',
          addressStreet: data.guardianAddressStreet || 'Rua Principal',
          guardianAddressStreet: data.guardianAddressStreet || 'Rua Principal',
          addressNumber: data.guardianAddressNumber || '100',
          guardianAddressNumber: data.guardianAddressNumber || '100',
          addressComplement: data.guardianAddressComplement || '',
          guardianAddressComplement: data.guardianAddressComplement || '',
          addressNeighborhood: data.guardianAddressNeighborhood || 'Bairro',
          guardianAddressNeighborhood: data.guardianAddressNeighborhood || 'Bairro',
          addressCity: data.guardianAddressCity || 'Indaiatuba',
          guardianAddressCity: data.guardianAddressCity || 'Indaiatuba',
          addressState: data.guardianAddressState || 'SP',
          guardianAddressState: data.guardianAddressState || 'SP',
          isFinancial: true,
          isPedagogical: true
        }
      ]
    };

    const rates = getFixedRatesForGrade(data.currentGrade);
    const tuitionGross = typeof data.tuitionGrossTotal === 'number' ? data.tuitionGrossTotal : parseFloat(String(data.tuitionGrossTotal || rates.tuitionNominalNum).replace(/\./g, '').replace(',', '.')) || rates.tuitionNominalNum;
    const countInst = parseInt(data.installmentsCount || rates.tuitionInstallmentsCount);
    const isLP = Boolean(data.isLePerini !== undefined ? data.isLePerini : isLePeriniStudent(data));
    const instCalc = calculateRodinInstallments(tuitionGross, rates.tuitionNominalNum, countInst, isLP, data.firstInstallmentValue);
    const firstParc = instCalc.firstInstallment;
    const regParc = instCalc.regularInstallment;
    const matTotal = typeof data.materialTotalValue === 'number' ? data.materialTotalValue : parseFloat(String(data.materialTotalValue || rates.materialTotalNum).replace(/\./g, '').replace(',', '.')) || rates.materialTotalNum;

    const newEnrollment = {
      id: `enr-2027-${rm}`,
      studentId: newStudentId,
      rmNumber: rm,
      cocCode: rm,
      studentName: data.studentName,
      studentGender: data.studentGender || data.gender || 'Masc.',
      studentBirthDate: data.studentBirthDate || data.birthDate,
      studentBirthCity: data.studentBirthCity || data.birthCity,
      studentRg: data.studentRg || data.rg,
      studentRgIssuer: data.studentRgIssuer || data.rgIssuer || 'SSP/SP',
      studentRgIssueDate: data.studentRgIssueDate || data.rgIssueDate,
      studentCpf: data.studentCpf || data.cpf,
      studentNationality: data.studentNationality || data.nationality || 'Brasileiro(a)',
      studentPhone: data.studentPhone || '',
      enrollmentCode,
      courseLevel: data.courseLevel || 'Ensino Fundamental',
      schoolShift: data.schoolShift || 'Manhã',
      currentGrade: data.currentGrade || '6º Ano EF',
      academicYear: data.academicYear || 2027,
      status: 'pending_signature',
      createdAt: new Date().toISOString(),
      contractId,
      // Responsável Financeiro
      guardianName: data.guardianName || data.guardianFinancialName,
      guardianRelation: data.guardianRelation || data.guardianFinancialRelation || 'Pai',
      guardianGender: data.guardianGender || 'Masc.',
      guardianBirthDate: data.guardianBirthDate || data.guardianFinancialBirthDate,
      guardianOccupation: data.guardianOccupation || data.guardianFinancialOccupation || 'Profissional',
      guardianMaritalStatus: data.guardianMaritalStatus || data.guardianFinancialMaritalStatus || 'Casado(a)',
      guardianRg: data.guardianRg || data.guardianFinancialRg,
      guardianRgIssuer: data.guardianRgIssuer || data.guardianFinancialRgIssuer || 'SSP/SP',
      guardianCpf: data.guardianCpf || data.guardianFinancialCpf,
      guardianNationality: data.guardianNationality || data.guardianFinancialNationality || 'Brasileiro(a)',
      guardianEmail: data.guardianEmail || data.guardianFinancialEmail,
      guardianLandline: data.guardianLandline || data.guardianFinancialLandline || '',
      guardianPhone: data.guardianPhone || data.guardianFinancialPhone,
      guardianAddress: fullAddress,
      guardianAddressCep: data.guardianAddressCep,
      guardianAddressStreet: data.guardianAddressStreet,
      guardianAddressNumber: data.guardianAddressNumber,
      guardianAddressComplement: data.guardianAddressComplement,
      guardianAddressNeighborhood: data.guardianAddressNeighborhood,
      guardianAddressCity: data.guardianAddressCity,
      guardianAddressState: data.guardianAddressState,
      // Dados Financeiros (Plano e Forma de Pagamento com taxas fixas oficiais 2027)
      tuitionGrossTotal: tuitionGross,
      tuitionDiscountTotal: typeof data.tuitionDiscountTotal === 'number' ? data.tuitionDiscountTotal : tuitionGross,
      installmentsCount: countInst,
      firstInstallmentValue: firstParc,
      regularInstallmentValue: regParc,
      paymentNote: data.paymentNote || '* Boleto Bancário com vencimento mensal e sucessivo todo dia: 1º.',
      // Material Didático (Livraria do Pensador LTDA)
      materialBuyerName: data.materialBuyerName || data.guardianName || '',
      materialBuyerCpf: data.materialBuyerCpf || data.guardianCpf || '',
      materialTotalValue: matTotal,
      materialInstallmentsCount: parseInt(data.materialInstallmentsCount || rates.materialInstallmentsCount),
      materialStartDueDate: data.materialStartDueDate || '2027-01-10',
      materialEndDueDate: data.materialEndDueDate || '2027-12-10',
      materialPaymentMethod: (data.materialPaymentMethod && data.materialPaymentMethod.toLowerCase().includes('cart')) ? 'Cartão de Crédito' : 'Boleto Bancário',
      isLePerini: isLP,
      documentSha256
    };

    setStudents(prev => [newStudent, ...prev]);
    setEnrollments(prev => [newEnrollment, ...prev]);
    showToast(`Matrícula RM nº ${rm} cadastrada com sucesso!`);
    return newEnrollment;
  };

  // =========================================================================
  // NOVO FLUXO: ESCOLA CRIA PROPOSTA COM RM, ANUIDADE E PARCELAS
  // =========================================================================
  const createEnrollmentProposal = async (proposalData) => {
    const rm = proposalData.rmNumber || getNextRM();
    const newEnrollmentId = `enr-2027-${rm}`;
    const enrollmentCode = `RM ${rm}`;
    const contractId = `ctr-${rm}`;

    const propRates = getFixedRatesForGrade(proposalData.currentGrade);

    const grossTotal = typeof proposalData.tuitionGrossTotal === 'number'
      ? proposalData.tuitionGrossTotal
      : parseFloat(String(proposalData.tuitionGrossTotal || propRates.tuitionNominalNum).replace(/\./g, '').replace(',', '.')) || propRates.tuitionNominalNum;

    const propCount = parseInt(proposalData.installmentsCount || propRates.tuitionInstallmentsCount);
    const isLPProp = Boolean(proposalData.isLePerini !== undefined ? proposalData.isLePerini : isLePeriniStudent(proposalData));
    const instCalcProp = calculateRodinInstallments(grossTotal, propRates.tuitionNominalNum, propCount, isLPProp, proposalData.firstInstallmentValue);
    const firstVal = instCalcProp.firstInstallment;
    const regularVal = instCalcProp.regularInstallment;

    const matTotal = typeof proposalData.materialTotalValue === 'number'
      ? proposalData.materialTotalValue
      : parseFloat(String(proposalData.materialTotalValue || propRates.materialTotalNum).replace(/\./g, '').replace(',', '.')) || propRates.materialTotalNum;

    const newProposal = {
      id: newEnrollmentId,
      studentId: `std-${rm}`,
      rmNumber: rm,
      cocCode: rm,
      studentName: proposalData.studentName || `Estudante RM ${rm}`,
      enrollmentCode,
      courseLevel: proposalData.courseLevel || 'Ensino Fundamental',
      schoolShift: proposalData.schoolShift || 'Manhã',
      currentGrade: proposalData.currentGrade || '6º Ano EF',
      academicYear: proposalData.academicYear || 2027,
      status: 'pending_parent_completion', // Aguardando Preenchimento e Assinatura do Pai
      createdAt: new Date().toISOString(),
      contractId,
      // Dados Financeiros Fixados pela Escola
      tuitionGrossTotal: grossTotal,
      tuitionDiscountTotal: grossTotal,
      installmentsCount: propCount,
      firstInstallmentValue: firstVal,
      firstInstallmentSplit: parseInt(proposalData.firstInstallmentSplit) || 1,
      firstInstallmentPaymentMethod: proposalData.firstInstallmentPaymentMethod || 'Cartão de Crédito (até 5x) ou Boleto',
      regularInstallmentValue: regularVal,
      isLePerini: isLPProp,
      paymentNote: proposalData.paymentNote || '* Boleto Bancário com vencimento mensal e sucessivo todo dia: 1º.',
      // Material Didático (Livraria do Pensador LTDA)
      materialBuyerName: proposalData.materialBuyerName || proposalData.guardianName || '',
      materialBuyerCpf: proposalData.materialBuyerCpf || proposalData.guardianCpf || '',
      materialTotalValue: matTotal,
      materialInstallmentsCount: parseInt(proposalData.materialInstallmentsCount || 6),
      materialStartDueDate: proposalData.materialStartDueDate || '2027-01-10',
      materialEndDueDate: proposalData.materialEndDueDate || '2027-12-10',
      materialPaymentMethod: (proposalData.materialPaymentMethod && proposalData.materialPaymentMethod.toLowerCase().includes('cart')) ? 'Cartão de Crédito' : 'Boleto Bancário',
      // Dados Preliminares (podem ser preenchidos pelo operador ou aguardar o pai)
      guardianName: proposalData.guardianName || '',
      guardianPhone: proposalData.guardianPhone || '',
      guardianEmail: proposalData.guardianEmail || '',
      guardianCpf: proposalData.guardianCpf || '',
      studentPhone: proposalData.studentPhone || '',
      accessCode: proposalData.accessCode || `ROD-${Math.floor(1000 + Math.random() * 9000)}`
    };

    setEnrollments(prev => [newProposal, ...prev]);
    showToast(`Proposta RM nº ${rm} gerada! Código único de acesso enviado para ${proposalData.guardianEmail || 'o e-mail do responsável'}.`);
    return newProposal;
  };

  // =========================================================================
  // NOVO FLUXO: PAI PREENCHE OS DADOS COMPLETOS E ASSINA DIGITALMENTE
  // =========================================================================
  const completeEnrollmentByParent = async (enrollmentId, parentData, signatureCanvasDataUrl) => {
    const timestamp = new Date().toISOString();
    const mockIp = '189.120.45.' + Math.floor(10 + Math.random() * 80);
    const signatureRaw = `${signatureCanvasDataUrl}_${timestamp}_${navigator.userAgent}`;
    const signatureSha256 = await calculateSHA256(signatureRaw);

    const fullAddress = `${parentData.guardianAddressStreet || ''}, nº ${parentData.guardianAddressNumber || ''} ${parentData.guardianAddressComplement ? '- ' + parentData.guardianAddressComplement : ''} - ${parentData.guardianAddressNeighborhood || ''}, ${parentData.guardianAddressCity || 'Indaiatuba'}/${parentData.guardianAddressState || 'SP'}`;

    const contractRawText = `REQUERIMENTO_OFICIAL_2027_RM_${parentData.rmNumber}_${parentData.studentName}_${parentData.guardianCpf}_${timestamp}`;
    const documentSha256 = await calculateSHA256(contractRawText);

    // Cria/Atualiza o Aluno na base institucional
    const newStudent = {
      id: `std-${parentData.rmNumber}`,
      rmNumber: parentData.rmNumber,
      cocCode: parentData.rmNumber,
      name: parentData.studentName,
      studentName: parentData.studentName,
      enrollmentCode: `RM ${parentData.rmNumber}`,
      gender: parentData.studentGender || 'Masc.',
      studentGender: parentData.studentGender || 'Masc.',
      birthDate: parentData.studentBirthDate,
      studentBirthDate: parentData.studentBirthDate,
      birthCity: parentData.studentBirthCity || 'Indaiatuba - SP',
      studentBirthCity: parentData.studentBirthCity || 'Indaiatuba - SP',
      nationality: parentData.studentNationality || 'Brasileiro(a)',
      studentNationality: parentData.studentNationality || 'Brasileiro(a)',
      rg: parentData.studentRg,
      studentRg: parentData.studentRg,
      rgIssuer: parentData.studentRgIssuer || 'SSP/SP',
      studentRgIssuer: parentData.studentRgIssuer || 'SSP/SP',
      rgIssueDate: parentData.studentRgIssueDate,
      studentRgIssueDate: parentData.studentRgIssueDate,
      cpf: parentData.studentCpf,
      studentCpf: parentData.studentCpf,
      studentPhone: parentData.studentPhone,
      courseLevel: parentData.courseLevel,
      currentGrade: parentData.currentGrade,
      classGroup: 'A',
      schoolShift: parentData.schoolShift || 'Manhã',
      schoolUnit: 'Colégio Rodin - Indaiatuba',
      condition: 'Regular',
      emergencyContact: parentData.guardianPhone,
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
      attendanceRate: '100%',
      guardians: [
        {
          id: `g-${parentData.rmNumber}-1`,
          name: parentData.guardianName,
          guardianName: parentData.guardianName,
          kinshipRelation: parentData.guardianRelation || 'Pai',
          guardianRelation: parentData.guardianRelation || 'Pai',
          gender: parentData.guardianGender || 'Masc.',
          guardianGender: parentData.guardianGender || 'Masc.',
          cpf: parentData.guardianCpf,
          guardianCpf: parentData.guardianCpf,
          rg: parentData.guardianRg,
          guardianRg: parentData.guardianRg,
          rgIssuer: parentData.guardianRgIssuer || 'SSP/SP',
          guardianRgIssuer: parentData.guardianRgIssuer || 'SSP/SP',
          birthDate: parentData.guardianBirthDate,
          guardianBirthDate: parentData.guardianBirthDate,
          occupation: parentData.guardianOccupation,
          guardianOccupation: parentData.guardianOccupation,
          maritalStatus: parentData.guardianMaritalStatus,
          guardianMaritalStatus: parentData.guardianMaritalStatus,
          nationality: parentData.guardianNationality || 'Brasileiro(a)',
          phone: parentData.guardianPhone,
          guardianPhone: parentData.guardianPhone,
          landline: parentData.guardianLandline,
          guardianLandline: parentData.guardianLandline,
          email: parentData.guardianEmail,
          guardianEmail: parentData.guardianEmail,
          addressCep: parentData.guardianAddressCep,
          addressStreet: parentData.guardianAddressStreet,
          addressNumber: parentData.guardianAddressNumber,
          addressComplement: parentData.guardianAddressComplement,
          addressNeighborhood: parentData.guardianAddressNeighborhood,
          addressCity: parentData.guardianAddressCity || 'Indaiatuba',
          addressState: parentData.guardianAddressState || 'SP',
          isFinancial: true,
          isPedagogical: true
        }
      ]
    };

    setStudents(prev => {
      const filtered = prev.filter(s => s.rmNumber !== parentData.rmNumber);
      return [newStudent, ...filtered];
    });

    setEnrollments(prev => prev.map(enr => {
      if (enr.id === enrollmentId || enr.rmNumber === parentData.rmNumber) {
        return {
          ...enr,
          studentName: parentData.studentName,
          studentGender: parentData.studentGender,
          studentBirthDate: parentData.studentBirthDate,
          studentBirthCity: parentData.studentBirthCity,
          studentRg: parentData.studentRg,
          studentRgIssuer: parentData.studentRgIssuer,
          studentRgIssueDate: parentData.studentRgIssueDate,
          studentCpf: parentData.studentCpf,
          studentNationality: parentData.studentNationality,
          studentPhone: parentData.studentPhone,
          // Responsável
          guardianName: parentData.guardianName,
          guardianRelation: parentData.guardianRelation,
          guardianGender: parentData.guardianGender,
          guardianBirthDate: parentData.guardianBirthDate,
          guardianOccupation: parentData.guardianOccupation,
          guardianMaritalStatus: parentData.guardianMaritalStatus,
          guardianRg: parentData.guardianRg,
          guardianRgIssuer: parentData.guardianRgIssuer,
          guardianCpf: parentData.guardianCpf,
          guardianNationality: parentData.guardianNationality,
          guardianEmail: parentData.guardianEmail,
          guardianLandline: parentData.guardianLandline,
          guardianPhone: parentData.guardianPhone,
          guardianAddress: fullAddress,
          guardianAddressCep: parentData.guardianAddressCep,
          guardianAddressStreet: parentData.guardianAddressStreet,
          guardianAddressNumber: parentData.guardianAddressNumber,
          guardianAddressComplement: parentData.guardianAddressComplement,
          guardianAddressNeighborhood: parentData.guardianAddressNeighborhood,
          guardianAddressCity: parentData.guardianAddressCity,
          guardianAddressState: parentData.guardianAddressState,
          firstInstallmentSplit: parseInt(parentData.firstInstallmentSplit) || enr.firstInstallmentSplit || 1,
          firstInstallmentPaymentMethod: parentData.firstInstallmentPaymentMethod || enr.firstInstallmentPaymentMethod || 'Cartão de Crédito (até 5x) ou Boleto',
          // Dados do Pedido de Material Didático (Livraria do Pensador LTDA)
          materialBuyerName: parentData.materialBuyerName || parentData.guardianName,
          materialTotalValue: typeof parentData.materialTotalValue === 'number' 
            ? parentData.materialTotalValue 
            : (parseFloat(String(parentData.materialTotalValue || enr.materialTotalValue || getFixedRatesForGrade(enr.currentGrade || parentData.currentGrade).materialTotalNum).replace(/\./g, '').replace(',', '.')) || getFixedRatesForGrade(enr.currentGrade || parentData.currentGrade).materialTotalNum),
          materialInstallmentsCount: parseInt(parentData.materialInstallmentsCount) || enr.materialInstallmentsCount || 6,
          materialStartDueDate: parentData.materialStartDueDate || enr.materialStartDueDate || '2027-02-10',
          materialEndDueDate: parentData.materialEndDueDate || enr.materialEndDueDate || '2027-07-10',
          materialPaymentMethod: parentData.materialPaymentMethod || enr.materialPaymentMethod || 'Boleto Bancário (vencimento dia 10)',
          // Status e Assinatura Digital do Responsável
          status: 'active', // Matrícula Concluída e Assinada
          signedAt: timestamp,
          ipAddress: mockIp,
          userAgent: navigator.userAgent,
          signatureSha256,
          signatureImage: signatureCanvasDataUrl,
          documentSha256
        };
      }
      return enr;
    }));

    // Sincronização em tempo real com as tabelas do Supabase (students, guardians, student_guardians)
    await syncEnrollmentToSupabase(parentData);

    showToast(`Matrícula RM nº ${parentData.rmNumber} preenchida, assinada e oficializada com sucesso!`);

    return {
      id: enrollmentId,
      ...parentData,
      rmNumber: parentData.rmNumber,
      signatureImage: signatureCanvasDataUrl,
      signatureDataUrl: signatureCanvasDataUrl,
      signatureSha256,
      documentSha256,
      signedAt: timestamp,
      status: 'active'
    };
  };

  const signContract = async (enrollmentId, signatureCanvasDataUrl) => {
    const timestamp = new Date().toISOString();
    const signatureRaw = `${signatureCanvasDataUrl}_${timestamp}_${navigator.userAgent}`;
    const signatureSha256 = await calculateSHA256(signatureRaw);
    const mockIp = '189.120.45.' + Math.floor(10 + Math.random() * 80);

    setEnrollments(prev => prev.map(enr => {
      if (enr.id === enrollmentId) {
        return {
          ...enr,
          status: 'active',
          signedAt: timestamp,
          ipAddress: mockIp,
          userAgent: navigator.userAgent,
          signatureSha256,
          signatureImage: signatureCanvasDataUrl
        };
      }
      return enr;
    }));

    showToast('Contrato assinado e selado com hash SHA-256! Matrícula ATIVADA.');
  };

  const saveReenrollment = (updatedEnrollment, updatedStudent) => {
    const targetYear = String(updatedEnrollment.academicYear || campaignConfig?.academicYear || 2027);

    setEnrollments(prev => {
      // Verifica se já existe registro deste aluno para este mesmo ano letivo
      const exists = prev.some(e => 
        e.id === updatedEnrollment.id || 
        (e.rmNumber === updatedEnrollment.rmNumber && String(e.academicYear || 2027) === targetYear)
      );

      if (exists) {
        return prev.map(e => 
          (e.id === updatedEnrollment.id || (e.rmNumber === updatedEnrollment.rmNumber && String(e.academicYear || 2027) === targetYear))
            ? { ...e, ...updatedEnrollment, academicYear: parseInt(targetYear) || targetYear } 
            : e
        );
      }

      // Se for um novo ano letivo (ex: 2028), ADICIONA como novo registro, mantendo o histórico de 2027 intacto!
      return [{ ...updatedEnrollment, academicYear: parseInt(targetYear) || targetYear }, ...prev];
    });

    if (updatedStudent) {
      setStudents(prev => {
        const exists = prev.some(s => s.id === updatedStudent.id || s.rmNumber === updatedStudent.rmNumber);
        if (exists) {
          return prev.map(s => (s.id === updatedStudent.id || s.rmNumber === updatedStudent.rmNumber) ? { ...s, ...updatedStudent } : s);
        }
        return [updatedStudent, ...prev];
      });
    }

    if (updatedEnrollment.status === 'reenrolled') {
      showToast(`Rematrícula de ${updatedEnrollment.studentName} (RM ${updatedEnrollment.rmNumber}) para ${targetYear} confirmada com sucesso!`);
    } else {
      showToast(`Dados contratuais e cadastrais de ${updatedEnrollment.studentName} para ${targetYear} salvos!`);
    }
  };

  const addClassroomLog = (logData) => {
    const newLog = {
      id: `log-${Date.now()}`,
      ...logData,
      teacherName: currentUser.name,
      timestamp: new Date().toISOString()
    };
    setClassroomLogs(prev => [newLog, ...prev]);
    showToast('Registro de sala salvo no diário de bordo com sucesso.');
  };

  const delegateClass = (classId, coordinatorId) => {
    setClasses(prev => prev.map(c => c.id === classId ? { ...c, coordinatorId } : c));
    showToast('Turma delegada ao coordenador com sucesso!');
  };

  const assignStudentClass = (studentId, classId, classGroupName) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          classId: classId,
          classGroup: classGroupName
        };
      }
      return s;
    }));
    setEnrollments(prev => prev.map(enr => {
      if (enr.studentId === studentId) {
        return {
          ...enr,
          classId: classId,
          classGroup: classGroupName
        };
      }
      return enr;
    }));
    showToast(`Aluno enturmado com sucesso na turma: ${classGroupName}!`);
  };

  const addQuestion = (questionData) => {
    const newQ = {
      id: `q-${Date.now()}`,
      ...questionData
    };
    setQuestionBank(prev => [newQ, ...prev]);
    showToast('Nova questão adicionada ao banco de avaliações!');
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      users,
      setUsers,
      updateUserProfile,
      refreshUsersFromSupabase,
      PRESET_USERS,
      isAuthenticated,
      setIsAuthenticated,
      login,
      logout,
      activeTab,
      setActiveTab,
      classes,
      students,
      enrollments,
      classroomLogs,
      questionBank,
      isSidebarCollapsed,
      setIsSidebarCollapsed,
      isMobileMenuOpen,
      setIsMobileMenuOpen,
      signingEnrollment,
      setSigningEnrollment,
      selectedStudentRx,
      setSelectedStudentRx,
      createEnrollment,
      createEnrollmentProposal,
      completeEnrollmentByParent,
      getNextRM,
      signContract,
      saveReenrollment,
      addClassroomLog,
      delegateClass,
      assignStudentClass,
      addQuestion,
      showToast,
      campaignConfig,
      updateCampaignConfig,
      DEFAULT_CAMPAIGN_CONFIG,
      getDynamicRatesForGrade
    }}>
      {children}
      {toastMessage && (
        <div id="rodin-toast-snackbar" className="show">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F45206]"></span>
          <span>{toastMessage.message}</span>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
