import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    SafeAreaView,
    RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { testService } from '../services/test';

export default function ManageTestsScreen({ navigation }) {
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
                >
                    <Ionicons name="create-outline" size={20} color="#1e3a8a" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(item.id)}
                >
                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
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
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#1e3a8a', '#3b82f6']} style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Created Tests</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('CreateTest')}>
                        <Ionicons name="add-circle" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 20,
        flexGrow: 1,
    },
    testCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    testInfo: {
        flex: 1,
    },
    testTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
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
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    tagText: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '600',
    },
    metaText: {
        fontSize: 12,
        color: '#94a3b8',
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
        backgroundColor: '#eff6ff',
    },
    deleteBtn: {
        backgroundColor: '#fef2f2',
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
