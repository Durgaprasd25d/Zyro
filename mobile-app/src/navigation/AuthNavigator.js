import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

/**
 * Modular Auth Screens with lazy getComponent loaders
 */
export const renderAuthScreens = (NavStack) => [
    <NavStack.Screen
        key="Splash"
        name="Splash"
        getComponent={() => require('../screens/SplashScreen').default}
        options={{
            headerShown: false,
            animationEnabled: false,
            cardStyle: { backgroundColor: '#131313' },
        }}
    />,
    <NavStack.Screen
        key="Splash2"
        name="Splash2"
        getComponent={() => require('../screens/SplashScreen2').default}
        options={{
            headerShown: false,
            animationEnabled: false,
            cardStyle: { backgroundColor: '#131313' },
        }}
    />,
    <NavStack.Screen
        key="Splash3"
        name="Splash3"
        getComponent={() => require('../screens/SplashScreen3').default}
        options={{
            headerShown: false,
            animationEnabled: false,
            cardStyle: { backgroundColor: '#131313' },
        }}
    />,
    <NavStack.Screen
        key="Onboarding"
        name="Onboarding"
        getComponent={() => require('../screens/OnboardingScreen').default}
        options={{ headerShown: false }}
    />,
    <NavStack.Screen
        key="Auth"
        name="Auth"
        getComponent={() => require('../screens/AuthScreen').default}
        options={{ headerShown: false }}
    />,
];

export default function AuthNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {renderAuthScreens(Stack)}
        </Stack.Navigator>
    );
}
