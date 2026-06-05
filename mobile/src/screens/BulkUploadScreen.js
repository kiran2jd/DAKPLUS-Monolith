import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { testService } from '../services/test';
import { topicService } from '../services/topic';

export default function BulkUploadScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState('');
    const [subtopics, setSubtopics] = useState([]);
    const [selectedSubtopic, setSelectedSubtopic] = useState('');
    const [courseIds, setCourseIds] = useState([]);
    const [autoDetect, setAutoDetect] = useState(true);

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        try {
            const data = await topicService.getAllTopics();
            setTopics(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch topics", err);
            setTopics([]);
        }
    };

    const handleTopicChange = async (topicId) => {
        setSelectedTopic(topicId);
        setSelectedSubtopic('');
        if (topicId) {
            try {
                const data = await topicService.getSubtopics(topicId);
                setSubtopics(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to fetch subtopics", err);
                setSubtopics([]);
            }
        } else {
            setSubtopics([]);
        }
    };

    const handleFilePick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'text/plain'
                ],
                multiple: true,
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedFiles(prev => [...prev, ...result.assets]);
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to pick documents');
        }
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const toggleCourse = (id) => {
        setCourseIds(prev => 
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            Alert.alert('Error', 'Please select at least one file.');
            return;
        }

        setLoading(true);
        try {
            const response = await testService.bulkUpload(
                selectedFiles,
                autoDetect ? null : selectedTopic,
                autoDetect ? null : selectedSubtopic,
                autoDetect ? [] : courseIds
            );
            Alert.alert('Bulk Upload Started', response.message);
            navigation.goBack();
        } catch (err) {
            console.error("Bulk Upload Error:", err);
            Alert.alert('Error', 'Failed to start bulk upload. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#fcf9f2', '#fcf9f2']} style={[styles.header, { paddingTop: Math.max(insets.top, 15) }]}>
                <View style={styles.topNav}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
                        <Ionicons name="chevron-back" size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>BULK INGESTION</Text>
                    <View style={{ width: 44 }} />
                </View>
                <Text style={styles.headerSubtitle}>Upload 100+ tests at once for AI analysis</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Select Files (PDF/Word/Txt)</Text>
                        <TouchableOpacity style={styles.filePickerBtn} onPress={handleFilePick}>
                            <Ionicons name="cloud-upload-outline" size={32} color="#dc2626" />
                            <Text style={styles.filePickerText}>Tap to select multiple files</Text>
                        </TouchableOpacity>

                        {selectedFiles.length > 0 && (
                            <View style={styles.fileList}>
                                {selectedFiles.map((file, idx) => (
                                    <View key={idx} style={styles.fileItem}>
                                        <Ionicons name="document-text-outline" size={20} color="#64748b" />
                                        <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                                        <TouchableOpacity onPress={() => removeFile(idx)}>
                                            <Ionicons name="close-circle" size={20} color="#ef4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <TouchableOpacity onPress={() => setSelectedFiles([])}>
                                    <Text style={styles.clearAllText}>Clear All</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Categorization Mode</Text>
                        <View style={styles.modeContainer}>
                            <TouchableOpacity 
                                style={[styles.modeBtn, autoDetect ? styles.modeBtnSelected : null]} 
                                onPress={() => setAutoDetect(true)}
                            >
                                <Ionicons name="sparkles" size={20} color={autoDetect ? "#fff" : "#64748b"} />
                                <Text style={[styles.modeBtnText, autoDetect ? styles.modeBtnTextSelected : null]}>AI Auto-Detect</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modeBtn, !autoDetect ? styles.modeBtnSelected : null]} 
                                onPress={() => setAutoDetect(false)}
                            >
                                <Ionicons name="options" size={20} color={!autoDetect ? "#fff" : "#64748b"} />
                                <Text style={[styles.modeBtnText, !autoDetect ? styles.modeBtnTextSelected : null]}>Manual Select</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {!autoDetect && (
                        <>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Available In Courses</Text>
                                <View style={styles.courseSelectionRow}>
                                    {['MTS', 'PMMG', 'PASA'].map(cid => (
                                        <TouchableOpacity 
                                            key={cid}
                                            style={[styles.courseChip, courseIds.includes(cid) ? styles.courseChipSelected : null]}
                                            onPress={() => toggleCourse(cid)}
                                        >
                                            <Ionicons 
                                                name={courseIds.includes(cid) ? "checkbox" : "square-outline"} 
                                                size={16} 
                                                color={courseIds.includes(cid) ? "#fff" : "#64748b"} 
                                            />
                                            <Text style={[styles.courseChipText, courseIds.includes(cid) ? styles.courseChipTextSelected : null]}>
                                                {cid}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Target Topic</Text>
                                <View style={styles.pickerContainer}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <TouchableOpacity
                                            style={[styles.chip, !selectedTopic ? styles.chipSelected : null]}
                                            onPress={() => handleTopicChange('')}
                                        >
                                            <Text style={[styles.chipText, !selectedTopic ? styles.chipTextSelected : null]}>None</Text>
                                        </TouchableOpacity>
                                        {Array.isArray(topics) && topics.map(t => (
                                            <TouchableOpacity
                                                key={t.id}
                                                style={[styles.chip, selectedTopic === t.id ? styles.chipSelected : null]}
                                                onPress={() => handleTopicChange(t.id)}
                                            >
                                                <Text style={[styles.chipText, selectedTopic === t.id ? styles.chipTextSelected : null]}>{t.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>

                            {subtopics.length > 0 && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Subtopic</Text>
                                    <View style={styles.pickerContainer}>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            <TouchableOpacity
                                                style={[styles.chip, !selectedSubtopic ? styles.chipSelected : null]}
                                                onPress={() => setSelectedSubtopic('')}
                                            >
                                                <Text style={[styles.chipText, !selectedSubtopic ? styles.chipTextSelected : null]}>None</Text>
                                            </TouchableOpacity>
                                            {Array.isArray(subtopics) && subtopics.map(s => (
                                                <TouchableOpacity
                                                    key={s.id}
                                                    style={[styles.chip, selectedSubtopic === s.id ? styles.chipSelected : null]}
                                                    onPress={() => setSelectedSubtopic(s.id)}
                                                >
                                                    <Text style={[styles.chipText, selectedSubtopic === s.id ? styles.chipTextSelected : null]}>{s.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                </View>
                            )}
                        </>
                    )}

                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={20} color="#0369a1" />
                        <Text style={styles.infoText}>
                            AI will process these files in the background. Tests will appear in the library as they are ready. Hindi translations and explanations will follow shortly after.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, loading ? styles.disabledBtn : null]}
                        onPress={handleUpload}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Start Bulk Processing</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcf9f2' },
    header: { paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
    headerIconButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
    headerTitle: { color: '#1e293b', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
    headerSubtitle: { color: '#475569', fontSize: 13, textAlign: 'center', fontWeight: '500' },
    scrollContainer: { flexGrow: 1, paddingBottom: 40 },
    form: { padding: 20 },
    inputGroup: { marginBottom: 24 },
    label: { color: '#64748b', fontSize: 13, marginBottom: 10, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
    filePickerBtn: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed'
    },
    filePickerText: { color: '#64748b', marginTop: 12, fontWeight: '700', fontSize: 14 },
    fileList: { marginTop: 15, gap: 10 },
    fileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 10
    },
    fileName: { flex: 1, fontSize: 14, color: '#1e293b', fontWeight: '600' },
    clearAllText: { color: '#ef4444', textAlign: 'right', fontSize: 12, fontWeight: 'bold', marginTop: 5 },
    submitButton: { backgroundColor: '#dc2626', padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 20 },
    submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    disabledBtn: { opacity: 0.6 },
    infoBox: { flexDirection: 'row', backgroundColor: '#f0f9ff', padding: 16, borderRadius: 16, gap: 12, marginBottom: 24, borderWidth: 1, borderColor: '#bae6fd' },
    infoText: { flex: 1, color: '#0369a1', fontSize: 12, lineHeight: 18, fontWeight: '500' },
    modeContainer: { flexDirection: 'row', gap: 10 },
    modeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 8
    },
    modeBtnSelected: {
        backgroundColor: '#dc2626',
        borderColor: '#dc2626'
    },
    modeBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748b'
    },
    modeBtnTextSelected: {
        color: '#fff'
    },
    pickerContainer: { marginBottom: 10 },
    chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, backgroundColor: '#ffffff', marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' },
    chipSelected: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
    chipText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
    chipTextSelected: { color: '#fff', fontWeight: 'bold' },
    courseSelectionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
    courseChip: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 6, 
        paddingHorizontal: 12, 
        paddingVertical: 8, 
        borderRadius: 12, 
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    courseChipSelected: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
    courseChipText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
    courseChipTextSelected: { color: '#fff', fontWeight: 'bold' }
});
