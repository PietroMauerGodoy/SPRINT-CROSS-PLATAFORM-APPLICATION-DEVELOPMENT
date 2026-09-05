import { Equipe, KanbanItem, Ocorrencia, Usuario } from '../types';

export const mockUsuarios: Usuario[] = [
  {
    id: 1,
    nome: 'Admin Motiva',
    usuario: 'admin',
    email: 'admin@motiva.com',
    senha: '123456',
    cargo: 'Administrador',
    papel: 'admin',
  },
  {
    id: 2,
    nome: 'João Silva',
    usuario: 'joao',
    email: 'joao.silva@motiva.com',
    senha: '123456',
    cargo: 'Gestor de Operações',
    papel: 'gestor',
  },
  {
    id: 3,
    nome: 'Maria Santos',
    usuario: 'maria',
    email: 'maria.santos@motiva.com',
    senha: '123456',
    cargo: 'Operadora de Campo',
    papel: 'operador_campo',
    equipeId: '#01', // Equipe Alfa
  },
  {
    id: 4,
    nome: 'Carlos Oliveira',
    usuario: 'carlos',
    email: 'carlos.o@motiva.com',
    senha: '123456',
    cargo: 'Operador de Campo',
    papel: 'operador_campo',
    equipeId: '#02', // Equipe Beta
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
  { id: '#08', nome: 'Equipe Delta',    status: 'inativo',  rodovia: 'SP-330', km: 'Km 20', trechoRodovia: 'Trecho Anhanguera', responsavel: 'Eng. Marcos'   },
  { id: '#09', nome: 'Equipe Omega',    status: 'em_campo', rodovia: 'SP-330', km: 'Km 35', trechoRodovia: 'Trecho Campinas',   responsavel: 'Eng. Clara'    },
  { id: '#10', nome: 'Equipe Sigma',    status: 'ativo',    rodovia: 'BR-381', km: 'Km 12', trechoRodovia: 'Contorno Norte',    responsavel: 'Eng. Diana'    },
];

export const mockKanban: KanbanItem[] = [
  { id: 'K01', equipeId: '#01', nomeEquipe: 'Equipe Alfa',     rodovia: 'BR-116', kmInicio: 0,  kmFim: 5,  tipoVegetacao: 'Grama Bermuda (Rasteira)', alturaAtual: 12, severidade: 'leve',           responsavel: 'Eng. Pedro',    observacao: '', ultimoServico: { data: '15/05/2026', responsavel: 'Eng. Fernando' }, lat: -23.745921, lon: -46.900130 },
  { id: 'K02', equipeId: '#02', nomeEquipe: 'Equipe Beta',     rodovia: 'BR-116', kmInicio: 5,  kmFim: 10, tipoVegetacao: 'Capim Colonião',           alturaAtual: 20, severidade: 'grave',          responsavel: 'Eng. Pietro',   observacao: '', ultimoServico: null, lat: -23.790921, lon: -46.945130 },
  { id: 'K03', equipeId: '#03', nomeEquipe: 'Equipe Gama',     rodovia: 'BR-116', kmInicio: 10, kmFim: 15, tipoVegetacao: 'Grama Bermuda (Rasteira)', alturaAtual: 7,  severidade: 'sem_ocorrencia', responsavel: 'Eng. Lucas',    observacao: '', ultimoServico: null, lat: -23.835921, lon: -46.990130 },
  { id: 'K04', equipeId: '#04', nomeEquipe: 'Equipe Girassol', rodovia: 'BR-116', kmInicio: 15, kmFim: 20, tipoVegetacao: 'Grama Bermuda (Rasteira)', alturaAtual: 12, severidade: 'leve',           responsavel: 'Eng. Fernando', observacao: '', ultimoServico: null, lat: -23.880921, lon: -47.035130 },
  { id: 'K05', equipeId: '#05', nomeEquipe: 'Equipe Vermelha', rodovia: 'BR-116', kmInicio: 20, kmFim: 25, tipoVegetacao: 'Capim Napiê',             alturaAtual: 22, severidade: 'grave',          responsavel: 'Eng. Samir',    observacao: '', ultimoServico: null, lat: -23.925921, lon: -47.080130 },
  { id: 'K06', equipeId: '#06', nomeEquipe: 'Equipe Amarela',  rodovia: 'BR-116', kmInicio: 25, kmFim: 30, tipoVegetacao: 'Mata Ciliar Densa',       alturaAtual: 32, severidade: 'critico',        responsavel: 'Eng. Ryan',     observacao: '', ultimoServico: null, lat: -23.970921, lon: -47.125130 },
  { id: 'K07', equipeId: '#07', nomeEquipe: 'Equipe Azul',     rodovia: 'BR-116', kmInicio: 30, kmFim: 35, tipoVegetacao: 'Grama São Carlos',        alturaAtual: 3,  severidade: 'sem_ocorrencia', responsavel: 'Eng. Patrick',  observacao: '', ultimoServico: null, lat: -24.015921, lon: -47.170130 },
  { id: 'K08', equipeId: '#08', nomeEquipe: 'Equipe Delta',    rodovia: 'SP-330', kmInicio: 0,  kmFim: 8,  tipoVegetacao: 'Capim Colonião',           alturaAtual: 18, severidade: 'leve',           responsavel: 'Eng. Marcos',   observacao: '', ultimoServico: null, lat: -23.164865, lon: -46.929175 },
  { id: 'K09', equipeId: '#09', nomeEquipe: 'Equipe Omega',    rodovia: 'SP-330', kmInicio: 8,  kmFim: 15, tipoVegetacao: 'Mata Ciliar Densa',       alturaAtual: 26, severidade: 'grave',          responsavel: 'Eng. Clara',    observacao: '', ultimoServico: null, lat: -23.236865, lon: -47.001175 },
  { id: 'K10', equipeId: '#10', nomeEquipe: 'Equipe Sigma',    rodovia: 'BR-381', kmInicio: 0,  kmFim: 12, tipoVegetacao: 'Grama São Carlos',        alturaAtual: 4,  severidade: 'sem_ocorrencia', responsavel: 'Eng. Diana',    observacao: '', ultimoServico: null, lat: -23.496649, lon: -46.559693 },
];

export const mockOcorrencias: Ocorrencia[] = [
  {
    id: 1,
    titulo: 'Vegetação encobrindo placa de sinalização',
    descricao: 'Mata ciliar cresceu a ponto de encobrir parcialmente a placa de curva perigosa, reduzindo a visibilidade para o motorista.',
    kanbanItemId: 'K06',
    risco: 'alto',
    data: '2026-06-08',
    categoria: 'Sinalização',
    status: 'aberta',
    responsavel: 'João Silva',
  },
  {
    id: 2,
    titulo: 'Galho caído sobre o acostamento',
    descricao: 'Após temporal, um galho de grande porte caiu sobre o acostamento, ocupando parte da faixa de domínio.',
    kanbanItemId: 'K02',
    risco: 'medio',
    data: '2026-06-07',
    categoria: 'Obstrução',
    status: 'em_andamento',
    responsavel: 'Maria Santos',
  },
  {
    id: 3,
    titulo: 'Erosão na margem próxima à drenagem',
    descricao: 'Erosão progressiva na margem do trecho, próxima ao sistema de drenagem, sem vegetação suficiente para contenção do solo.',
    kanbanItemId: 'K09',
    risco: 'baixo',
    data: '2026-06-06',
    categoria: 'Infraestrutura',
    status: 'resolvida',
  },
  {
    id: 4,
    titulo: 'Trecho sem roçada há mais de 60 dias',
    descricao: 'Trecho não recebeu manutenção de roçada dentro do prazo padrão, vegetação já ultrapassa a faixa de segurança.',
    kanbanItemId: 'K05',
    risco: 'alto',
    data: '2026-06-05',
    categoria: 'Manutenção',
    status: 'aberta',
    responsavel: 'Carlos Oliveira',
  },
  {
    id: 5,
    titulo: 'Visibilidade reduzida em curva por capim alto',
    descricao: 'Capim alto na saída da curva reduz a visibilidade de pedestres e ciclistas na faixa lateral.',
    kanbanItemId: 'K08',
    risco: 'medio',
    data: '2026-06-04',
    categoria: 'Sinalização',
    status: 'em_andamento',
  },
];
