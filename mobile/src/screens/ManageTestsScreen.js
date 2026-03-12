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
        <View style={[styles.container, { backgroundColor: '#0f172a' }]}>
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 15) }]}>
                <View style={styles.headerRow}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={styles.backBtn}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Content Manager</Text>
                    <TouchableOpacity 
                        onPress={() => {
                            try {
                                navigation.getParent()?.openDrawer();
                            } catch (e) {
                                navigation.dispatch(DrawerActions.openDrawer());
                            }
                        }} 
                        style={styles.backBtn}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="menu-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={tests}
                keyExtractor={(item) => item.id}
                renderItem={renderTestItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1e3a8a']} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
                        <Text style={styles.emptyTitle}>No tests created yet</Text>
                        <Text style={styles.emptySub}>Start by creating your first mock test!</Text>
                        <TouchableOpacity
                            style={styles.createBtn}
                            onPress={() => navigation.navigate('CreateTest')}
                        >
                            <Text style={styles.createBtnText}>Create Test</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        paddingBottom: 20,
        paddingHorizontal: 20,
        backgroundColor: '#0f172a',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    listContent: {
        padding: 20,
        flexGrow: 1,
    },
    testCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    testInfo: {
        flex: 1,
    },
    testTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 4,
    },
    testSub: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    tag: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    tagText: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '600',
    },
    metaText: {
        fontSize: 12,
        color: '#475569',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 12,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBtn: {
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
    },
    deleteBtn: {
        backgroundColor: 'rgba(248, 113, 113, 0.1)',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#475569',
        marginTop: 16,
    },
    emptySub: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 8,
        marginBottom: 24,
    },
    createBtn: {
        backgroundColor: '#1e3a8a',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    createBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});
