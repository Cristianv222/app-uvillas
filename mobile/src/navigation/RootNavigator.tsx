import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/core/auth/AuthContext';
import { LoginScreen } from '@/features/auth/presentation/screens/LoginScreen';
import { RegisterScreen } from '@/features/auth/presentation/screens/RegisterScreen';
import { CatalogScreen } from '@/features/catalog/presentation/screens/CatalogScreen';
import { DiseaseDetailScreen } from '@/features/catalog/presentation/screens/DiseaseDetailScreen';
import { FarmsScreen } from '@/features/farms/presentation/screens/FarmsScreen';
import { HistoryScreen } from '@/features/history/presentation/screens/HistoryScreen';
import { ScanDetailScreen } from '@/features/history/presentation/screens/ScanDetailScreen';
import { ReportsScreen } from '@/features/reports/presentation/screens/ReportsScreen';
import { ScanScreen } from '@/features/scan/presentation/screens/ScanScreen';
import { SettingsScreen } from '@/features/settings/presentation/screens/SettingsScreen';
import { BookOpen, Camera, ChartColumn, History, Settings } from '@/ui/icons';

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#F5F7F5', primary: '#2F7340' } };
const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const TAB_ICONS = { Scan: Camera, History, Catalog: BookOpen, Reports: ChartColumn, Settings } as const;
const TAB_LABELS: Record<string, string> = { Scan: 'Cámara', History: 'Historial', Catalog: 'Enfermedades', Reports: 'Reportes', Settings: 'Ajustes' };

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false, // solo iconos
        tabBarActiveTintColor: '#2F7340',
        tabBarInactiveTintColor: '#A9B3AD',
        tabBarAccessibilityLabel: TAB_LABELS[route.name],
        tabBarIcon: ({ color, size }) => {
          const Icon = TAB_ICONS[route.name as keyof typeof TAB_ICONS];
          return <Icon color={color} size={size + 2} />;
        },
      })}
    >
      <Tabs.Screen name="Scan" component={ScanScreen} />
      <Tabs.Screen name="History" component={HistoryScreen} />
      <Tabs.Screen name="Catalog" component={CatalogScreen} />
      <Tabs.Screen name="Reports" component={ReportsScreen} />
      <Tabs.Screen name="Settings" component={SettingsScreen} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const { status } = useAuth();
  if (status === 'loading') {
    return <View className="flex-1 items-center justify-center bg-ink-50"><ActivityIndicator size="large" color="#2F7340" /></View>;
  }
  return (
    <NavigationContainer theme={theme}>
      {status === 'signedOut' ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerTintColor: '#1B2420', headerBackButtonDisplayMode: 'minimal' }}>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="ScanDetail" component={ScanDetailScreen} options={{ title: 'Diagnóstico' }} />
          <Stack.Screen name="DiseaseDetail" component={DiseaseDetailScreen} options={{ title: 'Enfermedad' }} />
          <Stack.Screen name="Farms" component={FarmsScreen} options={{ title: 'Fincas y lotes' }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
