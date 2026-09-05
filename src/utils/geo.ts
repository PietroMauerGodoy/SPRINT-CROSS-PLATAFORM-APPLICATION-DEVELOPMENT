import { geocodificarRodovia } from '../services/geocodingService';

// Ponto de partida de cada rodovia — geocodificado de verdade via Nominatim
// (OpenStreetMap), não inventado. Cada ponto é onde a rodovia passa perto da
// Região Metropolitana de SP (não necessariamente o Km exato do trecho —
// geocodificação resolve nome de lugar, não "rodovia + km"; ver README/
// conversa sobre limitações). A partir daqui, o km de cada trecho desloca a
// coordenada proporcionalmente — ver `coordenadasAproximadas`.
const BASE_ROTA: Record<string, { lat: number; lon: number }> = {
  'BR-116': { lat: -23.7459208, lon: -46.9001300 }, // Rodovia Régis Bittencourt (Via Dutra/RioSP), Itapecerica da Serra/SP
  'SP-330': { lat: -23.1648654, lon: -46.9291752 }, // Rodovia Anhanguera (Motiva Autoban), Jundiaí/SP
  'BR-381': { lat: -23.4966494, lon: -46.5596930 }, // Rodovia Fernão Dias, Guarulhos/SP
};

// Rodovias usadas em versões anteriores do mock que foram corrigidas depois
// (ex: SP-280/Castelo Branco não é administrada pela Motiva — ver README).
// Sem isso, uma instalação com dados salvos no AsyncStorage/localStorage de
// antes da correção ficaria presa pra sempre com a rodovia errada, já que o
// mock só é usado como seed na primeira execução (nunca sobrescreve dado já salvo).
const RODOVIA_MIGRACAO: Record<string, string> = {
  'SP-280': 'SP-330',
};

/** Traduz uma rodovia legada/descontinuada pra sua substituta atual (ou devolve a mesma, se já é atual). */
export function migrarRodoviaLegada(rodovia: string): string {
  return RODOVIA_MIGRACAO[rodovia] ?? rodovia;
}

const PASSO_POR_KM = 0.009; // ~1km em graus, deslocando trecho a trecho

function deslocar(base: { lat: number; lon: number }, kmInicio: number): { lat: number; lon: number } {
  const deslocamento = kmInicio * PASSO_POR_KM;
  return { lat: base.lat - deslocamento, lon: base.lon - deslocamento };
}

/** Coordenada síncrona imediata — usa a base conhecida, ou um fallback genérico se a rodovia for nova. */
export function coordenadasAproximadas(rodovia: string, kmInicio: number): { lat: number; lon: number } {
  const base = BASE_ROTA[rodovia] ?? BASE_ROTA['BR-116'];
  return deslocar(base, kmInicio);
}

/**
 * Pra rodovias que ainda não estão em `BASE_ROTA`: geocodifica de verdade
 * (Nominatim) e devolve uma coordenada melhor. Retorna `null` quando a
 * rodovia já é conhecida (nada a corrigir) ou quando a geocodificação falha —
 * quem chamar deve manter a coordenada síncrona já aplicada nesses casos.
 */
export async function corrigirComGeocodingSeNecessario(
  rodovia: string,
  kmInicio: number,
): Promise<{ lat: number; lon: number } | null> {
  if (BASE_ROTA[rodovia]) return null;

  const base = await geocodificarRodovia(rodovia);
  if (!base) return null;

  BASE_ROTA[rodovia] = base; // próximos trechos dessa rodovia já nascem certos
  return deslocar(base, kmInicio);
}
