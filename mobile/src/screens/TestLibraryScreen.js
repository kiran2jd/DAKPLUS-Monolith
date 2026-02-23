import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { testService } from '../services/test';
import { topicService } from '../services/topic';
import { authService } from '../services/auth';
import api from '../services/api';

export default function TestLibraryScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [tests, setTests] = useState([]);
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [subtopics, setSubtopics] = useState([]);
    const [selectedSubtopic, setSelectedSubtopic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'purchased'
    const [purchases, setPurchases] = useState([]);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const userData = await authService.getUser();
            setUser(userData);

            const [topicsData, testsData] = await Promise.all([
                topicService.getAllTopics(),
                testService.getAvailableTests()
            ]);

            setTopics(topicsData);
            setTests(testsData);

            try {
                const response = await api.get(`/payments/user-purchases?userId=${userData.id || userData._id}`);
                setPurchases(response.data || []);
            } catch (pErr) {
                console.log("No purchases found or error:", pErr);
            }
        } catch (err) {
            console.error("Load Library error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleTopicSelect = async (topicId) => {
        if (selectedTopic === topicId) {
            setSelectedTopic(null);
            setSubtopics([]);
            setSelectedSubtopic(null);
        } else {
            setSelectedTopic(topicId);
            const sub = await topicService.getSubtopics(topicId);
            setSubtopics(sub);
            setSelectedSubtopic(null);
        }
    };

    const isPro = user?.subscriptionTier === 'PREMIUM' || user?.role === 'ADMIN' || user?.role === 'TEACHER';

    const renderTestItem = ({ item }) => {
        const isPremium = item.premium || item.isPremium;
        const isLocked = isPremium && !isPro;

        return (
            <TouchableOpacity
                style={[styles.testCard, isLocked && styles.lockedCard]}
                onPress={() => isLocked ? navigation.navigate('Payment') : navigation.navigate('TakeTest', { testId: item.id })}
            >
                <View style={styles.testHeader}>
                    <View style={[styles.badge, { backgroundColor: item.difficulty === 'Hard' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)' }]}>
                        <Text style={[styles.badgeText, { color: item.difficulty === 'Hard' ? '#ef4444' : '#22c55e' }]}>
                            {item.difficulty || 'Medium'}
                        </Text>
                    </View>
                    <View style={styles.headerRight}>
                        {isLocked && <Ionicons name="lock-closed" size={14} color="#f97316" style={{ marginRight: 8 }} />}
                        <Text style={styles.durationText}>{item.durationMinutes || item.duration_minutes} mins</Text>
                    </View>
                </View>

                <Text style={styles.testTitle}>
                    {isPremium && <Text style={{ color: '#f97316' }}>[PRO] </Text>}
                    {item.title}
                </Text>

                <Text style={styles.testDesc} numberOfLines={2}>{item.description}</Text>

                <View style={styles.testFooter}>
                    <Text style={styles.categoryText}>{item.category || 'General'}</Text>
                    <View style={[styles.startButton, isLocked ? styles.lockedBtn : null]}>
                        <LinearGradient
                            colors={isLocked ? ['#475569', '#334155'] : ['#dc2626', '#f97316']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.btnGradient}
                        >
                            <Text style={styles.startButtonText}>{isLocked ? 'Unlock PRO' : 'Start Test'}</Text>
                        </LinearGradient>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#dc2626" />
            </View>
        );
    }

    const purchasedIds = purchases.map(p => p.itemId);

    const filteredTests = tests.filter(test => {
        const matchesTopic = !selectedTopic || test.topicId === selectedTopic;
        const matchesSubtopic = !selectedSubtopic || test.subtopicId === selectedSubtopic;

        if (activeTab === 'purchased') {
            const hasAccess = isPro || purchasedIds.includes(test.id);
            return hasAccess && matchesTopic && matchesSubtopic;
        }

        return matchesTopic && matchesSubtopic;
    });

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
                    <Text style={styles.headerTitle}>Test Library</Text>
                    <View style={{ width: 44 }} />
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('all')}
                    >
                        {activeTab === 'all' && <LinearGradient colors={['#dc2626', '#f97316']} style={styles.tabLine} />}
                        <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All Exams</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'purchased' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('purchased')}
                    >
                        {activeTab === 'purchased' && <LinearGradient colors={['#dc2626', '#f97316']} style={styles.tabLine} />}
                        <Text style={[styles.tabText, activeTab === 'purchased' && styles.tabTextActive]}>My Library</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.filterSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicScroll}>
                        {topics.map(topic => (
                            <TouchableOpacity
                                key={topic.id}
                                style={[styles.topicChip, selectedTopic === topic.id && styles.topicChipActive]}
                                onPress={() => handleTopicSelect(topic.id)}
                            >
                                {selectedTopic === topic.id && <LinearGradient colors={['#dc2626', '#f97316']} style={StyleSheet.absoluteFillObject} />}
                                <Text style={[styles.topicChipText, selectedTopic === topic.id && styles.topicChipTextActive]}>
                                    {topic.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {selectedTopic && subtopics.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subtopicScroll}>
                            {subtopics.map(sub => (
                                <TouchableOpacity
                                    key={sub.id}
                                    style={[styles.subChip, selectedSubtopic === sub.id && styles.subChipActive]}
                                    onPress={() => setSelectedSubtopic(selectedSubtopic === sub.id ? null : sub.id)}
                                >
                                    <Text style={[styles.subChipText, selectedSubtopic === sub.id && styles.subChipTextActive]}>
                                        {sub.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>

                <FlatList
                    data={filteredTests}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTestItem}
                    contentContainerStyle={styles.listContent}
                    ListFooterComponent={
                        !isPro && user?.role === 'STUDENT' ? (
                            <TouchableOpacity
                                style={styles.libraryProBanner}
                                onPress={() => navigation.navigate('Payment')}
                            >
                                <LinearGradient
                                    colors={['#dc2626', '#f97316']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.proBannerGradient}
                                >
                                    <Ionicons name="sparkles" size={24} color="#fff" />
                                    <View style={styles.proBannerTextContainer}>
                                        <Text style={styles.proBannerTitle}>Unlock Everything!</Text>
                                        <Text style={styles.proBannerSub}>Get unlimited access to all tests & analytics.</Text>
                                    </View>
                                    <View style={styles.proBannerBadge}>
                                        <Text style={styles.proBadgeText}>GO PRO</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : null
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search-outline" size={64} color="rgba(255,255,255,0.05)" />
                            <Text style={styles.emptyText}>No matching tests found.</Text>
                        </View>
                    }
                />
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
        fontSize: 20,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 0.5,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        backgroundColor: 'transparent',
        marginBottom: 10,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        position: 'relative',
    },
    tabLine: {
        position: 'absolute',
        bottom: 0,
        left: '20%',
        right: '20%',
        height: 3,
        borderRadius: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
    },
    tabTextActive: {
        color: '#fff',
    },
    filterSection: {
        paddingVertical: 8,
    },
    topicScroll: {
        paddingHorizontal: 20,
        paddingBottom: 4,
    },
    topicChip: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        overflow: 'hidden',
    },
    topicChipActive: {
        borderColor: '#dc2626',
    },
    topicChipText: {
        color: '#94a3b8',
        fontWeight: 'bold',
        fontSize: 13,
    },
    topicChipTextActive: {
        color: '#fff',
    },
    subtopicScroll: {
        paddingHorizontal: 20,
        marginTop: 8,
    },
    subChip: {
        backgroundColor: 'transparent',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 10,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(30, 58, 138, 0.3)',
    },
    subChipActive: {
        backgroundColor: 'rgba(30, 58, 138, 0.2)',
        borderColor: '#3b82f6',
    },
    subChipText: {
        color: '#475569',
        fontSize: 11,
        fontWeight: '600',
    },
    subChipTextActive: {
        color: '#3b82f6',
    },
    listContent: {
        padding: 20,
    },
    testCard: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 22,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    lockedCard: {
        opacity: 0.7,
    },
    testHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    durationText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
    },
    testTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    testDesc: {
        color: '#64748b',
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 20,
    },
    testFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.03)',
        paddingTop: 15,
    },
    categoryText: {
        color: '#ef4444',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    startButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    lockedBtn: {
        backgroundColor: '#334155',
    },
    btnGradient: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startButtonText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    emptyContainer: {
        paddingVertical: 80,
        alignItems: 'center',
    },
    emptyText: {
        color: '#475569',
        fontSize: 14,
        marginTop: 16,
        fontWeight: '600',
    },
    libraryProBanner: {
        marginTop: 10,
        marginBottom: 30,
        borderRadius: 20,
        overflow: 'hidden',
    },
    proBannerGradient: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    proBannerTextContainer: {
        flex: 1,
        marginHorizontal: 15,
    },
    proBannerTitle: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '900',
        marginBottom: 2,
    },
    proBannerSub: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        lineHeight: 15,
    },
    proBannerBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    proBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
    },
});
