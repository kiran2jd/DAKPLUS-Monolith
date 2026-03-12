import React, { useEffect, useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    RefreshControl,
    Alert,
    Dimensions,
    Platform,
    Image,
    TouchableOpacity as RNTouchableOpacity,
} from 'react-native';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { useFocusEffect, DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { authService } from '../services/auth';
import { testService } from '../services/test';
import { resultService } from '../services/result';
import { topicService } from '../services/topic';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';
import logo from '../../assets/logo.jpg';

const { width } = Dimensions.get('window');

const banners = [
    { id: '1', title: 'Postal Assistant Exam 2026', subtitle: 'Targeted mock tests for high success', colors: ['#dc2626', '#991b1b'] },
    { id: '2', title: 'Postman & Mail Guard', subtitle: 'AI-generated precision assessments', colors: ['#1e3a8a', '#1e40af'] },
    { id: '3', title: 'MTS & Selection Post', subtitle: 'Master the basics with detailed analytics', colors: ['#1e293b', '#334155'] },
];

export default function DashboardScreen({ navigation }) {
    // 1. All Hooks at the very top
    const [user, setUser] = useState(null);
    const [results, setResults] = useState([]);
    const [tests, setTests] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeBannerIndex, setActiveBannerIndex] = useState(0); // Renamed for safety
    const [isManualScrolling, setIsManualScrolling] = useState(false);
    
    const flatListRef = React.useRef(null);
    const scrollInterval = React.useRef(null);

    // usePreventScreenCapture(); // Temporarily disabled for client demo

    const loadData = useCallback(async (force = false) => {
        setLoading(true);
        try {
            // 1. Load User Profile with strict 5s timeout
            const profilePromise = authService.getProfile().catch(() => authService.getUser());
            const profileTimeout = new Promise((resolve) => setTimeout(() => resolve(null), 5000));
            
            const userData = await Promise.race([profilePromise, profileTimeout]);
            
            if (!userData) {
                console.log("Dashboard: No user data available after timeout");
                setLoading(false);
                setRefreshing(false);
                return;
            }
            setUser(userData);

            // 2. Load Dashboard Data (Student only)
            const role = userData.role?.toLowerCase();
            if (role === 'student') {
                const userId = userData.id || userData._id;

                const fetchData = async () => {
                    try {
                        const [resultsRes, testsRes, lbRes] = await Promise.allSettled([
                            resultService.getResultsByUser(userId),
                            testService.getAvailableTests(),
                            resultService.getLeaderboard('weekly')
                        ]);

                        if (resultsRes.status === 'fulfilled') setResults(resultsRes.value || []);
                        if (testsRes.status === 'fulfilled') setTests(testsRes.value || []);
                        if (lbRes.status === 'fulfilled') setLeaderboard(lbRes.value || []);
                    } catch (e) {
                        console.log("Dashboard data partial failure:", e.message);
                    }
                };

                // Strict 10s timeout for all other data
                await Promise.race([
                    fetchData(),
                    new Promise(resolve => setTimeout(resolve, 10000))
                ]);
            }
        } catch (err) {
            console.log("Dashboard fetch error:", err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    // Robust Auto-Scroll Logic
    const stopAutoScroll = useCallback(() => {
        if (scrollInterval.current) {
            clearInterval(scrollInterval.current);
            scrollInterval.current = null;
        }
    }, []);

    const startAutoScroll = useCallback(() => {
        stopAutoScroll();
        scrollInterval.current = setInterval(() => {
            if (!isManualScrolling) {
                setActiveBannerIndex(prev => {
                    const next = (prev + 1) % (banners.length || 1);
                    if (flatListRef.current) {
                        try {
                            flatListRef.current.scrollToIndex({ index: next, animated: true });
                        } catch (e) {
                            console.log("ScrollToIndex failed:", e.message);
                        }
                    }
                    return next;
                });
            }
        }, 5000);
    }, [isManualScrolling, stopAutoScroll]);

    useEffect(() => {
        startAutoScroll();
        return () => stopAutoScroll();
    }, [startAutoScroll, stopAutoScroll]);

    const onMomentumScrollEnd = (event) => {
        const contentOffset = event.nativeEvent.contentOffset.x;
        const layoutWidth = event.nativeEvent.layoutMeasurement.width;
        if (layoutWidth > 0) {
            const index = Math.round(contentOffset / layoutWidth);
            setActiveBannerIndex(index);
        }
        setIsManualScrolling(false);
    };

    const onScrollBeginDrag = () => {
        setIsManualScrolling(true);
        stopAutoScroll();
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadData(true);
    };

    const role = user?.role?.toLowerCase();
    const isPro = user?.subscriptionTier === 'PREMIUM' || role === 'admin' || role === 'teacher';
    const isStaff = role === 'admin' || role === 'teacher';
    const isStudent = role === 'student';

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: '#0f172a' }]}>
                <ActivityIndicator size="large" color="#dc2626" />
            </View>
        );
    }

    const renderHeader = () => (
        <View style={styles.headerWrapper}>
            <View style={styles.topBar}>
                <RNTouchableOpacity
                    style={styles.headerIconButton}
                    onPress={() => {
                        try {
                            navigation.getParent()?.openDrawer();
                        } catch (e) {
                            navigation.dispatch(DrawerActions.openDrawer());
                        }
                    }}
                    activeOpacity={0.7}
                >
                    <Ionicons name="menu-outline" size={28} color="#fff" />
                </RNTouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Image source={logo} style={styles.logoMini} resizeMode="contain" />
                </View>
                <TouchableOpacity 
                    style={styles.headerIconButton} 
                    onPress={() => navigation.navigate('Notifications')}
                    activeOpacity={0.7}
                >
                    <Ionicons name="notifications-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.welcomeTextSection}>
                <Text style={styles.greetingText}>Welcome back,</Text>
                <Text style={styles.nameHeader}>{user?.fullName || 'DAK Plus Aspirant'}</Text>
            </View>

            <View style={styles.carouselContainer}>
                <FlatList
                    ref={flatListRef}
                    data={banners}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={onMomentumScrollEnd}
                    onScrollBeginDrag={onScrollBeginDrag}
                    keyExtractor={(_, index) => index.toString()}
                    renderItem={({ item, index }) => (
                        <View style={[styles.bannerSlide, { backgroundColor: item.colors[0], borderRadius: 24, padding: 24, justifyContent: 'center' }]}>
                            <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                            <Text style={styles.bannerTitle}>{item.title}</Text>
                        </View>
                    )}
                />
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#0f172a' }]}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#dc2626" />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="always"
            >
                {renderHeader()}
                
                <View style={styles.content}>
                    {/* Quick Stats Row */}
                    <View style={styles.quickStatsRow}>
                        <View style={styles.quickStatCard}>
                            <View style={styles.statIconBg}>
                                <Ionicons name="trending-up" size={20} color="#22c55e" />
                            </View>
                            <View>
                                <Text style={styles.statLabel}>Avg Accuracy</Text>
                                <Text style={styles.statValue}>
                                    {results.length > 0
                                        ? Math.round(results.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / results.length)
                                        : 0}%
                                </Text>
                            </View>
                        </View>
                        <View style={styles.quickStatCard}>
                            <View style={[styles.statIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                <Ionicons name="time-outline" size={20} color="#3b82f6" />
                            </View>
                            <View>
                                <Text style={styles.statLabel}>Tests This Week</Text>
                                <Text style={styles.statValue}>
                                    {results.filter(r => {
                                        const date = new Date(r.createdAt);
                                        const now = new Date();
                                        const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
                                        return diff <= 7;
                                    }).length}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {isStudent && (
                        <View style={styles.progressSection}>
                            <Text style={styles.sectionTitle}>Course Progress</Text>
                            <View style={styles.progressContainer}>
                                <View style={styles.progressHeader}>
                                    <Text style={styles.progressLabel}>Unique Tests Completed</Text>
                                    <Text style={styles.progressValue}>{new Set(results.map(r => r.testId || r.id)).size}/{tests.length || 10}</Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${Math.min(100, (new Set(results.map(r => r.testId || r.id)).size / (tests.length || 10)) * 100)}%`, backgroundColor: '#22c55e' }]} />
                                </View>
                                <Text style={styles.progressGoal}>Goal: {tests.length || 10} Tests</Text>
                            </View>
                        </View>
                    )}

                    {!isPro && !isStaff && isStudent && (
                        <TouchableOpacity
                            style={styles.proBanner}
                            onPress={() => navigation.navigate('Payment')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.proBannerGradient, { backgroundColor: '#f59e0b' }]}>
                                <View>
                                    <Text style={styles.proBannerTitle}>Unlock Everything</Text>
                                    <Text style={styles.proBannerDesc}>Get unlimited tests & pro analytics</Text>
                                </View>
                                <Ionicons name="star" size={24} color="#fff" />
                            </View>
                        </TouchableOpacity>
                    )}

                    <Text style={styles.sectionTitle}>Main Menu</Text>

                    <View style={styles.gridContainer}>
                        <RNTouchableOpacity
                            style={styles.gridItem}
                            onPress={() => navigation.navigate('Tests')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.gridIconBg, { backgroundColor: 'rgba(220, 38, 38, 0.1)' }]}>
                                <Ionicons name="document-text" size={28} color="#dc2626" />
                            </View>
                            <Text style={styles.gridLabel}>Mock Tests</Text>
                            <Text style={styles.gridSub}>Topic-wise exams</Text>
                        </RNTouchableOpacity>

                        {isStaff && (
                            <RNTouchableOpacity
                                style={styles.gridItem}
                                onPress={() => navigation.navigate('CreateTest')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.gridIconBg, { backgroundColor: 'rgba(124, 58, 237, 0.1)' }]}>
                                    <Ionicons name="add-circle" size={28} color="#7c3aed" />
                                </View>
                                <Text style={styles.gridLabel}>Create Test</Text>
                                <Text style={styles.gridSub}>Add new content</Text>
                            </RNTouchableOpacity>
                        )}

                        {!isStaff && (
                            <RNTouchableOpacity
                                style={styles.gridItem}
                                onPress={() => Alert.alert("Coming Soon", "Mobile Syllabus tracking is in development!")}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.gridIconBg, { backgroundColor: 'rgba(30, 58, 138, 0.1)' }]}>
                                    <Ionicons name="book" size={28} color="#3b82f6" />
                                </View>
                                <Text style={styles.gridLabel}>Syllabus</Text>
                                <Text style={styles.gridSub}>Track progress</Text>
                            </RNTouchableOpacity>
                        )}

                        <RNTouchableOpacity
                            style={styles.gridItem}
                            onPress={() => isStaff ? navigation.navigate('ManageTests') : Alert.alert("Coming Soon", "Live classes are starting soon!")}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.gridIconBg, { backgroundColor: 'rgba(217, 119, 6, 0.1)' }]}>
                                <Ionicons name={isStaff ? "list" : "school"} size={28} color="#f59e0b" />
                            </View>
                            <Text style={styles.gridLabel}>{isStaff ? "My Tests" : "Classes"}</Text>
                            <Text style={styles.gridSub}>{isStaff ? "Manage learning" : "Live learning"}</Text>
                        </RNTouchableOpacity>

                        {isStaff && (
                            <RNTouchableOpacity
                                style={styles.gridItem}
                                onPress={() => navigation.navigate('TopicManagement')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.gridIconBg, { backgroundColor: 'rgba(5, 150, 105, 0.1)' }]}>
                                    <Ionicons name="folder-open" size={28} color="#10b981" />
                                </View>
                                <Text style={styles.gridLabel}>Topics</Text>
                                <Text style={styles.gridSub}>Organize content</Text>
                            </RNTouchableOpacity>
                        )}

                        <RNTouchableOpacity
                            style={styles.gridItem}
                            onPress={() => navigation.navigate('Performance')}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.gridIconBg, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                                <Ionicons name="stats-chart" size={28} color="#22c55e" />
                            </View>
                            <Text style={styles.gridLabel}>Analytics</Text>
                            <Text style={styles.gridSub}>Performance</Text>
                        </RNTouchableOpacity>
                    </View>

                    {isStudent && leaderboard?.length > 0 && (
                        <View style={styles.recentSection}>
                            <Text style={styles.sectionTitle}>Weekly Top Aspirants</Text>
                            <View style={styles.leaderboardCard}>
                                {leaderboard.slice(0, 3).map((item, index) => (
                                    <View key={item.userId} style={styles.leaderboardRow}>
                                        <View style={styles.rankBadge}>
                                            <Text style={styles.rankText}>{index + 1}</Text>
                                        </View>
                                        <View style={styles.leaderboardInfo}>
                                            <Text style={styles.leaderboardName}>{item.name}</Text>
                                            <Text style={styles.leaderboardScore}>{item.totalScore} pts</Text>
                                        </View>
                                        {item.userId === (user?.id || user?._id) && (
                                            <View style={styles.youBadge}>
                                                <Text style={styles.youText}>YOU</Text>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerWrapper: {
        paddingTop: 45,
        paddingHorizontal: 20,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    welcomeTextSection: {
        marginBottom: 24,
    },
    greetingText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
    },
    nameHeader: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '900',
        marginTop: 4,
    },
    logoMini: {
        width: 150,
        height: 45,
    },
    quickStatsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 20,
    },
    quickStatCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        gap: 12,
    },
    statIconBg: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLabel: {
        color: '#64748b',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    statValue: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
        marginTop: 1,
    },
    carouselContainer: {
        borderRadius: 28,
        marginBottom: 24,
        height: 160,
        overflow: 'hidden',
    },
    bannerSlide: {
        width: Dimensions.get('window').width - 40,
        marginRight: 0,
    },
    bannerCard: {
        height: 160,
        borderRadius: 24,
        padding: 24,
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
    },
    bannerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '900',
    },
    bannerSubtitle: {
        color: '#ffffffcc',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 4,
    },
    pagDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    pagDotActive: {
        width: 20,
        backgroundColor: '#fff',
    },
    bannerPagination: {
        flexDirection: 'row',
        gap: 6,
    },
    content: {
        padding: 20,
    },
    progressSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    progressContainer: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    progressLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#94a3b8',
    },
    progressValue: {
        fontSize: 13,
        fontWeight: '900',
        color: '#ef4444',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressGoal: {
        fontSize: 10,
        color: '#475569',
        fontWeight: '600',
    },
    statsOverview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 24,
    },
    statCardSmall: {
        flex: 1,
        height: 90,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statCardGradient: {
        flex: 1,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statCardValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 2,
    },
    statCardLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    proBanner: {
        marginBottom: 24,
        borderRadius: 18,
        overflow: 'hidden',
    },
    proBannerGradient: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
    },
    proBannerTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
    },
    proBannerDesc: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        marginTop: 2,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between', 
        paddingHorizontal: 20,
    },
    gridItem: {
        width: (width - 55) / 2, // Precisely calculated for 2 columns with 15px gap
        backgroundColor: 'rgba(255,255,255,0.04)',
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginVertical: 10,
        justifyContent: 'center',
        minHeight: 150, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    gridIconBg: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    gridLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
    },
    gridSub: {
        fontSize: 9,
        color: '#64748b',
        textAlign: 'center',
    },
    recentSection: {
        marginTop: 10,
    },
    leaderboardCard: {
        backgroundColor: 'rgba(255,255,255,0.01)',
        padding: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    leaderboardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.03)',
    },
    rankBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    rankText: {
        fontWeight: '900',
        color: '#ef4444',
        fontSize: 11,
    },
    headerIconButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        zIndex: 200,
        elevation: 15,
    },
    leaderboardInfo: {
        flex: 1,
    },
    leaderboardName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    leaderboardScore: {
        fontSize: 11,
        color: '#64748b',
    },
    youBadge: {
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    youText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#38bdf8',
    },
});
