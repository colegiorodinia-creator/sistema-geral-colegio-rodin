/**
 * Script de Sincronização em Massa de Todos os 755 Contratos e Matrículas para o Supabase
 * Colégio Rodin — Campanha 2027
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'jhjzyoztidfwzqeblhco.supabase.co';
const SUPABASE_KEY = 'sb_publishable_A4wO_BMJAUKweRuGTtI5mQ_Hmbs7_Qo';

function supabaseRequest(pathName, method = 'GET', body = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      ...extraHeaders
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const req = https.request({
      hostname: SUPABASE_URL,
      path: pathName,
      method: method,
      headers: headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null, headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, data, headers: res.headers });
          }
        } else {
          reject(new Error(`Supabase error [${res.statusCode}] on ${method} ${pathName}: ${data}`));
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function getMaterialInfo(grade) {
  const g = (grade || '').toLowerCase();
  if (g.includes('3ª') || g.includes('3º') || g.includes('terceir') || g.includes('ppv') || g.includes('pré-vestibular')) {
    return {
      total: 7575.60,
      totalExtenso: 'Sete mil, quinhentos e setenta e cinco reais e sessenta centavos',
      installments: 12,
      installmentValue: 631.30,
      installmentExtenso: 'Seiscentos e trinta e um reais e trinta centavos'
    };
  } else if (g.includes('1ª') || g.includes('2ª') || g.includes('médio') || g.includes('em')) {
    return {
      total: 5338.20,
      totalExtenso: 'Cinco mil, trezentos e trinta e oito reais e vinte centavos',
      installments: 12,
      installmentValue: 444.85,
      installmentExtenso: 'Quatrocentos e quarenta e quatro reais e oitenta e cinco centavos'
    };
  } else {
    return {
      total: 5248.80,
      totalExtenso: 'Cinco mil, duzentos e quarenta e oito reais e oitenta centavos',
      installments: 12,
      installmentValue: 437.40,
      installmentExtenso: 'Quatrocentos e trinta e sete reais e quarenta centavos'
    };
  }
}

async function main() {
  console.log('=== SINCRONIZANDO CONTRATOS RESTANTES NO SUPABASE ===');

  // 1. Carregar estudantes oficiais da planilha
  const studentsJsonPath = path.join(__dirname, '..', 'src', 'data', 'students2027Data.json');
  const officialStudents = JSON.parse(fs.readFileSync(studentsJsonPath, 'utf8'));

  // 2. Buscar estudantes do Supabase
  console.log('Buscando estudantes do Supabase...');
  const dbStudentsRes = await supabaseRequest('/rest/v1/students?select=id,rm_number,coc_code,name,current_grade,course_level,class_group&limit=1000');
  const dbStudents = dbStudentsRes.data || [];
  console.log(`Total de estudantes no Supabase: ${dbStudents.length}`);

  // 3. Buscar todas as matrículas
  console.log('Buscando matrículas do Supabase...');
  const allEnrollmentsRes = await supabaseRequest('/rest/v1/enrollments?select=id,student_id,enrollment_code,current_grade,new_grade&limit=1000');
  const allEnrollments = allEnrollmentsRes.data || [];
  console.log(`Total de matrículas no Supabase: ${allEnrollments.length}`);

  const enrollmentByStudentId = new Map();
  allEnrollments.forEach(e => {
    // se tiver mais de uma, guarda a primeira
    if (!enrollmentByStudentId.has(e.student_id)) {
      enrollmentByStudentId.set(e.student_id, e);
    }
  });

  // 4. Buscar contratos existentes
  console.log('Buscando contratos existentes no Supabase...');
  const dbContractsRes = await supabaseRequest('/rest/v1/contracts?select=id,enrollment_id,student_id,contract_code&limit=1000');
  const dbContracts = dbContractsRes.data || [];
  console.log(`Total de contratos existentes: ${dbContracts.length}`);

  const existingContractCodes = new Set(dbContracts.map(c => c.contract_code));
  const existingEnrollmentIds = new Set(dbContracts.map(c => c.enrollment_id));
  const existingStudentIds = new Set(dbContracts.map(c => c.student_id));

  // 5. Preparar contratos faltantes
  const missingContracts = [];
  const processedCodes = new Set();

  for (const s of dbStudents) {
    if (existingStudentIds.has(s.id)) {
      continue; // Já tem contrato
    }

    const enr = enrollmentByStudentId.get(s.id);
    if (!enr || existingEnrollmentIds.has(enr.id)) {
      continue; // Sem matrícula ou já tem contrato nessa matrícula
    }

    const rm = String(s.rm_number || s.coc_code || s.id.slice(0, 8));
    let code = `CTR-2027-${rm}`;
    if (existingContractCodes.has(code) || processedCodes.has(code)) {
      code = `CTR-2027-${rm}-${s.id.slice(0, 4)}`;
    }
    processedCodes.add(code);

    const official = officialStudents.find(os => String(os.rm_numero || os.coc_code) === rm);

    const targetGrade = official?.nova_serie_ano_2027 || enr.new_grade || enr.current_grade;
    const matInfo = getMaterialInfo(targetGrade);

    const valorNominal = official?.valor_nominal_anuidade_2027 || 34663.20;
    let rawPct = official?.percentual_desconto_2027 !== undefined ? official.percentual_desconto_2027 : 0;
    const pctDecimal = rawPct > 1 ? Number((rawPct / 100).toFixed(6)) : Number(rawPct.toFixed(6));
    const valorTotal = official?.valor_total_anuidade_2027 || valorNominal;
    const valor1a = official?.valor_1a_parcela_2027 || (valorTotal / 13);
    const valorDemais = official?.valor_demais_parcelas_2027 || valor1a;
    const tipoDesconto = official?.tipo_desconto_2027 || (rawPct > 0 ? `${rawPct}%` : 'Sem Desconto');
    const obsDesconto = official?.observacao_desconto_2027 || '';

    missingContracts.push({
      contract_code: code,
      enrollment_id: enr.id,
      student_id: s.id,
      terms_version: '2027.1',
      status: 'pending',
      tuition_gross_total: Number(valorTotal.toFixed(2)),
      tuition_nominal_total: Number(valorNominal.toFixed(2)),
      tuition_discount_total: Number(valorTotal.toFixed(2)),
      tuition_discount_percentage: pctDecimal,
      tuition_discount_reason: obsDesconto,
      tuition_discount_type: tipoDesconto,
      installments_count: official?.plano_pagamento_anuidade_2027 || 13,
      first_installment_value: Number(valor1a.toFixed(2)),
      regular_installment_value: Number(valorDemais.toFixed(2)),
      material_total_value: matInfo.total,
      material_total_extenso: matInfo.totalExtenso,
      material_installments_count: matInfo.installments,
      material_installment_value: matInfo.installmentValue,
      material_installment_extenso: matInfo.installmentExtenso,
      material_start_due_date: '2027-01-10',
      material_end_due_date: '2027-12-10'
    });
  }

  console.log(`Contratos únicos a inserir: ${missingContracts.length}`);

  // Inserir contratos em lotes de 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < missingContracts.length; i += BATCH_SIZE) {
    const chunk = missingContracts.slice(i, i + BATCH_SIZE);
    await supabaseRequest('/rest/v1/contracts', 'POST', chunk);
    console.log(`Inseridos contratos ${i + 1} a ${Math.min(i + BATCH_SIZE, missingContracts.length)}`);
  }

  // 6. Verificação final
  const finalEnrollmentsRes = await supabaseRequest('/rest/v1/enrollments?select=count', 'GET', null, {
    'Range': '0-0',
    'Prefer': 'count=exact'
  });
  const finalContractsRes = await supabaseRequest('/rest/v1/contracts?select=count', 'GET', null, {
    'Range': '0-0',
    'Prefer': 'count=exact'
  });

  console.log('=== CONCLUÍDO COM SUCESSO! ===');
  console.log(`Total final de Enrollments no Supabase: ${finalEnrollmentsRes.headers['content-range']}`);
  console.log(`Total final de Contracts no Supabase: ${finalContractsRes.headers['content-range']}`);
}

main().catch(err => {
  console.error('Erro na execução:', err);
  process.exit(1);
});
