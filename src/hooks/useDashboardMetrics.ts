// Conecta o KanbanContext/EquipesContext ao módulo puro de métricas do Dashboard.
// Os componentes de tela só devem consumir este hook — nenhuma fórmula deve
// aparecer solta em JSX de tela.
import { useMemo } from 'react';
import { useKanban } from '../context/KanbanContext';
import { useEquipes } from '../context/EquipesContext';
import { useConfiguracoes } from '../context/ConfiguracoesContext';
import { SeveridadeSnapshot, Usuario } from '../types';
import { getKanbanItemsVisiveis, getEquipesVisiveis, podeVerDashboardCompleto } from '../utils/permissions';
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
  PesosCriticidade,
} from '../utils/dashboardMetrics';

export type RodoviaFiltro = 'Todas' | 'BR-116' | 'BR-381' | 'SP-330';
export type PeriodoFiltroDias = 7 | 30 | 90;

type UseDashboardMetricsParams = {
  /** null durante a hidratação do AuthContext — o hook devolve métricas vazias nesse caso. */
  usuario: Usuario | null;
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
  /** false para Operador de Campo — o histórico (snapshots) é agregado de toda a malha,
   *  não por equipe, então tendência/delta não podem ser calculados de forma confiável
   *  no escopo reduzido. A tela deve esconder essas seções quando isto for false. */
  temHistoricoConfiavel: boolean;
};

export function useDashboardMetrics({
  usuario,
  rodovia,
  periodoDias,
  snapshots = [],
  limiteRecomendacoes = 5,
}: UseDashboardMetricsParams): DashboardMetrics {
  const { itens } = useKanban();
  const { equipes } = useEquipes();
  const { pesoManutencao, pesoClima, pesoCrescimento, frequenciaReavaliacao } = useConfiguracoes();

  const pesos: PesosCriticidade = useMemo(() => {
    const freq = Number(frequenciaReavaliacao);
    return {
      pesoManutencao,
      pesoClima,
      pesoCrescimento,
      frequenciaReavaliacaoDias: Number.isFinite(freq) && freq > 0 ? freq : 30,
    };
  }, [pesoManutencao, pesoClima, pesoCrescimento, frequenciaReavaliacao]);

  return useMemo(() => {
    if (!usuario) {
      return {
        trechosCriticos: 0,
        equipesEmCampo: 0,
        totalEquipesAtivas: 0,
        percentualSLA: null,
        tempoMedioResposta: null,
        distribuicao: distribuicaoPorSeveridade([]),
        ranking: [],
        recomendacoes: [],
        tendencia: [],
        deltaTrechosCriticos: null,
        temHistoricoConfiavel: false,
      };
    }

    // Primeiro escopo por papel (RLS-ready) — Operador de Campo só enxerga a
    // própria equipe/trechos daqui em diante; depois disso, o filtro de rodovia.
    const itensDoUsuario = getKanbanItemsVisiveis(usuario, itens);
    const equipesDoUsuario = getEquipesVisiveis(usuario, equipes);
    const itensFiltrados = filtrarPorRodovia(itensDoUsuario, rodovia);
    const equipesFiltradas = filtrarPorRodovia(equipesDoUsuario, rodovia);
    const { emCampo, totalAtivas } = contarEquipesEmCampo(equipesFiltradas);
    const temHistoricoConfiavel = podeVerDashboardCompleto(usuario);

    return {
      trechosCriticos: contarTrechosCriticos(itensFiltrados),
      equipesEmCampo: emCampo,
      totalEquipesAtivas: totalAtivas,
      percentualSLA: percentualCumprimentoSLA(itensFiltrados),
      tempoMedioResposta: tempoMedioRespostaDias(itensFiltrados),
      distribuicao: distribuicaoPorSeveridade(itensFiltrados),
      ranking: rankearTrechos(itensFiltrados, pesos),
      recomendacoes: gerarRecomendacoes(itensFiltrados, pesos, limiteRecomendacoes),
      tendencia: temHistoricoConfiavel ? serieTendenciaGraveCritico(snapshots, periodoDias) : [],
      deltaTrechosCriticos: temHistoricoConfiavel ? deltaTrechosCriticos(snapshots, periodoDias) : null,
      temHistoricoConfiavel,
    };
  }, [usuario, itens, equipes, rodovia, periodoDias, snapshots, limiteRecomendacoes, pesos]);
}
