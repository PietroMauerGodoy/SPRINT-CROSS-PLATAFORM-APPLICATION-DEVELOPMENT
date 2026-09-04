// Lógica pura do Dashboard Operacional — sem JSX, sem Context, só cálculo.
// Recebe dados já carregados (KanbanItem[], Equipe[], SeveridadeSnapshot[]) e devolve números prontos.
import { Equipe, KanbanItem, SeveridadeSnapshot, SeveridadeVegetacao } from '../types';

// ─── Constantes de negócio (documentadas, nada de "número mágico" solto) ──────

/**
 * Fator de "crescimento" por severidade, 0–100 — usado no score de priorização.
 * A severidade já É definida por faixa de altura (ver README: Sem Ocorrência
 * 0–9cm, Leve 10–19cm, Grave 20–29cm, Crítico ≥30cm), então ela funciona como
 * proxy direto da taxa de crescimento/estado atual do trecho.
 */
export const FATOR_CRESCIMENTO_SEVERIDADE: Record<SeveridadeVegetacao, number> = {
  sem_ocorrencia: 0,
  leve: 33,
  grave: 66,
  critico: 100,
};

/**
 * Fator de "clima" neutro, 0–100 — usado no score de priorização enquanto não
 * existir uma fonte real de dado climático por trecho. Hoje "Integrações → API
 * de Clima" é só um toggle "Conectado" sem integração de verdade por trás, e
 * `KanbanItem` não guarda nenhum dado climático por trecho. Em vez de fingir
 * um valor "real" (que mudaria o ranking sem nenhuma base), usamos um valor
 * fixo igual pra todos os trechos: o peso de clima configurado em Parâmetros
 * do Sistema participa da conta, mas não diferencia nenhum trecho do outro —
 * na prática, ele só dilui a influência dos outros dois pesos (que são reais).
 * Trocar por um valor de verdade exige integrar uma API de clima de fato.
 */
export const FATOR_CLIMA_NEUTRO = 50;

/**
 * Prazo-alvo (SLA), em dias, por severidade — inspirado no Anexo 06/ARTESP.
 * 'sem_ocorrencia' não tem prazo e não entra no cálculo de % de cumprimento de SLA.
 */
export const SLA_DIAS: Partial<Record<SeveridadeVegetacao, number>> = {
  critico: 1,
  grave: 7,
  leve: 15,
};

/**
 * Dias considerados quando um trecho nunca teve `ultimoServico` registrado.
 * Valor alto fixo para que esses trechos sempre subam ao topo do ranking/score
 * (peso máximo de severidade critico=3 × 10 = 30; 999 garante prioridade mesmo
 * sobre um crítico recém-atendido).
 */
export const DIAS_SEM_SERVICO_FALLBACK = 999;

export const SEVERIDADE_LABEL: Record<SeveridadeVegetacao, string> = {
  sem_ocorrencia: 'Sem Ocorrência',
  leve: 'Leve',
  grave: 'Grave',
  critico: 'Crítico',
};

// ─── Helpers de data ───────────────────────────────────────────────────────────

/** Converte 'dd/mm/yyyy' (formato usado em `ultimoServico.data`) para Date. */
function parseDataBR(data: string): Date | null {
  const m = data.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
}

function diffEmDias(inicio: Date, fim: Date): number {
  const diffMs = fim.getTime() - inicio.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/** Dias desde o último serviço registrado do trecho (ou DIAS_SEM_SERVICO_FALLBACK). */
export function diasDesdeUltimoServico(item: KanbanItem, referencia: Date = new Date()): number {
  if (!item.ultimoServico) return DIAS_SEM_SERVICO_FALLBACK;
  const data = parseDataBR(item.ultimoServico.data);
  if (!data) return DIAS_SEM_SERVICO_FALLBACK;
  return diffEmDias(data, referencia);
}

// ─── Score de priorização ──────────────────────────────────────────────────────

/** Pesos configuráveis em Configurações → Parâmetros do Sistema (0–100 cada, somam 100). */
export type PesosCriticidade = {
  pesoManutencao: number;
  pesoClima: number;
  pesoCrescimento: number;
  /** "Frequência padrão de reavaliação", em dias — também configurável ali. */
  frequenciaReavaliacaoDias: number;
};

/**
 * Fator de "manutenção", 0–100: quão atrasado o trecho está em relação à
 * frequência de reavaliação configurada. 0 = acabou de ser atendido; 100 =
 * atraso igual ou maior que o dobro da frequência configurada (ou trecho sem
 * nenhum serviço registrado, que sempre bate no teto).
 */
export function fatorManutencao(
  item: KanbanItem,
  frequenciaReavaliacaoDias: number,
  referencia: Date = new Date(),
): number {
  const dias = diasDesdeUltimoServico(item, referencia);
  const janela = Math.max(1, frequenciaReavaliacaoDias) * 2;
  return Math.max(0, Math.min(100, (dias / janela) * 100));
}

/**
 * Score de priorização (0–100), média ponderada pelos 3 pesos configuráveis:
 * - Manutenção → `fatorManutencao` (dado real: dias desde o último serviço).
 * - Crescimento → `FATOR_CRESCIMENTO_SEVERIDADE` (dado real: severidade/altura atual).
 * - Clima → `FATOR_CLIMA_NEUTRO` (placeholder documentado — sem fonte de dado real hoje).
 */
export function scorePriorizacao(
  item: KanbanItem,
  pesos: PesosCriticidade,
  referencia: Date = new Date(),
): number {
  const fManutencao = fatorManutencao(item, pesos.frequenciaReavaliacaoDias, referencia);
  const fCrescimento = FATOR_CRESCIMENTO_SEVERIDADE[item.severidade];
  const fClima = FATOR_CLIMA_NEUTRO;

  const somaPesos = pesos.pesoManutencao + pesos.pesoClima + pesos.pesoCrescimento || 1;
  const somaPonderada =
    pesos.pesoManutencao * fManutencao + pesos.pesoClima * fClima + pesos.pesoCrescimento * fCrescimento;

  return Math.round(somaPonderada / somaPesos);
}

// ─── KPIs ──────────────────────────────────────────────────────────────────────

export function contarTrechosCriticos(itens: KanbanItem[]): number {
  return itens.filter((i) => i.severidade === 'critico').length;
}

export function contarEquipesEmCampo(equipes: Equipe[]): { emCampo: number; totalAtivas: number } {
  const totalAtivas = equipes.filter((e) => e.status !== 'inativo').length;
  const emCampo = equipes.filter((e) => e.status === 'em_campo').length;
  return { emCampo, totalAtivas };
}

/**
 * % de trechos "dentro do prazo": dias desde o último serviço ≤ SLA_DIAS da severidade atual.
 * Só considera trechos cuja severidade tem prazo-alvo definido (exclui 'sem_ocorrencia').
 * Retorna null se não houver nenhum trecho elegível (evita divisão por zero).
 */
export function percentualCumprimentoSLA(itens: KanbanItem[], referencia: Date = new Date()): number | null {
  const comPrazo = itens.filter((i) => SLA_DIAS[i.severidade] !== undefined);
  if (comPrazo.length === 0) return null;
  const dentroDoPrazo = comPrazo.filter(
    (i) => diasDesdeUltimoServico(i, referencia) <= (SLA_DIAS[i.severidade] as number),
  );
  return (dentroDoPrazo.length / comPrazo.length) * 100;
}

/**
 * "Tempo médio de resposta" (dias entre entrada em severidade alta e o último serviço).
 * BLOQUEADO hoje: o modelo de dados atual não guarda quando um trecho entrou na
 * severidade atual (só o snapshot diário de contagens, usado no gráfico de tendência).
 * Retorna null até existir um log de transição de severidade por item — o componente
 * de UI deve exibir "—" / "sem dado suficiente" nesse caso.
 */
export function tempoMedioRespostaDias(_itens: KanbanItem[]): number | null {
  return null;
}

// ─── Distribuição por severidade (para o donut) ────────────────────────────────

export type DistribuicaoSeveridade = {
  severidade: SeveridadeVegetacao;
  quantidade: number;
  percentual: number;
};

export function distribuicaoPorSeveridade(itens: KanbanItem[]): DistribuicaoSeveridade[] {
  const total = itens.length;
  const ordem: SeveridadeVegetacao[] = ['sem_ocorrencia', 'leve', 'grave', 'critico'];
  return ordem.map((severidade) => {
    const quantidade = itens.filter((i) => i.severidade === severidade).length;
    return { severidade, quantidade, percentual: total > 0 ? (quantidade / total) * 100 : 0 };
  });
}

// ─── Ranking de priorização ─────────────────────────────────────────────────────

export type TrechoRanking = {
  item: KanbanItem;
  score: number;
  diasSemServico: number;
};

export function rankearTrechos(
  itens: KanbanItem[],
  pesos: PesosCriticidade,
  referencia: Date = new Date(),
): TrechoRanking[] {
  return itens
    .map((item) => ({
      item,
      score: scorePriorizacao(item, pesos, referencia),
      diasSemServico: diasDesdeUltimoServico(item, referencia),
    }))
    .sort((a, b) => b.score - a.score);
}

// ─── Recomendações automáticas ──────────────────────────────────────────────────

export type Recomendacao = {
  item: KanbanItem;
  score: number;
  motivo: string;
};

function montarMotivo(item: KanbanItem, diasSemServico: number): string {
  const label = SEVERIDADE_LABEL[item.severidade];
  if (!item.ultimoServico) {
    return `${label} sem nenhum serviço registrado — priorizar equipe.`;
  }
  return `${label} há ${diasSemServico} dia${diasSemServico === 1 ? '' : 's'} sem serviço — priorizar equipe.`;
}

export function gerarRecomendacoes(
  itens: KanbanItem[],
  pesos: PesosCriticidade,
  limite = 5,
  referencia: Date = new Date(),
): Recomendacao[] {
  return rankearTrechos(itens, pesos, referencia)
    .slice(0, limite)
    .map(({ item, score, diasSemServico }) => ({ item, score, motivo: montarMotivo(item, diasSemServico) }));
}

// ─── Gráfico de tendência (grave + crítico ao longo do período) ────────────────

export type PontoTendencia = { data: string; gravesCriticos: number };

/** Filtra os snapshots dentro dos últimos `periodoDias` e soma grave+critico por dia. */
export function serieTendenciaGraveCritico(
  snapshots: SeveridadeSnapshot[],
  periodoDias: number,
  referencia: Date = new Date(),
): PontoTendencia[] {
  const limite = new Date(referencia);
  limite.setDate(limite.getDate() - periodoDias);

  return snapshots
    .filter((s) => {
      const data = new Date(`${s.data}T00:00:00`);
      return data >= limite && data <= referencia;
    })
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((s) => ({
      data: s.data,
      gravesCriticos: (s.contagens.grave ?? 0) + (s.contagens.critico ?? 0),
    }));
}

/**
 * Variação de trechos críticos entre hoje e ~`diasAtras` dias atrás, a partir
 * do histórico de snapshots. Usa o snapshot mais próximo (na data ou antes) de
 * "hoje - diasAtras" como referência de comparação. Retorna null sem histórico
 * suficiente (ex: app instalado há menos dias que o período pedido).
 */
export function deltaTrechosCriticos(
  snapshots: SeveridadeSnapshot[],
  diasAtras: number,
  referencia: Date = new Date(),
): number | null {
  const hojeISO = referencia.toISOString().slice(0, 10);
  const alvo = new Date(referencia);
  alvo.setDate(alvo.getDate() - diasAtras);
  const alvoISO = alvo.toISOString().slice(0, 10);

  const hoje = snapshots.find((s) => s.data === hojeISO);
  const candidatosPassado = snapshots
    .filter((s) => s.data <= alvoISO)
    .sort((a, b) => b.data.localeCompare(a.data));

  if (!hoje || candidatosPassado.length === 0) return null;
  return hoje.contagens.critico - candidatosPassado[0].contagens.critico;
}

// ─── Seed histórico de demonstração (Etapa 6 — opção híbrida aprovada) ─────────
//
// Usado SÓ quando ainda não existe nenhum histórico real salvo (primeira execução
// do app). Gera uma série de `dias` snapshots que converge deterministicamente
// para o estado ATUAL do Kanban no último dia (hoje), com uma variação senoidal
// determinística (não aleatória) nos dias anteriores só para o gráfico não nascer
// uma linha reta. NÃO é dado real — a partir do primeiro carregamento do app,
// o HistoricoContext passa a gravar o snapshot real do dia por cima disso.
export function gerarHistoricoSeed(
  itensAtuais: KanbanItem[],
  dias: number,
  referencia: Date = new Date(),
): SeveridadeSnapshot[] {
  const total = itensAtuais.length;
  if (total === 0 || dias <= 0) return [];

  const contagemHoje: Record<SeveridadeVegetacao, number> = {
    sem_ocorrencia: 0,
    leve: 0,
    grave: 0,
    critico: 0,
  };
  distribuicaoPorSeveridade(itensAtuais).forEach((d) => { contagemHoje[d.severidade] = d.quantidade; });

  const alvoGraveCritico = contagemHoje.grave + contagemHoje.critico;
  const inicioGraveCritico = Math.min(total, Math.round(alvoGraveCritico * 1.6));
  const ratioCriticoHoje = alvoGraveCritico > 0 ? contagemHoje.critico / alvoGraveCritico : 0.5;
  const restanteHoje = contagemHoje.sem_ocorrencia + contagemHoje.leve;
  const ratioLeveHoje = restanteHoje > 0 ? contagemHoje.leve / restanteHoje : 0.5;
  const amplitudeOscilacao = Math.max(1, Math.round(total * 0.1));

  const snapshots: SeveridadeSnapshot[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const data = new Date(referencia);
    data.setDate(data.getDate() - i);
    const dataISO = data.toISOString().slice(0, 10);

    if (i === 0) {
      snapshots.push({ data: dataISO, contagens: { ...contagemHoje } });
      continue;
    }

    const progresso = (dias - 1 - i) / (dias - 1);
    const base = inicioGraveCritico + (alvoGraveCritico - inicioGraveCritico) * progresso;
    const oscilacao = Math.round(Math.sin(i * 0.9) * amplitudeOscilacao);
    const graveCritico = Math.max(0, Math.min(total, Math.round(base) + oscilacao));

    const critico = Math.round(graveCritico * ratioCriticoHoje);
    const grave = graveCritico - critico;
    const restante = total - graveCritico;
    const leve = Math.round(restante * ratioLeveHoje);
    const semOcorrencia = restante - leve;

    snapshots.push({
      data: dataISO,
      contagens: { sem_ocorrencia: semOcorrencia, leve, grave, critico },
    });
  }

  return snapshots;
}

/** Converte a lista atual de KanbanItem em contagens por severidade (usado pelo HistoricoContext). */
export function contagensPorSeveridade(itens: KanbanItem[]): Record<SeveridadeVegetacao, number> {
  const out: Record<SeveridadeVegetacao, number> = { sem_ocorrencia: 0, leve: 0, grave: 0, critico: 0 };
  distribuicaoPorSeveridade(itens).forEach((d) => { out[d.severidade] = d.quantidade; });
  return out;
}

// ─── Filtro por rodovia (compartilhado pelos filtros da tela) ──────────────────

export function filtrarPorRodovia<T extends { rodovia: string }>(lista: T[], rodovia: string | 'Todas'): T[] {
  if (rodovia === 'Todas') return lista;
  return lista.filter((item) => item.rodovia === rodovia);
}
