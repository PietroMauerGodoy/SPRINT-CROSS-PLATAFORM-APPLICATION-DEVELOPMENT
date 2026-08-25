import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radius } from '../theme';

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
}: Props) {
  const actions = [];

  if (showSettingsButton) {
    actions.push(
      <TouchableOpacity key="settings" style={styles.iconBtn} onPress={onSettingsPress} disabled={!onSettingsPress}>
        <Ionicons name="settings-outline" size={18} color={colors.white} />
      </TouchableOpacity>
    );
  }

  if (showLogoutButton) {
    actions.push(
      <TouchableOpacity key="logout" style={styles.iconBtn} onPress={onLogoutPress} disabled={!onLogoutPress}>
        <MaterialIcons name="logout" size={18} color={colors.white} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {showBackButton ? (
          <TouchableOpacity onPress={onBackPress} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={18} color={colors.white} />
          </TouchableOpacity>
        ) : null}

        <Image source={logoNegativo} style={styles.logo} resizeMode="contain" />

        {showMenuButton ? (
          <TouchableOpacity onPress={onMenuPress} style={styles.menuBtn}>
            <Ionicons name="menu" size={24} color={colors.white} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.right}>
        {actions.length > 0 ? <View style={styles.actionPill}>{actions}</View> : null}
        <TouchableOpacity style={styles.avatarBtn}>
          <Image source={perfilLogo} style={styles.avatar} resizeMode="cover" />
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
    backgroundColor: 'rgba(59, 14, 104, 0.18)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  logo: {
    width: 118,
    height: 30,
  },
  menuBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
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
