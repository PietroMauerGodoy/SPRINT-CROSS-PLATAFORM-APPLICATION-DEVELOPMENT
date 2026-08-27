import { Equipe, KanbanItem, Ocorrencia, Usuario } from '../types';

export const mockUsuarios: Usuario[] = [
  {
    id: 1,
    nome: 'Admin Motiva',
    usuario: 'admin',
    senha: '123456',
    cargo: 'Administrador',
  },
  {
    id: 2,
    nome: 'João Silva',
    usuario: 'joao',
    senha: '123456',
    cargo: 'Analista de Segurança',
  },
];

export const mockEquipes: Equipe[] = [
  { id: '#01', nome: 'Equipe Alfa',     status: 'ativo',    rodovia: 'BR-116', km: 'Km 50', trechoRodovia: 'Rodoanel Oeste',    responsavel: 'Eng. Pedro'    },
  { id: '#02', nome: 'Equipe Beta',     status: 'ativo',    rodovia: 'BR-116', km: 'Km 62', trechoRodovia: 'Rodoanel Norte',    responsavel: 'Eng. Pietro'   },
  { id: '#03', nome: 'Equipe Gama',     status: 'inativo',  rodovia: 'BR-116', km: 'Km 74', trechoRodovia: 'Rodoanel Leste',    responsavel: 'Eng. Lucas'    },
  { id: '#04', nome: 'Equipe Girassol', status: 'ativo',    rodovia: 'BR-116', km: 'Km 38', trechoRodovia: 'Rodoanel Sudeste',  responsavel: 'Eng. Fernando' },
  { id: '#05', nome: 'Equipe Vermelha', status: 'ativo',    rodovia: 'BR-116', km: 'Km 45', trechoRodovia: 'Rodoanel Nordeste', responsavel: 'Eng. Samir'    },
  { id: '#06', nome: 'Equipe Amarela',  status: 'em_campo', rodovia: 'BR-116', km: 'Km 55', trechoRodovia: 'Rodoanel Centro',   responsavel: 'Eng. Ryan'     },
  { id: '#07', nome: 'Equipe Azul',     status: 'ativo',    rodovia: 'BR-116', km: 'Km 30', trechoRodovia: 'Rodoanel Sul',      responsavel: 'Eng. Patrick'  },
  { id: '#08', nome: 'Equipe Delta',    status: 'inativo',  rodovia: 'SP-280', km: 'Km 20', trechoRodovia: 'Trecho Castelo',    responsavel: 'Eng. Marcos'   },
  { id: '#09', nome: 'Equipe Omega',    status: 'em_campo', rodovia: 'SP-280', km: 'Km 35', trechoRodovia: 'Trecho Campinas',   responsavel: 'Eng. Clara'    },
  { id: '#10', nome: 'Equipe Sigma',    status: 'ativo',    rodovia: 'BR-381', km: 'Km 12', trechoRodovia: 'Contorno Norte',    responsavel: 'Eng. Diana'    },
];

export const mockKanban: KanbanItem[] = [
  { id: 'K01', equipeId: '#01', nomeEquipe: 'Equipe Alfa',     rodovia: 'BR-116', kmInicio: 0,  kmFim: 5,  tipoVegetacao: 'Grama Bermuda (Rasteira)', alturaAtual: 12, severidade: 'leve',           responsavel: 'Eng. Pedro',    observacao: '', ultimoServico: { data: '15/05/2026', responsavel: 'Eng. Fernando' } },
  { id: 'K02', equipeId: '#02', nomeEquipe: 'Equipe Beta',     rodovia: 'BR-116', kmInicio: 5,  kmFim: 10, tipoVegetacao: 'Capim Colonião',           alturaAtual: 20, severidade: 'grave',          responsavel: 'Eng. Pietro',   observacao: '', ultimoServico: null },
  { id: 'K03', equipeId: '#03', nomeEquipe: 'Equipe Gama',     rodovia: 'BR-116', kmInicio: 10, kmFim: 15, tipoVegetacao: 'Grama Bermuda (Rasteira)', alturaAtual: 7,  severidade: 'sem_ocorrencia', responsavel: 'Eng. Lucas',    observacao: '', ultimoServico: null },
  { id: 'K04', equipeId: '#04', nomeEquipe: 'Equipe Girassol', rodovia: 'BR-116', kmInicio: 15, kmFim: 20, tipoVegetacao: 'Grama Bermuda (Rasteira)', alturaAtual: 12, severidade: 'leve',           responsavel: 'Eng. Fernando', observacao: '', ultimoServico: null },
  { id: 'K05', equipeId: '#05', nomeEquipe: 'Equipe Vermelha', rodovia: 'BR-116', kmInicio: 20, kmFim: 25, tipoVegetacao: 'Capim Napiê',             alturaAtual: 22, severidade: 'grave',          responsavel: 'Eng. Samir',    observacao: '', ultimoServico: null },
  { id: 'K06', equipeId: '#06', nomeEquipe: 'Equipe Amarela',  rodovia: 'BR-116', kmInicio: 25, kmFim: 30, tipoVegetacao: 'Mata Ciliar Densa',       alturaAtual: 32, severidade: 'critico',        responsavel: 'Eng. Ryan',     observacao: '', ultimoServico: null },
  { id: 'K07', equipeId: '#07', nomeEquipe: 'Equipe Azul',     rodovia: 'BR-116', kmInicio: 30, kmFim: 35, tipoVegetacao: 'Grama São Carlos',        alturaAtual: 3,  severidade: 'sem_ocorrencia', responsavel: 'Eng. Patrick',  observacao: '', ultimoServico: null },
  { id: 'K08', equipeId: '#08', nomeEquipe: 'Equipe Delta',    rodovia: 'SP-280', kmInicio: 0,  kmFim: 8,  tipoVegetacao: 'Capim Colonião',           alturaAtual: 18, severidade: 'leve',           responsavel: 'Eng. Marcos',   observacao: '', ultimoServico: null },
  { id: 'K09', equipeId: '#09', nomeEquipe: 'Equipe Omega',    rodovia: 'SP-280', kmInicio: 8,  kmFim: 15, tipoVegetacao: 'Mata Ciliar Densa',       alturaAtual: 26, severidade: 'grave',          responsavel: 'Eng. Clara',    observacao: '', ultimoServico: null },
  { id: 'K10', equipeId: '#10', nomeEquipe: 'Equipe Sigma',    rodovia: 'BR-381', kmInicio: 0,  kmFim: 12, tipoVegetacao: 'Grama São Carlos',        alturaAtual: 4,  severidade: 'sem_ocorrencia', responsavel: 'Eng. Diana',    observacao: '', ultimoServico: null },
];

export const mockOcorrencias: Ocorrencia[] = [
  {
    id: 1,
    titulo: 'Vazamento de óleo na área B',
    descricao: 'Foi identificado um vazamento de óleo próximo às máquinas do setor B. O líquido está escorregando pelo chão e representa risco de queda.',
    local: 'Setor B - Linha de Produção',
    risco: 'alto',
    data: '2026-06-08',
    categoria: 'Segurança',
    status: 'aberta',
    responsavel: 'João Silva',
  },
  {
    id: 2,
    titulo: 'EPI fora do prazo de validade',
    descricao: 'Os capacetes do setor A estão com prazo de validade vencido. Necessária substituição imediata.',
    local: 'Setor A - Almoxarifado',
    risco: 'medio',
    data: '2026-06-07',
    categoria: 'EPI',
    status: 'em_andamento',
    responsavel: 'Maria Santos',
  },
  {
    id: 3,
    titulo: 'Iluminação inadequada no corredor 3',
    descricao: 'Lâmpadas queimadas no corredor 3 dificultam a visibilidade no período noturno.',
    local: 'Corredor 3 - Bloco C',
    risco: 'baixo',
    data: '2026-06-06',
    categoria: 'Infraestrutura',
    status: 'resolvida',
  },
  {
    id: 4,
    titulo: 'Equipamento sem manutenção preventiva',
    descricao: 'A prensa hidráulica P-04 não passou pela manutenção preventiva trimestral conforme cronograma.',
    local: 'Galpão Industrial - Maquinário',
    risco: 'alto',
    data: '2026-06-05',
    categoria: 'Manutenção',
    status: 'aberta',
    responsavel: 'Carlos Oliveira',
  },
  {
    id: 5,
    titulo: 'Sinalização de emergência apagada',
    descricao: 'Placa de saída de emergência sem energia no segundo andar. Necessária verificação do sistema elétrico.',
    local: '2º Andar - Ala Administrativa',
    risco: 'medio',
    data: '2026-06-04',
    categoria: 'Segurança',
    status: 'em_andamento',
  },
];
