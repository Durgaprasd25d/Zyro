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
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authService from '../../services/authService';
import config from '../../constants/config';

const { width, height } = Dimensions.get('window');

// Uber-Inspired Clean Palette
const COLORS = {
    black: '#000000',
    white: '#ffffff',
    background: '#f7f7f7',
    textPrimary: '#000000',
    textSecondary: '#545454',
    textTertiary: '#8a8a8a',
    border: '#e0e0e0',
    accent: '#06c167',
    blue: '#276ef1',
    card: '#ffffff',
    red: '#e11d48',
    greyLight: '#F3F3F3',
    greyMedium: '#AFAFAF',
};

export default function ProfileScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        mobile: ''
    });
    const [saving, setSaving] = useState(false);

    const [addresses, setAddresses] = useState([]);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [showSafetyModal, setShowSafetyModal] = useState(false);
    const [showLegalModal, setShowLegalModal] = useState(false);
    const [loadingAddresses, setLoadingAddresses] = useState(false);

    useEffect(() => {
        loadUser();
        const unsubscribe = navigation.addListener('focus', () => {
            fetchAddresses();
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        if (user) {
            fetchAddresses();
        }
    }, [user]);

    const loadUser = async () => {
        const userData = await authService.getUser();
        setUser(userData);
        if (userData) {
            setEditForm({
                name: userData.name || '',
                email: userData.email || '',
                mobile: userData.mobile || ''
            });
        }
    };

    const fetchAddresses = async () => {
        if (!user) return;
        setLoadingAddresses(true);
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/auth/addresses/${user.id || user._id}`);
            const result = await response.json();
            if (result.success) {
                setAddresses(result.addresses);
            }
        } catch (error) {
            console.error('Fetch addresses error:', error);
        } finally {
            setLoadingAddresses(false);
        }
    };

    const handleDeleteAddress = async (addressId) => {
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/auth/delete-address/${user.id || user._id}/${addressId}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.success) {
                setAddresses(result.addresses);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to delete address');
        }
    };

    const handleEditProfile = () => {
        setEditForm({
            name: user?.name || '',
            email: user?.email || '',
            mobile: user?.mobile || ''
        });
        setShowEditModal(true);
    };

    const handleSaveProfile = async () => {
        if (!editForm.name.trim()) {
            Alert.alert('Error', 'Name cannot be empty');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/auth/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id || user._id,
                    name: editForm.name,
                    email: editForm.email
                })
            });

            const result = await response.json();

            if (result.success) {
                const updatedUser = { ...user, ...editForm };
                setUser(updatedUser);
                await authService.setUser(updatedUser);
                setShowEditModal(false);
                Alert.alert('Success', 'Profile updated successfully');
            } else {
                Alert.alert('Error', result.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to log out of your account?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await authService.logout();
                        navigation.replace('Auth');
                    }
                }
            ]
        );
    };

    const [activeLegalTab, setActiveLegalTab] = useState(null); // 'terms', 'privacy', 'data', 'licenses'

    const legalContent = {
        terms: {
            title: 'Terms of Service',
            content: `Welcome to Realtime Track. By using our application, you agree to the following terms:

1. USE OF SERVICE
You must be 18+ to use this service. You are responsible for maintaining account confidentiality.

2. SERVICE BOOKINGS
Bookings are subject to technician availability. We reserve the right to cancel bookings for safety or policy violations.

3. PAYMENTS
Payments are processed via Razorpay. Cancellations after technician dispatch may incur a fee.

4. LIABILITY
Realtime Track is a platform connecting users with technicians. While we verify all technicians, we are not liable for individual conduct but will assist in dispute resolution.`
        },
        privacy: {
            title: 'Privacy Policy',
            content: `Your privacy is important to us.

1. DATA COLLECTION
We collect your name, mobile number, and email to manage your account.

2. LOCATION DATA
We collect real-time location data when the app is in use to provide tracking for your technician and ensure accurate service delivery.

3. DATA SHARING
We share your name and location with the assigned technician only during the active service window.`
        },
        data: {
            title: 'Data Usage Policy',
            content: `How we handle your data:

1. SERVICE OPTIMIZATION
Data is used to improve technician routing and reduce wait times.

2. SECURITY
Your data is encrypted and stored on secure servers. We do not sell your personal information to third parties.

3. YOUR RIGHTS
You can request account deletion at any time via the Help Center.`
        },
        licenses: {
            title: 'Software Licenses',
            content: `This application uses the following open-source software:

• React Native (MIT License)
• Mapbox Maps SDK (Custom License)
• Socket.IO (MIT License)
• Ionicons (MIT License)
• Expo Modules (MIT License)

Full license texts are available upon written request to our legal team.`
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            <SafeAreaView edges={['top']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.canGoBack() && navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Account</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <View style={styles.profileSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.name || 'User'}</Text>
                        <Text style={styles.userPhone}>{user?.mobile || '+91 00000 00000'}</Text>
                        <TouchableOpacity
                            style={styles.editBadge}
                            onPress={handleEditProfile}
                        >
                            <Text style={styles.editBadgeText}>Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Payment Info Section */}
                <View style={styles.paymentSection}>
                    <Text style={styles.sectionLabel}>Payment Methods</Text>
                    <View style={styles.paymentCard}>
                        <View style={styles.paymentCardHeader}>
                            <Ionicons name="shield-checkmark" size={20} color={COLORS.accent} />
                            <Text style={styles.paymentSecureText}>Secure Payments via Razorpay</Text>
                        </View>
                        <Text style={styles.paymentDesc}>We accept all major payment methods</Text>
                        <View style={styles.paymentIcons}>
                            <View style={styles.paymentTag}><Text style={styles.paymentTagText}>UPI</Text></View>
                            <View style={styles.paymentTag}><Text style={styles.paymentTagText}>CARDS</Text></View>
                            <View style={styles.paymentTag}><Text style={styles.paymentTagText}>NET BANKING</Text></View>
                            <View style={styles.paymentTag}><Text style={styles.paymentTagText}>WALLETS</Text></View>
                        </View>
                    </View>
                </View>

                {/* Menu Sections */}
                <View style={styles.menuSection}>
                    <Text style={styles.sectionLabel}>Preferences</Text>
                    <ProfileMenuItem 
                        icon="location-outline" 
                        label="Saved Addresses" 
                        onPress={() => setShowAddressModal(true)} 
                    />
                    {/* <ProfileMenuItem icon="notifications-outline" label="Notifications" /> */}
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.sectionLabel}>Support</Text>
                    <ProfileMenuItem 
                        icon="help-circle-outline" 
                        label="Help Center" 
                        onPress={() => setShowHelpModal(true)} 
                    />
                    <ProfileMenuItem 
                        icon="shield-checkmark-outline" 
                        label="Safety" 
                        onPress={() => setShowSafetyModal(true)} 
                    />
                    <ProfileMenuItem 
                        icon="information-circle-outline" 
                        label="Legal" 
                        onPress={() => setShowLegalModal(true)} 
                    />
                </View>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Text style={styles.logoutButtonText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 1.2.0 (Build 24)</Text>
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Address Modal */}
            <Modal visible={showAddressModal} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Saved Addresses</Text>
                            <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                                <Ionicons name="close" size={26} color={COLORS.black} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalScroll}>
                            {addresses.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="location-outline" size={48} color={COLORS.textTertiary} />
                                    <Text style={styles.emptyText}>No saved addresses yet</Text>
                                    <Text style={styles.emptySubtext}>Addresses saved during booking will appear here</Text>
                                </View>
                            ) : (
                                addresses.map((addr) => (
                                    <View key={addr._id} style={styles.addressItem}>
                                        <View style={styles.addressIcon}>
                                            <Ionicons 
                                                name={addr.label?.toLowerCase() === 'home' ? 'home-outline' : 'business-outline'} 
                                                size={20} color={COLORS.black} 
                                            />
                                        </View>
                                        <View style={styles.addressInfo}>
                                            <Text style={styles.addressLabel}>{addr.label}</Text>
                                            <Text style={styles.addressText} numberOfLines={2}>{addr.address}</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => handleDeleteAddress(addr._id)}>
                                            <Ionicons name="trash-outline" size={20} color={COLORS.red} />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Help Center Modal */}
            <Modal visible={showHelpModal} animationType="fade" transparent={true}>
                <View style={styles.fullModalOverlay}>
                    <View style={styles.fullModalContainer}>
                        <View style={styles.fullModalHeader}>
                            <Text style={styles.fullModalTitle}>Help Center</Text>
                            <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                                <Ionicons name="close" size={26} color={COLORS.black} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.fullModalBody}>
                            <HelpSection title="Common Questions" items={[
                                { q: "How do I book a technician?", a: "Go to Home, select a service, and confirm your location." },
                                { q: "Track my technician?", a: "Once assigned, you can track them in real-time on the map." },
                                { q: "Payment issues?", a: "Refunds are processed within 5-7 business days." }
                            ]} />
                            <TouchableOpacity style={styles.contactBtn}>
                                <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.white} />
                                <Text style={styles.contactBtnText}>Chat with Support</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Safety Modal */}
            <Modal visible={showSafetyModal} animationType="fade" transparent={true}>
                <View style={styles.fullModalOverlay}>
                    <View style={styles.fullModalContainer}>
                        <View style={styles.fullModalHeader}>
                            <Text style={styles.fullModalTitle}>Safety</Text>
                            <TouchableOpacity onPress={() => setShowSafetyModal(false)}>
                                <Ionicons name="close" size={26} color={COLORS.black} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.fullModalBody}>
                            <View style={styles.safetyCard}>
                                <Ionicons name="shield-checkmark" size={40} color={COLORS.accent} />
                                <Text style={styles.safetyTitle}>Your Safety is Priority</Text>
                                <Text style={styles.safetyDesc}>All our technicians are background-verified and follow strict safety protocols.</Text>
                            </View>
                            <SafetyItem icon="call-outline" title="Emergency Contact" desc="Quickly call local authorities or our 24/7 safety line." />
                            <SafetyItem icon="share-social-outline" title="Share Status" desc="Tell your family or friends where you are." />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Legal Modal */}
            <Modal visible={showLegalModal} animationType="fade" transparent={true}>
                <View style={styles.fullModalOverlay}>
                    <View style={styles.fullModalContainer}>
                        <View style={styles.fullModalHeader}>
                            {activeLegalTab ? (
                                <TouchableOpacity onPress={() => setActiveLegalTab(null)} style={styles.backAction}>
                                    <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                                </TouchableOpacity>
                            ) : null}
                            <Text style={styles.fullModalTitle}>{activeLegalTab ? legalContent[activeLegalTab].title : 'Legal'}</Text>
                            <TouchableOpacity onPress={() => { setShowLegalModal(false); setActiveLegalTab(null); }}>
                                <Ionicons name="close" size={26} color={COLORS.black} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.fullModalBody}>
                            {activeLegalTab ? (
                                <View style={styles.legalDetail}>
                                    <Text style={styles.legalDetailText}>{legalContent[activeLegalTab].content}</Text>
                                </View>
                            ) : (
                                <>
                                    <LegalItem title="Terms of Service" onPress={() => setActiveLegalTab('terms')} />
                                    <LegalItem title="Privacy Policy" onPress={() => setActiveLegalTab('privacy')} />
                                    <LegalItem title="Data Usage Policy" onPress={() => setActiveLegalTab('data')} />
                                    <LegalItem title="Software Licenses" onPress={() => setActiveLegalTab('licenses')} />
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Edit Modal */}
            <Modal
                visible={showEditModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <Ionicons name="close" size={26} color={COLORS.black} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editForm.name}
                                    onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                                    placeholder="Your Name"
                                    placeholderTextColor={COLORS.textTertiary}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Email Address</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editForm.email}
                                    onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                                    placeholder="your@email.com"
                                    placeholderTextColor={COLORS.textTertiary}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Phone Number</Text>
                                <TextInput
                                    style={[styles.input, styles.inputDisabled]}
                                    value={editForm.mobile}
                                    editable={false}
                                />
                                <Text style={styles.inputHint}>Phone number cannot be changed</Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                                onPress={handleSaveProfile}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color={COLORS.white} />
                                ) : (
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function ProfileMenuItem({ icon, label, onPress }) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuItemLeft}>
                <Ionicons name={icon} size={20} color={COLORS.black} />
                <Text style={styles.menuItemLabel}>{label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
    );
}

function HelpSection({ title, items }) {
    return (
        <View style={styles.helpSection}>
            <Text style={styles.helpSectionTitle}>{title}</Text>
            {items.map((item, id) => (
                <View key={id} style={styles.helpItem}>
                    <Text style={styles.helpQ}>{item.q}</Text>
                    <Text style={styles.helpA}>{item.a}</Text>
                </View>
            ))}
        </View>
    );
}

function SafetyItem({ icon, title, desc }) {
    return (
        <View style={styles.safetyItem}>
            <Ionicons name={icon} size={24} color={COLORS.black} />
            <View style={styles.safetyInfo}>
                <Text style={styles.safetyItemTitle}>{title}</Text>
                <Text style={styles.safetyItemDesc}>{desc}</Text>
            </View>
        </View>
    );
}

function LegalItem({ title, onPress }) {
    return (
        <TouchableOpacity style={styles.legalItem} onPress={onPress}>
            <Text style={styles.legalItemText}>{title}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    header: {
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
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
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.black,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: COLORS.greyLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.black,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.black,
    },
    userPhone: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    editBadge: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.greyLight,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
        marginTop: 8,
    },
    editBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.black,
    },

    // Payment Section
    paymentSection: {
        marginBottom: 32,
    },
    paymentCard: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
            android: { elevation: 2 }
        })
    },
    paymentCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    paymentSecureText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.accent,
    },
    paymentDesc: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 12,
    },
    paymentIcons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    paymentTag: {
        backgroundColor: COLORS.greyLight,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 4,
    },
    paymentTagText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },

    menuSection: {
        marginBottom: 32,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    menuItemLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.black,
    },
    logoutButton: {
        marginTop: 8,
        paddingVertical: 16,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.red,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: COLORS.textTertiary,
        marginTop: 32,
    },

    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: height * 0.7,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.black,
    },
    modalScroll: {
        padding: 24,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.black,
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
    addressItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    addressIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.greyLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    addressInfo: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.black,
    },
    addressText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },

    // Full Screen Modals (Help, Safety, Legal)
    fullModalOverlay: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    fullModalContainer: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
    },
    fullModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    fullModalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.black,
    },
    fullModalBody: {
        flex: 1,
        padding: 24,
    },
    backAction: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    helpSection: {
        marginBottom: 32,
    },
    helpSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.black,
        marginBottom: 16,
    },
    helpItem: {
        marginBottom: 20,
    },
    helpQ: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.black,
    },
    helpA: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
        lineHeight: 20,
    },
    contactBtn: {
        backgroundColor: COLORS.black,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 12,
        gap: 12,
        marginTop: 20,
    },
    contactBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    safetyCard: {
        backgroundColor: COLORS.greyLight,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 32,
    },
    safetyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.black,
        marginTop: 16,
        marginBottom: 8,
    },
    safetyDesc: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    safetyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        marginBottom: 24,
        padding: 16,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    safetyInfo: {
        flex: 1,
    },
    safetyItemTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.black,
    },
    safetyItemDesc: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    legalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    legalItemText: {
        fontSize: 16,
        color: COLORS.black,
    },
    legalDetail: {
        paddingTop: 8,
    },
    legalDetailText: {
        fontSize: 15,
        color: COLORS.textSecondary,
        lineHeight: 24,
    },

    // Edit Profile Specific
    modalBody: {
        padding: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        color: COLORS.black,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    inputDisabled: {
        opacity: 0.6,
    },
    inputHint: {
        fontSize: 11,
        color: COLORS.textTertiary,
        marginTop: 6,
    },
    saveButton: {
        backgroundColor: COLORS.black,
        height: 56,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
});
