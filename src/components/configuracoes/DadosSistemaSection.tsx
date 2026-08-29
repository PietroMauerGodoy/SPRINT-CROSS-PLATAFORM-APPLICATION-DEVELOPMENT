import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useConfiguracoes } from '../../context/ConfiguracoesContext';
import { useUsuarios } from '../../context/UsuariosContext';
import { useToast } from '../toast/ToastContext';
import SectionCard from './SectionCard';
import { mockEquipes, mockOcorrencias } from '../../data/mockData';

export default function DadosSistemaSection() {
  const {
    logAtividades, registrarAtividade,
    pesoManutencao, pesoClima, pesoCrescimento,
    frequenciaReavaliacao, limiteCriticidade, notifPrefs,
  } = useConfiguracoes();
  const { usuarios } = useUsuarios();
  const { showToast } = useToast();

  function exportarBackup() {
    // Nunca inclui a senha no backup exportável, mesmo sendo dado mockado.
    const usuariosSemSenha = usuarios.map(({ senha, ...resto }) => resto);
    const backup = {
      exportadoEm: new Date().toISOString(),
      versao: '1.0.0 (Sprint 2)',
      usuarios: usuariosSemSenha,
      equipes: mockEquipes,
      ocorrencias: mockOcorrencias,
      parametrosSistema: {
        pesoManutencao,
        pesoClima,
        pesoCrescimento,
        frequenciaReavaliacao,
        limiteCriticidade,
      },
      preferenciasNotificacoes: notifPrefs,
      logAtividades,
    };
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup_motiva.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    registrarAtividade('Exportou backup de dados do sistema');
    showToast('Backup exportado com sucesso! (JSON)');
  }

  return (
    <SectionCard icone="server-outline" titulo="Dados e Sistema" cor="#64748B">
      {/* Exportar backup */}
      <TouchableOpacity style={styles.backupBtn} onPress={exportarBackup} activeOpacity={0.85}>
        <Ionicons name="archive-outline" size={16} color="#fff" />
        <Text style={styles.backupBtnTxt}>Exportar backup de dados</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Log de atividades */}
      <Text style={styles.logTitulo}>Atividades recentes</Text>
      <View style={styles.logList}>
        {logAtividades.map((log) => (
          <View key={log.id} style={styles.logItem}>
            <View style={styles.logDot} />
            <View style={styles.logBody}>
              <Text style={styles.logAcao}>{log.acao}</Text>
              <Text style={styles.logMeta}>
                <Text style={styles.logUsuario}>{log.usuario}</Text>
                {'   ·   '}
                <Text style={styles.logData}>{log.dataHora}</Text>
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Versão */}
      <Text style={styles.versao}>Versão do sistema: 1.0.0 (Sprint 2)</Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  backupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  backupBtnTxt: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  logTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  logList: {
    gap: 10,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 5,
    marginRight: 10,
  },
  logBody: {
    flex: 1,
  },
  logAcao: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
    lineHeight: 17,
  },
  logMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  logUsuario: {
    color: colors.primary,
    fontWeight: '600',
  },
  logData: {
    color: '#94A3B8',
  },
  versao: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
  },
});
