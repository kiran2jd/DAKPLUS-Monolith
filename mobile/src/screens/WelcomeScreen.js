import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import logo from '../../assets/logo.png';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen({ navigation }) {
    React.useEffect(() => {
        console.log('WelcomeScreen mounted');
    }, []);
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <LinearGradient
                colors={['#fcf9f2', '#fcf9f2', '#fcf9f2']}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
            />
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Image source={logo} style={styles.logoImage} resizeMode="contain" />
                    <Text style={[styles.logoText, { paddingLeft: 4 }]}>DAK Plus</Text>
                    <View style={styles.logoUnderline} />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>Elite Preparation for Postal Exams</Text>
                    <Text style={styles.description}>
                        Master your assessments with AI-powered mock tests,
                        comprehensive syllabus tracking, and real-time performance analytics.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => {
                            console.log('Get Started pressed');
                            navigation.navigate('Login');
                        }}
                    >
                        <Text style={styles.buttonText}>Get Started</Text>
                    </TouchableOpacity>
                    <Text style={styles.footerNote}>Trusted by 10,000+ Students</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 30,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoContainer: {
        marginTop: 60,
        alignItems: 'center',
    },
    logoImage: {
        width: 200,
        height: 80,
        marginBottom: 10,
    },
    logoText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#1e293b',
        letterSpacing: 4,
    },
    logoUnderline: {
        width: 60,
        height: 4,
        backgroundColor: '#fbbf24',
        marginTop: 5,
        borderRadius: 2,
    },
    textContainer: {
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'center',
        marginBottom: 15,
        lineHeight: 36,
    },
    description: {
        fontSize: 16,
        color: '#475569',
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#dc2626',
        width: '100%',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerNote: {
        color: '#64748b',
        fontSize: 12,
        marginTop: 20,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
