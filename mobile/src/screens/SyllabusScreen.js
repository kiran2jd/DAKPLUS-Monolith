import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { topicService } from '../services/topic';

const { width } = Dimensions.get('window');

/**
 * SYLLABUS SCREEN (v1.0)
 * Aligned with Frontend Course Syllabus.
 */
export default function SyllabusScreen({ navigation }) {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSyllabus();
    }, []);

    const fetchSyllabus = async () => {
        try {
            const topicsData = await topicService.getAllTopics();
            // Fetch subtopics for each topic
            const syllabus = await Promise.all(topicsData.map(async (topic) => {
                try {
                    const subtopics = await topicService.getSubtopics(topic.id);
                    return { ...topic, subtopics };
                } catch (e) {
                    return { ...topic, subtopics: [] };
                }
            }));
            setTopics(syllabus);
        } catch (err) {
            console.error("Failed to load syllabus", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#dc2626" />
                <Text style={styles.loadingText}>Loading Course Syllabus...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.title}>Course Syllabus</Text>
                    <Text style={styles.subtitle}>Explore topics covered in mock exams</Text>
                </View>
                <View style={styles.headerIconBg}>
                    <Ionicons name="book" size={24} color="#dc2626" />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {topics && topics.length > 0 ? (
                    topics.map((topic) => (
                        <View key={topic.id} style={styles.topicCard}>
                            {topic.imageUrl && (
                                <View style={styles.topicImageContainer}>
                                    <Image 
                                        source={{ uri: topic.imageUrl.startsWith('/') ? `https://api-v2.dakplus.in${topic.imageUrl}` : topic.imageUrl }} 
                                        style={styles.topicImage}
                                        resizeMode="cover"
                                    />
                                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.imageOverlay} />
                                </View>
                            )}
                            <View style={styles.topicHeader}>
                                <View style={styles.gradIconBg}>
                                    <Ionicons name="school" size={22} color="#2563eb" />
                                </View>
                                <Text style={styles.topicName}>{topic.name}</Text>
                            </View>
                            <Text style={styles.topicDesc}>{topic.description || 'Comprehensive coverage of this subject area for postal exams.'}</Text>

                            <View style={styles.moduleSection}>
                                <Text style={styles.moduleHeader}>MODULES</Text>
                                {topic.subtopics?.length > 0 ? (
                                    topic.subtopics.map((sub) => (
                                        <View key={sub.id} style={styles.moduleRowContainer}>
                                            <View style={styles.moduleRow}>
                                                <Text style={styles.moduleName}>{sub.name}</Text>
                                                <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
                                            </View>
                                            {sub.pdfUrl && (
                                                <TouchableOpacity 
                                                    style={styles.pdfBadge}
                                                    onPress={() => WebBrowser.openBrowserAsync(sub.pdfUrl.startsWith('/') ? `https://api-v2.dakplus.in${sub.pdfUrl}` : sub.pdfUrl)}
                                                >
                                                    <Ionicons name="document-text" size={12} color="#2563eb" />
                                                    <Text style={styles.pdfBadgeText}>Study Material</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.emptyText}>No subtopics available for this topic.</Text>
                                )}
                            </View>

                            <View style={styles.cardActions}>
                                {topic.pdfUrl && (
                                    <TouchableOpacity 
                                        style={[styles.actionBtn, styles.pdfBtn]}
                                        onPress={() => WebBrowser.openBrowserAsync(topic.pdfUrl.startsWith('/') ? `https://api-v2.dakplus.in${topic.pdfUrl}` : topic.pdfUrl)}
                                    >
                                        <Ionicons name="download" size={18} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.actionBtnText}>Full Syllabus</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity 
                                    style={[styles.actionBtn, { flex: 1 }]}
                                    onPress={() => navigation.navigate('Tests')}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name="list" size={18} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.actionBtnText}>View Tests</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="documents-outline" size={64} color="#e2e8f0" />
                        <Text style={styles.emptyTitle}>Syllabus Unavailable</Text>
                        <Text style={styles.emptySubtitle}>No topics found. Please check back later.</Text>
                    </View>
                )}
                
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerTextContainer: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    headerIconBg: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#fef2f2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContainer: {
        padding: 20,
    },
    topicCard: {
        backgroundColor: '#fff',
        borderRadius: 28,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        overflow: 'hidden',
    },
    topicImageContainer: {
        height: 160,
        width: '100%',
        backgroundColor: '#f1f5f9',
    },
    topicImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    topicHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        marginBottom: 12,
    },
    gradIconBg: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    topicName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        flex: 1,
    },
    topicDesc: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
        marginBottom: 20,
        paddingHorizontal: 24,
    },
    moduleSection: {
        backgroundColor: '#f8fafc',
        borderRadius: 20,
        padding: 16,
        marginHorizontal: 16,
    },
    moduleHeader: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 1.5,
        marginBottom: 12,
        marginLeft: 4,
    },
    moduleRowContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        overflow: 'hidden',
    },
    moduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    pdfBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    pdfBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#2563eb',
        marginLeft: 6,
    },
    moduleName: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    emptyText: {
        fontSize: 12,
        color: '#94a3b8',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 10,
    },
    cardActions: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
    },
    actionBtn: {
        backgroundColor: '#1e293b',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#1e293b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    pdfBtn: {
        backgroundColor: '#ef4444',
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 8,
        textAlign: 'center',
    },
});
