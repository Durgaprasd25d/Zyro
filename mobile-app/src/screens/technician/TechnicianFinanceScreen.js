import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    TextInput, 
    ActivityIndicator, 
    Alert, 
    FlatList,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import technicianService from '../../services/technicianService';
import axios from 'axios';

export default function TechnicianFinanceScreen({ navigation, route }) {
    const [view, setView] = useState(route?.params?.initialView || 'WALLET'); // 'WALLET' or 'WITHDRAW'
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Wallet State
    const [balance, setBalance] = useState(0);
    const [commissionDue, setCommissionDue] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    
    // Withdrawal Form State
    const [amount, setAmount] = useState('');
    const [payoutMethod, setPayoutMethod] = useState('bank');
    const [bankDetails, setBankDetails] = useState({
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
        bankName: '',
        branchName: ''
    });
    const [upiId, setUpiId] = useState('');
    const [isIFSCValidating, setIsIFSCValidating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [walletInfo, setWalletInfo] = useState({ kycVerified: false, adminVerified: false });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [walletRes, withdrawalRes, dashRes, userRes] = await Promise.all([
                technicianService.getWallet(),
                technicianService.getWithdrawalHistory(),
                technicianService.getTechnicianDashboard(),
                technicianService.getUserData()
            ]);

            if (walletRes.success) {
                setBalance(walletRes.balance);
                setCommissionDue(walletRes.commissionDue);
                setTransactions(walletRes.transactions || []);
                setWalletInfo({
                    kycVerified: walletRes.kycVerified || false,
                    adminVerified: walletRes.adminVerified || false
                });
            }

            if (withdrawalRes.success) {
                setWithdrawals(withdrawalRes.withdrawals || []);
            }

            // Pre-fill bank details if available
            const existingBank = dashRes?.data?.wallet?.bankDetails || dashRes?.technician?.verification?.bankDetails || {};
            setBankDetails(prev => ({
                ...prev,
                ...existingBank,
                accountHolderName: existingBank.accountHolderName || userRes?.name || ''
            }));

        } catch (error) {
            console.error('Finance load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleIFSCChange = async (val) => {
        const code = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
        setBankDetails({ ...bankDetails, ifscCode: code });
        if (code.length === 11) {
            setIsIFSCValidating(true);
            try {
                const response = await axios.get(`https://ifsc.razorpay.com/${code}`);
                if (response.data) {
                    setBankDetails(prev => ({
                        ...prev,
                        bankName: response.data.BANK,
                        branchName: response.data.BRANCH
                    }));
                }
            } catch (error) {
                setBankDetails(prev => ({ ...prev, bankName: '', branchName: '' }));
            } finally {
                setIsIFSCValidating(false);
            }
        }
    };

    const handleWithdraw = async () => {
        const numAmount = parseFloat(amount);
        if (!amount || numAmount < 100) {
            Alert.alert('Error', 'Minimum withdrawal is ₹100');
            return;
        }
        if (numAmount > balance) {
            Alert.alert('Error', 'Insufficient balance');
            return;
        }
        if (commissionDue > 0) {
            Alert.alert('Restricted', 'Clear pending commission before withdrawing');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                amount: numAmount,
                payoutMethod,
                bankDetails: payoutMethod === 'bank' ? bankDetails : undefined,
                upiId: payoutMethod === 'upi' ? upiId : undefined
            };

            const res = await technicianService.withdrawMoneyEnhanced(payload);
            if (res.success) {
                Alert.alert('Success', 'Withdrawal request submitted');
                setAmount('');
                setView('WALLET');
                loadData();
            } else {
                Alert.alert('Error', res.message || 'Withdrawal failed');
            }
        } catch (error) {
            Alert.alert('Error', 'Server communication error');
        } finally {
            setSubmitting(false);
        }
    };

    const renderTransaction = ({ item }) => (
        <View style={styles.transItem}>
            <View style={styles.transIconBox}>
                <Ionicons 
                    name={item.type === 'credit' ? 'arrow-down' : 'arrow-up'} 
                    size={20} 
                    color={COLORS.bw_black} 
                />
            </View>
            <View style={styles.transContent}>
                <Text style={styles.transDesc}>{item.description?.toUpperCase()}</Text>
                <Text style={styles.transDate}>{item.date || new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.transAmount, { color: item.type === 'credit' ? '#000' : '#666' }]}>
                {item.type === 'credit' ? '+' : '-'}₹{item.amount}
            </Text>
        </View>
    );

    const renderWithdrawal = ({ item }) => (
        <View style={styles.withdrawalItem}>
            <View style={styles.withdrawalInfo}>
                <Text style={styles.withdrawalAmount}>₹{item.amount}</Text>
                <Text style={styles.withdrawalDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={[styles.statusTag, { backgroundColor: item.status === 'completed' ? '#000' : '#f2f2f2' }]}>
                <Text style={[styles.statusText, { color: item.status === 'completed' ? '#fff' : '#000' }]}>
                    {item.status.toUpperCase()}
                </Text>
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Ionicons name="chevron-back" size={24} color={COLORS.bw_black} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>FINANCE CENTER</Text>
                <TouchableOpacity onPress={onRefresh} style={styles.iconButton}>
                    <Ionicons name="refresh" size={20} color={COLORS.bw_black} />
                </TouchableOpacity>
            </View>

            <View style={styles.tabBar}>
                <TouchableOpacity 
                    style={[styles.tab, view === 'WALLET' && styles.activeTab]} 
                    onPress={() => setView('WALLET')}
                >
                    <Text style={[styles.tabText, view === 'WALLET' && styles.activeTabText]}>WALLET</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, view === 'WITHDRAW' && styles.activeTab]} 
                    onPress={() => setView('WITHDRAW')}
                >
                    <Text style={[styles.tabText, view === 'WITHDRAW' && styles.activeTabText]}>PAYOUT</Text>
                </TouchableOpacity>
            </View>

            {view === 'WALLET' ? (
                <FlatList
                    data={transactions}
                    renderItem={renderTransaction}
                    keyExtractor={(item, index) => item._id || index.toString()}
                    ListHeaderComponent={
                        <View style={styles.walletHeader}>
                            <View style={styles.balanceSection}>
                                <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
                                <Text style={styles.balanceValue}>₹{balance.toLocaleString()}</Text>
                                {commissionDue > 0 && (
                                    <View style={styles.dueBadge}>
                                        <Text style={styles.dueText}>DUE: ₹{commissionDue}</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.actionSection}>
                                <TouchableOpacity style={styles.mainActionBtn} onPress={() => setView('WITHDRAW')}>
                                    <Ionicons name="card" size={20} color={COLORS.bw_white} />
                                    <Text style={styles.mainActionBtnText}>WITHDRAW NOW</Text>
                                </TouchableOpacity>
                                {commissionDue > 0 && (
                                    <TouchableOpacity 
                                        style={styles.secActionBtn}
                                        onPress={() => navigation.navigate('PayCommission', { amount: commissionDue })}
                                    >
                                        <Text style={styles.secActionBtnText}>PAY DUES</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {withdrawals.length > 0 && (
                                <View style={styles.historySection}>
                                    <Text style={styles.sectionLabel}>RECENT WITHDRAWALS</Text>
                                    <FlatList
                                        data={withdrawals.slice(0, 3)}
                                        renderItem={renderWithdrawal}
                                        keyExtractor={(item, index) => item._id || index.toString()}
                                        scrollEnabled={false}
                                    />
                                </View>
                            )}
                            
                            <Text style={styles.sectionLabel}>TRANSACTION LOG</Text>
                        </View>
                    }
                    contentContainerStyle={styles.listContent}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            ) : (
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.withdrawContent}>
                        <View style={styles.withdrawInfo}>
                            <Text style={styles.withdrawInfoTitle}>Payout Request</Text>
                            <Text style={styles.withdrawInfoSub}>Minimum amount: ₹100. Verification takes 24-48h.</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>AMOUNT TO WITHDRAW (₹)</Text>
                            <TextInput 
                                style={styles.amountInput}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                placeholder="0.00"
                                placeholderTextColor={COLORS.bw_greyMedium}
                            />
                        </View>

                        <Text style={styles.label}>SELECT METHOD</Text>
                        <View style={styles.methodToggle}>
                            <TouchableOpacity 
                                style={[styles.methodBtn, payoutMethod === 'bank' && styles.activeMethod]}
                                onPress={() => setPayoutMethod('bank')}
                            >
                                <Text style={[styles.methodText, payoutMethod === 'bank' && styles.activeMethodText]}>BANK TRANSFER</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.methodBtn, payoutMethod === 'upi' && styles.activeMethod]}
                                onPress={() => setPayoutMethod('upi')}
                            >
                                <Text style={[styles.methodText, payoutMethod === 'upi' && styles.activeMethodText]}>UPI ADDRESS</Text>
                            </TouchableOpacity>
                        </View>

                        {payoutMethod === 'bank' ? (
                            <View style={styles.formContainer}>
                                <Text style={styles.fieldLabel}>IFSC</Text>
                                <View style={styles.ifscWrapper}>
                                    <TextInput 
                                        style={[styles.fieldInput, { flex: 1 }]}
                                        value={bankDetails.ifscCode}
                                        onChangeText={handleIFSCChange}
                                        autoCapitalize="characters"
                                        maxLength={11}
                                    />
                                    {isIFSCValidating && <ActivityIndicator color="#000" size="small" />}
                                </View>
                                {bankDetails.bankName ? <Text style={styles.bankNameHint}>{bankDetails.bankName}</Text> : null}
                                
                                <Text style={styles.fieldLabel}>ACCOUNT NUMBER</Text>
                                <TextInput 
                                    style={styles.fieldInput}
                                    value={bankDetails.accountNumber}
                                    onChangeText={(t) => setBankDetails({...bankDetails, accountNumber: t})}
                                    keyboardType="numeric"
                                />

                                <Text style={styles.fieldLabel}>ACCOUNT HOLDER NAME</Text>
                                <TextInput 
                                    style={styles.fieldInput}
                                    value={bankDetails.accountHolderName}
                                    onChangeText={(t) => setBankDetails({...bankDetails, accountHolderName: t})}
                                    autoCapitalize="words"
                                />
                            </View>
                        ) : (
                            <View style={styles.formContainer}>
                                <Text style={styles.fieldLabel}>VPA / UPI ID</Text>
                                <TextInput 
                                    style={styles.fieldInput}
                                    value={upiId}
                                    onChangeText={setUpiId}
                                    placeholder="username@bank"
                                    autoCapitalize="none"
                                />
                            </View>
                        )}

                        <TouchableOpacity 
                            style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
                            onPress={handleWithdraw}
                            disabled={submitting}
                        >
                            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>CONFIRM WITHDRAWAL</Text>}
                        </TouchableOpacity>
                        
                        {!walletInfo.kycVerified && (
                            <Text style={styles.warningText}>• KYC Verification must be completed to receive payouts.</Text>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bw_white },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bw_white },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: SPACING.lg, 
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.bw_border
    },
    headerTitle: { fontSize: 13, fontWeight: '900', color: COLORS.bw_black, letterSpacing: 3 },
    iconButton: { padding: 8 },
    tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.bw_border },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
    activeTab: { borderBottomWidth: 2, borderBottomColor: COLORS.bw_black },
    tabText: { fontSize: 12, fontWeight: 'bold', color: COLORS.bw_greyMedium, letterSpacing: 1 },
    activeTabText: { color: COLORS.bw_black },
    listContent: { padding: SPACING.lg },
    walletHeader: { marginBottom: 30 },
    balanceSection: { 
        backgroundColor: COLORS.bw_black, 
        padding: 30, 
        borderRadius: 4, 
        alignItems: 'center',
        marginVertical: 10
    },
    balanceLabel: { color: COLORS.bw_greyMedium, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    balanceValue: { color: COLORS.bw_white, fontSize: 36, fontWeight: '900', marginTop: 10 },
    dueBadge: { backgroundColor: '#333', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 2, marginTop: 15 },
    dueText: { color: COLORS.bw_white, fontSize: 10, fontWeight: 'bold' },
    actionSection: { flexDirection: 'row', gap: 10, marginTop: 20 },
    mainActionBtn: { 
        flex: 2, 
        flexDirection: 'row', 
        backgroundColor: COLORS.bw_black, 
        padding: 18, 
        borderRadius: 4, 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 10
    },
    mainActionBtnText: { color: COLORS.bw_white, fontWeight: '900', letterSpacing: 1, fontSize: 12 },
    secActionBtn: { 
        flex: 1, 
        borderWidth: 2, 
        borderColor: COLORS.bw_black, 
        borderRadius: 4, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    secActionBtnText: { color: COLORS.bw_black, fontWeight: '900', fontSize: 11 },
    sectionLabel: { fontSize: 10, fontWeight: '900', color: COLORS.bw_greyMedium, letterSpacing: 2, marginTop: 40, marginBottom: 15 },
    transItem: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingVertical: 15, 
        borderBottomWidth: 1, 
        borderBottomColor: COLORS.bw_greyLight 
    },
    transIconBox: { width: 36, height: 36, borderRadius: 2, backgroundColor: COLORS.bw_greyLight, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    transContent: { flex: 1 },
    transDesc: { fontSize: 12, fontWeight: 'bold', color: COLORS.bw_black },
    transDate: { fontSize: 10, color: COLORS.grey, marginTop: 2 },
    transAmount: { fontSize: 14, fontWeight: '900' },
    historySection: { marginBottom: 20 },
    withdrawalItem: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 15, 
        borderWidth: 1, 
        borderColor: COLORS.bw_border, 
        borderRadius: 4,
        marginBottom: 8
    },
    withdrawalAmount: { fontSize: 14, fontWeight: 'bold' },
    withdrawalDate: { fontSize: 10, color: COLORS.grey, marginTop: 2 },
    statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 2 },
    statusText: { fontSize: 9, fontWeight: '900' },
    
    withdrawContent: { padding: SPACING.lg },
    withdrawInfo: { marginBottom: 30 },
    withdrawInfoTitle: { fontSize: 24, fontWeight: '900', color: COLORS.bw_black },
    withdrawInfoSub: { fontSize: 12, color: COLORS.grey, marginTop: 5 },
    inputGroup: { marginBottom: 30 },
    label: { fontSize: 10, fontWeight: '900', color: COLORS.bw_black, letterSpacing: 1, marginBottom: 15 },
    amountInput: { 
        fontSize: 48, 
        fontWeight: '900', 
        color: COLORS.bw_black, 
        borderBottomWidth: 4, 
        borderBottomColor: COLORS.bw_black,
        paddingBottom: 10
    },
    methodToggle: { flexDirection: 'row', gap: 10, marginBottom: 30 },
    methodBtn: { 
        flex: 1, 
        padding: 15, 
        borderWidth: 1, 
        borderColor: COLORS.bw_border, 
        borderRadius: 4, 
        alignItems: 'center' 
    },
    activeMethod: { backgroundColor: COLORS.bw_black, borderColor: COLORS.bw_black },
    methodText: { fontSize: 10, fontWeight: 'bold', color: COLORS.bw_greyMedium },
    activeMethodText: { color: COLORS.bw_white },
    formContainer: { marginBottom: 30 },
    fieldLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.grey, marginBottom: 8, marginTop: 20 },
    fieldInput: { 
        backgroundColor: COLORS.bw_greyLight, 
        padding: 16, 
        borderRadius: 4, 
        fontSize: 16, 
        color: COLORS.bw_black,
        borderWidth: 1,
        borderColor: COLORS.bw_border
    },
    ifscWrapper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    bankNameHint: { fontSize: 11, color: COLORS.bw_black, marginTop: 8, fontWeight: 'bold' },
    submitBtn: { 
        backgroundColor: COLORS.bw_black, 
        padding: 20, 
        borderRadius: 4, 
        alignItems: 'center', 
        marginTop: 10 
    },
    submitBtnText: { color: COLORS.bw_white, fontWeight: '900', letterSpacing: 2 },
    warningText: { fontSize: 11, color: COLORS.grey, marginTop: 20, textAlign: 'center' }
});
