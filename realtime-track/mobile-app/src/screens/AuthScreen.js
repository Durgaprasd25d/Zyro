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
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../services/authService';

const { width, height } = Dimensions.get('window');

// Modern SaaS Monochrome Palette
const COLORS = {
    black: '#000000',
    white: '#FFFFFF',
    greyLight: '#F3F4F6',
    greyMedium: '#9CA3AF',
    greyDark: '#4B5563',
    border: '#E5E7EB',
    error: '#EF4444',
};

export default function AuthScreen({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [role, setRole] = useState('customer');

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
            Alert.alert('Invalid OTP', 'Please enter the 6-digit code');
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
                Alert.alert('Verification Failed', result.error || 'Incorrect or expired OTP.');
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Error', 'OTP Verification failed.');
        }
    };

    const handlePasswordAction = async () => {
        if (phoneNumber.length < 10) return Alert.alert('Invalid Number', 'Enter 10-digit mobile number');
        if (password.length < 6) return Alert.alert('Weak Password', 'Password must be at least 6 characters');

        setLoading(true);
        try {
            let result;
            if (isRegistering) {
                if (!name) { setLoading(false); return Alert.alert('Name Required', 'Please enter your name'); }
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
                Alert.alert('Auth Error', result.error);
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Error', 'Something went wrong.');
        }
    };

    const renderRoleSelector = () => (
        <View style={styles.roleContainer}>
            <TouchableOpacity
                style={[styles.roleOption, role === 'customer' && styles.roleOptionActive]}
                onPress={() => setRole('customer')}
            >
                <Ionicons name="people" size={18} color={role === 'customer' ? COLORS.white : COLORS.black} />
                <Text style={[styles.roleText, role === 'customer' && styles.roleTextActive]}>Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.roleOption, role === 'technician' && styles.roleOptionActive]}
                onPress={() => setRole('technician')}
            >
                <Ionicons name="construct" size={18} color={role === 'technician' ? COLORS.white : COLORS.black} />
                <Text style={[styles.roleText, role === 'technician' && styles.roleTextActive]}>Technician</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <View style={styles.innerContainer}>
                    {/* Header Section */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../assets/logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.title}>
                            {isOtpSent ? 'Verify' : (isRegistering ? 'Create Account' : 'Welcome back')}
                        </Text>
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
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Full Name</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter your name"
                                            value={name}
                                            onChangeText={setName}
                                            autoFocus={isRegistering}
                                        />
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Register as</Text>
                                        {renderRoleSelector()}
                                    </View>
                                </>
                            )}

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Mobile Number</Text>
                                <View style={styles.phoneInputWrapper}>
                                    <View style={styles.countryCode}>
                                        <Text style={styles.countryCodeText}>+91</Text>
                                    </View>
                                    <TextInput
                                        style={styles.phoneInput}
                                        placeholder="00000 00000"
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.passwordWrapper}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Minimum 6 characters"
                                        secureTextEntry={!showPassword}
                                        value={password}
                                        onChangeText={setPassword}
                                    />
                                    <TouchableOpacity 
                                        style={styles.eyeButton} 
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        <Ionicons 
                                            name={showPassword ? "eye-off-outline" : "eye-outline"} 
                                            size={20} 
                                            color={COLORS.black} 
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.primaryButton}
                                activeOpacity={0.8}
                                onPress={handlePasswordAction}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.white} />
                                ) : (
                                    <Text style={styles.primaryButtonText}>
                                        {isRegistering ? 'Sign Up' : 'Continue'}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.footerLink}
                                onPress={() => setIsRegistering(!isRegistering)}
                            >
                                <Text style={styles.footerLinkText}>
                                    {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
                                    <Text style={styles.footerLinkBold}>{isRegistering ? 'Login' : 'Join now'}</Text>
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
                                    />
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.primaryButton}
                                activeOpacity={0.8}
                                onPress={handleVerifyOtp}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={COLORS.white} />
                                ) : (
                                    <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.footerLink}
                                onPress={() => setIsOtpSent(false)}
                            >
                                <Text style={styles.footerLinkText}>
                                    Entered wrong number? <Text style={styles.footerLinkBold}>Change</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    flex: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 32,
    },
    logoContainer: {
        width: 48,
        height: 48,
        marginBottom: 24,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.black,
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.greyDark,
        fontWeight: '400',
    },
    formContainer: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 8,
    },
    input: {
        height: 52,
        backgroundColor: COLORS.greyLight,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: COLORS.black,
        fontWeight: '500',
    },
    phoneInputWrapper: {
        flexDirection: 'row',
        height: 52,
        gap: 8,
    },
    countryCode: {
        width: 60,
        backgroundColor: COLORS.greyLight,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countryCodeText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
    },
    phoneInput: {
        flex: 1,
        backgroundColor: COLORS.greyLight,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: COLORS.black,
        fontWeight: '500',
    },
    passwordWrapper: {
        flexDirection: 'row',
        height: 52,
        backgroundColor: COLORS.greyLight,
        borderRadius: 12,
        alignItems: 'center',
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 16,
        fontSize: 16,
        color: COLORS.black,
        fontWeight: '500',
    },
    eyeButton: {
        paddingHorizontal: 16,
        height: '100%',
        justifyContent: 'center',
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    roleOption: {
        flex: 1,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
    },
    roleOptionActive: {
        backgroundColor: COLORS.black,
        borderColor: COLORS.black,
    },
    roleText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.black,
    },
    roleTextActive: {
        color: COLORS.white,
    },
    primaryButton: {
        height: 56,
        backgroundColor: COLORS.black,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.white,
    },
    footerLink: {
        marginTop: 24,
        alignItems: 'center',
    },
    footerLinkText: {
        fontSize: 15,
        color: COLORS.greyDark,
    },
    footerLinkBold: {
        fontWeight: '700',
        color: COLORS.black,
    },
    otpWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    otpInput: {
        width: width / 8,
        height: 56,
        backgroundColor: COLORS.greyLight,
        borderRadius: 12,
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.black,
        borderWidth: 1,
        borderColor: 'transparent',
    },
});
