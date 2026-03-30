import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING } from '../../constants/theme';
import authService from '../../services/authService';

export default function ChangePasswordScreen({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleUpdate = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'All fields are required');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const userData = await authService.getUser();
            const res = await authService.changePassword(userData.id || userData._id, currentPassword, newPassword);
            if (res.success) {
                Alert.alert('Success', 'Password changed successfully');
                navigation.goBack();
            } else {
                Alert.alert('Error', res.error || 'Failed to change password');
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.bw_black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>SECURE ACCESS</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoCard}>
                    <Ionicons name="shield-checkmark" size={32} color={COLORS.bw_black} />
                    <Text style={styles.infoText}>Update your security credentials. Use a strong password with at least 6 characters.</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>CURRENT PASSWORD</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry={!showCurrent}
                            placeholder="••••••••"
                            placeholderTextColor={COLORS.grey}
                        />
                        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrent(!showCurrent)}>
                            <Ionicons name={showCurrent ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.bw_black} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>NEW PASSWORD</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showNew}
                            placeholder="Min. 6 characters"
                            placeholderTextColor={COLORS.grey}
                        />
                        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(!showNew)}>
                            <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.bw_black} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>CONFIRM NEW PASSWORD</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirm}
                            placeholder="••••••••"
                            placeholderTextColor={COLORS.grey}
                        />
                        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
                            <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.bw_black} />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity 
                    style={styles.updateButton} 
                    onPress={handleUpdate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.bw_white} />
                    ) : (
                        <Text style={styles.updateButtonText}>UPDATE PASSWORD</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bw_white },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.bw_border
    },
    backButton: { padding: 8 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: COLORS.bw_black, letterSpacing: 2 },
    content: { padding: SPACING.lg },
    infoCard: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 16, 
        backgroundColor: COLORS.bw_greyLight, 
        padding: 20, 
        borderRadius: 4,
        marginBottom: SPACING.xl,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.bw_black
    },
    infoText: { flex: 1, fontSize: 13, color: COLORS.bw_black, lineHeight: 18 },
    inputGroup: { marginBottom: SPACING.xl },
    label: { fontSize: 12, fontWeight: 'bold', color: COLORS.bw_black, marginBottom: 8, letterSpacing: 1 },
    passwordContainer: { 
        flexDirection: 'row', 
        alignItems: 'center',
        backgroundColor: COLORS.bw_greyLight, 
        borderRadius: 4, 
        borderWidth: 1,
        borderColor: COLORS.bw_border
    },
    passwordInput: { 
        flex: 1,
        padding: 16, 
        fontSize: 16, 
        color: COLORS.bw_black,
    },
    eyeBtn: { padding: 16 },
    updateButton: { 
        backgroundColor: COLORS.bw_black, 
        padding: 18, 
        borderRadius: 4, 
        alignItems: 'center',
        marginTop: SPACING.xl
    },
    updateButtonText: { color: COLORS.bw_white, fontWeight: 'bold', letterSpacing: 2 },
});
