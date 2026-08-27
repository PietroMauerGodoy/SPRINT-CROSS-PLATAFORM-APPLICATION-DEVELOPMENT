import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { SeveridadeSnapshot } from '../types';
import { useKanban } from './KanbanContext';
import { gerarHistoricoSeed, contagensPorSeveridade } from '../utils/dashboardMetrics';

const STORAGE_KEY = '@motiva:historico';
const DIAS_SEED = 30;

type HistoricoContextType = {
  snapshots: SeveridadeSnapshot[];
};

const HistoricoContext = createContext<HistoricoContextType | null>(null);

// Opção híbrida (Etapa 6, aprovada): na primeira execução gera um seed mockado
// coerente com o estado atual do Kanban só para o gráfico não nascer vazio; a
// partir daí, grava o snapshot REAL do dia sempre que o Kanban mudar — o
// histórico passa a ser dado de verdade a partir de agora.
export function HistoricoProvider({ children }: { children: ReactNode }) {
  const { itens } = useKanban();
  const [snapshots, setSnapshots] = useState<SeveridadeSnapshot[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const carregouRef = useRef(false);

  // Carrega o histórico salvo, ou gera o seed — só depois que o Kanban tiver
  // hidratado de verdade (itens.length > 0), pra não gerar seed com lista vazia.
  useEffect(() => {
    if (carregouRef.current || itens.length === 0) return;
    carregouRef.current = true;

    let ignore = false;
    async function carregar() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as SeveridadeSnapshot[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (!ignore) setSnapshots(parsed);
            return;
          }
        }
        if (!ignore) setSnapshots(gerarHistoricoSeed(itens, DIAS_SEED));
      } catch {
        if (!ignore) setSnapshots(gerarHistoricoSeed(itens, DIAS_SEED));
      } finally {
        if (!ignore) setIsHydrated(true);
      }
    }

    void carregar();
    return () => { ignore = true; };
  }, [itens]);

  // A partir daqui, grava/atualiza o snapshot de HOJE sempre que o Kanban mudar —
  // é assim que o histórico passa a ser real, dia após dia.
  useEffect(() => {
    if (!isHydrated) return;
    const hojeISO = new Date().toISOString().slice(0, 10);
    const contagensHoje = contagensPorSeveridade(itens);
    setSnapshots((prev) => [...prev.filter((s) => s.data !== hojeISO), { data: hojeISO, contagens: contagensHoje }]);
  }, [itens, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots)).catch(() => undefined);
  }, [snapshots, isHydrated]);

  return (
    <HistoricoContext.Provider value={{ snapshots }}>
      {children}
    </HistoricoContext.Provider>
  );
}

export function useHistorico() {
  const ctx = useContext(HistoricoContext);
  if (!ctx) throw new Error('useHistorico deve ser usado dentro de HistoricoProvider');
  return ctx;
}
