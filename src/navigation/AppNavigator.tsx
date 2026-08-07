import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import LoginScreen from '../screens/LoginScreen';
import EquipesScreen from '../screens/EquipesScreen';
import OcorrenciasScreen from '../screens/OcorrenciasScreen';
import DetalheScreen from '../screens/DetalheScreen';
import KanbanScreen from '../screens/KanbanScreen';
import ConfiguracoesScreen from '../screens/ConfiguracoesScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login"       component={LoginScreen}       />
        <Stack.Screen name="Equipes"     component={EquipesScreen}     />
        <Stack.Screen name="Kanban"      component={KanbanScreen}      />
<Stack.Screen name="Ocorrencias" component={OcorrenciasScreen} />
        <Stack.Screen name="Detalhe"     component={DetalheScreen}     />
        <Stack.Screen name="Configuracoes" component={ConfiguracoesScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
