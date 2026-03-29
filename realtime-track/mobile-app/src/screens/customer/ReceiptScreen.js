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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import rideService from '../../services/rideService';

const { width } = Dimensions.get('window');

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
};

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

            // Capture the receipt as image
            const uri = await receiptRef.current.capture();

            // Save to file system
            const filename = `receipt_${receiptData.bookingId}_${Date.now()}.png`;
            const fileUri = FileSystem.documentDirectory + filename;

            await FileSystem.moveAsync({
                from: uri,
                to: fileUri
            });

            // Share the file
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
🧾 Receipt - ${receiptData.company.name}

Service: ${receiptData.serviceType?.toUpperCase() || 'AC'} SERVICE
Booking ID: #${receiptData.bookingId?.substring(0, 10).toUpperCase()}
Date: ${new Date(receiptData.bookingDate).toLocaleDateString()}

━━━━━━━━━━━━━━━━━━━━
BILLING DETAILS
━━━━━━━━━━━━━━━━━━━━
Service Charge: ₹${Math.round(receiptData.billing.serviceCharge)}
Platform Fee: ₹${Math.round(receiptData.billing.platformFee)}
GST (${receiptData.billing.gstPercentage}%): ₹${Math.round(receiptData.billing.gst)}

Total Amount: ₹${Math.round(receiptData.billing.totalAmount)}
━━━━━━━━━━━━━━━━━━━━

Payment: ${receiptData.payment.method} - ${receiptData.payment.status}
Location: ${receiptData.location || 'N/A'}

${receiptData.company.website}
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
                <ActivityIndicator size="large" color={COLORS.black} />
                <Text style={styles.loaderText}>Generating receipt...</Text>
            </View>
        );
    }

    if (!receiptData) {
        return (
            <View style={styles.loaderContainer}>
                <Ionicons name="document-text-outline" size={60} color={COLORS.textTertiary} />
                <Text style={styles.errorText}>Receipt not found</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backIcon}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={COLORS.black} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Receipt</Text>
                    <TouchableOpacity
                        style={styles.shareIcon}
                        onPress={handleShare}
                    >
                        <Ionicons name="share-social-outline" size={24} color={COLORS.black} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Thermal Receipt for Capture */}
                <ViewShot ref={receiptRef} options={{ format: 'png', quality: 1.0 }}>
                    <View style={styles.receiptCard}>
                        {/* Company Section */}
                        <View style={styles.companyInfo}>
                            <Text style={styles.companyName}>{receiptData.company.name}</Text>
                            <Text style={styles.companySub}>{receiptData.company.website}</Text>
                        </View>

                        <View style={styles.divider} />

                        {/* Booking Details */}
                        <View style={styles.detailsGrid}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>DATE</Text>
                                <Text style={styles.detailValue}>
                                    {new Date(receiptData.bookingDate).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>BOOKING ID</Text>
                                <Text style={styles.detailValue}>#{receiptData.bookingId?.substring(0, 10).toUpperCase()}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        {/* Items Section */}
                        <View style={styles.itemsSection}>
                            <View style={styles.itemRow}>
                                <Text style={styles.itemName}>{receiptData.serviceType?.toUpperCase()} SERVICE</Text>
                                <Text style={styles.itemPrice}>₹{Math.round(receiptData.billing.serviceCharge)}</Text>
                            </View>
                            <View style={styles.itemRow}>
                                <Text style={styles.itemLabel}>Platform Fee</Text>
                                <Text style={styles.itemValue}>₹{Math.round(receiptData.billing.platformFee)}</Text>
                            </View>
                            <View style={styles.itemRow}>
                                <Text style={styles.itemLabel}>GST ({receiptData.billing.gstPercentage}%)</Text>
                                <Text style={styles.itemValue}>₹{Math.round(receiptData.billing.gst)}</Text>
                            </View>
                        </View>

                        <View style={styles.heavyDivider} />

                        {/* Total Section */}
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                            <Text style={styles.totalValue}>₹{Math.round(receiptData.billing.totalAmount)}</Text>
                        </View>

                        {/* Payment Info */}
                        <View style={styles.paymentBadge}>
                            <Ionicons name="shield-checkmark" size={14} color={COLORS.accent} />
                            <Text style={styles.paymentStatus}>Paid via {receiptData.payment.method}</Text>
                        </View>

                        <View style={styles.divider} />

                        {/* QR Code Section */}
                        <View style={styles.qrSection}>
                            <QRCode
                                value={receiptData.company.website}
                                size={80}
                                color="#000000"
                                backgroundColor="#ffffff"
                            />
                            <Text style={styles.qrLabel}>Scan to verify authenticity</Text>
                        </View>

                        <Text style={styles.thankYouText}>Thank you for choosing ZyroAC</Text>
                    </View>
                </ViewShot>

                {/* Footer Actions */}
                <View style={styles.footerActions}>
                    <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={handleDownload}
                        disabled={downloading}
                    >
                        {downloading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <>
                                <Ionicons name="download-outline" size={20} color={COLORS.white} />
                                <Text style={styles.downloadButtonText}>Save Receipt as JPG</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={() => navigation.navigate('Home')}
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
        backgroundColor: COLORS.background,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
    },
    loaderText: {
        marginTop: 16,
        fontSize: 14,
        color: COLORS.textSecondary,
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
    backIcon: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    shareIcon: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.black,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    receiptCard: {
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 24,
    },
    companyInfo: {
        alignItems: 'center',
        marginBottom: 24,
    },
    companyName: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.black,
        letterSpacing: 0.5,
    },
    companySub: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 20,
        borderStyle: 'dashed',
    },
    heavyDivider: {
        height: 2,
        backgroundColor: COLORS.black,
        marginVertical: 20,
    },
    detailsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.textTertiary,
        letterSpacing: 1,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.black,
    },
    itemsSection: {
        gap: 12,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.black,
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.black,
    },
    itemLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    itemValue: {
        fontSize: 14,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.black,
    },
    totalValue: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.black,
    },
    paymentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    paymentStatus: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.accent,
    },
    qrSection: {
        alignItems: 'center',
        marginTop: 8,
    },
    qrLabel: {
        fontSize: 10,
        color: COLORS.textTertiary,
        marginTop: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    thankYouText: {
        textAlign: 'center',
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 32,
        fontStyle: 'italic',
    },
    footerActions: {
        gap: 12,
        marginBottom: 40,
    },
    downloadButton: {
        backgroundColor: COLORS.black,
        height: 56,
        borderRadius: 10,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    downloadButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    homeButton: {
        backgroundColor: COLORS.white,
        height: 56,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.black,
        justifyContent: 'center',
        alignItems: 'center',
    },
    homeButtonText: {
        color: COLORS.black,
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 16,
    },
    backButton: {
        marginTop: 24,
        paddingHorizontal: 32,
        paddingVertical: 12,
        backgroundColor: COLORS.black,
        borderRadius: 8,
    },
    backButtonText: {
        color: COLORS.white,
        fontWeight: '600',
    }
});
