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
import { useFocusEffect, DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/auth';
import { testService } from '../services/test';
import { resultService } from '../services/result';
import { Ionicons } from '@expo/vector-icons';
import logo from '../../assets/logo.jpg';

const { width } = Dimensions.get('window');

/**
 * PRODUCTION-READY PREMIUM DASHBOARD
 * Fixed service call bugs and expanded functionality for Admin vs Student.
 */
export default function DashboardScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [user, setUser] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [leaderboard, setLeaderboard] = useState([]);
    const flatListRef = useRef(null);

    const isStudent = user?.role === 'student' || !user?.role;
    const isStaff = user?.role === 'staff' || user?.role === 'admin';

    const banners = [
        { title: "NEET 2024 Prep", subtitle: "DAILY MOCK TESTS", colors: ['#ef4444', '#b91c1c'], icon: 'analytics-outline' },
        { title: "Concept Mastery", subtitle: "TOPICAL REVISION", colors: ['#3b82f6', '#1d4ed8'], icon: 'bulb-outline' },
        { title: "All India Rank", subtitle: "LIVE LEADERBOARD", colors: ['#10b981', '#047857'], icon: 'trophy-outline' }
    ];

    useFocusEffect(
        useCallback(() => {
            loadDashboardData();
        }, [])
    );

    const loadDashboardData = async () => {
        try {
            // FIX: Correct service call names
            const userData = await authService.getUser();
            setUser(userData);
            
            if (userData) {
                const [resultsData, leaderboardData] = await Promise.all([
                    resultService.getMyResults(), // FIX: Corrected method name
                    userData?.role === 'student' ? resultService.getLeaderboard() : Promise.resolve([])
                ]);
                setResults(resultsData || []);
                setLeaderboard(leaderboardData || []);
            }
        } catch (error) {
            console.error('Dashboard primary load failed:', error);
            // Attempt to refresh profile if storage is stale
            try {
                const refreshedUser = await authService.getProfile();
                setUser(refreshedUser);
            } catch (e) {}
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: '#0f172a' }]}>
                <ActivityIndicator size="large" color="#dc2626" />
            </View>
        );
    }

    const accuracy = results.length > 0 
        ? Math.round(results.reduce((acc, r) => acc + (r.score / r.totalQuestions) * 100, 0) / results.length) 
        : 0;

    return (
        <View style={styles.container}>
            {/* 1. SCROLLABLE CONTENT */}
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDashboardData} tintColor="#dc2626" />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContainer, { paddingTop: 85 + insets.top }]}
            >
                <View style={[styles.headerWrapperPadding, { paddingTop: 10 }]}>
                    <View style={styles.welcomeTextSection}>
                        <Text style={styles.greetingText}>Welcome back,</Text>
                        <Text style={styles.nameHeader}>{user?.fullName || 'DAK Plus Aspirant'}</Text>
                        <Text style={styles.roleBadge}>{user?.role?.toUpperCase() || 'STUDENT'}</Text>
                    </View>

                    {/* Premium Banners Carousel */}
                    <View style={styles.carouselContainer}>
                        <FlatList
                            ref={flatListRef}
                            data={banners}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(_, i) => i.toString()}
                            onMomentumScrollEnd={(e) => setCurrentSlide(Math.round(e.event.contentOffset.x / (width - 40)))}
                            renderItem={({ item }) => (
                                <LinearGradient colors={item.colors} style={styles.bannerCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                                        <Text style={styles.bannerTitle}>{item.title}</Text>
                                    </View>
                                    <Ionicons name={item.icon} size={60} color="rgba(255,255,255,0.2)" />
                                </LinearGradient>
                            )}
                        />
                        <View style={styles.pagination}>
                            {banners.map((_, i) => (
                                <View key={i} style={[styles.dot, currentSlide === i && styles.activeDot]} />
                            ))}
                        </View>
                    </View>

                    {/* Quick Stats Row */}
                    <View style={styles.quickStatsRow}>
                        <View style={styles.quickStatCard}>
                            <View style={[styles.statIconBg, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                                <Ionicons name="trending-up" size={18} color="#22c55e" />
                            </View>
                            <View>
                                <Text style={styles.statLabel}>Accuracy</Text>
                                <Text style={styles.statValue}>{accuracy}%</Text>
                            </View>
                        </View>
                        <View style={styles.quickStatCard}>
                            <View style={[styles.statIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                <Ionicons name="document-text" size={18} color="#3b82f6" />
                            </View>
                            <View>
                                <Text style={styles.statLabel}>Tests</Text>
                                <Text style={styles.statValue}>{results.length}</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Essential Tools</Text>

                    <View style={styles.gridContainer}>
                        {[
                            { label: 'Mock Tests', icon: 'clipboard', route: 'Tests', color: '#dc2626', sub: 'Chapter-wise' },
                            ...(isStaff ? [{ label: 'Question Bank', icon: 'add-circle', route: 'CreateTest', color: '#f97316', sub: 'Create tests' }] : []),
                            ...(isStaff ? [{ label: 'Manage Tests', icon: 'layers', route: 'ManageTests', color: '#3b82f6', sub: 'Full control' }] : [{ label: 'Unlock Exam', icon: 'card', route: 'Payment', color: '#10b981', sub: 'Go Premium' }]),
                            { label: 'Analytics', icon: 'stats-chart', route: 'Performance', color: '#8b5cf6', sub: 'Deep insights' },
                            ...(isStaff ? [{ label: 'Topic Matrix', icon: 'apps', route: 'TopicManagement', color: '#10b981', sub: 'Core topics' }] : [{ label: 'Classes', icon: 'people', route: 'Tests', color: '#f59e0b', sub: 'Video learning' }]),
                            { label: 'Help Desk', icon: 'help-circle', route: 'Help', color: '#64748b', sub: 'Get support' }
                        ].map((item, idx) => (
                            <View key={idx} style={styles.gridSlot}>
                                <TouchableOpacity
                                    style={styles.gridItem}
                                    onPress={() => navigation.navigate(item.route)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.gridIconBg, { backgroundColor: `${item.color}10` }]}>
                                        <Ionicons name={item.icon} size={28} color={item.color} />
                                    </View>
                                    <Text style={styles.gridLabel}>{item.label}</Text>
                                    <Text style={styles.gridSub}>{item.sub}</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    {isStudent && leaderboard?.length > 0 && (
                        <View style={styles.recentSection}>
                            <Text style={styles.sectionTitle}>Weekly Top Aspirants</Text>
                            <View style={styles.leaderboardCard}>
                                {leaderboard.slice(0, 3).map((item, index) => (
                                    <View key={index} style={styles.leaderboardRow}>
                                        <View style={styles.rankBadge}>
                                            <Text style={styles.rankText}>{index + 1}</Text>
                                        </View>
                                        <Text style={styles.leaderboardName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.leaderboardScore}>{item.totalScore} pts</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* 2. ABSOLUTE TOP HEADER (Locked for zero touch issues) */}
            <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 15) }]}>
                <TouchableOpacity
                    style={styles.headerIconButton}
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                    <Ionicons name="menu-outline" size={32} color="#fff" />
                </TouchableOpacity>
                
                <View style={styles.logoCenter}>
                    <Image source={logo} style={styles.logoMini} resizeMode="contain" />
                </View>

                <TouchableOpacity 
                    style={styles.headerIconButton} 
                    onPress={() => navigation.navigate('Notifications')}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                    <Ionicons name="notifications-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    center: { justifyContent: 'center', alignItems: 'center' },
    scrollContainer: { paddingBottom: 40 },
    topBar: {
        position: 'absolute', top: 0, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingBottom: 15,
        backgroundColor: '#0f172a',
        zIndex: 9999, elevation: 9999,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    headerIconButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    logoCenter: { flex: 1, alignItems: 'center' },
    logoMini: { width: 140, height: 45 },
    headerWrapperPadding: { paddingHorizontal: 20 },
    welcomeTextSection: { marginBottom: 24 },
    greetingText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
    nameHeader: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 4 },
    roleBadge: { color: '#38bdf8', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 4, backgroundColor: 'rgba(56, 189, 248, 0.1)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    carouselContainer: { height: 160, borderRadius: 24, overflow: 'hidden', marginBottom: 24, position: 'relative' },
    bannerCard: { width: width - 40, height: 160, padding: 24, justifyContent: 'center', flexDirection: 'row', alignItems: 'center' },
    bannerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
    bannerSubtitle: { color: '#ffffffcc', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
    pagination: { position: 'absolute', bottom: 15, left: 24, flexDirection: 'row', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
    activeDot: { width: 20, backgroundColor: '#fff' },
    quickStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    quickStatCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 12 },
    statIconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    statLabel: { color: '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    statValue: { color: '#fff', fontSize: 16, fontWeight: '900' },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#fff', marginBottom: 16, letterSpacing: 0.5 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
    gridSlot: { width: '50%', padding: 8 },
    gridItem: { backgroundColor: 'rgba(255,255,255,0.04)', padding: 16, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', minHeight: 130, elevation: 4 },
    gridIconBg: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    gridLabel: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
    gridSub: { color: '#64748b', fontSize: 10, textAlign: 'center' },
    recentSection: { marginTop: 10 },
    leaderboardCard: { backgroundColor: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    leaderboardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
    rankBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(220, 38, 38, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    rankText: { color: '#ef4444', fontWeight: 'bold', fontSize: 11 },
    leaderboardName: { color: '#fff', flex: 1, fontSize: 13, fontWeight: '600' },
    leaderboardScore: { color: '#94a3b8', fontSize: 11 }
});
