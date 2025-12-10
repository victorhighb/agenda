import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { auth } from '../../src/config/firebase';
import { useEffect, useState } from 'react';

function UserDisplayName() {
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setDisplayName(user?.displayName || '');
    });
    return unsubscribe;
  }, []);

  if (!displayName) return null;

  return (
    <View style={styles.headerRight}>
      <Text style={styles.userName}>
        {displayName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    marginRight: 16,
  },
  userName: {
    fontSize: 14,
    color: '#000',
  },
});

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
        headerTitleAlign: "center",
        headerStyle: { backgroundColor: "#fff" },
        tabBarStyle: {
            backgroundColor: "#fff",
        },
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#666666",
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
            title: "Agenda",
            headerRight: () => <UserDisplayName />,
            tabBarIcon: ({color, size}) => (
                <Ionicons
                    name="calendar"
                    size={size}
                    color={color}
                />
            ),
        }}
      />
      <Tabs.Screen 
        name="clients" 
        options={{ 
            title: "Clientes",
            tabBarIcon: ({color, size}) => (
                <Ionicons
                    name="people"
                    size={size}
                    color={color}
                />
            ),
        }}
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
            title: "Perfil",
            tabBarIcon: ({color, size}) => (
                <Ionicons
                    name="person"
                    size={size}
                    color={color}
                />
            ),
        }}
      />
    </Tabs>
  );
}