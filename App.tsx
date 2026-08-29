import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { UsuariosProvider } from './src/context/UsuariosContext';
import { NotificacoesProvider } from './src/context/NotificacoesContext';
import { EquipesProvider } from './src/context/EquipesContext';
import { KanbanProvider } from './src/context/KanbanContext';
import { HistoricoProvider } from './src/context/HistoricoContext';
import { ConfiguracoesProvider } from './src/context/ConfiguracoesContext';
import { OcorrenciasProvider } from './src/context/OcorrenciasContext';
import { ToastProvider } from './src/components/toast/ToastContext';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ToastProvider>
        <UsuariosProvider>
          <AuthProvider>
            <ConfiguracoesProvider>
              <NotificacoesProvider>
                <EquipesProvider>
                  <KanbanProvider>
                    <HistoricoProvider>
                      <OcorrenciasProvider>
                        <AppNavigator />
                      </OcorrenciasProvider>
                    </HistoricoProvider>
                  </KanbanProvider>
                </EquipesProvider>
              </NotificacoesProvider>
            </ConfiguracoesProvider>
          </AuthProvider>
        </UsuariosProvider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
