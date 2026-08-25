import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { KanbanItem, SeveridadeVegetacao } from '../types';
import { mockKanban } from '../data/mockData';

const STORAGE_KEY = '@motiva:kanban';

type KanbanContextType = {
  itens:              KanbanItem[];
  adicionarItem:      (item: Omit<KanbanItem, 'id'>) => string;
  atualizarItem:      (id: string, updates: Partial<KanbanItem>) => void;
  removerItem:        (id: string) => void;
  removerPorEquipeId: (equipeId: string) => void;
  limparColuna:       (sev: SeveridadeVegetacao) => void;
  temEquipeNoKanban:  (equipeId: string) => boolean;
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
          setItens(parsed);
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

  function adicionarItem(item: Omit<KanbanItem, 'id'>): string {
    const id = `K${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setItens((prev) => [{ id, ...item }, ...prev]);
    return id;
  }

  function atualizarItem(id: string, updates: Partial<KanbanItem>) {
    setItens((prev) => prev.map((i) => i.id === id ? { ...i, ...updates } : i));
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
    <KanbanContext.Provider value={{ itens, adicionarItem, atualizarItem, removerItem, removerPorEquipeId, limparColuna, temEquipeNoKanban }}>
      {children}
    </KanbanContext.Provider>
  );
}

export function useKanban() {
  const ctx = useContext(KanbanContext);
  if (!ctx) throw new Error('useKanban deve ser usado dentro de KanbanProvider');
  return ctx;
}
