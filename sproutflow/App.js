import { Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import NotificationCenter from './src/screens/NotificationCenter';

const Stack = createNativeStackNavigator();

export default function App() {
  let [fontsLoaded] = useFonts({
    Cinzel: Cinzel_700Bold,
    Montserrat: Montserrat_400Regular,
    MontserratBold: Montserrat_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ 
          headerStyle: { backgroundColor: '#020202' },
          headerTintColor: '#d4af37',
          headerTitleStyle: { fontFamily: 'Cinzel' }
      }}>
        <Stack.Screen name="Alerts" component={NotificationCenter} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}