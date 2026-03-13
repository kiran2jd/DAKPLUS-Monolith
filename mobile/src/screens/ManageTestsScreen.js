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
                <ActivityIndicator size="large" color="#1e3a8a" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#1e293b', '#0f172a']} style={[styles.header, { paddingTop: Math.max(insets.top, 15) }]}>
                <View style={styles.headerRow}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={styles.headerIconButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>CONTENT MANAGER</Text>
                    <TouchableOpacity 
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())} 
                        style={styles.headerIconButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="menu-outline" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSubtitle}>Manage and publish your mock exams</Text>
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
                            <Ionicons name="document-text-outline" size={64} color="rgba(255,255,255,0.1)" />
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
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: { paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerIconButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    headerSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 4, fontWeight: '500' },
    listContent: { padding: 20, paddingBottom: 100, flexGrow: 1 },
    testCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    testInfo: { flex: 1 },
    testTitle: { fontSize: 16, fontWeight: '900', color: '#fff', marginBottom: 4 },
    testSub: { fontSize: 13, color: '#64748b', marginBottom: 12 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    tag: { backgroundColor: 'rgba(56, 189, 248, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    tagText: { fontSize: 10, color: '#38bdf8', fontWeight: '900', textTransform: 'uppercase' },
    metaText: { fontSize: 12, color: '#475569', fontWeight: 'bold' },
    actions: { flexDirection: 'row', gap: 10, marginLeft: 12 },
    actionBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    editBtn: { backgroundColor: 'rgba(96, 165, 250, 0.1)' },
    deleteBtn: { backgroundColor: 'rgba(248, 113, 113, 0.1)' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyIconBg: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: 1 },
    emptySub: { fontSize: 14, color: '#64748b', marginTop: 8, marginBottom: 24, textAlign: 'center' },
    createBtnLarge: { borderRadius: 16, overflow: 'hidden' },
    gradientBtn: { paddingHorizontal: 24, paddingVertical: 14, alignItems: 'center' },
    createBtnText: { color: '#fff', fontWeight: '900', letterSpacing: 0.5 },
    fab: { position: 'absolute', bottom: 30, right: 24, borderRadius: 30, elevation: 8, shadowColor: '#dc2626', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, overflow: 'hidden' },
    fabGradient: { width: 56, height: 56, justifyContent: 'center', alignItems: 'center' },
});
