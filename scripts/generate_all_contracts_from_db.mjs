import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';

function sanitizeDirName(name) {
  return String(name || 'Estudante')
    .trim()
    .replace(/[<>:"/\\|?*]/g, '')
    .trim();
}

function safeWriteFileSync(filePath, buf) {
  try {
    fs.writeFileSync(filePath, buf);
  } catch (err) {
    if (err.code === 'EBUSY' || err.code === 'EPERM') {
      const ext = path.extname(filePath);
      const base = filePath.slice(0, -ext.length);
      const altPath = `${base} (Novo)${ext}`;
      console.warn(`  ⚠️ Arquivo em visualização: ${path.basename(filePath)}. Salvo como "${path.basename(altPath)}"`);
      fs.writeFileSync(altPath, buf);
    } else {
      throw err;
    }
  }
}

const SUPABASE_URL = 'https://jhjzyoztidfwzqeblhco.supabase.co';
const SUPABASE_KEY = 'sb_publishable_A4wO_BMJAUKweRuGTtI5mQ_Hmbs7_Qo';

async function fetchAllStudentsFromSupabase() {
  console.log('📡 Buscando dados atualizados de estudantes no Supabase...');
  let all = [];
  let from = 0;
  let step = 500;
  while (true) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/students?select=*&order=name.asc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Range': `${from}-${from + step - 1}`
        }
      });
      const batch = await res.json();
      if (!Array.isArray(batch) || batch.length === 0) break;
      all = all.concat(batch);
      if (batch.length < step) break;
      from += step;
    } catch (e) {
      console.warn('Erro ao conectar ao Supabase:', e.message);
      break;
    }
  }
  console.log(`✅ ${all.length} estudantes carregados do Supabase.`);
  return all;
}

async function fetchAllEnrollmentsFromSupabase() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/enrollments?select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

// Mapeamento amigável de pastas de séries
function getGradeFolderName(grade) {
  const g = String(grade || '').toUpperCase();
  if (g.includes('7º ANO') || g.includes('7° ANO') || g.includes('7º EF') || g.includes('7 ANO')) return '7º ano';
  if (g.includes('8º ANO') || g.includes('8° ANO') || g.includes('8º EF') || g.includes('8 ANO')) return '8º ano';
  if (g.includes('9º ANO') || g.includes('9° ANO') || g.includes('9º EF') || g.includes('9 ANO')) return '9º ano';
  if (g.includes('1ª SÉRIE') || g.includes('1A SERIE') || g.includes('1º EM') || g.includes('1º ANO EM')) return '1ª Série EM';
  if (g.includes('2ª SÉRIE') || g.includes('2A SERIE') || g.includes('2º EM') || g.includes('2º ANO EM')) return '2ª Série EM';
  if (g.includes('3ª SÉRIE') || g.includes('3A SERIE') || g.includes('3º EM') || g.includes('3º ANO EM')) return '3ª Série EM';
  if (g.includes('PPV') || g.includes('PRÉ') || g.includes('PRE') || g.includes('VESTIBULAR')) return 'Pré-Vestibular (PPV)';
  return grade || '7º ano';
}

function getCourseLevel(grade) {
  const g = String(grade || '').toUpperCase();
  if (g.includes('EM') || g.includes('SÉRIE') || g.includes('SERIE') || g.includes('MÉDIO') || g.includes('MEDIO') || g.includes('PPV') || g.includes('VESTIBULAR')) {
    return 'Ensino Médio';
  }
  return 'Ensino Fundamental';
}

async function runBatchGeneration() {
  console.log('🚀 Iniciando servidor Vite em modo SSR para carregar gerador de PDF oficial...');
  const server = await createServer({ server: { middlewareMode: true } });

  const { buildSignedContractPDFDoc, buildMaterialOrderPDFDoc } = await server.ssrLoadModule('./src/lib/pdfGenerator.js');
  const { getNominalTuitionForGrade, getStandardMaterialForGrade, calculateRodinInstallments, isLePeriniStudent } = await server.ssrLoadModule('./src/data/fixedRates.js');

  const dbStudents = await fetchAllStudentsFromSupabase();
  const dbEnrollments = await fetchAllEnrollmentsFromSupabase();

  const rawData = fs.readFileSync('./src/data/students2027Data.json', 'utf8');
  const localStudents = JSON.parse(rawData);

  console.log(`📋 Total de alunos na base local: ${localStudents.length}`);

  // Base output dir: PDFs_Rematricula_2027
  const baseOutputDir = path.resolve('PDFs_Rematricula_2027');
  if (!fs.existsSync(baseOutputDir)) {
    fs.mkdirSync(baseOutputDir, { recursive: true });
  }

  let totalContractFiles = 0;
  let totalMaterialFiles = 0;
  let processedCount = 0;
  const gradeStats = {};

  for (const s of localStudents) {
    const rm = String(s.rm_numero || s.coc_code || '');

    // Mesclar com dados do Supabase
    const dbMatch = dbStudents.find(d => 
      (rm && (String(d.rm_number) === rm || String(d.coc_code) === rm)) ||
      (d.name && d.name.trim().toLowerCase() === String(s.nome_completo_estudante).trim().toLowerCase())
    );

    const dbEnrollmentMatch = dbEnrollments.find(e => 
      (rm && (String(e.enrollment_code).includes(rm) || String(e.student_id) === (dbMatch?.id)))
    );

    // Nome atualizado oficial
    const studentOfficialName = (dbMatch?.name || s.nome_completo_estudante || '').trim();
    const studentCleanName = sanitizeDirName(studentOfficialName);

    // Série / Ano de Rematrícula para 2027
    const targetGrade = s.nova_serie_ano_2027 || '7º Ano EF';
    if (targetGrade === 'Concluinte' || s.status_rematricula_2027 === 'Concluiu') {
      // Concluintes da 3ª série 2026: permanecem no sistema sem rematrícula automática para 2027
      continue;
    }
    const gradeFolder = getGradeFolderName(targetGrade);
    const courseLevel = getCourseLevel(targetGrade);

    gradeStats[gradeFolder] = (gradeStats[gradeFolder] || 0) + 1;

    // Estrutura exigida: [Série] -> [Nome Aluno] -> Contratos
    // Ex: 7º ano -> Alice Bianchi de Paula Roccato -> [Arquivos]
    const studentDir = path.join(baseOutputDir, gradeFolder, studentCleanName);
    if (!fs.existsSync(studentDir)) {
      fs.mkdirSync(studentDir, { recursive: true });
    }

    // Le Perini detection
    const isLePerini = (dbMatch && typeof dbMatch.is_le_perini === 'boolean')
      ? dbMatch.is_le_perini
      : (typeof s.is_le_perini === 'boolean' ? s.is_le_perini : isLePeriniStudent({ ...s, name: studentOfficialName }));

    // Cálculos Financeiros Oficiais 2027
    const nominalStr = getNominalTuitionForGrade(targetGrade);
    const nominalNum = typeof nominalStr === 'number' ? nominalStr : parseFloat(String(nominalStr).replace(/\./g, '').replace(',', '.'));
    const materialStd = getStandardMaterialForGrade(targetGrade);

    const discountPct = parseFloat(s.percentual_desconto_2027) || 0;
    let grossNum = nominalNum;
    if (discountPct >= 99.9 || s.status_rematricula_2027 === 'Bolsa 100%') {
      grossNum = 0;
    } else if (s.valor_total_anuidade_2027 !== undefined && s.valor_total_anuidade_2027 !== null && Number(s.valor_total_anuidade_2027) > 0) {
      grossNum = Number(s.valor_total_anuidade_2027);
    } else if (discountPct > 0) {
      grossNum = Math.max(0, nominalNum * (1 - discountPct / 100));
    }

    const countInst = parseInt(s.plano_pagamento_anuidade_2027) || 13;
    let firstInstallment = (s.valor_1a_parcela_2027 !== undefined && s.valor_1a_parcela_2027 !== null && s.valor_1a_parcela_2027 > 0) 
      ? Number(s.valor_1a_parcela_2027) 
      : null;
    let regularInstallment = (s.valor_demais_parcelas_2027 !== undefined && s.valor_demais_parcelas_2027 !== null && s.valor_demais_parcelas_2027 > 0) 
      ? Number(s.valor_demais_parcelas_2027) 
      : null;

    if (firstInstallment === null || regularInstallment === null) {
      const calc = calculateRodinInstallments(
        grossNum,
        nominalNum,
        countInst,
        isLePerini
      );
      if (firstInstallment === null) firstInstallment = calc.firstInstallment;
      if (regularInstallment === null) regularInstallment = calc.regularInstallment;
    }

    const fullStreet = s.logradouro_endereco 
      ? `${s.logradouro_endereco}${s.numero_endereco ? ', nº ' + s.numero_endereco : ''}${s.complemento_endereco ? ' (' + s.complemento_endereco + ')' : ''} - ${s.bairro_endereco || ''}, ${s.cidade_endereco || ''}/${s.uf_endereco || ''}`
      : '';

    // Requerimento de Matrícula (2027)
    const contractEnrollment = {
      rmNumber: rm,
      cocCode: rm,
      academicYear: 2027,
      studentName: studentOfficialName,
      studentGender: dbMatch?.gender || s.sexo_estudante || 'Masc.',
      studentBirthDate: s.data_nascimento_estudante || '',
      studentBirthCity: s.naturalidade_cidade || 'Indaiatuba',
      studentBirthState: s.naturalidade_uf || 'SP',
      studentNationality: s.nacionalidade_estudante || 'Brasileira',
      studentRg: s.rg_estudante || '',
      studentRgIssuer: s.orgao_emissor_rg_estudante || 'SSP/SP',
      studentRgIssueDate: s.data_emissao_rg_estudante || '',
      studentCpf: s.cpf_estudante || '',
      studentPhone: s.celular_whatsapp_estudante || s.telefone_estudante || '',
      courseLevel: courseLevel,
      currentGrade: targetGrade,
      schoolShift: s.periodo_turno || 'Manhã',
      classGroup: s.turma || 'A',
      guardianName: s.nome_responsavel_financeiro || '',
      guardianRelation: s.parentesco_responsavel || 'Responsável',
      guardianGender: s.sexo_responsavel || 'Masc.',
      guardianBirthDate: s.data_nascimento_responsavel || '',
      guardianOccupation: s.profissao_responsavel || '',
      guardianMaritalStatus: s.estado_civil_responsavel || 'Casado(a)',
      guardianNationality: s.nacionalidade_responsavel || 'Brasileiro(a)',
      guardianRg: s.rg_responsavel || '',
      guardianRgIssuer: s.orgao_emissor_rg_responsavel || 'SSP/SP',
      guardianCpf: s.cpf_responsavel_financeiro || '',
      guardianEmail: s.email_responsavel || '',
      guardianPhone: s.celular_whatsapp_responsavel || '',
      guardianAddressCep: s.cep_endereco || '',
      guardianAddressStreet: s.logradouro_endereco || '',
      guardianAddressNumber: s.numero_endereco || '',
      guardianAddressComplement: s.complemento_endereco || '',
      guardianAddressNeighborhood: s.bairro_endereco || '',
      guardianAddressCity: s.cidade_endereco || 'Indaiatuba',
      guardianAddressState: s.uf_endereco || 'SP',
      guardianAddress: fullStreet,
      tuitionNominalTotal: nominalNum,
      tuitionGrossTotal: grossNum,
      tuitionDiscountTotal: grossNum,
      tuitionDiscountType: discountPct > 0 ? `${discountPct}%` : 'Sem desconto',
      tuitionDiscountPercentage: discountPct / 100,
      tuitionDiscountReason: s.observacao_desconto_2027 || (discountPct > 0 ? `Desconto de ${discountPct}% na anuidade` : 'Anuidade integral conforme tabela padrão Colégio Rodin 2027'),
      installmentsCount: countInst,
      firstInstallmentValue: firstInstallment,
      regularInstallmentValue: regularInstallment,
      quotaDueDate: s.dia_vencimento_parcelas_2027 || '15',
      installmentDueDate: '1',
      isPresencial: true,
      isLePerini: isLePerini
    };

    // Pedido de Material Didático (2027)
    const materialEnrollment = {
      rmNumber: rm,
      cocCode: rm,
      academicYear: 2027,
      studentName: studentOfficialName,
      materialBuyerName: s.nome_comprador_material || s.nome_responsavel_financeiro || '',
      materialBuyerCpf: s.cpf_comprador_material || s.cpf_responsavel_financeiro || '',
      courseLevel: courseLevel,
      currentGrade: targetGrade,
      schoolShift: s.periodo_turno || 'Manhã',
      materialTotalValue: materialStd.totalNum || materialStd.total || 5248.8,
      materialTotalExtenso: materialStd.extenso || '',
      materialInstallmentsCount: parseInt(materialStd.installments) || 12,
      materialInstallmentValue: materialStd.installmentNum || materialStd.installmentValue || 437.4,
      materialInstallmentExtenso: materialStd.installmentExtenso || '',
      materialPaymentMethod: 'Boleto Bancário',
      materialStartDueDate: '2027-01-10',
      materialEndDueDate: '2027-12-10',
      isPresencial: true
    };

    // 1. Gerar Requerimento de Matrícula Editável
    const contractDoc = buildSignedContractPDFDoc(contractEnrollment, {}, { interactive: true });
    const contractBuf = Buffer.from(contractDoc.output('arraybuffer'));
    const contractFileName = `Requerimento de Matrícula - ${studentCleanName}.pdf`;
    safeWriteFileSync(path.join(studentDir, contractFileName), contractBuf);
    totalContractFiles++;

    // 2. Gerar Pedido de Material Didático Editável
    const materialDoc = buildMaterialOrderPDFDoc(materialEnrollment, {}, { interactive: true });
    const materialBuf = Buffer.from(materialDoc.output('arraybuffer'));
    const materialFileName = `Pedido de Material Didático - ${studentCleanName}.pdf`;
    safeWriteFileSync(path.join(studentDir, materialFileName), materialBuf);
    totalMaterialFiles++;

    processedCount++;
    if (processedCount % 50 === 0 || processedCount === localStudents.length) {
      console.log(`  ⏳ Progresso: ${processedCount}/${localStudents.length} alunos processados (${gradeFolder} - ${studentCleanName})`);
    }
  }

  await server.close();

  console.log('\n======================================================');
  console.log('✅ GERAÇÃO DE TODOS OS CONTRATOS CONCLUÍDA!');
  console.log(`📁 Diretório: ${baseOutputDir}`);
  console.log(`👥 Total de estudantes processados: ${processedCount}`);
  console.log(`📄 Requerimentos de Matrícula editáveis: ${totalContractFiles}`);
  console.log(`📚 Pedidos de Material Didático editáveis: ${totalMaterialFiles}`);
  console.log(`📦 Total de PDFs gerados: ${totalContractFiles + totalMaterialFiles}`);
  console.log('📊 Distribuição por pasta de série:');
  Object.entries(gradeStats).forEach(([grade, count]) => {
    console.log(`   - ${grade}: ${count} alunos (${count * 2} PDFs)`);
  });
  console.log('======================================================\n');
}

runBatchGeneration().catch(err => {
  console.error('❌ Erro durante a geração dos PDFs:', err);
  process.exit(1);
});
