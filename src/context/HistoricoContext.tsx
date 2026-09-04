import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import { SeveridadeSnapshot } from '../types';
import { useKanban } from './KanbanContext';
import { gerarHistoricoSeed, contagensPorSeveridade } from '../utils/dashboardMetrics';

const STORAGE_KEY = '@motiva:historico';
const DIAS_SEED = 30;
const INTERVALO_RECHECAGEM_MS = 5 * 60 * 1000;

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
  const itensRef = useRef(itens);
  itensRef.current = itens;

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

  // Grava/atualiza o snapshot de HOJE a partir do estado atual do Kanban.
  // Idempotente: se já existe um snapshot de hoje com as mesmas contagens,
  // não gera um novo objeto (evita re-render/gravação desnecessária).
  const gravarSnapshotHoje = useCallback(() => {
    const hojeISO = new Date().toISOString().slice(0, 10);
    const contagensHoje = contagensPorSeveridade(itensRef.current);
    setSnapshots((prev) => {
      const existente = prev.find((s) => s.data === hojeISO);
      if (existente && JSON.stringify(existente.contagens) === JSON.stringify(contagensHoje)) {
        return prev;
      }
      return [...prev.filter((s) => s.data !== hojeISO), { data: hojeISO, contagens: contagensHoje }];
    });
  }, []);

  // Dispara sempre que o Kanban mudar (edição real, ou o load inicial da sessão).
  useEffect(() => {
    if (!isHydrated) return;
    gravarSnapshotHoje();
  }, [itens, isHydrated, gravarSnapshotHoje]);

  // Sem isso, uma aba deixada aberta de um dia pro outro nunca percebe que o
  // dia virou (o efeito acima só roda quando `itens` muda de referência) —
  // o histórico "trava" no último dia em que algo foi editado no Kanban. Um
  // timer periódico + recheck ao voltar o foco da aba corrige isso sem
  // precisar de recarregar a página.
  useEffect(() => {
    if (!isHydrated) return;

    const intervalo = setInterval(gravarSnapshotHoje, INTERVALO_RECHECAGEM_MS);

    let removerListenerFoco: (() => void) | undefined;
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') gravarSnapshotHoje();
      };
      document.addEventListener('visibilitychange', onVisibilityChange);
      removerListenerFoco = () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      clearInterval(intervalo);
      removerListenerFoco?.();
    };
  }, [isHydrated, gravarSnapshotHoje]);

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
