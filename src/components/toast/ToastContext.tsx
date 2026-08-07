import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ToastType = 'success' | 'error' | 'info';

type ToastContextType = {
  showToast: (mensagem: string, tipo?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

type ToastItem = {
  id: number;
  mensagem: string;
  tipo: ToastType;
};

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((mensagem: string, tipo: ToastType = 'success') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, mensagem, tipo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Renderiza os toasts no topo (fixo) */}
      <View style={style.wrap} pointerEvents="none">
        {toasts.map((toast) => (
          <ToastView key={toast.id} toast={toast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastView({ toast }: { toast: ToastItem }) {
  const cor = {
    success: '#16A34A',
    error: '#EF4444',
    info: '#3B82F6',
  }[toast.tipo];
  const icone = {
    success: 'checkmark-circle',
    error: 'alert-circle',
    info: 'information-circle',
  }[toast.tipo] as any;

  return (
    <View style={[style.toast, { borderLeftColor: cor }]}>
      <Ionicons name={icone} size={18} color={cor} />
      <Text style={style.texto}>{toast.mensagem}</Text>
    </View>
  );
}

const style = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: 420,
    ...(Platform.OS === 'web' ? { width: 'fit-content' } as any : {}),
  },
  texto: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginLeft: 8,
    flexShrink: 1,
  },
});

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider');
  return ctx;
}
