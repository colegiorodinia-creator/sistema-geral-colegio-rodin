const fs = require('fs');
const { jsPDF } = require('jspdf');

const doc = new jsPDF({ unit: 'mm', format: 'a4' });
const academicYear = 2027;
const rm = '2309';

const logoFullBlack = 'data:image/png;base64,' + fs.readFileSync('./src/assets/logo/logo-full-black-transparent.png').toString('base64');
const signatureCanela = 'data:image/png;base64,' + fs.readFileSync('./src/assets/signatures/assinatura - canela.png').toString('base64');
const signatureElisangela = 'data:image/png;base64,' + fs.readFileSync('./src/assets/signatures/assinatura - elisangela.png').toString('base64');
const signatureKelly = 'data:image/png;base64,' + fs.readFileSync('./src/assets/signatures/assinatura - kelly.png').toString('base64');

// Logo
doc.addImage(logoFullBlack, 'PNG', 10.1, 9.4, 38, 14.6);

// Title & Subtitle - ALIGNED TO THE RIGHT AT 200.1 (matching original_page_1.png!)
doc.setFont('helvetica', 'bold');
doc.setFontSize(13.8);
doc.setTextColor(0, 0, 0);
doc.text('REQUERIMENTO DE MATRÍCULA - EDUCAÇÃO BÁSICA ' + academicYear, 200.1, 14.8, { align: 'right' });

doc.setFont('helvetica', 'normal');
doc.setFontSize(10.2);
doc.text('Termo de Adesão ao Instrumento de Adesão às Atividades Educacionais', 200.1, 20.2, { align: 'right' });

// RM Box
doc.setDrawColor(0, 0, 0);
doc.setLineWidth(0.35);
doc.rect(167.8, 22.5, 32.3, 4.8);
doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.text('nº:', 169.5, 26.0);
doc.setFont('helvetica', 'bold');
doc.setFontSize(9.0);
doc.text(String(rm), 176.0, 26.0);

// Line under header
doc.setLineWidth(0.7);
doc.line(10.1, 30.3, 200.1, 30.3);

// Ao diretor da escola
doc.setFont('helvetica', 'bold');
doc.setFontSize(9.5);
doc.text('Ao diretor da escola,', 10.1, 37.5);

fs.writeFileSync('./test_header.pdf', Buffer.from(doc.output('arraybuffer')));
console.log('test_header.pdf created!');
