import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import ConfettiCannon from 'react-native-confetti-cannon';

/**
 * PAYMENT SCREEN (v2.0)
 * Fixed: Redirection logic and PRO badge visibility through focus-refresh.
 */
export default function PaymentScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [method, setMethod] = useState('upi');

    // REFRESH PROFILE ON FOCUS
    // This ensures that when the user returns from the browser after payment,
    // the app immediately picks up their "PREMIUM" status.
    useFocusEffect(
        React.useCallback(() => {
            loadProfile();
        }, [])
    );

    const loadProfile = async () => {
        try {
            const data = await api.get('/auth/profile');
            setUser(data.user);
            if (data.user?.subscriptionTier === 'PREMIUM') {
                setSuccess(true);
                // Auto-redirect to Home if user is now Premium
                setTimeout(() => {
                    navigation.navigate('Main');
                }, 1500);
            }
        } catch (err) {
            console.error("Failed to load profile", err);
        }
    };

    const pricing = {
        'MTS': {
            price: 10,
            title: 'MTS Exam',
            subtitle: 'TARGET 2026 BATCH',
            features: ['✓ Complete Paper 1 Syllabus', '✓ Detailed AI Training Access', '✓ Unlimited Practice Tests', '✓ One-time Payment']
        },
        'PMMG': {
            price: 30,
            title: 'Postman & Mail Guard',
            subtitle: 'COMPLETE PAPER 1 & 2',
            features: ['✓ Complete Paper 1 & 2 Syllabus', '✓ Detailed AI Training Access', '✓ Unlimited Practice Tests', '✓ One-time Payment']
        },
        'PASA': {
            price: 30,
            title: 'PA/SA Special Classes',
            subtitle: 'TARGET 2026 BATCH',
            features: ['✓ Complete Paper 1 & 2 Syllabus', '✓ Detailed AI Training Access', '✓ Unlimited Practice Tests', '✓ One-time Payment']
        },
        'COMBINED': {
            price: 70,
            title: 'Combined Course',
            subtitle: 'PA/SA, PM/MG, MTS',
            features: ['✓ Access to EVERYTHING', '✓ Detailed AI Training Access', '✓ Unlimited Practice Tests', '✓ Best Value Package']
        }
    };

    // Get courseId from navigation params if available
    const routeParams = navigation.getState()?.routes?.find(r => r.name === 'Payment')?.params || {};
    const selectedCourseId = routeParams.courseId || user?.examType || 'COMBINED';
    
    const details = pricing[selectedCourseId] || pricing[user?.examType] || pricing['COMBINED'];
    const currentPrice = details.price;

    const handlePayment = async () => {
        const token = await SecureStore.getItemAsync('access_token');
        const userId = user?.id || user?._id || user?.userId;
        // Include source=mobile, itemId, and explicit userId to let the web app know exactly what they are buying and bypass race conditions
        const webPaymentUrl = `https://dakplus.in/payment?source=mobile&token=${encodeURIComponent(token)}&userId=${encodeURIComponent(userId)}&itemId=${selectedCourseId}`;
        
        setLoading(true);
        try {
            // Use Linking to cleanly open the system browser/PWA which can easily redirect back to dakplus://
            import('react-native').then(({ Linking }) => {
                Linking.openURL(webPaymentUrl);
            });
            
            // We tell the user to return to the app manually if the deep link gets blocked
            Alert.alert(
                "Secure Payment", 
                "You are being redirected to our secure payment portal. Once you complete the payment, return to this app and it will automatically refresh."
            );
        } catch (err) {
            console.error("Browser Error:", err);
            Alert.alert('Technical Error', 'Temporary failure in opening the secure portal.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {success && (
                <View style={styles.successOverlay}>
                    <ConfettiCannon
                        count={200}
                        origin={{ x: width / 2, y: 0 }}
                        fadeOut={true}
                        explosionSpeed={350}
                    />
                    <Text style={styles.successTitle}>PRO UNLOCKED!</Text>
                </View>
            )}
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <LinearGradient colors={['#dc2626', '#1e3a8a']} style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Unlock {details.title}</Text>
                    <Text style={styles.subtitle}>{details.subtitle}</Text>
                </LinearGradient>

                <View style={styles.content}>
                    <View style={styles.planCard}>
                        {user?.subscriptionTier === 'PREMIUM' && (
                            <View style={styles.proBadgeContainer}>
                                <Text style={styles.proBadgeText}>ACTIVE PRO</Text>
                            </View>
                        )}
                        <Text style={styles.planLabel}>PRO MEMBERSHIP</Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.price}>₹{currentPrice}</Text>
                            <Text style={styles.period}>/exam</Text>
                        </View>
                        <View style={styles.benefits}>
                            {details.features.map((feat, idx) => (
                                <Text key={idx} style={styles.benefit}>{feat}</Text>
                            ))}
                        </View>
                    </View>

                    {user?.subscriptionTier !== 'PREMIUM' && (
                        <>
                            <Text style={styles.sectionTitle}>Secure Payment Portal</Text>
                            <View style={styles.infoBox}>
                                <Text style={styles.infoText}>Click the button below to complete your payment securely on our web gateway. Your PRO features will be unlocked instantly upon completion.</Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.payBtn, loading ? styles.disabledBtn : null]}
                                onPress={handlePayment}
                                disabled={loading}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Proceed to Payment</Text>}
                            </TouchableOpacity>
                        </>
                    )}

                    {user?.subscriptionTier === 'PREMIUM' && (
                        <TouchableOpacity
                            style={styles.doneBtn}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Text style={styles.doneBtnText}>Return to Dashboard</Text>
                        </TouchableOpacity>
                    )}

                    <Text style={styles.secureText}>🔒 Secure SSL Encrypted Gateway</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    scrollContainer: { flexGrow: 1 },
    header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    backBtn: { alignSelf: 'flex-start', marginBottom: 20 },
    backText: { color: '#fff', fontSize: 16 },
    title: { color: '#fff', fontSize: 32, fontWeight: 'extrabold', textAlign: 'center' },
    subtitle: { color: '#ffffffcc', fontSize: 14, textAlign: 'center', marginTop: 8 },
    content: { padding: 24, marginTop: -30 },
    planCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#e2e8f0', elevation: 8, shadowColor: '#dc2626', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, marginBottom: 32 },
    proBadgeContainer: { position: 'absolute', top: -10, right: 20, backgroundColor: '#10b981', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
    proBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    planLabel: { color: '#dc2626', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8, marginBottom: 20 },
    price: { color: '#1e293b', fontSize: 42, fontWeight: 'bold' },
    period: { color: '#64748b', fontSize: 18, marginLeft: 4 },
    benefits: { gap: 12 },
    benefit: { color: '#475569', fontSize: 16, fontWeight: '500' },
    sectionTitle: { color: '#1e293b', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    infoBox: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12, marginBottom: 24 },
    infoText: { color: '#475569', fontSize: 14, lineHeight: 20 },
    payBtn: { backgroundColor: '#dc2626', padding: 20, borderRadius: 18, alignItems: 'center', shadowColor: '#dc2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
    payBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    doneBtn: { backgroundColor: '#1e293b', padding: 20, borderRadius: 18, alignItems: 'center' },
    doneBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    disabledBtn: { opacity: 0.6 },
    secureText: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 16 },
    successOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
    successTitle: { fontSize: 40, fontWeight: '900', color: '#10b981', textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 10 }
});
