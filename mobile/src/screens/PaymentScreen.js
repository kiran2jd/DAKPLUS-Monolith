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
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import ConfettiCannon from 'react-native-confetti-cannon';

/**
 * PAYMENT SCREEN (v2.0)
 * Fixed: Redirection logic and PRO badge visibility through focus-refresh.
 */
export default function PaymentScreen({ navigation, route }) {
    const [user, setUser] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showWebView, setShowWebView] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState('');

    // Handle automatic navigation when success is true
    React.useEffect(() => {
        let timeout;
        if (success) {
            timeout = setTimeout(() => {
                navigation.navigate('Main');
            }, 3500); // Give enough time for the confetti and user to read "PRO UNLOCKED"
        }
        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [success]);

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
            if (data.user) {
                setUser(data.user);
                // Also update the stored user in SecureStore so other screens see the change
                await SecureStore.setItemAsync('user', JSON.stringify(data.user));
                
                if (data.user.subscriptionTier === 'PREMIUM' && !success) {
                    setSuccess(true);
                }
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

    // Access courseId reliably from navigation route props
    const selectedCourseId = route?.params?.courseId || user?.examType || 'COMBINED';
    
    const details = pricing[selectedCourseId] || pricing[user?.examType] || pricing['COMBINED'];
    const currentPrice = details.price;

    const handlePayment = async () => {
        setProcessing(true); // Ensure user doesn't double-tap
        try {
            const token = await SecureStore.getItemAsync('access_token');
            const currentUser = await authService.getUser();
            const userId = currentUser?.id || currentUser?._id || currentUser?.userId;

            if (!token || !userId || userId === 'undefined') {
                console.log("CRITICAL: Authentication data missing before payment!", { userId, hasToken: !!token });
                Alert.alert("Authentication Error", "Session expired or invalid. Please logout and login again before making a payment.");
                setProcessing(false);
                return;
            }

            const webUrl = `https://dakplus.in/payment?source=mobile&minimal=true&token=${encodeURIComponent(token)}&userId=${encodeURIComponent(userId)}&itemId=${selectedCourseId}`;
            console.log("Navigating to Mobile Payment URL:", webUrl);
            setPaymentUrl(webUrl);
            setShowWebView(true);
        } catch (error) {
            console.error("Payment initiation failed:", error);
            Alert.alert("Error", "Could not start payment. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {success && (
                <View style={styles.successOverlay}>
                    <ConfettiCannon count={200} origin={{ x: 180, y: 0 }} fadeOut={true} explosionSpeed={350} />
                    <Text style={styles.successTitle}>PRO UNLOCKED!</Text>
                </View>
            )}

            <Modal visible={showWebView} animationType="slide" onRequestClose={() => setShowWebView(false)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: '#fcf9f2' }}>
                    <View style={styles.webviewHeader}>
                        <TouchableOpacity onPress={() => setShowWebView(false)} style={styles.webviewCloseBtn}>
                            <Ionicons name="close" size={28} color="#1e293b" />
                        </TouchableOpacity>
                        <Text style={styles.webviewTitle}>Secure Checkout</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <WebView 
                        source={{ uri: paymentUrl }} 
                        style={{ flex: 1 }}
                        injectedJavaScript={`
                            (function() {
                                try {
                                    const params = new URLSearchParams(window.location.search);
                                    const token = params.get('token');
                                    const userId = params.get('userId');
                                    if (token) localStorage.setItem('token', token);
                                    if (userId) {
                                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                                        user.id = userId;
                                        localStorage.setItem('user', JSON.stringify(user));
                                    }
                                    // Safety: also set a flag to hide elements if CSS fails
                                    document.body.classList.add('mobile-webview');
                                } catch (e) {}
                            })();
                            true;
                        `}
                        onNavigationStateChange={(navState) => {
                            console.log("WebView Nav:", navState.url);
                            if (navState.url.includes('checkout/success') || navState.url.includes('payment=success')) {
                                setShowWebView(false);
                                setSuccess(true);
                                loadProfile();
                            }
                        }}
                    />
                </SafeAreaView>
            </Modal>

            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <LinearGradient colors={['#fdfbf7', '#fdfbf7']} style={styles.header}>
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
                                style={[styles.payBtn, processing ? styles.disabledBtn : null]}
                                onPress={handlePayment}
                                disabled={processing}
                            >
                                {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Proceed to Payment</Text>}
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
    container: { flex: 1, backgroundColor: '#fcf9f2' },
    scrollContainer: { flexGrow: 1 },
    header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    backBtn: { alignSelf: 'flex-start', marginBottom: 20 },
    backText: { color: '#dc2626', fontSize: 16, fontWeight: '700' },
    title: { color: '#1e293b', fontSize: 32, fontWeight: '900', textAlign: 'center' },
    subtitle: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 8, fontWeight: '600' },
    content: { padding: 24, marginTop: -30 },
    planCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#e2e8f0', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, marginBottom: 32 },
    proBadgeContainer: { position: 'absolute', top: -10, right: 20, backgroundColor: '#10b981', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20 },
    proBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    planLabel: { color: '#dc2626', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 8, marginBottom: 20 },
    price: { color: '#1e293b', fontSize: 42, fontWeight: 'bold' },
    period: { color: '#64748b', fontSize: 18, marginLeft: 4 },
    benefits: { gap: 12 },
    benefit: { color: '#475569', fontSize: 16, fontWeight: '500' },
    sectionTitle: { color: '#1e293b', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    infoBox: { backgroundColor: '#fdfbf7', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#f1f5f9' },
    infoText: { color: '#475569', fontSize: 14, lineHeight: 20 },
    payBtn: { backgroundColor: '#dc2626', padding: 20, borderRadius: 18, alignItems: 'center', shadowColor: '#dc2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 },
    payBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
    doneBtn: { backgroundColor: '#1e293b', padding: 20, borderRadius: 18, alignItems: 'center' },
    doneBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    disabledBtn: { opacity: 0.6 },
    secureText: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginTop: 16 },
    successOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(253,251,247,0.9)' },
    successTitle: { fontSize: 40, fontWeight: '900', color: '#10b981', textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 10 },
    webviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', backgroundColor: '#fcf9f2' },
    webviewCloseBtn: { padding: 8 },
    webviewTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' }
});
