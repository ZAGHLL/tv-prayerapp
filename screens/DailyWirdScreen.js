import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { View, Image, StyleSheet, Dimensions, StatusBar, TouchableOpacity, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import { quranPages } from '../assets/quranPages';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function DailyWirdScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [userOrientation, setUserOrientation] = useState('portrait');
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [currentIndex, setCurrentIndex] = useState(0);
  const flipTimerRef = useRef(null);
  const flipsDoneRef = useRef(0);
  const sessionCountRef = useRef(3);
  const sessionMinutesPerImageRef = useRef(1);
  
  // Animation للتنقل بين الصور
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // TV Focus Management - نفس الأذكار بالظبط
  const [currentFocusedElement, setCurrentFocusedElement] = useState(null);
  const [focusKey, setFocusKey] = useState(0);

  const handleFocus = (elementName) => setCurrentFocusedElement(elementName);
  const handleBlur = () => setCurrentFocusedElement(null);
  const isFocused = (elementName) => currentFocusedElement === elementName;

// Restore focus to menu button when screen becomes focused
useFocusEffect(
  useCallback(() => {
    setFocusKey(prev => prev + 1);
    console.log('🎯 Daily Wird screen focused - restoring menu button focus');
  }, [])
);

  useEffect(() => {
    const setOrientation = async () => {
      try {
        const orientation = await AsyncStorage.getItem('userOrientation');
        const value = orientation || 'portrait';
        setUserOrientation(value);
        if (value === 'portrait') {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } else {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        }
      } catch (e) {}
    };
    setOrientation();

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);
  // Restart session on screen focus (ensures correct start page sequence every time)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      let returnTimerRef = null;
      
      const startSession = async () => {
        try {
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          await AsyncStorage.setItem('dailyWirdLastShownDate', todayStr);
          const baseRaw = await AsyncStorage.getItem('dailyWirdBaseIndex');
          const baseIndex = baseRaw ? parseInt(baseRaw) : 0;
          const settingsRaw = await AsyncStorage.getItem('postPrayerSettings');
          const settings = settingsRaw ? JSON.parse(settingsRaw) : null;
          const imagesCount = parseInt(settings?.screens?.dailyWird?.imagesCount) || 3;
          const minutesPerImage = parseInt(settings?.screens?.dailyWird?.minutesPerImage) || 1;
          sessionCountRef.current = Math.max(1, imagesCount);
          sessionMinutesPerImageRef.current = Math.max(1, minutesPerImage);

          // Check if this is a manual navigation (not from scheduled post-prayer screens)
          const isScheduled = route.params?.isScheduled;
          const shouldReturnToPrayerTimes = !isScheduled;

          // start from baseIndex and auto flip
          flipsDoneRef.current = 0;
          if (!cancelled) {
            setCurrentIndex(baseIndex % quranPages.length);
          }

          // Ensure the same pages are shown for the whole session
          const sessionStartIndex = baseIndex % quranPages.length;
          const sessionTotal = sessionCountRef.current;
          let shown = 0;

          const msPerImage = Math.max(1, minutesPerImage) * 60 * 1000;
          const totalSessionDuration = sessionTotal * msPerImage;
          
          if (flipTimerRef.current) clearInterval(flipTimerRef.current);
          flipTimerRef.current = setInterval(() => {
            if (cancelled) {
              clearInterval(flipTimerRef.current);
              flipTimerRef.current = null;
              return;
            }
            // advance until showing exactly imagesCount pages in this session
            if (shown >= Math.max(1, sessionTotal) - 1) {
              clearInterval(flipTimerRef.current);
              flipTimerRef.current = null;
              return;
            }
            
            // Animation للخروج (fade out و scale down)
            Animated.parallel([
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 0.9,
                duration: 500,
                useNativeDriver: true,
              }),
            ]).start(() => {
              // تغيير الصورة
              shown += 1;
              setCurrentIndex((sessionStartIndex + shown) % quranPages.length);
              
              // Animation للدخول (fade in و scale up)
              Animated.parallel([
                Animated.timing(fadeAnim, {
                  toValue: 1,
                  duration: 500,
                  useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                  toValue: 1,
                  duration: 500,
                  useNativeDriver: true,
                }),
              ]).start();
            });
          }, msPerImage);

          // If manual navigation, schedule return to PrayerTimes after session ends
          if (shouldReturnToPrayerTimes) {
            returnTimerRef = setTimeout(() => {
              if (!cancelled) {
                console.log('Daily Wird session ended, returning to PrayerTimes');
                navigation.navigate('PrayerTimes');
              }
            }, totalSessionDuration);
          }
        } catch (e) {
          console.error('Error in Daily Wird session:', e);
        }
      };

      startSession();

      return () => {
        cancelled = true;
        if (flipTimerRef.current) {
          clearInterval(flipTimerRef.current);
          flipTimerRef.current = null;
        }
        if (returnTimerRef) {
          clearTimeout(returnTimerRef);
          returnTimerRef = null;
        }
      };
    }, [route.params?.isScheduled, navigation])
  );

  const pageSource = useMemo(() => quranPages[currentIndex % quranPages.length], [currentIndex]);
  const { width, height } = screenData;
  
  // تحديد الأبعاد بناءً على الـ orientation بشكل صحيح
  const isLandscape = width > height;
  const imageStyle = isLandscape
    ? { width: height * 0.7, height: height * 0.98 } // في اللاندسكيب: العرض أصغر من الطول
    : { width: width * 0.95, height: height * 0.9 }; // في البورترايه: العرض كامل تقريباً

  return (
    <View style={[styles.container, isLandscape ? styles.containerLandscape : styles.containerPortrait]}> 
      <StatusBar hidden={isLandscape} />
      
      {/* Hamburger Menu Button */}
      <TouchableOpacity
        key={`menu-wird-${focusKey}`}
        style={[
          styles.menuButton,
          isFocused('menuButton') && styles.tvFocusedButton
        ]}
        focusable={true}
        hasTVPreferredFocus={true}
        onFocus={() => handleFocus('menuButton')}
        onBlur={handleBlur}
        onPress={() => navigation.openDrawer()}
        activeOpacity={0.7}
      >
        <Ionicons name="menu" size={25} color="#fff" />
      </TouchableOpacity>

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Image
        key={`${isLandscape}-${currentIndex}`}
          source={pageSource}
          style={[
            isLandscape ? styles.pageImageLandscape : styles.pageImagePortrait,
            imageStyle
          ]}
          resizeMode="contain"
          fadeDuration={0}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerPortrait: {
    backgroundColor: '#fff',
  },
  containerLandscape: {
    backgroundColor: '#fff',
  },
  pageImagePortrait: {
    backgroundColor: 'white',
    borderRadius: 8,
  },
  pageImageLandscape: {
    backgroundColor: 'white',
  },
  menuButton: {
    position: 'absolute',
    top: 20,
    left: 10,
    zIndex: 10,
    backgroundColor: 'rgba(225, 231, 227, 0.95)',
    borderRadius: 8,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    

  },
  tvFocusedButton: {
    borderColor: 'rgba(216, 232, 223, 0)',
      borderWidth: 3,
      // shadowColor: '#FFD700',
      elevation: 12,
      backgroundColor: 'rgba(71, 71, 67, 0.27)',
    },
});