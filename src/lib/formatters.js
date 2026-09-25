/**
 * Utilitários de Validação e Formatação Padronizada do Colégio Rodin
 * Garante higienização, mascaramento e padronização no banco de dados.
 */

/**
 * Validação Oficial do Algoritmo de CPF (Dígitos Verificadores)
 * @param {string} cpf 
 * @returns {boolean}
 */
export function isValidCPF(cpf) {
  if (!cpf) return false;
  const clean = String(cpf).replace(/\D/g, '');
  
  if (clean.length !== 11) return false;
  // Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // Validação do 1º Dígito Verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;

  // Validação do 2º Dígito Verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10), 10)) return false;

  return true;
}

/**
 * Máscara Dinâmica de CPF (000.000.000-00)
 */
export function maskCPF(value) {
  if (!value) return '';
  const clean = String(value).replace(/\D/g, '').slice(0, 11);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

/**
 * Máscara Dinâmica de RG (00.000.000-0 ou 00.000.000-X)
 */
export function maskRG(value) {
  if (!value) return '';
  let clean = String(value).toUpperCase().replace(/[^0-9X]/g, '').slice(0, 9);
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
  if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}-${clean.slice(8, 9)}`;
}

/**
 * Máscara Dinâmica de Telefone / WhatsApp ((00) 00000-0000 ou (00) 0000-0000)
 */
export function maskPhone(value) {
  if (!value) return '';
  const clean = String(value).replace(/\D/g, '').slice(0, 11);
  if (clean.length <= 2) return clean ? `(${clean}` : '';
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
}

/**
 * Máscara Dinâmica de CEP (00000-000)
 */
export function maskCEP(value) {
  if (!value) return '';
  const clean = String(value).replace(/\D/g, '').slice(0, 8);
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
}

/**
 * Padronização de Nomes Próprios em Title Case respeitando preposições
 */
export function formatName(name) {
  if (!name) return '';
  const lowercasePrepositions = ['de', 'da', 'do', 'dos', 'das', 'e', 'del', 'la'];
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index !== 0 && lowercasePrepositions.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Padronização de Órgão Expedidor (ex: SSP/SP)
 */
export function formatIssuer(issuer) {
  if (!issuer) return 'SSP/SP';
  const clean = issuer.trim().toUpperCase();
  if (clean.includes('/')) return clean;
  if (clean.endsWith('SP') || clean.endsWith('RJ') || clean.endsWith('MG') || clean.endsWith('PR')) {
    const uf = clean.slice(-2);
    const org = clean.slice(0, -2);
    return `${org || 'SSP'}/${uf}`;
  }
  return `${clean}/SP`;
}

/**
 * Remove acentos e diacríticos e converte para minúsculas para buscas insensíveis a acentuação
 * @param {string} text
 * @returns {string}
 */
export function removeAccents(text) {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

