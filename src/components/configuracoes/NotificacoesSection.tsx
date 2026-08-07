import { View, StyleSheet } from 'react-native';
import { useConfiguracoes } from '../../context/ConfiguracoesContext';
import SectionCard from './SectionCard';
import Toggle from './Toggle';

export default function NotificacoesSection() {
  const { notifPrefs, setNotifPref } = useConfiguracoes();

  return (
    <SectionCard icone="notifications-outline" titulo="Notificações" cor="#F59E0B">
      <Toggle
        label="Nova ocorrência crítica"
        descricao="Alerta quando uma ocorrência de alto risco é registrada"
        valor={notifPrefs.novaOcorrenciaCritica}
        onValor={(v) => setNotifPref('novaOcorrenciaCritica', v)}
      />
      <Toggle
        label="Mudança de status de equipe"
        descricao="Avise quando uma equipe muda de status (ativo, inativo, em campo)"
        valor={notifPrefs.mudancaStatusEquipe}
        onValor={(v) => setNotifPref('mudancaStatusEquipe', v)}
      />
      <Toggle
        label="Prazo de trecho vencendo"
        descricao="Avisa antes do prazo de reavaliação de um trecho vencer"
        valor={notifPrefs.prazoTrechoVencendo}
        onValor={(v) => setNotifPref('prazoTrechoVencendo', v)}
      />
      <Toggle
        label="Relatório semanal disponível"
        descricao="Notifica quando o relatório semanal de operações é gerado"
        valor={notifPrefs.relatorioSemanal}
        onValor={(v) => setNotifPref('relatorioSemanal', v)}
      />

      <View style={styles.divider} />

      <Toggle
        label="Receber também por e-mail"
        descricao="Envia as notificações selecionadas também para o seu e-mail"
        valor={notifPrefs.receberPorEmail}
        onValor={(v) => setNotifPref('receberPorEmail', v)}
      />
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
});
