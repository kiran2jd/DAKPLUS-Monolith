import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ComingSoonScreen({ navigation, route }) {
    const title = route.params?.title || "Feature";

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.gradient}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.iconGradient}>
                            <Ionicons name="rocket" size={60} color="#fff" />
                        </LinearGradient>
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.status}>COMING SOON</Text>
                    
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            We are working hard to bring you the best {title.toLowerCase()} experience. Stay tuned for exciting updates!
                        </Text>
                    </View>

                    <TouchableOpacity 
                        style={styles.doneBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.doneBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>DAK PLUS • PREMIUM LEARNING</Text>
                </View>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    gradient: { flex: 1 },
    header: { padding: 20 },
    backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    iconContainer: { marginBottom: 30, elevation: 10, shadowColor: '#3b82f6', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } },
    iconGradient: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 32, fontWeight: '900', color: '#fff', textAlign: 'center' },
    status: { fontSize: 18, fontWeight: 'bold', color: '#3b82f6', letterSpacing: 4, marginTop: 10, marginBottom: 30 },
    infoBox: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 40 },
    infoText: { color: '#94a3b8', textAlign: 'center', lineHeight: 24, fontSize: 15 },
    doneBtn: { backgroundColor: '#3b82f6', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 15, width: '100%', alignItems: 'center' },
    doneBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    footer: { paddingBottom: 40, alignItems: 'center' },
    footerText: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 'bold', letterSpacing: 2 }
});
