export type RiscoNivel = 'baixo' | 'medio' | 'alto';

export type Ocorrencia = {
  id: number;
  descricao: string;
  local: string;
  risco: RiscoNivel;
  data: string;
  titulo: string;
  categoria: string;
  status: 'aberta' | 'em_andamento' | 'resolvida';
  responsavel?: string;
};

export type Usuario = {
  id: number;
  nome: string;
  usuario: string;
  senha: string;
  cargo: string;
  avatar?: string;
};

export type StatusEquipe = 'ativo' | 'inativo' | 'em_campo';

export type Equipe = {
  id: string;
  nome: string;
  status: StatusEquipe;
  rodovia: string;
  km: string;
  trechoRodovia: string;
  responsavel: string;
};

export type SeveridadeVegetacao = 'sem_ocorrencia' | 'leve' | 'grave' | 'critico';

export type KanbanItem = {
  id: string;
  equipeId: string;
  nomeEquipe: string;
  rodovia: string;
  kmInicio: number;
  kmFim: number;
  tipoVegetacao: string;
  alturaAtual: number;
  severidade: SeveridadeVegetacao;
  responsavel: string;
  observacao: string;
  ultimoServico: { data: string; responsavel: string } | null;
};

export type RootStackParamList = {
  Login: undefined;
  Ocorrencias: undefined;
  Equipes: undefined;
  Kanban: undefined;
  Configuracoes: undefined;
  Cadastro: undefined;
  Detalhe: { ocorrencia: Ocorrencia };
};
