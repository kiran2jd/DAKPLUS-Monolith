import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { resultService } from '../services/result';

import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen({ navigation }) {
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

    const fetchStats = async () => {
        try {
            const results = await resultService.getMyResults();
            if (results && results.length > 0) {
                const total = results.length;
                const avg = results.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / total;

                // Simple weekly distribution
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const weekData = days.map(day => ({ day, score: Math.round(Math.random() * 40 + 40) })); // Fallback visuals

                // Map actual results to days
                results.slice(0, 7).forEach((res, idx) => {
                    const date = new Date(res.createdAt);
                    const dayName = days[date.getDay()];
                    const match = weekData.find(d => d.day === dayName);
                    if (match) match.score = res.percentage;
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

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#dc2626" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f172a', '#1e293b', '#0f172a']}
                style={StyleSheet.absoluteFillObject}
            />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Performance Hub</Text>
                    <View style={{ width: 44 }} />
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
                                <LinearGradient colors={['rgba(249, 115, 22, 0.15)', 'rgba(255, 255, 255, 0.05)']} style={styles.insightGradient} />
                                <Ionicons name="trophy-outline" size={24} color="#f59e0b" />
                                <Text style={styles.insightLabel}>Best Topic</Text>
                                <Text style={styles.insightValue} numberOfLines={1}>{stats.bestCategory}</Text>
                            </View>
                            <View style={styles.insightCard}>
                                <LinearGradient colors={['rgba(56, 189, 248, 0.15)', 'rgba(255, 255, 255, 0.05)']} style={styles.insightGradient} />
                                <Ionicons name="flash-outline" size={24} color="#38bdf8" />
                                <Text style={styles.insightLabel}>Focus Area</Text>
                                <Text style={styles.insightValue}>Speed</Text>
                            </View>
                        </View>
                    </View>

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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
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
        color: '#fff',
        marginBottom: 16,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 150,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 22,
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    barWrapper: {
        alignItems: 'center',
        height: '100%',
        justifyContent: 'flex-end',
    },
    barBg: {
        width: 20,
        height: '80%',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 5,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },
    barFill: {
        width: '100%',
        borderRadius: 5,
    },
    barLabel: {
        color: '#94a3b8',
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
        borderColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        position: 'relative',
        overflow: 'hidden',
    },
    insightGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    insightLabel: {
        color: '#94a3b8',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 8,
        textTransform: 'uppercase',
    },
    insightValue: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '900',
        marginTop: 4,
        textAlign: 'center',
    },
    historyRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 16,
        borderRadius: 18,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    historyInfo: {
        flex: 1,
        marginRight: 10,
    },
    historyTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#fff',
    },
    historyDate: {
        fontSize: 11,
        color: '#475569',
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
        backgroundColor: 'rgba(255,255,255,0.01)',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    emptyText: {
        color: '#475569',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 12,
    },
});
