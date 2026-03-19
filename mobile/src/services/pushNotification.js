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
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      if (!projectId) {
          console.log('Project ID not found in app.json for Push Notifications.');
          return null;
      }

      try {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId,
        })).data;
        console.log("EXPO PUSH TOKEN:", token);
      } catch (e) {
        console.log('Error fetching push token:', e);
      }
    } else {
      console.log('Must use physical device for real Push Notifications. Using Mock Token for dev testing.');
      // Return a valid-format mock token for testing registration logic on emulators
      token = "ExponentPushToken[mock_emulator_token_" + Math.random().toString(36).substring(7) + "]";
    }

    return token;
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
