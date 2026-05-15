import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    SafeAreaView,
    Dimensions,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { resultService } from '../services/result';
import { authService } from '../services/auth';
import { reportService } from '../services/report';
import { Ionicons } from '@expo/vector-icons';

import ConfettiCannon from 'react-native-confetti-cannon';

const { width } = Dimensions.get('window');

export default function ResultScreen({ navigation, route }) {
    const { resultId } = route.params;
    const [user, setUser] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState('en'); // 'en' or 'hi'

    // Reporting state
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
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

    useEffect(() => {
        if (!resultId) {
            setLoading(false);
            Alert.alert('Error', 'Result ID is missing');
            navigation.goBack();
            return;
        }

        const loadUser = async () => {
            const userData = await authService.getUser();
            setUser(userData);
        };
        loadUser();

        const fetchResult = async () => {
            try {
                const data = await resultService.getResultById(resultId);
                if (!data) throw new Error("Result not found");
                setResult(data);
            } catch (err) {
                console.error("Result fetch error:", err);
                Alert.alert('Error', 'Failed to load result. It might still be processing.');
                // Don't go back immediately, let the user decide or show empty state
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [resultId, navigation]);

    const submitReport = async () => {
        if (!reportComment.trim()) {
            Alert.alert("Required", "Please add a brief comment.");
            return;
        }

        setIsReporting(true);
        try {
            await reportService.submitReport({
                testId: result.testId,
                questionId: selectedQuestion.questionId,
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

    const openReportModal = (question) => {
        setSelectedQuestion(question);
        setReportModalVisible(true);
    };

    const [filter, setFilter] = useState('all'); // all, correct, incorrect

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: '#fcf9f2' }]}>
                <ActivityIndicator size="large" color="#dc2626" />
            </View>
        );
    }

    if (!result) {
        return (
            <View style={[styles.center, { backgroundColor: '#fcf9f2' }]}>
                <Ionicons name="alert-circle" size={64} color="#dc2626" />
                <Text style={{ color: '#1e293b', marginTop: 16 }}>Result not found.</Text>
                <TouchableOpacity 
                    onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
                    style={{ marginTop: 24, padding: 12, backgroundColor: '#dc2626', borderRadius: 8 }}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Back to Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isPassed = result.percentage >= 40;
    const detailedAnswers = result.detailedAnswers || {};
    const detailedAnswersArray = Object.keys(detailedAnswers)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(key => detailedAnswers[key]);

    const filteredAnswers = detailedAnswersArray.filter(answer => {
        if (filter === 'correct') return answer.correct;
        if (filter === 'incorrect') return !answer.correct;
        return true;
    });

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: '#fcf9f2' }]}>
            <LinearGradient
                colors={['#fcf9f2', '#fcf9f2']}
                style={StyleSheet.absoluteFillObject}
            />
            {isPassed && (
                <ConfettiCannon
                    count={200}
                    origin={{ x: width / 2, y: -20 }}
                    fadeOut={true}
                    explosionSpeed={350}
                />
            )}
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <LinearGradient
                    colors={isPassed ? ['#059669', '#10b981'] : ['#dc2626', '#b91c1c']}
                    style={styles.header}
                >
                    <Text style={styles.resultStatus}>{isPassed ? 'Congratulations!' : 'Keep Trying!'}</Text>
                    <View style={styles.scoreCircle}>
                        <Text style={styles.percentage}>{Math.round(result.percentage || 0)}%</Text>
                        <Text style={styles.scoreText}>{result.score || 0}/{result.totalPoints || 0}</Text>
                    </View>
                    <Text style={styles.testTitle}>{result.testTitle}</Text>
                    
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
                </LinearGradient>

                <View style={styles.content}>
                    <View style={styles.statsGrid}>
                        <TouchableOpacity 
                            style={[styles.statCard, filter === 'all' && styles.activeStatCard]}
                            onPress={() => setFilter('all')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.statLabel, filter === 'all' && styles.activeStatLabel]}>
                                {language === 'hi' ? 'कुल प्रश्न' : 'Total Qns'}
                            </Text>
                            <Text style={[styles.statValue, filter === 'all' && styles.activeStatValue]}>
                                {result.totalPoints || 0}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.statCard, filter === 'correct' && styles.activeStatCardCorrect]}
                            onPress={() => setFilter('correct')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.statLabel, filter === 'correct' && styles.activeStatLabel]}>
                                {language === 'hi' ? 'सही' : 'Correct'}
                            </Text>
                            <Text style={[styles.statValue, { color: '#059669' }, filter === 'correct' && styles.activeStatValue]}>
                                {result.correctAnswers || 0}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.statCard, filter === 'incorrect' && styles.activeStatCardWrong]}
                            onPress={() => setFilter('incorrect')}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.statLabel, filter === 'incorrect' && styles.activeStatLabel]}>
                                {language === 'hi' ? 'ग़लत' : 'Wrong'}
                            </Text>
                            <Text style={[styles.statValue, { color: '#dc2626' }, filter === 'incorrect' && styles.activeStatValue]}>
                                {result.wrongAnswers || 0}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.attemptedInfo}>
                         <Ionicons name="information-circle-outline" size={16} color="#64748b" />
                         <Text style={styles.attemptedText}>
                            {language === 'hi' ? 'प्रयास किया गया:' : 'Attempted:'} {Object.values(result.answers || {}).filter(a => a !== null && a !== 'Not Answered').length} / {result.totalPoints}
                         </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={() => navigation.reset({
                            index: 0,
                            routes: [{ name: 'Main' }],
                        })}
                    >
                        <LinearGradient
                            colors={['#dc2626', '#f97316']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.homeBtnGradient}
                        >
                            <Ionicons name="home-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.homeButtonText}>{language === 'hi' ? 'डैशबोर्ड पर वापस' : 'Back to Dashboard'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {(user?.role || '').toLowerCase() === 'student' && user?.subscriptionTier !== 'PREMIUM' && (
                        <TouchableOpacity
                            style={styles.proCard}
                            onPress={() => navigation.navigate('Payment')}
                        >
                            <LinearGradient
                                colors={['#fef3c7', '#fffbeb']}
                                style={styles.proCardGradient}
                            >
                                <View style={styles.proInfo}>
                                    <View style={styles.proBadgeSmall}>
                                        <Text style={styles.proBadgeText}>PRO</Text>
                                    </View>
                                    <Text style={styles.proCardTitle}>Want more specialized tests?</Text>
                                    <Text style={styles.proCardSub}>Upgrade to PRO for unlimited access to all exam categories!</Text>
                                </View>
                                <View style={styles.upgradeBtn}>
                                    <Text style={styles.upgradeBtnText}>Upgrade Now</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

                    <Text style={styles.sectionTitle}>{language === 'hi' ? 'विस्तृत समीक्षा' : 'Detailed Review'}</Text>

                    {/* Filter Tabs */}
                    <View style={styles.filterTabs}>
                        <View style={styles.filterHeader}>
                            <Ionicons name="funnel-outline" size={16} color="#475569" />
                            <Text style={styles.filterTitle}>{language === 'hi' ? 'फिल्टर' : 'Quick Filter'}</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabsScroll}>
                            <TouchableOpacity
                                style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
                                onPress={() => setFilter('all')}
                            >
                                <Text style={[styles.filterTabText, filter === 'all' && styles.activeFilterTabText]}>
                                    {language === 'hi' ? 'सभी' : 'All Review'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterTab, filter === 'correct' && styles.activeCorrectTab]}
                                onPress={() => setFilter('correct')}
                            >
                                <Ionicons name="checkmark-circle" size={14} color={filter === 'correct' ? "#fff" : "#059669"} style={{marginRight: 4}} />
                                <Text style={[styles.filterTabText, filter === 'correct' && styles.activeFilterTabText]}>
                                    {language === 'hi' ? 'केवल सही' : 'Only Correct'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterTab, filter === 'incorrect' && styles.activeWrongTab]}
                                onPress={() => setFilter('incorrect')}
                            >
                                <Ionicons name="close-circle" size={14} color={filter === 'incorrect' ? "#fff" : "#dc2626"} style={{marginRight: 4}} />
                                <Text style={[styles.filterTabText, filter === 'incorrect' && styles.activeFilterTabText]}>
                                    {language === 'hi' ? 'केवल गलत' : 'Only Incorrect'}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    {filteredAnswers.length > 0 ? filteredAnswers.map((detail, idx) => (
                        <View key={idx} style={[styles.reviewCard, { borderColor: detail?.correct ? '#059669' : '#dc2626' }]}>
                            <Text style={styles.reviewQuestion}>
                                {idx + 1}. {language === 'hi' && detail?.questionTextHi ? detail.questionTextHi : detail?.questionText}
                            </Text>
                            {detail?.questionImageUrl && (
                                <Image 
                                    source={{ uri: detail.questionImageUrl }} 
                                    style={{ width: '100%', height: 200, borderRadius: 12, backgroundColor: '#f8fafc', marginBottom: 16 }} 
                                    resizeMode="contain" 
                                />
                            )}
                            <View style={styles.answerRow}>
                                {detail?.userAnswer && detail.userAnswer.startsWith('data:image/') ? (
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.answerText, { color: detail?.correct ? '#059669' : '#dc2626', marginBottom: 4 }]}>Your Answer:</Text>
                                        <Image source={{ uri: detail.userAnswer }} style={{ width: 100, height: 60, borderRadius: 8, backgroundColor: '#f8fafc' }} resizeMode="contain" />
                                    </View>
                                ) : (
                                    <Text style={[styles.answerText, { color: detail?.correct ? '#059669' : '#dc2626' }]}>
                                        Your Answer: {detail?.userAnswer}
                                    </Text>
                                )}
                                {detail?.correct ? (
                                    <Text style={styles.correctBadge}>✓ Correct</Text>
                                ) : (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <TouchableOpacity 
                                            onPress={() => openReportModal(detail)}
                                            style={styles.flagBtnSmall}
                                        >
                                            <Ionicons name="flag-outline" size={14} color="#dc2626" />
                                            <Text style={styles.flagBtnTextSmall}>Report</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.wrongBadge}>✗ Incorrect</Text>
                                    </View>
                                )}
                            </View>
                            {!detail?.correct && (
                                detail?.correctAnswer && detail.correctAnswer.startsWith('data:image/') ? (
                                    <View style={{ marginTop: 8 }}>
                                        <Text style={styles.correctAnswerText}>Correct Answer:</Text>
                                        <Image source={{ uri: detail.correctAnswer }} style={{ width: 100, height: 60, borderRadius: 8, backgroundColor: '#f8fafc' }} resizeMode="contain" />
                                    </View>
                                ) : (
                                    <Text style={styles.correctAnswerText}>Correct Answer: {detail?.correctAnswer}</Text>
                                )
                            )}
                            {/* Check multiple possible field names for explanations */}
                            {(detail?.explanation || detail?.shortAnswer || detail?.comment || detail?.explanationHi) && (
                                <View style={styles.explanationBox}>
                                    <Text style={styles.explanationTitle}>
                                        {language === 'hi' ? 'फीडबैक / व्याख्या:' : 'Feedback / Explanation:'}
                                    </Text>
                                    <Text style={styles.explanationText}>
                                        {language === 'hi' && detail?.explanationHi 
                                            ? detail.explanationHi 
                                            : (detail?.explanation || detail?.shortAnswer || detail?.comment)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )) : (
                        <View style={styles.emptyReview}>
                            <Text style={styles.emptyReviewText}>No {filter === 'all' ? '' : filter} questions to show.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

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
    scrollContainer: {
        flexGrow: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    resultStatus: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    scoreCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#ffffff20',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#ffffff40',
        marginBottom: 20,
    },
    percentage: {
        color: '#fff',
        fontSize: 48,
        fontWeight: 'extrabold',
    },
    scoreText: {
        color: '#fff',
        fontSize: 16,
        opacity: 0.9,
    },
    testTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    content: {
        padding: 24,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statLabel: {
        color: '#64748b',
        fontSize: 11,
        marginBottom: 4,
        textAlign: 'center',
        fontWeight: '600',
    },
    statValue: {
        color: '#1e293b',
        fontSize: 22,
        fontWeight: '900',
    },
    activeStatCard: { backgroundColor: '#1e293b', borderColor: '#1e293b' },
    activeStatCardCorrect: { backgroundColor: '#059669', borderColor: '#059669' },
    activeStatCardWrong: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
    activeStatLabel: { color: 'rgba(255,255,255,0.7)' },
    activeStatValue: { color: '#fff' },
    attemptedInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 6,
        backgroundColor: '#f1f5f9',
        paddingVertical: 8,
        borderRadius: 12,
    },
    attemptedText: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: '#1e293b',
        fontSize: 20,
        fontWeight: '900',
        marginTop: 32,
        marginBottom: 16,
    },
    reviewCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    reviewQuestion: {
        color: '#1e293b',
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 12,
        lineHeight: 22,
    },
    answerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    answerText: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    correctBadge: {
        color: '#059669',
        fontSize: 11,
        fontWeight: 'bold',
        backgroundColor: '#05966910',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    wrongBadge: {
        color: '#dc2626',
        fontSize: 11,
        fontWeight: 'bold',
        backgroundColor: '#dc262610',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    correctAnswerText: {
        color: '#10b981',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    explanationBox: {
        backgroundColor: '#f8fafc',
        padding: 14,
        borderRadius: 14,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    explanationTitle: {
        color: '#f97316',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    explanationText: {
        color: '#475569',
        fontSize: 14,
        lineHeight: 20,
    },
    homeButton: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
    },
    homeBtnGradient: {
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    homeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    filterTabs: {
        marginTop: 10,
        marginBottom: 24,
    },
    filterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 6,
    },
    filterTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    filterTabsScroll: {
        gap: 10,
        paddingRight: 20,
    },
    filterTab: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center',
    },
    activeFilterTab: {
        backgroundColor: '#1e293b',
        borderColor: '#1e293b',
    },
    activeCorrectTab: {
        backgroundColor: '#059669',
        borderColor: '#059669',
    },
    activeWrongTab: {
        backgroundColor: '#dc2626',
        borderColor: '#dc2626',
    },
    filterTabText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
    },
    activeFilterTabText: {
        color: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fcf9f2',
    },
    emptyReview: {
        padding: 20,
        alignItems: 'center',
    },
    emptyReviewText: {
        color: '#64748b',
    },
    proCard: {
        marginTop: 24,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#fde68a',
        elevation: 4,
        shadowColor: '#d97706',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    proCardGradient: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    proInfo: {
        flex: 1,
        marginRight: 10,
    },
    proBadgeSmall: {
        backgroundColor: '#d97706',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    proBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    proCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#92400e',
        marginBottom: 4,
    },
    proCardSub: {
        fontSize: 13,
        color: '#b45309',
        lineHeight: 18,
    },
    upgradeBtn: {
        backgroundColor: '#d97706',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    upgradeBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    langToggle: {
        flexDirection: 'row',
        backgroundColor: '#ffffff20',
        borderRadius: 8,
        padding: 2,
        marginTop: 15,
        alignSelf: 'center',
    },
    langBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
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
        color: '#059669',
    },
    flagBtnSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fee2e2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    flagBtnTextSmall: {
        fontSize: 10,
        color: '#dc2626',
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: '50%',
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
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 8,
        marginTop: 12,
    },
    reasonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    reasonBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
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
});
