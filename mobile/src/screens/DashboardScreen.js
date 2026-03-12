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
 * PREMIUM STABILIZED DASHBOARD
 * Core touchables + Absolute-safe Header Layer.
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

    const isStudent = user?.role === 'student';
    const isStaff = user?.role === 'staff' || user?.role === 'admin';

    const banners = [
        { title: "NEET 2024 Prep", subtitle: "DAILY MOCK TESTS", colors: ['#ef4444', '#b91c1c'] },
        { title: "Concept Mastery", subtitle: "TOPICAL REVISION", colors: ['#3b82f6', '#1d4ed8'] },
        { title: "All India Rank", subtitle: "LIVE LEADERBOARD", colors: ['#10b981', '#047857'] }
    ];

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
            console.error('Dashboard load failed:', error);
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

    return (
        <View style={styles.container}>
            {/* 1. SCROLLABLE CONTENT */}
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDashboardData} tintColor="#dc2626" />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContainer, { paddingTop: 80 + insets.top }]}
            >
                <View style={styles.contentPadded}>
                    <Text style={styles.greetingText}>Welcome back,</Text>
                    <Text style={styles.nameHeader}>{user?.fullName || 'DAK Plus Aspirant'}</Text>

                    <View style={styles.carouselContainer}>
                        <FlatList
                            ref={flatListRef}
                            data={banners}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(_, i) => i.toString()}
                            onMomentumScrollEnd={(e) => setCurrentSlide(Math.round(e.nativeEvent.contentOffset.x / (width - 40)))}
                            renderItem={({ item }) => (
                                <LinearGradient colors={item.colors} style={styles.bannerCard}>
                                    <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                                    <Text style={styles.bannerTitle}>{item.title}</Text>
                                </LinearGradient>
                            )}
                        />
                    </View>

                    <View style={styles.gridContainer}>
                        {[
                            { label: 'Mock Tests', icon: 'document-text', route: 'Tests', color: '#dc2626' },
                            ...(isStaff ? [{ label: 'Create Test', icon: 'add-circle', route: 'CreateTest', color: '#f97316' }] : []),
                            { label: isStaff ? "My Tests" : "Classes", icon: isStaff ? "layers" : "people", route: isStaff ? 'ManageTests' : 'Tests', color: '#3b82f6' },
                            { label: 'Analytics', icon: 'stats-chart', route: 'Performance', color: '#22c55e' },
                            ...(isStaff ? [{ label: 'Topics', icon: 'options', route: 'TopicManagement', color: '#8b5cf6' }] : [])
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
                </View>
            </ScrollView>

            {/* 2. ABSOLUTE TOP HEADER (Highest Priority Layer) */}
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
    headerIconButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
    logoCenter: { flex: 1, alignItems: 'center' },
    logoMini: { width: 140, height: 40 },
    contentPadded: { paddingHorizontal: 20 },
    greetingText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
    nameHeader: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 4, marginBottom: 20 },
    carouselContainer: { height: 160, borderRadius: 24, overflow: 'hidden', marginBottom: 24 },
    bannerCard: { width: width - 40, height: 160, padding: 24, justifyContent: 'center' },
    bannerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
    bannerSubtitle: { color: '#ffffffcc', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
    gridSlot: { width: '50%', padding: 8 },
    gridItem: {
        backgroundColor: 'rgba(255,255,255,0.04)', padding: 20, borderRadius: 24,
        alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
        minHeight: 130, elevation: 4
    },
    gridIconBg: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    gridLabel: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});
