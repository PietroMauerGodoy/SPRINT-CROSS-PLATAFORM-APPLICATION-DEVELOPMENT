import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EquipesScreen from '../screens/EquipesScreen';
import OcorrenciasScreen from '../screens/OcorrenciasScreen';
import DetalheScreen from '../screens/DetalheScreen';
import KanbanScreen from '../screens/KanbanScreen';
import ConfiguracoesScreen from '../screens/ConfiguracoesScreen';
import TrechosScreen from '../screens/TrechosScreen';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Guard centralizado de autenticação: enquanto não há usuário logado, só a
// rota Login existe na pilha — nenhuma outra tela é alcançável, nem por
// navegação programática, porque as demais nem são registradas no navigator.
// Assim que o usuário loga (ou desloga), o React Navigation troca a pilha
// inteira automaticamente, sem precisar de navigation.replace() manual
// espalhado pelas telas.
export default function AppNavigator() {
  const { usuario, isHydrated } = useAuth();

  if (!isHydrated) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {usuario ? (
          <>
            <Stack.Screen name="Dashboard"     component={DashboardScreen}     />
            <Stack.Screen name="Equipes"       component={EquipesScreen}       />
            <Stack.Screen name="Kanban"        component={KanbanScreen}        />
            <Stack.Screen name="Ocorrencias"   component={OcorrenciasScreen}   />
            <Stack.Screen name="Detalhe"       component={DetalheScreen}       />
            <Stack.Screen name="Configuracoes" component={ConfiguracoesScreen} />
            <Stack.Screen name="Trechos"       component={TrechosScreen}       />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3B0FA6' },
});
