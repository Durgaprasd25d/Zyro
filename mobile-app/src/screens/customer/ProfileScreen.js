import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    StatusBar,
    Alert,
    Dimensions,
    Modal,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
import config from '../../constants/config';
import { DESIGN_COLORS as C, DESIGN_TYPOGRAPHY as TY } from '../../constants/designSystem';
import BottomNavBar from '../../components/BottomNavBar';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', email: '', mobile: '' });
    const [saving, setSaving] = useState(false);

    // Modals visibility state
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [showSafetyModal, setShowSafetyModal] = useState(false);
    const [showLegalModal, setShowLegalModal] = useState(false);

    // Sub-modal states
    const [addresses, setAddresses] = useState([]);

    useEffect(() => {
        loadUser();
        fetchAddresses();
    }, []);

    const loadUser = async () => {
        const userData = await authService.getUser();
        setUser(userData);
        if (userData) {
            setEditForm({
                name: userData.name || '',
                email: userData.email || '',
                mobile: userData.mobile || '',
            });
        }
    };

    const fetchAddresses = async () => {
        try {
            const userData = await authService.getUser();
            const token = await authService.getToken();
            if (!userData?._id) return;
            const res = await fetch(`${config.BACKEND_URL}/api/auth/addresses/${userData._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setAddresses(data.addresses || []);
            }
        } catch (e) {
            console.error('Fetch addresses error:', e);
        }
    };

    const handleEditProfile = () => {
        setShowEditModal(true);
    };

    const handleSaveProfile = async () => {
        if (!editForm.name.trim()) {
            Alert.alert('Required', 'Please enter your name');
            return;
        }
        setSaving(true);
        try {
            const token = await authService.getToken();
            const userData = await authService.getUser();
            const res = await fetch(`${config.BACKEND_URL}/api/auth/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ userId: userData?._id, name: editForm.name, email: editForm.email })
            });
            const data = await res.json();
            if (data.success) {
                await authService.setUser(data.user);
                setUser(data.user);
                setShowEditModal(false);
                Alert.alert('Profile Updated', 'Your profile has been saved successfully!');
            } else {
                Alert.alert('Error', data.message || 'Failed to update profile');
            }
        } catch (e) {
            Alert.alert('Error', 'Update error: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out from Zyro?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        await authService.logout();
                        navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

            {/* Dark Theme Header */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={24} color={C.onSurface} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Account & Profile</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile User Info Header */}
                <View style={styles.profileSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.name || 'Customer'}</Text>
                        <Text style={styles.userPhone}>{user?.mobile || '+91 98765 43210'}</Text>
                        <TouchableOpacity
                            style={styles.editBadge}
                            onPress={handleEditProfile}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="pencil-outline" size={12} color={C.onPrimary} style={{ marginRight: 4 }} />
                            <Text style={styles.editBadgeText}>Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Payment Methods Section */}
                <View style={styles.menuSection}>
                    <Text style={styles.sectionLabel}>Payments & Security</Text>
                    <View style={styles.paymentCard}>
                        <View style={styles.paymentCardHeader}>
                            <Ionicons name="shield-checkmark" size={18} color={C.primary} />
                            <Text style={styles.paymentSecureText}>Razorpay SSL 256-Bit Protection</Text>
                        </View>
                        <Text style={styles.paymentDesc}>UPI • Cards • Net Banking • Cash on Service</Text>
                    </View>
                </View>

                {/* Account Preferences */}
                <View style={styles.menuSection}>
                    <Text style={styles.sectionLabel}>Preferences</Text>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => setShowAddressModal(true)}
                        activeOpacity={0.75}
                    >
                        <View style={styles.menuItemLeft}>
                            <View style={styles.menuIconBox}>
                                <Ionicons name="location-outline" size={20} color={C.primary} />
                            </View>
                            <Text style={styles.menuItemLabel}>Saved Addresses</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={C.onSurfaceVariant} />
                    </TouchableOpacity>
                </View>

                {/* Support & Help Menu */}
                <View style={styles.menuSection}>
                    <Text style={styles.sectionLabel}>Support & Safety</Text>
                    
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => setShowHelpModal(true)}
                        activeOpacity={0.75}
                    >
                        <View style={styles.menuItemLeft}>
                            <View style={styles.menuIconBox}>
                                <Ionicons name="help-circle-outline" size={20} color={C.primary} />
                            </View>
                            <Text style={styles.menuItemLabel}>Help Center</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={C.onSurfaceVariant} />
                    </TouchableOpacity>



                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => setShowSafetyModal(true)}
                        activeOpacity={0.75}
                    >
                        <View style={styles.menuItemLeft}>
                            <View style={styles.menuIconBox}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={C.primary} />
                            </View>
                            <Text style={styles.menuItemLabel}>Safety & Protection</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={C.onSurfaceVariant} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => setShowLegalModal(true)}
                        activeOpacity={0.75}
                    >
                        <View style={styles.menuItemLeft}>
                            <View style={styles.menuIconBox}>
                                <Ionicons name="information-circle-outline" size={20} color={C.primary} />
                            </View>
                            <Text style={styles.menuItemLabel}>Terms & Privacy Policies</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={C.onSurfaceVariant} />
                    </TouchableOpacity>
                </View>

                {/* Logout Action */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out-outline" size={20} color="#E57373" />
                    <Text style={styles.logoutButtonText}>Log Out Account</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Zyro v1.2.0 • Premium Climate Control</Text>
                <View style={{ height: 110 }} />
            </ScrollView>

            <BottomNavBar navigation={navigation} activeTab="profile" />

            {/* Saved Addresses Modal */}
            <Modal visible={showAddressModal} animationType="slide" transparent={true} onRequestClose={() => setShowAddressModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Saved Addresses</Text>
                            <TouchableOpacity onPress={() => setShowAddressModal(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={C.onSurface} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalScroll}>
                            {addresses.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="location-outline" size={44} color={C.onSurfaceVariant} />
                                    <Text style={styles.emptyText}>No saved addresses yet</Text>
                                    <Text style={styles.emptySubtext}>Addresses saved during booking appear here</Text>
                                </View>
                            ) : (
                                addresses.map((addr) => (
                                    <View key={addr._id || addr.id} style={styles.addressItem}>
                                        <Ionicons name="location" size={20} color={C.primary} />
                                        <View style={{ flex: 1, marginHorizontal: 10 }}>
                                            <Text style={styles.addressLabel}>{addr.label || 'Saved Location'}</Text>
                                            <Text style={styles.addressText} numberOfLines={2}>{addr.address}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Help Center Modal */}
            <Modal visible={showHelpModal} animationType="slide" transparent={true} onRequestClose={() => setShowHelpModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Help Center</Text>
                            <TouchableOpacity onPress={() => setShowHelpModal(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={C.onSurface} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalScroll}>
                            <View style={styles.faqCard}>
                                <Text style={styles.faqQ}>How do I book a technician?</Text>
                                <Text style={styles.faqA}>Select any service on Home screen, pick location on MapPicker, and select instant booking or schedule timing.</Text>
                            </View>
                            <View style={styles.faqCard}>
                                <Text style={styles.faqQ}>How do I track my technician live?</Text>
                                <Text style={styles.faqA}>Once accepted, open Active Activity tab to view technician live MapBox location and arrival time.</Text>
                            </View>


                        </ScrollView>
                    </View>
                </View>
            </Modal>



            {/* Safety & Protection Modal */}
            <Modal visible={showSafetyModal} animationType="slide" transparent={true} onRequestClose={() => setShowSafetyModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Safety & Security</Text>
                            <TouchableOpacity onPress={() => setShowSafetyModal(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={C.onSurface} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalScroll}>
                            <View style={styles.safetyCard}>
                                <Ionicons name="shield-checkmark" size={32} color={C.primary} />
                                <Text style={styles.safetyTitle}>Verified & Background Checked</Text>
                                <Text style={styles.safetyDesc}>Every technician undergoes police verification, identity check, and certified technical training before assignment.</Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Legal Terms Modal */}
            <Modal visible={showLegalModal} animationType="slide" transparent={true} onRequestClose={() => setShowLegalModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Terms & Privacy Policies</Text>
                            <TouchableOpacity onPress={() => setShowLegalModal(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={C.onSurface} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalScroll}>
                            <View style={styles.legalItem}>
                                <Text style={styles.legalTitle}>Terms of Service</Text>
                                <Text style={styles.legalDesc}>Zyro provides home climate control & AC service booking platform. Standard cancellation policy applies.</Text>
                            </View>
                            <View style={styles.legalItem}>
                                <Text style={styles.legalTitle}>Privacy & Data Policy</Text>
                                <Text style={styles.legalDesc}>Your contact details and service address are strictly encrypted and used solely for booking fulfillment.</Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Edit Profile Modal */}
            <Modal visible={showEditModal} animationType="slide" transparent={true} onRequestClose={() => setShowEditModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile Details</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={C.onSurface} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.formContainer}>
                            <Text style={styles.inputLabel}>Full Name</Text>
                            <TextInput
                                style={styles.formInput}
                                value={editForm.name}
                                onChangeText={(text) => setEditForm((prev) => ({ ...prev, name: text }))}
                                placeholder="Enter full name"
                                placeholderTextColor={C.onSurfaceVariant}
                            />

                            <Text style={styles.inputLabel}>Email Address</Text>
                            <TextInput
                                style={styles.formInput}
                                value={editForm.email}
                                onChangeText={(text) => setEditForm((prev) => ({ ...prev, email: text }))}
                                placeholder="Enter email"
                                placeholderTextColor={C.onSurfaceVariant}
                                keyboardType="email-address"
                            />

                            <TouchableOpacity
                                style={styles.primaryActionBtn}
                                onPress={handleSaveProfile}
                                disabled={saving}
                                activeOpacity={0.8}
                            >
                                {saving ? (
                                    <ActivityIndicator color={C.onPrimary} />
                                ) : (
                                    <Text style={styles.primaryActionBtnText}>Save Changes</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D0D',
    },
    header: {
        backgroundColor: '#0D0D0D',
        borderBottomWidth: 1,
        borderBottomColor: '#1C1C1C',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#161616',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#262626',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: TY.titleMd.fontFamily,
        fontWeight: '600',
        color: C.onSurface,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        gap: 16,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#141414',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#222222',
        padding: 20,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: C.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 26,
        fontWeight: '900',
        color: C.onPrimary,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: '800',
        color: C.onSurface,
    },
    userPhone: {
        fontSize: 13,
        color: C.onSurfaceVariant,
        marginTop: 2,
    },
    editBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: C.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 14,
        marginTop: 8,
    },
    editBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: C.onPrimary,
    },
    menuSection: {
        gap: 8,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: C.onSurfaceVariant,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: 4,
    },
    paymentCard: {
        backgroundColor: '#141414',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#222222',
        padding: 16,
    },
    paymentCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    paymentSecureText: {
        fontSize: 13,
        fontWeight: '700',
        color: C.onSurface,
    },
    paymentDesc: {
        fontSize: 12,
        color: C.onSurfaceVariant,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#141414',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#222222',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuIconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1C1C1C',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: C.onSurface,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#1E1414',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#3D2020',
        paddingVertical: 16,
        marginTop: 10,
    },
    logoutButtonText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#E57373',
    },
    versionText: {
        fontSize: 11,
        color: C.onSurfaceVariant,
        textAlign: 'center',
        marginTop: 8,
    },
    bottomNav: {
        backgroundColor: C.surfaceContainerLow,
        borderTopWidth: 1,
        borderColor: C.outlineVariant,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    navContent: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 0 : 10,
        justifyContent: 'space-between',
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 6,
    },
    navTextActive: {
        fontSize: 10,
        fontWeight: '800',
        color: C.primary,
        marginTop: 4,
        letterSpacing: 0.5,
    },
    navText: {
        fontSize: 10,
        fontWeight: '600',
        color: C.outline,
        marginTop: 4,
        letterSpacing: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#141414',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: '#222222',
        maxHeight: '80%',
        padding: 20,
    },
    chatModalContent: {
        backgroundColor: '#141414',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: '#222222',
        height: '75%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#222222',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: C.onSurface,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1C1C1C',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalScroll: {
        paddingTop: 16,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '700',
        color: C.onSurface,
        marginTop: 10,
    },
    emptySubtext: {
        fontSize: 12,
        color: C.onSurfaceVariant,
        marginTop: 4,
    },
    addressItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1C',
        padding: 14,
        borderRadius: 14,
        marginBottom: 10,
    },
    addressLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: C.onSurface,
    },
    addressText: {
        fontSize: 12,
        color: C.onSurfaceVariant,
        marginTop: 2,
    },
    faqCard: {
        backgroundColor: '#1C1C1C',
        padding: 14,
        borderRadius: 14,
        marginBottom: 12,
    },
    faqQ: {
        fontSize: 14,
        fontWeight: '700',
        color: C.onSurface,
        marginBottom: 4,
    },
    faqA: {
        fontSize: 12,
        color: C.onSurfaceVariant,
        lineHeight: 18,
    },
    primaryActionBtn: {
        backgroundColor: C.primary,
        height: 48,
        borderRadius: 24,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 14,
    },
    primaryActionBtnText: {
        color: C.onPrimary,
        fontSize: 14,
        fontWeight: '800',
    },
    onlineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4CAF50',
    },
    chatScroll: {
        flex: 1,
    },
    chatBubble: {
        maxWidth: '80%',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 16,
        marginBottom: 4,
    },
    chatBubbleSupport: {
        backgroundColor: '#222222',
        alignSelf: 'flex-start',
    },
    chatBubbleUser: {
        backgroundColor: C.primary,
        alignSelf: 'flex-end',
    },
    chatText: {
        fontSize: 13,
        color: C.onSurface,
        lineHeight: 18,
    },
    chatInputRow: {
        flexDirection: 'row',
        padding: 12,
        gap: 10,
        borderTopWidth: 1,
        borderColor: '#222222',
        backgroundColor: '#141414',
    },
    chatTextInput: {
        flex: 1,
        height: 44,
        backgroundColor: '#1C1C1C',
        borderRadius: 22,
        paddingHorizontal: 16,
        color: C.onSurface,
        fontSize: 14,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: C.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    safetyCard: {
        backgroundColor: '#1C1C1C',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 14,
    },
    safetyTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: C.onSurface,
        marginTop: 10,
        marginBottom: 4,
    },
    safetyDesc: {
        fontSize: 13,
        color: C.onSurfaceVariant,
        textAlign: 'center',
        lineHeight: 18,
    },
    legalItem: {
        backgroundColor: '#1C1C1C',
        padding: 14,
        borderRadius: 14,
        marginBottom: 10,
    },
    legalTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: C.onSurface,
        marginBottom: 4,
    },
    legalDesc: {
        fontSize: 12,
        color: C.onSurfaceVariant,
        lineHeight: 18,
    },
    formContainer: {
        paddingTop: 16,
        gap: 10,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: C.onSurfaceVariant,
    },
    formInput: {
        height: 46,
        backgroundColor: '#1C1C1C',
        borderRadius: 12,
        paddingHorizontal: 14,
        color: C.onSurface,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#2D2D2D',
    },
});
