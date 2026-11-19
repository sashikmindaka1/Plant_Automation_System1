import { Stack } from 'expo-router';

export default function Layout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="weather-alerts" />
            <Stack.Screen name="symptom-checker" />
            <Stack.Screen name="simulator_call" />
        </Stack>
    );
}