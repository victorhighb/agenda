import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

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