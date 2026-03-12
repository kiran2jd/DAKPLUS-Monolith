import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Dimensions,
    Platform,
    Image,
    TouchableOpacity,
    ScrollView,
    FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/auth';
import { testService } from '../services/test';
import { resultService } from '../services/result';
import { Ionicons } from '@expo/vector-icons';
import logo from '../../assets/logo.jpg';

/**
 * NUCLEAR STABILIZED DASHBOARD
 * Minimum complexity, maximum responsiveness.
 */
export default function DashboardScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);

    const isStudent = user?.role === 'student';
    const isStaff = user?.role === 'staff' || user?.role === 'admin';

    useFocusEffect(
        useCallback(() => {
            loadDashboardData();
        }, [])
    );

    const loadDashboardData = async () => {
        try {
            const userData = await authService.getCurrentUser();
            setUser(userData);

            const [resultsData, leaderboardData] = await Promise.all([
                resultService.getUserResults(),
                userData?.role === 'student' ? resultService.getLeaderboard() : Promise.resolve([])
            ]);

            setResults(resultsData);
            setLeaderboard(leaderboardData);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboardData();
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: '#0f172a' }]}>
                <ActivityIndicator size="large" color="#dc2626" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header: Fixed Height, non-absolute for initial verification */}
            <View style={styles.simpleHeader}>
                <Image source={logo} style={styles.logoMini} resizeMode="contain" />
                <TouchableOpacity 
                    onPress={() => navigation.navigate('Notifications')}
                    style={styles.notifBtn}
                >
                    <Ionicons name="notifications-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#dc2626" />}
                contentContainerStyle={styles.scrollContainer}
            >
                <View style={styles.content}>
                    <Text style={styles.greetingText}>Welcome back,</Text>
                    <Text style={styles.nameHeader}>{user?.fullName || 'DAK Plus Aspirant'}</Text>

                    {/* DEBUG BUTTONS - To verify touch registry */}
                    <View style={styles.debugRow}>
                        <TouchableOpacity 
                            style={styles.debugBtn} 
                            onPress={() => Alert.alert("Touch Working", "Dashboard button is responsive!")}
                        >
                            <Text style={styles.debugBtnText}>VERIFY TOUCH</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionTitle}>Main Menu</Text>

                    <View style={styles.gridContainer}>
                        {[
                            { label: 'Mock Tests', icon: 'document-text', route: 'Tests', color: '#dc2626' },
                            ...(isStaff ? [{ label: 'Create Test', icon: 'add-circle', route: 'CreateTest', color: '#f97316' }] : []),
                            { label: isStaff ? "My Tests" : "Classes", icon: isStaff ? "layers-outline" : "people-outline", route: isStaff ? 'ManageTests' : 'Tests', color: '#3b82f6' },
                            { label: 'Analytics', icon: 'stats-chart', route: 'Performance', color: '#22c55e' },
                            ...(isStaff ? [{ label: 'Topics', icon: 'options-outline', route: 'TopicManagement', color: '#8b5cf6' }] : []),
                            { label: 'Support', icon: 'help-circle-outline', route: 'Help', color: '#64748b' }
                        ].map((item, idx) => (
                            <View key={idx} style={styles.gridSlot}>
                                <TouchableOpacity
                                    style={styles.gridItem}
                                    onPress={() => navigation.navigate(item.route)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.gridIconBg, { backgroundColor: `${item.color}15` }]}>
                                        <Ionicons name={item.icon} size={28} color={item.color} />
                                    </View>
                                    <Text style={styles.gridLabel}>{item.label}</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    {isStudent && (
                        <View style={styles.recentSection}>
                            <Text style={styles.sectionTitle}>Leaderboard</Text>
                            <View style={styles.leaderboardCard}>
                                {leaderboard.slice(0, 3).map((item, index) => (
                                    <View key={index} style={styles.leaderboardRow}>
                                        <Text style={styles.rankText}>{index + 1}.</Text>
                                        <Text style={styles.leaderboardName}>{item.name}</Text>
                                        <Text style={styles.leaderboardScore}>{item.totalScore} pts</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Standard Action: Logout to verify nav back */}
                    <TouchableOpacity 
                        style={styles.logoutBtn}
                        onPress={async () => {
                            await authService.logout();
                            navigation.replace('Login');
                        }}
                    >
                        <Text style={styles.logoutText}>Switch Account</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    center: { justifyContent: 'center', alignItems: 'center' },
    simpleHeader: {
        height: 100,
        paddingTop: 40,
        backgroundColor: '#1e293b',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    logoMini: { width: 140, height: 40 },
    notifBtn: { padding: 8 },
    scrollContainer: { paddingBottom: 40 },
    content: { padding: 20 },
    greetingText: { color: '#94a3b8', fontSize: 14 },
    nameHeader: { color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 4, marginBottom: 20 },
    debugRow: { marginBottom: 20 },
    debugBtn: { 
        backgroundColor: '#dc262620', 
        padding: 15, 
        borderRadius: 12, 
        borderWidth: 2, 
        borderColor: '#dc2626', 
        alignItems: 'center' 
    },
    debugBtnText: { color: '#dc2626', fontWeight: 'bold', fontSize: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 16 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
    gridSlot: { width: '50%', padding: 8 },
    gridItem: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        minHeight: 120,
    },
    gridIconBg: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    gridLabel: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    recentSection: { marginTop: 20 },
    leaderboardCard: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 15, borderRadius: 20 },
    leaderboardRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.02)' },
    rankText: { color: '#dc2626', fontWeight: '900', marginRight: 10 },
    leaderboardName: { color: '#fff', flex: 1 },
    leaderboardScore: { color: '#94a3b8' },
    logoutBtn: { marginTop: 30, padding: 15, alignItems: 'center' },
    logoutText: { color: '#64748b', fontSize: 14, textDecorationLine: 'underline' }
});
