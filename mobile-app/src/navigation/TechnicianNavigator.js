import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

/**
 * Modular Technician Screens with lazy getComponent loaders
 */
export const renderTechnicianScreens = (NavStack) => [
    <NavStack.Screen
        key="TechnicianDashboard"
        name="TechnicianDashboard"
        getComponent={() => require('../screens/technician/TechnicianDashboardScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="Driver"
        name="Driver"
        getComponent={() => require('../screens/technician/TechnicianDashboardScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="JobRequest"
        name="JobRequest"
        getComponent={() => require('../screens/technician/JobRequestScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="JobDetails"
        name="JobDetails"
        getComponent={() => require('../screens/technician/JobDetailsScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="Arrival"
        name="Arrival"
        getComponent={() => require('../screens/technician/ArrivalScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="TechnicianServiceProgress"
        name="TechnicianServiceProgress"
        getComponent={() => require('../screens/technician/ServiceProgressScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="CODCollection"
        name="CODCollection"
        getComponent={() => require('../screens/technician/CODCollectionScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="TechnicianOTP"
        name="TechnicianOTP"
        getComponent={() => require('../screens/technician/TechnicianOTPScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="WalletUpdate"
        name="WalletUpdate"
        getComponent={() => require('../screens/technician/WalletUpdateScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="TechnicianWallet"
        name="TechnicianWallet"
        getComponent={() => require('../screens/technician/TechnicianFinanceScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="CommissionPayment"
        name="CommissionPayment"
        getComponent={() => require('../screens/technician/CommissionPaymentScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="PayCommission"
        name="PayCommission"
        getComponent={() => require('../screens/technician/PayCommissionScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="CommissionPaid"
        name="CommissionPaid"
        getComponent={() => require('../screens/technician/CommissionPaidScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="TechnicianHistory"
        name="TechnicianHistory"
        getComponent={() => require('../screens/technician/TechnicianHistoryScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="WithdrawalRequest"
        name="WithdrawalRequest"
        getComponent={() => require('../screens/technician/TechnicianFinanceScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="TechnicianProfile"
        name="TechnicianProfile"
        getComponent={() => require('../screens/technician/TechnicianProfileScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="TechnicianNavigation"
        name="TechnicianNavigation"
        getComponent={() => require('../screens/technician/TechnicianNavigationScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="RazorpayCheckout"
        name="RazorpayCheckout"
        getComponent={() => require('../screens/technician/RazorpayCheckoutScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="KYC"
        name="KYC"
        getComponent={() => require('../screens/technician/KYCScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="VerificationPending"
        name="VerificationPending"
        getComponent={() => require('../screens/technician/VerificationPendingScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="PersonalDetails"
        name="PersonalDetails"
        getComponent={() => require('../screens/technician/PersonalDetailsScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="ChangePassword"
        name="ChangePassword"
        getComponent={() => require('../screens/technician/ChangePasswordScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="Support"
        name="Support"
        getComponent={() => require('../screens/technician/SupportScreen').default}
        options={{ headerShown: false }}
    />,
];

export default function TechnicianNavigator() {
    return (
        <Stack.Navigator
            initialRouteName="TechnicianDashboard"
            screenOptions={{
                cardStyle: { backgroundColor: '#131313' },
                headerShown: false,
            }}
        >
            {renderTechnicianScreens(Stack)}
        </Stack.Navigator>
    );
}
