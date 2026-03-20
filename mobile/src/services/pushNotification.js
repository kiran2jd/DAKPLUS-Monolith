import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const pushNotificationService = {
  registerForPushNotificationsAsync: async () => {
    let token;

    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#ff231f7c',
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.log('Failed to get push token: PERMISSION_DENIED');
          return { error: 'PERMISSION_DENIED', message: 'Notification permissions were not granted.' };
        }
        
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        console.log('Push Project ID found:', projectId);
        
        if (!projectId) {
            console.log('CRITICAL: Project ID not found in app.json.');
            return { error: 'MISSING_PROJECT_ID', message: 'EAS Project ID is missing from app.json.' };
        }

        try {
          const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
          token = tokenData.data;
          console.log("EXPO PUSH TOKEN:", token);
          return token;
        } catch (e) {
          console.log('Error fetching push token:', e);
          return { error: 'TOKEN_FETCH_FAILED', message: e.message };
        }
      } else {
        console.log('Push Notifications: Not a physical device. Using Mock Token.');
        // Return a valid-format mock token for testing registration logic on emulators
        token = "ExponentPushToken[mock_emulator_token_" + Math.random().toString(36).substring(7) + "]";
        return token;
      }
    } catch (globalErr) {
      console.error("Global Push Registration Error:", globalErr);
      return { error: 'GLOBAL_FAILURE', message: globalErr.message };
    }
  },

  sendTokenToBackend: async (token) => {
    if (!token) return;
    try {
      await api.post('/auth/push-token', { token });
    } catch (e) {
      console.log('Failed to send push token to backend:', e);
    }
  },

  testPushNotification: async () => {
    try {
      const response = await api.post('/auth/test-push');
      return response.data;
    } catch (error) {
      console.log('Failed to trigger test push:', error?.response?.data || error.message);
      throw error;
    }
  }
};
