import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    SafeAreaView,
    Alert,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { authService } from '../services/auth';

const SideMenu = (props) => {
    const { navigation, state } = props;
    const activeRouteName = state?.routeNames && state?.index !== undefined ? state.routeNames[state.index] : null;
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const userData = await authService.getUser();
            setUser(userData);
        } catch (error) {
            console.error("Error loading user in SideMenu:", error);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await authService.logout();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    }
                }
            ]
        );
    };

    // ROBUST ROLE DETECTION (Case-Insensitive)
    const role = user?.role?.toUpperCase() || 'STUDENT';
    const isStaff = role === 'TEACHER' || role === 'ADMIN';

    const menuItems = [
        { label: 'Dashboard', icon: 'grid-outline', route: 'Home' },
        { label: 'My Learning', icon: 'book-open-outline', route: 'Tests' },
        { label: 'Performance', icon: 'analytics-outline', route: 'Performance' },
        ...(isStaff ? [
            { label: 'Manage Tests', icon: 'layers-outline', route: 'ManageTests' },
            { label: 'Topic Matrix', icon: 'apps-outline', route: 'TopicManagement' }
        ] : []),
        { label: 'My Purchases', icon: 'card-outline', route: 'MyPurchases' },
        { label: 'Support Center', icon: 'help-circle-outline', route: 'Help' },
    ];

    const handleNavigation = (route) => {
        if (['Home', 'Tests', 'Performance', 'Help', 'Syllabus'].includes(route)) {
            navigation.navigate('Tabs', { screen: route });
        } else {
            navigation.navigate(route);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.gradientBg}
            />

            {/* User Profile Header */}
            <View style={styles.header}>
                <View style={styles.profileImageContainer}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={styles.profileImage}
                        resizeMode="contain"
                    />
                    <View style={styles.onlineStatus} />
                </View>
                <Text style={styles.userName}>{user?.fullName || 'Dakplus Aspirant'}</Text>
                <Text style={styles.userRole}>{role === 'STUDENT' ? 'DAKPLUS ASPIRANT' : role}</Text>
            </View>

            <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionTitle}>EXPLORE DAKPLUS</Text>
                {menuItems.map((item) => (
                    <TouchableOpacity
                        key={item.label}
                        style={[
                            styles.menuItem,
                            activeRouteName === item.route && styles.activeMenuItem
                        ]}
                        onPress={() => handleNavigation(item.route)}
                        activeOpacity={0.7}
                    >
                        {activeRouteName === item.route && (
                            <LinearGradient
                                colors={['#dc2626', '#f97316']}
                                start={{ x: 0, y: 0.5 }}
                                end={{ x: 1, y: 0.5 }}
                                style={styles.activeIndicator}
                            />
                        )}
                        <Ionicons
                            name={item.icon}
                            size={22}
                            color={activeRouteName === item.route ? '#fff' : '#94a3b8'}
                            style={styles.menuIcon}
                        />
                        <Text style={[
                            styles.menuLabel,
                            activeRouteName === item.route && styles.activeMenuLabel
                        ]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={styles.logoutBtn} 
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>SYSTEM BUILD v5.0.0</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    gradientBg: {
        ...StyleSheet.absoluteFillObject,
    },
    header: {
        padding: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    profileImage: {
        width: 130,
        height: 40,
    },
    onlineStatus: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#22c55e',
        borderWidth: 2,
        borderColor: '#0f172a',
    },
    userName: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 0.5,
        textAlign: 'center'
    },
    userRole: {
        fontSize: 12,
        color: '#38bdf8',
        fontWeight: 'bold',
        marginTop: 4,
    },
    menuList: {
        flex: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#475569',
        letterSpacing: 1.5,
        marginBottom: 12,
        marginLeft: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 4,
        position: 'relative',
    },
    activeMenuItem: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    activeIndicator: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },
    menuIcon: {
        width: 24,
        marginRight: 12,
    },
    menuLabel: {
        fontSize: 15,
        color: '#94a3b8',
        fontWeight: '600',
    },
    activeMenuLabel: {
        color: '#fff',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    logoutText: {
        marginLeft: 8,
        color: '#ef4444',
        fontWeight: '700',
        fontSize: 15,
    },
    versionText: {
        textAlign: 'center',
        color: '#475569',
        fontSize: 10,
        marginTop: 15,
        fontWeight: '600',
    }
});

export default SideMenu;
