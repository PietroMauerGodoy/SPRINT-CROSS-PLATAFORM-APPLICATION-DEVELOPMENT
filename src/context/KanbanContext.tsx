import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { KanbanItem, SeveridadeVegetacao } from '../types';
import { mockKanban } from '../data/mockData';
import { coordenadasAproximadas, migrarRodoviaLegada } from '../utils/geo';

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

// Migra dado salvo antes de alguma mudança de schema/domínio:
// - rodovia legada (ex: SP-280, que não é da Motiva — ver README) → rodovia atual,
//   recalculando a coordenada, já que a antiga era de outro lugar.
// - lat/lon ausentes (campo introduzido depois — sem isso o mapa em Trechos
//   quebrava com "Invalid LatLng object: (NaN, NaN)").
// - `entrouNaSeveridadeEm` ausente (campo introduzido depois, usado no KPI
//   "Tempo médio de resposta" do Dashboard). Sem dado histórico real disponível,
//   o fallback é a data de hoje — aproximação documentada, igual ao padrão de lat/lon.
function comMetadadosCompletos(item: KanbanItem): KanbanItem {
  const rodoviaAtual = migrarRodoviaLegada(item.rodovia);
  const rodoviaMudou = rodoviaAtual !== item.rodovia;
  const semCoordenada =
    rodoviaMudou ||
    typeof item.lat !== 'number' || typeof item.lon !== 'number' || Number.isNaN(item.lat) || Number.isNaN(item.lon);
  const semEntradaSeveridade = typeof item.entrouNaSeveridadeEm !== 'string' || !item.entrouNaSeveridadeEm;

  if (!rodoviaMudou && !semCoordenada && !semEntradaSeveridade) return item;
  return {
    ...item,
    rodovia: rodoviaAtual,
    ...(semCoordenada ? coordenadasAproximadas(rodoviaAtual, item.kmInicio) : {}),
    ...(semEntradaSeveridade ? { entrouNaSeveridadeEm: hoje() } : {}),
  };
}

const STORAGE_KEY = '@motiva:kanban';

type KanbanContextType = {
  itens:              KanbanItem[];
  adicionarItem:      (item: Omit<KanbanItem, 'id' | 'entrouNaSeveridadeEm'>) => string;
  atualizarItem:      (id: string, updates: Partial<KanbanItem>) => void;
  removerItem:        (id: string) => void;
  removerPorEquipeId: (equipeId: string) => void;
  limparColuna:       (sev: SeveridadeVegetacao) => void;
  temEquipeNoKanban:  (equipeId: string) => boolean;
  /** false até o carregamento inicial (AsyncStorage ou seed do mock) terminar. */
  isHydrated:         boolean;
};

const KanbanContext = createContext<KanbanContextType | null>(null);

export function KanbanProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<KanbanItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function carregar() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          if (!ignore) {
            setItens(mockKanban);
            setIsHydrated(true);
          }
          return;
        }

        const parsed = JSON.parse(raw) as KanbanItem[];
        if (Array.isArray(parsed) && !ignore) {
          setItens(parsed.map(comMetadadosCompletos));
        } else if (!ignore) {
          setItens(mockKanban);
        }
      } catch {
        if (!ignore) setItens(mockKanban);
      } finally {
        if (!ignore) setIsHydrated(true);
      }
    }

    void carregar();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(itens)).catch(() => undefined);
  }, [itens, isHydrated]);

  function adicionarItem(item: Omit<KanbanItem, 'id' | 'entrouNaSeveridadeEm'>): string {
    const id = `K${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setItens((prev) => [{ id, entrouNaSeveridadeEm: hoje(), ...item }, ...prev]);
    return id;
  }

  // Sempre que `severidade` mudar de valor (drag-and-drop no Kanban, ou o
  // formulário de editar item), `entrouNaSeveridadeEm` é atualizado pra hoje
  // automaticamente — é o que alimenta o "Tempo médio de resposta" do
  // Dashboard. Centralizado aqui pra nenhuma tela precisar lembrar de fazer isso.
  function atualizarItem(id: string, updates: Partial<KanbanItem>) {
    setItens((prev) => prev.map((i) => {
      if (i.id !== id) return i;
      const mudouSeveridade = updates.severidade !== undefined && updates.severidade !== i.severidade;
      return {
        ...i,
        ...updates,
        entrouNaSeveridadeEm: mudouSeveridade ? hoje() : (updates.entrouNaSeveridadeEm ?? i.entrouNaSeveridadeEm),
      };
    }));
  }

  function removerItem(id: string) {
    setItens((prev) => prev.filter((i) => i.id !== id));
  }

  function removerPorEquipeId(equipeId: string) {
    setItens((prev) => prev.filter((i) => i.equipeId !== equipeId));
  }

  function limparColuna(sev: SeveridadeVegetacao) {
    setItens((prev) => prev.filter((i) => i.severidade !== sev));
  }

  function temEquipeNoKanban(equipeId: string): boolean {
    return itens.some((i) => i.equipeId === equipeId);
  }

  return (
    <KanbanContext.Provider value={{ itens, adicionarItem, atualizarItem, removerItem, removerPorEquipeId, limparColuna, temEquipeNoKanban, isHydrated }}>
      {children}
    </KanbanContext.Provider>
  );
}

export function useKanban() {
  const ctx = useContext(KanbanContext);
  if (!ctx) throw new Error('useKanban deve ser usado dentro de KanbanProvider');
  return ctx;
}
