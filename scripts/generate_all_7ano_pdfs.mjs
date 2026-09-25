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

async function runBatchGeneration() {
  console.log('🚀 Iniciando servidor Vite em modo SSR para geração de PDFs...');
  const server = await createServer({ server: { middlewareMode: true } });
  
  const { buildSignedContractPDFDoc, buildMaterialOrderPDFDoc } = await server.ssrLoadModule('./src/lib/pdfGenerator.js');

  const rawData = fs.readFileSync('./src/data/students2027Data.json', 'utf8');
  const allStudents = JSON.parse(rawData);

  // Filtrar todos os estudantes que estão rematriculando para o 7º Ano EF (atualmente no 6º Ano)
  const targetStudents = allStudents.filter(
    s => s.nova_serie_ano_2027 === '7º Ano EF' || s.serie_ano_atual === '6º Ano EF'
  );

  console.log(`📋 Total de alunos identificados para o 7º Ano EF: ${targetStudents.length}`);

  const baseOutputDir = path.resolve('PDFs_Rematricula_2027', '7º Ano EF');
  if (!fs.existsSync(baseOutputDir)) {
    fs.mkdirSync(baseOutputDir, { recursive: true });
  }

  const turmaStats = { A: 0, B: 0, C: 0, D: 0, Outros: 0 };
  let processedCount = 0;
  let totalContractFiles = 0;
  let totalMaterialFiles = 0;

  for (const s of targetStudents) {
    const turmaLetter = (s.turma || '').trim().toUpperCase() || 'Sem Turma';
    const turmaFolder = ['A', 'B', 'C', 'D'].includes(turmaLetter) ? `7º Ano ${turmaLetter}` : `7º Ano ${turmaLetter}`;
    
    if (turmaStats[turmaLetter] !== undefined) {
      turmaStats[turmaLetter]++;
    } else {
      turmaStats.Outros++;
    }

    const studentCleanName = sanitizeDirName(s.nome_completo_estudante);
    const studentDir = path.join(baseOutputDir, turmaFolder, studentCleanName);

    if (!fs.existsSync(studentDir)) {
      fs.mkdirSync(studentDir, { recursive: true });
    }

    const fullStreet = s.logradouro_endereco 
      ? `${s.logradouro_endereco}${s.numero_endereco ? ', nº ' + s.numero_endereco : ''}${s.complemento_endereco ? ' (' + s.complemento_endereco + ')' : ''} - ${s.bairro_endereco || ''}, ${s.cidade_endereco || ''}/${s.uf_endereco || ''}`
      : '';

    // Preparar Objeto do Requerimento de Matrícula (2027 - 7º Ano EF)
    const contractEnrollment = {
      rmNumber: s.rm_numero,
      cocCode: s.rm_numero,
      academicYear: 2027,
      studentName: s.nome_completo_estudante,
      studentGender: s.sexo_estudante,
      studentBirthDate: s.data_nascimento_estudante,
      studentBirthCity: s.naturalidade_cidade,
      studentBirthState: s.naturalidade_uf,
      studentNationality: s.nacionalidade_estudante || 'Brasileira',
      studentRg: s.rg_estudante,
      studentRgIssuer: s.orgao_emissor_rg_estudante,
      studentRgIssueDate: s.data_emissao_rg_estudante,
      studentCpf: s.cpf_estudante,
      studentPhone: s.celular_whatsapp_estudante,
      courseLevel: 'Ensino Fundamental',
      currentGrade: '7º Ano EF',
      schoolShift: s.periodo_turno || 'Manhã',
      classGroup: s.turma,
      guardianName: s.nome_responsavel_financeiro,
      guardianRelation: s.parentesco_responsavel,
      guardianGender: s.sexo_responsavel,
      guardianBirthDate: s.data_nascimento_responsavel,
      guardianOccupation: s.profissao_responsavel,
      guardianMaritalStatus: s.estado_civil_responsavel,
      guardianNationality: s.nacionalidade_responsavel || 'Brasileiro(a)',
      guardianRg: s.rg_responsavel,
      guardianRgIssuer: s.orgao_emissor_rg_responsavel,
      guardianCpf: s.cpf_responsavel_financeiro,
      guardianEmail: s.email_responsavel,
      guardianPhone: s.celular_whatsapp_responsavel,
      guardianAddressCep: s.cep_endereco,
      guardianAddressStreet: s.logradouro_endereco,
      guardianAddressNumber: s.numero_endereco,
      guardianAddressComplement: s.complemento_endereco,
      guardianAddressNeighborhood: s.bairro_endereco,
      guardianAddressCity: s.cidade_endereco,
      guardianAddressState: s.uf_endereco,
      guardianAddress: fullStreet,
      tuitionNominalTotal: s.valor_nominal_anuidade_2027 || 34663.2,
      tuitionGrossTotal: s.valor_total_anuidade_2027 !== undefined ? s.valor_total_anuidade_2027 : s.valor_nominal_anuidade_2027,
      tuitionDiscountTotal: s.valor_total_anuidade_2027,
      tuitionDiscountType: s.tipo_desconto_2027,
      tuitionDiscountPercentage: s.percentual_desconto_2027,
      tuitionDiscountReason: s.observacao_desconto_2027,
      installmentsCount: s.plano_pagamento_anuidade_2027 || 13,
      firstInstallmentValue: s.valor_1a_parcela_2027,
      regularInstallmentValue: s.valor_demais_parcelas_2027,
      installmentDueDate: s.dia_vencimento_parcelas_2027 || '10',
      isPresencial: true
    };

    // Preparar Objeto do Pedido de Material Didático (2027 - 7º Ano EF)
    const materialEnrollment = {
      rmNumber: s.rm_numero,
      cocCode: s.rm_numero,
      academicYear: 2027,
      studentName: s.nome_completo_estudante,
      materialBuyerName: s.nome_comprador_material || s.nome_responsavel_financeiro,
      materialBuyerCpf: s.cpf_comprador_material || s.cpf_responsavel_financeiro,
      courseLevel: 'Ensino Fundamental',
      currentGrade: '7º Ano EF',
      schoolShift: s.periodo_turno || 'Manhã',
      materialTotalValue: s.valor_total_material || 5248.8,
      materialInstallmentsCount: s.numero_parcelas_material || 12,
      materialPaymentMethod: 'Boleto Bancário',
      materialStartDueDate: s.inicio_vencimento_material || '10 de janeiro de 2027',
      isPresencial: true
    };

    // 1. Gerar Requerimento de Matrícula Editável
    const contractDoc = buildSignedContractPDFDoc(contractEnrollment, {}, { interactive: true });
    const contractBuf = Buffer.from(contractDoc.output('arraybuffer'));
    const contractFileName = `Requerimento de Matrícula - ${studentCleanName}.pdf`;
    const contractFilePath = path.join(studentDir, contractFileName);
    safeWriteFileSync(contractFilePath, contractBuf);
    totalContractFiles++;

    // 2. Gerar Pedido de Material Didático Editável
    const materialDoc = buildMaterialOrderPDFDoc(materialEnrollment, {}, { interactive: true });
    const materialBuf = Buffer.from(materialDoc.output('arraybuffer'));
    const materialFileName = `Pedido de Material Didático - ${studentCleanName}.pdf`;
    const materialFilePath = path.join(studentDir, materialFileName);
    safeWriteFileSync(materialFilePath, materialBuf);
    totalMaterialFiles++;

    processedCount++;
    if (processedCount % 10 === 0 || processedCount === targetStudents.length) {
      console.log(`  ⏳ Progresso: ${processedCount}/${targetStudents.length} alunos processados (${turmaFolder} - ${studentCleanName})`);
    }
  }

  await server.close();

  console.log('\n======================================================');
  console.log('✅ GERAÇÃO EM LOTE CONCLUÍDA COM SUCESSO TOTAL!');
  console.log(`📁 Diretório raiz: ${baseOutputDir}`);
  console.log(`👥 Total de alunos processados: ${processedCount}`);
  console.log(`📄 Requerimentos de Matrícula gerados: ${totalContractFiles}`);
  console.log(`📚 Pedidos de Material Didático gerados: ${totalMaterialFiles}`);
  console.log(`📦 Total de arquivos PDF gerados: ${totalContractFiles + totalMaterialFiles}`);
  console.log('📊 Distribuição por turma:');
  console.log(`   - 7º Ano A: ${turmaStats.A} alunos`);
  console.log(`   - 7º Ano B: ${turmaStats.B} alunos`);
  console.log(`   - 7º Ano C: ${turmaStats.C} alunos`);
  console.log(`   - 7º Ano D: ${turmaStats.D} alunos`);
  console.log('======================================================\n');
}

runBatchGeneration().catch(err => {
  console.error('❌ Erro durante a geração dos PDFs:', err);
  process.exit(1);
});
