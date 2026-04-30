// hooks/useNetworkStatus.ts

import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true); // optimista por defecto

  useEffect(() => {
    // Lectura inmediata al montar (para no esperar al primer evento)
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? true);
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
    });

    return unsubscribe;
  }, []);

  return { isConnected };
}
