import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { resultService } from '../services/result';
import { authService } from '../services/auth';

import ConfettiCannon from 'react-native-confetti-cannon';

const { width } = Dimensions.get('window');

export default function ResultScreen({ navigation, route }) {
    const { resultId } = route.params;
    const [user, setUser] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const userData = await authService.getUser();
            setUser(userData);
        };
        loadUser();

        const fetchResult = async () => {
            try {
                const data = await resultService.getResultById(resultId);
                setResult(data);
            } catch (err) {
                console.error("Result fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [resultId]);

    const [filter, setFilter] = useState('all'); // all, correct, incorrect

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#dc2626" />
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
        <SafeAreaView style={styles.container}>
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
                        <Text style={styles.percentage}>{Math.round(result.percentage)}%</Text>
                        <Text style={styles.scoreText}>{result.score}/{result.totalPoints}</Text>
                    </View>
                    <Text style={styles.testTitle}>{result.testTitle}</Text>
                </LinearGradient>

                <View style={styles.content}>
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Attempted</Text>
                            <Text style={styles.statValue}>
                                {Object.values(result.answers || {}).filter(a => a !== null && a !== 'Not Answered').length}
                            </Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Correct</Text>
                            <Text style={[styles.statValue, { color: '#059669' }]}>{result.correctAnswers || 0}</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>Wrong</Text>
                            <Text style={[styles.statValue, { color: '#dc2626' }]}>{result.wrongAnswers || 0}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={() => navigation.reset({
                            index: 0,
                            routes: [{ name: 'Main' }],
                        })}
                    >
                        <Text style={styles.homeButtonText}>Back to Dashboard</Text>
                    </TouchableOpacity>

                    {user?.role === 'STUDENT' && user?.subscriptionTier !== 'PREMIUM' && (
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

                    <Text style={styles.sectionTitle}>Detailed Review</Text>

                    {/* Filter Tabs */}
                    <View style={styles.filterTabs}>
                        <TouchableOpacity
                            style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
                            onPress={() => setFilter('all')}
                        >
                            <Text style={[styles.filterTabText, filter === 'all' && styles.activeFilterTabText]}>All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterTab, filter === 'correct' && styles.activeCorrectTab]}
                            onPress={() => setFilter('correct')}
                        >
                            <Text style={[styles.filterTabText, filter === 'correct' && styles.activeFilterTabText]}>Correct</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterTab, filter === 'incorrect' && styles.activeWrongTab]}
                            onPress={() => setFilter('incorrect')}
                        >
                            <Text style={[styles.filterTabText, filter === 'incorrect' && styles.activeFilterTabText]}>Wrong</Text>
                        </TouchableOpacity>
                    </View>

                    {filteredAnswers.length > 0 ? filteredAnswers.map((detail, idx) => (
                        <View key={idx} style={[styles.reviewCard, { borderColor: detail.correct ? '#059669' : '#dc2626' }]}>
                            <Text style={styles.reviewQuestion}>{idx + 1}. {detail.questionText}</Text>
                            <View style={styles.answerRow}>
                                <Text style={[styles.answerText, { color: detail.correct ? '#059669' : '#dc2626' }]}>
                                    Your Answer: {detail.userAnswer}
                                </Text>
                                {detail.correct ? (
                                    <Text style={styles.correctBadge}>✓ Correct</Text>
                                ) : (
                                    <Text style={styles.wrongBadge}>✗ Incorrect</Text>
                                )}
                            </View>
                            {!detail.correct && (
                                <Text style={styles.correctAnswerText}>Correct Answer: {detail.correctAnswer}</Text>
                            )}
                            {/* Check multiple possible field names for explanations */}
                            {(detail.explanation || detail.shortAnswer || detail.comment) && (
                                <View style={styles.explanationBox}>
                                    <Text style={styles.explanationTitle}>Feedback:</Text>
                                    <Text style={styles.explanationText}>
                                        {detail.explanation || detail.shortAnswer || detail.comment}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
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
        fontSize: 20,
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: '#1e293b',
        fontSize: 20,
        fontWeight: 'bold',
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
        elevation: 3,
    },
    reviewQuestion: {
        color: '#1e293b',
        fontSize: 16,
        fontWeight: 'bold',
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
        color: '#dc2626',
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
        backgroundColor: '#dc2626',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 4,
    },
    homeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    filterTabs: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    filterTab: {
        flex: 1,
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
        backgroundColor: '#f8fafc',
    },
    emptyReview: {
        padding: 20,
        alignItems: 'center',
    },
    emptyReviewText: {
        color: '#94a3b8',
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
});
