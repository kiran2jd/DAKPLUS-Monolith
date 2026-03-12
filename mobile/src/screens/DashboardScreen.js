import React, { useEffect, useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Image,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { authService } from '../services/auth';
import { resultService } from '../services/result';
import { Ionicons } from '@expo/vector-icons';
import logo from '../../assets/logo.jpg';

/**
 * HYPER-RESPONSIVE DASHBOARD
 * Using core React Native components with explicit elevation to guarantee touch capture.
 */
export default function DashboardScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadDashboardData();
        }, [])
    );

    const loadDashboardData = async () => {
        try {
            const userData = await authService.getCurrentUser();
            setUser(userData);
            const resultsData = await resultService.getUserResults();
            setResults(resultsData);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const isStaff = user?.role === 'staff' || user?.role === 'admin';

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#dc2626" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* FIXED HEADER - Not absolute to prevent overlap issues */}
            <View style={styles.header}>
                <Image source={logo} style={styles.logoMini} resizeMode="contain" />
                <TouchableOpacity 
                    style={styles.notifBtn} 
                    onPress={() => Alert.alert("Success", "Top Header buttons are working!")}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="notifications-outline" size={26} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDashboardData} tintColor="#dc2626" />}
                keyboardShouldPersistTaps="always"
            >
                <View style={styles.welcomeBox}>
                    <Text style={styles.hello}>Welcome back,</Text>
                    <Text style={styles.name}>{user?.fullName || 'Aspirant'}</Text>
                </View>

                {/* BIG DEBUG PANEL */}
                <TouchableOpacity 
                    style={styles.debugPanel} 
                    onPress={() => Alert.alert("Responsive", "The Dashboard is 100% reactive!")}
                >
                    <Ionicons name="shield-checkmark" size={32} color="#10b981" />
                    <Text style={styles.debugText}>DASHBOARD RESPONSIVENESS: ACTIVE</Text>
                </TouchableOpacity>

                <Text style={styles.label}>Quick Access</Text>

                <View style={styles.grid}>
                    {[
                        { name: 'Mock Tests', icon: 'document-text', route: 'Tests', color: '#dc2626' },
                        { name: 'Performance', icon: 'stats-chart', route: 'Performance', color: '#22c55e' },
                        ...(isStaff ? [{ name: 'Manage Tests', icon: 'layers', route: 'ManageTests', color: '#3b82f6' }] : []),
                        ...(isStaff ? [{ name: 'Topic Matrix', icon: 'grid', route: 'TopicManagement', color: '#8b5cf6' }] : []),
                    ].map((item, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.gridItem, { borderColor: `${item.color}40` }]}
                            onPress={() => navigation.navigate(item.route)}
                            activeOpacity={0.6}
                        >
                            <View style={[styles.iconCirc, { backgroundColor: `${item.color}20` }]}>
                                <Ionicons name={item.icon} size={28} color={item.color} />
                            </View>
                            <Text style={styles.itemText}>{item.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity 
                    style={styles.switchBtn}
                    onPress={async () => {
                        await authService.logout();
                        navigation.replace('Login');
                    }}
                >
                    <Text style={styles.switchText}>Switch User Account</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: {
        height: 100,
        paddingTop: 45,
        backgroundColor: '#1e293b',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        elevation: 10,
        zIndex: 10,
    },
    logoMini: { width: 130, height: 40 },
    notifBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    scroll: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 50 },
    welcomeBox: { marginBottom: 25 },
    hello: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
    name: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 4 },
    debugPanel: {
        backgroundColor: '#10b98115',
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#10b88130',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginBottom: 30,
        elevation: 2,
    },
    debugText: { color: '#10b981', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },
    label: { color: '#fff', fontSize: 18, fontWeight: '900', marginBottom: 15 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
    gridItem: {
        width: '47%',
        backgroundColor: '#1e293b',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1.5,
        elevation: 5, // Force priority
    },
    iconCirc: { width: 55, height: 55, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    itemText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    switchBtn: { marginTop: 40, alignItems: 'center', padding: 15 },
    switchText: { color: '#64748b', fontSize: 14, textDecorationLine: 'underline' }
});
