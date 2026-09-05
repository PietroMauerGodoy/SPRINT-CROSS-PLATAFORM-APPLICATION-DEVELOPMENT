import { Equipe, KanbanItem } from '../types';

/**
 * Equipes que deveriam ter um card no Kanban (status diferente de 'inativo')
 * mas não têm nenhum — ex: uma equipe criada antes de o fluxo de criação
 * sincronizar com o Kanban existir, ou qualquer outra forma de os dois
 * ficarem fora de sincronia. Usado por `SincronizarEquipesKanban` pra
 * auto-curar essa inconsistência sem exigir ação manual do usuário.
 */
export function equipesSemCardNoKanban(equipes: Equipe[], itens: KanbanItem[]): Equipe[] {
  const idsComCard = new Set(itens.filter((i) => i.equipeId).map((i) => i.equipeId));
  return equipes.filter((e) => e.status !== 'inativo' && !idsComCard.has(e.id));
}
