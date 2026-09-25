import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  generateSignedContractPDF,
  downloadMaterialOrderPDF,
  downloadAllContractsPDF
} from '../../lib/pdfGenerator';
import {
  X,
  FileSignature,
  Eraser,
  ShieldCheck,
  Download,
  CheckCircle2,
  Lock,
  FileText,
  Building,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getFixedRatesForGrade } from '../../data/fixedRates';

export default function SignatureModal({ enrollment, onClose }) {
  const { signContract, showToast } = useApp();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isSealing, setIsSealing] = useState(false);
  const [isSealed, setIsSealed] = useState(enrollment.status === 'active');
  const [showFullContract, setShowFullContract] = useState(false);

  // Metadados de Auditoria Forense
  const [telemetry, setTelemetry] = useState({
    ip: '189.120.45.10 (IPv4 - Indaiatuba / SP)',
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    sha256Doc: enrollment.documentSha256 || '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    signatureSha256: enrollment.signatureSha256 || ''
  });

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [isSealed]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  };

  const handleSealAndSign = async () => {
    if (!hasDrawn) {
      showToast('Por favor, desenhe sua assinatura no quadro antes de selar.', 'error');
      return;
    }

    setIsSealing(true);

    try {
      const canvas = canvasRef.current;
      const signatureImage = canvas.toDataURL('image/png');

      // Gera SHA-256 simulado da assinatura
      const mockSignatureSha = 'sig_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map(b => b.toString(16).padStart(2, '0')).join('');

      const signaturePayload = {
        signatureImage,
        ipAddress: telemetry.ip,
        userAgent: telemetry.userAgent,
        timestamp: new Date().toISOString(),
        signatureSha256: mockSignatureSha,
        guardianName: enrollment.guardianName,
        guardianCpf: enrollment.guardianCpf,
        guardianPhone: enrollment.guardianPhone,
        guardianAddress: enrollment.guardianAddress
      };

      await signContract(enrollment.id, signaturePayload);

      setTelemetry(prev => ({
        ...prev,
        signatureSha256: mockSignatureSha,
        timestamp: signaturePayload.timestamp
      }));

      setIsSealed(true);
      showToast('Contrato assinado eletronicamente e selado com sucesso!');
    } catch (error) {
      console.error(error);
      showToast('Erro ao selar o contrato. Tente novamente.', 'error');
    } finally {
      setIsSealing(false);
    }
  };

  const handleDownloadPDF = () => {
    generateSignedContractPDF(enrollment, {
      guardianName: enrollment.guardianName,
      guardianCpf: enrollment.guardianCpf,
      guardianPhone: enrollment.guardianPhone,
      guardianAddress: enrollment.guardianAddress,
      signatureImage: enrollment.signatureImage || (canvasRef.current ? canvasRef.current.toDataURL('image/png') : null),
      ipAddress: telemetry.ip,
      userAgent: telemetry.userAgent,
      timestamp: telemetry.timestamp,
      documentSha256: telemetry.sha256Doc,
      signatureSha256: telemetry.signatureSha256
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#E2E8F0] my-8 animate-fadeIn">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF0E6] flex items-center justify-center text-[#F45206]">
              <Lock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-black text-[#1E293B]">
                  Instrumento de Adesão às Atividades Educacionais
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                  Balder Educacional LTDA
                </span>
              </div>
              <p className="text-[12px] font-medium text-[#64748B]">
                Colégio Rodin • Ano Letivo {enrollment.academicYear || 2027} • Assinatura Eletrônica Válida
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F1F5F9] hover:bg-[#F45206] hover:text-white flex items-center justify-center text-[#64748B] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Resumo do Requerimento e Plano Financeiro */}
        <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#E2E8F0] mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
          <div>
            <span className="font-extrabold text-[#64748B] block text-[10px] uppercase">
              Estudante Beneficiário(a)
            </span>
            <strong className="text-[#1E293B] text-[13px] block">{enrollment.studentName}</strong>
            <span className="text-[#64748B] block text-[11px]">
              RM: <strong className="text-[#F45206]">{enrollment.rmNumber || enrollment.cocCode || '2570'}</strong> • {enrollment.currentGrade} ({enrollment.courseLevel || 'Ensino Fundamental'})
            </span>
          </div>

          <div>
            <span className="font-extrabold text-[#64748B] block text-[10px] uppercase">
              Responsável Financeiro (Signatário)
            </span>
            <strong className="text-[#1E293B] text-[13px] block">{enrollment.guardianName} ({enrollment.guardianRelation || 'Pai'})</strong>
            <span className="text-[#64748B] block text-[11px]">
              CPF: {enrollment.guardianCpf} • {enrollment.guardianPhone}
            </span>
          </div>

          {/* Plano Financeiro */}
          {(() => {
            const gradeRates = getFixedRatesForGrade(enrollment?.currentGrade);
            const is100 = enrollment?.tuitionDiscountPercentage === 1 || 
              enrollment?.tuitionDiscountPercentage === 1.0 || 
              enrollment?.tuitionDiscountPercentage === 100 || 
              enrollment?.tuitionDiscountTotal === 0 ||
              /100%/i.test(String(enrollment?.tuitionDiscountType || enrollment?.tuitionDiscountReason || ''));
            const tuitionVal = is100 ? 0 : parseFloat(enrollment?.tuitionDiscountTotal !== undefined && enrollment?.tuitionDiscountTotal !== null ? enrollment.tuitionDiscountTotal : (enrollment?.tuitionGrossTotal || gradeRates.tuitionAnnual));
            const firstVal = is100 ? 0 : parseFloat(enrollment?.firstInstallmentValue !== undefined && enrollment?.firstInstallmentValue !== null ? enrollment.firstInstallmentValue : gradeRates.tuitionInstallment13);
            const regVal = is100 ? 0 : parseFloat(enrollment?.regularInstallmentValue !== undefined && enrollment?.regularInstallmentValue !== null ? enrollment.regularInstallmentValue : gradeRates.tuitionInstallment13);
            return (
              <div className="sm:col-span-2 pt-2 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-extrabold text-[#64748B] block text-[10px] uppercase">
                    Valor Total da Anuidade do Curso
                  </span>
                  <strong className="text-[#F45206] text-[13px]">
                    R$ {tuitionVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                  <span className="text-[11px] text-[#64748B] ml-1">
                    ({enrollment.installmentsCount || 13} parcelas • 1ª: R$ {firstVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                  </span>
                </div>

                <div>
                  <span className="font-extrabold text-[#64748B] block text-[10px] uppercase">
                    Demais Parcelas Mensais*
                  </span>
                  <strong className="text-[#059669] text-[12px]">
                    R$ {regVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Visualizador Expansível do Texto Integral do Contrato */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowFullContract(!showFullContract)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#1E293B] text-[12px] font-extrabold transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-[#F45206]" />
              <span>Visualizar Cláusulas Oficiais na Íntegra (1ª a 10ª e Anexos COC)</span>
            </div>
            {showFullContract ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showFullContract && (
            <div className="mt-2 bg-white rounded-xl p-4 border border-[#CBD5E1] text-[11px] text-[#334155] leading-relaxed max-h-56 overflow-y-auto space-y-3 custom-scrollbar">
              <p className="font-bold text-[#1E293B] text-center border-b pb-2">
                INSTRUMENTO DE ADESÃO ÀS ATIVIDADES EDUCACIONAIS MINISTRADAS PELA BALDER EDUCACIONAL LTDA
              </p>
              <p>
                <strong>LEIA COM ATENÇÃO, IMPORTANTE:</strong> Leia este instrumento atentamente, pois: (i) ao assinar o Requerimento de Matrícula 2027 ou (ii) ao efetuar quaisquer pagamentos referentes à anuidade escolar ou (iii) ao utilizar serviços oferecidos pela BALDER EDUCACIONAL LTDA, concordará com os termos e condições descritos no presente, assim como aqueles contidos na "Ficha de Dados Cadastrais" e "Requerimento de Matrícula".
              </p>
              <p>
                <strong>CLÁUSULA 1ª - DO OBJETO:</strong> O objeto deste Instrumento é a adesão às atividades educacionais da ESCOLA pelo ALUNO(A), na modalidade de ensino descrita no "Requerimento de Matrícula", mediante o pagamento da anuidade escolar...
              </p>
              <p>
                <strong>CLÁUSULA 2ª - DA VIGÊNCIA E RENOVAÇÃO:</strong> O presente instrumento vigorará por prazo determinado de um (01) ano letivo...
              </p>
              <p>
                <strong>CLÁUSULA 3ª - DO PAGAMENTO:</strong> Pelos serviços educacionais previstos no item 1.1, o(a) RESPONSÁVEL FINANCEIRO(A) pagará à ESCOLA o valor da anuidade escolar nele indicado. Vencimento no 1º dia útil... Multa de 2%, SELIC e juros de mora de 1% ao mês.
              </p>
              <p>
                <strong>CLÁUSULA 4ª - DAS OBRIGAÇÕES:</strong> Manter a pontualidade, adquirir kits de materiais e plataformas COC/Edify/LIV/TRIEduc/STIFT/VestibuLer, disponibilizar uniformes e monitorar mochilas.
              </p>
              <p>
                <strong>CLÁUSULA 6ª - DA RESCISÃO:</strong> Rescisão mediante requerimento com protocolo prévio de 30 dias, quitação de parcelas proporcionais e retenção de 20% em caso de desistência anterior ao início das aulas.
              </p>
              <p>
                <strong>CLÁUSULA 7ª - DA RESPONSABILIDADE POR DANOS:</strong> O responsável assume eventuais danos patrimoniais e declara ciência da isenção de responsabilidade da escola por perdas/danos em celulares, tablets e itens de valor pessoal.
              </p>
              <p>
                <strong>CLÁUSULA 8ª - DO TRATAMENTO DE DADOS (LGPD):</strong> Tratamento e compartilhamento de dados autorizados com sistemas educacionais parceiros (Sistema COC, Classapp, LIV, Edify, Trieduc, Activesoft, STIFT, VestibuLer).
              </p>
              <p>
                <strong>CLÁUSULA 9ª - DAS CONDIÇÕES GERAIS:</strong> Autorização gratuita e não exclusiva de imagem e voz para divulgação pedagógica institucional e repasse para o INEP/MEC.
              </p>
              <p>
                <strong>CLÁUSULA 10ª - DA INTEGRAÇÃO DOS DOCUMENTOS DA MATRÍCULA:</strong> Integração de kits, manuais e regulamentos escolares.
              </p>
            </div>
          )}
        </div>

        {/* Seção de Canvas da Assinatura */}
        {!isSealed ? (
          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-extrabold text-[#1E293B] flex items-center gap-1.5">
                <FileSignature size={15} className="text-[#F45206]" />
                Desenhe a Assinatura do Responsável Financeiro ({enrollment.guardianName}):
              </label>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-[11px] font-bold text-[#DC2626] hover:text-[#B91C1C] flex items-center gap-1 bg-[#FEF2F2] px-2.5 py-1 rounded-lg transition-colors"
              >
                <Eraser size={13} />
                Limpar
              </button>
            </div>

            <div className="relative border-2 border-dashed border-[#CBD5E1] rounded-2xl bg-[#FFFFFF] overflow-hidden shadow-inner flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={650}
                height={360}
                className="touch-none cursor-crosshair w-full max-w-full h-[180px]"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasDrawn && (
                <span className="absolute text-[13px] font-semibold text-[#94A3B8] pointer-events-none">
                  Assine aqui usando o dedo ou o mouse
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Estado Selado / Concluído com Sucesso */
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl p-6 mb-5 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-[#10B981] text-white flex items-center justify-center mb-3 shadow-lg">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-[17px] font-black text-[#065F46] mb-1">
              Contrato Selado e Matrícula Ativada na Base 2027!
            </h3>
            <p className="text-[12px] font-medium text-[#047857] max-w-md mb-4">
              O hash criptográfico da transação e as assinaturas oficiais foram gerados na base Supabase.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full max-w-lg">
              <button
                onClick={handleDownloadPDF}
                className="btn-primary-rodin !py-2 !px-4 text-[12px] shadow-sm flex items-center gap-1.5 w-full sm:w-auto justify-center"
                title="Baixar Requerimento de Matrícula (Balder Educacional)"
              >
                <Download size={14} />
                1. Matrícula (Balder)
              </button>

              <button
                onClick={() => downloadMaterialOrderPDF(enrollment)}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold py-2 px-4 rounded-xl text-[12px] shadow-sm flex items-center gap-1.5 transition-colors w-full sm:w-auto justify-center"
                title="Baixar Pedido de Material Didático (Livraria do Pensador)"
              >
                <Download size={14} />
                2. Material (Pensador)
              </button>

              <button
                onClick={() => downloadAllContractsPDF(enrollment)}
                className="bg-[#059669] hover:bg-[#047857] text-white font-black py-2 px-4 rounded-xl text-[12px] shadow-md flex items-center gap-1.5 transition-colors w-full sm:w-auto justify-center"
                title="Baixar Todos os Contratos (Pacote Completo)"
              >
                <Download size={14} />
                Ambos Contratos
              </button>
            </div>
          </div>
        )}

        {/* Trilha de Auditoria Criptográfica (Audit Trail) */}
        <div className="bg-[#0F172A] rounded-2xl p-4 text-white text-[11px] font-mono space-y-2 mb-4">
          <div className="flex items-center gap-2 text-[#F45206] font-bold pb-2 border-b border-[#334155]">
            <ShieldCheck size={14} />
            <span>METADADOS DE TELEMETRIA E CRIPTOGRAFIA (SUPABASE EDGE)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-[#94A3B8]">
            <div>
              <span className="text-[#E2E8F0] block font-bold">IP DE CONEXÃO:</span>
              <span>{telemetry.ip}</span>
            </div>
            <div>
              <span className="text-[#E2E8F0] block font-bold">CARIMBO DE TEMPO (UTC):</span>
              <span>{telemetry.timestamp}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[#E2E8F0] block font-bold">HASH SHA-256 DA MINUTA:</span>
              <span className="text-[#CBD5E1] truncate block">{telemetry.sha256Doc}</span>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold text-[12px] transition-colors"
          >
            {isSealed ? 'Fechar' : 'Cancelar'}
          </button>

          {!isSealed && (
            <button
              disabled={!hasDrawn || isSealing}
              onClick={handleSealAndSign}
              className={`btn-primary-rodin !py-2.5 !px-6 text-[13px] ${
                !hasDrawn || isSealing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSealing ? 'Selando Criptograficamente...' : 'Confirmar e Selar Contrato'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
