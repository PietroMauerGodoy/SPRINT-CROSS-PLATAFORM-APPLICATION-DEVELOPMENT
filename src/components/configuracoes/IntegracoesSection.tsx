import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { useConfiguracoes } from '../../context/ConfiguracoesContext';
import { useToast } from '../toast/ToastContext';
import SectionCard from './SectionCard';
import { mockOcorrencias, mockEquipes } from '../../data/mockData';

export default function IntegracoesSection() {
  const { apiClimaConectada, setApiClimaConectada, registrarAtividade } = useConfiguracoes();
  const { showToast } = useToast();

  function baixarArquivo(nome: string, conteudo: string, tipo: string) {
    const blob = new Blob([conteudo], { type: tipo });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportarRelatorioCSV() {
    // Gera CSV a partir de ocorrências e equipes mockadas
    const linhas: string[] = [];
    linhas.push('Tipo;Item;Metadados;Status');
    mockOcorrencias.forEach((o) => {
      linhas.push(`Ocorrência;${o.titulo};${o.local} (${o.categoria});risco ${o.risco}`);
    });
    mockEquipes.forEach((e) => {
      linhas.push(`Equipe;${e.nome};${e.rodovia} ${e.km};${e.status}`);
    });
    const csv = linhas.join('\n');
    baixarArquivo('relatorio_operacional.csv', csv, 'text/csv;charset=utf-8;');
    registrarAtividade('Gerou relatório operacional (CSV)');
    showToast('Relatório exportado com sucesso! (CSV)');
  }

  return (
    <SectionCard icone="cloud-outline" titulo="Integrações" cor="#0EA5E9">
      {/* Status API de clima */}
      <View style={styles.statusRow}>
        <View style={styles.statusIconBox}>
          <Ionicons name="partly-sunny-outline" size={18} color="#0EA5E9" />
        </View>
        <View style={styles.statusInfo}>
          <Text style={styles.statusTitulo}>API de Clima</Text>
          <Text style={styles.statusSub}>Provedor de dados meteorológicos para análise de criticidade</Text>
        </View>
        <View style={styles.statusRight}>
          <View style={[styles.connPill, { backgroundColor: apiClimaConectada ? '#DCFCE7' : '#FEE2E2' }]}>
            <View style={[styles.connDot, { backgroundColor: apiClimaConectada ? '#22C55E' : '#EF4444' }]} />
            <Text style={[styles.connTxt, { color: apiClimaConectada ? '#15803D' : '#B91C1C' }]}>
              {apiClimaConectada ? 'Conectado' : 'Desconectado'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.connToggle}
            onPress={() => setApiClimaConectada(!apiClimaConectada)}
            activeOpacity={0.8}
          >
            <Text style={styles.connToggleTxt}>
              {apiClimaConectada ? 'Desconectar' : 'Conectar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Exportar relatórios */}
      <View style={styles.exportRow}>
        <View style={styles.exportIconBox}>
          <Ionicons name="document-attach-outline" size={18} color="#5E22F3" />
        </View>
        <View style={styles.exportInfo}>
          <Text style={styles.exportTitulo}>Exportar relatórios</Text>
          <Text style={styles.exportSub}>Gere relatórios operacionais em CSV</Text>
        </View>
        {Platform.OS === 'web' ? (
          <TouchableOpacity style={styles.exportBtn} onPress={exportarRelatorioCSV} activeOpacity={0.85}>
            <Ionicons name="download-outline" size={14} color="#fff" />
            <Text style={styles.exportBtnTxt}>Exportar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.exportBtn} onPress={exportarRelatorioCSV} activeOpacity={0.85}>
            <Ionicons name="download-outline" size={14} color="#fff" />
            <Text style={styles.exportBtnTxt}>Exportar</Text>
          </TouchableOpacity>
        )}
      </View>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  statusSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  statusRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  connPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 5,
  },
  connDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  connTxt: {
    fontSize: 11,
    fontWeight: '600',
  },
  connToggle: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  connToggleTxt: {
    fontSize: 11,
    color: '#0EA5E9',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exportInfo: {
    flex: 1,
  },
  exportTitulo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  exportSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 5,
  },
  exportBtnTxt: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
});
