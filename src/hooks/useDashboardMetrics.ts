// Conecta o KanbanContext/EquipesContext ao módulo puro de métricas do Dashboard.
// Os componentes de tela só devem consumir este hook — nenhuma fórmula deve
// aparecer solta em JSX de tela.
import { useMemo } from 'react';
import { useKanban } from '../context/KanbanContext';
import { useEquipes } from '../context/EquipesContext';
import { SeveridadeSnapshot } from '../types';
import {
  contarTrechosCriticos,
  contarEquipesEmCampo,
  percentualCumprimentoSLA,
  tempoMedioRespostaDias,
  distribuicaoPorSeveridade,
  rankearTrechos,
  gerarRecomendacoes,
  serieTendenciaGraveCritico,
  deltaTrechosCriticos,
  filtrarPorRodovia,
  DistribuicaoSeveridade,
  TrechoRanking,
  Recomendacao,
  PontoTendencia,
} from '../utils/dashboardMetrics';

export type RodoviaFiltro = 'Todas' | 'BR-116' | 'BR-381' | 'SP-280';
export type PeriodoFiltroDias = 7 | 30 | 90;

type UseDashboardMetricsParams = {
  rodovia: RodoviaFiltro;
  periodoDias: PeriodoFiltroDias;
  /** Histórico de contagens diárias, usado no gráfico de tendência (fonte definida na Etapa 6). */
  snapshots?: SeveridadeSnapshot[];
  limiteRecomendacoes?: number;
};

export type DashboardMetrics = {
  trechosCriticos: number;
  equipesEmCampo: number;
  totalEquipesAtivas: number;
  /** null quando não há trecho elegível para SLA (evita divisão por zero). */
  percentualSLA: number | null;
  /** null hoje — bloqueado por falta de log de transição de severidade (ver dashboardMetrics.ts). */
  tempoMedioResposta: number | null;
  distribuicao: DistribuicaoSeveridade[];
  ranking: TrechoRanking[];
  recomendacoes: Recomendacao[];
  tendencia: PontoTendencia[];
  /** Variação de trechos críticos vs. `periodoDias` atrás; null sem histórico suficiente. */
  deltaTrechosCriticos: number | null;
};

export function useDashboardMetrics({
  rodovia,
  periodoDias,
  snapshots = [],
  limiteRecomendacoes = 5,
}: UseDashboardMetricsParams): DashboardMetrics {
  const { itens } = useKanban();
  const { equipes } = useEquipes();

  return useMemo(() => {
    const itensFiltrados = filtrarPorRodovia(itens, rodovia);
    const equipesFiltradas = filtrarPorRodovia(equipes, rodovia);
    const { emCampo, totalAtivas } = contarEquipesEmCampo(equipesFiltradas);

    return {
      trechosCriticos: contarTrechosCriticos(itensFiltrados),
      equipesEmCampo: emCampo,
      totalEquipesAtivas: totalAtivas,
      percentualSLA: percentualCumprimentoSLA(itensFiltrados),
      tempoMedioResposta: tempoMedioRespostaDias(itensFiltrados),
      distribuicao: distribuicaoPorSeveridade(itensFiltrados),
      ranking: rankearTrechos(itensFiltrados),
      recomendacoes: gerarRecomendacoes(itensFiltrados, limiteRecomendacoes),
      tendencia: serieTendenciaGraveCritico(snapshots, periodoDias),
      deltaTrechosCriticos: deltaTrechosCriticos(snapshots, periodoDias),
    };
  }, [itens, equipes, rodovia, periodoDias, snapshots, limiteRecomendacoes]);
}
