import React, { useState, useRef } from 'react';
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
    Alert,
    StatusBar,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../services/authService';
import { DESIGN_COLORS as C, DESIGN_TYPOGRAPHY as TY } from '../constants/designSystem';
import CustomAlert from '../components/CustomAlert';

const { width, height } = Dimensions.get('window');

export default function AuthScreen({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [role, setRole] = useState('customer');

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

    // OTP state
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [confirmation, setConfirmation] = useState(null);
    const otpInputs = useRef([]);

    const handleOtpChange = (value, index) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            otpInputs.current[index + 1].focus();
        }
    };

    const handleVerifyOtp = async () => {
        const otpCode = otp.join('');
        if (otpCode.length < 6) {
            showAlert('Invalid OTP', 'Please enter the 6-digit code', 'error');
            return;
        }
        setLoading(true);
        try {
            const result = await authService.verifyOTP(
                confirmation,
                otpCode,
                isRegistering ? name : null,
                isRegistering ? role : null
            );

            if (result.success) {
                setLoading(false);
                const userRole = result.user?.role || role;
                navigation.replace(userRole === 'technician' ? 'TechnicianDashboard' : 'Home');
            } else {
                setLoading(false);
                showAlert('Verification Failed', result.error || 'Incorrect or expired OTP.', 'error');
            }
        } catch (error) {
            setLoading(false);
            showAlert('Error', 'OTP Verification failed.', 'error');
        }
    };

    const handlePasswordAction = async () => {
        if (phoneNumber.length < 10) return showAlert('Invalid Number', 'Enter 10-digit mobile number', 'error');
        if (password.length < 6) return showAlert('Weak Password', 'Password must be at least 6 characters', 'error');

        setLoading(true);
        try {
            let result;
            if (isRegistering) {
                if (!name) { setLoading(false); return showAlert('Name Required', 'Please enter your name', 'error'); }
                result = await authService.register({ mobile: phoneNumber, password, name, role });
            } else {
                result = await authService.login(phoneNumber, password);
            }

            if (result.success) {
                setLoading(false);
                const userRole = result.user?.role || role;
                navigation.replace(userRole === 'technician' ? 'TechnicianDashboard' : 'Home');
            } else {
                setLoading(false);
                showAlert('Auth Error', result.error, 'error');
            }
        } catch (error) {
            setLoading(false);
            showAlert('Error', 'Something went wrong.', 'error');
        }
    };

    const renderRoleSelector = () => (
        <View style={styles.roleContainer}>
            <TouchableOpacity
                style={[styles.roleOption, role === 'customer' && styles.roleOptionActive]}
                onPress={() => setRole('customer')}
                activeOpacity={0.85}
            >
                <Ionicons name="people" size={18} color={role === 'customer' ? C.onPrimary : C.primary} />
                <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.roleOption, role === 'technician' && styles.roleOptionActive]}
                onPress={() => setRole('technician')}
                activeOpacity={0.85}
            >
                <Ionicons name="construct" size={18} color={role === 'technician' ? C.onPrimary : C.primary} />
                <Text style={[styles.roleText, role === 'technician' && styles.roleTextActive]}>Technician</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={C.background} />
            
            {/* Subtle background glow */}
            <View style={styles.bgGlow} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
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
                                {isOtpSent ? 'Verify' : (isRegistering ? 'Create Account' : 'Welcome Back')}
                            </Text>
                            <View style={styles.accentLine} />
                        </View>

                        <Text style={styles.subtitle}>
                            {isOtpSent 
                                ? `Code sent to +91 ${phoneNumber}` 
                                : `Experience premium service with Zyro`}
                        </Text>
                    </View>

                    {/* Form Section */}
                    {!isOtpSent ? (
                        <View style={styles.formContainer}>
                            {isRegistering && (
                                <>
                                    {/* Full Name */}
                                    <View style={styles.inputGroup}>
                                        <View style={styles.inputLabelRow}>
                                            <Ionicons name="person-outline" size={16} color={C.outline} style={styles.fieldIcon} />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Full Name"
                                                placeholderTextColor={C.outline + '88'}
                                                value={name}
                                                onChangeText={setName}
                                                autoFocus={isRegistering}
                                            />
                                        </View>
                                    </View>

                                    {/* Role Selection */}
                                    <View style={[styles.inputGroup, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                                        <Text style={styles.roleLabel}>Register as</Text>
                                        {renderRoleSelector()}
                                    </View>
                                </>
                            )}

                            {/* Mobile Number */}
                            <View style={styles.inputGroup}>
                                <View style={styles.inputLabelRow}>
                                    <Ionicons name="mail-outline" size={16} color={C.outline} style={styles.fieldIcon} />
                                    <View style={styles.countryCode}>
                                        <Text style={styles.countryCodeText}>+91</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Mobile Number"
                                        placeholderTextColor={C.outline + '88'}
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
                                    <Ionicons name="lock-closed-outline" size={16} color={C.outline} style={styles.fieldIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Password"
                                        placeholderTextColor={C.outline + '88'}
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
                                            name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                            size={18} 
                                            color={C.outline} 
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Forgot Password */}
                            {!isRegistering && (
                                <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
                                    <Text style={styles.forgotText}>Forgot Password?</Text>
                                </TouchableOpacity>
                            )}

                            {/* Action Button */}
                            <TouchableOpacity
                                style={styles.primaryButtonContainer}
                                activeOpacity={0.85}
                                onPress={handlePasswordAction}
                                disabled={loading}
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
                                                {isRegistering ? 'REGISTER' : 'LOGIN'}
                                            </Text>
                                            <Ionicons name="arrow-forward" size={18} color={C.onPrimary} style={styles.arrowIcon} />
                                        </View>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Toggle Footer */}
                            <TouchableOpacity
                                style={styles.footerLink}
                                onPress={() => setIsRegistering(!isRegistering)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.footerLinkText}>
                                    {isRegistering ? 'Already have an account? ' : 'New user? '}
                                    <Text style={styles.footerLinkBold}>
                                        {isRegistering ? 'Login' : 'Sign up as Customer'}
                                    </Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.formContainer}>
                            <View style={styles.otpWrapper}>
                                {otp.map((digit, idx) => (
                                    <TextInput
                                        key={idx}
                                        ref={el => otpInputs.current[idx] = el}
                                        style={styles.otpInput}
                                        maxLength={1}
                                        keyboardType="number-pad"
                                        value={digit}
                                        onChangeText={(v) => handleOtpChange(v, idx)}
                                        placeholder="0"
                                        placeholderTextColor={C.outlineVariant}
                                    />
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.primaryButtonContainer}
                                activeOpacity={0.85}
                                onPress={handleVerifyOtp}
                                disabled={loading}
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
                                            <Text style={styles.primaryButtonText}>VERIFY & CONTINUE</Text>
                                            <Ionicons name="arrow-forward" size={18} color={C.onPrimary} style={styles.arrowIcon} />
                                        </View>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.footerLink}
                                onPress={() => setIsOtpSent(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.footerLinkText}>
                                    Entered wrong number? <Text style={styles.footerLinkBold}>Change</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>

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
    innerContainer: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 36,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: C.surfaceContainerLow,
        borderWidth: 1,
        borderColor: C.outlineVariant,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
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
        fontSize: 18,
        fontWeight: '700',
        color: C.primary,
        letterSpacing: 6,
        marginBottom: 32,
    },
    welcomeContainer: {
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        ...TY.headlineLgMobile,
        color: C.onSurface,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    accentLine: {
        width: 48,
        height: 3,
        backgroundColor: C.primary,
        marginTop: 8,
        borderRadius: 1.5,
    },
    subtitle: {
        ...TY.bodyMd,
        color: C.outline,
        fontWeight: '400',
        textAlign: 'center',
        marginTop: 4,
    },
    formContainer: {
        width: '100%',
    },
    inputGroup: {
        borderBottomWidth: 1,
        borderColor: C.outlineVariant,
        paddingBottom: 8,
        marginBottom: 24,
    },
    inputLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
    },
    fieldIcon: {
        marginRight: 12,
    },
    countryCode: {
        marginRight: 10,
        borderRightWidth: 1,
        borderColor: C.outlineVariant,
        paddingRight: 10,
    },
    countryCodeText: {
        fontSize: 16,
        fontWeight: '600',
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
        paddingHorizontal: 8,
    },
    roleLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: C.primary,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4,
    },
    roleOption: {
        flex: 1,
        height: 46,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: C.outlineVariant,
        borderRadius: 23,
        backgroundColor: C.surfaceContainerLowest,
    },
    roleOptionActive: {
        backgroundColor: C.primary,
        borderColor: C.primary,
    },
    roleText: {
        fontSize: 14,
        fontWeight: '700',
        color: C.primary,
    },
    roleTextActive: {
        color: C.onPrimary,
    },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: 28,
        marginTop: -8,
    },
    forgotText: {
        fontSize: 12,
        fontWeight: '700',
        color: C.outline,
        letterSpacing: 0.5,
    },
    primaryButtonContainer: {
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
        marginTop: 8,
    },
    primaryButton: {
        height: 56,
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
        marginTop: 28,
        alignItems: 'center',
    },
    footerLinkText: {
        fontSize: 13,
        color: C.outline,
        letterSpacing: 0.5,
    },
    footerLinkBold: {
        fontWeight: '700',
        color: C.primary,
        textDecorationLine: 'underline',
    },
    otpWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    otpInput: {
        width: width / 8.5,
        height: 56,
        backgroundColor: C.surfaceContainerLowest,
        borderRadius: 14,
        textAlign: 'center',
        fontSize: 22,
        fontWeight: '800',
        color: C.primary,
        borderWidth: 1,
        borderColor: C.outlineVariant,
    },
});
