import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Ocorrencia } from '../types';
import { adicionarOcorrencia as adicionarOcorrenciaService, atualizarOcorrencia as atualizarOcorrenciaService, buscarOcorrenciaPorId, carregarOcorrencias, listarOcorrencias } from '../services/ocorrenciasService';

type OcorrenciasContextType = {
  ocorrencias: Ocorrencia[];
  adicionarOcorrencia: (o: Omit<Ocorrencia, 'id'>) => Promise<number>;
  atualizarOcorrencia: (id: number, dados: Partial<Ocorrencia>) => Promise<void>;
  buscarPorId: (id: number) => Ocorrencia | undefined;
};

const OcorrenciasContext = createContext<OcorrenciasContextType | null>(null);

export function OcorrenciasProvider({ children }: { children: ReactNode }) {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);

  useEffect(() => {
    let ignore = false;

    async function carregarLista() {
      const lista = await carregarOcorrencias();
      if (!ignore) {
        setOcorrencias(lista);
      }
    }

    void carregarLista();

    return () => {
      ignore = true;
    };
  }, []);

  async function adicionar(o: Omit<Ocorrencia, 'id'>): Promise<number> {
    const id = await adicionarOcorrenciaService(o);
    setOcorrencias(await listarOcorrencias());
    return id;
  }

  async function atualizar(id: number, dados: Partial<Ocorrencia>): Promise<void> {
    await atualizarOcorrenciaService(id, dados);
    setOcorrencias(await listarOcorrencias());
  }

  function buscarPorId(id: number): Ocorrencia | undefined {
    return buscarOcorrenciaPorId(id) ?? ocorrencias.find((item) => item.id === id);
  }

  return (
    <OcorrenciasContext.Provider value={{ ocorrencias, adicionarOcorrencia: adicionar, atualizarOcorrencia: atualizar, buscarPorId }}>
      {children}
    </OcorrenciasContext.Provider>
  );
}

export function useOcorrencias() {
  const ctx = useContext(OcorrenciasContext);
  if (!ctx) throw new Error('useOcorrencias deve ser usado dentro de OcorrenciasProvider');
  return ctx;
}
