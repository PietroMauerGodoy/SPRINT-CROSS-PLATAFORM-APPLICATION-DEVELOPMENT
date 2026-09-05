import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Equipe, StatusEquipe } from '../types';
import { mockEquipes } from '../data/mockData';
import { migrarRodoviaLegada } from '../utils/geo';

const STORAGE_KEY = '@motiva:equipes';

// Rodovia legada salva antes da correção (ex: SP-280) → rodovia atual — ver
// mesma migração em KanbanContext.tsx e README ("SP-280 não é Motiva").
function comRodoviaAtual(equipe: Equipe): Equipe {
  const rodovia = migrarRodoviaLegada(equipe.rodovia);
  return rodovia === equipe.rodovia ? equipe : { ...equipe, rodovia };
}

type EquipesContextType = {
  equipes:          Equipe[];
  adicionarEquipe:  (e: Omit<Equipe, 'id' | 'status'>) => string;
  editarEquipe:     (id: string, dados: Omit<Equipe, 'id' | 'status'>) => void;
  excluirEquipe:    (id: string) => void;
  alternarStatus:   (id: string) => StatusEquipe;
  setStatusEquipe:  (id: string, status: StatusEquipe) => void;
  /** false até o carregamento inicial (AsyncStorage ou seed do mock) terminar. */
  isHydrated:       boolean;
};

const EquipesContext = createContext<EquipesContextType | null>(null);

export function EquipesProvider({ children }: { children: ReactNode }) {
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function carregar() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          if (!ignore) {
            setEquipes(mockEquipes);
            setIsHydrated(true);
          }
          return;
        }

        const parsed = JSON.parse(raw) as Equipe[];
        if (Array.isArray(parsed) && !ignore) {
          setEquipes(parsed.map(comRodoviaAtual));
        } else if (!ignore) {
          setEquipes(mockEquipes);
        }
      } catch {
        if (!ignore) setEquipes(mockEquipes);
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
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(equipes)).catch(() => undefined);
  }, [equipes, isHydrated]);

  function adicionarEquipe(dados: Omit<Equipe, 'id' | 'status'>): string {
    // Só considera IDs no formato exato "#NN" — ignora IDs antigos/corrompidos
    // (ex: "#1787867689912-8bzw") para não inflar o próximo número gerado.
    const numeros = equipes
      .map((e) => e.id.match(/^#(\d+)$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => parseInt(m[1], 10));
    const proximoNum = (numeros.length > 0 ? Math.max(...numeros) : 0) + 1;
    const id = `#${String(proximoNum).padStart(2, '0')}`;
    setEquipes((prev) => [{ id, status: 'ativo', ...dados }, ...prev]);
    return id;
  }

  function editarEquipe(id: string, dados: Omit<Equipe, 'id' | 'status'>) {
    setEquipes((prev) => prev.map((e) => e.id === id ? { ...e, ...dados } : e));
  }

  function excluirEquipe(id: string) {
    setEquipes((prev) => prev.filter((e) => e.id !== id));
  }

  function alternarStatus(id: string): StatusEquipe {
    let novoStatus: StatusEquipe = 'ativo';
    setEquipes((prev) => prev.map((e) => {
      if (e.id !== id) return e;
      novoStatus = e.status === 'inativo' ? 'ativo' : 'inativo';
      return { ...e, status: novoStatus };
    }));
    return novoStatus;
  }

  function setStatusEquipe(id: string, status: StatusEquipe) {
    setEquipes((prev) => prev.map((e) => e.id === id ? { ...e, status } : e));
  }

  return (
    <EquipesContext.Provider value={{ equipes, adicionarEquipe, editarEquipe, excluirEquipe, alternarStatus, setStatusEquipe, isHydrated }}>
      {children}
    </EquipesContext.Provider>
  );
}

export function useEquipes() {
  const ctx = useContext(EquipesContext);
  if (!ctx) throw new Error('useEquipes deve ser usado dentro de EquipesProvider');
  return ctx;
}
