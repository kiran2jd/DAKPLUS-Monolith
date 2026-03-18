import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ActivityIndicator,
    Alert,
    ScrollView,
    FlatList,
    TouchableOpacity,
    TextInput,
    Modal,
} from 'react-native';
import { DrawerActions, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { topicService } from '../services/topic';

export default function TopicManagementScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [subtopicModalVisible, setSubtopicModalVisible] = useState(false);
    const [newTopic, setNewTopic] = useState({ name: '' });
    const [newSubtopic, setNewSubtopic] = useState({ name: '' });
    const [editingTopic, setEditingTopic] = useState(null);
    const [editingSubtopic, setEditingSubtopic] = useState(null);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [subtopics, setSubtopics] = useState({}); // { topicId: [subtopics] }
    const [courseIds, setCourseIds] = useState([]); // Selected course tags

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


    const toggleCourse = (cid) => {
        setCourseIds(prev => 
            prev.includes(cid) ? prev.filter(c => c !== cid) : [...prev, cid]
        );
    };

    const handleAddTopic = async () => {
        const topicObj = editingTopic || newTopic;
        if (!topicObj.name?.trim()) return;
        setUploading(true);
        try {
            const topicData = { 
                name: topicObj.name,
                courseIds: courseIds
            };
            
            if (editingTopic) {
                const updated = await topicService.updateTopic(editingTopic.id, topicData);
                setTopics(topics.map(t => t.id === updated.id ? updated : t));
                setEditingTopic(null);
                Alert.alert('Success', 'Topic updated');
            } else {
                const created = await topicService.createTopic(topicData);
                setTopics([...topics, created]);
                setNewTopic({ name: '' });
                Alert.alert('Success', 'Topic created');
            }
            setModalVisible(false);
        } catch (err) {
            Alert.alert('Error', `Failed to ${editingTopic ? 'update' : 'create'} topic`);
        } finally {
            setUploading(false);
        }
    };

    const handleAddSubtopic = async () => {
        const subObj = editingSubtopic || newSubtopic;
        if (!subObj.name?.trim() || !selectedTopic) return;
        setUploading(true);
        try {
            const subData = {
                name: subObj.name,
                topicId: selectedTopic.id
            };

            if (editingSubtopic) {
                const updated = await topicService.updateSubtopic(editingSubtopic.id, subData);
                const list = subtopics[selectedTopic.id] || [];
                setSubtopics({ ...subtopics, [selectedTopic.id]: list.map(s => s.id === updated.id ? updated : s) });
                setEditingSubtopic(null);
                Alert.alert('Success', 'Subtopic updated');
            } else {
                const created = await topicService.createSubtopic(subData);
                const updatedSubtopics = [...(subtopics[selectedTopic.id] || []), created];
                setSubtopics({ ...subtopics, [selectedTopic.id]: updatedSubtopics });
                setNewSubtopic({ name: '' });
                Alert.alert('Success', 'Subtopic created');
            }
            setSubtopicModalVisible(false);
        } catch (err) {
            Alert.alert('Error', `Failed to ${editingSubtopic ? 'update' : 'create'} subtopic`);
        } finally {
            setUploading(false);
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
                <View>
                    <Text style={styles.topicName}>{item.name}</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => {
                            setEditingTopic(item);
                            setCourseIds(item.courseIds || []);
                            setModalVisible(true);
                        }}
                        style={styles.actionIcon}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="create-outline" size={20} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            setSelectedTopic(item);
                            setEditingSubtopic(null);
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
                    <TouchableOpacity 
                        key={sub.id} 
                        style={styles.subtopicBadge}
                        onPress={() => {
                            setSelectedTopic(item);
                            setEditingSubtopic(sub);
                            setSubtopicModalVisible(true);
                        }}
                    >
                        <Text style={styles.subtopicText}>{sub.name}</Text>
                        <Ionicons name="pencil" size={8} color="#94a3b8" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                ))}
                {(!subtopics[item.id] || subtopics[item.id].length === 0) && (
                    <Text style={styles.noSubtopics}>No subtopics yet</Text>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#fcf9f2', '#fcf9f2']} style={[styles.header, { paddingTop: Math.max(insets.top, 5) }]}>
                <View style={styles.headerRow}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={styles.headerIconButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>TOPIC MATRIX</Text>
                    <TouchableOpacity 
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())} 
                        style={styles.headerIconButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="menu-outline" size={28} color="#1e293b" />
                    </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <Text style={styles.headerSubtitle}>Map your curriculum topics and modules</Text>
                    <TouchableOpacity 
                        style={styles.createBtn}
                        onPress={() => {
                            setEditingTopic(null);
                            setCourseIds([]);
                            setModalVisible(true);
                        }}
                    >
                        <Ionicons name="duplicate" size={18} color="#fff" />
                        <Text style={styles.createBtnText}>New Topic</Text>
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
                        <Text style={styles.modalTitle}>{editingTopic ? 'Edit Topic' : 'Create New Topic'}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Topic Name"
                            value={editingTopic ? editingTopic.name : newTopic.name}
                            onChangeText={(val) => {
                                if (editingTopic) setEditingTopic({ ...editingTopic, name: val });
                                else setNewTopic({ ...newTopic, name: val });
                            }}
                            placeholderTextColor="#94a3b8"
                        />

                        <Text style={styles.modalLabel}>Available In Courses</Text>
                        <View style={styles.courseSelectionRow}>
                            {['MTS', 'PMMG', 'PASA'].map(cid => (
                                <TouchableOpacity 
                                    key={cid}
                                    style={[styles.courseChip, courseIds.includes(cid) && styles.courseChipActive]}
                                    onPress={() => toggleCourse(cid)}
                                >
                                    <Text style={[styles.courseChipText, courseIds.includes(cid) && styles.courseChipTextActive]}>
                                        {cid}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        

                        <View style={styles.modalBtns}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.cancelBtn]} 
                                onPress={() => {
                                    setModalVisible(false);
                                    setEditingTopic(null);
                                }} 
                                disabled={uploading}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleAddTopic} disabled={uploading}>
                                <Text style={styles.saveBtnText}>{uploading ? 'Processing...' : 'Save'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* New Subtopic Modal */}
            <Modal visible={subtopicModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editingSubtopic ? 'Edit' : 'Add'} Subtopic to {selectedTopic?.name}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Subtopic Name"
                            value={editingSubtopic ? editingSubtopic.name : newSubtopic.name}
                            onChangeText={(val) => {
                                if (editingSubtopic) setEditingSubtopic({ ...editingSubtopic, name: val });
                                else setNewSubtopic({ ...newSubtopic, name: val });
                            }}
                            placeholderTextColor="#94a3b8"
                        />


                        <View style={styles.modalBtns}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.cancelBtn]} 
                                onPress={() => {
                                    setSubtopicModalVisible(false);
                                    setEditingSubtopic(null);
                                }} 
                                disabled={uploading}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleAddSubtopic} disabled={uploading}>
                                <Text style={styles.saveBtnText}>{uploading ? 'Adding...' : 'Add'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fcf9f2' },
    header: { paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerIconButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 1 } },
    headerTitle: { color: '#1e293b', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    headerSubtitle: { color: '#475569', fontSize: 12, marginTop: 4, fontWeight: '500' },
    list: { padding: 20, paddingBottom: 40 },
    topicCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    topicHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    topicName: { fontSize: 17, fontWeight: '900', color: '#1e293b' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    actionIcon: { padding: 4 },
    subtopicsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    subtopicBadge: { backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    subtopicText: { fontSize: 12, color: '#475569', fontWeight: '500' },
    noSubtopics: { fontSize: 12, color: '#64748b', fontStyle: 'italic', paddingLeft: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
    modalContent: { backgroundColor: '#ffffff', borderRadius: 32, padding: 32, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20 },
    modalTitle: { fontSize: 22, fontWeight: '900', color: '#1e293b', marginBottom: 24, letterSpacing: 0.5 },
    input: { backgroundColor: '#ffffff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 30, color: '#1e293b', fontSize: 16 },
    modalBtns: { flexDirection: 'row', gap: 12 },
    modalBtn: { flex: 1, padding: 18, borderRadius: 16, alignItems: 'center' },
    cancelBtn: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
    cancelBtnText: { color: '#64748b', fontWeight: 'bold' },
    saveBtn: { backgroundColor: '#10b981' },
    saveBtnText: { color: '#fff', fontWeight: '900', textTransform: 'uppercase' },
    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#64748b', fontWeight: 'bold' },
    addIcon: { padding: 4 },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#10b981',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 6,
    },
    createBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    fileRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    fileBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingVertical: 12,
        gap: 8,
    },
    fileBtnSelected: {
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderColor: '#10b981',
    },
    fileBtnText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
    },
    fileBtnTextSelected: {
        color: '#10b981',
    },
    modalLabel: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    courseSelectionRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 30,
    },
    courseChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    courseChipActive: {
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderColor: '#10b981',
    },
    courseChipText: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: 'bold',
    },
    courseChipTextActive: {
        color: '#10b981',
    },
});
