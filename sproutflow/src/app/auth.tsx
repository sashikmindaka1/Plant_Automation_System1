import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function Auth() {
    const [isLogin, setIsLogin] = useState<boolean>(true);
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');

    const handleAuth = () => {
        // Email ekai password ekai dekam gahala nam witharak issarahata yanna
        if (email !== '' && password !== '') {
            console.log(isLogin ? "Logging in..." : "Signing up...");
            // Profile page ekata yanna:
            router.replace('/profile');
        } else {
            alert("Please enter both email and password!");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>SproutFlow</Text>
            <Text style={styles.subtitle}>{isLogin ? "Welcome Back!" : "Create Account"}</Text>
            
            <TextInput 
                style={styles.input} 
                placeholder="Email" 
                value={email} 
                onChangeText={setEmail} 
            />
            <TextInput 
                style={styles.input} 
                placeholder="Password" 
                secureTextEntry 
                value={password} 
                onChangeText={setPassword} 
            />
            
            <TouchableOpacity style={styles.button} onPress={handleAuth}>
                <Text style={styles.buttonText}>{isLogin ? "Login" : "Sign Up"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                <Text style={styles.switchText}>
                    {isLogin ? "Need an account? Sign Up" : "Already have an account? Login"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#f4fbf4' },
    title: { fontSize: 32, fontWeight: 'bold', color: '#2e7d32', textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 18, textAlign: 'center', marginBottom: 30, color: '#555' },
    input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
    button: { backgroundColor: '#2e7d32', padding: 15, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    switchText: { textAlign: 'center', marginTop: 20, color: '#2e7d32' }
});