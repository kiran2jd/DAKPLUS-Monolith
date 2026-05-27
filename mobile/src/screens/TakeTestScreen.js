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
    Dimensions,
    TouchableOpacity,
    ScrollView,
    Modal,
    TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { testService } from '../services/test';
import { resultService } from '../services/result';
import { authService } from '../services/auth';
import { reportService } from '../services/report';

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

    // Reporting state
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [reportReason, setReportReason] = useState('Wrong Options');
    const [reportComment, setReportComment] = useState('');
    const [isReporting, setIsReporting] = useState(false);

    const reportReasons = [
        'Wrong Options',
        'Spelling Error',
        'Incorrect Hindi Translation',
        'Out of Syllabus',
        'Image Issue',
        'Other'
    ];

    // PREVENT ACCIDENTS: Deep Back Button Protection
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (!alreadySubmitted) {
                    Alert.alert(
                        "Exit Exam?",
                        "Your progress will be lost if you leave now. Please submit the test instead.",
                        [
                            { text: "Continue Exam", style: "cancel" },
                            { text: "Exit & Lose Progress", style: "destructive", onPress: () => navigation.goBack() }
                        ]
                    );
                    return true;
                }
                return false;
            };

            BackHandler.addEventListener('hardwareBackPress', onBackPress);
            return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        }, [alreadySubmitted, navigation])
    );

    useEffect(() => {
        const loadTest = async () => {
            try {
                const user = await authService.getUser();
                const userId = user?.id || user?._id;

                // 1. Check if already submitted
                if (userId) {
                    const submissionStatus = await resultService.checkSubmission(userId, testId);
                    // Defensive check: handle both boolean and object { submitted: true/false }
                    const isSubmitted = typeof submissionStatus === 'boolean' ? submissionStatus : submissionStatus?.submitted;
                    if (isSubmitted) {
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
            const finalResultId = result?.id || result?._id;
            if (finalResultId) {
                navigation.replace('Result', { resultId: finalResultId });
            } else {
                throw new Error("No result ID returned from server");
            }
        } catch (err) {
            console.error("Submission failed:", err);
            Alert.alert('Error', 'Failed to submit test. Please check your connection.');
            setIsSubmitting(false);
        }
    };

    const submitReport = async () => {
        if (!reportComment.trim()) {
            Alert.alert("Required", "Please add a brief comment.");
            return;
        }

        setIsReporting(true);
        try {
            const user = await authService.getUser();
            await reportService.submitReport({
                testId,
                questionId: question.id,
                userId: user?.id || user?._id,
                userName: user?.name || 'Student',
                reason: reportReason,
                comment: reportComment
            });
            Alert.alert("Report Submitted", "Thank you for your feedback. We will review this question.");
            setReportModalVisible(false);
            setReportComment('');
        } catch (err) {
            console.error("Report failed:", err);
            Alert.alert("Error", "Failed to submit report. Please try again.");
        } finally {
            setIsReporting(false);
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
                    <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
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
                        
                        <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake} activeOpacity={0.7}>
                            <Text style={styles.retakeBtnText}>Retake Test</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.dashboardBtn} 
                            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
                            activeOpacity={0.7}
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
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 24, padding: 12, backgroundColor: '#dc2626', borderRadius: 8 }} activeOpacity={0.7}>
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

    const handlePrevious = () => {
        setCurrentQuestion(prev => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setCurrentQuestion(prev => prev + 1);
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#dc2626', '#1e3a8a']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity 
                        onPress={() => Alert.alert(
                            'Exit Exam?', 
                            'Are you sure? Progress will not be saved.', 
                            [
                                { text: 'Cancel', style: 'cancel' }, 
                                { text: 'Exit', style: 'destructive', onPress: () => navigation.goBack() }
                            ]
                        )} 
                        activeOpacity={0.7}
                    >
                        <Text style={styles.exitText}>Exit</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.langToggle}>
                        <TouchableOpacity 
                            onPress={() => setLanguage('en')}
                            style={[styles.langBtn, language === 'en' ? styles.activeLangBtn : null]}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.langText, language === 'en' ? styles.activeLangText : null]}>EN</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            onPress={() => setLanguage('hi')}
                            style={[styles.langBtn, language === 'hi' ? styles.activeLangBtn : null]}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.langText, language === 'hi' ? styles.activeLangText : null]}>हिन्दी</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.timerContainer}>
                        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                    </View>
                    <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} activeOpacity={0.7}>
                        <Text style={styles.submitText}>{isSubmitting ? '...' : 'Submit'}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.testTitle}>{test.title}</Text>
            </LinearGradient>

            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((currentQuestion + 1) / test.questions.length) * 100}%` }]} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.progressText}>Question {currentQuestion + 1} of {test.questions.length}</Text>
                    <TouchableOpacity 
                        style={styles.reportIconBtn} 
                        onPress={() => setReportModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="flag-outline" size={16} color="#dc2626" />
                        <Text style={styles.reportIconText}>Report</Text>
                    </TouchableOpacity>
                </View>
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
                    {question.options.map((option, index) => {
                        const displayOptionText = (language === 'hi' && question.optionsHi && question.optionsHi[index])
                            ? question.optionsHi[index]
                            : option;
                        const isImage = displayOptionText && displayOptionText.startsWith('data:image/');

                        return (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.optionButton,
                                    answers[currentQuestion] === option ? styles.selectedOption : null
                                ]}
                                onPress={() => handleAnswer(option)}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    styles.optionCircle,
                                    answers[currentQuestion] === option ? styles.selectedCircle : null
                                ]} />
                                {isImage ? (
                                    <Image
                                        source={{ uri: displayOptionText }}
                                        style={{ width: '80%', height: 100, borderRadius: 8, backgroundColor: '#f8fafc' }}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <Text style={[
                                        styles.optionText,
                                        answers[currentQuestion] === option ? styles.selectedOptionText : null
                                    ]}>
                                        {displayOptionText}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.navButton, currentQuestion === 0 ? styles.disabledNav : null]}
                    onPress={handlePrevious}
                    disabled={currentQuestion === 0}
                    activeOpacity={0.7}
                >
                    <Text style={styles.navButtonText}>Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.navButton, styles.nextButton]}
                    onPress={currentQuestion === test.questions.length - 1 ? handleSubmit : handleNext}
                    activeOpacity={0.7}
                >
                    <LinearGradient
                        colors={['#dc2626', '#f97316']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <Text style={[styles.navButtonText, styles.nextButtonText]}>
                        {currentQuestion === test.questions.length - 1 ? 'Submit' : 'Next'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Reporting Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={reportModalVisible}
                onRequestClose={() => setReportModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Report Question</Text>
                            <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Reason for reporting:</Text>
                        <View style={styles.reasonsContainer}>
                            {reportReasons.map((reason) => (
                                <TouchableOpacity 
                                    key={reason}
                                    style={[styles.reasonBtn, reportReason === reason ? styles.activeReason : null]}
                                    onPress={() => setReportReason(reason)}
                                >
                                    <Text style={[styles.reasonText, reportReason === reason ? styles.activeReasonText : null]}>
                                        {reason}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Additional Comment:</Text>
                        <TextInput
                            style={styles.textArea}
                            multiline
                            numberOfLines={4}
                            placeholder="Tell us what's wrong..."
                            value={reportComment}
                            onChangeText={setReportComment}
                        />

                        <TouchableOpacity 
                            style={[styles.submitReportBtn, isReporting ? { opacity: 0.7 } : null]}
                            onPress={submitReport}
                            disabled={isReporting}
                        >
                            <Text style={styles.submitReportText}>
                                {isReporting ? 'Submitting...' : 'Submit Report'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fcf9f2',
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
        backgroundColor: '#fcf9f2',
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
        backgroundColor: '#fcf9f2',
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    navButton: {
        flex: 1,
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        overflow: 'hidden',
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
        backgroundColor: '#fcf9f2',
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
        fontSize: 12,
        fontWeight: 'bold',
    },
    activeLangText: {
        color: '#dc2626',
    },
    activeReason: {
        backgroundColor: '#dc2626',
        borderColor: '#dc2626',
    },
    reasonText: {
        fontSize: 12,
        color: '#64748b',
    },
    activeReasonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    textArea: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 12,
        height: 100,
        textAlignVertical: 'top',
        marginBottom: 24,
    },
    submitReportBtn: {
        backgroundColor: '#dc2626',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    submitReportText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    alreadyCard: {
        backgroundColor: '#fcf9f2',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#475569',
        marginBottom: 10,
    },
    reasonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    reasonBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
});
