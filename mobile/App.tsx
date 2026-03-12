import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, View, Alert, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ScreenCapture from 'expo-screen-capture';
// @ts-ignore
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';
import { authService } from './src/services/auth';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might cause some issues with this, ignore */
});

export default function App() {
  const appState = useRef(AppState.currentState);
  const [, setAppStateVisible] = useState(appState.current);
  const [appIsReady, setAppIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 1. Initial Setup & Resource Loading
  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here (with timeout)
        await Promise.race([
          authService.isAuthenticated(),
          new Promise(resolve => setTimeout(resolve, 3000))
        ]);
        // Artificially delay for a bit to show off splash
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn('Initial prepare failed:', e);
        // Don't set error here, just proceed to let the app try to load
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // 2. Hide Splash Screen when Ready
  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync().catch((err: any) => console.log('Splash hide error:', err));
    }
  }, [appIsReady]);

  // 3. Prevent Screen Capture
  useEffect(() => {
    const enableProtection = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
      } catch (err) {
        console.log('Screen capture protection failed:', err);
      }
    };
    enableProtection();

    return () => {
      try {
        ScreenCapture.allowScreenCaptureAsync();
      } catch (err) {
        // Ignore cleanup errors
      }
    };
  }, []);

  // 4. Validate Session on Resume
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        checkSession();
      }
      appState.current = nextAppState;
      setAppStateVisible(appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const checkSession = async () => {
    try {
      const isValid = await authService.validateSession();
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated && isValid === false) {
        Alert.alert('Session Expired', 'You have been logged out because you logged in on another device.');
        await authService.logout();
      }
    } catch (err) {
      console.log('Session check validation failed:', err);
    }
  };

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (!appIsReady) {
    return null; // Return null to let Splash Screen show
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <AppNavigator />
    </GestureHandlerRootView>
  );
}
