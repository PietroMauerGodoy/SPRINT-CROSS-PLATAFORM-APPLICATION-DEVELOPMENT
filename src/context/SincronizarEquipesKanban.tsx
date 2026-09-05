import { useEffect } from 'react';
import { useEquipes } from './EquipesContext';
import { useKanban } from './KanbanContext';
import { coordenadasAproximadas, corrigirComGeocodingSeNecessario } from '../utils/geo';
import { equipesSemCardNoKanban } from '../utils/equipeKanbanSync';

/**
 * Garante o mesmo invariante que já vale ao criar uma equipe pela tela
 * (Equipes → Nova Equipe sempre gera um card no Kanban): toda equipe com
 * status diferente de 'inativo' tem pelo menos um card no Kanban. Sem isso,
 * uma equipe pode ficar "órfã" — visível em Equipes mas ausente do Kanban —
 * por qualquer motivo histórico (dado criado antes desse fluxo existir, uma
 * falha no meio da criação, edição direta do armazenamento etc.). Roda uma
 * vez, só depois que as duas fontes (Equipes e Kanban) já hidrataram — sem
 * essa espera, o efeito veria o Kanban ainda vazio (`itens: []`) durante o
 * carregamento inicial e criaria cards duplicados para todo mundo.
 */
export function SincronizarEquipesKanban() {
  const { equipes, isHydrated: equipesHidratado } = useEquipes();
  const { itens, adicionarItem, atualizarItem, isHydrated: kanbanHidratado } = useKanban();

  useEffect(() => {
    if (!equipesHidratado || !kanbanHidratado) return;

    const orfas = equipesSemCardNoKanban(equipes, itens);
    orfas.forEach((equipe) => {
      const kmNum = parseFloat(equipe.km.replace('Km ', '')) || 0;
      const novoId = adicionarItem({
        equipeId: equipe.id, nomeEquipe: equipe.nome, rodovia: equipe.rodovia,
        kmInicio: kmNum, kmFim: kmNum + 5,
        tipoVegetacao: 'Grama Bermuda (Rasteira)', alturaAtual: 2,
        severidade: 'sem_ocorrencia', responsavel: equipe.responsavel,
        observacao: '', ultimoServico: null,
        ...coordenadasAproximadas(equipe.rodovia, kmNum),
      });
      corrigirComGeocodingSeNecessario(equipe.rodovia, kmNum).then((corrigida) => {
        if (corrigida) atualizarItem(novoId, corrigida);
      });
    });
  }, [equipes, itens, equipesHidratado, kanbanHidratado, adicionarItem, atualizarItem]);

  return null;
}
