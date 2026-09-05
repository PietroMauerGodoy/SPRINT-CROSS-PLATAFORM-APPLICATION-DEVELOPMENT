import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ImageBackground,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AppHeader from '../components/AppHeader';
import TrechoMapa from '../components/trechos/TrechoMapa';
import { colors } from '../theme';
import { KanbanItem, RootStackParamList, SeveridadeVegetacao, ClimaAtual } from '../types';
import { useKanban } from '../context/KanbanContext';
import { useAuth } from '../context/AuthContext';
import { getKanbanItemsVisiveis, podeVerItemMenuOperacional, ITENS_MENU_SEM_TELA } from '../utils/permissions';
import { buscarClimaAtual, descreverTempo } from '../services/climaService';
import { SEVERIDADE_LABEL } from '../utils/dashboardMetrics';

import bgRoxo from '../../assets/images/backgroundroxo.png';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Trechos'>;
};

const SEVERIDADE_COR: Record<SeveridadeVegetacao, string> = {
  sem_ocorrencia: '#7C3AED',
  leve: '#16A34A',
  grave: '#D97706',
  critico: '#DC2626',
};

const RODOVIA_OPTS_FIXAS = ['Todas'];

export default function TrechosScreen({ navigation }: Props) {
  const { usuario, logout } = useAuth();
  const { itens } = useKanban();
  const mostrarOperacional = usuario ? podeVerItemMenuOperacional(usuario) : false;

  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const [busca, setBusca] = useState('');
  const [rodoviaFiltro, setRodoviaFiltro] = useState('Todas');
  const [dropRodovia, setDropRodovia] = useState(false);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [clima, setClima] = useState<ClimaAtual | null>(null);
  const [climaCarregando, setClimaCarregando] = useState(false);
  const [climaErro, setClimaErro] = useState<string | null>(null);

  const trechosDoUsuario = useMemo(
    () => (usuario ? getKanbanItemsVisiveis(usuario, itens) : itens),
    [usuario, itens],
  );

  const rodoviasDisponiveis = useMemo(() => {
    const unicas = Array.from(new Set(trechosDoUsuario.map((t) => t.rodovia)));
    return [...RODOVIA_OPTS_FIXAS, ...unicas];
  }, [trechosDoUsuario]);

  const filtrados = useMemo(() => {
    const t = busca.toLowerCase();
    return trechosDoUsuario.filter((item) =>
      (rodoviaFiltro === 'Todas' || item.rodovia === rodoviaFiltro) &&
      (item.nomeEquipe.toLowerCase().includes(t) || item.rodovia.toLowerCase().includes(t)),
    );
  }, [trechosDoUsuario, busca, rodoviaFiltro]);

  const selecionado = filtrados.find((t) => t.id === selecionadoId) ?? null;

  // Seleciona o primeiro trecho da lista automaticamente ao carregar/filtrar
  useEffect(() => {
    if (filtrados.length === 0) {
      setSelecionadoId(null);
      return;
    }
    if (!filtrados.some((t) => t.id === selecionadoId)) {
      setSelecionadoId(filtrados[0].id);
    }
  }, [filtrados, selecionadoId]);

  // Busca o clima real (Open-Meteo) sempre que o trecho selecionado mudar
  useEffect(() => {
    if (!selecionado) return;
    let ignore = false;
    setClimaCarregando(true);
    setClimaErro(null);
    buscarClimaAtual(selecionado.lat, selecionado.lon)
      .then((res) => { if (!ignore) setClima(res); })
      .catch(() => { if (!ignore) setClimaErro('Não foi possível carregar o clima agora.'); })
      .finally(() => { if (!ignore) setClimaCarregando(false); });
    return () => { ignore = true; };
  }, [selecionado?.id]);

  function selecionarTrecho(item: KanbanItem) {
    setSelecionadoId(item.id);
  }

  return (
    <View style={s.root}>
      <ImageBackground source={bgRoxo} style={StyleSheet.absoluteFill} resizeMode="cover" imageStyle={s.bgFill} />

      <AppHeader
        title="Trechos"
        onMenuPress={() => setSidebarAberta((v) => !v)}
        onSettingsPress={() => navigation.navigate('Configuracoes')}
        onLogoutPress={() => setShowLogout(true)}
      />

      <View style={s.body}>
        {sidebarAberta && (
          <View style={s.sidebar}>
            {[
              { icon: 'grid-outline',      label: 'Dashboard',    ativo: false, onPress: () => navigation.navigate('Dashboard') },
              { icon: 'people-outline',    label: 'Equipes',      ativo: false, onPress: () => navigation.navigate('Equipes') },
              { icon: 'albums-outline',    label: 'Kanban',       ativo: false, onPress: () => navigation.navigate('Kanban') },
              { icon: 'warning-outline',   label: 'Ocorrências',  ativo: false, onPress: () => navigation.navigate('Ocorrencias') },
              { icon: 'map-outline',       label: 'Trechos',      ativo: true,  onPress: undefined },
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
                  <Ionicons name={item.icon as any} size={18} color={item.ativo ? '#fff' : 'rgba(255,255,255,0.5)'} />
                </View>
                <Text style={[s.sideLabel, item.ativo && s.sideLabelAtivo]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={s.content}>
          <View style={s.titleRow}>
            <View>
              <Text style={s.titulo}>Trechos</Text>
              <Text style={s.subtitulo}>Mapa e condições climáticas em tempo real por trecho</Text>
            </View>
          </View>

          {/* Toolbar */}
          <View style={s.toolbarRow}>
            <View style={s.searchBox}>
              <Ionicons name="search-outline" size={15} color="rgba(255,255,255,0.5)" />
              <TextInput
                style={s.searchInput}
                placeholder="Buscar por equipe ou rodovia..."
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={busca}
                onChangeText={setBusca}
              />
            </View>

            <View style={s.dropWrap}>
              <TouchableOpacity style={[s.dropdown, dropRodovia && s.dropdownOpen]} onPress={() => setDropRodovia((v) => !v)}>
                <View>
                  <Text style={s.dropLbl}>Rodovia</Text>
                  <Text style={s.dropVal}>{rodoviaFiltro}</Text>
                </View>
                <Ionicons name={dropRodovia ? 'chevron-up' : 'chevron-down'} size={12} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
              {dropRodovia && (
                <View style={s.dropMenu}>
                  {rodoviasDisponiveis.map((r) => (
                    <TouchableOpacity key={r} style={[s.dropItem, rodoviaFiltro === r && s.dropItemOn]} onPress={() => { setRodoviaFiltro(r); setDropRodovia(false); }}>
                      <Text style={[s.dropItemTxt, rodoviaFiltro === r && s.dropItemTxtOn]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Mapa + painel lateral */}
          <View style={s.mainRow}>
            <View style={s.mapaBox}>
              <TrechoMapa trechos={filtrados} selecionadoId={selecionadoId} onSelecionar={selecionarTrecho} />
            </View>

            <View style={s.painel}>
              {selecionado ? (
                <>
                  <View style={s.painelHead}>
                    <View style={[s.sevDot, { backgroundColor: SEVERIDADE_COR[selecionado.severidade] }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.painelTitulo}>{selecionado.nomeEquipe}</Text>
                      <Text style={s.painelSub}>{selecionado.rodovia} · Km {selecionado.kmInicio}-{selecionado.kmFim}</Text>
                    </View>
                  </View>

                  <View style={s.painelInfoRow}>
                    <Text style={s.painelInfoLbl}>Severidade</Text>
                    <Text style={[s.painelInfoVal, { color: SEVERIDADE_COR[selecionado.severidade] }]}>
                      {SEVERIDADE_LABEL[selecionado.severidade]}
                    </Text>
                  </View>
                  <View style={s.painelInfoRow}>
                    <Text style={s.painelInfoLbl}>Vegetação</Text>
                    <Text style={s.painelInfoVal}>{selecionado.tipoVegetacao} ({selecionado.alturaAtual}cm)</Text>
                  </View>

                  <View style={s.divider} />

                  <Text style={s.climaTitulo}>Clima agora</Text>
                  {climaCarregando ? (
                    <Text style={s.climaCarregando}>Consultando Open-Meteo...</Text>
                  ) : climaErro ? (
                    <Text style={s.climaErro}>{climaErro}</Text>
                  ) : clima ? (
                    <View>
                      <View style={s.climaHero}>
                        <Ionicons name={descreverTempo(clima.codigoTempo).icone as any} size={34} color="#fff" />
                        <View>
                          <Text style={s.climaTemp}>{Math.round(clima.temperaturaC)}°C</Text>
                          <Text style={s.climaDesc}>{descreverTempo(clima.codigoTempo).label}</Text>
                        </View>
                      </View>
                      <View style={s.climaGrid}>
                        <View style={s.climaItem}>
                          <Ionicons name="rainy-outline" size={14} color="rgba(255,255,255,0.6)" />
                          <Text style={s.climaItemTxt}>{clima.precipitacaoMm} mm</Text>
                        </View>
                        <View style={s.climaItem}>
                          <Ionicons name="speedometer-outline" size={14} color="rgba(255,255,255,0.6)" />
                          <Text style={s.climaItemTxt}>{Math.round(clima.ventoKmh)} km/h</Text>
                        </View>
                        <View style={s.climaItem}>
                          <Ionicons name="water-outline" size={14} color="rgba(255,255,255,0.6)" />
                          <Text style={s.climaItemTxt}>{Math.round(clima.umidadePct)}% umidade</Text>
                        </View>
                      </View>
                    </View>
                  ) : null}

                  <View style={s.divider} />
                </>
              ) : (
                <Text style={s.painelVazio}>Selecione um trecho no mapa ou na lista abaixo.</Text>
              )}

              <ScrollView style={s.listaTrechos} showsVerticalScrollIndicator={false}>
                {filtrados.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[s.listaItem, t.id === selecionadoId && s.listaItemOn]}
                    onPress={() => selecionarTrecho(t)}
                  >
                    <View style={[s.sevDot, { backgroundColor: SEVERIDADE_COR[t.severidade] }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.listaItemTitulo} numberOfLines={1}>{t.nomeEquipe}</Text>
                      <Text style={s.listaItemSub} numberOfLines={1}>{t.rodovia} · Km {t.kmInicio}-{t.kmFim}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {filtrados.length === 0 && (
                  <Text style={s.painelVazio}>Nenhum trecho encontrado.</Text>
                )}
              </ScrollView>
            </View>
          </View>
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
              <TouchableOpacity style={[s.delBtnConfirm, { backgroundColor: colors.primary }]} onPress={() => { setShowLogout(false); logout(); }}>
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

  content: { flex: 1, paddingVertical: 8, paddingBottom: 24 },

  titleRow:  { marginBottom: 16 },
  titulo:    { fontSize: 20, fontWeight: '800', color: '#fff' },
  subtitulo: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3 },

  toolbarRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', zIndex: 30, marginBottom: 14, gap: 8 },
  searchBox:  { flex: 1, minWidth: 200, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', height: 38 },
  searchInput:{ flex: 1, fontSize: 12, color: '#fff', marginLeft: 8, outlineStyle: 'none' } as any,
  dropWrap:   { position: 'relative', zIndex: 40 },
  dropdown:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, minWidth: 150, height: 38 },
  dropdownOpen:{ backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.35)' },
  dropLbl:    { fontSize: 9, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 },
  dropVal:    { fontSize: 13, color: '#fff', fontWeight: '600', marginTop: 1 },
  dropMenu:   { position: 'absolute', top: 46, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 14 },
  dropItem:   { paddingHorizontal: 14, paddingVertical: 10 },
  dropItemOn: { backgroundColor: '#EDE9FE' },
  dropItemTxt:{ fontSize: 13, color: colors.secondary },
  dropItemTxtOn:{ color: colors.primary, fontWeight: '600' },

  mainRow: { flex: 1, flexDirection: 'row', gap: 16 },
  mapaBox: { flex: 1.6, borderRadius: 16, overflow: 'hidden', minHeight: 420 },

  painel: { flex: 1, minWidth: 260, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16 },
  painelHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  painelTitulo: { fontSize: 15, fontWeight: '700', color: '#fff' },
  painelSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  painelVazio: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingVertical: 16 },

  sevDot: { width: 10, height: 10, borderRadius: 5 },

  painelInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  painelInfoLbl: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  painelInfoVal: { fontSize: 12, color: '#fff', fontWeight: '600' },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 12 },

  climaTitulo: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  climaCarregando: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  climaErro: { fontSize: 12, color: '#FCA5A5' },
  climaHero: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  climaTemp: { fontSize: 26, fontWeight: '800', color: '#fff' },
  climaDesc: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  climaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  climaItem: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  climaItemTxt: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },

  listaTrechos: { flex: 1 },
  listaItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 8, marginBottom: 2 },
  listaItemOn: { backgroundColor: 'rgba(255,255,255,0.08)' },
  listaItemTitulo: { fontSize: 12, color: '#fff', fontWeight: '600' },
  listaItemSub: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 1 },

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
