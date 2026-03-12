import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import TestLibraryScreen from '../screens/TestLibraryScreen';
import TakeTestScreen from '../screens/TakeTestScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ManageTestsScreen from '../screens/ManageTestsScreen';
import TopicManagementScreen from '../screens/TopicManagementScreen';
import { authService } from '../services/auth';

const Stack = createNativeStackNavigator();

/**
 * GUARANTEED NAVIGATION STACK
 * Zero nesting to eliminate gesture conflicts.
 */
export default function AppNavigator() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const authenticated = await authService.isAuthenticated();
            setIsAuthenticated(authenticated);
        } catch (error) {
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
                <ActivityIndicator size="large" color="#dc2626" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={isAuthenticated ? "Main" : "Welcome"}
                screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                }}
            >
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                
                {/* DIRECT DASHBOARD ENTRANCE */}
                <Stack.Screen name="Main" component={DashboardScreen} />
                
                {/* CORE SCREENS */}
                <Stack.Screen name="Tests" component={TestLibraryScreen} />
                <Stack.Screen name="Performance" component={AnalyticsScreen} />
                <Stack.Screen name="ManageTests" component={ManageTestsScreen} />
                <Stack.Screen name="TopicManagement" component={TopicManagementScreen} />
                <Stack.Screen name="TakeTest" component={TakeTestScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
