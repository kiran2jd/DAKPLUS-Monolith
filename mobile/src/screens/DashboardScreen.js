import React, { useEffect, useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    RefreshControl,
    Alert,
    Dimensions,
    Platform,
    Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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

export default function DashboardScreen({ navigation }) {
    // usePreventScreenCapture(); // Temporarily disabled for client demo
    const [user, setUser] = useState(null);
    const [results, setResults] = useState([]);
    const [tests, setTests] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

    const banners = [
        { id: '1', title: 'Postal Assistant Exam 2026', subtitle: 'Targeted mock tests for high success', colors: ['#dc2626', '#991b1b'] },
        { id: '2', title: 'Postman & Mail Guard', subtitle: 'AI-generated precision assessments', colors: ['#1e3a8a', '#1e40af'] },
        { id: '3', title: 'MTS & Selection Post', subtitle: 'Master the basics with detailed analytics', colors: ['#1e293b', '#334155'] },
    ];

    const loadData = async (force = false) => {
        if (!force && user && results.length > 0) return;
        setLoading(true);
        try {
            // 1. Load User Profile (Critical)
            let userData;
            try {
                userData = await authService.getProfile();
            } catch (err) {
                console.log("Profile load failed, falling back to local user");
                userData = await authService.getUser();
            }

            if (!userData) {
                // If we still don't have a user, we can't do much.
                setLoading(false);
                setRefreshing(false);
                return;
            }
            setUser(userData);

            // 2. Load Dashboard Data (Resilient)
            if (userData.role === 'STUDENT') {
                const userId = userData.id || userData._id;

                // Helper to safely get data or return default
                const safePromise = (promise, fallback) =>
                    promise.catch(err => {
                        console.log("SafePromise caught error:", err.message);
                        return fallback;
                    });

                // Create a timeout promise
                const timeoutPromise = new Promise((resolve) => {
                    setTimeout(() => {
                        console.log("Dashboard data load timed out, returning partial data");
                        resolve('TIMEOUT');
                    }, 10000); // 10 second timeout for UX
                });

                // The actual data fetch
                const fetchDataPromise = Promise.allSettled([
                    resultService.getResultsByUser(userId),
                    testService.getAvailableTests(),
                    resultService.getLeaderboard('weekly')
                ]);

                // Race against timeout
                const result = await Promise.race([fetchDataPromise, timeoutPromise]);

                if (result === 'TIMEOUT') {
                    // We timed out, but we might still get data later. 
                    // For now, stop the loading spinner so user can see the UI.
                    // The requests will complete in background but won't update state here 
                    // unless we track mounted state or use a more complex effect.
                    // Simple approach: just let the user interact with what we have (or empty states).
                    console.log("Dashboard load timed out - showing empty/cached state");
                } else {
                    // We got results!
                    const [resultsResult, testsResult, lbResult] = result;

                    if (resultsResult.status === 'fulfilled') setResults(resultsResult.value);
                    else console.log("Failed to load results:", resultsResult.reason);

                    if (testsResult.status === 'fulfilled') setTests(testsResult.value);
                    else console.log("Failed to load tests:", testsResult.reason);

                    if (lbResult.status === 'fulfilled') setLeaderboard(lbResult.value);
                    else console.log("Failed to load leaderboard:", lbResult.reason);
                }
            }
        } catch (err) {
            console.error("Dashboard load critical error:", err);
            Alert.alert("Connection Issue", "Could not load latest data. Please pull to refresh.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const flatListRef = React.useRef(null);
    const scrollInterval = React.useRef(null);
    const [isManualScrolling, setIsManualScrolling] = React.useState(false);

    const startAutoScroll = () => {
        stopAutoScroll();
        scrollInterval.current = setInterval(() => {
            if (!isManualScrolling) {
                const nextIndex = (currentBannerIndex + 1) % banners.length;
                setCurrentBannerIndex(nextIndex);
                if (flatListRef.current) {
                    flatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
                }
            }
        }, 5000); // 5 seconds delay
    };

    const stopAutoScroll = () => {
        if (scrollInterval.current) {
            clearInterval(scrollInterval.current);
        }
    };

    useEffect(() => {
        startAutoScroll();
        return () => stopAutoScroll();
    }, [currentBannerIndex, isManualScrolling]);

    const onMomentumScrollEnd = (event) => {
        const contentOffset = event.nativeEvent.contentOffset.x;
        const layoutWidth = event.nativeEvent.layoutMeasurement.width;
        const index = Math.round(contentOffset / layoutWidth);
        setCurrentBannerIndex(index);
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

    const isPro = user?.subscriptionTier === 'PREMIUM' || user?.role === 'ADMIN' || user?.role === 'TEACHER';
    const isStaff = user?.role === 'ADMIN' || user?.role === 'TEACHER';

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#dc2626" />
            </View>
        );
    }

    const renderHeader = () => (
        <View style={styles.headerWrapper}>
            <View style={styles.topBar}>
                <TouchableOpacity
                    style={styles.headerIconButton}
                    onPress={() => navigation.openDrawer()}
                >
                    <Ionicons name="menu-outline" size={28} color="#fff" />
                </TouchableOpacity>
                <View style={[styles.logoContainer, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
                    <Image source={logo} style={styles.logoMini} resizeMode="contain" />
                </View>
                <TouchableOpacity style={styles.headerIconButton} onPress={() => navigation.navigate('Notifications')}>
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
                        <View style={styles.bannerSlide}>
                            <LinearGradient
                                colors={item.colors}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.bannerCard}
                            >
                                <View style={styles.bannerContent}>
                                    <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                                    <Text style={styles.bannerTitle}>{item.title}</Text>
                                </View>
                                <View style={styles.bannerPagination}>
                                    {banners.map((_, i) => (
                                        <View
                                            key={i}
                                            style={[styles.pagDot, i === currentBannerIndex && styles.pagDotActive]}
                                        />
                                    ))}
                                </View>
                            </LinearGradient>
                        </View>
                    )}
                />
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f172a', '#1e293b', '#0f172a']}
                style={StyleSheet.absoluteFillObject}
            />
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#dc2626" />}
                    showsVerticalScrollIndicator={false}
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

                        {user?.role === 'STUDENT' && (
                            <View style={styles.progressSection}>
                                <Text style={styles.sectionTitle}>Course Progress</Text>
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressHeader}>
                                        <Text style={styles.progressLabel}>Unique Tests Completed</Text>
                                        <Text style={styles.progressValue}>{new Set(results.map(r => r.testId || r.id)).size}/{tests.length || 10}</Text>
                                    </View>
                                    <View style={styles.progressBarBg}>
                                        <LinearGradient
                                            colors={['#22c55e', '#16a34a']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={[styles.progressBarFill, { width: `${Math.min(100, (new Set(results.map(r => r.testId || r.id)).size / (tests.length || 10)) * 100)}%` }]}
                                        />
                                    </View>
                                    <Text style={styles.progressGoal}>Goal: {tests.length || 10} Tests</Text>
                                </View>
                            </View>
                        )}

                        {user?.role === 'STUDENT' && (
                            <View style={styles.statsOverview}>
                                <View style={styles.statCardSmall}>
                                    <LinearGradient colors={['#3b82f6', '#1e3a8a']} style={styles.statCardGradient}>
                                        <Ionicons name="stats-chart" size={24} color="#fff" />
                                        <Text style={styles.statCardValue}>{Math.round(results.reduce((a, b) => a + (b.accuracy || 0), 0) / (results.length || 1))}%</Text>
                                        <Text style={styles.statCardLabel}>Accuracy</Text>
                                    </LinearGradient>
                                </View>
                                <View style={styles.statCardSmall}>
                                    <LinearGradient colors={['#ef4444', '#991b1b']} style={styles.statCardGradient}>
                                        <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                        <Text style={styles.statCardValue}>{results.length}</Text>
                                        <Text style={styles.statCardLabel}>Tests Taken</Text>
                                    </LinearGradient>
                                </View>
                            </View>
                        )}

                        {!isPro && !isStaff && user?.role === 'STUDENT' && (
                            <TouchableOpacity
                                style={styles.proBanner}
                                onPress={() => navigation.navigate('Payment')}
                            >
                                <LinearGradient
                                    colors={['#f59e0b', '#dc2626']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.proBannerGradient}
                                >
                                    <View>
                                        <Text style={styles.proBannerTitle}>Unlock Everything</Text>
                                        <Text style={styles.proBannerDesc}>Get unlimited tests & pro analytics</Text>
                                    </View>
                                    <Ionicons name="star" size={24} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        )}

                        <Text style={styles.sectionTitle}>Main Menu</Text>

                        <View style={styles.gridContainer}>
                            <TouchableOpacity
                                style={styles.gridItem}
                                onPress={() => navigation.navigate('Tests')}
                            >
                                <LinearGradient colors={['rgba(220, 38, 38, 0.2)', 'rgba(249, 115, 22, 0.2)']} style={styles.gridIconBg}>
                                    <Ionicons name="document-text" size={28} color="#dc2626" />
                                </LinearGradient>
                                <Text style={styles.gridLabel}>Mock Tests</Text>
                                <Text style={styles.gridSub}>Topic-wise exams</Text>
                            </TouchableOpacity>

                            {isStaff && (
                                <TouchableOpacity
                                    style={styles.gridItem}
                                    onPress={() => navigation.navigate('CreateTest')}
                                >
                                    <LinearGradient colors={['rgba(124, 58, 237, 0.2)', 'rgba(139, 92, 246, 0.2)']} style={styles.gridIconBg}>
                                        <Ionicons name="add-circle" size={28} color="#7c3aed" />
                                    </LinearGradient>
                                    <Text style={styles.gridLabel}>Create Test</Text>
                                    <Text style={styles.gridSub}>Add new content</Text>
                                </TouchableOpacity>
                            )}

                            {!isStaff && (
                                <TouchableOpacity
                                    style={styles.gridItem}
                                    onPress={() => Alert.alert("Coming Soon", "Mobile Syllabus tracking is in development!")}
                                >
                                    <LinearGradient colors={['rgba(30, 58, 138, 0.2)', 'rgba(59, 130, 246, 0.2)']} style={styles.gridIconBg}>
                                        <Ionicons name="book" size={28} color="#3b82f6" />
                                    </LinearGradient>
                                    <Text style={styles.gridLabel}>Syllabus</Text>
                                    <Text style={styles.gridSub}>Track progress</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.gridItem}
                                onPress={() => isStaff ? navigation.navigate('ManageTests') : Alert.alert("Coming Soon", "Live classes are starting soon!")}>
                                <LinearGradient colors={['rgba(217, 119, 6, 0.2)', 'rgba(245, 158, 11, 0.2)']} style={styles.gridIconBg}>
                                    <Ionicons name={isStaff ? "list" : "school"} size={28} color="#f59e0b" />
                                </LinearGradient>
                                <Text style={styles.gridLabel}>{isStaff ? "My Tests" : "Classes"}</Text>
                                <Text style={styles.gridSub}>{isStaff ? "Manage learning" : "Live learning"}</Text>
                            </TouchableOpacity>

                            {isStaff && (
                                <TouchableOpacity
                                    style={styles.gridItem}
                                    onPress={() => navigation.navigate('TopicManagement')}>
                                    <LinearGradient colors={['rgba(5, 150, 105, 0.2)', 'rgba(16, 185, 129, 0.2)']} style={styles.gridIconBg}>
                                        <Ionicons name="folder-open" size={28} color="#10b981" />
                                    </LinearGradient>
                                    <Text style={styles.gridLabel}>Topics</Text>
                                    <Text style={styles.gridSub}>Organize content</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={styles.gridItem}
                                onPress={() => navigation.navigate('Analytics')}
                            >
                                <LinearGradient colors={['rgba(22, 101, 52, 0.2)', 'rgba(34, 197, 94, 0.2)']} style={styles.gridIconBg}>
                                    <Ionicons name="stats-chart" size={28} color="#22c55e" />
                                </LinearGradient>
                                <Text style={styles.gridLabel}>Analytics</Text>
                                <Text style={styles.gridSub}>Performance</Text>
                            </TouchableOpacity>
                        </View>

                        {user?.role === 'STUDENT' && leaderboard?.length > 0 && (
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
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
    headerIconButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
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
        gap: 12,
    },
    gridItem: {
        width: '48%',
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
