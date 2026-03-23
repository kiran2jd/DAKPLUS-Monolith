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
    BackHandler,
} from 'react-native';
import { useFocusEffect, DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/auth';
import { resultService } from '../services/result';
import { Ionicons } from '@expo/vector-icons';
import logo from '../../assets/logo.jpg';

const { width } = Dimensions.get('window');

/**
 * DEFINITIVE PREMIUM DASHBOARD (v5.0)
 * Fixed: Case-insensitive roles, Auto-scroll banners, Frontend tool alignment.
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
    const autoScrollTimer = useRef(null);

    // ROBUST ROLE DETECTION (Case-Insensitive)
    const role = user?.role?.toUpperCase() || 'STUDENT';
    const isStaff = role === 'TEACHER' || role === 'ADMIN';
    const isStudent = role === 'STUDENT';

    const banners = [
        { id: 'MTS', title: "MTS Exam", subtitle: "TARGET 2026 BATCH", colors: ['#dc2626', '#b91c1c'], icon: 'mail-outline' },
        { id: 'PMMG', title: "Postman & Mail Guard", subtitle: "COMPLETE PAPER 1 & 2", colors: ['#1e3a8a', '#1d4ed8'], icon: 'cube-outline' },
        { id: 'PASA', title: "PA/SA Special Classes", subtitle: "TARGET 2026 BATCH", colors: ['#7c3aed', '#5b21b6'], icon: 'school-outline' },
        { id: 'COMBINED', title: "Combined Course", subtitle: "PA/SA, PM/MG, MTS", colors: ['#059669', '#047857'], icon: 'library-outline' }
    ];

    // 1. BACK BUTTON GUARD
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (navigation.isFocused()) {
                    Alert.alert("Exit App", "Quit DAKPlus application?", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Exit", onPress: () => BackHandler.exitApp() }
                    ]);
                    return true;
                }
                return false;
            };
            BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        }, [navigation])
    );

    // 2. DATA LOADING
    const loadDashboardData = async () => {
        try {
            // Fresh profile sync from server
            let userData;
            try {
                userData = await authService.getProfile();
            } catch (err) {
                console.log("Profile refresh failed, using local", err);
                userData = await authService.getUser();
            }
            setUser(userData);
            
            if (userData) {
                const [resultsData, leaderboardData] = await Promise.all([
                    resultService.getMyResults(),
                    userData?.role?.toUpperCase() === 'STUDENT' ? resultService.getLeaderboard('weekly') : Promise.resolve([])
                ]);
                setResults(resultsData || []);
                setLeaderboard(leaderboardData || []);
            }
        } catch (error) {
            console.error('Dashboard load failed:', error);
            try {
                const refreshed = await authService.getProfile();
                setUser(refreshed);
            } catch (e) {}
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadDashboardData();
        }, [])
    );

    // 3. AUTO-SCROLL BANNER (5 Seconds)
    useEffect(() => {
        const startAutoScroll = () => {
            if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
            autoScrollTimer.current = setInterval(() => {
                let nextSlide = (currentSlide + 1) % banners.length;
                flatListRef.current?.scrollToOffset({
                    offset: nextSlide * (width - 40),
                    animated: true
                });
                setCurrentSlide(nextSlide);
            }, 5000);
        };

        startAutoScroll();
        return () => {
            if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
        };
    }, [currentSlide]);

    // Removed full screen loading back block to allow Progressive UI Rendering component lifecycle

    const accuracy = results.length > 0 
        ? (Math.round(results.reduce((acc, r) => acc + (r.totalQuestions > 0 ? (r.score / r.totalQuestions) * 100 : 0), 0) / results.length) || 0)
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
                        <Text style={styles.nameHeader}>{user ? user.fullName || 'Dakplus Aspirant' : 'Loading Profile...'}</Text>
                        <View style={styles.roleRow}>
                            <Text style={styles.roleBadge}>{user ? role : '...'}</Text>
                            {user?.subscriptionTier === 'PREMIUM' && <Text style={styles.proBadge}>PRO</Text>}
                        </View>
                    </View>

                    {/* Premium Postal Carousel */}
                    <View style={styles.carouselContainer}>
                        <FlatList
                            ref={flatListRef}
                            data={banners}
                            horizontal
                            pagingEnabled
                            scrollEnabled={true}
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(_, i) => i.toString()}
                            onMomentumScrollEnd={(e) => setCurrentSlide(Math.round(e.nativeEvent.contentOffset.x / (width - 40)))}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    activeOpacity={0.9} 
                                    onPress={() => navigation.navigate('Tests', { courseId: item.id })}
                                >
                                    <LinearGradient colors={item.colors} style={styles.bannerCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                                            <Text style={styles.bannerTitle}>{item.title}</Text>
                                        </View>
                                        <Ionicons name={item.icon} size={60} color="rgba(255,255,255,0.2)" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            )}
                        />
                        <View style={styles.pagination}>
                            {banners.map((_, i) => (
                                <View key={i} style={[styles.dot, currentSlide === i && styles.activeDot]} />
                            ))}
                        </View>
                    </View>

                    {/* Quick Stats */}
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
                                <Text style={styles.statLabel}>Attempts</Text>
                                <Text style={styles.statValue}>{results.length}</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>{isStaff ? "Instructor Toolbar" : "Exam Preparation"}</Text>

                    <View style={styles.gridContainer}>
                        {[
                            { label: 'Exams', icon: 'clipboard', route: 'Tests', color: '#dc2626', sub: 'P1 & P2 Mock' },
                            ...(isStaff ? [{ label: 'Create Test', icon: 'add-circle', route: 'CreateTest', color: '#f97316', sub: 'Question Bank' }] : []),
                            ...(isStaff ? [{ label: 'Manage All', icon: 'layers', route: 'ManageTests', color: '#3b82f6', sub: 'Edit Exams' }] : [{ label: 'Unlock PRO', icon: 'card', route: 'Payment', color: '#10b981', sub: 'Upgrade Now' }]),
                            { label: 'Analytics', icon: 'stats-chart', route: 'Performance', color: '#8b5cf6', sub: 'Score Reports' },
                            ...(isStaff ? [{ label: 'Topics', icon: 'apps', route: 'TopicManagement', color: '#10b981', sub: 'Syllabus Map' }] : [{ label: 'Classes', icon: 'play-circle', route: 'ComingSoon', params: { title: 'Video Classes' }, color: '#f59e0b', sub: 'Video Portal' }]),
                            { label: 'Syllabus', icon: 'list', route: 'Syllabus', color: '#64748b', sub: 'Detailed PDF' },
                        ].map((item, idx) => (
                            <View key={idx} style={styles.gridSlot}>
                                <TouchableOpacity
                                    style={styles.gridItem}
                                    onPress={() => navigation.navigate(item.route, item.params || {})}
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
                            <Text style={styles.sectionTitle}>Weekly Top Rankers</Text>
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

                    {/* DYNAMIC BUY BANNER (FOR LOCKED COURSES) */}
                    {isStudent && (
                        (() => {
                            const unlockedList = user?.unlockedExams || [];
                            const currentBannerId = banners[currentSlide].id;
                            const isAlreadyUnlocked = user?.subscriptionTier === 'PREMIUM' || 
                                                       unlockedList.some(ul => ul.toUpperCase() === 'COMBINED') ||
                                                       unlockedList.some(ul => ul.toUpperCase() === currentBannerId.toUpperCase());
                            
                            if (isAlreadyUnlocked) return null;

                            return (
                                <TouchableOpacity 
                                    style={styles.buyBanner}
                                    onPress={() => navigation.navigate('Payment', { courseId: banners[currentSlide].id })}
                                    activeOpacity={0.9}
                                >
                                    <LinearGradient 
                                        colors={['#dc2626', '#991b1b']} 
                                        style={styles.buyBannerGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <View style={styles.buyBannerContent}>
                                            <View style={styles.buyBannerIconBg}>
                                                <Ionicons name="lock-open" size={20} color="#fff" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.buyBannerTitle}>Unlock {banners[currentSlide].title}</Text>
                                                <Text style={styles.buyBannerSub}>Full Access for just ₹{
                                                    banners[currentSlide].id === 'MTS' ? '10' : 
                                                    banners[currentSlide].id === 'COMBINED' ? '70' : '30'
                                                }</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={24} color="#fff" />
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            );
                        })()
                    )}
                </View>
            </ScrollView>

            {/* 2. ABSOLUTE TOP HEADER */}
            <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 15) }]}>
                <TouchableOpacity
                    style={styles.headerIconButton}
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                    <Ionicons name="menu-outline" size={32} color="#1e293b" />
                </TouchableOpacity>
                
                <View style={styles.logoCenter}>
                    <View style={styles.logoContainer}>
                        <Image source={logo} style={styles.logoMini} resizeMode="contain" />
                    </View>
                </View>

                <TouchableOpacity 
                    style={styles.headerIconButton} 
                    onPress={() => navigation.navigate('Notifications')}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                >
                    <Ionicons name="notifications-outline" size={24} color="#1e293b" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcf9f2' },
    center: { justifyContent: 'center', alignItems: 'center' },
    scrollContainer: { paddingBottom: 40 },
    topBar: {
        position: 'absolute', top: 0, left: 0, right: 0,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingBottom: 15,
        backgroundColor: '#fcf9f2',
        zIndex: 9999, elevation: 2,
        borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3
    },
    headerIconButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 } },
    logoCenter: { flex: 1, alignItems: 'center' },
    logoContainer: { 
        backgroundColor: '#fff', 
        borderRadius: 20, 
        paddingHorizontal: 12, 
        paddingVertical: 4, 
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, 
        elevation: 5, 
        borderWidth: 1.5, borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        minWidth: 200,
        height: 70
    },
    logoMini: { width: 180, height: 60 },
    headerWrapperPadding: { paddingHorizontal: 20 },
    welcomeTextSection: { marginBottom: 24 },
    greetingText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
    nameHeader: { color: '#1e293b', fontSize: 26, fontWeight: '900', marginTop: 2 },
    roleRow: { flexDirection: 'row', gap: 8, marginTop: 6, alignItems: 'center' },
    roleBadge: { color: '#0284c7', fontSize: 10, fontWeight: '900', letterSpacing: 1, backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#bae6fd' },
    proBadge: { color: '#d97706', fontSize: 10, fontWeight: '900', letterSpacing: 1, backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#fde68a' },
    carouselContainer: { height: 160, borderRadius: 24, overflow: 'hidden', marginBottom: 24, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
    bannerCard: { width: width - 40, height: 160, padding: 24, justifyContent: 'center', flexDirection: 'row', alignItems: 'center' },
    bannerTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
    bannerSubtitle: { color: '#ffffffcc', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
    pagination: { position: 'absolute', bottom: 15, right: 24, flexDirection: 'row', gap: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
    activeDot: { width: 18, backgroundColor: '#ffffff' },
    quickStatsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    quickStatCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', gap: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 } },
    statIconBg: { width: 34, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    statLabel: { color: '#64748b', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
    statValue: { color: '#1e293b', fontSize: 15, fontWeight: '900' },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b', marginBottom: 16, letterSpacing: 0.5 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
    gridSlot: { width: '50%', padding: 8 },
    gridItem: { backgroundColor: '#ffffff', padding: 16, borderRadius: 24, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', minHeight: 125, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 3 }, shadowRadius: 5 },
    gridIconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    gridLabel: { color: '#1e293b', fontSize: 15, fontWeight: '900', marginTop: 10, textAlign: 'center' },
    gridSub: { color: '#1e293b', fontSize: 13, fontWeight: '700', marginTop: 4, textAlign: 'center' },
    leaderboardCard: { backgroundColor: '#ffffff', padding: 12, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 } },
    leaderboardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    rankBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    rankText: { color: '#dc2626', fontWeight: 'bold', fontSize: 10 },
    leaderboardName: { color: '#334155', flex: 1, fontSize: 13, fontWeight: '600' },
    leaderboardScore: { color: '#64748b', fontSize: 11 },
    recentSection: { marginTop: 10 },
    buyBanner: {
        marginTop: 20,
        marginBottom: 10,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    buyBannerGradient: {
        padding: 16,
    },
    buyBannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    buyBannerIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buyBannerTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buyBannerSub: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
    },
});
