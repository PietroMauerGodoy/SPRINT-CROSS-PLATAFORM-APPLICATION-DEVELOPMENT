import { useState } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useConfiguracoes } from '../../context/ConfiguracoesContext';
import { useAuth } from '../../context/AuthContext';
import { useUsuarios } from '../../context/UsuariosContext';
import { useToast } from '../toast/ToastContext';
import SectionCard from './SectionCard';

const perfilLogo = require('../../../assets/images/perfil_logo.png');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PerfilSection() {
  const { registrarAtividade } = useConfiguracoes();
  const { usuario, atualizarUsuarioLogado } = useAuth();
  const { editarUsuario } = useUsuarios();
  const { showToast } = useToast();

  // Rascunhos locais para os campos (commit só ao salvar) — inicializados com
  // o usuário REAL logado, não um valor fixo desconectado.
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [erroEmail, setErroEmail] = useState<string | null>(null);

  // Modal senha
  const [modalSenha, setModalSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erroSenhaAtual, setErroSenhaAtual] = useState<string | null>(null);
  const [erroNovaSenha, setErroNovaSenha] = useState<string | null>(null);
  const [erroConfirmar, setErroConfirmar] = useState<string | null>(null);

  // Upload avatar — parte do próprio usuário (Usuario.avatar), não uma
  // preferência global: cada conta tem sua própria foto, não uma só pro
  // navegador inteiro.
  const [avatarPreview, setAvatarPreview] = useState<string | null>(usuario?.avatar ?? null);

  function validarNome(v: string): string | null {
    if (v.trim() === '') return 'O nome não pode ficar vazio.';
    return null;
  }

  function validarEmail(v: string): string | null {
    if (v.trim() === '') return 'O e-mail é obrigatório.';
    if (!EMAIL_REGEX.test(v.trim())) return 'E-mail em formato inválido.';
    return null;
  }

  function salvar() {
    if (!usuario) return;
    const eNome = validarNome(nome);
    const eEmail = validarEmail(email);
    setErroNome(eNome);
    setErroEmail(eEmail);
    if (eNome || eEmail) return;

    const dados = { ...usuario, nome: nome.trim(), email: email.trim() };
    const { id, ...resto } = dados;
    const ok = editarUsuario(usuario.id, resto);
    if (!ok) { setErroEmail('Não foi possível salvar — tente novamente.'); return; }
    atualizarUsuarioLogado({ nome: nome.trim(), email: email.trim() });
    registrarAtividade('Atualizou os dados do perfil (nome/e-mail)');
    showToast('Perfil salvo com sucesso!');
  }

  // Upload de imagem do avatar (preview local via FileReader)
  function handleAvatarUpload(e: any) {
    if (!usuario) return;
    const file = e?.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setAvatarPreview(url);
      const { id, ...resto } = usuario;
      editarUsuario(usuario.id, { ...resto, avatar: url });
      atualizarUsuarioLogado({ avatar: url });
      registrarAtividade('Atualizou a foto do perfil');
      showToast('Avatar atualizado!');
    };
    reader.readAsDataURL(file);
  }

  function abrirModalSenha() {
    setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('');
    setErroSenhaAtual(null); setErroNovaSenha(null); setErroConfirmar(null);
    setModalSenha(true);
  }

  function confirmarSenhaAlterada() {
    if (!usuario) return;
    let ok = true;
    if (senhaAtual.trim() === '') { setErroSenhaAtual('Informe a senha atual.'); ok = false; }
    else if (senhaAtual !== usuario.senha) { setErroSenhaAtual('Senha atual incorreta.'); ok = false; }
    if (novaSenha.length < 6) { setErroNovaSenha('A nova senha deve ter no mínimo 6 caracteres.'); ok = false; }
    if (novaSenha !== confirmarSenha) { setErroConfirmar('A confirmação não confere com a nova senha.'); ok = false; }
    if (!ok) return;

    const { id, ...resto } = usuario;
    editarUsuario(usuario.id, { ...resto, senha: novaSenha });
    atualizarUsuarioLogado({ senha: novaSenha });
    setModalSenha(false);
    registrarAtividade('Alterou a senha da conta');
    showToast('Senha alterada com sucesso!');
  }

  return (
    <SectionCard icone="person-circle-outline" titulo="Perfil e Conta" cor="#5E22F3">
      {/* Avatar + nome + email */}
      <View style={styles.perfilRow}>
        <View style={styles.avatarWrap}>
          <Image source={avatarPreview ? { uri: avatarPreview } : perfilLogo} style={styles.avatar} resizeMode="cover" />
          {Platform.OS === 'web' ? (
            <>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                id="avatar-upload"
                onChange={handleAvatarUpload}
              />
              <TouchableOpacity
                style={styles.avatarEdit}
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => {
                  const input = document.getElementById('avatar-upload') as HTMLInputElement | null;
                  input?.click();
                }}
              >
                <Ionicons name="camera" size={15} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.avatarEdit} activeOpacity={0.8} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="camera" size={15} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.perfilInfo}>
          <Text style={styles.perfilNome}>{nome.trim() || 'Seu nome'}</Text>
          <Text style={styles.perfilEmail}>{email.trim() || 'seu@email.com'}</Text>
        </View>
      </View>

      {/* Campos editáveis */}
      <View style={styles.field}>
        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={[styles.input, erroNome && styles.inputErro]}
          value={nome}
          onChangeText={(t) => { setNome(t); if (erroNome) setErroNome(validarNome(t)); }}
          onBlur={() => setErroNome(validarNome(nome))}
          placeholder="Seu nome"
          placeholderTextColor={colors.gray400}
        />
        {erroNome ? <Text style={styles.erro}>{erroNome}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={[styles.input, erroEmail && styles.inputErro]}
          value={email}
          onChangeText={(t) => { setEmail(t); if (erroEmail) setErroEmail(validarEmail(t)); }}
          onBlur={() => setErroEmail(validarEmail(email))}
          placeholder="seu@email.com"
          placeholderTextColor={colors.gray400}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {erroEmail ? <Text style={styles.erro}>{erroEmail}</Text> : null}
      </View>

      {/* Botão salvar */}
      <TouchableOpacity style={styles.btnSalvar} onPress={salvar} activeOpacity={0.85}>
        <Ionicons name="save-outline" size={15} color="#fff" />
        <Text style={styles.btnSalvarTxt}>Salvar</Text>
      </TouchableOpacity>

      {/* Botão alterar senha */}
      <TouchableOpacity style={styles.btnSenha} onPress={abrirModalSenha} activeOpacity={0.85}>
        <Ionicons name="key-outline" size={15} color={colors.primary} />
        <Text style={styles.btnSenhaTxt}>Alterar senha</Text>
      </TouchableOpacity>

      {/* Modal alterar senha */}
      <Modal visible={modalSenha} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitulo}>Alterar senha</Text>
              <TouchableOpacity onPress={() => setModalSenha(false)}>
                <Ionicons name="close" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Senha atual</Text>
              <TextInput
                style={[styles.input, erroSenhaAtual && styles.inputErro]}
                value={senhaAtual}
                onChangeText={setSenhaAtual}
                secureTextEntry
                placeholder="••••••"
                placeholderTextColor={colors.gray400}
              />
              {erroSenhaAtual ? <Text style={styles.erro}>{erroSenhaAtual}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nova senha</Text>
              <TextInput
                style={[styles.input, erroNovaSenha && styles.inputErro]}
                value={novaSenha}
                onChangeText={setNovaSenha}
                secureTextEntry
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.gray400}
              />
              {erroNovaSenha ? <Text style={styles.erro}>{erroNovaSenha}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirmar nova senha</Text>
              <TextInput
                style={[styles.input, erroConfirmar && styles.inputErro]}
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry
                placeholder="Repita a nova senha"
                placeholderTextColor={colors.gray400}
              />
              {erroConfirmar ? <Text style={styles.erro}>{erroConfirmar}</Text> : null}
            </View>

            <TouchableOpacity style={styles.modalBtnConfirmar} onPress={confirmarSenhaAlterada}>
              <Text style={styles.modalBtnTxt}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  perfilRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarEdit: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    cursor: 'pointer',
  } as any,
  avatarEditLabel: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    cursor: 'pointer',
  } as any,
  perfilInfo: {
    flex: 1,
  },
  perfilNome: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary,
  },
  perfilEmail: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  field: {
    gap: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.secondary,
    outlineStyle: 'none',
  } as any,
  inputErro: {
    borderColor: '#EF4444',
  },
  erro: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '500',
  },
  btnSalvar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  btnSalvarTxt: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  btnSenha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  btnSenhaTxt: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    gap: 14,
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary,
  },
  modalBtnConfirmar: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 4,
  },
  modalBtnTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
