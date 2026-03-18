import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { ScrollView, FlatList, TouchableOpacity } from 'react-native-gesture-handler';
import { useFocusEffect, DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { testService } from '../services/test';

export default function ManageTestsScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadMyTests();
    }, []);

    const loadMyTests = async () => {
        try {
            const data = await testService.getMyTests();
            setTests(data);
        } catch (err) {
            Alert.alert('Error', 'Failed to load your tests');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadMyTests();
    };

    const handleDelete = (testId) => {
        Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this test? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await testService.deleteTest(testId);
                            setTests(tests.filter(t => t.id !== testId));
                            Alert.alert('Success', 'Test deleted successfully');
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete test');
                        }
                    }
                }
            ]
        );
    };

    const renderTestItem = ({ item }) => (
        <View style={styles.testCard}>
            <View style={styles.testInfo}>
                <Text style={styles.testTitle}>{item.title}</Text>
                <Text style={styles.testSub} numberOfLines={1}>{item.description || 'No description'}</Text>
                <View style={styles.metaRow}>
                    <View style={styles.tag}>
                        <Text style={styles.tagText}>{item.category || 'General'}</Text>
                    </View>
                    <Text style={styles.metaText}>{item.questionsCount || (item.questions ? item.questions.length : 0)} Qs</Text>
                    <Text style={styles.metaText}>{item.durationMinutes} min</Text>
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => navigation.navigate('EditTest', { testId: item.id })}
                    activeOpacity={0.7}
                >
                    <Ionicons name="create-outline" size={20} color="#60a5fa" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(item.id)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="trash-outline" size={20} color="#f87171" />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#dc2626" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient 
                colors={['#1e3a8a', '#1e40af']} 
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.premiumHeader, { paddingTop: Math.max(insets.top, 15) }]}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={styles.headerIconButtonPremium}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitlePremium}>CONTENT HUB</Text>
                    <TouchableOpacity 
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())} 
                        style={styles.headerIconButtonPremium}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="menu-outline" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.headerBottomRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerSubtitlePremium}>Exam Repository</Text>
                        <Text style={styles.headerStatsPremium}>{tests.length} Active Tests</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.createBtnPremium}
                        onPress={() => navigation.navigate('CreateTest')}
                    >
                        <Ionicons name="add" size={20} color="#1e3a8a" />
                        <Text style={styles.createBtnTextPremium}>Create</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <FlatList
                data={tests}
                keyExtractor={(item) => item.id}
                renderItem={renderTestItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#dc2626" />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconBg}>
                            <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
                        </View>
                        <Text style={styles.emptyTitle}>NO TESTS CREATED YET</Text>
                        <Text style={styles.emptySub}>Start by creating your first mock test!</Text>
                        <TouchableOpacity
                            style={styles.createBtnLarge}
                            onPress={() => navigation.navigate('CreateTest')}
                        >
                            <LinearGradient colors={['#dc2626', '#b91c1c']} style={styles.gradientBtn}>
                                <Text style={styles.createBtnText}>+ CREATE NEW TEST</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Floating Action Button */}
            <TouchableOpacity 
                style={styles.fab}
                onPress={() => navigation.navigate('CreateTest')}
                activeOpacity={0.8}
            >
                <LinearGradient colors={['#dc2626', '#b91c1c']} style={styles.fabGradient}>
                    <Ionicons name="add" size={32} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcf9f2' },
    premiumHeader: {
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        elevation: 8,
        shadowColor: '#1e3a8a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerIconButtonPremium: { 
        width: 44, 
        height: 44, 
        borderRadius: 12, 
        backgroundColor: 'rgba(255,255,255,0.15)', 
        justifyContent: 'center', 
        alignItems: 'center',
    },
    headerTitlePremium: { 
        color: '#fff', 
        fontSize: 16, 
        fontWeight: '900', 
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    headerBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 25,
    },
    headerSubtitlePremium: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    headerStatsPremium: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 2 },
    createBtnPremium: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 14,
        gap: 6,
        elevation: 4,
    },
    createBtnTextPremium: {
        color: '#1e3a8a',
        fontSize: 13,
        fontWeight: '900',
    },
    listContent: { padding: 20, paddingBottom: 100, flexGrow: 1 },
    testCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    testInfo: { flex: 1 },
    testTitle: { fontSize: 16, fontWeight: '900', color: '#1e293b', marginBottom: 4 },
    testSub: { fontSize: 13, color: '#64748b', marginBottom: 12 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    tag: { backgroundColor: 'rgba(56, 189, 248, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    tagText: { fontSize: 10, color: '#38bdf8', fontWeight: '900', textTransform: 'uppercase' },
    metaText: { fontSize: 12, color: '#475569', fontWeight: 'bold' },
    actions: { flexDirection: 'row', gap: 10, marginLeft: 12 },
    actionBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    editBtn: { backgroundColor: '#eff6ff' },
    deleteBtn: { backgroundColor: '#fef2f2' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fcf9f2' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyIconBg: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
    emptyTitle: { fontSize: 16, fontWeight: '900', color: '#1e293b', letterSpacing: 1 },
    emptySub: { fontSize: 14, color: '#64748b', marginTop: 8, marginBottom: 24, textAlign: 'center' },
    createBtnLarge: { borderRadius: 16, overflow: 'hidden' },
    gradientBtn: { paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center' },
    createBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 0.5 },
    fab: { position: 'absolute', bottom: 30, right: 24, borderRadius: 30, elevation: 8, shadowColor: '#dc2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, overflow: 'hidden' },
    fabGradient: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },
});
