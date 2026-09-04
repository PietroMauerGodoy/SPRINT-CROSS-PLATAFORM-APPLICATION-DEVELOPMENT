import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';
import NotificacoesBell from './NotificacoesBell';
import { useAuth } from '../context/AuthContext';

const logoNegativo = require('../../assets/images/Motiva_Logo-Negativo.png');
const perfilLogo = require('../../assets/images/perfil_logo.png');

type Props = {
  title?: string;
  onMenuPress?: () => void;
  onSettingsPress?: () => void;
  onLogoutPress?: () => void;
  onBackPress?: () => void;
  showMenuButton?: boolean;
  showBackButton?: boolean;
  showSettingsButton?: boolean;
  showLogoutButton?: boolean;
  showThemeButton?: boolean;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  showNotificationsButton?: boolean;
};

export default function AppHeader({
  title,
  onMenuPress,
  onSettingsPress,
  onLogoutPress,
  onBackPress,
  showMenuButton = true,
  showBackButton = false,
  showSettingsButton = true,
  showLogoutButton = true,
  showThemeButton = true,
  isDarkMode = false,
  onToggleTheme,
  showNotificationsButton = true,
}: Props) {
  const { usuario } = useAuth();
  const avatarPerfil = usuario?.avatar ?? null;

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {showBackButton ? (
          <TouchableOpacity onPress={onBackPress} style={styles.plainIconBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.white} />
          </TouchableOpacity>
        ) : null}

        <Image source={logoNegativo} style={styles.logo} resizeMode="contain" />

        {showMenuButton ? (
          <TouchableOpacity onPress={onMenuPress} style={styles.plainIconBtn}>
            <Ionicons name="menu" size={24} color={colors.white} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.right}>
        <View style={styles.actionPill}>
          {showThemeButton ? (
            <>
              <TouchableOpacity
                style={styles.plainIconBtn}
                onPress={onToggleTheme}
                disabled={!onToggleTheme}
              >
                <Ionicons
                  name={isDarkMode ? 'moon-outline' : 'sunny-outline'}
                  size={20}
                  color={colors.white}
                />
              </TouchableOpacity>
              <View style={styles.divider} />
            </>
          ) : null}

          {showNotificationsButton ? (
            <>
              <View style={styles.notifSlot}>
                <NotificacoesBell />
              </View>
              <View style={styles.divider} />
            </>
          ) : null}

          {showSettingsButton ? (
            <>
              <TouchableOpacity style={styles.plainIconBtn} onPress={onSettingsPress} disabled={!onSettingsPress}>
                <Ionicons name="settings-outline" size={20} color={colors.white} />
              </TouchableOpacity>
              <View style={styles.divider} />
            </>
          ) : null}

          {showLogoutButton ? (
            <TouchableOpacity style={styles.plainIconBtn} onPress={onLogoutPress} disabled={!onLogoutPress}>
              <MaterialIcons name="logout" size={20} color={colors.white} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.avatarBtn}>
          <Image source={avatarPerfil ? { uri: avatarPerfil } : perfilLogo} style={styles.avatar} resizeMode="cover" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    paddingHorizontal: 22,
    paddingVertical: 14,
    zIndex: 100000,
    elevation: 100,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 118,
    height: 30,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 100000,
    elevation: 100,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    zIndex: 100000,
    elevation: 100,
  },
  plainIconBtn: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  notifSlot: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100000,
    elevation: 100,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: '#fff',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
});