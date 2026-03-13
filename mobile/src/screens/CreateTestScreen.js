import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { testService } from '../services/test';
import { topicService } from '../services/topic';

export default function CreateTestScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('60');
    const [category, setCategory] = useState('General');
    const [difficulty, setDifficulty] = useState('Medium');
    const [questions, setQuestions] = useState([{ text: '', options: ['', '', '', ''], correctAnswer: '', explanation: '', points: 1, imageUrl: '', isUploading: false }]);
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(false);
    const [extracting, setExtracting] = useState(false);

    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState('');
    const [subtopics, setSubtopics] = useState([]);
    const [selectedSubtopic, setSelectedSubtopic] = useState('');

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        try {
            const data = await topicService.getAllTopics();
            setTopics(data);
        } catch (err) {
            console.error("Failed to fetch topics", err);
        }
    };

    const handleTopicChange = async (topicId) => {
        setSelectedTopic(topicId);
        setSelectedSubtopic('');
        if (topicId) {
            try {
                const data = await topicService.getSubtopics(topicId);
                setSubtopics(data);
            } catch (err) {
                console.error("Failed to fetch subtopics", err);
            }
        } else {
            setSubtopics([]);
        }
    };

    const pickQuestionImage = async (index) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'image/*',
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                updateQuestion(index, 'isUploading', true);
                try {
                    const res = await topicService.uploadSyllabusFile(asset.uri, asset.name, asset.mimeType);
                    updateQuestion(index, 'imageUrl', res.url);
                } catch (err) {
                    Alert.alert('Error', 'Image upload failed');
                } finally {
                    updateQuestion(index, 'isUploading', false);
                }
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const handleDocumentPick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'text/plain',
                    'image/*'
                ],
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setExtracting(true);
                try {
                    const data = await testService.extractQuestions(
                        asset.uri,
                        asset.name,
                        asset.mimeType,
                        selectedTopic,
                        selectedSubtopic
                    );
                    
                    console.log("Extraction Response:", data);
                    if (data && data.questions && data.questions.length > 0) {
                        const newQuestions = data.questions.map(q => ({
                            text: q.text || '',
                            options: q.options || ['', '', '', ''],
                            correctAnswer: q.correctAnswer || '',
                            explanation: q.explanation || '',
                            points: q.points || 1,
                            imageUrl: q.imageUrl || '',
                            isUploading: false
                        }));
                        
                        setQuestions(prev => {
                            // Keep existing questions that aren't empty, then add new ones
                            const existing = prev.filter(v => v.text.trim() !== '');
                            const combined = [...existing, ...newQuestions];
                            console.log(`Setting ${combined.length} questions total`);
                            return combined;
                        });
                        Alert.alert('Success', `Extracted ${newQuestions.length} questions!`);
                    } else {
                        Alert.alert('Info', 'AI processed the document but found no questions. Please try a clearer format.');
                    }
                } catch (err) {
                    console.error("Extraction Error:", err);
                    const errorMessage = err.response?.data || err.message || 'AI Extraction failed. Please try a different document.';
                    Alert.alert('Extraction Failed', errorMessage);
                } finally {
                    setExtracting(false);
                }
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const addQuestion = () => {
        setQuestions([...questions, { text: '', options: ['', '', '', ''], correctAnswer: '', explanation: '', points: 1, imageUrl: '', isUploading: false }]);
    };

    const updateQuestion = (index, field, value) => {
        const newQuestions = [...questions];
        if (field === 'option') {
            newQuestions[index].options[value.optIndex] = value.text;
        } else {
            newQuestions[index][field] = value;
        }
        setQuestions(newQuestions);
    };

    const handleCreate = async () => {
        if (!title || questions.some(q => !q.text || !q.correctAnswer)) {
            Alert.alert('Error', 'Please fill in all required fields and ensure each question has a correct answer.');
            return;
        }

        setLoading(true);
        try {
            await testService.createTest({
                title,
                description,
                durationMinutes: parseInt(duration),
                category,
                difficulty,
                topicId: selectedTopic,
                subtopicId: selectedSubtopic,
                isPremium,
                questions: questions.map(q => ({
                    ...q,
                    type: 'mcq'
                }))
            });
            Alert.alert('Success', 'Test created successfully!');
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', 'Failed to create test');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1, backgroundColor: '#0f172a' }}>
                <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    <LinearGradient colors={['#1e293b', '#0f172a']} style={[styles.header, { paddingTop: Math.max(insets.top, 15) }]}>
                        <View style={styles.topNav}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconButton}>
                                <Ionicons name="chevron-back" size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>DESIGN EXAM</Text>
                            <View style={{ width: 44 }} />
                        </View>
                        <Text style={styles.headerSubtitle}>Craft high-quality mock tests for students</Text>
                    </LinearGradient>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Test Title</Text>
                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="e.g. Science Mock 1"
                                placeholderTextColor="#94a3b8"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Details about the test..."
                                placeholderTextColor="#94a3b8"
                                multiline
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Duration (min)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={duration}
                                    onChangeText={setDuration}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, justifyContent: 'center' }]}>
                                <Text style={styles.label}>Premium Test</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Switch
                                        value={isPremium}
                                        onValueChange={setIsPremium}
                                        trackColor={{ false: "#cbd5e1", true: "#fecaca" }}
                                        thumbColor={isPremium ? "#dc2626" : "#f4f3f4"}
                                    />
                                    <Text style={{ color: isPremium ? '#dc2626' : '#64748b', fontWeight: 'bold' }}>
                                        {isPremium ? 'YES' : 'NO'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Topic</Text>
                                <View style={styles.pickerContainer}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        <TouchableOpacity
                                            style={[styles.chip, !selectedTopic ? styles.chipSelected : null]}
                                            onPress={() => handleTopicChange('')}
                                        >
                                            <Text style={[styles.chipText, !selectedTopic ? styles.chipTextSelected : null]}>None</Text>
                                        </TouchableOpacity>
                                        {topics.map(t => (
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
                                        {subtopics.map(s => (
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

                        <View style={styles.divider} />

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Questions ({questions.length})</Text>
                            <TouchableOpacity
                                style={[styles.aiButton, extracting ? styles.disabledBtn : null]}
                                onPress={handleDocumentPick}
                                disabled={extracting}
                            >
                                {extracting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="sparkles" size={16} color="#fff" />
                                        <Text style={styles.aiButtonText}>AI Auto-Extract</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>

                        {questions.map((q, qIdx) => (
                            <View key={qIdx} style={styles.questionCard}>
                                <Text style={styles.qIndex}>Question {qIdx + 1}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={q.text}
                                    onChangeText={(text) => updateQuestion(qIdx, 'text', text)}
                                    placeholder="Enter question text..."
                                    placeholderTextColor="#94a3b8"
                                />

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 }}>
                                    <TouchableOpacity 
                                        style={[styles.smallImgBtn, q.imageUrl ? styles.imgPicked : null]} 
                                        onPress={() => pickQuestionImage(qIdx)}
                                        disabled={q.isUploading}
                                    >
                                        <Ionicons name="image-outline" size={16} color={q.imageUrl ? '#10b981' : '#64748b'} />
                                        <Text style={[styles.smallImgBtnText, q.imageUrl ? styles.imgPickedText : null]}>
                                            {q.isUploading ? '...' : (q.imageUrl ? 'Image Added' : 'Add Image')}
                                        </Text>
                                    </TouchableOpacity>
                                    {q.imageUrl && (
                                        <TouchableOpacity onPress={() => updateQuestion(qIdx, 'imageUrl', '')}>
                                            <Ionicons name="close-circle" size={18} color="#f87171" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                                {q.options.map((opt, oIdx) => (
                                    <View key={oIdx} style={styles.optionRow}>
                                        <TouchableOpacity
                                            style={[styles.radio, q.correctAnswer === opt && opt !== '' ? styles.radioSelected : null]}
                                            onPress={() => updateQuestion(qIdx, 'correctAnswer', opt)}
                                        />
                                        <TextInput
                                            style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                            value={opt}
                                            onChangeText={(text) => updateQuestion(qIdx, 'option', { optIndex: oIdx, text })}
                                            placeholder={`Option ${oIdx + 1}`}
                                            placeholderTextColor="#94a3b8"
                                        />
                                    </View>
                                ))}
                                <TextInput
                                    style={[styles.input, { marginTop: 12, height: 60 }]}
                                    value={q.explanation}
                                    onChangeText={(text) => updateQuestion(qIdx, 'explanation', text)}
                                    placeholder="Enter explanation/hint for this question..."
                                    placeholderTextColor="#94a3b8"
                                    multiline
                                />
                            </View>
                        ))}

                        <TouchableOpacity style={styles.addButton} onPress={addQuestion}>
                            <Text style={styles.addButtonText}>+ Add Question</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.submitButton, loading ? styles.disabledBtn : null]}
                            onPress={handleCreate}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Publish Test</Text>}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
    headerIconButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
    headerSubtitle: { color: '#94a3b8', fontSize: 13, textAlign: 'center', fontWeight: '500' },
    scrollContainer: { flexGrow: 1, paddingBottom: 40 },
    form: { padding: 20 },
    inputGroup: { marginBottom: 24 },
    label: { color: '#94a3b8', fontSize: 13, marginBottom: 10, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
    input: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 16, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    row: { flexDirection: 'row', gap: 12 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 30 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
    aiButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#7c3aed', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, gap: 8, elevation: 4 },
    aiButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    questionCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 28, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    qIndex: { color: '#dc2626', fontWeight: '900', marginBottom: 18, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
    optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
    radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    radioSelected: { backgroundColor: '#10b981', borderColor: '#10b981' },
    addButton: { padding: 20, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(220, 38, 38, 0.3)', borderStyle: 'dashed', alignItems: 'center', marginBottom: 32 },
    addButtonText: { color: '#dc2626', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
    submitButton: { backgroundColor: '#dc2626', padding: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#dc2626', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
    submitButtonText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    disabledBtn: { opacity: 0.6 },
    pickerContainer: { marginBottom: 10 },
    chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    chipSelected: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
    chipText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
    chipTextSelected: { color: '#fff', fontWeight: 'bold' },
    smallImgBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 6
    },
    imgPicked: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: '#10b981'
    },
    smallImgBtnText: {
        color: '#64748b',
        fontSize: 10,
        fontWeight: 'bold'
    },
    imgPickedText: {
        color: '#10b981'
    }
});
