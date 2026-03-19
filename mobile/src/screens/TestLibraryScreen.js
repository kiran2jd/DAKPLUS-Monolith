import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    Image,
    Pressable,
} from 'react-native';
import { ScrollView, FlatList, TouchableOpacity } from 'react-native-gesture-handler';
import { useFocusEffect, DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { testService } from '../services/test';
import { topicService } from '../services/topic';
import { authService } from '../services/auth';
import api from '../services/api';

export default function TestLibraryScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const [user, setUser] = useState(null);
    const [tests, setTests] = useState([]);
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [subtopics, setSubtopics] = useState([]);
    const [selectedSubtopic, setSelectedSubtopic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'purchased'
    const [purchases, setPurchases] = useState([]);
    
    // Vertical Banners Selection State
    const [selectedCourseId, setSelectedCourseId] = useState(route.params?.courseId || null);

    const COURSE_BANNERS = [
        { id: 'MTS', title: "MTS Exam", subtitle: "TARGET 2026 BATCH", colors: ['#dc2626', '#b91c1c'], icon: 'mail-outline' },
        { id: 'PMMG', title: "Postman & GM", subtitle: "COMPLETE PAPER 1 & 2", colors: ['#1e3a8a', '#1d4ed8'], icon: 'cube-outline' },
        { id: 'PASA', title: "PA/SA Classes", subtitle: "TARGET 2026 BATCH", colors: ['#7c3aed', '#5b21b6'], icon: 'school-outline' },
        { id: 'COMBINED', title: "Combined", subtitle: "PA/SA, PM/MG, MTS", colors: ['#059669', '#047857'], icon: 'library-outline' }
    ];

    useFocusEffect(
        React.useCallback(() => {
            loadInitialData();
        }, [route.params?.courseId])
    );

    const loadInitialData = async () => {
        try {
            // Only show full-screen loader if we have no topics or tests loaded yet
            if (topics.length === 0 || tests.length === 0) {
                setLoading(true);
            }
            const userData = await authService.getUser();
            setUser(userData);

            const rawCourseId = selectedCourseId || route.params?.courseId;
            const courseIdFilter = rawCourseId === 'COMBINED' ? null : rawCourseId;
            console.log("Loading Library for course:", courseIdFilter);

            const [topicsData, testsData] = await Promise.all([
                topicService.getAllTopics(courseIdFilter),
                testService.getAvailableTests(courseIdFilter)
            ]);

            setTopics(topicsData);
            setTests(testsData);

            if (topicsData && topicsData.length > 0) {
                const firstTopic = topicsData[0];
                setSelectedTopic(firstTopic.id);
                try {
                    const subData = await topicService.getSubtopics(firstTopic.id);
                    setSubtopics(subData);
                    // Crucial Fix: We do NOT auto-select the first subtopic.
                    // Doing so hides tests that belong to the Topic but don't belong strictly to the first subtopic.
                    setSelectedSubtopic(null); 
                } catch (subErr) {
                    console.error("Auto load subtopics failed", subErr);
                }
            }

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
            // Crucial Fix: Always default to 'All Subtopics' when changing Topics
            setSelectedSubtopic(null);
        }
    };

    const isPro = user?.subscriptionTier === 'PREMIUM' || user?.role === 'ADMIN' || user?.role === 'TEACHER';
    const unlockedExams = user?.unlockedExams || [];

    const renderTestItem = ({ item }) => {
        const isPremium = item.premium || item.isPremium;
        const purchasedIds = purchases.map(p => p.itemId);
        
        // Course-based locking logic (Shared Content Support)
        const itemCourseIds = item.courseIds || [];
        const isUnlocked = isPro || 
                          unlockedExams.includes('COMBINED') || 
                          itemCourseIds.some(cid => unlockedExams.includes(cid)) ||
                          purchasedIds.includes(item.id);

        const isLocked = isPremium && !isUnlocked;

        return (
            <Pressable
                style={({ pressed }) => [
                    styles.testCard, 
                    isLocked && styles.lockedCard,
                    { opacity: pressed ? 0.7 : 1 }
                ]}
                onPress={() => isLocked ? navigation.navigate('Payment', { courseId: selectedCourseId }) : navigation.navigate('TakeTest', { testId: item.id })}
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
            </Pressable>
        );
    };

    // Removed full-screen loading to allow header shell to mount instantly

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
                colors={['#fcf9f2', '#fcf9f2']}
                style={StyleSheet.absoluteFillObject}
            />
            <View style={{ flex: 1 }}>
                {/* PREMIUM STICKY HEADER */}
                <LinearGradient 
                    colors={['#dc2626', '#b91c1c']} 
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.premiumHeaderSticky, { paddingTop: Math.max(insets.top, 15) }]}
                >
                    <View style={styles.headerRowSticky}>
                        <TouchableOpacity 
                            onPress={() => {
                                if (selectedCourseId !== null && route.params?.courseId === undefined) {
                                    setSelectedCourseId(null);
                                } else {
                                    navigation.goBack();
                                }
                            }} 
                            style={styles.headerIconButtonPremium} 
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="chevron-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitlePremium}>EXAM VAULT</Text>
                        <TouchableOpacity 
                            onPress={() => {
                                try {
                                    navigation.openDrawer();
                                } catch (e) {
                                    navigation.dispatch(DrawerActions.openDrawer());
                                }
                            }} 
                            style={styles.headerIconButtonPremium}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="menu-outline" size={32} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {selectedCourseId !== null && (
                    <>
                        <View style={styles.tabContainer}>
                            <Pressable
                                style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
                                onPress={() => setActiveTab('all')}
                            >
                                {activeTab === 'all' && <LinearGradient colors={['#dc2626', '#f97316']} style={styles.tabLine} />}
                                <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All Exams</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.tabButton, activeTab === 'purchased' && styles.tabButtonActive]}
                                onPress={() => setActiveTab('purchased')}
                            >
                                {activeTab === 'purchased' && <LinearGradient colors={['#dc2626', '#f97316']} style={styles.tabLine} />}
                                <Text style={[styles.tabText, activeTab === 'purchased' && styles.tabTextActive]}>My Library</Text>
                            </Pressable>
                        </View>

                        <View style={styles.filterSection}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicScroll}>
                                {topics.map(topic => (
                                    <Pressable
                                        key={topic.id}
                                        style={[styles.topicChip, selectedTopic === topic.id && styles.topicChipActive]}
                                        onPress={() => handleTopicSelect(topic.id)}
                                    >
                                        {selectedTopic === topic.id && <LinearGradient colors={['#dc2626', '#f97316']} style={StyleSheet.absoluteFillObject} />}
                                        <Text style={[styles.topicChipText, selectedTopic === topic.id && styles.topicChipTextActive]}>
                                            {topic.name}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>

                            {selectedTopic && subtopics.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subtopicScroll}>
                                    {subtopics.map(sub => (
                                        <Pressable
                                            key={sub.id}
                                            style={[styles.subChip, selectedSubtopic === sub.id && styles.subChipActive]}
                                            onPress={() => setSelectedSubtopic(selectedSubtopic === sub.id ? null : sub.id)}
                                        >
                                            <Text style={[styles.subChipText, selectedSubtopic === sub.id && styles.subChipTextActive]}>
                                                {sub.name}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    </>
                )}

                <FlatList
                    data={filteredTests}
                    keyExtractor={(item) => item.id}
                    renderItem={selectedCourseId === null ? null : renderTestItem}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        selectedCourseId === null ? (
                            <View style={styles.courseBannersContainer}>
                                {COURSE_BANNERS.map((banner) => (
                                    <TouchableOpacity 
                                        key={banner.id} 
                                        activeOpacity={0.9} 
                                        onPress={() => setSelectedCourseId(banner.id)}
                                        style={styles.verticalBannerWrapper}
                                    >
                                        <LinearGradient colors={banner.colors} style={styles.verticalBannerCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                                                <Text style={styles.bannerTitle}>{banner.title}</Text>
                                            </View>
                                            <Ionicons name={banner.icon} size={60} color="rgba(255,255,255,0.2)" />
                                        </LinearGradient>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : null
                    }
                    ListFooterComponent={
                        (!isPro && user?.role?.toLowerCase() === 'student') && (selectedCourseId !== null) ? (
                            <Pressable
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
                            </Pressable>
                        ) : null
                    }
                    ListEmptyComponent={
                        selectedCourseId === null ? null : (
                            loading ? (
                                <View style={styles.emptyContainer}>
                                    <ActivityIndicator size="large" color="#dc2626" />
                                    <Text style={styles.emptyText}>Loading Library...</Text>
                                </View>
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <Ionicons name="search-outline" size={64} color="rgba(0,0,0,0.05)" />
                                    <Text style={styles.emptyText}>No matching tests found.</Text>
                                </View>
                            )
                        )
                    }
                />
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
    premiumHeaderSticky: {
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 8,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        zIndex: 1000,
    },
    headerRowSticky: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerIconButtonPremium: { 
        width: 44, 
        height: 44, 
        borderRadius: 12, 
        backgroundColor: 'rgba(255,255,255,0.2)', 
        justifyContent: 'center', 
        alignItems: 'center',
    },
    headerTitlePremium: { 
        color: '#fff', 
        fontSize: 18, 
        fontWeight: '900', 
        letterSpacing: 1.5,
        textTransform: 'uppercase',
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
        color: '#94a3b8',
    },
    tabTextActive: {
        color: '#1e293b',
    },
    filterSection: {
        paddingVertical: 8,
    },
    topicScroll: {
        paddingHorizontal: 20,
        paddingBottom: 4,
    },
    topicChip: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 }
    },
    topicChipActive: {
        borderColor: '#dc2626',
    },
    topicChipText: {
        color: '#64748b',
        fontWeight: 'bold',
        fontSize: 13,
    },
    topicChipTextActive: {
        color: '#ffffff',
    },
    subtopicScroll: {
        paddingHorizontal: 20,
        marginTop: 8,
    },
    subChip: {
        backgroundColor: '$#ffffff',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 10,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    subChipActive: {
        backgroundColor: '#eff6ff',
        borderColor: '#3b82f6',
    },
    subChipText: {
        color: '#475569',
        fontSize: 11,
        fontWeight: '600',
    },
    subChipTextActive: {
        color: '#2563eb',
    },
    listContent: {
        padding: 20,
    },
    testCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
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
        color: '#64748b',
        fontSize: 12,
        fontWeight: '600',
    },
    testTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: '#1e293b',
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    testDesc: {
        color: '#475569',
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 20,
    },
    testFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
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
    courseBannersContainer: {
        paddingBottom: 20,
    },
    verticalBannerWrapper: {
        marginBottom: 16,
        borderRadius: 24,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        overflow: 'hidden',
    },
    verticalBannerCard: {
        width: '100%',
        height: 160,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
    },
    bannerTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '900',
    },
    bannerSubtitle: {
        color: '#ffffffcc',
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
});
