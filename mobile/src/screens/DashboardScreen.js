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
    usePreventScreenCapture();
    const insets = useSafeAreaInsets();
    const [user, setUser] = useState(null);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [leaderboard, setLeaderboard] = useState([]);
    const flatListRef = useRef(null);
    const autoPlayTimerRef = useRef(null);

    const isStudent = user?.role === 'student';
    const isStaff = user?.role === 'staff' || user?.role === 'admin';

    const banners = [
        {
            title: "NEET 2024 Prep",
            subtitle: "DAILY MOCK TESTS",
            colors: ['#ef4444', '#b91c1c'],
            icon: 'analytics-outline'
        },
        {
            title: "Concept Mastery",
            subtitle: "TOPICAL REVISION",
            colors: ['#3b82f6', '#1d4ed8'],
            icon: 'bulb-outline'
        },
        {
            title: "All India Rank",
            subtitle: "LIVE LEADERBOARD",
            colors: ['#10b981', '#047857'],
            icon: 'trophy-outline'
        }
    ];

    useFocusEffect(
        useCallback(() => {
            loadDashboardData();
            startAutoPlay();
            return () => stopAutoPlay();
        }, [])
    );

    const startAutoPlay = () => {
        stopAutoPlay();
        autoPlayTimerRef.current = setInterval(() => {
            if (flatListRef.current) {
                const nextSlide = (currentSlide + 1) % banners.length;
                flatListRef.current.scrollToIndex({ index: nextSlide, animated: true });
                setCurrentSlide(nextSlide);
            }
        }, 5000);
    };

    const stopAutoPlay = () => {
        if (autoPlayTimerRef.current) {
            clearInterval(autoPlayTimerRef.current);
        }
    };

    const loadDashboardData = async () => {
        try {
            const userData = await authService.getCurrentUser();
            setUser(userData);

            const [resultsData, leaderboardData] = await Promise.all([
                resultService.getUserResults(),
                isStudent ? resultService.getLeaderboard() : Promise.resolve([])
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

    const onMomentumScrollEnd = (event) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
        setCurrentSlide(index);
        startAutoPlay();
    };

    const onScrollBeginDrag = () => stopAutoPlay();

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: '#0f172a' }]}>
                <ActivityIndicator size="large" color="#dc2626" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: '#0f172a' }]}>
            {/* 1. SCROLLABLE CONTENT (Rendered first) */}
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#dc2626" />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.scrollContainer, 
                    { paddingTop: 75 + insets.top } // Space for the absolute header
                ]}
                keyboardShouldPersistTaps="always"
            >
                <View style={styles.headerWrapperPadding}>
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
                            renderItem={({ item }) => (
                                <View style={[styles.bannerSlide, { backgroundColor: item.colors[0], borderRadius: 24, padding: 24, justifyContent: 'center' }]}>
                                    <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                                    <Text style={styles.bannerTitle}>{item.title}</Text>
                                </View>
                            )}
                        />
                    </View>
                </View>
                
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
                                        ? Math.round(results.reduce((acc, r) => acc + (r.score / r.totalQuestions) * 100, 0) / results.length)
                                        : 0}%
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.quickStatCard, { backgroundColor: 'rgba(59, 130, 246, 0.05)' }]}>
                            <View style={[styles.statIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                <Ionicons name="time-outline" size={20} color="#3b82f6" />
                            </View>
                            <View>
                                <Text style={styles.statLabel}>Tests Taken</Text>
                                <Text style={styles.statValue}>{results.length}</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Main Menu</Text>

                    <View style={styles.gridContainer}>
                        <View style={styles.gridSlot}>
                            <TouchableOpacity
                                style={styles.gridItem}
                                onPress={() => navigation.navigate('Tests')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.gridIconBg, { backgroundColor: 'rgba(220, 38, 38, 0.1)' }]}>
                                    <Ionicons name="document-text" size={28} color="#dc2626" />
                                </View>
                                <Text style={styles.gridLabel}>Mock Tests</Text>
                                <Text style={styles.gridSub}>Topic-wise exams</Text>
                            </TouchableOpacity>
                        </View>

                        {isStaff && (
                            <View style={styles.gridSlot}>
                                <TouchableOpacity
                                    style={styles.gridItem}
                                    onPress={() => navigation.navigate('CreateTest')}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.gridIconBg, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
                                        <Ionicons name="add-circle" size={28} color="#f97316" />
                                    </View>
                                    <Text style={styles.gridLabel}>Create Test</Text>
                                    <Text style={styles.gridSub}>Add new content</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {!isStaff && (
                            <View style={styles.gridSlot}>
                                <TouchableOpacity
                                    style={styles.gridItem}
                                    onPress={() => Alert.alert("Coming Soon", "Syllabus tracking is coming in the next update!")}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.gridIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                        <Ionicons name="list" size={28} color="#10b981" />
                                    </View>
                                    <Text style={styles.gridLabel}>Syllabus</Text>
                                    <Text style={styles.gridSub}>Track progress</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.gridSlot}>
                            <TouchableOpacity
                                style={styles.gridItem}
                                onPress={() => navigation.navigate(isStaff ? 'ManageTests' : 'Classes')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.gridIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                    <Ionicons name={isStaff ? "layers-outline" : "people-outline"} size={28} color="#3b82f6" />
                                </View>
                                <Text style={styles.gridLabel}>{isStaff ? "My Tests" : "Classes"}</Text>
                                <Text style={styles.gridSub}>{isStaff ? "Manage learning" : "Live learning"}</Text>
                            </TouchableOpacity>
                        </View>

                        {isStaff && (
                            <View style={styles.gridSlot}>
                                <TouchableOpacity
                                    style={styles.gridItem}
                                    onPress={() => navigation.navigate('TopicManagement')}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.gridIconBg, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                                        <Ionicons name="options-outline" size={28} color="#8b5cf6" />
                                    </View>
                                    <Text style={styles.gridLabel}>Topics</Text>
                                    <Text style={styles.gridSub}>Organize content</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.gridSlot}>
                            <TouchableOpacity
                                style={styles.gridItem}
                                onPress={() => navigation.navigate('Performance')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.gridIconBg, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                                    <Ionicons name="stats-chart" size={28} color="#22c55e" />
                                </View>
                                <Text style={styles.gridLabel}>Analytics</Text>
                                <Text style={styles.gridSub}>Performance</Text>
                            </TouchableOpacity>
                        </View>
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

            {/* 2. ABSOLUTE HEADER (Rendered last = Highest layer) */}
            <View style={[styles.topBarSticky, { paddingTop: Math.max(insets.top, 15) }]}>
                <TouchableOpacity
                    style={styles.headerIconButton}
                    onPress={() => {
                        try {
                            navigation.openDrawer();
                        } catch (e) {
                            navigation.dispatch(DrawerActions.openDrawer());
                        }
                    }}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    activeOpacity={0.7}
                >
                    <Ionicons name="menu-outline" size={32} color="#fff" />
                </TouchableOpacity>
                
                <View style={styles.logoContainerSticky}>
                    <Image source={logo} style={styles.logoMini} resizeMode="contain" />
                </View>

                <TouchableOpacity 
                    style={styles.headerIconButton} 
                    onPress={() => navigation.navigate('Notifications')}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    activeOpacity={0.7}
                >
                    <Ionicons name="notifications-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        paddingBottom: 40,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    topBarSticky: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#0f172a',
        zIndex: 9999,
        elevation: 9999,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    logoContainerSticky: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
    },
    logoMini: {
        width: 150,
        height: 45,
    },
    headerWrapperPadding: {
        paddingHorizontal: 20,
        paddingTop: 10,
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
    quickStatsRow: {
        flexDirection: 'row',
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
    content: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -8,
    },
    gridSlot: {
        width: '50%',
        padding: 8,
    },
    gridItem: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        minHeight: 130,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
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
        marginTop: 20,
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
