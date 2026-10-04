import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../constants/theme';

const Stack = createStackNavigator();

/**
 * Modular Customer Screens with lazy getComponent loaders
 */
export const renderCustomerScreens = (NavStack) => [
    <NavStack.Screen
        key="Home"
        name="Home"
        getComponent={() => require('../screens/customer/HomeScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="Customer"
        name="Customer"
        getComponent={() => require('../screens/customer/CustomerScreen').default}
        options={{
            title: 'SERVICE TRACKING',
            headerStyle: { backgroundColor: COLORS.white },
            headerTintColor: COLORS.black,
        }}
    />,
    <NavStack.Screen
        key="History"
        name="History"
        getComponent={() => require('../screens/customer/HistoryScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="ServiceList"
        name="ServiceList"
        getComponent={() => require('../screens/customer/ServiceListScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="ServiceDetail"
        name="ServiceDetail"
        getComponent={() => require('../screens/customer/ServiceDetailScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="Schedule"
        name="Schedule"
        getComponent={() => require('../screens/customer/ScheduleScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="MapPicker"
        name="MapPicker"
        getComponent={() => require('../screens/customer/MapPickerScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="BookingSummary"
        name="BookingSummary"
        getComponent={() => require('../screens/customer/BookingSummaryScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="PaymentMethod"
        name="PaymentMethod"
        getComponent={() => require('../screens/customer/PaymentMethodScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="PaymentStatus"
        name="PaymentStatus"
        getComponent={() => require('../screens/customer/PaymentStatusScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="ServiceStatus"
        name="ServiceStatus"
        getComponent={() => require('../screens/customer/ServiceStatusScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="CustomerRazorpayCheckout"
        name="CustomerRazorpayCheckout"
        getComponent={() => require('../screens/customer/CustomerRazorpayCheckoutScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="Profile"
        name="Profile"
        getComponent={() => require('../screens/customer/ProfileScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="Receipt"
        name="Receipt"
        getComponent={() => require('../screens/customer/ReceiptScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="TechnicianWaiting"
        name="TechnicianWaiting"
        getComponent={() => require('../screens/customer/TechnicianWaitingScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="ServiceProgress"
        name="ServiceProgress"
        getComponent={() => require('../screens/customer/ServiceProgressScreen').default}
        options={{ headerShown: false }}
    />,
];

export default function CustomerNavigator() {
    return (
        <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
                cardStyle: { backgroundColor: '#131313' },
                headerShown: false,
            }}
        >
            {renderCustomerScreens(Stack)}
        </Stack.Navigator>
    );
}
