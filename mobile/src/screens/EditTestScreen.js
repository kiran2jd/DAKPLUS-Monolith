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
import { testService } from '../services/test';

export default function EditTestScreen({ navigation, route }) {
    const { testId } = route.params;
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('60');
    const [category, setCategory] = useState('General');
    const [difficulty, setDifficulty] = useState('Medium');
    const [questions, setQuestions] = useState([{ text: '', options: ['', '', '', ''], correctAnswer: '', explanation: '', points: 1 }]);
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadTest();
    }, []);

    const loadTest = async () => {
        try {
            const test = await testService.getTestById(testId);
            setTitle(test.title);
            setDescription(test.description);
            setDuration(String(test.durationMinutes));
            setCategory(test.category || 'General');
            setDifficulty(test.difficulty || 'Medium');
            setIsPremium(test.premium || test.isPremium || false);
            if (test.questions && test.questions.length > 0) {
                setQuestions(test.questions.map(q => ({
                    text: q.text,
                    options: q.options || ['', '', '', ''],
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation || '',
                    points: q.points || 1
                })));
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to load test details');
            navigation.goBack();
        } finally {
            setLoading(false);
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

    const handleUpdate = async () => {
        if (!title || questions.some(q => !q.text || !q.correctAnswer)) {
            Alert.alert('Error', 'Please fill in all required fields and ensure each question has a correct answer.');
            return;
        }

        setSaving(true);
        try {
            await testService.updateTest(testId, {
                title,
                description,
                durationMinutes: parseInt(duration),
                category,
                difficulty,
                isPremium,
                questions: questions.map(q => ({
                    ...q,
                    type: 'mcq'
                }))
            });
            Alert.alert('Success', 'Test updated successfully!');
            navigation.goBack();
        } catch (err) {
            Alert.alert('Error', 'Failed to update test');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#dc2626" />
                <Text style={{ marginTop: 12, color: '#64748b' }}>Loading test details...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <LinearGradient colors={['#1e293b', '#334155']} style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ alignSelf: 'flex-start', marginBottom: 10 }}>
                            <Text style={{ color: '#fff' }}>← Back</Text>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Edit Test</Text>
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

                        <View style={styles.divider} />

                        <Text style={styles.sectionTitle}>Questions ({questions.length})</Text>

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
                            style={[styles.submitButton, saving ? styles.disabledBtn : null]}
                            onPress={handleUpdate}
                            disabled={saving}
                        >
                            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Save Changes</Text>}
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
        color: '#1e293b',
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
        borderColor: '#1e293b',
        borderStyle: 'dashed',
        alignItems: 'center',
        marginBottom: 32,
    },
    addButtonText: {
        color: '#1e293b',
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
});
