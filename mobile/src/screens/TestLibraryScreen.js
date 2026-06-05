import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    FlatList,
    TouchableOpacity,
} from 'react-native';
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
        { id: 'PMMG', title: "Postman & Mail Guard", subtitle: "COMPLETE PAPER 1 & 2", colors: ['#1e3a8a', '#1d4ed8'], icon: 'cube-outline' },
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
            // Sync fresh profile from server to catch any recent payments
            let userData;
            try {
                userData = await authService.getProfile();
            } catch (err) {
                console.log("Profile refresh failed, falling back to local user", err);
                userData = await authService.getUser();
            }
            setUser(userData);

            const rawCourseId = (selectedCourseId || route.params?.courseId || '').toUpperCase();
            const courseIdFilter = rawCourseId === 'COMBINED' ? null : rawCourseId;
            console.log("Loading Library for course:", courseIdFilter, "User Pro:", userData?.subscriptionTier);

            const [topicsData, testsData] = await Promise.all([
                topicService.getAllTopics(courseIdFilter),
                testService.getAvailableTests(courseIdFilter)
            ]);

            const topicsList = Array.isArray(topicsData) ? topicsData : [];
            setTopics(topicsList.filter(t => t && !t.syllabusOnly));
            setTests(Array.isArray(testsData) ? testsData : []);

            if (topicsList.length > 0) {
                const firstTopic = topicsList[0];
                setSelectedTopic(firstTopic.id);
                try {
                    const subData = await topicService.getSubtopics(firstTopic.id);
                    setSubtopics(Array.isArray(subData) ? subData : []);
                    // Crucial Fix: We do NOT auto-select the first subtopic.
                    // Doing so hides tests that belong to the Topic but don't belong strictly to the first subtopic.
                    setSelectedSubtopic(null); 
                } catch (subErr) {
                    console.error("Auto load subtopics failed", subErr);
                    setSubtopics([]);
                }
            }

            try {
                const userId = userData?.id || userData?._id;
                if (userId) {
                    const response = await api.get(`/payments/user-purchases?userId=${userId}`);
                    setPurchases(Array.isArray(response.data) ? response.data : []);
                } else {
                    setPurchases([]);
                }
            } catch (pErr) {
                console.log("No purchases found or error:", pErr);
                setPurchases([]);
            }
        } catch (err) {
            console.error("Load Library error:", err);
            setTopics([]);
            setTests([]);
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
            try {
                const sub = await topicService.getSubtopics(topicId);
                setSubtopics(Array.isArray(sub) ? sub : []);
            } catch (err) {
                console.error("Failed to fetch subtopics on topic select", err);
                setSubtopics([]);
            }
            // Crucial Fix: Always default to 'All Subtopics' when changing Topics
            setSelectedSubtopic(null);
        }
    };

    const isPro = user?.subscriptionTier === 'PREMIUM' || user?.role === 'ADMIN' || user?.role === 'TEACHER';
    const unlockedExams = Array.isArray(user?.unlockedExams) ? user.unlockedExams : [];

    const renderTestItem = ({ item }) => {
        const isPremium = item.premium || item.isPremium;
        const purchasedIds = Array.isArray(purchases) ? purchases.map(p => p.itemId) : [];
        
        // Course-based locking logic (Shared Content Support)
        const itemCourseIds = Array.isArray(item.courseIds) ? item.courseIds : [];
        const isUnlocked = isPro || 
                          unlockedExams.some(u => u && typeof u === 'string' && u.toUpperCase() === 'COMBINED') || 
                          itemCourseIds.some(cid => cid && typeof cid === 'string' && unlockedExams.some(u => u && typeof u === 'string' && u.toUpperCase() === cid.toUpperCase())) ||
                          purchasedIds.includes(item.id);

        // Find if this is a sample test (first 2 tests in any of its courses)
        const isSample = itemCourseIds.some(cid => {
            const courseTests = (tests || []).filter(t => 
                Array.isArray(t.courseIds) && t.courseIds.some(c => c && c.toUpperCase() === cid.toUpperCase())
            );
            const sorted = [...courseTests].sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateA - dateB; // Oldest first
            });
            const index = sorted.findIndex(t => t.id === item.id);
            return index >= 0 && index < 2; // Unlocked as sample
        });

        const isLocked = isPremium && !isUnlocked && !isSample;

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
                    {isPremium && !isUnlocked && isSample && <Text style={{ color: '#10b981' }}>[FREE SAMPLE] </Text>}
                    {isLocked && <Text style={{ color: '#f97316' }}>[PRO] </Text>}
                    {item.title}
                </Text>

                <Text style={styles.testDesc} numberOfLines={2}>{item.description}</Text>

                <View style={styles.testFooter}>
                    <Text style={styles.categoryText}>{item.category || 'General'}</Text>
                    <View style={[styles.startButton, isLocked ? styles.lockedBtn : styles.unlockedBtn]}>
                        <LinearGradient
                            colors={isLocked ? ['#475569', '#334155'] : ['#dc2626', '#f97316']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.btnGradient}
                        >
                            <Text style={styles.startButtonText}>
                                {isLocked ? 'Unlock PRO' : 'Start Test'}
                            </Text>
                        </LinearGradient>
                    </View>
                </View>
            </Pressable>
        );
    };

    // Removed full-screen loading to allow header shell to mount instantly

    const purchasedIds = Array.isArray(purchases) ? purchases.map(p => p.itemId) : [];

    const filteredTests = (Array.isArray(tests) ? tests : []).filter(test => {
        const matchesTopic = !selectedTopic || test.topicId === selectedTopic;
        const matchesSubtopic = !selectedSubtopic || test.subtopicId === selectedSubtopic;

        if (activeTab === 'purchased') {
            const unlockedList = Array.isArray(user?.unlockedExams) ? user.unlockedExams : [];
            const hasAccess = isPro || 
                             purchasedIds.includes(test.id) || 
                             (Array.isArray(test.courseIds) ? test.courseIds : []).some(cid => cid && typeof cid === 'string' && unlockedList.some(ul => ul && typeof ul === 'string' && ul.toUpperCase() === cid.toUpperCase())) ||
                             unlockedList.some(ul => ul && typeof ul === 'string' && ul.toUpperCase() === 'COMBINED');
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
                                    navigation.navigate('Home');
                                }
                            }} 
                            style={styles.headerIconButtonPremium} 
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
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
                )}

                <FlatList
                    data={[]}
                    keyExtractor={() => 'empty'}
                    renderItem={null}
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
                        ) : (
                            <View style={styles.verticalHierarchyContainer}>
                                {topics.map((topic, tIdx) => {
                                    const isSelfSelected = selectedTopic === topic.id;
                                    const topicColors = [['#dc2626', '#b91c1c'], ['#1e3a8a', '#1d4ed8'], ['#7c3aed', '#5b21b6'], ['#059669', '#047857']];
                                    const colors = topicColors[tIdx % topicColors.length];

                                    return (
                                        <View key={topic.id} style={styles.hierarchyItem}>
                                            <TouchableOpacity 
                                                activeOpacity={0.8}
                                                onPress={() => handleTopicSelect(topic.id)}
                                                style={[styles.topicBannerWrapper, isSelfSelected && styles.topicBannerActive]}
                                            >
                                                <LinearGradient colors={isSelfSelected ? colors : ['#ffffff', '#f8fafc']} style={styles.topicBannerCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                                    <Ionicons name="folder-open-outline" size={24} color={isSelfSelected ? '#fff' : colors[0]} style={{ marginRight: 15 }} />
                                                    <Text style={[styles.topicBannerTitle, isSelfSelected && styles.topicBannerTitleActive]}>{topic.name}</Text>
                                                    <Ionicons name={isSelfSelected ? "chevron-up" : "chevron-down"} size={20} color={isSelfSelected ? '#fff' : '#64748b'} />
                                                </LinearGradient>
                                            </TouchableOpacity>

                                            {isSelfSelected && (
                                                <View style={styles.subtopicList}>
                                                    {/* Topic-level tests (General Exams with no subtopic) */}
                                                    <View style={styles.inlineTestList}>
                                                        {filteredTests.filter(t => t.topicId === topic.id && (!t.subtopicId || t.subtopicId === "null" || t.subtopicId === "")).map(test => (
                                                            <View key={test.id} style={{ marginBottom: 12 }}>
                                                                {renderTestItem({ item: test })}
                                                            </View>
                                                        ))}
                                                    </View>

                                                    {subtopics.length > 0 && subtopics.map((sub) => {
                                                        const isSubActive = selectedSubtopic === sub.id;
                                                        return (
                                                            <View key={sub.id}>
                                                                <TouchableOpacity 
                                                                    activeOpacity={0.7}
                                                                    onPress={() => setSelectedSubtopic(isSubActive ? null : sub.id)}
                                                                    style={[styles.subtopicBanner, isSubActive && styles.subtopicBannerActive]}
                                                                >
                                                                    <View style={[styles.subtopicMarker, { backgroundColor: isSubActive ? colors[0] : '#e2e8f0' }]} />
                                                                    <Text style={[styles.subtopicText, isSubActive && styles.subtopicTextActive]}>{sub.name}</Text>
                                                                    <Ionicons name={isSubActive ? "eye-outline" : "chevron-forward"} size={16} color={isSubActive ? colors[0] : '#94a3b8'} />
                                                                </TouchableOpacity>
                                                                
                                                                {/* Tests inside the subtopic (Folder Style) */}
                                                                {isSubActive && (
                                                                    <View style={styles.inlineTestList}>
                                                                        {filteredTests.filter(t => t.subtopicId === sub.id).map(test => (
                                                                            <View key={test.id} style={{ marginBottom: 12 }}>
                                                                                {renderTestItem({ item: test })}
                                                                            </View>
                                                                        ))}
                                                                        {filteredTests.filter(t => t.subtopicId === sub.id).length === 0 && (
                                                                            <Text style={styles.noTestsText}>No tests in this category yet.</Text>
                                                                        )}
                                                                    </View>
                                                                )}
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        )
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
    unlockedBtn: {
        backgroundColor: '#16a34a',
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
    // VERTICAL HIERARCHY STYLES
    verticalHierarchyContainer: {
        marginBottom: 20,
    },
    hierarchyItem: {
        marginBottom: 12,
    },
    topicBannerWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
    },
    topicBannerActive: {
        borderColor: 'transparent',
        elevation: 6,
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    topicBannerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
    },
    topicBannerTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '800',
        color: '#1e293b',
    },
    topicBannerTitleActive: {
        color: '#fff',
    },
    subtopicList: {
        marginTop: 8,
        paddingLeft: 10,
    },
    subtopicBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    subtopicBannerActive: {
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
    },
    subtopicMarker: {
        width: 4,
        height: 16,
        borderRadius: 2,
        marginRight: 12,
    },
    subtopicText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b',
    },
    subtopicTextActive: {
        color: '#1e293b',
    },
    testsLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: 15,
        marginTop: 15,
        marginBottom: 5,
    },
    inlineTestList: {
        marginTop: 10,
        marginBottom: 15,
        paddingLeft: 10,
    },
    noTestsText: {
        fontSize: 12,
        color: '#94a3b8',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 10,
    }
});
