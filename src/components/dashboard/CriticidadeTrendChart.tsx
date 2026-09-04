import { Fragment, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { PontoTendencia } from '../../utils/dashboardMetrics';

// Mesma cor do "crítico" no Kanban (sevCor() em KanbanScreen.tsx) — a linha
// representa grave + crítico, então usamos a cor do nível mais grave dos dois.
const COR_LINHA = '#DC2626';
const COR_SUPERFICIE = '#3B0FA6'; // mesma cor de fundo do root da tela (anel dos marcadores)
const COR_PIOROU = '#F87171';
const COR_MELHOROU = '#4ADE80';
const COR_ESTAVEL = 'rgba(255,255,255,0.6)';

type Props = {
  pontos: PontoTendencia[];
  height?: number;
};

function formatarDataCurta(dataISO: string): string {
  const [, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}`;
}

function formatarDataLonga(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

/** Gera ticks "redondos" do eixo Y entre 0 e max (ex: [0,1,2,3] ou [0,2,4,6,8]). */
function gerarTicksEixoY(max: number): number[] {
  if (max <= 4) {
    return Array.from({ length: max + 1 }, (_, i) => i);
  }
  const passo = Math.ceil(max / 4);
  const ticks: number[] = [];
  for (let v = 0; v <= max; v += passo) ticks.push(v);
  if (ticks[ticks.length - 1] !== max) ticks.push(max);
  return ticks;
}

export default function CriticidadeTrendChart({ pontos, height = 160 }: Props) {
  const [selecionado, setSelecionado] = useState<number | null>(null);

  if (pontos.length === 0) {
    return (
      <View style={[s.empty, { height }]}>
        <Text style={s.emptyTxt}>Sem histórico suficiente para este período ainda.</Text>
      </View>
    );
  }

  const paddingV = 28; // espaço extra no topo pro rótulo do último ponto não cortar
  const paddingEsq = 22; // espaço pros rótulos do eixo Y
  const larguraGrafico = Math.max(240, pontos.length * 28);
  const width = larguraGrafico + paddingEsq;
  const valores = pontos.map((p) => p.gravesCriticos);
  const max = Math.max(1, ...valores);
  const ticksY = gerarTicksEixoY(max);

  const pontosSvg = pontos.map((p, i) => {
    const x = paddingEsq + (pontos.length === 1 ? larguraGrafico / 2 : (i / (pontos.length - 1)) * larguraGrafico);
    const y = height - paddingV - (p.gravesCriticos / max) * (height - paddingV * 2);
    return { x, y, valor: p.gravesCriticos, data: p.data };
  });

  const linha = pontosSvg.map((p) => `${p.x},${p.y}`).join(' ');
  const baseY = height - paddingV;
  const ultimo = pontosSvg[pontosSvg.length - 1];
  const primeiro = pontosSvg[0];
  const ativo = selecionado !== null ? pontosSvg[selecionado] : null;

  // Variação dentro do período exibido (último ponto vs. primeiro) — dá pro
  // usuário entender a tendência sem precisar clicar em cada ponto.
  const variacao = ultimo.valor - primeiro.valor;
  const corVariacao = variacao > 0 ? COR_PIOROU : variacao < 0 ? COR_MELHOROU : COR_ESTAVEL;
  const iconeVariacao = variacao > 0 ? 'arrow-up' : variacao < 0 ? 'arrow-down' : 'remove';
  const textoVariacao =
    variacao === 0
      ? 'Sem variação no período'
      : `${variacao > 0 ? '+' : ''}${variacao} vs. início do período`;

  // Mostra no máximo ~6 rótulos no eixo X pra não empilhar texto.
  const passoRotuloX = Math.max(1, Math.ceil(pontos.length / 6));

  return (
    <View>
      <Text style={s.legenda}>
        Quantidade de trechos com vegetação em estado grave ou crítico, dia a dia — quanto mais alto, mais trechos precisam de atenção.
      </Text>

      <View style={s.resumoRow}>
        <View>
          <Text style={s.resumoValor}>{ultimo.valor}</Text>
          <Text style={s.resumoLbl}>trecho{ultimo.valor === 1 ? '' : 's'} grave/crítico hoje</Text>
        </View>
        <View style={[s.variacaoPill, { borderColor: corVariacao }]}>
          <Ionicons name={iconeVariacao as any} size={12} color={corVariacao} />
          <Text style={[s.variacaoTxt, { color: corVariacao }]}>{textoVariacao}</Text>
        </View>
      </View>

      {ativo && (
        <View style={s.tooltip}>
          <Text style={s.tooltipData}>{formatarDataLonga(ativo.data)}</Text>
          <Text style={s.tooltipValor}>{ativo.valor} trecho{ativo.valor === 1 ? '' : 's'} grave/crítico</Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <Svg width={width} height={height}>
            {/* Linhas de grade + rótulos do eixo Y, pra dar escala numérica ao gráfico */}
            {ticksY.map((tick) => {
              const y = height - paddingV - (tick / max) * (height - paddingV * 2);
              return (
                <Fragment key={`grid-${tick}`}>
                  <Line x1={paddingEsq} y1={y} x2={width} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
                  <SvgText x={paddingEsq - 6} y={y + 3} fill="rgba(255,255,255,0.4)" fontSize={9} textAnchor="end">
                    {tick}
                  </SvgText>
                </Fragment>
              );
            })}

            <Line x1={paddingEsq} y1={baseY} x2={width} y2={baseY} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
            <Polyline points={linha} fill="none" stroke={COR_LINHA} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {/* Rótulo direto só no ponto de hoje (o extremo) — nada de número em cada ponto */}
            <SvgText
              x={ultimo.x}
              y={Math.max(12, ultimo.y - 12)}
              fill="#fff"
              fontSize={11}
              fontWeight="700"
              textAnchor={pontosSvg.length > 1 ? 'end' : 'middle'}
            >
              {ultimo.valor}
            </SvgText>

            {pontosSvg.map((p, i) => (
              <Circle
                key={p.data}
                cx={p.x}
                cy={p.y}
                r={selecionado === i ? 6 : 4}
                fill={COR_LINHA}
                stroke={COR_SUPERFICIE}
                strokeWidth={2}
              />
            ))}
          </Svg>

          {/* Alvos de toque maiores que o marcador visual, cobrindo cada ponto */}
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {pontosSvg.map((p, i) => (
              <Pressable
                key={p.data}
                onPress={() => setSelecionado((atual) => (atual === i ? null : i))}
                hitSlop={8}
                style={{ position: 'absolute', left: p.x - 12, top: p.y - 12, width: 24, height: 24 }}
              />
            ))}
          </View>

          <View style={[s.eixoX, { width }]}>
            {pontosSvg.map((p, i) => {
              const mostrar = i === 0 || i === pontosSvg.length - 1 || i % passoRotuloX === 0;
              if (!mostrar) return null;
              const esquerda = Math.max(0, Math.min(width - 28, p.x - 14));
              return (
                <Text key={p.data} style={[s.eixoTxt, { position: 'absolute', left: esquerda, width: 28, textAlign: 'center' }]}>
                  {formatarDataCurta(p.data)}
                </Text>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyTxt: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },

  legenda: { fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 16, marginBottom: 10 },

  resumoRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 },
  resumoValor: { fontSize: 26, fontWeight: '800', color: '#fff', lineHeight: 30 },
  resumoLbl: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  variacaoPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  variacaoTxt: { fontSize: 11, fontWeight: '700' },

  eixoX: { height: 16, marginTop: 6, position: 'relative' },
  eixoTxt: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },

  tooltip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  tooltipData: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  tooltipValor: { fontSize: 12, color: '#fff', fontWeight: '700', marginTop: 1 },
});
