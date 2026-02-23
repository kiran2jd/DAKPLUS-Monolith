import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState, View, PanResponder, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ScreenCapture from 'expo-screen-capture';
import AppNavigator from './src/navigation/AppNavigator';
import { authService } from './src/services/auth';

export default function App() {
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

  // 1. Prevent Screen Capture
  useEffect(() => {
    const enableProtection = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
      } catch (err) {
        console.log('Screen capture protection failed:', err);
      }
    };
    enableProtection();

    // Cleanup not strictly necessary for root app, but good practice
    return () => {
      try {
        ScreenCapture.allowScreenCaptureAsync();
      } catch (err) {
        // Ignore cleanup errors
      }
    };
  }, []);

  // 2. Validate Session on Resume
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground!
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
      // If isValid is false (and we are logged in), we should logout
      // For now, if validateSession returns false, it means either not logged in OR invalid.
      // We should only force logout if we WERE logged in.
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated && isValid === false) {
        Alert.alert('Session Expired', 'You have been logged out because you logged in on another device.');
        await authService.logout();
        // Navigation reset is tricky from here without a ref, but subsequent API calls will fail 401
        // Ideally we use a navigation ref to reset to Login
      }
    } catch (err) {
      console.log('Session check validation failed:', err);
      // Do not crash the app for background session check failures
    }
  };

  // 3. Inactivity Timer (Removed to maintain long-term session as per user request)
  /*
  const resetInactivityTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(async () => {
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        Alert.alert('Session Expired', 'Logged out due to inactivity.');
        await authService.logout();
      }
    }, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);
  */

  /*
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        // resetInactivityTimer();
        return false;
      },
    })
  ).current;
  */

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <AppNavigator />
    </GestureHandlerRootView>
  );
}
