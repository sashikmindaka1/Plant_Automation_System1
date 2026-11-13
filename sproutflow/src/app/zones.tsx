import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

// TypeScript Interface eka
interface Zone {
    id: string;
    name: string;
    temp: string;
    humidity: string;
}

const MOCK_ZONES: Zone[] = [
    { id: '1', name: 'Indoor Balcony', temp: '26°C', humidity: '60%' },
    { id: '2', name: 'Living Room', temp: '24°C', humidity: '50%' },
];

export default function Zones() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Greenhouse Zones</Text>
            
            <FlatList 
                data={MOCK_ZONES}
                keyExtractor={(item) => item.id}
                renderItem={({item}) => (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={styles.cardDetails}>Temp: {item.temp} | Humidity: {item.humidity}</Text>
                    </View>
                )}
            />
            
            <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>+ Add New Zone</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    card: { backgroundColor: '#e8f5e9', padding: 15, borderRadius: 10, marginBottom: 15 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
    cardDetails: { fontSize: 14, color: '#666', marginTop: 5 },
    addButton: { backgroundColor: '#2e7d32', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});