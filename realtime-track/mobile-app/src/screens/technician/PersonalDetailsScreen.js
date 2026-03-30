import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING } from '../../constants/theme';
import authService from '../../services/authService';

export default function PersonalDetailsScreen({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const userData = await authService.getUser();
        if (userData) {
            setUser(userData);
            setName(userData.name || '');
            setEmail(userData.email || '');
        }
    };

    const handleUpdate = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }
        setLoading(true);
        try {
            // Simplified update since we don't have a dedicated endpoint yet, 
            // but we'll use the existing userData logic
            const updatedUser = { ...user, name, email };
            await authService.setUser(updatedUser);
            Alert.alert('Success', 'Profile updated locally');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
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
                <Text style={styles.headerTitle}>PERSONAL DETAILS</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>FULL NAME</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your full name"
                        placeholderTextColor={COLORS.grey}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>EMAIL ADDRESS</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        placeholderTextColor={COLORS.grey}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>MOBILE NUMBER</Text>
                    <View style={[styles.input, styles.disabledInput]}>
                        <Text style={styles.disabledText}>{user?.mobile || 'Loading...'}</Text>
                        <Ionicons name="lock-closed-outline" size={16} color={COLORS.grey} />
                    </View>
                    <Text style={styles.helperText}>Mobile number cannot be changed</Text>
                </View>

                <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={handleUpdate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.bw_white} />
                    ) : (
                        <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
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
    inputGroup: { marginBottom: SPACING.xl },
    label: { fontSize: 12, fontWeight: 'bold', color: COLORS.bw_black, marginBottom: 8, letterSpacing: 1 },
    input: { 
        backgroundColor: COLORS.bw_greyLight, 
        borderRadius: 4, 
        padding: 16, 
        fontSize: 16, 
        color: COLORS.bw_black,
        borderWidth: 1,
        borderColor: COLORS.bw_border
    },
    disabledInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    disabledText: { color: COLORS.grey, fontSize: 16 },
    helperText: { fontSize: 11, color: COLORS.grey, marginTop: 6 },
    saveButton: { 
        backgroundColor: COLORS.bw_black, 
        padding: 18, 
        borderRadius: 4, 
        alignItems: 'center',
        marginTop: SPACING.xl
    },
    saveButtonText: { color: COLORS.bw_white, fontWeight: 'bold', letterSpacing: 2 },
});
