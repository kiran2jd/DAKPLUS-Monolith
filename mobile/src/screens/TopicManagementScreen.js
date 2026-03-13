import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal,
} from 'react-native';
import { ScrollView, FlatList, TouchableOpacity } from 'react-native-gesture-handler';
import { DrawerActions, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { topicService } from '../services/topic';

export default function TopicManagementScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [subtopicModalVisible, setSubtopicModalVisible] = useState(false);
    const [newTopicName, setNewTopicName] = useState('');
    const [newSubtopicName, setNewSubtopicName] = useState('');
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [subtopics, setSubtopics] = useState({}); // { topicId: [subtopics] }

    useEffect(() => {
        loadTopics();
    }, []);

    const loadTopics = async () => {
        try {
            const data = await topicService.getAllTopics();
            setTopics(data);
            for (const topic of data) {
                fetchSubtopics(topic.id);
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to load topics');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubtopics = async (topicId) => {
        try {
            const data = await topicService.getSubtopics(topicId);
            setSubtopics(prev => ({ ...prev, [topicId]: data }));
        } catch (err) {
            console.error("Failed to fetch subtopics for " + topicId, err);
        }
    };

    const handleAddTopic = async () => {
        if (!newTopicName.trim()) return;
        try {
            const created = await topicService.createTopic({ name: newTopicName });
            setTopics([...topics, created]);
            setNewTopicName('');
            setModalVisible(false);
            Alert.alert('Success', 'Topic created');
        } catch (err) {
            Alert.alert('Error', 'Failed to create topic');
        }
    };

    const handleAddSubtopic = async () => {
        if (!newSubtopicName.trim() || !selectedTopic) return;
        try {
            const created = await topicService.createSubtopic({
                name: newSubtopicName,
                topicId: selectedTopic.id
            });
            const updatedSubtopics = [...(subtopics[selectedTopic.id] || []), created];
            setSubtopics({ ...subtopics, [selectedTopic.id]: updatedSubtopics });
            setNewSubtopicName('');
            setSubtopicModalVisible(false);
            Alert.alert('Success', 'Subtopic created');
        } catch (err) {
            Alert.alert('Error', 'Failed to create subtopic');
        }
    };

    const handleDeleteTopic = (id) => {
        Alert.alert('Delete Topic', 'Are you sure?', [
            { text: 'Cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await topicService.deleteTopic(id);
                        setTopics(topics.filter(t => t.id !== id));
                    } catch (err) {
                        Alert.alert('Error', 'Failed to delete');
                    }
                }
            }
        ]);
    };

    const renderTopicItem = ({ item }) => (
        <View style={styles.topicCard}>
            <View style={styles.topicHeader}>
                <Text style={styles.topicName}>{item.name}</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => {
                            setSelectedTopic(item);
                            setSubtopicModalVisible(true);
                        }}
                        style={styles.addIcon}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="add-circle" size={24} color="#10b981" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => handleDeleteTopic(item.id)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="trash-outline" size={20} color="#f87171" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.subtopicsContainer}>
                {(subtopics[item.id] || []).map(sub => (
                    <View key={sub.id} style={styles.subtopicBadge}>
                        <Text style={styles.subtopicText}>{sub.name}</Text>
                    </View>
                ))}
                {(!subtopics[item.id] || subtopics[item.id].length === 0) && (
                    <Text style={styles.noSubtopics}>No subtopics yet</Text>
                )}
            </View>
        </View>
    );

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
                    <Text style={styles.headerTitle}>TOPIC MATRIX</Text>
                    <TouchableOpacity 
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())} 
                        style={styles.headerIconButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="menu-outline" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSubtitle}>Map your curriculum topics and modules</Text>
            </LinearGradient>

            {loading ? (
                <ActivityIndicator size="large" color="#059669" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={topics}
                    renderItem={renderTopicItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>No topics found. Create your first topic!</Text>
                        </View>
                    }
                />
            )}

            {/* New Topic Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Create New Topic</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Topic Name"
                            value={newTopicName}
                            onChangeText={setNewTopicName}
                            placeholderTextColor="#94a3b8"
                        />
                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleAddTopic}>
                                <Text style={styles.saveBtnText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* New Subtopic Modal */}
            <Modal visible={subtopicModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Subtopic to {selectedTopic?.name}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Subtopic Name"
                            value={newSubtopicName}
                            onChangeText={setNewSubtopicName}
                            placeholderTextColor="#94a3b8"
                        />
                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setSubtopicModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleAddSubtopic}>
                                <Text style={styles.saveBtnText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    list: { padding: 20, paddingBottom: 40 },
    topicCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    topicHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    topicName: { fontSize: 17, fontWeight: '900', color: '#fff' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    subtopicsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    subtopicBadge: { backgroundColor: 'rgba(255,255,255,0.02)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    subtopicText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
    noSubtopics: { fontSize: 12, color: '#475569', fontStyle: 'italic' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: '#1e293b', borderRadius: 32, padding: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    modalTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 24, letterSpacing: 0.5 },
    input: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 30, color: '#fff', fontSize: 16 },
    modalBtns: { flexDirection: 'row', gap: 12 },
    modalBtn: { flex: 1, padding: 18, borderRadius: 16, alignItems: 'center' },
    cancelBtn: { backgroundColor: 'rgba(255,255,255,0.05)' },
    cancelBtnText: { color: '#94a3b8', fontWeight: 'bold' },
    saveBtn: { backgroundColor: '#10b981' },
    saveBtnText: { color: '#fff', fontWeight: '900', textTransform: 'uppercase' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#64748b', fontWeight: 'bold' },
    addIcon: { padding: 4 }
});
