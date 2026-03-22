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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';
import { topicService } from '../services/topic';

const { width } = Dimensions.get('window');

/**
 * SYLLABUS SCREEN (v1.0)
 * Aligned with Frontend Course Syllabus.
 */
export default function SyllabusScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState(route.params?.courseId || null);
    const [isStaff, setIsStaff] = useState(false);
    const [uploadingId, setUploadingId] = useState(null);

    const COURSE_BANNERS = [
        { id: 'MTS', title: 'MTS Exam', sub: 'Target 2026', color: '#dc2626', icon: 'document-text' },
        { id: 'PMMG', title: 'Postman / MG', sub: 'Paper 1 & 2', color: '#3b82f6', icon: 'mail' },
        { id: 'PASA', title: 'PA / SA Special', sub: 'Target 2026', color: '#8b5cf6', icon: 'business' },
        { id: 'COMBINED', title: 'Combined Pro', sub: 'All-in-One', color: '#10b981', icon: 'shield-checkmark' }
    ];

    useEffect(() => {
        checkAuth();
        if (selectedCourseId) {
            const courseId = selectedCourseId === 'COMBINED' ? null : selectedCourseId;
            fetchSyllabus(courseId);
        }
    }, [selectedCourseId]);

    const checkAuth = async () => {
        try {
            const userStr = await SecureStore.getItemAsync('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setIsStaff(user.role === 'STAFF' || user.role === 'ADMIN');
            }
        } catch (e) {
            console.error("Auth check failed", e);
        }
    };

    const fetchSyllabus = async (courseId) => {
        setLoading(true);
        try {
            const topicsData = await topicService.getAllTopics(courseId);
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

    const pickAndUploadSyllabus = async (id, type) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            const file = result.assets[0];
            setUploadingId(id);
            
            // 1. Upload the file to get URL
            const uploadRes = await topicService.uploadSyllabusFile(file.uri, file.name, file.mimeType);
            
            if (uploadRes && uploadRes.url) {
                // 2. Update the topic/subtopic record
                if (type === 'topic') {
                    await topicService.updateTopic(id, { pdfUrl: uploadRes.url });
                } else {
                    await topicService.updateSubtopic(id, { pdfUrl: uploadRes.url });
                }
                
                // 3. Refresh data
                const courseId = selectedCourseId === 'COMBINED' ? null : selectedCourseId;
                await fetchSyllabus(courseId);
            }
        } catch (e) {
            console.error("Upload failed", e);
            alert("Syllabus upload failed. Please try again.");
        } finally {
            setUploadingId(null);
        }
    };

    const renderBanners = () => (
        <ScrollView contentContainerStyle={styles.bannerContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Select Course Syllabus</Text>
            {COURSE_BANNERS.map((banner) => (
                <TouchableOpacity 
                    key={banner.id}
                    onPress={() => setSelectedCourseId(banner.id)}
                    style={styles.bannerCard}
                    activeOpacity={0.9}
                >
                    <LinearGradient 
                        colors={[`${banner.color}CC`, banner.color]} 
                        style={styles.bannerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <View style={styles.bannerIconContainer}>
                            <Ionicons name={banner.icon} size={32} color="#fff" />
                        </View>
                        <View style={styles.bannerTextContainer}>
                            <Text style={styles.bannerTitle}>{banner.title}</Text>
                            <Text style={styles.bannerSub}>{banner.sub}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.5)" />
                    </LinearGradient>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    const renderFolderView = () => (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.pathContainer}>
                <TouchableOpacity onPress={() => setSelectedCourseId(null)} style={styles.breadcrumb}>
                    <Text style={styles.breadcrumbText}>Syllabus</Text>
                </TouchableOpacity>
                <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
                <Text style={styles.currentPath}>{selectedCourseId}</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#dc2626" />
                    <Text style={styles.loadingText}>Opening Module Folders...</Text>
                </View>
            ) : topics.length > 0 ? (
                topics.map((topic) => (
                    <View key={topic.id} style={styles.topicCard}>
                        <View style={styles.topicHeader}>
                            <View style={styles.folderIconBg}>
                                <Ionicons name="folder" size={24} color="#f59e0b" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.topicName}>{topic.name}</Text>
                                <Text style={styles.topicDesc} numberOfLines={2}>{topic.description || 'Module Guide'}</Text>
                            </View>
                        </View>

                        <View style={styles.moduleSection}>
                            {topic.subtopics?.length > 0 ? (
                                topic.subtopics.map((sub) => (
                                    <View key={sub.id} style={styles.moduleRowContainer}>
                                        <View style={styles.moduleRow}>
                                            <Ionicons name="document-text-outline" size={18} color="#64748b" style={{ marginRight: 10 }} />
                                            <Text style={styles.moduleName}>{sub.name}</Text>
                                        </View>
                                        {sub.pdfUrl && (
                                            <TouchableOpacity 
                                                style={styles.pdfBadge}
                                                onPress={() => WebBrowser.openBrowserAsync(sub.pdfUrl.startsWith('/') ? `https://api-v2.dakplus.in${sub.pdfUrl}` : sub.pdfUrl)}
                                            >
                                                <LinearGradient colors={['#2563eb', '#1d4ed8']} style={styles.pdfButtonSub}>
                                                    <Ionicons name="download-outline" size={14} color="#fff" />
                                                    <Text style={styles.pdfButtonText}>View Syllabus PDF</Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        )}
                                        {isStaff && (
                                            <TouchableOpacity 
                                                style={[styles.staffUploadBtn, sub.pdfUrl && { marginTop: 8 }]}
                                                onPress={() => pickAndUploadSyllabus(sub.id, 'subtopic')}
                                                disabled={uploadingId === sub.id}
                                            >
                                                {uploadingId === sub.id ? (
                                                    <ActivityIndicator size="small" color="#1e293b" />
                                                ) : (
                                                    <>
                                                        <Ionicons name="cloud-upload-outline" size={14} color="#1e293b" />
                                                        <Text style={styles.staffUploadText}>{sub.pdfUrl ? 'Update Syllabus PDF' : 'Upload Syllabus PDF'}</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyText}>No syllabus available in this folder.</Text>
                            )}
                        </View>
                        
                        {topic.pdfUrl && (
                            <TouchableOpacity 
                                style={styles.fullSyllabusBtn}
                                onPress={() => WebBrowser.openBrowserAsync(topic.pdfUrl.startsWith('/') ? `https://api-v2.dakplus.in${topic.pdfUrl}` : topic.pdfUrl)}
                            >
                                <Ionicons name="copy" size={16} color="#fff" />
                                <Text style={styles.fullSyllabusText}>View Full Topic Syllabus</Text>
                            </TouchableOpacity>
                        )}
                        {isStaff && (
                            <TouchableOpacity 
                                style={[styles.fullSyllabusBtn, { backgroundColor: '#f1f5f9' }]}
                                onPress={() => pickAndUploadSyllabus(topic.id, 'topic')}
                                disabled={uploadingId === topic.id}
                            >
                                {uploadingId === topic.id ? (
                                    <ActivityIndicator size="small" color="#1e293b" />
                                ) : (
                                    <>
                                        <Ionicons name="cloud-upload" size={16} color="#1e293b" />
                                        <Text style={[styles.fullSyllabusText, { color: '#1e293b' }]}>
                                            {topic.pdfUrl ? 'Update Main Topic Syllabus' : 'Upload Main Topic Syllabus'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                ))
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="folder-open-outline" size={64} color="#e2e8f0" />
                    <Text style={styles.emptyTitle}>Folder is Empty</Text>
                </View>
            )}
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient 
                colors={['#1e293b', '#0f172a']} 
                style={[styles.premiumHeader, { paddingTop: Math.max(insets.top, 15) }]}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity 
                        onPress={() => selectedCourseId ? setSelectedCourseId(null) : navigation.goBack()} 
                        style={styles.headerIconButtonPremium}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitlePremium}>SYLLABUS HUB</Text>
                    <View style={styles.headerIconButtonPremium}>
                        <Ionicons name="book" size={24} color="#3b82f6" />
                    </View>
                </View>
            </LinearGradient>

            {!selectedCourseId ? renderBanners() : renderFolderView()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    premiumHeader: {
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerIconButtonPremium: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    headerTitlePremium: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
    
    // Banner Styles
    bannerContainer: { padding: 20 },
    sectionTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 20, marginLeft: 5 },
    bannerCard: { marginBottom: 16, borderRadius: 24, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
    bannerGradient: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    bannerIconContainer: { width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    bannerTextContainer: { flex: 1 },
    bannerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    bannerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '500', marginTop: 2 },

    // Path / Breadcrumb
    pathContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 15, marginBottom: 5 },
    breadcrumb: { paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#f1f5f9', borderRadius: 8 },
    breadcrumbText: { fontSize: 12, color: '#64748b', fontWeight: '700' },
    currentPath: { fontSize: 12, color: '#1e293b', fontWeight: '900', marginLeft: 8, textTransform: 'uppercase' },

    // Folder View Styles
    scrollContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
    topicCard: { backgroundColor: '#fff', borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10 },
    topicHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
    folderIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fef3c7', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    topicName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    topicDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
    
    moduleSection: { paddingHorizontal: 15, paddingBottom: 15 },
    moduleRowContainer: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' },
    moduleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    moduleName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#334155' },
    
    pdfBadge: { width: '100%' },
    pdfButtonSub: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12 },
    pdfButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 8 },
    
    fullSyllabusBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    fullSyllabusText: { color: '#fff', fontSize: 13, fontWeight: 'bold', marginLeft: 10 },

    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 100 },
    loadingText: { marginTop: 15, color: '#64748b', fontWeight: '600' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: 60 },
    emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#cbd5e1', marginTop: 10 },
    emptyText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', fontStyle: 'italic', padding: 20 },
    staffUploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#fff',
    },
    staffUploadText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1e293b',
        marginLeft: 8,
    },
});
