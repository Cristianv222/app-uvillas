import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useState } from 'react';

const NetworkContext = createContext<boolean>(true);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  useEffect(
    () =>
      NetInfo.addEventListener((s) => setOnline(Boolean(s.isConnected) && s.isInternetReachable !== false)),
    [],
  );
  return <NetworkContext.Provider value={online}>{children}</NetworkContext.Provider>;
}

export const useIsOnline = () => useContext(NetworkContext);
