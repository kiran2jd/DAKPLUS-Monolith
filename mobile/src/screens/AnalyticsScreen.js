import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Dimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { ScrollView, Pressable, TouchableOpacity } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { resultService } from '../services/result';
import { pushNotificationService } from '../services/pushNotification';

import { useFocusEffect, DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCallback } from 'react';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [stats, setStats] = useState({
        totalTests: 0,
        averageScore: 0,
        bestCategory: 'N/A',
        recentPerformance: [],
        weeklyChart: [
            { day: 'Mon', score: 0 },
            { day: 'Tue', score: 0 },
            { day: 'Wed', score: 0 },
            { day: 'Thu', score: 0 },
            { day: 'Fri', score: 0 },
            { day: 'Sat', score: 0 },
            { day: 'Sun', score: 0 },
        ]
    });
    const [loading, setLoading] = useState(true);
    const [testingPush, setTestingPush] = useState(false);

    const handleTestPush = async () => {
        setTestingPush(true);
        try {
            const data = await pushNotificationService.testPushNotification();
            Alert.alert("Push Sent!", data.message || "Please check your phone's notification tray.");
        } catch (error) {
            Alert.alert("Failed", error?.response?.data?.message || "Could not trigger push notification.");
        } finally {
            setTestingPush(false);
        }
    };

    const fetchStats = async () => {
        try {
            const results = await resultService.getMyResults();
            if (results && results.length > 0) {
                const total = results.length;
                const avg = results.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / total;

                // Real weekly distribution
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const weekData = days.map(day => ({ day, score: 0 }));

                // Map actual results to days (Aggregate best score per day in the last 7 days)
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                results.forEach(res => {
                    const date = new Date(res.createdAt);
                    if (date >= sevenDaysAgo) {
                        const dayName = days[date.getDay()];
                        const match = weekData.find(d => d.day === dayName);
                        if (match) {
                            // Take the highest score for that day to show progress
                            match.score = Math.max(match.score, res.percentage || 0);
                        }
                    }
                });

                const categories = {};
                results.forEach(r => {
                    const cat = r.category || 'General';
                    categories[cat] = (categories[cat] || 0) + (r.percentage || 0);
                });
                let best = 'General';
                let maxAvg = 0;
                Object.keys(categories).forEach(cat => {
                    const count = results.filter(r => (r.category || 'General') === cat).length;
                    const catAvg = categories[cat] / count;
                    if (catAvg > maxAvg) {
                        maxAvg = catAvg;
                        best = cat;
                    }
                });

                setStats({
                    totalTests: total,
                    averageScore: Math.round(avg),
                    bestCategory: best,
                    recentPerformance: results.slice(0, 5),
                    weeklyChart: weekData
                });
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchStats();
        }, [])
    );

    // Removed full-screen loading block to allow Progressive UI Rendering

    return (
        <View style={styles.container}>
            <View style={{ flex: 1 }}>
                {/* STICKY HEADER */}
                <View style={[styles.topBarSticky, { paddingTop: Math.max(insets.top, 15) }]}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={styles.backBtn} 
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Performance Hub</Text>
                    <TouchableOpacity 
                        onPress={() => {
                            try {
                                navigation.openDrawer();
                            } catch (e) {
                                navigation.dispatch(DrawerActions.openDrawer());
                            }
                        }} 
                        style={styles.backBtn}
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="menu-outline" size={32} color="#1e293b" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <LinearGradient
                        colors={['#dc2626', '#f97316']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroCard}
                    >
                        <View style={styles.heroStat}>
                            <Text style={styles.heroLabel}>Average Score</Text>
                            <Text style={styles.heroValue}>{stats.averageScore}%</Text>
                        </View>
                        <View style={styles.heroDivider} />
                        <View style={styles.heroStat}>
                            <Text style={styles.heroLabel}>Total Tests</Text>
                            <Text style={styles.heroValue}>{stats.totalTests}</Text>
                        </View>
                    </LinearGradient>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Weekly Progress</Text>
                        <View style={styles.chartContainer}>
                            {stats.weeklyChart.map((item, idx) => (
                                <View key={idx} style={styles.barWrapper}>
                                    <View style={[styles.barBg]}>
                                        <LinearGradient
                                            colors={['#ef4444', '#dc2626']}
                                            style={[styles.barFill, { height: `${Math.max(10, item.score)}%` }]}
                                        />
                                    </View>
                                    <Text style={styles.barLabel}>{item.day}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Key Insights</Text>
                        <View style={styles.insightGrid}>
                            <View style={styles.insightCard}>
                                <LinearGradient colors={['rgba(249, 115, 22, 0.05)', 'rgba(255, 255, 255, 1)']} style={styles.insightGradient} />
                                <Ionicons name="trophy-outline" size={24} color="#f59e0b" />
                                <Text style={styles.insightLabel}>Best Topic</Text>
                                <Text style={styles.insightValue} numberOfLines={1}>{stats.bestCategory}</Text>
                            </View>
                            <View style={styles.insightCard}>
                                <LinearGradient colors={['rgba(56, 189, 248, 0.05)', 'rgba(255, 255, 255, 1)']} style={styles.insightGradient} />
                                <Ionicons name="bar-chart-outline" size={24} color="#38bdf8" />
                                <Text style={styles.insightLabel}>Consistency</Text>
                                <Text style={styles.insightValue}>{stats.totalTests >= 5 ? 'High' : 'Needs Practice'}</Text>
                            </View>
                        </View>
                    </View>

                    {loading ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#dc2626" />
                            <Text style={{ color: '#94a3b8', marginTop: 10 }}>Loading your insights...</Text>
                        </View>
                    ) : (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Recent Progress</Text>
                            {stats.recentPerformance.length > 0 ? (
                                stats.recentPerformance.map((res, i) => (
                                    <View key={i} style={styles.historyRow}>
                                        <View style={styles.historyInfo}>
                                            <Text style={styles.historyTitle} numberOfLines={1}>
                                                {res.testTitle || 'Mock Exam'}
                                            </Text>
                                            <Text style={styles.historyDate}>
                                                {new Date(res.createdAt).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        <View style={[styles.scoreBadge, { backgroundColor: (res.percentage || 0) >= 40 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                                            <Text style={[styles.scoreText, { color: (res.percentage || 0) >= 40 ? '#22c55e' : '#ef4444' }]}>
                                                {res.percentage}%
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyBox}>
                                    <Ionicons name="bar-chart-outline" size={48} color="rgba(255,255,255,0.05)" />
                                    <Text style={styles.emptyText}>No recent tests found.</Text>
                                </View>
                            )}
                        </View>
                    )}

                    <View style={styles.section}>
                        <TouchableOpacity 
                            style={styles.testPushBtn} 
                            onPress={handleTestPush}
                            disabled={testingPush}
                        >
                            <Ionicons name="notifications-outline" size={20} color="#dc2626" style={{ marginRight: 8 }} />
                            {testingPush ? (
                                <ActivityIndicator size="small" color="#dc2626" />
                            ) : (
                                <Text style={styles.testPushText}>Test Push Notifications</Text>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.testPushSubtext}>Tap to send a real push notification to your device to verify it's working.</Text>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fcf9f2',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    topBarSticky: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: 'transparent',
        zIndex: 1000,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 }
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1e293b',
        letterSpacing: 0.5,
    },
    scrollContent: {
        padding: 20,
    },
    heroCard: {
        flexDirection: 'row',
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
        marginBottom: 30,
        elevation: 10,
        shadowColor: '#f97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    heroStat: {
        flex: 1,
        alignItems: 'center',
    },
    heroLabel: {
        color: '#ffffffaa',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    heroValue: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '900',
        marginTop: 4,
    },
    heroDivider: {
        width: 1,
        height: '50%',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1e293b',
        marginBottom: 16,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 150,
        backgroundColor: '#ffffff',
        borderRadius: 22,
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 }
    },
    barWrapper: {
        alignItems: 'center',
        height: '100%',
        justifyContent: 'flex-end',
    },
    barBg: {
        width: 20,
        height: '80%',
        backgroundColor: '#f1f5f9',
        borderRadius: 5,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    barFill: {
        width: '100%',
        borderRadius: 5,
    },
    barLabel: {
        color: '#64748b',
        fontSize: 10,
        fontWeight: '700',
        marginTop: 8,
    },
    insightGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    insightCard: {
        flex: 1,
        height: 120,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 }
    },
    insightGradient: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.5,
    },
    insightLabel: {
        color: '#64748b',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 8,
        textTransform: 'uppercase',
    },
    insightValue: {
        color: '#1e293b',
        fontSize: 15,
        fontWeight: '900',
        marginTop: 4,
        textAlign: 'center',
    },
    historyRow: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 18,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 }
    },
    historyInfo: {
        flex: 1,
        marginRight: 10,
    },
    historyTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    historyDate: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
        fontWeight: '600',
    },
    scoreBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    scoreText: {
        fontWeight: '900',
        fontSize: 14,
    },
    emptyBox: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    emptyText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 12,
    },
    testPushBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingVertical: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        marginTop: 10,
    },
    testPushText: {
        color: '#dc2626',
        fontSize: 15,
        fontWeight: 'bold',
    },
    testPushSubtext: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: 11,
        marginTop: 8,
        paddingHorizontal: 20,
    }
});
