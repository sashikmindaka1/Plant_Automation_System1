import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function Profile() {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

    const handleLogout = () => {
        // Log out unama auth page ekata yanna:
        // router.replace('/auth');
    };  

    return (
        <View style={styles.container}>
            <Text style={styles.title}>User Profile & Settings</Text>
            
            <View style={styles.settingRow}>
                <Text style={styles.settingText}>Dark Mode</Text>
                <Switch value={isDarkMode} onValueChange={setIsDarkMode} />
            </View>

            <View style={styles.settingRow}>
                <Text style={styles.settingText}>Push Notifications</Text>
                <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, color: '#333' },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    settingText: { fontSize: 18, color: '#444' },
    logoutButton: { marginTop: 40, backgroundColor: '#d32f2f', padding: 15, borderRadius: 10, alignItems: 'center' },
    logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});