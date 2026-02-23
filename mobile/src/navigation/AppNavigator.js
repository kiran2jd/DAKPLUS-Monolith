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
import CreateTestScreen from '../screens/CreateTestScreen';
import EditTestScreen from '../screens/EditTestScreen';
import ResultScreen from '../screens/ResultScreen';
import PaymentScreen from '../screens/PaymentScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ManageTestsScreen from '../screens/ManageTestsScreen';
import TopicManagementScreen from '../screens/TopicManagementScreen';
import { authService } from '../services/auth';

import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import SideMenu from '../components/SideMenu';
import HelpScreen from '../screens/HelpScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Tests') iconName = focused ? 'book' : 'book-outline';
                    else if (route.name === 'Performance') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                    else if (route.name === 'Help') iconName = focused ? 'help-circle' : 'help-circle-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#dc2626',
                tabBarInactiveTintColor: '#64748b',
                tabBarStyle: {
                    backgroundColor: '#0f172a',
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.05)',
                    height: 65,
                    paddingBottom: 10,
                },
            })}
        >
            <Tab.Screen name="Home" component={DashboardScreen} />
            <Tab.Screen name="Tests" component={TestLibraryScreen} />
            <Tab.Screen name="Performance" component={AnalyticsScreen} />
            <Tab.Screen name="Help" component={HelpScreen} />
        </Tab.Navigator>
    );
}

function StudentDrawer() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <SideMenu {...props} />}
            screenOptions={{
                headerShown: false,
                drawerStyle: {
                    width: '80%',
                },
            }}
        >
            <Drawer.Screen name="Tabs" component={MainTabNavigator} />
        </Drawer.Navigator>
    );
}

export default function AppNavigator() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Add a timeout to prevent infinite loading screen if SecureStore hangs
            const authPromise = authService.isAuthenticated();
            const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(false), 5000));

            const authenticated = await Promise.race([authPromise, timeoutPromise]);
            setIsAuthenticated(authenticated);
        } catch (error) {
            console.error('Auth check failed:', error);
            setIsAuthenticated(false);
        } finally {
            console.log('AppNavigator: checkAuth finished, isAuthenticated:', isAuthenticated);
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
                }}
            >
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />

                {/* Main Student App Flow - Drawer contains Tabs */}
                <Stack.Screen name="Main" component={StudentDrawer} />

                {/* Other Screens */}
                <Stack.Screen name="TakeTest" component={TakeTestScreen} />
                <Stack.Screen name="Result" component={ResultScreen} />
                <Stack.Screen name="Payment" component={PaymentScreen} />
                <Stack.Screen name="ManageTests" component={ManageTestsScreen} />
                <Stack.Screen name="TopicManagement" component={TopicManagementScreen} />
                <Stack.Screen name="CreateTest" component={CreateTestScreen} />
                <Stack.Screen name="EditTest" component={EditTestScreen} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
