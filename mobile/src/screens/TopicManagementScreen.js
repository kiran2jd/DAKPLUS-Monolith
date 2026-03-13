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
    const [newTopic, setNewTopic] = useState({ name: '', imageFile: null, pdfFile: null });
    const [newSubtopic, setNewSubtopic] = useState({ name: '', imageFile: null, pdfFile: null });
    const [editingTopic, setEditingTopic] = useState(null);
    const [editingSubtopic, setEditingSubtopic] = useState(null);
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

    const pickFile = async (type, isSubtopic = false) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: type === 'image' ? 'image/*' : 'application/pdf',
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                if (isSubtopic) {
                    if (editingSubtopic) {
                        setEditingSubtopic(prev => ({ ...prev, [type + 'File']: asset }));
                    } else {
                        setNewSubtopic(prev => ({ ...prev, [type + 'File']: asset }));
                    }
                } else {
                    if (editingTopic) {
                        setEditingTopic(prev => ({ ...prev, [type + 'File']: asset }));
                    } else {
                        setNewTopic(prev => ({ ...prev, [type + 'File']: asset }));
                    }
                }
            }
        } catch (err) {
            Alert.alert('Error', 'Failed to pick file');
        }
    };

    const handleAddTopic = async () => {
        const topicObj = editingTopic || newTopic;
        if (!topicObj.name?.trim()) return;
        setUploading(true);
        try {
            const topicData = { 
                name: topicObj.name,
                imageUrl: editingTopic?.imageUrl || null,
                pdfUrl: editingTopic?.pdfUrl || null
            };
            
            if (topicObj.imageFile) {
                const imgRes = await topicService.uploadSyllabusFile(topicObj.imageFile.uri, topicObj.imageFile.name, topicObj.imageFile.mimeType);
                topicData.imageUrl = imgRes.url;
            }
            if (topicObj.pdfFile) {
                const pdfRes = await topicService.uploadSyllabusFile(topicObj.pdfFile.uri, topicObj.pdfFile.name, topicObj.pdfFile.mimeType);
                topicData.pdfUrl = pdfRes.url;
            }

            if (editingTopic) {
                const updated = await topicService.updateTopic(editingTopic.id, topicData);
                setTopics(topics.map(t => t.id === updated.id ? updated : t));
                setEditingTopic(null);
                Alert.alert('Success', 'Topic updated');
            } else {
                const created = await topicService.createTopic(topicData);
                setTopics([...topics, created]);
                setNewTopic({ name: '', imageFile: null, pdfFile: null });
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
                topicId: selectedTopic.id,
                imageUrl: editingSubtopic?.imageUrl || null,
                pdfUrl: editingSubtopic?.pdfUrl || null
            };

            if (subObj.imageFile) {
                const imgRes = await topicService.uploadSyllabusFile(subObj.imageFile.uri, subObj.imageFile.name, subObj.imageFile.mimeType);
                subData.imageUrl = imgRes.url;
            }
            if (subObj.pdfFile) {
                const pdfRes = await topicService.uploadSyllabusFile(subObj.pdfFile.uri, subObj.pdfFile.name, subObj.pdfFile.mimeType);
                subData.pdfUrl = pdfRes.url;
            }

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
                setNewSubtopic({ name: '', imageFile: null, pdfFile: null });
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
                    {(item.imageUrl || item.pdfUrl) && (
                        <View style={{ flexDirection: 'row', marginTop: 4, gap: 8 }}>
                            {item.imageUrl && <Ionicons name="image" size={12} color="#10b981" />}
                            {item.pdfUrl && <Ionicons name="document-text" size={12} color="#ef4444" />}
                        </View>
                    )}
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => {
                            setEditingTopic(item);
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
                        {sub.pdfUrl && <Ionicons name="document-text" size={10} color="#ef4444" style={{ marginLeft: 4 }} />}
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <Text style={styles.headerSubtitle}>Map your curriculum topics and modules</Text>
                    <TouchableOpacity 
                        style={styles.createBtn}
                        onPress={() => setModalVisible(true)}
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
                        
                        <View style={styles.fileRow}>
                            <TouchableOpacity 
                                style={[styles.fileBtn, (newTopic.imageFile || editingTopic?.imageFile) && styles.fileBtnSelected]} 
                                onPress={() => pickFile('image')}
                            >
                                <Ionicons name="image" size={18} color={(newTopic.imageFile || editingTopic?.imageFile) ? '#10b981' : '#94a3b8'} />
                                <Text style={[styles.fileBtnText, (newTopic.imageFile || editingTopic?.imageFile) && styles.fileBtnTextSelected]}>
                                    {(newTopic.imageFile || editingTopic?.imageFile) ? 'Image Picked' : 'Add Image'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.fileBtn, (newTopic.pdfFile || editingTopic?.pdfFile) && styles.fileBtnSelected]} 
                                onPress={() => pickFile('pdf')}
                            >
                                <Ionicons name="document-text" size={18} color={(newTopic.pdfFile || editingTopic?.pdfFile) ? '#10b981' : '#94a3b8'} />
                                <Text style={[styles.fileBtnText, (newTopic.pdfFile || editingTopic?.pdfFile) && styles.fileBtnTextSelected]}>
                                    {(newTopic.pdfFile || editingTopic?.pdfFile) ? 'PDF Picked' : 'Add PDF'}
                                </Text>
                            </TouchableOpacity>
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

                        <View style={styles.fileRow}>
                            <TouchableOpacity 
                                style={[styles.fileBtn, (newSubtopic.imageFile || editingSubtopic?.imageFile) && styles.fileBtnSelected]} 
                                onPress={() => pickFile('image', true)}
                            >
                                <Ionicons name="image" size={18} color={(newSubtopic.imageFile || editingSubtopic?.imageFile) ? '#10b981' : '#94a3b8'} />
                                <Text style={[styles.fileBtnText, (newSubtopic.imageFile || editingSubtopic?.imageFile) && styles.fileBtnTextSelected]}>
                                    {(newSubtopic.imageFile || editingSubtopic?.imageFile) ? 'Image Picked' : 'Add Image'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.fileBtn, (newSubtopic.pdfFile || editingSubtopic?.pdfFile) && styles.fileBtnSelected]} 
                                onPress={() => pickFile('pdf', true)}
                            >
                                <Ionicons name="document-text" size={18} color={(newSubtopic.pdfFile || editingSubtopic?.pdfFile) ? '#10b981' : '#94a3b8'} />
                                <Text style={[styles.fileBtnText, (newSubtopic.pdfFile || editingSubtopic?.pdfFile) && styles.fileBtnTextSelected]}>
                                    {(newSubtopic.pdfFile || editingSubtopic?.pdfFile) ? 'PDF Picked' : 'Add PDF'}
                                </Text>
                            </TouchableOpacity>
                        </View>

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
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    actionIcon: { padding: 4 },
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
});
