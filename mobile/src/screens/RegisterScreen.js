import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Modal,
    FlatList,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/auth';

export default function RegisterScreen({ navigation, route }) {
    const { phoneNumber, identifier } = route.params || {};
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState(phoneNumber || (identifier && !identifier.includes('@') ? identifier : ''));
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [postalCircle, setPostalCircle] = useState('');
    const [division, setDivision] = useState('');
    const [office, setOffice] = useState('');
    const [cadre, setCadre] = useState('');
    const [examType, setExamType] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentField, setCurrentField] = useState(''); // 'circle', 'cadre', 'exam'
    const [searchQuery, setSearchQuery] = useState('');

    const idleTimeout = React.useRef(null);

    const clearForm = () => {
        setFullName('');
        setEmail('');
        setPassword('');
        setPhone('');
        setPostalCircle('');
        setDivision('');
        setOffice('');
        setCadre('');
        setExamType('');
        Keyboard.dismiss();
    };

    const resetIdleTimer = () => {
        if (idleTimeout.current) clearTimeout(idleTimeout.current);
        idleTimeout.current = setTimeout(() => {
            clearForm();
            Alert.alert('Session Reset', 'Registration form cleared due to inactivity.');
        }, 300000); // 5 minutes
    };

    // Handle navigation clearing
    React.useEffect(() => {
        const unsubscribe = navigation.addListener('blur', () => {
            clearForm();
        });
        const unsubscribeFocus = navigation.addListener('focus', () => {
            resetIdleTimer();
        });
        return () => {
            unsubscribe();
            unsubscribeFocus();
            if (idleTimeout.current) clearTimeout(idleTimeout.current);
        };
    }, [navigation]);

    const handleInteraction = () => resetIdleTimer();

    // Clear state on mount (but keep pre-filled data)
    React.useEffect(() => {
        // Initial setup only, clearForm handles hygiene
        if (identifier && identifier.includes('@')) {
            setEmail(identifier);
        }
    }, []);

    const handleRegister = async () => {
        if (!fullName || !email || !password || !phone) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (fullName.trim().length < 3) {
            Alert.alert('Error', 'Full Name must be at least 3 characters long');
            return;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return;
        }

        const phoneRegex = /^\d{10,15}$/;
        const cleanPhone = phone.replace(/[\s-]/g, '');
        if (!phoneRegex.test(cleanPhone)) {
            Alert.alert('Error', 'Phone number must be between 10 and 15 digits');
            return;
        }

        setLoading(true);
        try {
            await authService.register({
                fullName,
                email,
                phoneNumber: phone.replace(/[^0-9]/g, ''),
                role: 'STUDENT',
                password,
                notificationsEnabled,
                postalCircle,
                division,
                office,
                cadre,
                examType
            });
            navigation.replace('Main');
        } catch (err) {
            console.error("Registration UI error:", err);
            const errorMsg = err.response?.data?.message || err.message || 'Something went wrong';
            const diagnosticInfo = `URL: ${err.config?.url || 'Unknown'}\nStatus: ${err.response?.status || 'No Response'}`;
            Alert.alert(
                'Registration Failed',
                `${errorMsg}\n\nPlease check your internet connection/mobile data or try a VPN if on restricted networks.\n\nTechnical Details:\n${diagnosticInfo}`
            );
        } finally {
            setLoading(false);
        }
    };

    const openPicker = (field) => {
        setCurrentField(field);
        setSearchQuery('');
        setModalVisible(true);
    };

    const handleSelect = (item) => {
        if (currentField === 'circle') setPostalCircle(item);
        else if (currentField === 'cadre') setCadre(item);
        else if (currentField === 'exam') setExamType(item);
        setModalVisible(false);
    };

    const getItems = () => {
        let baseItems = [];
        if (currentField === 'circle') baseItems = circles;
        else if (currentField === 'cadre') baseItems = cadres;
        else if (currentField === 'exam') baseItems = exams;

        return baseItems.filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()));
    };

    const SelectionModal = () => (
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select {currentField === 'circle' ? 'Postal Circle' : currentField === 'cadre' ? 'Cadre' : 'Target Exam'}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={28} color="#1e293b" />
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />

                    <FlatList
                        data={getItems()}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.modalItem} onPress={() => handleSelect(item)}>
                                <Text style={styles.modalItemText}>{item}</Text>
                                {(currentField === 'circle' && postalCircle === item) ||
                                    (currentField === 'cadre' && cadre === item) ||
                                    (currentField === 'exam' && examType === item) ? (
                                    <Ionicons name="checkmark-circle" size={20} color="#dc2626" />
                                ) : null}
                            </TouchableOpacity>
                        )}
                        ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
                    />
                </View>
            </View>
        </Modal>
    );

    return (
        <TouchableWithoutFeedback onPress={handleInteraction}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Welcome to DAK Plus</Text>
                        <Text style={styles.subtitle}>Complete your profile to get started</Text>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#999"
                                    value={fullName}
                                    onChangeText={(text) => {
                                        setFullName(text);
                                        handleInteraction();
                                    }}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="email@example.com"
                                    placeholderTextColor="#999"
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        handleInteraction();
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Phone Number</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="+91 00000 00000"
                                    placeholderTextColor="#999"
                                    value={phone}
                                    onChangeText={(text) => {
                                        setPhone(text.replace(/[^0-9]/g, ''));
                                        handleInteraction();
                                    }}
                                    keyboardType="phone-pad"
                                    maxLength={15}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Create Password</Text>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Minimum 6 characters"
                                        placeholderTextColor="#999"
                                        value={password}
                                        onChangeText={(text) => {
                                            setPassword(text);
                                            handleInteraction();
                                        }}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                        <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#64748b" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setNotificationsEnabled(!notificationsEnabled)}
                            >
                                <View style={[styles.checkbox, notificationsEnabled && styles.checkboxChecked]}>
                                    {notificationsEnabled && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <Text style={styles.checkboxLabel}>I want to receive exam updates and study tips</Text>
                            </TouchableOpacity>

                            {/* Professional Details Section */}
                            <View style={styles.divider} />
                            <Text style={styles.sectionTitle}>Professional Details</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Postal Circle</Text>
                                <TouchableOpacity style={styles.selector} onPress={() => openPicker('circle')}>
                                    <Text style={[styles.selectorText, !postalCircle && styles.placeholder]}>
                                        {postalCircle || "Select Postal Circle"}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Division</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter Division"
                                    placeholderTextColor="#999"
                                    value={division}
                                    onChangeText={setDivision}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Office</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter Office Name"
                                    placeholderTextColor="#999"
                                    value={office}
                                    onChangeText={setOffice}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Cadre</Text>
                                <TouchableOpacity style={styles.selector} onPress={() => openPicker('cadre')}>
                                    <Text style={[styles.selectorText, !cadre && styles.placeholder]}>
                                        {cadre || "Select Cadre"}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Target Exam</Text>
                                <TouchableOpacity style={styles.selector} onPress={() => openPicker('exam')}>
                                    <Text style={[styles.selectorText, !examType && styles.placeholder]}>
                                        {examType || "Select Target Exam"}
                                    </Text>
                                    <Ionicons name="chevron-down" size={20} color="#64748b" />
                                </TouchableOpacity>
                            </View>

                            <SelectionModal />

                            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Start Learning Now</Text>}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={clearForm} style={styles.clearBtn}>
                                <Text style={styles.clearBtnText}>Clear Form</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.secondaryButton}>
                                <Text style={styles.secondaryButtonText}>Already have an account? Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#dc2626',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 5,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    form: {
        gap: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        color: '#475569',
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 14,
        color: '#1e293b',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    disabledInput: {
        opacity: 0.6,
        backgroundColor: '#f1f5f9',
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    roleButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        backgroundColor: '#f8fafc',
    },
    activeRole: {
        borderColor: '#dc2626',
        backgroundColor: '#dc262610',
    },
    roleText: {
        color: '#64748b',
        fontWeight: '600',
    },
    activeRoleText: {
        color: '#dc2626',
    },
    button: {
        backgroundColor: '#dc2626',
        borderRadius: 14,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        alignItems: 'center',
        marginTop: 12,
    },
    secondaryButtonText: {
        color: '#64748b',
        fontSize: 14,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
        gap: 10,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#dc2626',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#dc2626',
    },
    checkmark: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    checkboxLabel: {
        flex: 1,
        fontSize: 14,
        color: '#475569',
    },
    pickerContainer: {
        marginBottom: 10,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    chipSelected: {
        backgroundColor: '#dc2626',
        borderColor: '#dc2626',
    },
    chipText: {
        fontSize: 13,
        color: '#64748b',
    },
    chipTextSelected: {
        color: '#fff',
        fontWeight: 'bold',
    },
    selector: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    selectorText: {
        fontSize: 16,
        color: '#1e293b',
    },
    placeholder: {
        color: '#999',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '80%',
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    searchInput: {
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#1e293b',
        marginBottom: 20,
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
    },
    modalItemText: {
        fontSize: 16,
        color: '#475569',
    },
    modalSeparator: {
        height: 1,
        backgroundColor: '#f1f5f9',
    },
    clearBtn: {
        padding: 12,
        alignItems: 'center',
    },
    clearBtnText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '600',
    },
});
