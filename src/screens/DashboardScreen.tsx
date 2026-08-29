import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ImageBackground, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppHeader from '../components/AppHeader';
import KpiCard from '../components/dashboard/KpiCard';
import SeveridadeDonutChart from '../components/dashboard/SeveridadeDonutChart';
import CriticidadeTrendChart from '../components/dashboard/CriticidadeTrendChart';
import RankingTrechosList from '../components/dashboard/RankingTrechosList';
import { colors } from '../theme';
import { RootStackParamList } from '../types';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useHistorico } from '../context/HistoricoContext';
import { useAuth } from '../context/AuthContext';
import { podeVerItemMenuOperacional, ITENS_MENU_SEM_TELA } from '../utils/permissions';

import bgRoxo from '../../assets/images/backgroundroxo.png';

function formatarPercentual(v: number | null): string {
  return v === null ? '—' : `${Math.round(v)}%`;
}

function formatarDias(v: number | null): string {
  return v === null ? '—' : `${v} dia${v === 1 ? '' : 's'}`;
}

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

export default function DashboardScreen({ navigation }: Props) {
  const { usuario, logout } = useAuth();
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [showLogout, setShowLogout] = useState(false);

  // Filtros de rodovia/período chegam na Etapa 9 — por ora, valores fixos.
  const { snapshots } = useHistorico();
  const metrics = useDashboardMetrics({ usuario, rodovia: 'Todas', periodoDias: 30, snapshots });
  const ehOperadorCampo = usuario?.papel === 'operador_campo';
  const mostrarOperacional = usuario ? podeVerItemMenuOperacional(usuario) : false;

  return (
    <View style={s.root}>
      <ImageBackground source={bgRoxo} style={StyleSheet.absoluteFill} resizeMode="cover" imageStyle={s.bgFill} />

      <AppHeader
        title="Dashboard"
        onMenuPress={() => setSidebarAberta((v) => !v)}
        onSettingsPress={() => navigation.navigate('Configuracoes')}
        onLogoutPress={() => setShowLogout(true)}
      />

      <View style={s.body}>
        {sidebarAberta && (
          <View style={s.sidebar}>
            {[
              { icon: 'grid-outline',      label: 'Dashboard',    ativo: true,  onPress: undefined },
              { icon: 'people-outline',    label: 'Equipes',      ativo: false, onPress: () => navigation.navigate('Equipes') },
              { icon: 'albums-outline',    label: 'Kanban',       ativo: false, onPress: () => navigation.navigate('Kanban') },
              { icon: 'warning-outline',   label: 'Ocorrências',  ativo: false, onPress: () => navigation.navigate('Ocorrencias') },
              { icon: 'map-outline',       label: 'Trechos',      ativo: false, onPress: undefined },
              { icon: 'calendar-outline',  label: 'Planejamento', ativo: false, onPress: undefined },
              { icon: 'bar-chart-outline', label: 'Relatórios',   ativo: false, onPress: undefined },
              { icon: 'settings-outline',  label: 'Config.',      ativo: false, onPress: () => navigation.navigate('Configuracoes') },
            ].filter((item) => mostrarOperacional || !ITENS_MENU_SEM_TELA.includes(item.label)).map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[s.sideItem, item.ativo && s.sideItemAtivo]}
                onPress={item.onPress}
              >
                <View style={s.sideItemIcon}>
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={item.ativo ? '#fff' : 'rgba(255,255,255,0.5)'}
                  />
                </View>
                <Text style={[s.sideLabel, item.ativo && s.sideLabelAtivo]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={s.content}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
            <View style={s.titleRow}>
              <View>
                <Text style={s.titulo}>Dashboard Operacional</Text>
                <Text style={s.subtitulo}>
                  {ehOperadorCampo
                    ? `Visão reduzida — dados da sua equipe${usuario?.equipeId ? ` (${usuario.equipeId})` : ''}`
                    : 'Onde agir agora, e por quê'}
                </Text>
              </View>
            </View>

            <View style={s.kpiRow}>
              <KpiCard
                icone="alert-circle-outline"
                cor={colors.error}
                valor={String(metrics.trechosCriticos)}
                label="Trechos críticos ativos"
                delta={
                  metrics.deltaTrechosCriticos !== null
                    ? { valor: metrics.deltaTrechosCriticos, maiorEhMelhor: false, periodoLabel: 'vs. 30 dias atrás' }
                    : undefined
                }
              />
              <KpiCard
                icone="people-outline"
                cor={colors.primary}
                valor={`${metrics.equipesEmCampo}/${metrics.totalEquipesAtivas}`}
                label="Equipes em campo"
                sublabel="em campo / total ativas"
              />
              <KpiCard
                icone="shield-checkmark-outline"
                cor={colors.success}
                valor={formatarPercentual(metrics.percentualSLA)}
                label="Cumprimento de SLA"
              />
              <KpiCard
                icone="time-outline"
                cor={colors.warning}
                valor={formatarDias(metrics.tempoMedioResposta)}
                label="Tempo médio de resposta"
                sublabel={metrics.tempoMedioResposta === null ? 'sem dado suficiente' : undefined}
              />
            </View>

            {metrics.temHistoricoConfiavel && (
              <View style={s.sectionCard}>
                <Text style={s.sectionTitulo}>Tendência — trechos grave + crítico (últimos 30 dias)</Text>
                <CriticidadeTrendChart pontos={metrics.tendencia} />
              </View>
            )}

            <View style={s.sectionCard}>
              <Text style={s.sectionTitulo}>Distribuição atual por severidade</Text>
              <SeveridadeDonutChart distribuicao={metrics.distribuicao} />
            </View>

            <View style={s.sectionCard}>
              <Text style={s.sectionTitulo}>Ranking de priorização</Text>
              <RankingTrechosList
                ranking={metrics.ranking}
                onPressItem={(item) => navigation.navigate('Kanban', { abrirDetalheId: item.id })}
              />
            </View>

            <View style={s.placeholderBox}>
              <Ionicons name="stats-chart-outline" size={32} color="rgba(255,255,255,0.3)" />
              <Text style={s.placeholderTxt}>Em construção — recomendações automáticas chegam na próxima etapa.</Text>
            </View>
          </ScrollView>
        </View>
      </View>

      <Modal visible={showLogout} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.delCard}>
            <View style={[s.delIconBox, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="log-out-outline" size={26} color={colors.primary} />
            </View>
            <Text style={s.delTitulo}>Encerrar sessão</Text>
            <Text style={s.delDesc}>{'Tem certeza que deseja sair?\nVocê será redirecionado para o login.'}</Text>
            <View style={s.delBtns}>
              <TouchableOpacity style={s.delBtnCancel} onPress={() => setShowLogout(false)}>
                <Text style={s.delBtnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.delBtnConfirm, { backgroundColor: colors.primary }]} onPress={() => {
                setShowLogout(false);
                logout();
                navigation.replace('Login');
              }}>
                <Ionicons name="log-out-outline" size={14} color="#fff" />
                <Text style={s.delBtnConfirmTxt}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#3B0FA6' },
  bgFill: { width: '100%', height: '100%' },

  body:    { flex: 1, flexDirection: 'row', paddingHorizontal: 48, paddingBottom: 16 },
  sidebar: { width: 160, marginRight: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 12 },
  sideItem:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginVertical: 2 },
  sideItemIcon:  { marginRight: 10 },
  sideItemAtivo: { backgroundColor: colors.primary },
  sideLabel:     { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  sideLabelAtivo:{ color: '#fff', fontWeight: '700' },

  content:       { flex: 1 },
  scrollContent: { paddingVertical: 8, paddingBottom: 24 },

  titleRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  titulo:    { fontSize: 20, fontWeight: '800', color: '#fff' },
  subtitulo: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3 },

  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },

  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitulo: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 14 },

  placeholderBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  placeholderTxt: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', maxWidth: 280 },

  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  delCard:        { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 370, alignItems: 'center' },
  delIconBox:     { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  delTitulo:      { fontSize: 18, fontWeight: '700', color: colors.secondary, marginBottom: 6 },
  delDesc:        { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  delBtns:        { flexDirection: 'row', width: '100%' },
  delBtnCancel:   { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 11, alignItems: 'center', marginRight: 10 },
  delBtnCancelTxt:{ color: '#475569', fontWeight: '600', fontSize: 13 },
  delBtnConfirm:  { flex: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  delBtnConfirmTxt:{ color: '#fff', fontWeight: '700', fontSize: 13 },
});
