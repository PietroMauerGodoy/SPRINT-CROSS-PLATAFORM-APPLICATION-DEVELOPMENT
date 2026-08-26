import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  Image,
  ActivityIndicator,
  Keyboard,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius } from '../theme';
import { RootStackParamList } from '../types';
import { mockUsuarios } from '../data/mockData';

import bgRoxo from '../../assets/images/backgroundroxo.png';
import logoNegativo from '../../assets/images/Motiva_Logo-Negativo.png';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

type Erros = {
  usuario?: string;
  senha?: string;
  geral?: string;
};

export default function LoginScreen({ navigation }: Props) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [focado, setFocado] = useState<'usuario' | 'senha' | null>(null);

  const senhaRef = useRef<TextInput>(null);

  function validar(): boolean {
    const novosErros: Erros = {};

    if (!usuario.trim()) {
      novosErros.usuario = 'Informe o nome de usuário';
    }
    if (!senha.trim()) {
      novosErros.senha = 'Informe a senha';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function handleLogin() {
    Keyboard.dismiss();

    if (!validar()) return;

    setLoading(true);
    setErros({});

    setTimeout(() => {
      const encontrado = mockUsuarios.find(
        (u) => u.usuario === usuario.trim() && u.senha === senha
      );

      setLoading(false);

      if (encontrado) {
        navigation.replace('Equipes');
      } else {
        setErros({ geral: 'Usuário ou senha incorretos. Verifique os dados e tente novamente.' });
      }
    }, 800);
  }

  function handleChangeUsuario(text: string) {
    setUsuario(text);
    if (erros.usuario) setErros((e) => ({ ...e, usuario: undefined }));
  }

  function handleChangeSenha(text: string) {
    setSenha(text);
    if (erros.senha) setErros((e) => ({ ...e, senha: undefined }));
  }

  return (
    <ImageBackground source={bgRoxo} style={styles.root} resizeMode="cover" imageStyle={styles.bgImage}>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
        >
            <View style={styles.card}>
              <View style={styles.logoContainer}>
                <Image
                  source={logoNegativo}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.title}>Bem vindo!</Text>

              {/* Erro geral (credenciais inválidas) */}
              {erros.geral && (
                <View style={styles.erroGeralBox}>
                  <Text style={styles.erroGeralText}>⚠ {erros.geral}</Text>
                </View>
              )}

              {/* Campo usuário */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nome de usuário</Text>
                <TextInput
                  style={[
                    styles.input,
                    focado === 'usuario' && styles.inputFocado,
                    erros.usuario ? styles.inputErro : null,
                  ]}
                  placeholder="Usuário..."
                  placeholderTextColor={colors.gray400}
                  value={usuario}
                  onChangeText={handleChangeUsuario}
                  onFocus={() => setFocado('usuario')}
                  onBlur={() => setFocado(null)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => senhaRef.current?.focus()}
                />
                {erros.usuario && (
                  <Text style={styles.erroTexto}>⚠ {erros.usuario}</Text>
                )}
              </View>

              {/* Campo senha */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Senha</Text>
                <TextInput
                  ref={senhaRef}
                  style={[
                    styles.input,
                    focado === 'senha' && styles.inputFocado,
                    erros.senha ? styles.inputErro : null,
                  ]}
                  placeholder="Senha..."
                  placeholderTextColor={colors.gray400}
                  value={senha}
                  onChangeText={handleChangeSenha}
                  onFocus={() => setFocado('senha')}
                  onBlur={() => setFocado(null)}
                  secureTextEntry={!mostrarSenha}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                {erros.senha && (
                  <Text style={styles.erroTexto}>⚠ {erros.senha}</Text>
                )}
              </View>

              {/* Mostrar senha */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setMostrarSenha(!mostrarSenha)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, mostrarSenha && styles.checkboxChecked]}>
                  {mostrarSenha && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Mostrar Senha</Text>
              </TouchableOpacity>

              {/* Botão login */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7} onPress={() => Linking.openURL('https://www.motiva.com.br')}>
                <Text style={styles.forgotText}>
                  Esqueceu o login? Contate o suporte!
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#3D0FA8',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  logo: {
    width: 180,
    height: 56,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  erroGeralBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  erroGeralText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '500',
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.white,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: colors.secondary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputFocado: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  inputErro: {
    borderColor: colors.error,
    backgroundColor: '#FFF5F5',
  },
  erroTexto: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 13,
    color: colors.white,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  forgotText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
});
