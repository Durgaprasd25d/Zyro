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

import { useInAppNotification } from '../../components/InAppNotification';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
    const { showNotification } = useInAppNotification();
    const [user, setUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        mobile: '',
        alternateMobile: '',
        gender: 'Unspecified',
        city: '',
        pincode: '',
        landmark: '',
    });
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
                alternateMobile: userData.alternateMobile || '',
                gender: userData.gender || 'Unspecified',
                city: userData.city || '',
                pincode: userData.pincode || '',
                landmark: userData.landmark || '',
            });
        }
    };

    const fetchAddresses = async () => {
        try {
            const userData = await authService.getUser();
            const token = await authService.getToken();
            if (!userData?._id && !userData?.id) return;
            const uid = userData._id || userData.id;
            const res = await fetch(`${config.BACKEND_URL}/api/auth/addresses/${uid}`, {
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
            showNotification({
                title: 'Required Field',
                message: 'Please enter your full name.',
                type: 'warning',
            });
            return;
        }
        setSaving(true);
        try {
            const token = await authService.getToken();
            const userData = await authService.getUser();
            const uid = userData?._id || userData?.id;

            const res = await fetch(`${config.BACKEND_URL}/api/auth/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: uid,
                    name: editForm.name,
                    email: editForm.email,
                    alternateMobile: editForm.alternateMobile,
                    gender: editForm.gender,
                    city: editForm.city,
                    pincode: editForm.pincode,
                    landmark: editForm.landmark,
                })
            });
            const data = await res.json();
            if (data.success) {
                await authService.setUser(data.user);
                setUser(data.user);
                setShowEditModal(false);
                showNotification({
                    title: 'Profile Saved',
                    message: 'Your account details have been updated successfully!',
                    type: 'success',
                });
            } else {
                showNotification({
                    title: 'Update Failed',
                    message: data.message || 'Failed to update profile',
                    type: 'error',
                });
            }
        } catch (e) {
            showNotification({
                title: 'Network Error',
                message: 'Update error: ' + e.message,
                type: 'error',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        showNotification({
            title: 'Log Out Account',
            message: 'Are you sure you want to log out from Zyro?',
            type: 'warning',
            duration: 0,
            buttons: [
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
        });
    };

    const locationString = [user?.landmark, user?.city, user?.pincode].filter(Boolean).join(', ');

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

                {/* Personal Information Summary Card */}
                <View style={styles.menuSection}>
                    <Text style={styles.sectionLabel}>Personal Information</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Ionicons name="mail-outline" size={16} color={C.primary} />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Email Address</Text>
                                <Text style={styles.infoValue}>{user?.email || 'Not provided'}</Text>
                            </View>
                        </View>

                        <View style={styles.infoRowDivider} />

                        <View style={styles.infoRow}>
                            <Ionicons name="person-outline" size={16} color={C.primary} />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Gender</Text>
                                <Text style={styles.infoValue}>{user?.gender || 'Not specified'}</Text>
                            </View>
                        </View>

                        <View style={styles.infoRowDivider} />

                        <View style={styles.infoRow}>
                            <Ionicons name="call-outline" size={16} color={C.primary} />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>Alternate Phone</Text>
                                <Text style={styles.infoValue}>{user?.alternateMobile || 'Not provided'}</Text>
                            </View>
                        </View>

                        <View style={styles.infoRowDivider} />

                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={16} color={C.primary} />
                            <View style={styles.infoTextContainer}>
                                <Text style={styles.infoLabel}>City & Area</Text>
                                <Text style={styles.infoValue}>{locationString || 'Not specified'}</Text>
                            </View>
                        </View>
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
                                <Ionicons name="document-text-outline" size={20} color={C.primary} />
                            </View>
                            <Text style={styles.menuItemLabel}>Terms & Privacy Policy</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={C.onSurfaceVariant} />
                    </TouchableOpacity>
                </View>

                {/* Log Out */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out-outline" size={20} color="#FF5252" />
                    <Text style={styles.logoutText}>Log Out Account</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Shared Reusable BottomNavBar */}
            <BottomNavBar navigation={navigation} activeTab="profile" />

            {/* Saved Addresses Modal */}
            <Modal visible={showAddressModal} animationType="slide" transparent={true} onRequestClose={() => setShowAddressModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Saved Delivery Addresses</Text>
                            <TouchableOpacity onPress={() => setShowAddressModal(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={C.onSurface} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalScroll}>
                            {addresses.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="location-outline" size={48} color={C.onSurfaceVariant} />
                                    <Text style={styles.emptyText}>No saved addresses yet</Text>
                                    <Text style={styles.emptySubtext}>Your saved home/work locations will appear here.</Text>
                                </View>
                            ) : (
                                addresses.map((addr, idx) => (
                                    <View key={idx} style={styles.addressItem}>
                                        <Ionicons name="home-outline" size={20} color={C.primary} style={{ marginRight: 12 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.addressLabel}>{addr.label || 'Saved Location'}</Text>
                                            <Text style={styles.addressText}>{addr.address}</Text>
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
                            <Text style={styles.modalTitle}>Help & Support Center</Text>
                            <TouchableOpacity onPress={() => setShowHelpModal(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={C.onSurface} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalScroll}>
                            <View style={styles.faqCard}>
                                <Text style={styles.faqQ}>How do I track my active technician?</Text>
                                <Text style={styles.faqA}>Open the active booking card from the home screen or history screen to see live GPS navigation.</Text>
                            </View>
                            <View style={styles.faqCard}>
                                <Text style={styles.faqQ}>What if I need to cancel my service?</Text>
                                <Text style={styles.faqA}>You can cancel anytime before the technician arrives directly from the active booking screen.</Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Safety Modal */}
            <Modal visible={showSafetyModal} animationType="slide" transparent={true} onRequestClose={() => setShowSafetyModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Safety & Protection</Text>
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

            {/* EXPANDED EDIT PROFILE MODAL */}
            <Modal visible={showEditModal} animationType="slide" transparent={true} onRequestClose={() => setShowEditModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '88%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile Information</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={C.onSurface} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                            <View style={styles.formContainer}>
                                {/* Full Name */}
                                <Text style={styles.inputLabel}>Full Name *</Text>
                                <View style={styles.inputBox}>
                                    <Ionicons name="person-outline" size={18} color={C.primary} style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={styles.formInputText}
                                        value={editForm.name}
                                        onChangeText={(text) => setEditForm((prev) => ({ ...prev, name: text }))}
                                        placeholder="Enter full name"
                                        placeholderTextColor={C.onSurfaceVariant}
                                    />
                                </View>

                                {/* Email Address */}
                                <Text style={styles.inputLabel}>Email Address</Text>
                                <View style={styles.inputBox}>
                                    <Ionicons name="mail-outline" size={18} color={C.primary} style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={styles.formInputText}
                                        value={editForm.email}
                                        onChangeText={(text) => setEditForm((prev) => ({ ...prev, email: text }))}
                                        placeholder="name@example.com"
                                        placeholderTextColor={C.onSurfaceVariant}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>

                                {/* Gender Selection */}
                                <Text style={styles.inputLabel}>Gender</Text>
                                <View style={styles.genderRow}>
                                    {['Male', 'Female', 'Other'].map((g) => (
                                        <TouchableOpacity
                                            key={g}
                                            style={[
                                                styles.genderPill,
                                                editForm.gender === g && styles.genderPillActive
                                            ]}
                                            onPress={() => setEditForm((prev) => ({ ...prev, gender: g }))}
                                            activeOpacity={0.8}
                                        >
                                            <Text
                                                style={[
                                                    styles.genderPillText,
                                                    editForm.gender === g && styles.genderPillTextActive
                                                ]}
                                            >
                                                {g}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Primary Mobile (Read Only) */}
                                <Text style={styles.inputLabel}>Primary Mobile (Registered)</Text>
                                <View style={[styles.inputBox, { opacity: 0.6 }]}>
                                    <Ionicons name="phone-portrait-outline" size={18} color={C.onSurfaceVariant} style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={styles.formInputText}
                                        value={editForm.mobile}
                                        editable={false}
                                        placeholderTextColor={C.onSurfaceVariant}
                                    />
                                    <Ionicons name="lock-closed-outline" size={16} color={C.onSurfaceVariant} />
                                </View>

                                {/* Alternate Phone Number */}
                                <Text style={styles.inputLabel}>Alternate Contact Number</Text>
                                <View style={styles.inputBox}>
                                    <Ionicons name="call-outline" size={18} color={C.primary} style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={styles.formInputText}
                                        value={editForm.alternateMobile}
                                        onChangeText={(text) => setEditForm((prev) => ({ ...prev, alternateMobile: text }))}
                                        placeholder="Secondary mobile number"
                                        placeholderTextColor={C.onSurfaceVariant}
                                        keyboardType="phone-pad"
                                    />
                                </View>

                                {/* City / Town */}
                                <Text style={styles.inputLabel}>City / Town</Text>
                                <View style={styles.inputBox}>
                                    <Ionicons name="business-outline" size={18} color={C.primary} style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={styles.formInputText}
                                        value={editForm.city}
                                        onChangeText={(text) => setEditForm((prev) => ({ ...prev, city: text }))}
                                        placeholder="e.g. Bhubaneswar, Delhi"
                                        placeholderTextColor={C.onSurfaceVariant}
                                    />
                                </View>

                                {/* Pincode */}
                                <Text style={styles.inputLabel}>Pincode / Postal Code</Text>
                                <View style={styles.inputBox}>
                                    <Ionicons name="barcode-outline" size={18} color={C.primary} style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={styles.formInputText}
                                        value={editForm.pincode}
                                        onChangeText={(text) => setEditForm((prev) => ({ ...prev, pincode: text }))}
                                        placeholder="e.g. 751024"
                                        placeholderTextColor={C.onSurfaceVariant}
                                        keyboardType="number-pad"
                                    />
                                </View>

                                {/* Landmark / Area */}
                                <Text style={styles.inputLabel}>Landmark / Colony</Text>
                                <View style={styles.inputBox}>
                                    <Ionicons name="navigate-outline" size={18} color={C.primary} style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={styles.formInputText}
                                        value={editForm.landmark}
                                        onChangeText={(text) => setEditForm((prev) => ({ ...prev, landmark: text }))}
                                        placeholder="Near Cyber City, Infocity, etc."
                                        placeholderTextColor={C.onSurfaceVariant}
                                    />
                                </View>

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

                                <View style={{ height: 20 }} />
                            </View>
                        </ScrollView>
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
        letterSpacing: 0.8,
        marginLeft: 4,
    },
    infoCard: {
        backgroundColor: '#141414',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#222222',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoRowDivider: {
        height: 1,
        backgroundColor: '#222222',
        marginVertical: 2,
    },
    infoTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    infoLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: C.onSurfaceVariant,
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '700',
        color: C.onSurface,
        marginTop: 1,
    },
    paymentCard: {
        backgroundColor: '#141414',
        borderRadius: 18,
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
        fontWeight: '800',
        color: C.primary,
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
        borderRadius: 18,
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
        borderRadius: 12,
        backgroundColor: '#1C1C1C',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: C.onSurface,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#1F1414',
        borderWidth: 1,
        borderColor: '#3D1C1C',
        borderRadius: 18,
        paddingVertical: 14,
        marginTop: 10,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FF5252',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#141414',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: '#222222',
        padding: 20,
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
    formContainer: {
        gap: 12,
        paddingBottom: 20,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: C.onSurfaceVariant,
        marginTop: 6,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1C1C1C',
        borderWidth: 1,
        borderColor: '#2E2E2E',
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 48,
    },
    formInputText: {
        flex: 1,
        color: C.onSurface,
        fontSize: 14,
        fontWeight: '600',
    },
    genderRow: {
        flexDirection: 'row',
        gap: 10,
    },
    genderPill: {
        flex: 1,
        height: 42,
        borderRadius: 12,
        backgroundColor: '#1C1C1C',
        borderWidth: 1,
        borderColor: '#2E2E2E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    genderPillActive: {
        backgroundColor: C.primary,
        borderColor: C.primary,
    },
    genderPillText: {
        fontSize: 13,
        fontWeight: '700',
        color: C.onSurfaceVariant,
    },
    genderPillTextActive: {
        color: C.onPrimary,
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
        height: 50,
        borderRadius: 25,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
    },
    primaryActionBtnText: {
        color: C.onPrimary,
        fontSize: 15,
        fontWeight: '800',
    },
    safetyCard: {
        backgroundColor: '#1C1C1C',
        padding: 20,
        borderRadius: 18,
        alignItems: 'center',
        textAlign: 'center',
    },
    safetyTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: C.onSurface,
        marginTop: 10,
    },
    safetyDesc: {
        fontSize: 13,
        color: C.onSurfaceVariant,
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 20,
    },
    legalItem: {
        backgroundColor: '#1C1C1C',
        padding: 16,
        borderRadius: 14,
        marginBottom: 12,
    },
    legalTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: C.onSurface,
        marginBottom: 4,
    },
    legalDesc: {
        fontSize: 12,
        color: C.onSurfaceVariant,
        lineHeight: 18,
    },
});
