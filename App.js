import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Dimensions, Platform, Easing, AppState } from 'react-native';
import { useKeepAwake } from '@sayem314/react-native-keep-awake';

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
import DailyWirdScreen from './screens/DailyWirdScreen';
import CustomDrawerContent from './components/CustomDrawerContent';



const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();
const MainStack = createStackNavigator();

// Stack Navigator داخل Drawer لإضافة animations
function MainStackNavigator() {
  return (
    <MainStack.Navigator
      initialRouteName="PrayerTimes"
      screenOptions={{
        headerShown: false,
        // Animation واضح وسلس للتنقل بين الصفحات
        cardStyleInterpolator: ({ current, next, layouts }) => {
          return {
            cardStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width * 0.3, 0],
                  }),
                },
                {
                  scale: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
            overlayStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.5],
              }),
            },
          };
        },
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 1000,
              easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 900,
              easing: Easing.bezier(0.25, 0.1, 0.25, 1),
            },
          },
        },
        gestureEnabled: false,
      }}
    >
      <MainStack.Screen name="PrayerTimes" component={PrayerTimes} />
      <MainStack.Screen name="azkar" component={AzkarScreen} />
      <MainStack.Screen name="quran" component={QuranScreen} />
      <MainStack.Screen name="dailyWird" component={DailyWirdScreen} />
      <MainStack.Screen name="makkah live" component={LiveMakkahScreen} />
      <MainStack.Screen name="madina live" component={LiveMadinaScreen} />
      <MainStack.Screen name="setting" component={SettingsScreen} />
    </MainStack.Navigator>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerPosition: 'left',
        headerShown: false,
        drawerStyle: {
          width: 250,
          backgroundColor:'transparent',
        },
        overlayColor:'transparent',
        sceneContentColor:{backgroundColor:'transparent'},
      }}
    >
      <Drawer.Screen name="MainStack" component={MainStackNavigator} />
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
  // 🔥 Keep Awake - يمنع الشاشة من النوم
  useKeepAwake();

  const [initialRoute, setInitialRoute] = useState('Welcome');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('✅ Keep Awake is active - Screen will not sleep');
    checkAuthState();

    // 📊 مراقبة حالة التطبيق (اختياري للـ logging)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log(`📱 App state changed to: ${nextAppState}`);
      
      if (nextAppState === 'active') {
        console.log('🟢 App is in foreground - Keep Awake active');
      } else if (nextAppState === 'background') {
        console.log('🟡 App went to background - Keep Awake paused');
      }
    });

    return () => {
      subscription.remove();
    };
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
      // في حالة الخطأ، استخدم landscape كافتراضي
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
      <Stack.Navigator 
        initialRouteName={initialRoute} 
        screenOptions={{ 
          headerShown: false,
          // إضافة animation للـ Stack Navigator
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 900,
                easing: Easing.out(Easing.ease),
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 650,
                easing: Easing.in(Easing.ease),
              },
            },
          },
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="OrientationChoice" component={OrientationChoiceScreen} />
        <Stack.Screen name="Main" component={DrawerNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}