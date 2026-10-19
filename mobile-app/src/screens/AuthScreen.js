import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Dimensions,
    StatusBar,
    Image,
    ScrollView,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../services/authService';
import { DESIGN_COLORS as C, DESIGN_TYPOGRAPHY as TY } from '../constants/designSystem';
import CustomAlert from '../components/CustomAlert';

const { width } = Dimensions.get('window');

export default function AuthScreen({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    // Google Mobile Number Collection State
    const [showMobileModal, setShowMobileModal] = useState(false);
    const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
    const [googleMobileInput, setGoogleMobileInput] = useState('');
    const [savingMobile, setSavingMobile] = useState(false);

    // Custom Alert State
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({
        type: 'error',
        title: '',
        message: '',
    });

    const showAlert = (title, message, type = 'error') => {
        setAlertConfig({ type, title, message });
        setAlertVisible(true);
    };

    const handleSuccessfulAuth = (userData) => {
        const userRole = userData?.role || 'customer';
        if (userRole === 'technician') {
            navigation.replace('TechnicianDashboard');
        } else {
            navigation.replace('Home');
        }
    };

    const handlePasswordAction = async () => {
        const cleanPhone = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '').trim();

        if (cleanPhone.length !== 10 && cleanPhone !== 'admin') {
            return showAlert('Invalid Number', 'Please enter a valid 10-digit mobile number', 'error');
        }

        if (password.length < 6) {
            return showAlert('Weak Password', 'Password must be at least 6 characters long', 'error');
        }

        if (isRegistering && !name.trim()) {
            return showAlert('Name Required', 'Please enter your full name', 'error');
        }

        setLoading(true);
        try {
            let result;
            if (isRegistering) {
                result = await authService.register({
                    mobile: cleanPhone,
                    password,
                    name: name.trim(),
                });
            } else {
                result = await authService.login(cleanPhone, password);
            }

            setLoading(false);
            if (result.success) {
                handleSuccessfulAuth(result.user);
            } else {
                showAlert(isRegistering ? 'Registration Failed' : 'Login Failed', result.error, 'error');
            }
        } catch (error) {
            setLoading(false);
            showAlert('Error', 'An unexpected error occurred. Please try again.', 'error');
        }
    };

    const handleGoogleAuth = async () => {
        setGoogleLoading(true);
        try {
            const result = await authService.googleLogin();
            setGoogleLoading(false);

            if (result.cancelled) {
                return;
            }

            if (result.success) {
                // If Google user does not have a mobile number linked yet, prompt for mobile number
                if (!result.user?.mobile) {
                    setPendingGoogleUser(result.user);
                    setGoogleMobileInput('');
                    setShowMobileModal(true);
                } else {
                    handleSuccessfulAuth(result.user);
                }
            } else {
                showAlert('Google Sign-In', result.error || 'Failed to authenticate with Google.', 'error');
            }
        } catch (error) {
            setGoogleLoading(false);
            showAlert('Google Sign-In Error', 'Unable to complete Google Sign-In.', 'error');
        }
    };

    const handleSaveGoogleMobile = async () => {
        const cleanPhone = googleMobileInput.replace(/^\+91/, '').replace(/\D/g, '').trim();
        if (cleanPhone.length !== 10) {
            return showAlert('Invalid Number', 'Please enter a valid 10-digit mobile number', 'error');
        }

        setSavingMobile(true);
        try {
            const userId = pendingGoogleUser?._id || pendingGoogleUser?.id;
            const updateRes = await authService.updateProfile({
                userId,
                mobile: cleanPhone,
            });
            setSavingMobile(false);

            if (updateRes.success) {
                setShowMobileModal(false);
                handleSuccessfulAuth(updateRes.user || { ...pendingGoogleUser, mobile: cleanPhone });
            } else {
                showAlert('Link Mobile Failed', updateRes.message || updateRes.error || 'Failed to save mobile number.', 'error');
            }
        } catch (e) {
            setSavingMobile(false);
            showAlert('Error', 'Unable to save mobile number. Please try again.', 'error');
        }
    };

    const handleSkipGoogleMobile = () => {
        setShowMobileModal(false);
        handleSuccessfulAuth(pendingGoogleUser);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={C.background} />

            {/* Subtle background glow */}
            <View style={styles.bgGlow} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.innerContainer}>
                        {/* Header Section */}
                        <View style={styles.header}>
                            <View style={styles.logoCircle}>
                                <Image
                                    source={require('../../assets/logo.png')}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.brandTitle}>ZYRO</Text>

                            <View style={styles.welcomeContainer}>
                                <Text style={styles.title}>
                                    {isRegistering ? 'Create Account' : 'Welcome Back'}
                                </Text>
                                <View style={styles.accentLine} />
                            </View>

                            <Text style={styles.subtitle}>
                                {isRegistering
                                    ? 'Sign up to book premium AC services'
                                    : 'Log in to manage your bookings and services'}
                            </Text>
                        </View>

                        {/* Official Native Google Provider Button */}
                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={handleGoogleAuth}
                            activeOpacity={0.85}
                            disabled={googleLoading || loading}
                        >
                            {googleLoading ? (
                                <ActivityIndicator color={C.onSurface} size="small" />
                            ) : (
                                <View style={styles.googleContent}>
                                    <Ionicons name="logo-google" size={20} color="#EA4335" style={styles.googleIcon} />
                                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Auth Mode Switcher */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, !isRegistering && styles.activeTab]}
                                onPress={() => setIsRegistering(false)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.tabText, !isRegistering && styles.activeTabText]}>
                                    Login
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, isRegistering && styles.activeTab]}
                                onPress={() => setIsRegistering(true)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.tabText, isRegistering && styles.activeTabText]}>
                                    Register
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Form Section */}
                        <View style={styles.formContainer}>
                            {isRegistering && (
                                <View style={styles.inputGroup}>
                                    <View style={styles.inputLabelRow}>
                                        <Ionicons name="person-outline" size={18} color={C.primary} style={styles.fieldIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Full Name"
                                            placeholderTextColor={C.outline + '99'}
                                            value={name}
                                            onChangeText={setName}
                                            autoCapitalize="words"
                                        />
                                    </View>
                                </View>
                            )}

                            {/* Mobile Number */}
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <Ionicons name="call-outline" size={18} color={C.primary} style={styles.fieldIcon} />
                                    <View style={styles.countryCode}>
                                        <Text style={styles.countryCodeText}>+91</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Mobile Number"
                                        placeholderTextColor={C.outline + '99'}
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                    />
                                </View>
                            </View>

                            {/* Password */}
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <Ionicons name="lock-closed-outline" size={18} color={C.primary} style={styles.fieldIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Password (min. 6 characters)"
                                        placeholderTextColor={C.outline + '99'}
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeButton}
                                        onPress={() => setShowPassword(!showPassword)}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons
                                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                            size={20}
                                            color={C.outline}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={styles.primaryButtonContainer}
                                activeOpacity={0.85}
                                onPress={handlePasswordAction}
                                disabled={loading || googleLoading}
                            >
                                <LinearGradient
                                    colors={[C.primary, C.primaryContainer]}
                                    style={styles.primaryButton}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                >
                                    {loading ? (
                                        <ActivityIndicator color={C.onPrimary} />
                                    ) : (
                                        <View style={styles.btnContent}>
                                            <Text style={styles.primaryButtonText}>
                                                {isRegistering ? 'CREATE ACCOUNT' : 'LOGIN'}
                                            </Text>
                                            <Ionicons name="arrow-forward" size={18} color={C.onPrimary} style={styles.arrowIcon} />
                                        </View>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Switch Mode Footer */}
                            <TouchableOpacity
                                style={styles.footerLink}
                                onPress={() => setIsRegistering(!isRegistering)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.footerLinkText}>
                                    {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
                                    <Text style={styles.footerLinkBold}>
                                        {isRegistering ? 'Login' : 'Register now'}
                                    </Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modal for Google Sign-In: Link Mobile Number */}
            <Modal
                visible={showMobileModal}
                transparent
                animationType="fade"
                onRequestClose={handleSkipGoogleMobile}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalIconCircle}>
                                <Ionicons name="call" size={26} color={C.primary} />
                            </View>
                            <Text style={styles.modalTitle}>Link Mobile Number</Text>
                            <Text style={styles.modalSubtitle}>
                                Enter your mobile number to receive technician arrival alerts and service OTPs.
                            </Text>
                        </View>

                        <View style={styles.modalInputGroup}>
                            <View style={styles.countryCode}>
                                <Text style={styles.countryCodeText}>+91</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="10-digit mobile number"
                                placeholderTextColor={C.outline + '99'}
                                keyboardType="phone-pad"
                                maxLength={10}
                                value={googleMobileInput}
                                onChangeText={setGoogleMobileInput}
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.primaryButtonContainer}
                            activeOpacity={0.85}
                            onPress={handleSaveGoogleMobile}
                            disabled={savingMobile}
                        >
                            <LinearGradient
                                colors={[C.primary, C.primaryContainer]}
                                style={styles.primaryButton}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            >
                                {savingMobile ? (
                                    <ActivityIndicator color={C.onPrimary} />
                                ) : (
                                    <Text style={styles.primaryButtonText}>SAVE & CONTINUE</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalSkipButton}
                            onPress={handleSkipGoogleMobile}
                            activeOpacity={0.7}
                            disabled={savingMobile}
                        >
                            <Text style={styles.modalSkipText}>Skip for now</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <CustomAlert
                visible={alertVisible}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={() => setAlertVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.background,
    },
    bgGlow: {
        position: 'absolute',
        top: -width * 0.4,
        alignSelf: 'center',
        width: width * 1.5,
        height: width * 1.5,
        borderRadius: width * 0.75,
        backgroundColor: C.primary + '06',
        zIndex: 0,
    },
    flex: {
        flex: 1,
        zIndex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingVertical: 24,
    },
    innerContainer: {
        paddingHorizontal: 28,
        width: '100%',
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: C.surfaceContainerLow,
        borderWidth: 1,
        borderColor: C.outlineVariant,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    logo: {
        width: '60%',
        height: '60%',
    },
    brandTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: C.primary,
        letterSpacing: 6,
        marginBottom: 16,
    },
    welcomeContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        ...TY.headlineLgMobile,
        color: C.onSurface,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    accentLine: {
        width: 40,
        height: 3,
        backgroundColor: C.primary,
        marginTop: 6,
        borderRadius: 1.5,
    },
    subtitle: {
        ...TY.bodyMd,
        color: C.outline,
        fontWeight: '400',
        textAlign: 'center',
        marginTop: 4,
        paddingHorizontal: 16,
    },
    googleButton: {
        height: 52,
        borderRadius: 26,
        backgroundColor: C.surfaceContainerLowest,
        borderWidth: 1,
        borderColor: C.outlineVariant,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    googleContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    googleIcon: {
        marginRight: 4,
    },
    googleButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: C.onSurface,
        letterSpacing: 0.3,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: C.outlineVariant + '66',
    },
    dividerText: {
        paddingHorizontal: 16,
        fontSize: 12,
        fontWeight: '700',
        color: C.outline,
        letterSpacing: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: C.surfaceContainerLow,
        borderRadius: 16,
        padding: 4,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: C.outlineVariant,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: C.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: C.outline,
    },
    activeTabText: {
        color: C.onPrimary,
    },
    formContainer: {
        width: '100%',
    },
    inputGroup: {
        backgroundColor: C.surfaceContainerLowest,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.outlineVariant,
        paddingHorizontal: 14,
        marginBottom: 16,
    },
    inputLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 52,
    },
    fieldIcon: {
        marginRight: 10,
    },
    countryCode: {
        marginRight: 10,
        borderRightWidth: 1,
        borderColor: C.outlineVariant,
        paddingRight: 10,
    },
    countryCodeText: {
        fontSize: 15,
        fontWeight: '700',
        color: C.onSurface,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: C.onSurface,
        fontWeight: '500',
        paddingVertical: 0,
    },
    eyeButton: {
        paddingHorizontal: 6,
    },
    primaryButtonContainer: {
        borderRadius: 26,
        overflow: 'hidden',
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
        marginTop: 8,
    },
    primaryButton: {
        height: 54,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    primaryButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: C.onPrimary,
        letterSpacing: 2,
    },
    arrowIcon: {
        marginTop: -1,
    },
    footerLink: {
        marginTop: 24,
        alignItems: 'center',
    },
    footerLinkText: {
        fontSize: 13,
        color: C.outline,
        letterSpacing: 0.3,
    },
    footerLinkBold: {
        fontWeight: '700',
        color: C.primary,
        textDecorationLine: 'underline',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalCard: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: C.surface,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: C.outlineVariant,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    modalIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: C.primary + '18',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: C.onSurface,
        textAlign: 'center',
        marginBottom: 6,
    },
    modalSubtitle: {
        fontSize: 13,
        color: C.outline,
        textAlign: 'center',
        lineHeight: 18,
    },
    modalInputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 54,
        backgroundColor: C.surfaceVariant,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.outlineVariant,
        paddingHorizontal: 14,
        marginBottom: 16,
    },
    modalSkipButton: {
        marginTop: 16,
        alignItems: 'center',
        paddingVertical: 8,
    },
    modalSkipText: {
        fontSize: 14,
        fontWeight: '600',
        color: C.outline,
    },
});
