import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

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
import ManageTestsScreen from '../screens/ManageTestsScreen';
import TopicManagementScreen from '../screens/TopicManagementScreen';
import MyPurchasesScreen from '../screens/MyPurchasesScreen';
import SideMenu from '../components/SideMenu';
import HelpScreen from '../screens/HelpScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SyllabusScreen from '../screens/SyllabusScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import { authService } from '../services/auth';
import { pushNotificationService } from '../services/pushNotification';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

/**
 * BOTTOM TABS
 * Simplified to ensure maximum touch reliability.
 */
function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Home') iconName = focused ? 'grid' : 'grid-outline';
                    else if (route.name === 'Tests') iconName = focused ? 'book' : 'book-outline';
                    else if (route.name === 'Syllabus') iconName = focused ? 'list' : 'list-outline';
                    else if (route.name === 'Performance') iconName = focused ? 'analytics' : 'analytics-outline';
                    else if (route.name === 'Help') iconName = focused ? 'help-circle' : 'help-circle-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#dc2626',
                tabBarInactiveTintColor: '#64748b',
                tabBarStyle: {
                    backgroundColor: '#1e293b',
                    borderTopColor: 'rgba(255,255,255,0.05)',
                    paddingBottom: 5,
                    height: 60,
                }
            })}
        >
            <Tab.Screen name="Home" component={DashboardScreen} />
            <Tab.Screen name="Tests" component={TestLibraryScreen} />
            <Tab.Screen name="Syllabus" component={SyllabusScreen} />
            <Tab.Screen name="Performance" component={AnalyticsScreen} />
            <Tab.Screen name="Help" component={HelpScreen} />
        </Tab.Navigator>
    );
}

/**
 * DRAWER NAVIGATOR (SIDE MENU)
 * Configured as 'front' overlay to prevent main screen push/touch issues.
 */
function DrawerNavigator() {
    return (
        <Drawer.Navigator
            drawerContent={(props) => <SideMenu {...props} />}
            screenOptions={{
                headerShown: false,
                drawerType: 'front', // Standard overlay behavior
                swipeEnabled: true,
                drawerStyle: {
                    backgroundColor: '#0f172a',
                    width: 280,
                },
            }}
        >
            <Drawer.Screen name="Tabs" component={TabNavigator} />
        </Drawer.Navigator>
    );
}

export default function AppNavigator() {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const authenticated = await authService.isAuthenticated();
                setIsAuthenticated(authenticated);
                
                if (authenticated) {
                    // Register for push notifications if auth is successful
                    setTimeout(async () => {
                        try {
                            const token = await pushNotificationService.registerForPushNotificationsAsync();
                            if (token) {
                                await pushNotificationService.sendTokenToBackend(token);
                            }
                        } catch (e) {
                            console.log("Push reg error:", e);
                        }
                    }, 1000);
                }
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
                <ActivityIndicator size="large" color="#dc2626" />
            </View>
        );
    }

    const linking = {
        prefixes: ['dakplus://'],
        config: {
            screens: {
                Main: 'dashboard',
                Payment: 'payment',
                Tests: 'tests/:courseId',
                TakeTest: 'take-test/:testId',
                Result: 'result/:resultId',
            },
        },
    };

    return (
        <NavigationContainer linking={linking}>
            <Stack.Navigator
                initialRouteName={isAuthenticated ? "Main" : "Welcome"}
                screenOptions={{ headerShown: false }}
            >
                {/* Auth Stack */}
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />

                {/* Main App entry point (Side Menu + Tabs) */}
                <Stack.Screen name="Main" component={DrawerNavigator} />

                {/* Functionals */}
                <Stack.Screen name="TakeTest" component={TakeTestScreen} />
                <Stack.Screen name="Result" component={ResultScreen} />
                <Stack.Screen name="Payment" component={PaymentScreen} />
                <Stack.Screen name="ManageTests" component={ManageTestsScreen} />
                <Stack.Screen name="TopicManagement" component={TopicManagementScreen} />
                <Stack.Screen name="CreateTest" component={CreateTestScreen} />
                <Stack.Screen name="EditTest" component={EditTestScreen} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                <Stack.Screen name="Syllabus" component={SyllabusScreen} />
                <Stack.Screen name="MyPurchases" component={MyPurchasesScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
