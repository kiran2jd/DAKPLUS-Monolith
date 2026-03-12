import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    Platform,
    Image,
} from 'react-native';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { Ionicons } from '@expo/vector-icons';
import { testService } from '../services/test';
import { resultService } from '../services/result';
import { authService } from '../services/auth';

export default function TakeTestScreen({ navigation, route }) {

    const { testId } = route.params;
    const [test, setTest] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [language, setLanguage] = useState('en'); // 'en' or 'hi'
    const [alreadySubmitted, setAlreadySubmitted] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        const loadTest = async () => {
            try {
                const user = await authService.getUser();
                const userId = user?.id || user?._id;

                // 1. Check if already submitted
                if (userId) {
                    const submitted = await resultService.checkSubmission(userId, testId);
                    if (submitted) {
                        setAlreadySubmitted(true);
                        setLoading(false);
                        return;
                    }
                }

                // 2. Load Test
                const data = await testService.takeTest(testId);
                setTest(data);
                const minutes = data.durationMinutes || data.duration_minutes || 60;
                setTimeLeft(minutes * 60);
            } catch (err) {
                console.error("Failed to load test:", err);
                Alert.alert('Error', 'Failed to load test');
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        };
        loadTest();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [testId]);

    useEffect(() => {
        if (!test) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [test]);

    const handleAnswer = (option) => {
        setAnswers({ ...answers, [currentQuestion]: option });
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            console.log("Submitting test results for testId:", testId);
            const result = await resultService.submitTest({
                test_id: testId,
                answers: answers
            });
            const finalResultId = result.id || result._id;
            navigation.replace('Result', { resultId: finalResultId });
        } catch (err) {
            console.error("Submission failed:", err);
            Alert.alert('Error', 'Failed to submit test. Please check your connection.');
            setIsSubmitting(false);
        }
    };

    const handleRetake = () => {
        Alert.alert(
            "Retake Test",
            "Are you sure? Your previous result will be permanently deleted.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Retake",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const user = await authService.getUser();
                            const userId = user?.id || user?._id;
                            await resultService.retakeTest(userId, testId);
                            setAlreadySubmitted(false);
                            // Refresh test
                            const data = await testService.takeTest(testId);
                            setTest(data);
                            const minutes = data.durationMinutes || data.duration_minutes || 60;
                            setTimeLeft(minutes * 60);
                            setAnswers({});
                            setCurrentQuestion(0);
                        } catch (err) {
                            console.error("Retake failed:", err);
                            Alert.alert("Error", "Failed to reset test.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#dc2626" />
            </View>
        );
    }

    if (alreadySubmitted) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={['#dc2626', '#1e3a8a']} style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.exitText}>Back</Text>
                    </TouchableOpacity>
                </LinearGradient>
                <View style={[styles.center, { padding: 30 }]}>
                    <View style={styles.alreadyCard}>
                        <View style={styles.alreadyIcon}>
                            <Ionicons name="checkmark-circle" size={50} color="#d97706" />
                        </View>
                        <Text style={styles.alreadyTitle}>Exam Already Completed</Text>
                        <Text style={styles.alreadySub}>
                            Our records show you have already submitted this exam. You can view your performance in the results section.
                        </Text>
                        <View style={styles.noteBox}>
                            <Text style={styles.noteText}>
                                NOTE: Retaking the test will permanently delete your previous result and score.
                            </Text>
                        </View>
                        
                        <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
                            <Text style={styles.retakeBtnText}>Retake Test</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.dashboardBtn} 
                            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
                        >
                            <Text style={styles.dashboardBtnText}>Back to Dashboard</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    if (!test || !test.questions || test.questions.length === 0) {
        return (
            <View style={styles.center}>
                <Ionicons name="alert-circle-outline" size={64} color="#dc2626" />
                <Text style={{ marginTop: 16, fontSize: 18, color: '#1e293b', fontWeight: 'bold' }}>No questions available</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 24, padding: 12, backgroundColor: '#dc2626', borderRadius: 8 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const question = test.questions[currentQuestion];

    if (!question) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#dc2626" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#dc2626', '#1e3a8a']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => Alert.alert('Exit Test', 'Are you sure?', [{ text: 'Cancel' }, { text: 'Exit', onPress: () => navigation.goBack() }])}>
                        <Text style={styles.exitText}>Exit</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.langToggle}>
                        <TouchableOpacity 
                            onPress={() => setLanguage('en')}
                            style={[styles.langBtn, language === 'en' ? styles.activeLangBtn : null]}
                        >
                            <Text style={[styles.langText, language === 'en' ? styles.activeLangText : null]}>EN</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setLanguage('hi')}
                            style={[styles.langBtn, language === 'hi' ? styles.activeLangBtn : null]}
                        >
                            <Text style={[styles.langText, language === 'hi' ? styles.activeLangText : null]}>हिन्दी</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.timerContainer}>
                        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                    </View>
                    <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
                        <Text style={styles.submitText}>{isSubmitting ? '...' : 'Submit'}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.testTitle}>{test.title}</Text>
            </LinearGradient>

            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / test.questions.length) * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>Question {currentQuestion + 1} of {test.questions.length}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.questionContainer}>
                <Text style={styles.questionText}>
                    {language === 'hi' && question.textHi ? question.textHi : question.text}
                </Text>

                {question.imageUrl && (
                    <Image
                        source={{ uri: question.imageUrl }}
                        style={styles.questionImage}
                        resizeMode="contain"
                    />
                )}

                <View style={styles.optionsList}>
                    {question.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.optionButton,
                                answers[currentQuestion] === option ? styles.selectedOption : null
                            ]}
                            onPress={() => handleAnswer(option)}
                        >
                            <View style={[
                                styles.optionCircle,
                                answers[currentQuestion] === option ? styles.selectedCircle : null
                            ]} />
                            <Text style={[
                                styles.optionText,
                                answers[currentQuestion] === option ? styles.selectedOptionText : null
                            ]}>
                                {(language === 'hi' && question.optionsHi && question.optionsHi[index])
                                    ? question.optionsHi[index]
                                    : option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.navButton, currentQuestion === 0 ? styles.disabledNav : null]}
                    onPress={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestion === 0}
                >
                    <Text style={styles.navButtonText}>Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.navButton, styles.nextButton]}
                    onPress={() => {
                        if (currentQuestion < test.questions.length - 1) {
                            setCurrentQuestion(prev => prev + 1);
                        } else {
                            handleSubmit();
                        }
                    }}
                >
                    <Text style={[styles.navButtonText, styles.nextButtonText]}>
                        {currentQuestion === test.questions.length - 1 ? 'Finish' : 'Next'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    exitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    timerContainer: {
        backgroundColor: '#ffffff20',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
    },
    timerText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    testTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    progressContainer: {
        padding: 20,
        backgroundColor: '#ffffff',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#f1f5f9',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#dc2626',
    },
    progressText: {
        color: '#64748b',
        fontSize: 12,
        fontWeight: '600',
    },
    questionContainer: {
        padding: 20,
    },
    questionText: {
        color: '#1e293b',
        fontSize: 20,
        fontWeight: '700',
        lineHeight: 28,
        marginBottom: 24,
    },
    optionsList: {
        gap: 12,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    selectedOption: {
        borderColor: '#dc2626',
        backgroundColor: '#dc262608',
    },
    optionCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#cbd5e1',
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedCircle: {
        borderColor: '#dc2626',
        backgroundColor: '#dc2626',
    },
    optionText: {
        color: '#475569',
        fontSize: 16,
        fontWeight: '500',
    },
    selectedOptionText: {
        color: '#1e293b',
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#ffffff',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    navButton: {
        flex: 1,
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
    },
    nextButton: {
        backgroundColor: '#dc2626',
    },
    navButtonText: {
        color: '#475569',
        fontSize: 16,
        fontWeight: 'bold',
    },
    nextButtonText: {
        color: '#fff',
    },
    disabledNav: {
        opacity: 0.3,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    questionImage: {
        width: '100%',
        height: 250,
        borderRadius: 12,
        marginBottom: 20,
        backgroundColor: '#f8fafc',
    },
    langToggle: {
        flexDirection: 'row',
        backgroundColor: '#ffffff20',
        borderRadius: 8,
        padding: 2,
    },
    langBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    activeLangBtn: {
        backgroundColor: '#ffffff',
    },
    langText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    activeLangText: {
        color: '#1e3a8a',
    },
    alreadyCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
        width: '100%',
    },
    alreadyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fffbeb',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    alreadyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: 12,
    },
    alreadySub: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    noteBox: {
        backgroundColor: '#fffbeb',
        borderLeftWidth: 4,
        borderLeftColor: '#f59e0b',
        padding: 12,
        borderRadius: 8,
        marginBottom: 24,
    },
    noteText: {
        color: '#92400e',
        fontSize: 12,
        fontWeight: '700',
    },
    retakeBtn: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    retakeBtnText: {
        color: '#1e293b',
        fontSize: 18,
        fontWeight: '900',
    },
    dashboardBtn: {
        width: '100%',
        backgroundColor: '#dc2626',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    dashboardBtnText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '900',
    },
});
