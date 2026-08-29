import { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { PapelUsuario } from '../../types';
import { useUsuarios } from '../../context/UsuariosContext';
import { useEquipes } from '../../context/EquipesContext';
import { useConfiguracoes } from '../../context/ConfiguracoesContext';
import { useToast } from '../toast/ToastContext';
import SectionCard from './SectionCard';

const perfilLogo = require('../../../assets/images/perfil_logo.png');

const PAPEL_LABEL: Record<PapelUsuario, string> = {
  admin: 'Admin',
  gestor: 'Gestor',
  operador_campo: 'Operador de Campo',
};

const PAPEL_COR: Record<PapelUsuario, string> = {
  admin: '#5E22F3',
  gestor: '#3B82F6',
  operador_campo: '#F59E0B',
};

const PAPEL_BG: Record<PapelUsuario, string> = {
  admin: '#EDE9FE',
  gestor: '#DBEAFE',
  operador_campo: '#FEF3C7',
};

const PAPEL_OPTS: PapelUsuario[] = ['admin', 'gestor', 'operador_campo'];

export default function UsuariosSection() {
  const { usuarios, adicionarUsuario, editarUsuario, removerUsuario } = useUsuarios();
  const { equipes } = useEquipes();
  const { registrarAtividade } = useConfiguracoes();
  const { showToast } = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId]   = useState<number | null>(null);
  const [confirmarRemover, setConfirmarRemover] = useState<number | null>(null);

  // Campos do formulário
  const [fNome,   setFNome]   = useState('');
  const [fUsuario, setFUsuario] = useState('');
  const [fEmail,  setFEmail]  = useState('');
  const [fSenha,  setFSenha]  = useState('');
  const [fPapel,  setFPapel]  = useState<PapelUsuario>('operador_campo');
  const [fEquipeId, setFEquipeId] = useState<string | null>(null);
  const [erroNome,    setErroNome]    = useState<string | null>(null);
  const [erroUsuario, setErroUsuario] = useState<string | null>(null);
  const [erroSenha,   setErroSenha]   = useState<string | null>(null);
  const [erroEquipe,  setErroEquipe]  = useState<string | null>(null);
  const [erroUsuarioDup, setErroUsuarioDup] = useState<string | null>(null);

  function abrirAdicionar() {
    setEditandoId(null);
    setFNome(''); setFUsuario(''); setFEmail(''); setFSenha('');
    setFPapel('operador_campo'); setFEquipeId(null);
    setErroNome(null); setErroUsuario(null); setErroSenha(null); setErroEquipe(null); setErroUsuarioDup(null);
    setModalAberto(true);
  }

  function abrirEditar(id: number) {
    const u = usuarios.find((x) => x.id === id);
    if (!u) return;
    setEditandoId(id);
    setFNome(u.nome); setFUsuario(u.usuario); setFEmail(u.email ?? ''); setFSenha('');
    setFPapel(u.papel); setFEquipeId(u.equipeId ?? null);
    setErroNome(null); setErroUsuario(null); setErroSenha(null); setErroEquipe(null); setErroUsuarioDup(null);
    setModalAberto(true);
  }

  function validarNome(v: string): string | null {
    return v.trim() === '' ? 'O nome é obrigatório.' : null;
  }
  function validarUsuario(v: string): string | null {
    return v.trim() === '' ? 'O login é obrigatório.' : null;
  }
  function validarSenha(v: string): string | null {
    if (editandoId !== null && v === '') return null; // edição: em branco = mantém a atual
    if (v.length < 6) return 'A senha deve ter no mínimo 6 caracteres.';
    return null;
  }
  function validarEquipe(v: string | null, papel: PapelUsuario): string | null {
    if (papel === 'operador_campo' && !v) return 'Selecione a equipe do operador.';
    return null;
  }

  function salvar() {
    const eNome    = validarNome(fNome);
    const eUsuario = validarUsuario(fUsuario);
    const eSenha   = validarSenha(fSenha);
    const eEquipe  = validarEquipe(fEquipeId, fPapel);
    setErroNome(eNome);
    setErroUsuario(eUsuario);
    setErroSenha(eSenha);
    setErroEquipe(eEquipe);
    setErroUsuarioDup(null);
    if (eNome || eUsuario || eSenha || eEquipe) return;

    const usuarioExistente = editandoId !== null ? usuarios.find((u) => u.id === editandoId) : null;
    const dados = {
      nome: fNome.trim(),
      usuario: fUsuario.trim(),
      email: fEmail.trim() || undefined,
      senha: fSenha !== '' ? fSenha : (usuarioExistente?.senha ?? fSenha),
      cargo: PAPEL_LABEL[fPapel],
      papel: fPapel,
      equipeId: fPapel === 'operador_campo' ? (fEquipeId ?? undefined) : undefined,
    };

    if (editandoId === null) {
      const ok = adicionarUsuario(dados);
      if (!ok) { setErroUsuarioDup('Este login já está em uso.'); return; }
      registrarAtividade(`Adicionou o usuário "${fNome.trim()}" (${PAPEL_LABEL[fPapel]})`);
      showToast('Usuário adicionado com sucesso!');
    } else {
      const ok = editarUsuario(editandoId, dados);
      if (!ok) { setErroUsuarioDup('Este login já está em uso por outro usuário.'); return; }
      registrarAtividade(`Editou o usuário "${fNome.trim()}"`);
      showToast('Usuário atualizado com sucesso!');
    }
    setModalAberto(false);
  }

  function confirmarRemocao() {
    if (confirmarRemover === null) return;
    const u = usuarios.find((x) => x.id === confirmarRemover);
    removerUsuario(confirmarRemover);
    registrarAtividade(`Removeu o usuário "${u?.nome ?? ''}"`);
    showToast('Usuário removido.');
    setConfirmarRemover(null);
  }

  return (
    <SectionCard icone="shield-checkmark-outline" titulo="Gestão de Usuários e Permissões" cor="#8B5CF6">
      {/* Botão adicionar */}
      <TouchableOpacity style={styles.btnAdd} onPress={abrirAdicionar} activeOpacity={0.85}>
        <Ionicons name="person-add-outline" size={15} color="#fff" />
        <Text style={styles.btnAddTxt}>Adicionar usuário</Text>
      </TouchableOpacity>

      {/* Tabela */}
      <View style={styles.table}>
        {/* Header */}
        <View style={styles.thead}>
          <Text style={[styles.th, styles.thUsuario]}>Usuário</Text>
          <Text style={[styles.th, styles.thLogin]}>Login</Text>
          <Text style={[styles.th, styles.thPapel]}>Papel</Text>
          <Text style={[styles.th, styles.thAcoes]}>Ações</Text>
        </View>

        {/* Linhas */}
        {usuarios.map((u) => (
          <View key={u.id} style={styles.trow}>
            <View style={[styles.td, styles.thUsuario, styles.cellUsuario]}>
              <Image source={perfilLogo} style={styles.avatar} resizeMode="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.tdNome}>{u.nome}</Text>
                {u.papel === 'operador_campo' && u.equipeId ? (
                  <Text style={styles.tdSub}>{u.equipeId}</Text>
                ) : null}
              </View>
            </View>
            <Text style={[styles.td, styles.thLogin, styles.tdEmail]} numberOfLines={1}>{u.usuario}</Text>
            <View style={[styles.td, styles.thPapel]}>
              <View style={[styles.papelPill, { backgroundColor: PAPEL_BG[u.papel] }]}>
                <View style={[styles.papelDot, { backgroundColor: PAPEL_COR[u.papel] }]} />
                <Text style={[styles.papelTxt, { color: PAPEL_COR[u.papel] }]}>{PAPEL_LABEL[u.papel]}</Text>
              </View>
            </View>
            <View style={[styles.td, styles.thAcoes, styles.cellAcoes]}>
              <TouchableOpacity style={styles.acBtnEdit} onPress={() => abrirEditar(u.id)}>
                <Ionicons name="create-outline" size={13} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.acBtnDel} onPress={() => setConfirmarRemover(u.id)}>
                <Ionicons name="trash-outline" size={13} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Modal adicionar/editar usuário */}
      <Modal visible={modalAberto} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitulo}>
                {editandoId === null ? 'Adicionar usuário' : 'Editar usuário'}
              </Text>
              <TouchableOpacity onPress={() => setModalAberto(false)}>
                <Ionicons name="close" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={[styles.input, erroNome && styles.inputErro]}
                value={fNome}
                onChangeText={(t) => { setFNome(t); if (erroNome) setErroNome(validarNome(t)); }}
                placeholder="Nome completo"
                placeholderTextColor={colors.gray400}
              />
              {erroNome ? <Text style={styles.erro}>{erroNome}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Login</Text>
              <TextInput
                style={[styles.input, (erroUsuario || erroUsuarioDup) && styles.inputErro]}
                value={fUsuario}
                onChangeText={(t) => { setFUsuario(t); if (erroUsuario) setErroUsuario(validarUsuario(t)); setErroUsuarioDup(null); }}
                placeholder="ex: operador3"
                placeholderTextColor={colors.gray400}
                autoCapitalize="none"
              />
              {erroUsuario ? <Text style={styles.erro}>{erroUsuario}</Text> : null}
              {erroUsuarioDup ? <Text style={styles.erro}>{erroUsuarioDup}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>E-mail (opcional)</Text>
              <TextInput
                style={styles.input}
                value={fEmail}
                onChangeText={setFEmail}
                placeholder="usuario@motiva.com"
                placeholderTextColor={colors.gray400}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{editandoId === null ? 'Senha' : 'Nova senha (opcional)'}</Text>
              <TextInput
                style={[styles.input, erroSenha && styles.inputErro]}
                value={fSenha}
                onChangeText={(t) => { setFSenha(t); if (erroSenha) setErroSenha(validarSenha(t)); }}
                placeholder={editandoId === null ? 'Mínimo 6 caracteres' : 'Deixe em branco para manter a atual'}
                placeholderTextColor={colors.gray400}
                secureTextEntry
              />
              {erroSenha ? <Text style={styles.erro}>{erroSenha}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Papel</Text>
              <View style={styles.chipRow}>
                {PAPEL_OPTS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chip, fPapel === p && { backgroundColor: PAPEL_COR[p], borderColor: PAPEL_COR[p] }]}
                    onPress={() => { setFPapel(p); setErroEquipe(null); }}
                  >
                    <Text style={[styles.chipTxt, fPapel === p && styles.chipTxtOn]}>{PAPEL_LABEL[p]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {fPapel === 'operador_campo' && (
              <View style={styles.field}>
                <Text style={styles.label}>Equipe</Text>
                <View style={styles.chipRow}>
                  {equipes.map((eq) => (
                    <TouchableOpacity
                      key={eq.id}
                      style={[styles.chip, fEquipeId === eq.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => { setFEquipeId(eq.id); setErroEquipe(null); }}
                    >
                      <Text style={[styles.chipTxt, fEquipeId === eq.id && styles.chipTxtOn]}>{eq.nome}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {erroEquipe ? <Text style={styles.erro}>{erroEquipe}</Text> : null}
              </View>
            )}

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setModalAberto(false)}>
                <Text style={styles.modalBtnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnOk} onPress={salvar}>
                <Text style={styles.modalBtnOkTxt}>{editandoId === null ? 'Adicionar' : 'Salvar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal confirmação remoção */}
      <Modal visible={confirmarRemover !== null} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.delCard}>
            <View style={styles.delIconBox}>
              <Ionicons name="trash" size={28} color={colors.error} />
            </View>
            <Text style={styles.delTitulo}>Remover usuário</Text>
            <Text style={styles.delDesc}>
              Tem certeza que deseja remover este usuário?{'\n'}Esta ação não pode ser desfeita.
            </Text>
            <View style={styles.delBtns}>
              <TouchableOpacity style={styles.delBtnCancel} onPress={() => setConfirmarRemover(null)}>
                <Text style={styles.delBtnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.delBtnConfirm} onPress={confirmarRemocao}>
                <Ionicons name="trash-outline" size={14} color="#fff" />
                <Text style={styles.delBtnConfirmTxt}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  btnAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
  },
  btnAddTxt: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  table: {
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 10,
    overflow: 'hidden',
  },
  thead: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  th: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  thUsuario: { flex: 1.5 },
  thLogin:   { flex: 1.4 },
  thPapel:   { flex: 1.2 },
  thAcoes:   { width: 64 },
  trow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  td: {
    paddingRight: 8,
  },
  cellUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cellAcoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 8,
  },
  tdNome: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  tdEmail: {
    fontSize: 11,
    color: '#94A3B8',
  },
  tdSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  papelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
    alignSelf: 'flex-start',
  },
  papelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  papelTxt: {
    fontSize: 11,
    fontWeight: '600',
  },
  acBtnEdit: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acBtnDel: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipTxt: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  chipTxtOn: {
    color: '#fff',
    fontWeight: '700',
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  modalBtnCancelTxt: {
    color: '#64748B',
    fontWeight: '500',
    fontSize: 13,
  },
  modalBtnOk: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  modalBtnOkTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  delCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 12,
  },
  delIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  delTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.secondary,
  },
  delDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  delBtns: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  delBtnCancel: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  delBtnCancelTxt: {
    color: '#64748B',
    fontWeight: '500',
    fontSize: 13,
  },
  delBtnConfirm: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: colors.error,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  delBtnConfirmTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
