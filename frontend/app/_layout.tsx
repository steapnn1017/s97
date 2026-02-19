import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useCartStore } from '../src/store/cartStore';
import { useLanguageStore } from '../src/store/languageStore';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const initializeCart = useCartStore((state) => state.initializeCart);
  const initializeLanguage = useLanguageStore((state) => state.initializeLanguage);

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        initializeCart(),
        initializeLanguage(),
      ]);
      setIsReady(true);
    };
    init();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="shop" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="cart" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="checkout-success" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="settings" />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
