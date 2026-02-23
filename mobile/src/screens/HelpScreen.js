import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function HelpScreen({ navigation }) {
    const supportPhone = "+919291546714";
    const supportEmail = "support@dakplus.in";

    const openWhatsApp = () => {
        Linking.openURL(`whatsapp://send?phone=${supportPhone}&text=Hello DAK Plus Support, I need help with...`);
    };

    const openEmail = () => {
        Linking.openURL(`mailto:${supportEmail}?subject=DAK Plus Support Request`);
    };

    const faqs = [
        { q: "How to upgrade to Pro?", a: "Go to Home and click on the 'Unlock Everything' banner to pay via Razorpay." },
        { q: "Are tests AI-generated?", a: "Yes, our tests are powered by specialized AI to ensure exam-level precision." },
        { q: "Where can I see my progress?", a: "Check the 'Performance' tab for real-time analytics and weekly trends." },
    ];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f172a', '#1e293b', '#0f172a']}
                style={StyleSheet.absoluteFillObject}
            />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Support Center</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.contactSection}>
                        <Text style={styles.sectionTitle}>Get in Touch</Text>
                        <View style={styles.contactRow}>
                            <TouchableOpacity style={styles.contactCard} onPress={openWhatsApp}>
                                <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.cardGradient}>
                                    <Ionicons name="logo-whatsapp" size={32} color="#fff" />
                                    <Text style={styles.cardLabel}>WhatsApp</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.contactCard} onPress={openEmail}>
                                <LinearGradient colors={['#3b82f6', '#1e3a8a']} style={styles.cardGradient}>
                                    <Ionicons name="mail" size={32} color="#fff" />
                                    <Text style={styles.cardLabel}>Email Support</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.faqSection}>
                        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                        {faqs.map((faq, i) => (
                            <View key={i} style={styles.faqCard}>
                                <Text style={styles.faqQuestion}>{faq.q}</Text>
                                <Text style={styles.faqAnswer}>{faq.a}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>DAK Plus v1.0.0</Text>
                        <Text style={styles.footerSub}>Made for Postmen & Aspirants</Text>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        padding: 20,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#fff',
    },
    scrollContent: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 15,
    },
    contactSection: {
        marginBottom: 30,
    },
    contactRow: {
        flexDirection: 'row',
        gap: 15,
    },
    contactCard: {
        flex: 1,
        height: 120,
        borderRadius: 20,
        overflow: 'hidden',
    },
    cardGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 8,
    },
    faqSection: {
        marginBottom: 30,
    },
    faqCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 15,
        borderRadius: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    faqQuestion: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    faqAnswer: {
        color: '#94a3b8',
        fontSize: 13,
        lineHeight: 18,
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    footerText: {
        color: '#475569',
        fontSize: 12,
        fontWeight: 'bold',
    },
    footerSub: {
        color: '#334155',
        fontSize: 10,
        marginTop: 2,
    },
});
