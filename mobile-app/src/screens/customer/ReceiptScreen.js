import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Share,
    Platform,
    Dimensions,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import rideService from '../../services/rideService';
import { DESIGN_COLORS as C, DESIGN_TYPOGRAPHY as TY } from '../../constants/designSystem';

const { width } = Dimensions.get('window');

export default function ReceiptScreen({ route, navigation }) {
    const { rideId } = route.params;
    const [loading, setLoading] = useState(true);
    const [receiptData, setReceiptData] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const receiptRef = useRef();

    useEffect(() => {
        fetchReceiptData();
    }, []);

    const fetchReceiptData = async () => {
        setLoading(true);
        const result = await rideService.getReceipt(rideId);
        if (result.success) {
            setReceiptData(result.data);
        } else {
            Alert.alert('Error', result.error || 'Failed to load receipt');
        }
        setLoading(false);
    };

    const handleDownload = async () => {
        try {
            setDownloading(true);
            const uri = await receiptRef.current.capture();

            const filename = `receipt_${receiptData.bookingId}_${Date.now()}.png`;
            const fileUri = FileSystem.documentDirectory + filename;

            await FileSystem.moveAsync({
                from: uri,
                to: fileUri
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Share Receipt'
                });
            } else {
                Alert.alert('Success', 'Receipt saved successfully!');
            }

            setDownloading(false);
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Failed to download receipt');
            setDownloading(false);
        }
    };

    const handleShare = async () => {
        if (!receiptData) return;

        const message = `
🧾 Receipt - ${receiptData.company?.name || 'ZyroAC'}
Service: ${(receiptData.serviceType || 'AC SERVICE').toUpperCase()}
Booking ID: #${(receiptData.bookingId || '').substring(0, 10).toUpperCase()}
Date: ${new Date(receiptData.bookingDate || Date.now()).toLocaleDateString()}

━━━━━━━━━━━━━━━━━━━━
BILLING DETAILS
━━━━━━━━━━━━━━━━━━━━
Service Charge: ₹${Math.round(receiptData.billing?.serviceCharge || 1)}
Platform Fee: ₹${Math.round(receiptData.billing?.platformFee || 0)}
GST (${receiptData.billing?.gstPercentage || 0}%): ₹${Math.round(receiptData.billing?.gst || 0)}

Total Amount: ₹${Math.round(receiptData.billing?.totalAmount || 1)}
━━━━━━━━━━━━━━━━━━━━

Payment: ${receiptData.payment?.method || 'CASH'} - ${receiptData.payment?.status || 'PAID'}
Location: ${receiptData.location || 'N/A'}
        `.trim();

        try {
            await Share.share({ message });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={styles.loaderText}>Generating official receipt...</Text>
            </View>
        );
    }

    if (!receiptData) {
        return (
            <View style={styles.loaderContainer}>
                <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
                <Ionicons name="document-text-outline" size={60} color={C.onSurfaceVariant} />
                <Text style={styles.errorText}>Receipt not found</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />

            {/* Dark Theme Header */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backIcon}
                        onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={24} color={C.onSurface} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Official Receipt</Text>
                    <TouchableOpacity
                        style={styles.shareIcon}
                        onPress={handleShare}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="share-social-outline" size={22} color={C.primary} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Dark Luxury Receipt Card */}
                <ViewShot ref={receiptRef} options={{ format: 'png', quality: 1.0 }}>
                    <View style={styles.receiptCard}>
                        {/* Company Section */}
                        <View style={styles.companyInfo}>
                            <Text style={styles.companyName}>{receiptData.company?.name || 'Zyro AC'}</Text>
                            <Text style={styles.companySub}>{receiptData.company?.website || 'zyro.app'}</Text>
                        </View>

                        <View style={styles.divider} />

                        {/* Booking Details */}
                        <View style={styles.detailsGrid}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>DATE</Text>
                                <Text style={styles.detailValue}>
                                    {new Date(receiptData.bookingDate || Date.now()).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>BOOKING ID</Text>
                                <Text style={styles.detailValue}>#{(receiptData.bookingId || '').substring(0, 10).toUpperCase()}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Items Section */}
                        <View style={styles.itemsSection}>
                            <View style={styles.itemRow}>
                                <Text style={styles.itemName}>{(receiptData.serviceType || 'AC').toUpperCase()} SERVICE</Text>
                                <Text style={styles.itemPrice}>₹{Math.round(receiptData.billing?.serviceCharge || 1)}</Text>
                            </View>
                            <View style={styles.itemRow}>
                                <Text style={styles.itemLabel}>Platform Fee</Text>
                                <Text style={styles.itemValue}>₹{Math.round(receiptData.billing?.platformFee || 0)}</Text>
                            </View>
                            <View style={styles.itemRow}>
                                <Text style={styles.itemLabel}>GST ({receiptData.billing?.gstPercentage || 0}%)</Text>
                                <Text style={styles.itemValue}>₹{Math.round(receiptData.billing?.gst || 0)}</Text>
                            </View>
                        </View>

                        <View style={styles.heavyDivider} />

                        {/* Total Section */}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>TOTAL PAID</Text>
                            <Text style={styles.totalValue}>₹{Math.round(receiptData.billing?.totalAmount || 1)}</Text>
                        </View>

                        {/* Payment Info */}
                        <View style={styles.paymentBadge}>
                            <Ionicons name="shield-checkmark" size={14} color={C.primary} />
                            <Text style={styles.paymentStatus}>Paid via {receiptData.payment?.method || 'CASH'}</Text>
                        </View>

                        <View style={styles.divider} />

                        {/* QR Code Section */}
                        <View style={styles.qrSection}>
                            <View style={styles.qrBox}>
                                <QRCode
                                    value={receiptData.company?.website || 'zyro.app'}
                                    size={80}
                                    color="#0D0D0D"
                                    backgroundColor="#FFFFFF"
                                />
                            </View>
                            <Text style={styles.qrLabel}>Scan to verify authenticity</Text>
                        </View>

                        <Text style={styles.thankYouText}>Thank you for choosing Zyro</Text>
                    </View>
                </ViewShot>

                {/* Footer Actions */}
                <View style={styles.footerActions}>
                    <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={handleDownload}
                        disabled={downloading}
                        activeOpacity={0.8}
                    >
                        {downloading ? (
                            <ActivityIndicator color={C.onPrimary} />
                        ) : (
                            <>
                                <Ionicons name="download-outline" size={20} color={C.onPrimary} />
                                <Text style={styles.downloadButtonText}>Save Receipt PNG</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={() => navigation.navigate('Home')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.homeButtonText}>Return to Dashboard</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D0D',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0D0D0D',
    },
    loaderText: {
        marginTop: 16,
        fontSize: 14,
        color: C.onSurfaceVariant,
    },
    errorText: {
        fontSize: 16,
        color: C.onSurfaceVariant,
        marginVertical: 16,
    },
    backButton: {
        backgroundColor: C.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    backButtonText: {
        color: C.onPrimary,
        fontWeight: '700',
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
    backIcon: {
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
        fontWeight: '700',
        color: C.onSurface,
    },
    shareIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#161616',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#262626',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    receiptCard: {
        backgroundColor: '#141414',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#222222',
        padding: 24,
    },
    companyInfo: {
        alignItems: 'center',
    },
    companyName: {
        fontSize: 22,
        fontWeight: '900',
        color: C.primary,
        letterSpacing: 2,
    },
    companySub: {
        fontSize: 12,
        color: C.onSurfaceVariant,
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#222222',
        marginVertical: 16,
    },
    heavyDivider: {
        height: 2,
        backgroundColor: C.primary,
        marginVertical: 16,
    },
    detailsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        color: C.onSurfaceVariant,
        fontWeight: '600',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '700',
        color: C.onSurface,
    },
    itemsSection: {
        gap: 10,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemName: {
        fontSize: 15,
        fontWeight: '700',
        color: C.onSurface,
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: '800',
        color: C.primary,
    },
    itemLabel: {
        fontSize: 13,
        color: C.onSurfaceVariant,
    },
    itemValue: {
        fontSize: 13,
        color: C.onSurface,
        fontWeight: '600',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: '800',
        color: C.onSurface,
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '900',
        color: C.primary,
    },
    paymentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#1B1B1B',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginTop: 14,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#262626',
    },
    paymentStatus: {
        fontSize: 12,
        fontWeight: '700',
        color: C.onSurface,
    },
    qrSection: {
        alignItems: 'center',
        marginVertical: 10,
    },
    qrBox: {
        padding: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },
    qrLabel: {
        fontSize: 11,
        color: C.onSurfaceVariant,
        marginTop: 8,
    },
    thankYouText: {
        fontSize: 12,
        color: C.onSurfaceVariant,
        textAlign: 'center',
        fontWeight: '600',
        marginTop: 12,
    },
    footerActions: {
        marginTop: 20,
        gap: 12,
    },
    downloadButton: {
        backgroundColor: C.primary,
        height: 52,
        borderRadius: 26,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    downloadButtonText: {
        color: C.onPrimary,
        fontSize: 15,
        fontWeight: '800',
    },
    homeButton: {
        backgroundColor: '#141414',
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#222222',
    },
    homeButtonText: {
        color: C.onSurface,
        fontSize: 15,
        fontWeight: '700',
    },
});
