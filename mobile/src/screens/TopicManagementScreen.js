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
    TextInput,
    Modal,
    ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { topicService } from '../services/topic';

export default function TopicManagementScreen({ navigation }) {
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
            // Pre-load subtopics for all topics (or we could do it on expand)
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
                    >
                        <Ionicons name="add-circle" size={24} color="#059669" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteTopic(item.id)}>
                        <Ionicons name="trash-outline" size={20} color="#dc2626" />
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
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#059669', '#10b981']} style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Topic Management</Text>
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <Ionicons name="add-circle" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>
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
                            placeholder="Topic Name (e.g. Mathematics)"
                            value={newTopicName}
                            onChangeText={setNewTopicName}
                            autoFocus
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
                            placeholder="Subtopic Name (e.g. Algebra)"
                            value={newSubtopicName}
                            onChangeText={setNewSubtopicName}
                            autoFocus
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    list: { padding: 20 },
    topicCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    topicHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    topicName: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    subtopicsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    subtopicBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' },
    subtopicText: { fontSize: 12, color: '#475569' },
    noSubtopics: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
    input: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24 },
    modalBtns: { flexDirection: 'row', gap: 12 },
    modalBtn: { flex: 1, padding: 16, borderRadius: 14, alignItems: 'center' },
    cancelBtn: { backgroundColor: '#f1f5f9' },
    cancelBtnText: { color: '#64748b', fontWeight: 'bold' },
    saveBtn: { backgroundColor: '#059669' },
    saveBtnText: { color: '#fff', fontWeight: 'bold' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#94a3b8' },
    addIcon: { padding: 4 }
});
