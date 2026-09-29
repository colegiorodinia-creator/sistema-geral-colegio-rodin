import { createServer } from 'vite';
import fs from 'fs';
import path from 'path';

async function runSingleTest() {
  console.log('🚀 Iniciando geração do PDF teste corrigido para Maria Miraglia (RM 2534)...');
  const server = await createServer({ server: { middlewareMode: true } });
  const { buildSignedContractPDFDoc } = await server.ssrLoadModule('./src/lib/pdfGenerator.js');

  const rawData = fs.readFileSync('./src/data/students2027Data.json', 'utf8');
  const students = JSON.parse(rawData);
  const maria = students.find(s => s.rm_numero === '2534' || s.nome_completo_estudante.includes('Maria Miraglia'));

  if (!maria) {
    console.error('❌ Maria Miraglia não encontrada!');
    await server.close();
    return;
  }

  const targetGrade = maria.nova_serie_ano_2027 || '8º Ano EF';
  const nominalNum = Number(maria.valor_nominal_anuidade_2027) || 34663.20;
  const discountPct = Number(maria.percentual_desconto_2027) || 13.85;
  const grossNum = Number(maria.valor_total_anuidade_2027) || 29863.68;
  const countInst = parseInt(maria.plano_pagamento_anuidade_2027) || 13;
  const firstInstallment = Number(maria.valor_1a_parcela_2027) || 2666.40;
  const regularInstallment = Number(maria.valor_demais_parcelas_2027) || 2266.44;

  const contractEnrollment = {
    rmNumber: maria.rm_numero,
    cocCode: maria.rm_numero,
    academicYear: 2027,
    studentName: maria.nome_completo_estudante,
    studentGender: maria.sexo_estudante || 'Fem.',
    studentBirthDate: maria.data_nascimento_estudante || '09/09/2013',
    studentBirthCity: maria.naturalidade_cidade || 'Indaiatuba',
    studentBirthState: maria.naturalidade_uf || 'SP',
    studentNationality: maria.nacionalidade_estudante || 'Brasileira',
    studentRg: maria.rg_estudante,
    studentRgIssuer: maria.orgao_emissor_rg_estudante || 'SSP/SP',
    studentRgIssueDate: maria.data_emissao_rg_estudante || '12/07/2019',
    studentCpf: maria.cpf_estudante,
    studentPhone: maria.celular_whatsapp_estudante || '(19) 9 9686-9005',
    courseLevel: 'Ensino Fundamental',
    currentGrade: targetGrade,
    schoolShift: maria.periodo_turno || 'Manhã',
    classGroup: maria.turma || 'C',
    guardianName: maria.nome_responsavel_financeiro,
    guardianRelation: maria.parentesco_responsavel || 'Pai',
    guardianGender: maria.sexo_responsavel || 'Masc.',
    guardianBirthDate: maria.data_nascimento_responsavel,
    guardianOccupation: maria.profissao_responsavel,
    guardianMaritalStatus: maria.estado_civil_responsavel || 'Casado',
    guardianNationality: maria.nacionalidade_responsavel || 'Brasileira',
    guardianRg: maria.rg_responsavel,
    guardianRgIssuer: maria.orgao_emissor_rg_responsavel || 'SSP/SP',
    guardianCpf: maria.cpf_responsavel_financeiro,
    guardianEmail: maria.email_responsavel,
    guardianPhone: maria.celular_whatsapp_responsavel,
    guardianAddressCep: maria.cep_endereco,
    guardianAddressStreet: maria.logradouro_endereco,
    guardianAddressNumber: maria.numero_endereco,
    guardianAddressComplement: maria.complemento_endereco,
    guardianAddressNeighborhood: maria.bairro_endereco,
    guardianAddressCity: maria.cidade_endereco || 'Indaiatuba',
    guardianAddressState: maria.uf_endereco || 'SP',
    tuitionNominalTotal: nominalNum,
    tuitionGrossTotal: grossNum,
    tuitionDiscountTotal: grossNum,
    tuitionDiscountType: maria.tipo_desconto_2027,
    tuitionDiscountPercentage: discountPct / 100,
    tuitionDiscountReason: maria.observacao_desconto_2027 || '',
    installmentsCount: countInst,
    firstInstallmentValue: firstInstallment,
    regularInstallmentValue: regularInstallment,
    quotaDueDate: maria.dia_vencimento_parcelas_2027 || '10',
    installmentDueDate: '1',
    isPresencial: true,
    isLePerini: false
  };

  const doc = buildSignedContractPDFDoc(contractEnrollment, {}, { interactive: true });
  const buf = Buffer.from(doc.output('arraybuffer'));

  const studentDir = path.resolve('PDFs_Rematricula_2027', '8º ano', 'Maria Miraglia Rodrigues da Silva');
  if (!fs.existsSync(studentDir)) fs.mkdirSync(studentDir, { recursive: true });
  fs.writeFileSync(path.join(studentDir, 'Requerimento de Matrícula - Maria Miraglia Rodrigues da Silva.pdf'), buf);

  const publicPath = path.resolve('public', 'test_maria_miraglia_preview.pdf');
  fs.writeFileSync(publicPath, buf);

  // Criar HTML para visualização
  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Visualização PDF - Maria Miraglia Rodrigues da Silva</title>
  <style>
    body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #0f172a; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe src="/test_maria_miraglia_preview.pdf#toolbar=1&navpanes=0"></iframe>
</body>
</html>`;
  fs.writeFileSync(path.resolve('public', 'visualizar_maria.html'), htmlContent);

  console.log('✅ PDF de teste Maria Miraglia atualizado com sucesso em:');
  console.log('   - PDFs_Rematricula_2027/8º ano/Maria Miraglia Rodrigues da Silva/Requerimento de Matrícula - Maria Miraglia Rodrigues da Silva.pdf');
  console.log('   - public/test_maria_miraglia_preview.pdf');
  console.log('   - public/visualizar_maria.html');

  await server.close();
}

runSingleTest().catch(console.error);
