import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View, Image } from 'react-native';
import { auth } from '../../src/config/firebase';
import { useEffect, useState } from 'react';

function UserDisplayName() {
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  if (!user?.displayName) return null;

  // Pega apenas o primeiro nome para não ocupar muito espaço
  const firstName = user.displayName.split(' ')[0];
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <View style={styles.headerRight}>
      <View style={styles.profileChip}>
        {user.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <Text style={styles.userName}>
          {firstName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    marginRight: 16,
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 4,
    paddingHorizontal: 6,
    paddingRight: 12,
    borderRadius: 32,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ddd',
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
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