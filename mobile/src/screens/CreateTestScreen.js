import React, { useState } from 'react';
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
import { testService } from '../services/test';
import { topicService } from '../services/topic';
import { useEffect } from 'react';

export default function CreateTestScreen({ navigation }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('60');
    const [category, setCategory] = useState('General');
    const [difficulty, setDifficulty] = useState('Medium');
    const [questions, setQuestions] = useState([{ text: '', options: ['', '', '', ''], correctAnswer: '', explanation: '', points: 1 }]);
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

    const handleDocumentPick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                setExtracting(true);
                try {
                    const extracted = await testService.extractQuestions(
                        file.uri,
                        file.name,
                        file.mimeType,
                        selectedTopic,
                        selectedSubtopic
                    );

                    if (extracted && extracted.length > 0) {
                        // If current list only has one empty question, replace it
                        if (questions.length === 1 && !questions[0].text) {
                            setQuestions(extracted);
                        } else {
                            setQuestions([...questions, ...extracted]);
                        }
                        Alert.alert('Success', `Extracted ${extracted.length} questions from document!`);
                    } else {
                        Alert.alert('Notice', 'No questions could be extracted from this document.');
                    }
                } catch (err) {
                    Alert.alert('Error', 'AI Extraction failed. Please check your document or try again later.');
                } finally {
                    setExtracting(false);
                }
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const addQuestion = () => {
        setQuestions([...questions, { text: '', options: ['', '', '', ''], correctAnswer: '', explanation: '', points: 1 }]);
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
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <LinearGradient colors={['#dc2626', '#1e3a8a']} style={styles.header}>
                        <Text style={styles.headerTitle}>Create New Test</Text>
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
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        padding: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    form: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: '#475569',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 16,
        color: '#1e293b',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 24,
    },
    sectionTitle: {
        color: '#1e293b',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    questionCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    qIndex: {
        color: '#dc2626',
        fontWeight: 'bold',
        marginBottom: 16,
        fontSize: 14,
        textTransform: 'uppercase',
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
    },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#cbd5e1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioSelected: {
        backgroundColor: '#059669',
        borderColor: '#059669',
    },
    addButton: {
        padding: 18,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#dc2626',
        borderStyle: 'dashed',
        alignItems: 'center',
        marginBottom: 32,
    },
    addButtonText: {
        color: '#dc2626',
        fontWeight: 'bold',
        fontSize: 16,
    },
    submitButton: {
        backgroundColor: '#dc2626',
        padding: 20,
        borderRadius: 18,
        alignItems: 'center',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledBtn: {
        opacity: 0.6,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    aiButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#7c3aed',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        gap: 6,
    },
    aiButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    pickerContainer: {
        marginBottom: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    chipSelected: {
        backgroundColor: '#dc2626',
        borderColor: '#dc2626',
    },
    chipText: {
        fontSize: 13,
        color: '#64748b',
    },
    chipTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
