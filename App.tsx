import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { NotificacoesProvider } from './src/context/NotificacoesContext';
import { EquipesProvider } from './src/context/EquipesContext';
import { KanbanProvider } from './src/context/KanbanContext';
import { ConfiguracoesProvider } from './src/context/ConfiguracoesContext';
import { OcorrenciasProvider } from './src/context/OcorrenciasContext';
import { ToastProvider } from './src/components/toast/ToastContext';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ToastProvider>
        <ConfiguracoesProvider>
          <NotificacoesProvider>
            <EquipesProvider>
              <KanbanProvider>
                <OcorrenciasProvider>
                  <AppNavigator />
                </OcorrenciasProvider>
              </KanbanProvider>
            </EquipesProvider>
          </NotificacoesProvider>
        </ConfiguracoesProvider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
