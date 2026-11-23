import { Stack } from 'expo-router';

export default function Layout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="weather-alerts" />
            <Stack.Screen name="symptom-checker" />
            <Stack.Screen name="analytics" />
        </Stack>
    );
}