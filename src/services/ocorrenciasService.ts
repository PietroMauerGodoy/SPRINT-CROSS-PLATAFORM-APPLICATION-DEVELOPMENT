import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockOcorrencias } from '../data/mockData';
import { Ocorrencia } from '../types';

const STORAGE_KEY = '@motiva:ocorrencias';

let ocorrenciasEmMemoria: Ocorrencia[] = [...mockOcorrencias];

async function salvarOcorrencias(lista: Ocorrencia[]) {
  ocorrenciasEmMemoria = lista;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

export async function carregarOcorrencias(): Promise<Ocorrencia[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      await salvarOcorrencias([...mockOcorrencias]);
      return [...ocorrenciasEmMemoria];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      await salvarOcorrencias([...mockOcorrencias]);
      return [...ocorrenciasEmMemoria];
    }

    const listaValida = parsed.filter((item): item is Ocorrencia => {
      if (!item || typeof item !== 'object') return false;
      const candidate = item as Partial<Ocorrencia>;
      return typeof candidate.id === 'number' && typeof candidate.titulo === 'string' && typeof candidate.local === 'string';
    });

    ocorrenciasEmMemoria = listaValida.length > 0 ? listaValida : [...mockOcorrencias];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ocorrenciasEmMemoria));
    return [...ocorrenciasEmMemoria];
  } catch (error) {
    ocorrenciasEmMemoria = [...mockOcorrencias];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ocorrenciasEmMemoria));
    return [...ocorrenciasEmMemoria];
  }
}

export async function listarOcorrencias(): Promise<Ocorrencia[]> {
  const listaAtual = await carregarOcorrencias();
  return listaAtual.map((ocorrencia) => ({ ...ocorrencia }));
}

export async function adicionarOcorrencia(dados: Omit<Ocorrencia, 'id'>): Promise<number> {
  const listaAtual = await listarOcorrencias();
  const id = Date.now();
  const novaOcorrencia: Ocorrencia = { ...dados, id };

  await salvarOcorrencias([novaOcorrencia, ...listaAtual]);
  return id;
}

export async function atualizarOcorrencia(id: number, dados: Partial<Ocorrencia>) {
  const listaAtual = await listarOcorrencias();
  const proximaLista = listaAtual.map((ocorrencia) =>
    ocorrencia.id === id ? { ...ocorrencia, ...dados } : ocorrencia,
  );

  await salvarOcorrencias(proximaLista);
}

export function buscarOcorrenciaPorId(id: number): Ocorrencia | undefined {
  return ocorrenciasEmMemoria.find((ocorrencia) => ocorrencia.id === id);
}
