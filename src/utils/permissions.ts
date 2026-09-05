// Camada central de autorização — "RLS-ready": cada função aqui é pura e
// independente de UI/Context, pensada para virar uma policy de RLS real
// (Postgres/Supabase) na Fase 2 sem retrabalho de arquitetura (ver docs/rls-supabase.md).
//
// Regra de uso: nenhuma tela decide "quem pode ver o quê" sozinha — toda tela
// chama uma função daqui e renderiza só o que ela devolver.
import { Equipe, KanbanItem, Usuario } from '../types';

// Admin e Gestor têm o mesmo nível de acesso operacional (visualizar/gerenciar
// tudo); a diferença entre os dois é só nas telas de administração do sistema
// em si (Parâmetros do Sistema, Gestão de Usuários — ver funções específicas).
function temAcessoTotal(usuario: Usuario): boolean {
  return usuario.papel === 'admin' || usuario.papel === 'gestor';
}

// ─── Visibilidade de dados ──────────────────────────────────────────────────

export function podeVerEquipe(usuario: Usuario, equipe: Equipe): boolean {
  if (temAcessoTotal(usuario)) return true;
  return equipe.id === usuario.equipeId;
}

export function getEquipesVisiveis(usuario: Usuario, equipes: Equipe[]): Equipe[] {
  if (temAcessoTotal(usuario)) return equipes;
  return equipes.filter((e) => podeVerEquipe(usuario, e));
}

export function podeVerKanbanItem(usuario: Usuario, item: KanbanItem): boolean {
  if (temAcessoTotal(usuario)) return true;
  return item.equipeId === usuario.equipeId;
}

export function getKanbanItemsVisiveis(usuario: Usuario, itens: KanbanItem[]): KanbanItem[] {
  if (temAcessoTotal(usuario)) return itens;
  return itens.filter((i) => podeVerKanbanItem(usuario, i));
}

// ─── Ações (criar/editar/excluir) ───────────────────────────────────────────

export function podeGerenciarEquipes(usuario: Usuario): boolean {
  return temAcessoTotal(usuario);
}

export function podeEditarKanbanItem(usuario: Usuario, item: KanbanItem): boolean {
  if (temAcessoTotal(usuario)) return true;
  return item.equipeId === usuario.equipeId;
}

export function podeCriarOuExcluirKanbanItem(usuario: Usuario): boolean {
  return temAcessoTotal(usuario);
}

export function podeCriarOuExcluirOcorrencia(usuario: Usuario): boolean {
  return temAcessoTotal(usuario);
}

// ─── Acesso a telas inteiras ────────────────────────────────────────────────

/** Todos os papéis acessam o Dashboard — a diferença é o ESCOPO dos dados, ver podeVerDashboardCompleto(). */
export function podeAcessarDashboard(_usuario: Usuario): boolean {
  return true;
}

/** Admin/Gestor veem o Dashboard completo; Operador de Campo vê a versão reduzida (só a própria equipe). */
export function podeVerDashboardCompleto(usuario: Usuario): boolean {
  return temAcessoTotal(usuario);
}

/** Só Admin configura os parâmetros globais do sistema (pesos de criticidade, SLAs). */
export function podeAcessarParametrosSistema(usuario: Usuario): boolean {
  return usuario.papel === 'admin';
}

/**
 * Admin e Gestor gerenciam contas de usuário e papéis — em especial, atribuir/
 * trocar a equipe de um Operador de Campo é uma decisão operacional do dia a
 * dia, não estrutural do sistema, então cabe também ao Gestor (não só Admin).
 */
export function podeGerenciarUsuarios(usuario: Usuario): boolean {
  return temAcessoTotal(usuario);
}

/**
 * Itens de sidebar sem tela real por trás hoje (Planejamento, Relatórios) —
 * controla só a VISIBILIDADE do item de menu, não o acesso a um recurso, já
 * que não existe recurso implementado. "Trechos" fica visível pra todo mundo
 * (mesmo sem tela própria ainda) porque o dado de trecho já existe e já é
 * visível/filtrado por papel dentro do Kanban.
 */
export function podeVerItemMenuOperacional(usuario: Usuario): boolean {
  return temAcessoTotal(usuario);
}

/** Labels de sidebar sem tela real hoje — usado junto com podeVerItemMenuOperacional()
 *  pra filtrar a lista de itens de menu nas telas (Equipes/Kanban/Ocorrências/
 *  Configurações/Dashboard todas compartilham a mesma sidebar). */
export const ITENS_MENU_SEM_TELA = ['Planejamento', 'Relatórios'];
