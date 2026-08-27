import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { RootStackParamList } from '../types';
import AppHeader from '../components/AppHeader';

import PerfilSection from '../components/configuracoes/PerfilSection';
import PreferenciasSection from '../components/configuracoes/PreferenciasSection';
import NotificacoesSection from '../components/configuracoes/NotificacoesSection';
import UsuariosSection from '../components/configuracoes/UsuariosSection';
import ParametrosSistemaSection from '../components/configuracoes/ParametrosSistemaSection';
import IntegracoesSection from '../components/configuracoes/IntegracoesSection';
import DadosSistemaSection from '../components/configuracoes/DadosSistemaSection';

import bgRoxo from '../../assets/images/backgroundroxo.png';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Configuracoes'>;
};

export default function ConfiguracoesScreen({ navigation }: Props) {
  const [sidebarAberta, setSidebarAberta] = useState(true);
  const [hoverSide, setHoverSide]         = useState<string | null>(null);
  const [showLogout, setShowLogout]       = useState(false);

  return (
    <View style={s.root}>
      {/* ── BACKGROUND ROXO ──────────────────────────────────────────────── */}
      <ImageBackground source={bgRoxo} style={StyleSheet.absoluteFill} resizeMode="cover" imageStyle={s.bgFill} />

      <AppHeader
        title="Configurações"
        onMenuPress={() => setSidebarAberta((v) => !v)}
        onSettingsPress={() => navigation.navigate('Configuracoes')}
        onLogoutPress={() => setShowLogout(true)}
      />

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <View style={s.body}>
        {/* Sidebar */}
        {sidebarAberta && (
          <View style={s.sidebar}>
            {[
              { icon: 'grid-outline',      label: 'Dashboard',    onPress: () => navigation.navigate('Dashboard'), ativo: false },
              { icon: 'people-outline',    label: 'Equipes',      onPress: () => navigation.navigate('Equipes'), ativo: false },
              { icon: 'albums-outline',    label: 'Kanban',       onPress: () => navigation.navigate('Kanban'),  ativo: false },
              { icon: 'warning-outline',   label: 'Ocorrências',  onPress: () => navigation.navigate('Ocorrencias'), ativo: false },
              { icon: 'map-outline',       label: 'Trechos',      onPress: undefined,                           ativo: false },
              { icon: 'calendar-outline',  label: 'Planejamento', onPress: undefined,                           ativo: false },
              { icon: 'bar-chart-outline', label: 'Relatórios',   onPress: undefined,                           ativo: false },
              { icon: 'settings-outline',  label: 'Config.',      onPress: undefined,                           ativo: true  },
            ].map((item) => (
              <Pressable
                key={item.label}
                style={[s.sideItem, item.ativo && s.sideItemAtivo, hoverSide === item.label && !item.ativo && s.sideItemHover]}
                onPress={item.onPress}
                onHoverIn={() => setHoverSide(item.label)}
                onHoverOut={() => setHoverSide(null)}
              >
                <View style={s.sideItemIcon}>
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={item.ativo ? '#fff' : hoverSide === item.label ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'}
                  />
                </View>
                <Text style={[s.sideLabel, item.ativo && s.sideLabelAtivo, hoverSide === item.label && !item.ativo && s.sideLabelHover]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Conteúdo */}
        <View style={s.content}>
          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Título */}
            <View style={s.titleRow}>
              <View>
                <Text style={s.titulo}>Configurações</Text>
                <Text style={s.subtitulo}>
                  Personalização, parâmetros do sistema e gerenciamento da plataforma
                </Text>
              </View>
            </View>

            {/* Seções */}
            <PerfilSection />
            <PreferenciasSection />
            <NotificacoesSection />
            <UsuariosSection />
            <ParametrosSistemaSection />
            <IntegracoesSection />
            <DadosSistemaSection />
          </ScrollView>
        </View>
      </View>

{/* ── MODAL LOGOUT ─────────────────────────────────────────────────── */}
      <Modal visible={showLogout} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.delCard}>
            <View style={[s.delIconBox, { backgroundColor: '#EDE9FE' }]}>
              <MaterialIcons name="logout" size={26} color={colors.primary} />
            </View>
            <Text style={s.delTitulo}>Encerrar sessão</Text>
            <Text style={s.delDesc}>Tem certeza que deseja sair?{'\n'}Você será redirecionado para o login.</Text>
            <View style={s.delBtns}>
              <TouchableOpacity style={s.delBtnCancel} onPress={() => setShowLogout(false)}>
                <Text style={s.delBtnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.delBtnConfirm, { backgroundColor: colors.primary }]} onPress={() => navigation.replace('Login')}>
                <MaterialIcons name="logout" size={14} color="#fff" />
                <Text style={s.delBtnConfirmTxt}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#3B0FA6' },
  bgFill: { width: '100%', height: '100%' },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'transparent', paddingHorizontal: 22, paddingVertical: 10, zIndex: 10 },
  hLeft:        { flexDirection: 'row', alignItems: 'center', gap: 18 },
  hLogo:        { width: 130, height: 36 },
  hRight:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hIconPill:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  hPillBtn:     { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  hPillDivider: { width: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.15)' },
  hAvatar:      { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: colors.primary },
  hAvatarImg:   { width: '100%', height: '100%' },

  body:    { flex: 1, flexDirection: 'row', paddingHorizontal: 48, paddingVertical: 16 },
  sidebar: { width: 160, marginRight: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 12 },
  sideItem:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginVertical: 2 },
  sideItemIcon:  { marginRight: 10 },
  sideItemAtivo: { backgroundColor: colors.primary },
  sideItemHover: { backgroundColor: 'rgba(255,255,255,0.1)' },
  sideLabel:     { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  sideLabelAtivo:{ color: '#fff', fontWeight: '700' },
  sideLabelHover:{ color: 'rgba(255,255,255,0.9)' },

  content:       { flex: 1 },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 4, paddingVertical: 8, paddingBottom: 24 },

titleRow:   { marginBottom: 16 },
  titulo:     { fontSize: 20, fontWeight: '800', color: '#fff' },
  subtitulo:  { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3 },

  // Modal logout
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  delCard:        { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 360, alignItems: 'center', gap: 12 },
  delIconBox:     { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  delTitulo:      { fontSize: 18, fontWeight: '700', color: colors.secondary },
  delDesc:        { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  delBtns:        { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  delBtnCancel:   { flex: 1, paddingVertical: 11, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  delBtnCancelTxt:{ color: '#64748B', fontWeight: '500', fontSize: 13 },
  delBtnConfirm:  { flex: 1, paddingVertical: 11, borderRadius: 8, backgroundColor: colors.error, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  delBtnConfirmTxt:{ color: '#fff', fontWeight: '700', fontSize: 13 },
});
