import './global.css';

import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from '@/navigation/RootNavigator';
import { AuthProvider } from '@/core/auth/AuthContext';
import { NetworkProvider } from '@/core/network/NetworkProvider';
import { SyncProvider } from '@/features/sync/presentation/SyncProvider';

export default function App() {
  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <AuthProvider>
          <SyncProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </SyncProvider>
        </AuthProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}
