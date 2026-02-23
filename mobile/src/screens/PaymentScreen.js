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
    Linking,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import { usePreventScreenCapture } from 'expo-screen-capture';
import ConfettiCannon from 'react-native-confetti-cannon';

export default function PaymentScreen({ navigation }) {
    // usePreventScreenCapture(); // Temporarily disabled for client demo
    const [user, setUser] = useState(null);

    React.useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await api.get('/auth/profile');
            setUser(data.user);
        } catch (err) {
            console.error("Failed to load profile", err);
        }
    };

    const pricing = {
        'GDS to MTS': 199,
        'MTS': 199,
        'GDS to Postman': 299,
        'MTS to Postman': 299,
        'PM MG Exam': 299,
        'GDS/MTS/Postman to PA/SA': 499,
        'PA SA Exam': 499,
        'IP Exam': 999
    };

    const currentPrice = pricing[user?.examType] || 299;

    const handlePayment = async () => {
        const token = await SecureStore.getItemAsync('access_token');
        const webPaymentUrl = `https://dakplus.in/payment?source=mobile&token=${token}`;
        setLoading(true);
        try {
            await WebBrowser.openBrowserAsync(webPaymentUrl);
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
                <ConfettiCannon
                    count={200}
                    origin={{ x: -10, y: 0 }}
                    fadeOut={true}
                    explosionSpeed={350}
                />
            )}
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <LinearGradient colors={['#dc2626', '#1e3a8a']} style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Unlock Exam</Text>
                    <Text style={styles.subtitle}>{user?.examType || 'Professional Exam'} Preparation</Text>
                </LinearGradient>

                <View style={styles.content}>
                    <View style={styles.planCard}>
                        <Text style={styles.planLabel}>PRO MEMBERSHIP</Text>
                        <View style={styles.priceRow}>
                            <Text style={styles.price}>₹{currentPrice}</Text>
                            <Text style={styles.period}>/exam</Text>
                        </View>
                        <View style={styles.benefits}>
                            <Text style={styles.benefit}>✓ Complete Paper 1 & 2 Syllabus</Text>
                            <Text style={styles.benefit}>✓ Detailed AI Training Access</Text>
                            <Text style={styles.benefit}>✓ Unlimited Practice Tests</Text>
                            <Text style={styles.benefit}>✓ One-time Payment</Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Select Payment Method</Text>
                    <View style={styles.methodTabs}>
                        <TouchableOpacity
                            style={[styles.tab, method === 'card' ? styles.activeTab : null]}
                            onPress={() => setMethod('card')}
                        >
                            <Text style={[styles.tabText, method === 'card' ? styles.activeTabText : null]}>Card</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, method === 'upi' ? styles.activeTab : null]}
                            onPress={() => setMethod('upi')}
                        >
                            <Text style={[styles.tabText, method === 'upi' ? styles.activeTabText : null]}>UPI / QR</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.detailsBox}>
                        {method === 'card' ? (
                            <View style={styles.cardInfo}>
                                <Text style={styles.placeholderText}>•••• •••• •••• 4242</Text>
                                <Text style={styles.placeholderSub}>Pay securely with card</Text>
                            </View>
                        ) : (
                            <View style={styles.qrInfo}>
                                <View style={styles.qrPlaceholder} />
                                <Text style={styles.placeholderSub}>Scan QR to pay instantly</Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.payBtn, loading ? styles.disabledBtn : null]}
                        onPress={handlePayment}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Complete Upgrade on Web</Text>}
                    </TouchableOpacity>
                    <Text style={styles.secureText}>🔒 Secure SSL Encrypted Gateway</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    backBtn: {
        alignSelf: 'flex-start',
        marginBottom: 20,
    },
    backText: {
        color: '#fff',
        fontSize: 16,
    },
    title: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'extrabold',
        textAlign: 'center',
    },
    subtitle: {
        color: '#ffffffcc',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    content: {
        padding: 24,
        marginTop: -30,
    },
    planCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 8,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        marginBottom: 32,
    },
    planLabel: {
        color: '#dc2626',
        fontSize: 13,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 8,
        marginBottom: 20,
    },
    price: {
        color: '#1e293b',
        fontSize: 42,
        fontWeight: 'bold',
    },
    period: {
        color: '#64748b',
        fontSize: 18,
        marginLeft: 4,
    },
    benefits: {
        gap: 12,
    },
    benefit: {
        color: '#475569',
        fontSize: 16,
        fontWeight: '500',
    },
    sectionTitle: {
        color: '#1e293b',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    methodTabs: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeTab: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        color: '#64748b',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#dc2626',
    },
    detailsBox: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 32,
        alignItems: 'center',
    },
    placeholderText: {
        color: '#1e293b',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    placeholderSub: {
        color: '#64748b',
        fontSize: 13,
    },
    qrPlaceholder: {
        width: 140,
        height: 140,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    payBtn: {
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
    payBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledBtn: {
        opacity: 0.6,
    },
    secureText: {
        color: '#94a3b8',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 16,
    },
});
