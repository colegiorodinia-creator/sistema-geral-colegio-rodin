// Lista oficial das 27 Unidades Federativas (UFs) do Brasil
export const BRAZILIAN_UFS = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' }
];

// Base de Cidades por UF (Priorizada para as regiões do Colégio Rodin e abrangendo todo o Brasil)
export const CITIES_BY_UF = {
  SP: [
    'Indaiatuba', 'Campinas', 'São Paulo', 'Salto', 'Itu', 'Jundiaí', 'Sorocaba', 'Piracicaba', 'Santos', 'São José dos Campos',
    'Ribeirão Preto', 'Valinhos', 'Vinhedo', 'Sumaré', 'Americana', 'Hortolândia', 'Paulínia', 'Monte Mor', 'Elias Fausto',
    'Capivari', 'Araraquara', 'Bauru', 'Barueri', 'Osasco', 'Guarulhos', 'Santo André', 'São Bernardo do Campo', 'São Caetano do Sul',
    'Atibaia', 'Bragança Paulista', 'Franca', 'Marília', 'Presidente Prudente', 'São Carlos', 'Taubaté', 'Botucatu', 'Limeira', 'Rio Claro'
  ],
  RJ: [
    'Rio de Janeiro', 'Niterói', 'Petrópolis', 'Volta Redonda', 'Campos dos Goytacazes', 'Duque de Caxias', 'Nova Iguaçu',
    'Macaé', 'Cabo Frio', 'Teresópolis', 'Angra dos Reis', 'Resende', 'Barra Mansa', 'Nova Friburgo', 'Armação dos Búzios', 'Maricá'
  ],
  MG: [
    'Belo Horizonte', 'Uberlândia', 'Juiz de Fora', 'Montes Claros', 'Uberaba', 'Contagem', 'Betim', 'Poços de Caldas',
    'Pouso Alegre', 'Varginha', 'Governador Valadares', 'Ipatinga', 'Sete Lagoas', 'Divinópolis', 'Patos de Minas', 'Passos', 'Lavras'
  ],
  PR: [
    'Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'Foz do Iguaçu', 'São José dos Pinhais', 'Guarapuava',
    'Paranaguá', 'Toledo', 'Apucarana', 'Campo Mourão', 'Umuarama', 'Pato Branco', 'Francisco Beltrão'
  ],
  SC: [
    'Florianópolis', 'Joinville', 'Blumenau', 'Balneário Camboriú', 'Chapecó', 'Criciúma', 'Itajaí', 'Jaraguá do Sul',
    'Lages', 'Palhoça', 'São José', 'Brusque', 'Tubaraão', 'São Bento do Sul'
  ],
  RS: [
    'Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria', 'Gravataí', 'Viamão', 'Novo Hamburgo',
    'São Leopoldo', 'Rio Grande', 'Passo Fundo', 'Bento Gonçalves', 'Erechim', 'Uruguaiana', 'Santa Cruz do Sul'
  ],
  BA: [
    'Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro', 'Itabuna', 'Ilhéus', 'Lauro de Freitas',
    'Porto Seguro', 'Barreiras', 'Jequié', 'Alagoinhas', 'Teixeira de Freitas', 'Eunápolis', 'Santo Antônio de Jesus'
  ],
  PE: [
    'Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina', 'Paulista', 'Cabo de Santo Agostinho',
    'Garanhuns', 'Victoria de Santo Antão', 'Igarassu', 'Abreu e Lima', 'São Lourenço da Mata', 'Ipojuca'
  ],
  CE: [
    'Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral', 'Crato', 'Itapipoca', 'Maranguape',
    'Iguatu', 'Quixadá', 'Eusébio', 'Aquiraz', 'Canindé', 'Crateús'
  ],
  GO: [
    'Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia', 'Águas Lindas de Goiás', 'Valparaíso de Goiás',
    'Trindade', 'Formosa', 'Itumbiara', 'Jataí', 'Senador Canedo', 'Catalão', 'Caldas Novas'
  ],
  DF: [
    'Brasília', 'Ceilândia', 'Taguatinga', 'Samambaia', 'Plano Piloto', 'Águas Claras', 'Gama', 'Santa Maria',
    'Guará', 'Sobradinho', 'Recanto das Emas', 'Vicente Pires', 'Planaltina'
  ],
  ES: [
    'Vitória', 'Vila Velha', 'Serra', 'Cariacica', 'Cachoeiro de Itapemirim', 'Linhares', 'São Mateus', 'Colatina',
    'Guarapari', 'Aracruz', 'Viana', 'Nova Venécia'
  ],
  MS: [
    'Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã', 'Sidrolândia', 'Naviraí', 'Nova Andradina', 'Aquidauana'
  ],
  MT: [
    'Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra', 'Sorriso', 'Lucas do Rio Verde', 'Primavera do Leste', 'Barra do Garças'
  ],
  PA: [
    'Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Parauapebas', 'Castanhal', 'Abaetetuba', 'Cametá', 'Marituba', 'São Félix do Xingu'
  ],
  MA: [
    'São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias', 'Codó', 'Paço do Lumiar', 'Açailândia', 'Bacabal'
  ],
  PB: [
    'João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux', 'Sousa', 'Cajazeiras', 'Cabedelo', 'Guarabira'
  ],
  RN: [
    'Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba', 'Ceará-Mirim', 'Caicó', 'Assú', 'Currais Novos'
  ],
  AL: [
    'Maceió', 'Arapiraca', 'Rio Largo', 'Palmeira dos Índios', 'União dos Palmares', 'Penedo', 'São Miguel dos Campos'
  ],
  SE: [
    'Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'São Cristóvão', 'Estância', 'Tobias Barreto'
  ],
  PI: [
    'Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano', 'Campo Maior', 'Barras', 'União'
  ],
  AM: [
    'Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Coari', 'Tabatinga', 'Maués', 'Tefé'
  ],
  AP: [
    'Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque', 'Porto Grande', 'Mazagão'
  ],
  AC: [
    'Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá', 'Feijó', 'Brasiléia'
  ],
  RO: [
    'Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal', 'Rolim de Moura', 'Jaru'
  ],
  RR: [
    'Boa Vista', 'Rorainópolis', 'Caracaraí', 'Pacaraima', 'Cantá', 'Mucajaí'
  ],
  TO: [
    'Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins', 'Araguatins', 'Colinas do Tocantins'
  ]
};

/**
 * Retorna as cidades cadastradas de uma UF. Caso a cidade da busca não esteja na lista,
 * inclui a cidade dinamicamente para não perder nenhum dado digitado.
 */
/**
 * Remove sufixos de UF repetidos ou isolados, garantindo que o campo contenha apenas o nome limpo da cidade.
 * Ex: "São Bernardo do Campo - SP - SP - SP - SP" -> "São Bernardo do Campo"
 * Ex: "São Bernardo do Campo - SP" -> "São Bernardo do Campo"
 */
export function cleanCityName(rawCity) {
  if (!rawCity || typeof rawCity !== 'string') return '';
  let cleaned = rawCity.trim();
  while (true) {
    const match = cleaned.match(/\s*[-/]\s*([A-Za-z]{2})\s*$/);
    if (match && BRAZILIAN_UFS.some(u => u.uf.toUpperCase() === match[1].toUpperCase())) {
      cleaned = cleaned.slice(0, match.index).trim();
    } else {
      break;
    }
  }
  return cleaned;
}

/**
 * Retorna lista de cidades cadastradas de uma UF. Caso a cidade da busca não esteja na lista,
 * inclui a cidade dinamicamente com nome limpo (sem repetições ou sufixos de UF).
 */
export function getCitiesByUF(uf, customCity = '') {
  if (!uf) return ['Indaiatuba'];
  const cities = CITIES_BY_UF[uf.toUpperCase()] || ['Capital / Centro'];
  const cleanedCustomCity = cleanCityName(customCity);
  if (cleanedCustomCity && !cities.includes(cleanedCustomCity)) {
    return [cleanedCustomCity, ...cities];
  }
  return cities;
}

/**
 * Separa uma string no formato "Cidade - UF" ou "Cidade/UF" em objeto { city, state },
 * garantindo que 'city' contenha única e exclusivamente o nome da cidade limpo.
 */
export function parseCityStateString(locationStr) {
  if (!locationStr) return { city: 'Indaiatuba', state: 'SP' };

  let state = 'SP';
  const raw = String(locationStr).trim();

  // Encontra a última ocorrência de UF brasileira válida na string
  const matches = [...raw.matchAll(/[-/]\s*([A-Za-z]{2})\b/g)];
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    const candidate = lastMatch[1].toUpperCase();
    if (BRAZILIAN_UFS.some(u => u.uf === candidate)) {
      state = candidate;
    }
  }

  const city = cleanCityName(raw) || 'Indaiatuba';
  return { city, state };
}
