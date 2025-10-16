import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Dimensions, Platform } from 'react-native';
import WelcomeScreen from './screens/WelcomeScreen';
import AuthScreen from './screens/AuthScreen';
import OrientationChoiceScreen from './screens/OrientationChoiceScreen';
import PrayerTimes from './screens/PrayerTimes';
import AzkarScreen from './screens/AzkarScreen';
import QuranScreen from './screens/QuranScreen';
import LiveMakkahScreen from './screens/LiveMakkahScreen';
import LiveMadinaScreen from './screens/LiveMadinaScreen';
import SettingsScreen from './screens/SettingsScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import CustomDrawerContent from './components/CustomDrawerContent';


const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

function DrawerNavigator() {
  return (
  <Drawer.Navigator
      initialRouteName="PrayerTimes"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerPosition: 'left',
        headerShown: false,
        drawerStyle: {
          width: 320,
        },
      }}
    >

      <Drawer.Screen name="PrayerTimes" component={PrayerTimes} />
      <Drawer.Screen name="azkar" component={AzkarScreen} />
      <Drawer.Screen name="quran" component={QuranScreen} />
      <Drawer.Screen name="makkah live" component={LiveMakkahScreen} />
      <Drawer.Screen name="madina live" component={LiveMadinaScreen} />
      <Drawer.Screen name="setting" component={SettingsScreen} />
      {/* <Drawer.Screen name="onboarding-test" component={OnboardingScreen} /> */}
    </Drawer.Navigator>
  );
}

// دالة لتحديد نوع الجهاز
const getDeviceType = () => {
  const { width, height } = Dimensions.get('window');
  const aspectRatio = width / height;
  
  // إذا كان Platform.isTV متاح (للأجهزة التي تدعمه)
  if (Platform.isTV) {
    return 'tv';
  }
  
  // تحديد نوع الجهاز بناءً على الأبعاد
  const screenSize = Math.sqrt(width * width + height * height);
  
  // إذا كان العرض أكبر من الارتفاع بشكل كبير أو الشاشة كبيرة
  if (aspectRatio > 1.5 || screenSize > 1000) {
    return 'tv'; // أو tablet في وضع landscape
  }
  
  return 'mobile';
};

export default function App() {
  const [initialRoute, setInitialRoute] = useState('Welcome');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      let userOrientation = await AsyncStorage.getItem('userOrientation');
      
      // تحديد نوع الجهاز
      const deviceType = getDeviceType();
      
      // إذا لم يكن هناك orientation محفوظ، حدده بناءً على نوع الجهاز
      if (!userOrientation) {
        if (deviceType === 'tv') {
          userOrientation = 'landscape';
        } else {
          userOrientation = 'portrait';
        }
        // حفظ الاتجاه المحدد تلقائياً
        await AsyncStorage.setItem('userOrientation', userOrientation);
      }
      
      if (userData && userOrientation) {
        // المستخدم مسجل دخول ولديه اتجاه محدد
        if (userOrientation === 'landscape') {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
        setInitialRoute('Main');
      } else if (userData && !userOrientation) {
        // المستخدم مسجل دخول لكن ليس له اتجاه محدد
        // تعيين الاتجاه بناءً على نوع الجهاز
        const defaultOrientation = deviceType === 'tv' ? 'landscape' : 'portrait';
        await AsyncStorage.setItem('userOrientation', defaultOrientation);
        
        if (defaultOrientation === 'landscape') {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
        setInitialRoute('Main');
      } else {
        // المستخدم غير مسجل دخول، ابدأ بشاشة الترحيب
        // تعيين اتجاه افتراضي بناءً على نوع الجهاز
        const defaultOrientation = deviceType === 'tv' ? 'landscape' : 'portrait';
        
        if (defaultOrientation === 'landscape') {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
        setInitialRoute('Welcome');
      }
    } catch (error) {
      console.log('Error checking auth state:', error);
      // في حالة الخطأ، استخدم portrait كافتراضي
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      setInitialRoute('Welcome');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // أو مكون loading spinner
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="OrientationChoice" component={OrientationChoiceScreen} />
        <Stack.Screen name="Main" component={DrawerNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}