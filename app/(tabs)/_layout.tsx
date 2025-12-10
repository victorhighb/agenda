import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { auth } from '../../src/config/firebase';
import { useEffect, useState } from 'react';

function UserDisplayName() {
  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || '');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setDisplayName(user?.displayName || '');
    });
    return unsubscribe;
  }, []);

  return (
    <View style={{ marginRight: 16 }}>
      <Text style={{ fontSize: 14, color: '#000' }}>
        {displayName}
      </Text>
    </View>
  );
}

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