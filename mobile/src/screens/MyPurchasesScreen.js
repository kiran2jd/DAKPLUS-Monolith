import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { authService } from '../services/auth';
import api from '../services/api';

const { width } = Dimensions.get('window');

export default function MyPurchasesScreen({ navigation }) {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            fetchPurchases();
        }, [])
    );

    const fetchPurchases = async () => {
        try {
            const user = await authService.getUser();
            const userId = user?.id || user?._id;
            if (userId) {
                const response = await api.get(`/payments/user-purchases?userId=${userId}`);
                setPurchases(response.data || []);
            }
        } catch (error) {
            console.error("Failed to load purchases", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color="#dc2626" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#fcf9f2', '#fcf9f2']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.title}>Transaction History</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {purchases.length > 0 ? (
                    purchases.map((txn, idx) => (
                        <View key={idx} style={styles.txnCard}>
                            <View style={styles.txnHeader}>
                                <View style={styles.txnIconBg}>
                                    <Ionicons name="receipt-outline" size={24} color="#dc2626" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.txnItem}>{txn.itemId === 'COMBINED' ? 'Combined Course' : (txn.itemId || 'Course Pack')}</Text>
                                    <Text style={styles.txnDate}>{new Date(txn.createdAt).toLocaleDateString()}</Text>
                                </View>
                                <Text style={styles.txnAmount}>₹{txn.amount}</Text>
                            </View>
                            <View style={styles.txnFooter}>
                                <Text style={styles.txnId}>ID: {txn.orderId || 'N/A'}</Text>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>{txn.status}</Text>
                                </View>
                            </View>
                        </View>
                    ))
                ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="card-outline" size={64} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>No Transactions Yet</Text>
                    <Text style={styles.emptySub}>Your purchased courses and tests will appear here.</Text>
                    <TouchableOpacity 
                        style={styles.browseBtn}
                        onPress={() => navigation.navigate('Main')}
                    >
                        <Text style={styles.browseBtnText}>Explore Courses</Text>
                    </TouchableOpacity>
                </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcf9f2' },
    center: { justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, paddingTop: 50, flexDirection: 'row', alignItems: 'center', gap: 15, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 3 },
    backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 } },
    title: { color: '#1e293b', fontSize: 20, fontWeight: '900' },
    scrollContent: { padding: 20 },
    txnCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    txnHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    txnIconBg: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center' },
    txnItem: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    txnDate: { fontSize: 12, color: '#64748b', marginTop: 2 },
    txnAmount: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
    txnFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    txnId: { fontSize: 10, color: '#94a3b8', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
    statusBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { color: '#15803d', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
    emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#475569', marginTop: 20 },
    emptySub: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 8, marginBottom: 30 },
    browseBtn: { backgroundColor: '#dc2626', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    browseBtnText: { color: '#fff', fontWeight: 'bold' }
});
