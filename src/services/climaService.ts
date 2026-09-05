import { ClimaAtual } from '../types';

// Open-Meteo: sem chave de API, sem custo. https://open-meteo.com/en/docs
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

type RespostaOpenMeteo = {
  current: {
    temperature_2m: number;
    precipitation: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
    weather_code: number;
  };
};

export async function buscarClimaAtual(lat: number, lon: number): Promise<ClimaAtual> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,precipitation,wind_speed_10m,relative_humidity_2m,weather_code',
    timezone: 'auto',
  });

  const resposta = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!resposta.ok) {
    throw new Error(`Open-Meteo respondeu ${resposta.status}`);
  }

  const dados = (await resposta.json()) as RespostaOpenMeteo;
  return {
    temperaturaC: dados.current.temperature_2m,
    precipitacaoMm: dados.current.precipitation,
    ventoKmh: dados.current.wind_speed_10m,
    umidadePct: dados.current.relative_humidity_2m,
    codigoTempo: dados.current.weather_code,
  };
}

// Tradução simplificada dos códigos WMO usados pelo Open-Meteo — só as
// faixas relevantes pra decidir risco de crescimento de vegetação/visibilidade.
const DESCRICAO_POR_CODIGO: { max: number; label: string; icone: string }[] = [
  { max: 0,  label: 'Céu limpo',        icone: 'sunny-outline' },
  { max: 3,  label: 'Parcialmente nublado', icone: 'partly-sunny-outline' },
  { max: 48, label: 'Névoa',            icone: 'cloud-outline' },
  { max: 67, label: 'Chuva',            icone: 'rainy-outline' },
  { max: 77, label: 'Neve',             icone: 'snow-outline' },
  { max: 82, label: 'Pancadas de chuva', icone: 'rainy-outline' },
  { max: 99, label: 'Tempestade',       icone: 'thunderstorm-outline' },
];

export function descreverTempo(codigo: number): { label: string; icone: string } {
  const faixa = DESCRICAO_POR_CODIGO.find((f) => codigo <= f.max);
  return faixa ? { label: faixa.label, icone: faixa.icone } : { label: 'Indefinido', icone: 'help-outline' };
}
