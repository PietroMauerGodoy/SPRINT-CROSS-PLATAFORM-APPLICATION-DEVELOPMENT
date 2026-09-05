// Geocodificação via Nominatim (OpenStreetMap) — gratuito, sem chave de API.
// Resolve "nome de rodovia/lugar" -> coordenada real, mas não "rodovia + km"
// (isso exigiria dado geoespacial oficial da rodovia, ex: SNV do DNIT — ver
// limitação documentada em `utils/geo.ts`). Uso: achar um ponto de partida
// real pra uma rodovia nova que ainda não está na lista conhecida.
const BASE_URL = 'https://nominatim.openstreetmap.org/search';

// Política de uso do Nominatim pede um identificador da aplicação e no
// máximo ~1 requisição por segundo — aceitável aqui porque isso só roda uma
// vez por rodovia nova (o resultado fica em cache em memória depois).
const USER_AGENT = 'MotivaChallengeFIAP/1.0 (projeto academico)';

const cache = new Map<string, { lat: number; lon: number } | null>();

export async function geocodificarRodovia(rodovia: string): Promise<{ lat: number; lon: number } | null> {
  const chave = rodovia.trim().toLowerCase();
  if (cache.has(chave)) return cache.get(chave)!;

  const params = new URLSearchParams({
    q: `Rodovia ${rodovia}, São Paulo, Brasil`,
    format: 'json',
    limit: '1',
  });

  try {
    const resposta = await fetch(`${BASE_URL}?${params.toString()}`, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'pt-BR' },
    });
    if (!resposta.ok) throw new Error(`Nominatim respondeu ${resposta.status}`);

    const resultados = (await resposta.json()) as { lat: string; lon: string }[];
    const encontrado = resultados[0]
      ? { lat: parseFloat(resultados[0].lat), lon: parseFloat(resultados[0].lon) }
      : null;

    cache.set(chave, encontrado);
    return encontrado;
  } catch {
    cache.set(chave, null);
    return null;
  }
}
