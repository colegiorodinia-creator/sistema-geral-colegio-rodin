import { jsPDF } from 'jspdf';
import {
  logoFullBlackBase64 as logoFullBlack,
  thinkerMarkBlackBase64 as thinkerMarkBlack,
  signatureCanelaBase64 as signatureCanela,
  signatureElisangelaBase64 as signatureElisangela,
  signatureKellyBase64 as signatureKelly,
  signatureLivrariaBase64 as signatureLivraria
} from './pdfAssetsBase64';
import { getFixedRatesForGrade } from '../data/fixedRates';

/**
 * Formata data ISO YYYY-MM-DD para DD/MM/YYYY se aplicável
 */
function formatDisplayDate(dateStr) {
  if (!dateStr || dateStr === '—') return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

/**
 * Helper para conversão monetária precisa independente de formato (número ou string BRL)
 */
export function parseMoneyVal(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return isNaN(v) ? null : v;
  const str = String(v).trim();
  if (!str || str === '—' || str === '-') return null;
  if (str.includes(',')) {
    const clean = str.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? null : parsed;
  }
  const clean = str.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Constrói a instância jsPDF com o REQUERIMENTO DE MATRÍCULA oficial de 2 páginas.
 * Modelo Oficial Idêntico - Educação Básica (Balder Educacional LTDA)
 */
export function buildSignedContractPDFDoc(enrollment = {}, signatureData = {}, docOptions = {}) {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
  });

  const isInteractive = Boolean(docOptions.interactive);
  const { TextField } = jsPDF.AcroForm;
  let fieldCounter = 0;

  // Consolidação de dados garantindo prioridade para o preenchimento real do usuário
  const data = { ...enrollment, ...signatureData };

  const rm = data.rmNumber || data.cocCode || '2570';
  const academicYear = data.academicYear || 2027;
  const studentName = (data.studentName || data.name || 'Estudante').toUpperCase();
  const pdfTitle = `Requerimento de Matrícula • ${studentName} (RM ${rm})`;

  // Metadados oficiais do documento PDF
  doc.setProperties({
    title: pdfTitle,
    subject: `Requerimento de Matrícula Educação Básica ${academicYear} - Colégio Rodin`,
    author: 'Colégio Rodin - Balder Educacional LTDA',
    creator: 'Colégio Rodin Sistema Integrado de Gestão'
  });

  // Helpers de desenho fiel ao formulário oficial impresso
  const drawSectionHeader = (yText, title) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);
    const textW = doc.getTextWidth(title);
    const textX = 23.0;
    const lineY = yText - 1.2; // Alinhamento milimétrico exato no centro vertical das letras maiúsculas

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.7); // Traço preto grosso oficial
    // Traço curto inicial à esquerda
    doc.line(10.1, lineY, 20.5, lineY);
    // Título da seção
    doc.text(title, textX, yText);
    // Traço longo à direita até a margem
    doc.line(textX + textW + 2.5, lineY, 200.1, lineY);
  };

  const drawTickField = (x, y, w, label, value, options = {}) => {
    // Rótulo acima da linha
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(options.labelSize || 8.5);
    doc.setTextColor(0, 0, 0);
    doc.text(label, x, y - 4.6);

    const valStr = (value && value !== '—') ? String(value).trim() : '';

    if (isInteractive) {
      fieldCounter++;
      const field = new TextField();
      field.Rect = [x + 0.5, y - 3.9, w - 1.0, 3.7];
      field.value = valStr;
      field.fieldName = options.fieldName || `campo_${fieldCounter}`;
      field.fontSize = options.valueSize || 8.8;
      field.showBorder = false;
      doc.addField(field);
    } else if (valStr) {
      // Valor preenchido sobre a linha de base
      doc.setFont('helvetica', options.boldValue ? 'bold' : 'normal');
      let fontSize = options.valueSize || 9.5;
      doc.setFontSize(fontSize);
      const maxW = w - 2.0;
      // Auto-escala para garantir que o texto NUNCA quebre em duas linhas nem vaze do campo
      while (doc.getTextWidth(valStr) > maxW && fontSize > 6.0) {
        fontSize -= 0.5;
        doc.setFontSize(fontSize);
      }
      doc.setTextColor(0, 0, 0);
      doc.text(valStr, x + 1.2, y - 1.0);
    }

    // Linha de base com delimitadores verticais (ticks |_______|)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    doc.line(x, y, x + w, y);
    const tickH = 3.5;
    doc.line(x, y, x, y - tickH);
    doc.line(x + w, y, x + w, y - tickH);
  };

  const drawCheckbox = (x, y, label, isChecked, options = {}) => {
    const boxW = options.boxSize || 3.2;
    const fontSize = options.fontSize || 7.6;
    const labelOffset = options.labelOffset || 4.0;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    doc.rect(x, y - boxW, boxW, boxW);
    if (isChecked) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontSize);
      doc.setTextColor(0, 0, 0);
      doc.text('X', x + (boxW * 0.22), y - (boxW * 0.18));
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(0, 0, 0);
    doc.text(label, x + labelOffset, y - (boxW * 0.18));
  };

  // =========================================================================
  // PÁGINA 1: CABEÇALHO, TERMO AO DIRETOR, CLÁUSULAS a-e E DADOS ESTUDANTE
  // =========================================================================

  // 1. Topo: Logo Rodin Preto
  try {
    doc.addImage(logoFullBlack, 'PNG', 10.1, 9.4, 38, 14.6);
  } catch (err) {
    try {
      doc.addImage(thinkerMarkBlack, 'PNG', 10.1, 9.4, 12, 14.4);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text('colégio\nROD!N', 24, 14);
    } catch (e) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('COLÉGIO RODIN', 10.1, 15);
    }
  }

  // Título e Subtítulo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.4);
  doc.setTextColor(0, 0, 0);
  doc.text(`REQUERIMENTO DE MATRÍCULA - EDUCAÇÃO BÁSICA ${academicYear}`, 200.1, 14.8, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12.1);
  doc.text('Termo de Adesão ao Instrumento de Adesão às Atividades Educacionais', 200.1, 20.2, { align: 'right' });

  // Caixa de Número de Registro (RM) no topo direito
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.rect(167.8, 22.5, 32.1, 4.8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('nº:', 169.5, 26.0);
  if (isInteractive) {
    const fRm = new TextField();
    fRm.Rect = [175.5, 22.8, 23.5, 4.2];
    fRm.value = String(rm);
    fRm.fieldName = 'rm_numero_topo';
    fRm.fontSize = 8.5;
    fRm.showBorder = false;
    doc.addField(fRm);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.0);
    doc.text(String(rm), 176.0, 26.0);
  }

  // Linha horizontal divisória sob o cabeçalho
  doc.setLineWidth(0.7);
  doc.line(10.1, 30.3, 200.1, 30.3);

  // Ao diretor da escola
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('Ao diretor da escola,', 10.1, 37.5);

  // Duas Colunas para as Cláusulas (a) a (e)
  const col1 = [
    'Na qualidade de responsável financeiro pelo(a) estudante adiante identificado(a) e nos termos da legislação em vigor, do Regimento Escolar, do Plano Escolar, da Cartilha de Direitos e Deveres dos Alunos, do KIT DE MATRÍCULA, requeiro sua matrícula declarando estar ciente de que:',
    `a) a presente solicitação deve ser analisada pelos diversos setores da escola, dentre eles o Pedagógico e o Financeiro, podendo ser ou não deferida. Em caso de indeferimento, a escola comunicará o responsável/aluno em até 10 dias úteis após a assinatura do Requerimento de Matrícula e serão devolvidas integralmente todas as quantias pagas relativas à anuidade ${academicYear}.`,
    'b) o responsável financeiro obriga-se a disponibilizar o material didático integral (composto pelas modalidades física e digital, incluindo todos os acessos às plataformas de ensino) no início das aulas do ano letivo, sem o qual fica impossibilitada a prestação do serviço educacional. O responsável financeiro declara ciência expressa e inequívoca de que a ESCOLA adota materiais e/ou plataformas digitais do SISTEMA COC DE ENSINO, do Edify (Ensino Fundamental – anos finais), do LIV (Ensino Fundamental – anos finais), do TRIEduc (7º ano do EF à 3ª série do EM), da Stift (Ensino Médio), da VestibuLer (3ª série do EM) e outros materiais, conforme apresentados nos anexos I, II e III do Instrumento de Adesão às Atividades Educacionais Ministradas pela Balder Educacional LTDA.'
  ];

  const col2 = [
    'c) este requerimento é parte integrante do Instrumento de Adesão às Atividades Educacionais ministradas pela Escola e será prenotado no Cartório Oficial de Registro de Imóveis, Títulos e Documentos e Civil de Pessoa Jurídica da Comarca de Indaiatuba no Estado de São Paulo, localizado no Shopping Mall - Rua das Primaveras, nº 1050 - loja 42 - Jardim Pompéia, Indaiatuba/SP e estão disponíveis para consulta no setor de matrículas da ESCOLA.',
    'd) aceito as condições do Regimento Escolar, da Proposta Pedagógica, do Plano Escolar, da Cartilha de Direito e Deveres do Aluno, do Kit de Matrículas – documentos esses disponíveis no Setor de Matrículas da ESCOLA – e quaisquer outros documentos relacionados/vinculados à matrícula, à prestação dos serviços educacionais e à vida escolar do aluno, declarando pleno conhecimento dos textos dos documentos acima mencionados, bem como o valor da anuidade, plano e forma de pagamento pela qual optei.',
    'e) as partes autorizam o tratamento e o compartilhamento de seus dados pessoais (inclusive sensíveis) com instituições financeiras, cartórios, prestadores de serviços e advogados. Esse compartilhamento será restrito às finalidades exclusivas de execução e cumprimento deste contrato, nos termos da Lei nº 13.709/2018 (LGPD). Todos os envolvidos obrigam-se a manter o sigilo, a confidencialidade e a segurança dos dados compartilhados.'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.2);
  doc.setLineHeightFactor(1.48);
  const lineH = 4.8;

  let yCol1 = 43.0;
  col1.forEach((p, idx) => {
    const lines = doc.splitTextToSize(p, 93.5);
    doc.text(lines, 10.1, yCol1, { align: 'justify', maxWidth: 93.5 });
    yCol1 += (lines.length * lineH) + (idx === 0 ? 5.5 : 4.5);
  });

  let yCol2 = 43.0;
  col2.forEach((p) => {
    const lines = doc.splitTextToSize(p, 92.5);
    doc.text(lines, 107.5, yCol2, { align: 'justify', maxWidth: 92.5 });
    yCol2 += (lines.length * lineH) + 4.5;
  });
  doc.setLineHeightFactor(1.15);

  // 2. DADOS PESSOAIS DO ESTUDANTE
  const sGender = data.studentGender || data.gender || '';
  const isStudentMasc = sGender === 'Masc.' || sGender === 'Masculino';
  const isStudentFem = sGender === 'Fem.' || sGender === 'Feminino';

  drawSectionHeader(187.0, 'DADOS PESSOAIS DO ESTUDANTE');

  // Linha 1 (y = 200.0)
  drawTickField(10.1, 200.0, 139.7, 'Nome completo (sem abreviaturas)', studentName);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Sexo', 151.0, 200.0 - 4.2);
  drawCheckbox(151.2, 200.0, 'Masc.', isStudentMasc, { boxSize: 3.2, fontSize: 7.6, labelOffset: 4.0 });
  drawCheckbox(164.0, 200.0, 'Fem.', isStudentFem, { boxSize: 3.2, fontSize: 7.6, labelOffset: 4.0 });
  drawTickField(177.3, 200.0, 22.8, 'Data de Nasc.:', formatDisplayDate(data.studentBirthDate || data.birthDate));

  // Linha 2 (y = 211.3)
  drawTickField(10.1, 211.3, 40.4, 'Local Nasc.:', data.studentBirthCity || data.birthCity || '—');
  drawTickField(52.2, 211.3, 35.0, 'RG:', data.studentRg || data.rg || '—');
  drawTickField(89.0, 211.3, 20.0, 'Órg. Exp.:', data.studentRgIssuer || data.rgIssuer || 'SSP/SP');
  drawTickField(110.6, 211.3, 19.5, 'Emissão:', formatDisplayDate(data.studentRgIssueDate || data.rgIssueDate));
  drawTickField(131.9, 211.3, 40.5, 'CPF:', data.studentCpf || data.cpf || '—');
  drawTickField(173.9, 211.3, 26.2, 'Nacionalidade:', data.studentNationality || data.nationality || 'Brasileira');

  // 3. DADOS ACADÊMICOS DO ESTUDANTE
  drawSectionHeader(219.7, 'DADOS ACADÊMICOS DO ESTUDANTE');

  const displayCourse = (data.courseLevel || 'Ensino Fundamental').replace('Ensino Fundamental II', 'Ensino Fundamental');
  const displayGrade = (data.currentGrade || '6º Ano EF').replace('Ensino Fundamental II', 'Ensino Fundamental');
  const studentPhoneVal = data.studentPhone || data.phoneMobile || data.guardianPhone || '—';

  drawTickField(10.1, 231.5, 55.8, 'Curso:', displayCourse);
  drawTickField(68.0, 231.5, 35.9, 'Turno:', data.schoolShift || 'Manhã');
  drawTickField(105.9, 231.5, 37.3, 'Ano/Série/Modalidade:', displayGrade);
  drawTickField(145.0, 231.5, 54.9, 'Tel. Celular / WhatsApp', studentPhoneVal);

  // 4. DADOS FINANCEIROS DO ESTUDANTE (PLANO E FORMA DE PAGAMENTO)
  drawSectionHeader(240.9, 'DADOS FINANCEIROS DO ESTUDANTE (PLANO E FORMA DE PAGAMENTO)');

  const totalInstallments = parseInt(data.installmentsCount) || 13;
  const isAvista = totalInstallments === 1 || data.paymentPlanChoice === '1_avista_5off' || data.paymentPlanChoice === '1';
  const firstSplit = isAvista ? 1 : (parseInt(data.firstInstallmentSplit) || 1);
  const gradeRates = getFixedRatesForGrade(data.currentGrade);

  // Detecção robusta e completa de Bolsa / Desconto 100%
  const rawPct = data.tuitionDiscountPercentage !== undefined 
    ? data.tuitionDiscountPercentage 
    : (data.percentual_desconto_2027 !== undefined ? data.percentual_desconto_2027 : null);
  const numPct = typeof rawPct === 'number' ? rawPct : (parseMoneyVal(rawPct) || 0);
  const normalizedPct = numPct <= 1 && numPct > 0 ? Math.round(numPct * 100) : Math.round(numPct);

  const discountReasonText = String(
    data.tuitionDiscountReason || 
    data.tuitionDiscountType || 
    data.observacao_desconto_2027 || 
    data.tipo_desconto_2027 || 
    data.discountDescription || 
    data.notes || 
    data.observations || 
    ''
  );

  const has100Keyword = /100%|bolsa\s*100|permuta\s*100|integral\s*100/i.test(discountReasonText);
  const parsedDiscountTotal = parseMoneyVal(data.tuitionDiscountTotal);
  const parsedStudentTotal = parseMoneyVal(data.valor_total_anuidade_2027);
  const has0DiscountAmount = (parsedDiscountTotal === 0 && data.tuitionDiscountTotal !== undefined && data.tuitionDiscountTotal !== null) ||
                             (parsedStudentTotal === 0 && data.valor_total_anuidade_2027 !== undefined && data.valor_total_anuidade_2027 !== null);

  const is100Discount = normalizedPct === 100 || has100Keyword || (has0DiscountAmount && (normalizedPct > 0 || has100Keyword));

  let grossNum = 0;
  let firstNum = 0;
  let regNum = 0;

  if (is100Discount) {
    grossNum = 0;
    firstNum = 0;
    regNum = 0;
  } else {
    const grossTotal = parseMoneyVal(data.tuitionGrossTotal);

    if (parsedDiscountTotal !== null && parsedDiscountTotal >= 0) {
      grossNum = parsedDiscountTotal;
    } else if (parsedStudentTotal !== null && parsedStudentTotal >= 0 && normalizedPct > 0) {
      grossNum = parsedStudentTotal;
    } else if (grossTotal !== null && grossTotal >= 0) {
      if (normalizedPct > 0 && Math.abs(grossTotal - (gradeRates.tuitionNominalNum || 0)) < 1) {
        grossNum = Math.max(0, gradeRates.tuitionNominalNum * (1 - normalizedPct / 100));
      } else {
        grossNum = grossTotal;
      }
    } else {
      grossNum = gradeRates.tuitionNominalNum || gradeRates.tuitionAnnual || 0;
    }

    const firstParsed = parseMoneyVal(data.firstInstallmentValue);
    const regParsed = parseMoneyVal(data.regularInstallmentValue);

    if (firstParsed !== null) {
      firstNum = firstParsed;
    } else {
      firstNum = totalInstallments > 0 ? (grossNum / totalInstallments) : grossNum;
    }

    if (regParsed !== null) {
      regNum = regParsed;
    } else {
      regNum = totalInstallments > 0 ? (grossNum / totalInstallments) : grossNum;
    }
  }

  const grossVal = grossNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const firstVal = firstNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const regVal = regNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // 1. Quantidade de Parcelas
  const instCountLabel = isAvista ? '1 parcela (À Vista)' : `${totalInstallments} parcelas mensais`;

  // 2. Parcelamento da 1ª Parcela (em até 3x)
  let firstSplitLabel = `1x de R$ ${firstVal}`;
  if (is100Discount) {
    firstSplitLabel = '—';
  } else if (isAvista) {
    firstSplitLabel = '1x (À Vista)';
  } else if (firstSplit > 1 && firstNum > 0) {
    const splitValNum = firstNum / firstSplit;
    const splitValStr = splitValNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    firstSplitLabel = `${firstSplit}x de R$ ${splitValStr}`;
  } else {
    firstSplitLabel = `1x de R$ ${firstVal}`;
  }

  // 3. Vencimento das cotas da 1ª parcela
  const rawQuotaDue = String(data.quotaDueDate || data.firstInstallmentDueDate || '15').trim();
  let firstDueLabel = rawQuotaDue;
  if (is100Discount) {
    firstDueLabel = '—';
  } else if (!firstDueLabel.toLowerCase().includes('dia') && !firstDueLabel.toLowerCase().includes('todo') && firstDueLabel.length <= 4) {
    firstDueLabel = `Dia ${firstDueLabel}`;
  }

  // 4. Vencimento das demais parcelas
  const rawInstDue = String(data.installmentDueDate || '1').trim();
  let regDueLabel = rawInstDue;
  if (isAvista || is100Discount) {
    regDueLabel = '—';
  } else if (rawInstDue === '1' || rawInstDue === '1º' || rawInstDue.includes('1º')) {
    regDueLabel = 'Todo dia 1º (primeiro dia útil)';
  } else if (!regDueLabel.toLowerCase().includes('dia') && !regDueLabel.toLowerCase().includes('todo')) {
    regDueLabel = `Todo dia ${regDueLabel}`;
  }

  // Coluna Esquerda: Anuidade, Parcelas e Vencimentos (Aproveitamento inteligente do espaço na mesma linha/estilo)
  // Linha 1: Valor de Contrato e Número de Parcelas
  drawTickField(10.1, 251.0, 60.0, 'Valor Total da Anuidade do Curso:', `R$ ${grossVal}`, { boldValue: true, fieldName: 'anuidade_total_curso' });
  drawTickField(73.0, 251.0, 53.2, 'Quant. de Parcelas:', instCountLabel, { boldValue: true, fieldName: 'anuidade_quant_parcelas' });

  // Linha 2: Tudo da 1ª Parcela (Valor, Parcelamento em até 3x, Vencimento das Cotas)
  drawTickField(10.1, 262.0, 32.0, 'Valor da 1ª Parcela:', is100Discount ? '—' : `R$ ${firstVal}`, { boldValue: true, fieldName: 'valor_primeira_parcela' });
  drawTickField(44.5, 262.0, 48.0, 'Parcelamento 1ª Parcela (até 3x):', firstSplitLabel, { boldValue: true, fieldName: 'parcelamento_primeira_parcela' });
  drawTickField(94.5, 262.0, 31.7, 'Venc. Cotas 1ª Parc.:', firstDueLabel, { boldValue: true, fieldName: 'vencimento_cotas_primeira_parcela' });

  // Linha 3: Demais Parcelas e Vencimento das Demais Parcelas
  drawTickField(10.1, 273.0, 46.0, 'Valor das Demais Parcelas:*', (isAvista || is100Discount) ? '—' : `R$ ${regVal}`, { boldValue: true, fieldName: 'valor_demais_parcelas' });
  drawTickField(58.5, 273.0, 67.7, 'Vencimento das Demais Parcelas:', regDueLabel, { boldValue: true, fieldName: 'vencimento_demais_parcelas' });

  // Vencimento e Notas
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(0, 0, 0);
  doc.text('* Boletos bancários com vencimento mensal e sucessivo.', 10.1, 277.5);

  // Coluna Direita: Caixa de Observações
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(128.0, 243.9, 72.2, 34.6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Obs.:', 129.8, 247.8);

  const obsLinesY = [250.1, 258.1, 266.0, 274.0];
  obsLinesY.forEach(ly => {
    doc.setLineWidth(0.15);
    doc.line(128.0, ly, 200.2, ly);
  });

  // Caixa de Observações: campo exclusivo para anotações administrativas manuais
  // (Regra: NUNCA puxar descrição ou motivo de desconto para este campo)
  let notesContent = '';
  if (data.adminNotes || data.customNotes || data.manualNotes) {
    notesContent = String(data.adminNotes || data.customNotes || data.manualNotes || '').trim();
  }

  if (isInteractive) {
    const fObs = new TextField();
    fObs.Rect = [138.0, 244.5, 61.5, 33.0];
    fObs.value = notesContent || '';
    fObs.fieldName = 'observacoes_anuidade';
    fObs.fontSize = 7.5;
    fObs.multiline = true;
    fObs.showBorder = false;
    doc.addField(fObs);
  } else if (notesContent) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const firstLineWidth = 58;
    const otherLineWidth = 68;
    const splitNotes = [];
    const allWords = notesContent.split(' ');
    let currentLine = '';
    allWords.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const maxW = splitNotes.length === 0 ? firstLineWidth : otherLineWidth;
      if (doc.getTextWidth(testLine) > maxW && currentLine) {
        splitNotes.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    if (currentLine) splitNotes.push(currentLine);

    splitNotes.slice(0, 4).forEach((nl, idx) => {
      const xPos = idx === 0 ? 139.5 : 130.0;
      doc.text(nl, xPos, obsLinesY[idx] ? obsLinesY[idx] - 1.2 : 254.0);
    });
  }

  // Barra preta sólida no término dos dados da Página 1
  doc.setLineWidth(0.7);
  doc.line(9.8, 282.0, 200.2, 282.0);

  // =========================================================================
  // PÁGINA 2: RESPONSÁVEL FINANCEIRO, DEFERIMENTO E 4 ASSINATURAS
  // =========================================================================
  doc.addPage();

  const gName = (data.guardianName || '').toUpperCase();
  const gCpf = data.guardianCpf || '—';
  const gPhone = data.guardianPhone || '—';
  const gEmail = data.guardianEmail || '—';
  const gRelation = data.guardianRelation || 'Pai';
  const gGender = data.guardianGender || '';
  const isGuardianMasc = gGender === 'Masc.' || gGender === 'Masculino';
  const isGuardianFem = gGender === 'Fem.' || gGender === 'Feminino';

  const fullStreet = data.guardianAddressStreet 
    ? `${data.guardianAddressStreet}${data.guardianAddressNumber ? ', nº ' + data.guardianAddressNumber : ''}${data.guardianAddressComplement ? ' (' + data.guardianAddressComplement + ')' : ''}`
    : (data.guardianAddress || '—');

  const cityStateStr = data.guardianAddressCity 
    ? `${data.guardianAddressCity}${data.guardianAddressState ? ' - ' + data.guardianAddressState : ''}`
    : '—';

  // 1. Bloco Responsável Financeiro
  drawSectionHeader(11.3, 'RESPONSÁVEL FINANCEIRO');

  // Linha 1 (y = 21.0)
  drawTickField(10.2, 21.0, 27.0, 'Parentesco:', gRelation);
  drawTickField(38.5, 21.0, 116.2, 'Nome completo', gName);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Sexo', 156.4, 21.0 - 4.2);
  drawCheckbox(165.9, 21.0, 'Masc.', isGuardianMasc);
  drawCheckbox(183.3, 21.0, 'Fem.', isGuardianFem);

  // Linha 2 (y = 32.5)
  drawTickField(10.2, 32.5, 46.3, 'Data de Nasc.:', formatDisplayDate(data.guardianBirthDate));
  drawTickField(57.8, 32.5, 85.2, 'Ocupação:', data.guardianOccupation || '—');
  drawTickField(144.2, 32.5, 56.0, 'Estado Civil:', data.guardianMaritalStatus || '—');

  // Linha 3 (y = 43.5)
  drawTickField(10.0, 43.5, 38.5, 'RG:', data.guardianRg || '—');
  drawTickField(50.0, 43.5, 38.5, 'Órg. Exped.:', data.guardianRgIssuer || 'SSP');
  drawTickField(90.1, 43.5, 52.5, 'CPF:', gCpf);
  drawTickField(144.1, 43.5, 55.9, 'Nacionalidade:', data.guardianNationality || 'Brasileiro(a)');

  // Linha 4 (y = 54.5)
  drawTickField(10.0, 54.5, 38.5, 'CEP:', data.guardianAddressCep || '—');
  drawTickField(50.3, 54.5, 149.7, 'Logradouro:', fullStreet);

  // Linha 5 (y = 65.0)
  drawTickField(10.0, 65.0, 94.9, 'Bairro:', data.guardianAddressNeighborhood || '—');
  drawTickField(106.4, 65.0, 93.6, 'Cidade - UF:', cityStateStr);

  // Linha 6 (y = 75.5)
  drawTickField(10.0, 75.5, 115.0, 'E-mail:', gEmail);
  drawTickField(128.0, 75.5, 72.0, 'Tel. Celular / WhatsApp', gPhone);

  // 2. Pedido de Deferimento
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.0);
  doc.text('Nestes termos peço deferimento,', 9.6, 88.0);

  // 3. Assinaturas Oficiais (Linha 1: Responsável Financeiro e Balder Educacional)
  const signatureImg = data.signatureImage || data.signatureDataUrl || signatureData.signatureImage || signatureData.signatureDataUrl;
  const isOnlineSigned = Boolean(
    !data.isPresencial && 
    !signatureData.isPresencial && 
    data.signatureSha256 && 
    data.signatureSha256 !== 'PRESENCIAL_FISICO_SETOR_MATRICULAS' &&
    signatureImg && 
    typeof signatureImg === 'string' && 
    signatureImg.startsWith('data:image')
  );

  const ySig1 = 125.0;
  if (isOnlineSigned) {
    try {
      doc.addImage(signatureImg, 'PNG', 20.0, ySig1 - 20.0, 60, 18);
    } catch (e) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.text('Assinado Eletronicamente', 58.0, ySig1 - 4, { align: 'center' });
    }
  }

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.line(15.4, ySig1, 101.6, ySig1);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.0);
  doc.text('Assinatura do responsável financeiro:', 58.5, ySig1 + 5.8, { align: 'center' });

  // Assinatura Canela (Balder Educacional) - arquivo original sobre a linha
  try {
    doc.addImage(signatureCanela, 'PNG', 126.0, ySig1 - 10.8, 62, 15);
  } catch (err) {
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(9.5);
    doc.text('Balder Educacional Ltda', 155.0, ySig1 - 4, { align: 'center' });
  }
  doc.line(110.0, ySig1, 200.2, ySig1);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('BALDER EDUCACIONAL LTDA  •  CNPJ: 29.221.297/0001-05', 155.1, ySig1 + 5.8, { align: 'center' });

  // 4. Assinaturas Oficiais (Linha 2: Testemunhas Oficiais)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Testemunhas:', 9.8, 145.0);

  const ySig2 = 168.0;

  // Testemunha 1: Elisangela C. Santos
  try {
    doc.addImage(signatureElisangela, 'PNG', 30.0, ySig2 - 16.0, 50, 15);
  } catch (err) {
    // fallback
  }
  doc.line(9.9, ySig2, 93.2, ySig2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.text('Assinatura', 46.0, ySig2 + 3.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.0);
  doc.text('Nome:', 9.9, ySig2 + 9.0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.4);
  doc.text('Elisangela C. Santos', 22.0, ySig2 + 9.0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.0);
  doc.text('RG:', 9.9, ySig2 + 16.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.4);
  doc.text('28.246.044-5', 17.5, ySig2 + 16.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.0);
  doc.text('CPF:', 50.0, ySig2 + 16.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.4);
  doc.text('256.209.898-60', 58.5, ySig2 + 16.5);

  // Testemunha 2: Kelly Cristina Vilani
  try {
    doc.addImage(signatureKelly, 'PNG', 135.0, ySig2 - 16.0, 50, 15);
  } catch (err) {
    // fallback
  }
  doc.line(116.5, ySig2, 199.8, ySig2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.text('Assinatura', 152.6, ySig2 + 3.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.0);
  doc.text('Nome:', 116.5, ySig2 + 9.0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.4);
  doc.text('Kelly Cristina Vilani', 128.5, ySig2 + 9.0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.0);
  doc.text('RG:', 116.5, ySig2 + 16.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.4);
  doc.text('25.242.096-2', 124.0, ySig2 + 16.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.0);
  doc.text('CPF:', 156.5, ySig2 + 16.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.4);
  doc.text('194.797.828-47', 165.0, ySig2 + 16.5);

  // 5. Rodapé Oficial Página 2
  // Data preenchida automaticamente pelo sistema na hora da exportação
  let exportDateFormatted = '';
  const rawExportDate = data.signedAt || data.enrollmentDate || data.createdAt || data.date;
  if (rawExportDate) {
    try {
      const d = new Date(rawExportDate);
      if (!isNaN(d.getTime())) {
        exportDateFormatted = d.toLocaleDateString('pt-BR');
      } else {
        exportDateFormatted = formatDisplayDate(rawExportDate);
      }
    } catch (e) {
      exportDateFormatted = formatDisplayDate(rawExportDate);
    }
  }
  if (!exportDateFormatted || exportDateFormatted === '—') {
    exportDateFormatted = new Date().toLocaleDateString('pt-BR');
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.0);
  doc.setTextColor(0, 0, 0);
  doc.text('Uso da matrícula - data:', 9.8, 269.5);

  // Linha horizontal contínua oficial até a margem (com folga após os dois pontos)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.line(50.0, 269.5, 200.1, 269.5);

  // Data preenchida automaticamente sobre a linha
  if (isInteractive) {
    const fDate = new TextField();
    fDate.Rect = [52.0, 265.5, 40.0, 3.8];
    fDate.value = exportDateFormatted;
    fDate.fieldName = 'data_uso_matricula';
    fDate.fontSize = 9.0;
    fDate.showBorder = false;
    doc.addField(fDate);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(exportDateFormatted, 52.5, 268.5);
  }

  // Se assinado online com hash, carimbo digital discreto acima da barra
  if (isOnlineSigned && data.signatureSha256) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(71, 85, 105);
    doc.text(`Selo Digital LGPD/ICP-Brasil: SHA256-${data.signatureSha256.substring(0, 36)}... · ${data.signedAt || 'Portal'}`, 9.8, 278.0);
  }

  // Barra preta sólida inferior
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.7);
  doc.line(10.0, 282.7, 200.2, 282.7);

  // Endereço oficial à direita abaixo da barra
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.0);
  doc.setTextColor(0, 0, 0);
  doc.text('Rua Padre Anchieta, 484, Vila Sfeir- Indaiatuba - SP', 200.2, 287.0, { align: 'right' });

  return doc;
}

/**
 * Gera e baixa o PDF oficial do Requerimento com o nome completo e formatado
 */
export function downloadSignedContractPDF(enrollment = {}, signatureData = {}, docOptions = {}) {
  try {
    const doc = buildSignedContractPDFDoc(enrollment, signatureData, docOptions);
    const data = { ...enrollment, ...signatureData };
    const rm = data.rmNumber || data.cocCode || '2570';
    const academicYear = data.academicYear || 2027;
    const rawName = data.studentName || 'Estudante';
    const cleanName = rawName.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const filename = `Requerimento_de_Matricula_RM_${rm}_${cleanName}_${academicYear}.pdf`;
    doc.save(filename);
    return true;
  } catch (err) {
    console.error('Falha ao gerar e salvar PDF:', err);
    throw err;
  }
}

export const generateSignedContractPDF = downloadSignedContractPDF;

/**
 * Gera o Blob URL para pré-visualização interativa do PDF
 */
export function getSignedContractPDFBlobUrl(enrollment = {}, signatureData = {}, docOptions = {}) {
  const doc = buildSignedContractPDFDoc(enrollment, signatureData, docOptions);
  const data = { ...enrollment, ...signatureData };
  const studentName = data.studentName || 'Estudante';
  const rm = data.rmNumber || data.cocCode || '2570';
  const pdfTitle = `Requerimento de Matrícula • ${studentName} (RM ${rm})`;

  const blob = doc.output('blob');
  try {
    const namedFile = new File([blob], `${pdfTitle}.pdf`, { type: 'application/pdf' });
    return URL.createObjectURL(namedFile);
  } catch (e) {
    return URL.createObjectURL(blob);
  }
}

/**
 * Abre a pré-visualização do PDF diretamente no navegador em nova guia
 */
export function previewSignedContractPDF(enrollment = {}, signatureData = {}, docOptions = {}) {
  const blobUrl = getSignedContractPDFBlobUrl(enrollment, signatureData, docOptions);
  window.open(blobUrl, '_blank');
  return blobUrl;
}

// =========================================================================
// NOVO: CONSTRUTOR DO PEDIDO DE MATERIAL DIDÁTICO (LIVRARIA DO PENSADOR LTDA)
// CNPJ: 43.849.399/0001-92 — 4 PÁGINAS OFICIAIS COM CONDIÇÕES GERAIS E ANEXOS
// =========================================================================
export function buildMaterialOrderPDFDoc(enrollment = {}, signatureData = {}, docOptions = {}) {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
  });

  const isInteractive = Boolean(docOptions.interactive);
  const { TextField } = jsPDF.AcroForm;

  const data = { ...enrollment, ...signatureData };
  const rm = data.rmNumber || data.cocCode || '2570';
  const academicYear = data.academicYear || 2027;
  const studentName = data.studentName || 'Estudante';
  const buyerName = (data.materialBuyerName || data.guardianName || '—').toUpperCase();
  const buyerCpf = data.materialBuyerCpf || data.guardianCpf || '—';

  // Metadados oficiais do PDF
  doc.setProperties({
    title: `Pedido de Material Didático • ${studentName} (${academicYear})`,
    subject: `Pedido de Material Didático ${academicYear} - Livraria do Pensador LTDA`,
    author: 'Livraria do Pensador LTDA - CNPJ 43.849.399/0001-92',
    creator: 'Colégio Rodin Sistema Integrado de Gestão'
  });

  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = months[now.getMonth()];
  const currentYear = now.getFullYear();

  // =========================================================================
  // PÁGINA 1: CABEÇALHO, DADOS DO PEDIDO E CONDIÇÕES GERAIS (1 A 10)
  // =========================================================================
  // Topo Esquerdo: Logo Livraria do Pensador (Versão Preta Oficial Sem Distorção)
  try {
    // Proporção correta do thinker-mark-black (130x185 = 0.7027): largura proporcional para altura de 17.0mm = 11.95mm
    doc.addImage(thinkerMarkBlack, 'PNG', 10.1, 10.0, 11.95, 17.0);
  } catch (e) {
    // Fallback caso imagem não carregue
  }
  doc.setDrawColor(0, 0, 0); // Linha divisória em preto
  doc.setLineWidth(0.7);
  doc.line(25.0, 10.0, 25.0, 27.0);

  doc.setTextColor(0, 0, 0); // Texto em preto
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Livraria do', 28.5, 16.5);
  doc.setFontSize(13);
  doc.text('Pensador', 28.5, 22.5);

  // Topo Direito: Título e CNPJ Livraria do Pensador
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Pedido de Material Didático', 201, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Material Didático Selecionado para Adoção no Colégio Rodin', 201, 17.5, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Livraria do Pensador LTDA - CNPJ: 43.849.399/0001-92', 201, 21.5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7);
  doc.text('Rua: Padre Jose de Anchieta, nº 484, sala: 1,', 201, 25.5, { align: 'right' });
  doc.text('Vila Sfeir, Indaiatuba/SP - CEP: 13.330-340', 201, 29, { align: 'right' });

  // =========================================================================
  // BLOCO DE CAPTURA DE DADOS DO PEDIDO
  // =========================================================================
  let yForm = 43.5;
  const underline = (startX, y, endX) => {
    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.35);
    doc.line(startX, y, endX, y);
  };

  // Linha 1: Comprador e CPF
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Comprador (resp. fin.):', 10, yForm);
  underline(44, yForm + 0.5, 150);
  if (isInteractive) {
    const f = new TextField();
    f.Rect = [44.5, yForm - 4.2, 104.0, 4.4];
    f.value = buyerName && buyerName !== '—' ? buyerName : '';
    f.fieldName = 'comprador_nome';
    f.fontSize = 8.5;
    f.showBorder = false;
    doc.addField(f);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text(`${doc.splitTextToSize(buyerName || '', 100)[0] || ''}`, 46, yForm - 0.5);
  }

  doc.setFont('helvetica', 'normal');
  doc.text('CPF:', 153, yForm);
  underline(162, yForm + 0.5, 201);
  if (isInteractive) {
    const f = new TextField();
    f.Rect = [162.5, yForm - 4.2, 38.0, 4.4];
    f.value = buyerCpf && buyerCpf !== '—' ? buyerCpf : '';
    f.fieldName = 'comprador_cpf';
    f.fontSize = 8.5;
    f.showBorder = false;
    doc.addField(f);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text(`${buyerCpf}`, 164, yForm - 0.5);
  }

  // Linha 2: Nome do Estudante e Ano Letivo
  yForm += 10;
  doc.setFont('helvetica', 'normal');
  doc.text('Nome do Estudante:', 10, yForm);
  underline(41, yForm + 0.5, 162);
  if (isInteractive) {
    const f = new TextField();
    f.Rect = [41.5, yForm - 4.2, 119.5, 4.4];
    f.value = studentName.toUpperCase();
    f.fieldName = 'estudante_nome';
    f.fontSize = 8.5;
    f.showBorder = false;
    doc.addField(f);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text(`${doc.splitTextToSize(studentName.toUpperCase(), 115)[0] || ''}`, 43, yForm - 0.5);
  }

  doc.setFont('helvetica', 'normal');
  doc.text('Ano letivo:', 165, yForm);
  underline(181, yForm + 0.5, 201);
  if (isInteractive) {
    const f = new TextField();
    f.Rect = [181.5, yForm - 4.2, 19.0, 4.4];
    f.value = String(academicYear);
    f.fieldName = 'ano_letivo';
    f.fontSize = 8.5;
    f.showBorder = false;
    doc.addField(f);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text(`${academicYear}`, 184, yForm - 0.5);
  }

  // Linha 3: Curso, Série e Turno
  yForm += 10;
  const courseStr = data.courseLevel || 'Ensino Fundamental';
  const gradeStr = data.currentGrade || '7º Ano EF';
  const shiftStr = data.schoolShift || 'Manhã';

  doc.setFont('helvetica', 'normal');
  doc.text('Curso:', 10, yForm);
  underline(22, yForm + 0.5, 82);
  if (isInteractive) {
    const f = new TextField();
    f.Rect = [22.5, yForm - 4.2, 59.0, 4.4];
    f.value = courseStr;
    f.fieldName = 'curso';
    f.fontSize = 8.5;
    f.showBorder = false;
    doc.addField(f);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text(`${courseStr}`, 24, yForm - 0.5);
  }

  doc.setFont('helvetica', 'normal');
  doc.text('Série:', 85, yForm);
  underline(95, yForm + 0.5, 155);
  if (isInteractive) {
    const f = new TextField();
    f.Rect = [95.5, yForm - 4.2, 59.0, 4.4];
    f.value = gradeStr;
    f.fieldName = 'serie';
    f.fontSize = 8.5;
    f.showBorder = false;
    doc.addField(f);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text(`${gradeStr}`, 97, yForm - 0.5);
  }

  doc.setFont('helvetica', 'normal');
  doc.text('Turno:', 158, yForm);
  underline(169, yForm + 0.5, 201);
  if (isInteractive) {
    const f = new TextField();
    f.Rect = [169.5, yForm - 4.2, 31.0, 4.4];
    f.value = shiftStr;
    f.fieldName = 'turno';
    f.fontSize = 8.5;
    f.showBorder = false;
    doc.addField(f);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text(`${shiftStr}`, 171, yForm - 0.5);
  }

  // Linha 4: Valor Total
  yForm += 10;
  const matGradeRates = getFixedRatesForGrade(data.currentGrade);
  const parsedMat = parseMoneyVal(data.materialTotalValue);
  const matTotalVal = parsedMat !== null
    ? parsedMat
    : (matGradeRates.materialTotalNum || matGradeRates.materialTotal || 0);
  const matTotalStr = matTotalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const paymentMethodStr = data.materialPaymentMethod || 'Boleto Bancário';

  doc.setFont('helvetica', 'normal');
  doc.text('Valor Total: (', 10, yForm);
  underline(29, yForm + 0.5, 76);
  if (isInteractive) {
    const f = new TextField();
    f.Rect = [29.5, yForm - 4.2, 46.0, 4.4];
    f.value = `R$ ${matTotalStr}`;
    f.fieldName = 'valor_total_material';
    f.fontSize = 8.5;
    f.showBorder = false;
    doc.addField(f);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text(`R$ ${matTotalStr}`, 31, yForm - 0.5);
  }
  doc.setFont('helvetica', 'normal');
  doc.text(')', 77, yForm);

  doc.setFont('helvetica', 'normal');
  doc.text('Forma de Pagamento:', 84, yForm);
  underline(118, yForm + 0.5, 201);
  if (isInteractive) {
    const f = new TextField();
    f.Rect = [118.5, yForm - 4.2, 82.0, 4.4];
    f.value = paymentMethodStr;
    f.fieldName = 'forma_pagamento';
    f.fontSize = 8.5;
    f.showBorder = false;
    doc.addField(f);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text(`${doc.splitTextToSize(paymentMethodStr, 80)[0] || ''}`, 120, yForm - 0.5);
  }

  // Linha 5: Número de Parcelas e Vencimento da 1ª Parcela
  yForm += 10;
  const matInstallments = parseInt(data.materialInstallmentsCount) || 12;
  const matInstallmentVal = (matTotalVal / matInstallments).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let rawStartDue = String(data.materialStartDueDate || '10/01/2027').trim();
  if (rawStartDue.includes('2026') || rawStartDue.includes('2025')) {
    rawStartDue = rawStartDue.replace(/202[56]/g, '2027');
  }
  const startDueStr = rawStartDue.length <= 2 ? `Todo dia ${rawStartDue}` : formatDisplayDate(rawStartDue);

  doc.setFont('helvetica', 'normal');
  doc.text('Número de Parcelas:', 10, yForm);
  underline(43, yForm + 0.5, 108);
  if (isInteractive) {
    const f = new TextField();
    f.Rect = [43.5, yForm - 4.2, 64.0, 4.4];
    f.value = `${matInstallments} parcelas (R$ ${matInstallmentVal})`;
    f.fieldName = 'numero_parcelas';
    f.fontSize = 8.5;
    f.showBorder = false;
    doc.addField(f);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text(`${matInstallments} parcelas (R$ ${matInstallmentVal})`, 45, yForm - 0.5);
  }

  doc.setFont('helvetica', 'normal');
  doc.text('Venc. da 1ª Parcela:', 112, yForm);
  underline(148, yForm + 0.5, 201);
  if (isInteractive) {
    const f = new TextField();
    f.Rect = [148.5, yForm - 4.2, 52.0, 4.4];
    f.value = startDueStr;
    f.fieldName = 'vencimento_1a_parcela';
    f.fontSize = 8.5;
    f.showBorder = false;
    doc.addField(f);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text(`${startDueStr}`, 150, yForm - 0.5);
  }

  // Linha 6: Vencimento das Demais Parcelas
  yForm += 10;
  let rawEndDue = String(data.materialEndDueDate || '10/12/2027').trim();
  if (rawEndDue.includes('2026') || rawEndDue.includes('2025')) {
    rawEndDue = rawEndDue.replace(/202[56]/g, '2027');
  }
  const endDueStr = rawEndDue.length <= 2 ? `Todo dia ${rawEndDue}` : formatDisplayDate(rawEndDue);

  doc.setFont('helvetica', 'normal');
  doc.text('Demais parcelas:', 10, yForm);
  underline(43, yForm + 0.5, 201);
  if (isInteractive) {
    const f = new TextField();
    f.Rect = [43.5, yForm - 4.2, 157.0, 4.4];
    f.value = endDueStr;
    f.fieldName = 'vencimento_demais_parcelas';
    f.fontSize = 8.5;
    f.showBorder = false;
    doc.addField(f);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.text(`${endDueStr}`, 45, yForm - 0.5);
  }

  // =========================================================================
  // SEÇÃO: CONDIÇÕES GERAIS DO PEDIDO (ITENS 1 A 10 NA PÁGINA 1)
  // =========================================================================
  yForm += 12;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.line(10, yForm - 0.5, 66, yForm - 0.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('CONDIÇÕES GERAIS DO PEDIDO', 105.4, yForm + 1, { align: 'center' });
  doc.line(144, yForm - 0.5, 201, yForm - 0.5);

  const startClausesY = 117.5;
  const leftX = 10;
  const rightX = 108;
  const colWidth = 90.5;
  const dividerX = 104.5;
  const p1FontSize = 9.2;
  const p1LineSpacing = 5.1;
  const p1Gap = 2.4;

  // Coluna 1 da Página 1: Cláusulas 1 a 6 (primeira parte até "acrescidas dos")
  const col1Page1 = [
    {
      num: '1.',
      text: 'O conjunto de material didático é entregue ao longo do ano letivo, independentemente do cronograma de pagamento, em datas estabelecidas pela escola.'
    },
    {
      num: '2.',
      text: 'Aos pagamentos efetuados após o vencimento serão aplicados multa de 2%, correção pela taxa SELIC e juros de mora de 1% ao mês.'
    },
    {
      num: '3.',
      text: `O pagamento poderá ser realizado à vista ou de forma parcelada, mediante boleto bancário, a ser emitido no ato do pedido, ou por cartão de crédito ou débito, conforme a opção do responsável financeiro e as condições de parcelamento acima descritas. Na hipótese de pagamento parcelado mediante boleto bancário, o vencimento das parcelas ocorrerá no dia ${rawEndDue} de cada mês.`
    },
    {
      num: '4.',
      text: 'O inadimplemento de qualquer pagamento acarretará a imediata suspensão da entrega do material pela editora.'
    },
    {
      num: '5.',
      text: 'A desistência do pedido poderá ser feita, por escrito, até 20 dias antes do início das aulas, ocasião em que serão restituídos os valores pagos. Após esse prazo, a Livraria do Pensador LTDA não efetuará a devolução de quaisquer valores pagos ou a vencerem (pagamento parcelado), uma vez que o pedido contempla integralmente o conjunto de material para cada série indicada, não ensejando a possibilidade de desmembramento.'
    },
    {
      num: '6.',
      text: 'No momento da solicitação de cancelamento do pedido, serão considerados como débitos as parcelas previstas na forma de pagamento escolhida e, eventualmente, não pagas até a data da solicitação, acrescidas dos'
    }
  ];

  // Coluna 2 da Página 1: Cláusula 6 (continuação) + Cláusulas 7, 8, 9 e 10 (primeira parte)
  const col2Page1 = [
    {
      num: '',
      text: 'valores indicados no item 3 (três) destas Condições Gerais, bem como eventuais parcelas futuras, frutos de composição de valores proporcionais.'
    },
    {
      num: '7.',
      text: 'A Livraria do Pensador LTDA vende somente "kits" completos para cada modalidade de ensino, conforme o plano e a forma de pagamento em vigência no momento da compra. Pedidos de material avulso terão tratamento e custos diferenciados, de acordo com a época do pedido e disponibilidade no estoque dos fornecedores da Livraria do Pensador.'
    },
    {
      num: '8.',
      text: 'Este pedido não contempla a reposição de material extraviado por motivo de perda ou mau uso. Caso isso ocorra, o estudante deverá realizar novo pedido e o valor cobrado será aquele estabelecido na tabela de material avulso disponível na Livraria do Pensador.'
    },
    {
      num: '9.',
      text: 'Qualquer componente do conjunto de material didático que apresentar defeito de fabricação será trocado pela Livraria do Pensador LTDA, desde que solicitado pelo comprador até sete dias após seu recebimento. Qualquer sinal de mau uso descaracterizará defeito de fabricação.'
    },
    {
      num: '10.',
      text: 'Fazem parte do conjunto de materiais tanto as versões impressas como digitais do Sistema de Ensino adotado pela Escola, inclusive acesso a portais de internet e o fornecimento de senhas para a modalidade adquirida, sendo que o acesso a portais e senhas estará disponível desde que o aluno esteja regularmente matriculado no Colégio Rodin. Quando em alguma'
    }
  ];

  const renderClauseList = (items, startX, startY, colW, fSize, lSpacing, gap) => {
    let curY = startY;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fSize);
    doc.setTextColor(30, 41, 59);

    items.forEach(item => {
      if (item.num) {
        doc.setFont('helvetica', 'bold');
        doc.text(item.num, startX, curY);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(item.text, colW - 5.5);
        doc.text(lines, startX + 5.5, curY);
        curY += lines.length * lSpacing + gap;
      } else {
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(item.text, colW);
        doc.text(lines, startX, curY);
        curY += lines.length * lSpacing + gap;
      }
    });
    return curY;
  };

  const y1P1 = renderClauseList(col1Page1, leftX, startClausesY, colWidth, p1FontSize, p1LineSpacing, p1Gap);
  const y2P1 = renderClauseList(col2Page1, rightX, startClausesY, colWidth, p1FontSize, p1LineSpacing, p1Gap);
  const bottomLineP1 = Math.max(y1P1, y2P1) - p1Gap + 1.5;

  // Linha vertical central e linha horizontal de fechamento da tabela de cláusulas da Página 1
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);
  doc.line(dividerX, startClausesY - 4, dividerX, bottomLineP1);
  doc.line(leftX, bottomLineP1, rightX + colWidth, bottomLineP1);

  // =========================================================================
  // PÁGINA 2: CONTINUAÇÃO CONDIÇÕES GERAIS (11 A 13), INFORMAÇÕES E ASSINATURAS
  // =========================================================================
  doc.addPage();

  const startYPage2 = 11;
  const p2FontSize = 9.2;
  const p2LineSpacing = 5.0;
  const p2Gap = 2.4;

  const col1Page2 = [
    {
      num: '',
      text: 'disciplina não houver material desse sistema, poderão ser utilizados outros de diversas editoras.'
    },
    {
      num: '11.',
      text: 'O Comprador declara estar de acordo com as condições financeiras e gerais deste pedido, para que o mesmo produza os efeitos de Direito.'
    },
    {
      num: '12.',
      text: 'No caso da 1ª série e da 2ª série do Ensino Médio, o valor do conjunto de material didático contempla a escolha de dois Itinerários Formativos Acadêmicos.'
    },
    {
      num: '13.',
      text: 'As partes declaram-se cientes de que, para a execução e cumprimento das obrigações previstas neste contrato, será eventualmente necessário o compartilhamento de seus dados pessoais, inclusive'
    }
  ];

  const col2Page2 = [
    {
      num: '',
      text: 'sensíveis, com instituições financeiras, cartórios, correspondentes bancários, prestadores de serviço e advogados. As partes autorizam expressamente o tratamento e o compartilhamento de tais dados pessoais, exclusivamente para os fins relacionados à operação de compra e venda objeto deste contrato, nos termos da Lei nº 13.709/2018 (Lei Geral de Proteção de Dados – LGPD), comprometendo-se todos os envolvidos a observarem o disposto na legislação vigente quanto à segurança e à confidencialidade desses dados.'
    }
  ];

  const y1P2 = renderClauseList(col1Page2, leftX, startYPage2, colWidth, p2FontSize, p2LineSpacing, p2Gap);
  const y2P2 = renderClauseList(col2Page2, rightX, startYPage2, colWidth, p2FontSize, p2LineSpacing, p2Gap);
  const bottomLineP2 = Math.max(y1P2, y2P2) - p2Gap + 1;

  // Linha vertical divisória entre as colunas no topo da Página 2
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);
  doc.line(dividerX, startYPage2 - 3, dividerX, bottomLineP2);

  // Caixa: INFORMAÇÕES SOBRE O MATERIAL DIDÁTICO
  const yBox = 92;
  const boxHeight = 52;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.5);
  doc.roundedRect(10, yBox, 191, boxHeight, 3, 3, 'D');

  // Abertura na linha superior com fundo branco amplo para o título central
  doc.setFillColor(255, 255, 255);
  doc.rect(60, yBox - 3, 91, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('INFORMAÇÕES SOBRE O MATERIAL DIDÁTICO', 105.4, yBox + 1.2, { align: 'center' });

  const bullet1 = '- A escola adotará o material didático que atenda seu planejamento pedagógico e indicará esse material para aquisição pelos alunos, sendo a Livraria do Pensador Ltda uma das opções para isso.';
  const bullet2 = '- O material didático é entregue aos alunos na própria escola ao longo do ano, em datas por ela estabelecidas, para conveniência do estudante ou seu responsável financeiro. As datas de entrega seguem a programação das disciplinas, independentemente do cronograma de pagamento, que varia conforme a opção de plano escolhida.';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  const b1Lines = doc.splitTextToSize(bullet1, 180);
  doc.text(b1Lines, 15, yBox + 14);

  const b2Lines = doc.splitTextToSize(bullet2, 180);
  doc.text(b2Lines, 15, yBox + 29);

  // Data e Local
  const yDate = 236.7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Indaiatuba - SP, ${currentDay} de ${currentMonth} de ${currentYear}.`, 105.4, yDate, { align: 'center' });

  // Bloco de Assinaturas
  const ySign = 271.3;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);

  // Assinatura Comprador / Responsável Financeiro (lado esquerdo)
  const sigImg = data.signatureCanvasDataUrl || data.parentSignature || signatureData.signatureDataUrl;
  if (sigImg) {
    try {
      doc.addImage(sigImg, 'PNG', 16, ySign - 18, 55, 16);
    } catch (e) {}
  }

  doc.line(11, ySign, 87, ySign);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Nome/Assinatura do(a) Responsável Financeiro(a)', 11, ySign + 4.5);
  if (buyerName) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${buyerName}`, 11, ySign + 8.5);
  }
  if (buyerCpf) {
    doc.setFont('helvetica', 'normal');
    doc.text(`CPF: ${buyerCpf}`, 11, ySign + 12.5);
  }

  // Assinatura Representante Livraria do Pensador LTDA (lado direito)
  try {
    doc.addImage(signatureLivraria, 'PNG', 114, ySign - 14.5, 82, 16.5);
  } catch (e) {}

  doc.line(105, ySign, 201, ySign);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.text('Nome/Assinatura do(a) Representante da Livraria do Pensador LTDA', 105, ySign + 5.0);

  // =========================================================================
  // PÁGINA 3: ANEXO I E ANEXO II
  // =========================================================================
  doc.addPage();

  let yAnx = 11.1;

  // ANEXO I
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('ANEXO – I', 105.4, yAnx + 4, { align: 'center' });
  yAnx += 16;

  doc.setFontSize(10);
  doc.text('MATERIAL DIDÁTICO NECESSÁRIO PARA A PRESTAÇÃO DE SERVIÇOS DESTINADA', 105.4, yAnx, { align: 'center' });
  yAnx += 6;
  doc.text('AO ENSINO FUNDAMENTAL – 6º AO 9º ANOS', 105.4, yAnx, { align: 'center' });
  yAnx += 12;

  const anexo1Items = [
    '1.  Acesso à Plataforma Jornada COC Educação (videoaulas, versão digital do material didático, exercícios adicionais, resoluções, atividades digitais interativas e demais soluções tecnológicas de suporte pedagógico);',
    '2.  06 Apostilas-livro de Teoria + Exercícios;',
    '3.  Tabela de Inglês (Irregular verbs, Helpful words and False cognate words);',
    '4.  Tabela de Química (9º ano);',
    '5.  Acesso à Plataforma Edify Play;',
    '6.  Material do programa de Educação Bilingue;',
    '7.  Material do Laboratório de Inteligência Emocional;',
    '8.  Acesso à plataforma de correção de redação com relatório das competências (7º ao 9º ano);',
    '9.  Apostila de Ciência e Tecnologia Aplicadas ao Cotidiano e Kits para utilização em laboratório;',
    '10. Apostila de Letramento em Inteligência Artificial (6º ano);',
    '11. Material de apoio de Atualidades / Século XXI (9º ano).'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(30, 41, 59);
  anexo1Items.forEach(item => {
    const lines = doc.splitTextToSize(item, 180);
    doc.text(lines, 14, yAnx);
    yAnx += lines.length * 4.4 + 1.8;
  });

  // ANEXO II
  yAnx = 139.1;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ANEXO – II', 105.4, yAnx + 4, { align: 'center' });
  yAnx += 16;

  doc.setFontSize(10);
  doc.text('MATERIAL DIDÁTICO NECESSÁRIO PARA A PRESTAÇÃO DE SERVIÇOS DESTINADA', 105.4, yAnx, { align: 'center' });
  yAnx += 6;
  doc.text('AO ENSINO MÉDIO – 1ª e 2ª SÉRIES', 105.4, yAnx, { align: 'center' });
  yAnx += 12;

  const anexo2Part1 = [
    '1.  Acesso à Plataforma Jornada COC Educação (videoaulas, versão digital do material didático, exercícios adicionais, resoluções, atividades digitais interativas e demais soluções tecnológicas de suporte pedagógico);'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  anexo2Part1.forEach(item => {
    const lines = doc.splitTextToSize(item, 180);
    doc.text(lines, 14, yAnx);
    yAnx += lines.length * 4.4 + 1.8;
  });

  yAnx += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.2);
  doc.text('BNCC', 14, yAnx);
  yAnx += 5.5;

  const anexo2BNCC = [
    '2.  08 livros Multidisciplinares (Matemática, Física, Química, Biologia, Gramática, Literatura, Prática Textual, Língua Inglesa, História, Geografia, Filosofia, Sociologia e Arte).',
    '3.  Tabela de Química;',
    '4.  Tabela de inglês (Irregular verbs, Helpful words and False cognate words);'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  anexo2BNCC.forEach(item => {
    const lines = doc.splitTextToSize(item, 180);
    doc.text(lines, 14, yAnx);
    yAnx += lines.length * 4.4 + 1.8;
  });

  yAnx += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.2);
  doc.text('ITINERÁRIOS FORMATIVOS ACADÊMICOS', 14, yAnx);
  yAnx += 5.5;

  const anexo2Itinerarios = [
    '5.  04 Livros Multidisciplinares (Matemática, Física, Química, Biologia, Prática Textual, História e Geografia);',
    '6.  Livro de Projeto de Vida;',
    '7.  Acesso à plataforma de correção de redação com relatório das competências da matriz do ENEM;',
    '8.  Acesso à plataforma de plantão de dúvidas 24h, com atendimento de professores reais e IA.'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  anexo2Itinerarios.forEach(item => {
    const lines = doc.splitTextToSize(item, 180);
    doc.text(lines, 14, yAnx);
    yAnx += lines.length * 4.4 + 1.8;
  });

  // =========================================================================
  // PÁGINA 4: ANEXO III (TERCEIRÃO)
  // =========================================================================
  doc.addPage();

  let yP4 = 11.1;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('ANEXO – III', 105.4, yP4 + 4, { align: 'center' });
  yP4 += 16;

  doc.setFontSize(10);
  doc.text('MATERIAL DIDÁTICO NECESSÁRIO PARA A PRESTAÇÃO DE SERVIÇOS DESTINADA', 105.4, yP4, { align: 'center' });
  yP4 += 6;
  doc.text('AO ENSINO MÉDIO – TERCEIRÃO', 105.4, yP4, { align: 'center' });
  yP4 += 12;

  const anexo3Items = [
    '1.  Acesso à Plataforma Jornada COC Educação (videoaulas, versão digital do material didático, exercícios adicionais, resoluções, atividades digitais interativas e demais soluções tecnológicas de suporte pedagógico);',
    '2.  10 livros Multidisciplinares (Teoria + Exercícios); \nLíngua Portuguesa (3 setores) / Matemática (3 setores) / Física (3 setores) / Química (3 setores) / Biologia (3 setores) / História (2 setores) / Geografia (2 setores) / Filosofia (1 setor) / Sociologia (1 setor).',
    '3.  Livro de Inglês;',
    '4.  Livro de Química;',
    '5.  Tabela de inglês (Irregular verbs, Helpful words and False cognate words);',
    '6.  Livro Teórico de Revisão;',
    '7.  Acesso à plataforma de correção de redação com relatório das competências da matriz do ENEM;',
    '8.  Acesso à plataforma de aulas sobre as obras literárias cobradas nos principais vestibulares;',
    '9.  Acesso à plataforma de plantão de dúvidas 24h, com atendimento de professores reais e IA.'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  anexo3Items.forEach(item => {
    const lines = doc.splitTextToSize(item, 180);
    doc.text(lines, 14, yP4);
    yP4 += lines.length * 4.4 + 2.0;
  });

  return doc;
}

/**
 * Baixa o PDF oficial do Pedido de Material Didático (Livraria do Pensador LTDA)
 */
export function downloadMaterialOrderPDF(enrollment = {}, signatureData = {}, docOptions = {}) {
  try {
    const doc = buildMaterialOrderPDFDoc(enrollment, signatureData, docOptions);
    const data = { ...enrollment, ...signatureData };
    const rm = data.rmNumber || data.cocCode || '2570';
    const academicYear = data.academicYear || 2027;
    const rawName = data.studentName || 'Estudante';
    const cleanName = rawName.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const filename = `Pedido_de_Material_Didatico_RM_${rm}_${cleanName}_${academicYear}.pdf`;
    doc.save(filename);
    return true;
  } catch (err) {
    console.error('Falha ao gerar e salvar Pedido de Material Didático:', err);
    throw err;
  }
}

/**
 * Gera Blob URL do Pedido de Material Didático para pré-visualização no navegador
 */
export function getMaterialOrderPDFBlobUrl(enrollment = {}, signatureData = {}, docOptions = {}) {
  const doc = buildMaterialOrderPDFDoc(enrollment, signatureData, docOptions);
  const data = { ...enrollment, ...signatureData };
  const studentName = data.studentName || 'Estudante';
  const pdfTitle = `Pedido de Material Didático • ${studentName}`;

  const blob = doc.output('blob');
  try {
    const namedFile = new File([blob], `${pdfTitle}.pdf`, { type: 'application/pdf' });
    return URL.createObjectURL(namedFile);
  } catch (e) {
    return URL.createObjectURL(blob);
  }
}

/**
 * Abre a pré-visualização do Pedido de Material Didático diretamente no navegador
 */
export function previewMaterialOrderPDF(enrollment = {}, signatureData = {}, docOptions = {}) {
  const blobUrl = getMaterialOrderPDFBlobUrl(enrollment, signatureData, docOptions);
  window.open(blobUrl, '_blank');
  return blobUrl;
}

/**
 * Baixa ambos os contratos (Requerimento de Matrícula + Pedido de Material Didático)
 */
export function downloadAllContractsPDF(enrollment = {}, signatureData = {}, docOptions = {}) {
  try {
    downloadSignedContractPDF(enrollment, signatureData, docOptions);
    setTimeout(() => {
      downloadMaterialOrderPDF(enrollment, signatureData, docOptions);
    }, 400);
    return true;
  } catch (err) {
    console.error('Falha ao baixar todos os contratos:', err);
    throw err;
  }
}

/**
 * Gera e baixa o Boletim Escolar Oficial do Colégio Rodin em PDF
 */
export function generateStudentReportCardPDF(student, grades) {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
  });

  const rm = student.rmNumber || student.cocCode || '2560';

  // Topo Estilizado
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 25, 'F');
  doc.setFillColor(244, 82, 6);
  doc.rect(0, 25, 210, 2.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('COLÉGIO RODIN — BOLETIM ESCOLAR OFICIAL', 14, 13);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('SECRETARIA ESCOLAR • RENDIMENTO E FREQUÊNCIA ACADÊMICA — ANO LETIVO 2027', 14, 19);

  // Dados do Aluno
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 34, 182, 26, 3, 3, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`ALUNO(A): ${student.name || student.studentName}`, 18, 41);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`RM: ${rm} | Série/Turma: ${student.currentGrade} | Frequência Global: ${student.attendanceRate || '98%'}`, 18, 48);
  doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} | Regime: Bimestral`, 18, 54);

  // Tabela de Disciplinas e Médias
  doc.setFillColor(244, 82, 6);
  doc.rect(14, 66, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DISCIPLINA', 18, 71.5);
  doc.text('1º BIM', 85, 71.5);
  doc.text('2º BIM', 105, 71.5);
  doc.text('3º BIM', 125, 71.5);
  doc.text('4º BIM', 145, 71.5);
  doc.text('MÉDIA', 165, 71.5);
  doc.text('SITUAÇÃO', 180, 71.5);

  const defaultGrades = grades || [
    { subject: 'Língua Portuguesa e Literatura', b1: 9.0, b2: 8.5, b3: 9.5, b4: 8.8, avg: 8.95, status: 'Aprovado' },
    { subject: 'Matemática e Raciocínio Lógico', b1: 8.5, b2: 9.0, b3: 8.0, b4: 9.2, avg: 8.67, status: 'Aprovado' },
    { subject: 'Física e Mecânica Clássica', b1: 8.0, b2: 7.5, b3: 8.5, b4: 8.0, avg: 8.00, status: 'Aprovado' },
    { subject: 'Química Geral e Orgânica', b1: 9.2, b2: 8.8, b3: 9.0, b4: 9.4, avg: 9.10, status: 'Aprovado' },
    { subject: 'Biologia e Meio Ambiente', b1: 9.5, b2: 9.0, b3: 9.5, b4: 9.8, avg: 9.45, status: 'Aprovado' },
    { subject: 'História Geral e do Brasil', b1: 9.0, b2: 9.2, b3: 8.8, b4: 9.0, avg: 9.00, status: 'Aprovado' },
    { subject: 'Geografia e Geopolítica', b1: 8.5, b2: 9.0, b3: 9.2, b4: 8.5, avg: 8.80, status: 'Aprovado' },
    { subject: 'Língua Inglesa (Bilinguismo)', b1: 9.8, b2: 9.5, b3: 10.0, b4: 9.8, avg: 9.77, status: 'Aprovado' },
    { subject: 'Robótica e Inteligência Artificial', b1: 10.0, b2: 9.8, b3: 9.5, b4: 10.0, avg: 9.82, status: 'Aprovado' }
  ];

  let y = 80;
  defaultGrades.forEach((g, i) => {
    doc.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
    doc.rect(14, y - 5, 182, 7, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(g.subject, 18, y);
    doc.text(g.b1.toFixed(1), 87, y);
    doc.text(g.b2.toFixed(1), 107, y);
    doc.text(g.b3.toFixed(1), 127, y);
    doc.text(g.b4.toFixed(1), 147, y);
    doc.setFont('helvetica', 'bold');
    doc.text(g.avg.toFixed(2), 166, y);
    doc.setTextColor(5, 150, 105);
    doc.text(g.status, 180, y);
    y += 7.5;
  });

  // Rodapé do Boletim
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 275, 196, 275);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Colégio Rodin — Balder Educacional LTDA • Rua Padre Anchieta, 484 - Indaiatuba/SP', 14, 280);
  doc.text('Autenticidade verificável via portal interno', 196, 280, { align: 'right' });

  doc.save(`Boletim_Escolar_RM_${rm}_${(student.name || student.studentName || 'Aluno').replace(/\s+/g, '_')}_2027.pdf`);
}
