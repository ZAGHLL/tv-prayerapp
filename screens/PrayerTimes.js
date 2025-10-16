import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet,Alert, TouchableOpacity, ImageBackground, Animated, Dimensions, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useTVRemote } from '../hooks/useTVRemote';



const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function PrayerTimesScreen() {
  const navigation = useNavigation();
  const [prayerTimes, setPrayerTimes] = useState([]);
  const [nextPrayer, setNextPrayer] = useState({ name: '', time: '' });
  const [countdown, setCountdown] = useState('');
  const [hijriDate, setHijriDate] = useState('');
  const [gregorianDate, setGregorianDate] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [orientation, setOrientation] = useState('portrait');
  const [temperature, setTemperature] = useState(null);
  const [weatherIcon, setWeatherIcon] = useState(null);
  const [tempMax, setTempMax] = useState(null);
  const [tempMin, setTempMin] = useState(null);
  const [mosqueName, setMosqueName] = useState('مسجد الفاروق');
  const [backgroundImage, setBackgroundImage] = useState(null);

  const [isLoadingPrayer, setIsLoadingPrayer] = useState(false);
const [isLoadingWeather, setIsLoadingWeather] = useState(false);
const [lastPrayerUpdate, setLastPrayerUpdate] = useState(null);
const [lastWeatherUpdate, setLastWeatherUpdate] = useState(null);
const [userLocation, setUserLocation] = useState(null);



  const [iqamaDurations, setIqamaDurations] = useState({
    'الفجر': 20,
    'الظهر': 10,
    'العصر': 10,
    'المغرب': 10,
    'العشاء': 10
  });
  const [newsSettings, setNewsSettings] = useState({
    enabled: false,
    text: ''
  });
  const [blackScreenSettings, setBlackScreenSettings] = useState({
    enabled: false,
    durations: {
      'الفجر': 0,
      'الظهر': 0,
      'العصر': 0,
      'المغرب': 0,
      'العشاء': 0
    }
  });
  const [showBlackScreen, setShowBlackScreen] = useState(false);
  const [blackScreenTimeLeft, setBlackScreenTimeLeft] = useState(0);

  // Post-prayer screen scheduling states
  const [postPrayerSettings, setPostPrayerSettings] = useState({
    enabled: false,
    screens: {
      azkar: { enabled: false, startAfter: 0, duration: 0 },
      quran: { enabled: false, startAfter: 0, duration: 0 },
      liveMakkah: { enabled: false, startAfter: 0, duration: 0 },
      liveMadina: { enabled: false, startAfter: 0, duration: 0 }, // إضافة جديدة

    }
  });
  const scheduledTimeoutsRef = useRef([]);

  const scrollViewRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(screenWidth);
  
  const verses = [
    "وَذَكَرَ اسْمَ رَبِّهِ فَصَلَّى",
    "فَاذْكُرُونِي أَذْكُرْكُمْ",
    "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ",
    "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ",
    "إِنَّ الْحَسَنَاتِ يُذْهِبْنَ السَّيِّئَاتِ"
  ];

  const [currentVerse, setCurrentVerse] = useState(verses[0]);

  useEffect(() => {
    const verseInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * verses.length);
      setCurrentVerse(verses[randomIndex]);
    }, 10000);

    return () => clearInterval(verseInterval);
  }, []);

  useTVRemote({
    onBack: () => {
      console.log('🎮 Back pressed in PrayerTimes');
      navigation.closeDrawer();
    },
  });
  
  // تنسيق النص
  const formatNewsText = (text) => {
    if (!text || text.trim() === '') return '';
    return text.trim();
  };
  
  
  const toArabicNumbers = (str) => {
    const numbers = { 0: '٠', 1: '١', 2: '٢', 3: '٣', 4: '٤', 5: '٥', 6: '٦', 7: '٧', 8: '٨', 9: '٩' };
    return str.toString().replace(/[0-9]/g, (digit) => numbers[digit]);
  };

  const formatTime12Hour = (time24) => {
    const [hour, minute] = time24.split(':');
    let h = parseInt(hour);
    const m = minute;
    const suffix = h >= 12 ? 'م' : 'ص';
    h = h % 12 || 12;
    return `${toArabicNumbers(h)}:${toArabicNumbers(m)} ${suffix}`;
  };

// إعادة تعيين الـ scroll position لما النص يتغير
useEffect(() => {
  if (contentWidth > 0) {
    const gapWidth = 100;
    const totalWidth = contentWidth + gapWidth;
    setScrollPosition(totalWidth);
  }
}, [newsSettings.text, contentWidth]);

const startAutoScroll = useCallback(() => {
  if (!newsSettings.enabled || !newsSettings.text || contentWidth === 0) return null;
  
  const scrollInterval = setInterval(() => {
    setScrollPosition(prevPosition => {
      const speed = 2; // سرعة الحركة
      const gapWidth = 100; // المساحة بين النصوص
      const totalWidth = contentWidth + gapWidth;
      
      let newPosition = prevPosition - speed;

      // لما النص يخرج من الشاشة من الشمال، ارجع لليمين
      if (newPosition <= -containerWidth) {
        newPosition = totalWidth;
      }
      
      return newPosition;
    });
  }, 50); // كل 50ms

  return scrollInterval;
}, [newsSettings.enabled, newsSettings.text, contentWidth]);

// تشغيل الـ auto scroll
useEffect(() => {
  const interval = startAutoScroll();
  
  return () => {
    if (interval) {
      clearInterval(interval);
    }
  };
}, [startAutoScroll]);

// تطبيق الـ scroll position على الـ ScrollView
useEffect(() => {
  if (scrollViewRef.current && contentWidth > 0) {
    scrollViewRef.current.scrollTo({
      x: scrollPosition,
      animated: false
    });
  }
}, [scrollPosition, contentWidth]);


 // دالة جلب مواعيد الصلاة المحدثة
const fetchPrayerTimesByCoords = async (latitude, longitude, showLoading = true) => {
  if (showLoading) setIsLoadingPrayer(true);
  
  try {
    const response = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=4`);
    const data = await response.json();
    const timings = data.data.timings;

    const prayerData = [
      { name: 'الفجر', time: timings.Fajr },
      { name: 'الظهر', time: timings.Dhuhr },
      { name: 'العصر', time: timings.Asr },
      { name: 'المغرب', time: timings.Maghrib },
      { name: 'العشاء', time: timings.Isha }
    ];

    // تحديث الحالة
    setPrayerTimes(prayerData);
    setHijriDate(toArabicNumbers(data.data.date.hijri.date));
    setGregorianDate(toArabicNumbers(data.data.date.gregorian.date));
    setLastPrayerUpdate(new Date().getTime());

    // حفظ في AsyncStorage
    await AsyncStorage.setItem('prayerData', JSON.stringify({
      prayerTimes: prayerData,
      hijriDate: toArabicNumbers(data.data.date.hijri.date),
      gregorianDate: toArabicNumbers(data.data.date.gregorian.date),
      lastUpdated: new Date().getTime()
    }));

    console.log('Prayer times updated successfully');
  } catch (error) {
    console.error('Error fetching prayer times:', error);
  } finally {
    if (showLoading) setIsLoadingPrayer(false);
  }
};

// دالة جلب بيانات الطقس المحدثة
const fetchWeatherData = async (lat, lon, showLoading = true) => {
  if (showLoading) setIsLoadingWeather(true);
  
  try {
    const apiKey = 'ce93f58f64d94c1baa6160839251706';
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=1&lang=ar`
    );

    const data = await response.json();

    if (!data?.current?.condition || !data?.forecast?.forecastday?.[0]?.day) {
      console.error('Invalid weather data received');
      return;
    }

    const currentTemp = Math.round(data.current.temp_c);
    const maxTemp = Math.round(data.forecast.forecastday[0].day.maxtemp_c);
    const minTemp = Math.round(data.forecast.forecastday[0].day.mintemp_c);
    const weatherIcon = 'https:' + data.current.condition.icon;

    // تحديث الحالة
    setTemperature(currentTemp);
    setWeatherIcon(weatherIcon);
    setTempMax(maxTemp);
    setTempMin(minTemp);
    setLastWeatherUpdate(new Date().getTime());

    // حفظ في AsyncStorage
    await AsyncStorage.setItem('weatherData', JSON.stringify({
      temperature: currentTemp,
      weatherIcon: weatherIcon,
      tempMax: maxTemp,
      tempMin: minTemp,
      lastUpdated: new Date().getTime()
    }));

    console.log('Weather data updated successfully');
  } catch (error) {
    console.error('Error fetching weather data:', error);
  } finally {
    if (showLoading) setIsLoadingWeather(false);
  }
};



// دالة منفصلة لتحميل جميع الإعدادات
const loadAllSettings = async () => {
  try {
    // تحميل اسم المسجد
    const storedMosqueName = await AsyncStorage.getItem('mosqueName');
    if (storedMosqueName) {
      setMosqueName(storedMosqueName);
    }

    // تحميل أوقات الإقامة
    const storedIqamaTimes = await AsyncStorage.getItem('iqamaTimes');
    if (storedIqamaTimes) {
      const parsedIqama = JSON.parse(storedIqamaTimes);
      if (parsedIqama && typeof parsedIqama === 'object') {
        setIqamaDurations({
          'الفجر': parseInt(parsedIqama.Fajr) || 20,
          'الظهر': parseInt(parsedIqama.Dhuhr) || 10,
          'العصر': parseInt(parsedIqama.Asr) || 10,
          'المغرب': parseInt(parsedIqama.Maghrib) || 10,
          'العشاء': parseInt(parsedIqama.Isha) || 10
        });
      }
    }

    // تحميل إعدادات الشاشة السوداء
    const storedBlackScreenSettings = await AsyncStorage.getItem('blackScreenSettings');
    if (storedBlackScreenSettings) {
      const parsedBlackScreen = JSON.parse(storedBlackScreenSettings);
      if (parsedBlackScreen && typeof parsedBlackScreen === 'object') {
        setBlackScreenSettings({
          enabled: Boolean(parsedBlackScreen.enabled),
          durations: {
            'الفجر': parseInt(parsedBlackScreen.durations?.Fajr) || 0,
            'الظهر': parseInt(parsedBlackScreen.durations?.Dhuhr) || 0,
            'العصر': parseInt(parsedBlackScreen.durations?.Asr) || 0,
            'المغرب': parseInt(parsedBlackScreen.durations?.Maghrib) || 0,
            'العشاء': parseInt(parsedBlackScreen.durations?.Isha) || 0
          }
        });
      }
    }

    // تحميل إعدادات شاشات ما بعد الصلاة
    const storedPostPrayerSettings = await AsyncStorage.getItem('postPrayerSettings');
    if (storedPostPrayerSettings) {
      const parsedPostPrayer = JSON.parse(storedPostPrayerSettings);
      if (parsedPostPrayer && typeof parsedPostPrayer === 'object') {
        setPostPrayerSettings({
          enabled: Boolean(parsedPostPrayer.enabled),
          screens: {
            azkar: {
              enabled: Boolean(parsedPostPrayer.screens?.azkar?.enabled),
              startAfter: parseInt(parsedPostPrayer.screens?.azkar?.startAfter) || 0,
              duration: parseInt(parsedPostPrayer.screens?.azkar?.duration) || 0
            },
            quran: {
              enabled: Boolean(parsedPostPrayer.screens?.quran?.enabled),
              startAfter: parseInt(parsedPostPrayer.screens?.quran?.startAfter) || 0,
              duration: parseInt(parsedPostPrayer.screens?.quran?.duration) || 0
            },
            liveMakkah: {
              enabled: Boolean(parsedPostPrayer.screens?.liveMakkah?.enabled),
              startAfter: parseInt(parsedPostPrayer.screens?.liveMakkah?.startAfter) || 0,
              duration: parseInt(parsedPostPrayer.screens?.liveMakkah?.duration) || 0
            },
            liveMadina: {
              enabled: Boolean(parsedPostPrayer.screens?.liveMadina?.enabled),
              startAfter: parseInt(parsedPostPrayer.screens?.liveMadina?.startAfter) || 0,
              duration: parseInt(parsedPostPrayer.screens?.liveMadina?.duration) || 0
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
};

// دالة عرض رسالة الانتقال للإعدادات
const showManualLocationAlert = () => {
  Alert.alert(
    'تحديد الموقع يدوياً',
    'لم نتمكن من تحديد موقعك تلقائياً. يرجى تحديد موقعك من الإعدادات.',
    [
      {
        text: 'الذهاب للإعدادات',
        onPress: () => navigation.navigate('setting')
      },
      {
        text: 'لاحقاً',
        style: 'cancel'
      }
    ]
  );
};

// دالة طلب الموقع لأول مرة
const requestLocationFirstTime = async () => {
  try {
    console.log('Requesting location permission...');
    
    let { status } = await Location.requestForegroundPermissionsAsync();
    
    console.log('Permission status:', status);
    
    if (status === 'granted') {
      Alert.alert(
        'جاري تحديد الموقع',
        'يرجى الانتظار...',
        [],
        { cancelable: false }
      );
      
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 15000,
        });

        console.log('Location obtained:', location.coords);

        if (location?.coords) {
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          };

          await AsyncStorage.setItem('userLocation', JSON.stringify(coords));
          setUserLocation(coords);

          await fetchPrayerTimesByCoords(coords.latitude, coords.longitude, true);
          await fetchWeatherData(coords.latitude, coords.longitude, true);

          Alert.alert('تم تحديد الموقع', 'تم حفظ موقعك بنجاح');
        }
      } catch (locationError) {
        console.error('Error getting location:', locationError);
        showManualLocationAlert();
      }
    } else {
      console.log('Permission denied');
      showManualLocationAlert();
    }
  } catch (error) {
    console.error('Error in requestLocationFirstTime:', error);
    showManualLocationAlert();
  }
};
  
const loadData = useCallback(async () => {
  try {
    console.log('Loading initial data from AsyncStorage...');
    
    // 1. تحميل صورة الخلفية
    const savedBackground = await AsyncStorage.getItem('backgroundImage');
    if (savedBackground) {
      setBackgroundImage(savedBackground);
    }

    // 2. تحميل إعدادات الأخبار
    const storedNews = await AsyncStorage.getItem('newsSettings');
    if (storedNews) {
      setNewsSettings(JSON.parse(storedNews));
    }

    // 3. تحميل بيانات الصلاة من AsyncStorage أولاً
    const storedPrayer = await AsyncStorage.getItem('prayerData');
    if (storedPrayer) {
      try {
        const parsed = JSON.parse(storedPrayer);
        if (parsed?.prayerTimes) {
          setPrayerTimes(parsed.prayerTimes);
          setHijriDate(parsed.hijriDate || '');
          setGregorianDate(parsed.gregorianDate || '');
          setLastPrayerUpdate(parsed.lastUpdated || null);
          console.log('Prayer times loaded from AsyncStorage');
        }
      } catch (error) {
        console.error('Error parsing stored prayer data:', error);
      }
    }

    // 4. تحميل بيانات الطقس من AsyncStorage أولاً
    const storedWeather = await AsyncStorage.getItem('weatherData');
    if (storedWeather) {
      try {
        const parsed = JSON.parse(storedWeather);
        if (parsed?.temperature !== undefined) {
          setTemperature(parsed.temperature);
          setWeatherIcon(parsed.weatherIcon || '');
          setTempMax(parsed.tempMax || '');
          setTempMin(parsed.tempMin || '');
          setLastWeatherUpdate(parsed.lastUpdated || null);
          console.log('Weather data loaded from AsyncStorage');
        }
      } catch (error) {
        console.error('Error parsing stored weather data:', error);
      }
    }

    // 5. تحميل باقي الإعدادات
    await loadAllSettings();

    // 6. التحقق من الموقع
    const savedLocation = await AsyncStorage.getItem('userLocation');
    
    if (savedLocation) {
      console.log('Location found in storage');
      const coords = JSON.parse(savedLocation);
      setUserLocation(coords);
      
      setTimeout(async () => {
        console.log('Updating prayer times and weather in background...');
        await fetchPrayerTimesByCoords(coords.latitude, coords.longitude, false);
        await fetchWeatherData(coords.latitude, coords.longitude, false);
      }, 500);
    } else {
      console.log('No location found, requesting...');
      setTimeout(() => {
        requestLocationFirstTime();
      }, 1000);
    }

  } catch (error) {
    console.error('Error in loadData:', error);
  }
}, []);

useFocusEffect(
  useCallback(() => {
    console.log('Screen focused, loading data...');
    loadData();
  }, [loadData])
);

  // Set screen orientation based on user preference
  useFocusEffect(
    React.useCallback(() => {
      const reloadBackground = async () => {
        const savedBackground = await AsyncStorage.getItem('backgroundImage');
        setBackgroundImage(savedBackground);
      };
      reloadBackground();
      
      const setScreenOrientation = async () => {
        try {
          const currentOrientation = await AsyncStorage.getItem('userOrientation');
          setOrientation(currentOrientation || 'portrait');
          
          if (currentOrientation === 'portrait') {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
          } else {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
          }
        } catch (error) {
          console.log('Error setting orientation:', error);
        }
      };
      
      setScreenOrientation();
    }, [])
  );

  // Clear all scheduled timeouts
  const clearScheduledScreens = useCallback(() => {
    scheduledTimeoutsRef.current.forEach(timeout => {
      if (timeout) {
        clearTimeout(timeout);
      }
    });
    scheduledTimeoutsRef.current = [];
    console.log('All scheduled screens cleared');
  }, []);

 // Schedule post-prayer screens function   
const schedulePostPrayerScreens = useCallback(() => {
  clearScheduledScreens();
  
  if (!postPrayerSettings.enabled) {
    console.log('Post-prayer screens are disabled');
    return;
  }
  
  console.log('Scheduling post-prayer screens...');
  
  const { azkar, quran, liveMakkah, liveMadina } = postPrayerSettings.screens;
  
  // ترتيب الشاشات حسب وقت البداية
  const screens = [];
  
  if (azkar.enabled && azkar.duration > 0) {
    screens.push({
      name: 'azkar',
      route: 'azkar',
      startAfter: azkar.startAfter,
      duration: azkar.duration
    });
  }
  
  if (quran.enabled && quran.duration > 0) {
    screens.push({
      name: 'quran',
      route: 'quran',
      startAfter: quran.startAfter,
      duration: quran.duration
    });
  }
  
  if (liveMakkah.enabled && liveMakkah.duration > 0) {
    screens.push({
      name: 'live makkah',
      route: 'makkah live',
      startAfter: liveMakkah.startAfter,
      duration: liveMakkah.duration
    });
  }  
  if (liveMadina.enabled && liveMadina.duration > 0) {
    screens.push({
      name: 'live madina',
      route: 'madina live',
      startAfter: liveMadina.startAfter,
      duration: liveMadina.duration
    });
  }
  
  // ترتيب الشاشات حسب وقت البداية
  screens.sort((a, b) => a.startAfter - b.startAfter);
  
  if (screens.length === 0) {
    console.log('No screens to schedule');
    return;
  }
  
  console.log('Screens sequence:', screens.map(s => `${s.name} (after ${s.startAfter}min, for ${s.duration}min)`));
  
  let currentTime = 0; // الوقت الحالي بالدقائق من نهاية الشاشة السوداء
  
  // جدولة الشاشات بشكل متتابع
  screens.forEach((screen, index) => {
    const isFirstScreen = index === 0;
    const isLastScreen = index === screens.length - 1;
    
    // حساب متى تبدأ هذه الشاشة
    let startDelay;
    if (isFirstScreen) {
      // الشاشة الأولى: إذا كان startAfter = 0، تبدأ مباشرة من الشاشة السوداء
      startDelay = screen.startAfter;
    } else {
      // الشاشات التالية: تبدأ مباشرة بعد انتهاء الشاشة السابقة أو في وقتها المحدد (أيهما أكبر)
      startDelay = Math.max(currentTime, screen.startAfter);
    }
    
    // جدولة بداية الشاشة
    const startTimeout = setTimeout(() => {
      console.log(`Starting ${screen.name} screen at ${startDelay} minutes from black screen end`);
      navigation.navigate(screen.route);
      
      // جدولة نهاية الشاشة
      const endTimeout = setTimeout(() => {
        console.log(`Ending ${screen.name} screen after ${screen.duration} minutes`);
        
        if (isLastScreen) {
          // آخر شاشة: العودة لشاشة مواعيد الصلاة
          console.log('Returning to PrayerTimes (last screen ended)');
          navigation.navigate('PrayerTimes');
        } else {
          // ليس آخر شاشة: الانتقال للشاشة التالية سيحدث في موعده
          console.log(`${screen.name} ended, next screen will start automatically`);
        }
      }, screen.duration * 60 * 1000);
      
      scheduledTimeoutsRef.current.push(endTimeout);
    }, startDelay * 60 * 1000);
    
    scheduledTimeoutsRef.current.push(startTimeout);
    
    // تحديث الوقت الحالي
    currentTime = startDelay + screen.duration;
  });
  
  // إضافة جدولة للعودة النهائية لشاشة مواعيد الصلاة (احتياطي)
  const finalReturnTimeout = setTimeout(() => {
    console.log('Final return to PrayerTimes (safety timeout)');
    navigation.navigate('PrayerTimes');
  }, (currentTime + 1) * 60 * 1000); // دقيقة إضافية للأمان
  
  scheduledTimeoutsRef.current.push(finalReturnTimeout);
  
  console.log(`All screens scheduled. Total sequence duration: ${currentTime} minutes`);
}, [postPrayerSettings, navigation, clearScheduledScreens]);

// Clean up scheduled screens when component unmounts
useEffect(() => {
  return () => {
    clearScheduledScreens();
  };
}, [clearScheduledScreens]);

useEffect(() => {
  const updateCountdown = () => {
    if (prayerTimes.length === 0) return;
  
    const now = new Date();
  
    // نتحقق أولًا من وجود وقت بين الأذان والإقامة
    for (let i = 0; i < prayerTimes.length; i++) {
      const [h, m] = prayerTimes[i].time.split(':');
      const azanTime = new Date();
      azanTime.setHours(h, m, 0, 0);
  
      const iqamaMinutes = iqamaDurations[prayerTimes[i].name] || 0;
      const iqamaTime = new Date(azanTime.getTime() + iqamaMinutes * 60000);
  
      // Check if it's exactly iqama time and black screen is enabled
      if (blackScreenSettings.enabled && 
          blackScreenSettings.durations[prayerTimes[i].name] > 0 &&
          Math.abs(now - iqamaTime) < 1000 && // Within 1 second of iqama time
          !showBlackScreen) {
        const duration = blackScreenSettings.durations[prayerTimes[i].name];
        setShowBlackScreen(true);
        setBlackScreenTimeLeft(duration * 60); // Convert minutes to seconds
      }
  
      if (now >= azanTime && now < iqamaTime) {
        const diff = iqamaTime - now;
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        
        setCountdown(`الإقامة بعد ${toArabicNumbers(mins)}:${toArabicNumbers(secs.toString().padStart(2, '0'))}`);
        setNextPrayer({ name: '', time: '' });
        return;
      }
    }
  
    // إذا لم يكن هناك وقت إقامة، نعرض العد التنازلي للصلاة التالية
    for (let i = 0; i < prayerTimes.length; i++) {
      const [h, m] = prayerTimes[i].time.split(':');
      const azanTime = new Date();
      azanTime.setHours(h, m, 0, 0);
  
      if (azanTime > now) {
        const diff = azanTime - now;
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
  
        setNextPrayer(prayerTimes[i]);
        if (hours > 0) {
          setCountdown(`${toArabicNumbers(hours)}:${toArabicNumbers(mins.toString().padStart(2, '0'))}:${toArabicNumbers(secs.toString().padStart(2, '0'))}`);
        } else {
          setCountdown(`${toArabicNumbers(mins)}:${toArabicNumbers(secs.toString().padStart(2, '0'))}`);
        }
        return;
      }
    }
  
    // إذا انتهت جميع الصلوات، نعرض صلاة الفجر في اليوم التالي
    const [h, m] = prayerTimes[0].time.split(':');
    const tomorrowAzan = new Date();
    tomorrowAzan.setDate(tomorrowAzan.getDate() + 1);
    tomorrowAzan.setHours(h, m, 0, 0);
  
    const diff = tomorrowAzan - now;
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
  
    setNextPrayer(prayerTimes[0]);
    if (hours > 0) {
      setCountdown(`${toArabicNumbers(hours)}:${toArabicNumbers(mins.toString().padStart(2, '0'))}:${toArabicNumbers(secs.toString().padStart(2, '0'))}`);
    } else {
      setCountdown(`${toArabicNumbers(mins)}:${toArabicNumbers(secs.toString().padStart(2, '0'))}`);
    }
  };

  // تشغيل فوري لتحديث العد التنازلي
  updateCountdown();
  
  // تشغيل كل ثانية
  const interval = setInterval(() => {
    updateCountdown();
    setCurrentTime(new Date());
  }, 1000);

  return () => clearInterval(interval);
}, [prayerTimes, iqamaDurations, blackScreenSettings, showBlackScreen]);

  // Black screen countdown timer
  useEffect(() => {
    let interval;
    if (showBlackScreen && blackScreenTimeLeft > 0) {
      interval = setInterval(() => {
        setBlackScreenTimeLeft(prev => {
          if (prev <= 1) {
            setShowBlackScreen(false);
            // Schedule post-prayer screens when black screen ends
            schedulePostPrayerScreens();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showBlackScreen, blackScreenTimeLeft, schedulePostPrayerScreens]);

 // تحديث الطقس كل نصف ساعة
useEffect(() => {
  const weatherUpdateInterval = setInterval(async () => {
    console.log('Auto-updating weather data...');
    const savedLocation = await AsyncStorage.getItem('userLocation');
    if (savedLocation) {
      const coords = JSON.parse(savedLocation);
      await fetchWeatherData(coords.latitude, coords.longitude, false);
    }
  }, 30 * 60 * 1000);

  return () => clearInterval(weatherUpdateInterval);
}, []);

// تحديث مواعيد الصلاة يومياً في منتصف الليل
useEffect(() => {
  const checkDailyUpdate = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    
    const timeUntilMidnight = midnight - now;
    
    setTimeout(async () => {
      console.log('Daily prayer times update at midnight...');
      const savedLocation = await AsyncStorage.getItem('userLocation');
      if (savedLocation) {
        const coords = JSON.parse(savedLocation);
        await fetchPrayerTimesByCoords(coords.latitude, coords.longitude, false);
      }
      
      checkDailyUpdate();
    }, timeUntilMidnight);
  };
  
  checkDailyUpdate();
}, []);



  const exitBlackScreen = () => {
    setShowBlackScreen(false);
    setBlackScreenTimeLeft(0);
    // Schedule post-prayer screens when black screen is manually exited
    schedulePostPrayerScreens();
  };

  const formatTimeFromSeconds = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${toArabicNumbers(mins)}:${toArabicNumbers(secs.toString().padStart(2, '0'))}`;
  };

// Black Screen Overlay Component
const BlackScreenOverlay = () => (
  <View style={styles.blackScreenOverlay}>
    <View style={styles.blackScreenContent}>
      <Text style={styles.blackScreenText}>
        وقت الصلاة
      </Text>
      {blackScreenTimeLeft > 0 && (
        <Text style={styles.blackScreenCountdown}>
          {formatTimeFromSeconds(blackScreenTimeLeft)}
        </Text>
      )}
    </View>
    <TouchableOpacity 
      style={styles.exitButton} 
      focusable={true}
      onPress={exitBlackScreen}
    >
      <Text style={styles.exitButtonText}>خروج</Text>
    </TouchableOpacity>
  </View>
);

// Portrait layout
if (orientation === 'portrait') {
  return (
    <ImageBackground source={backgroundImage ? { uri: backgroundImage } : require('../assets/pexels-pashal-337904.jpg')} style={styles.backgroundPortrait} resizeMode="cover">
      <View style={styles.overlayPortrait}>
        {/* Header with menu and mosque info */}
        <View style={styles.headerPortrait}>
          <TouchableOpacity focusable={true}
hasTVPreferredFocus={true}   onPress={() => navigation.openDrawer()} style={styles.menuButtonPortrait}>
            <Ionicons name="menu" size={28} color="#fff" />
          </TouchableOpacity>
          

          <View style={styles.mosqueInfoPortrait}>
                        <Text style={styles.mosqueNamePortrait}>{mosqueName}</Text>
          </View>
          </View>


            <View style={styles.weatherContainerPortrait}>
              <Text style={styles.currentTempPortrait}>
                {temperature !== null ? `${toArabicNumbers(temperature)}°` : ''}
              </Text>
              <Text style={styles.tempRangePortrait}>
                {tempMax !== null && tempMin !== null ? `${toArabicNumbers(tempMax)}° ${toArabicNumbers(tempMin)}°` : ''}
              </Text>
            </View>

          

        {/* Date and Time Section */}
        <View style={styles.dateTimePortrait}>
          <Text style={styles.hijriDatePortrait}>{hijriDate}</Text>
          <Text style={styles.timePortrait}>
            {toArabicNumbers(currentTime.toLocaleTimeString('ar-EG', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }))} 
          </Text>
          <Text style={styles.gregorianDatePortrait}>{gregorianDate}</Text>
        </View>

        {/* Next Prayer Countdown */}
        <View style={styles.nextPrayerPortrait}>
          <Text style={styles.countdownPortrait}>{countdown}</Text>
          {nextPrayer.name && (
            <Text style={styles.nextPrayerNamePortrait}>باقي على {nextPrayer.name}</Text>
          )}
        </View>

        {/* Dhikr Section */}
        <View style={styles.dhikrPortrait}>
          <Text style={styles.dhikrTextPortrait}>{currentVerse}</Text>
        </View>

        {/* Prayer Times Grid */}
        <View style={styles.prayerGridPortrait}>
          {/* First row - 2 prayers */}
          <View style={styles.prayerRowPortrait}>
            {prayerTimes.slice(0, 2).map((prayer, index) => (
              <View key={index} style={styles.prayerCardPortrait}>
                <Text style={styles.prayerNamePortrait}>{prayer.name}</Text>
                <Text style={styles.prayerTimePortrait}>{formatTime12Hour(prayer.time)}</Text>
                <Text style={styles.iqamaPortrait}>بعد {toArabicNumbers(iqamaDurations[prayer.name])} د</Text>
              </View>
            ))}
          </View>
          
          {/* Second row - 2 prayers */}
          <View style={styles.prayerRowPortrait}>
            {prayerTimes.slice(2, 4).map((prayer, index) => (
              <View key={index + 2} style={styles.prayerCardPortrait}>
                <Text style={styles.prayerNamePortrait}>{prayer.name}</Text>
                <Text style={styles.prayerTimePortrait}>{formatTime12Hour(prayer.time)}</Text>
                <Text style={styles.iqamaPortrait}>بعد {toArabicNumbers(iqamaDurations[prayer.name])} د</Text>
              </View>
            ))}
          </View>
          
          {/* Third row - 1 prayer centered */}
          <View style={styles.prayerRowCenterPortrait}>
            {prayerTimes.slice(4, 5).map((prayer, index) => (
              <View key={index + 4} style={styles.prayerCardPortrait}>
                <Text style={styles.prayerNamePortrait}>{prayer.name}</Text>
                <Text style={styles.prayerTimePortrait}>{formatTime12Hour(prayer.time)}</Text>
                <Text style={styles.iqamaPortrait}>بعد {toArabicNumbers(iqamaDurations[prayer.name])} د</Text>
              </View>
            ))}
          </View>
        </View>

        {/* News Ticker */}
        {newsSettings.enabled && newsSettings.text && (
<View style={styles.newsBarPortrait}>
  <View 
    style={styles.marqueeContainer}
    onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
  >
    <ScrollView
      ref={scrollViewRef}
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      scrollEnabled={false}
      style={styles.animatedNewsContainer}
      contentContainerStyle={{ 
        flexDirection: 'row', 
        alignItems: 'center',
        minWidth: containerWidth * 2
      }}      >
      {/* النص الأصلي */}
      <Text
style={[styles.newsText, { textAlign: 'right' }]}          onLayout={(e) => {
          const width = e.nativeEvent.layout.width;
          if (width > 0 && width !== contentWidth) {
            setContentWidth(width);
          }
        }}
        numberOfLines={1}
      >
        {formatNewsText(newsSettings.text)}
      </Text>
      
      {/* مساحة فارغة */}
      <View style={{ width: 100 }} />
      
      {/* النص مكرر للاستمرارية */}
      <Text
style={[styles.newsText, { textAlign: 'right' }]}          numberOfLines={1}
      >
        {formatNewsText(newsSettings.text)}
      </Text>
      
      {/* مساحة فارغة تانية */}
      <View style={{ width: 100 }} />
      
      {/* النص مكرر مرة تالتة */}
      <Text
style={[styles.newsText, { textAlign: 'right' }]}
        numberOfLines={1}
      >
        {formatNewsText(newsSettings.text)}
      </Text>
    </ScrollView>
  </View>
</View>
)}

      </View>
      
      {/* Black Screen Overlay */}
      {showBlackScreen && <BlackScreenOverlay />}
    </ImageBackground>
  );
}

return (
  <ImageBackground source={backgroundImage ? { uri: backgroundImage } : require('../assets/pexels-pashal-337904.jpg')} style={styles.backgroundPortrait} resizeMode="cover">
    <View style={styles.overlay}>
      <View style={styles.mainContent}>
        <View style={styles.headerSection}>
          <TouchableOpacity 
  focusable={true}
  hasTVPreferredFocus={true}  // ← ضيف السطر ده
  onPress={() => navigation.openDrawer()}
  style={{ 
    padding: 10,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'transparent',
  }}
>
  <Ionicons name="menu" size={32} color="#fff" />
</TouchableOpacity>

          <View>
            <View style={styles.weatherContainer}>
              {weatherIcon && (
                <FontAwesome name="cloud" size={24} color="#fff" />
              )}
              <Text style={styles.weatherTemp}>{temperature !== null ? `${toArabicNumbers(temperature)}°` : ''}</Text>
            </View>
          
            <Text style={styles.weatherMinMax}>
              {tempMax !== null && tempMin !== null ? `${toArabicNumbers(tempMax)} / ${toArabicNumbers(tempMin)}` : ''}
            </Text>
          </View>

          <Text style={styles.subtitle}>{hijriDate}      {gregorianDate}</Text>
          <Text style={styles.subtitle}>{mosqueName}</Text>
        </View>

        <View style={styles.timeCountdownContainer}>
          <Text style={styles.verse}>{currentVerse}</Text>
          <Text style={styles.timeText}>
            {toArabicNumbers(currentTime.toLocaleTimeString('ar-EG', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true
            }))}
          </Text>
          <View style={styles.countdownBox}>
            <Text style={styles.countdownText}>{countdown}</Text>
            {nextPrayer.name ? (
              <Text style={styles.nextPrayerText}>باقي علي {nextPrayer.name}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.bottomSection}>
          {prayerTimes.map((prayer, index) => (
            <View key={index} style={styles.prayerBox}>
              <Text style={styles.prayerName}>{prayer.name}</Text>
              <Text style={styles.prayerTime}>{formatTime12Hour(prayer.time)}</Text>
              <Text style={styles.iqamaText}>بعد {toArabicNumbers(iqamaDurations[prayer.name])} د</Text>
            </View>
          ))}
        </View>
      </View>

      {newsSettings.enabled && newsSettings.text && (
<View style={styles.newsBar}>
  <View 
    style={styles.marqueeContainer}
    onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
  >
    <ScrollView
      ref={scrollViewRef}
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      scrollEnabled={false}
      style={styles.animatedNewsContainer}
      contentContainerStyle={{ 
        flexDirection: 'row', 
        alignItems: 'center',
        minWidth: containerWidth * 2
      }}        

    >
      {/* النص الأصلي */}
      <Text
style={[styles.newsText, { textAlign: 'right' }]}
        onLayout={(e) => {
          const width = e.nativeEvent.layout.width;
          if (width > 0 && width !== contentWidth) {
            setContentWidth(width);
          }
        }}
        numberOfLines={1}
      >
        {formatNewsText(newsSettings.text)}
      </Text>
      
      {/* مساحة فارغة */}
      <View style={{ width: 100 }} />
      
      {/* النص مكرر للاستمرارية */}
      <Text
style={[styles.newsText, { textAlign: 'right' }]}          numberOfLines={1}
      >
        {formatNewsText(newsSettings.text)}
      </Text>
      
      {/* مساحة فارغة تانية */}
      <View style={{ width: 100 }} />
      
      {/* النص مكرر مرة تالتة */}
      <Text
style={[styles.newsText, { textAlign: 'right' }]}          numberOfLines={1}
      >
        {formatNewsText(newsSettings.text)}
      </Text>
    </ScrollView>
  </View>
</View>
)}
    </View>
    
    {/* Black Screen Overlay */}
    {showBlackScreen && <BlackScreenOverlay />}
  </ImageBackground>
);
}

const styles = StyleSheet.create({
background: {
  flex: 1,
},
overlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  paddingHorizontal: 10,
},
mainContent: {
  flex: 1,
  justifyContent: 'space-between',
},
headerSection: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 20,
  marginBottom: 10,
},
subtitle: {
  fontSize: 28,
  color: '#fff',
  textAlign: 'center',
  alignSelf: 'flex-start',
  marginLeft: 50,
},
weatherContainer: {
  alignItems: 'center',
  flexDirection: 'row',
},
weatherTemp: {
  fontSize: 20,
  color: '#fff',
},
weatherMinMax: {
  fontSize: 16,
  color: '#fff',
},
timeCountdownContainer: {
  flex: 1,
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  gap: 10,
  marginVertical: 10,
},
timeText: {
  alignContent: 'center',
  fontSize: 46,
  color: '#fff',
  fontWeight: 'bold',
},
countdownBox: {
  width: 150,
  height: 150,
  backgroundColor: 'rgba(255, 255, 255, 0.46)',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: 70,
  marginLeft: 15,
  padding: 15,
},
countdownText: {
  fontSize: 36,
  color: '#000',
  fontWeight: '400',
  textAlign: 'center',
},
nextPrayerText: {
  fontSize: 24,
  color: '#000',
  marginTop: 2,
  textAlign: 'center'
},
bottomSection: {
  flex: 1,
  flexDirection:'row-reverse',
  flexWrap: 'wrap',
  justifyContent: 'space-around',
},
prayerBox: {
  width: '18%',
  height: 134,
  backgroundColor: 'rgba(255, 255, 255, 0.46)',
  marginHorizontal: 5,
  borderRadius: 70,
  justifyContent: 'center',
  alignItems: 'center',
},
prayerName: {
  fontSize: 28,
  fontWeight: '500',
  color: '#000',
},
prayerTime: {
  fontSize: 38,
  color: '#000',
  fontWeight: '500',
},
iqamaText: {
  fontSize: 20,
  color: '#000',
  textAlign: 'center',
},
verse: {
  width: '25%',
  color: 'white',
  fontSize: 24,
  fontWeight: '600',
},
newsBar: {
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  paddingVertical: 8,
  paddingHorizontal: 0,
  width: '100%',
  alignSelf: 'flex-end',
  overflow: 'hidden',
  height: 40,
},

marqueeContainer: {
  flex: 1,
  justifyContent: 'center',
  overflow: 'hidden',
  width: '100%',
  height: '100%',
},
animatedNewsContainer: {
  flexDirection: 'row',
  // alignItems: 'center',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
},
newsText: {
  color: '#ffffff',
  fontSize: Math.min(16, screenWidth * 0.04),
  fontWeight: '600',
  letterSpacing: 0.5,
  textAlign: 'left',
  includeFontPadding: false,
  textAlignVertical: 'center',
  flexShrink: 0,
  flexWrap: 'nowrap',
},
newsSeparator: {
  color: '#FFD700',
  fontWeight: 'bold',
  fontSize: 18,
},

// Portrait styles
backgroundPortrait: {
  flex: 1,
},
overlayPortrait: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.5)',
  paddingHorizontal: screenWidth * 0.05, // 5% من عرض الشاشة
  paddingTop: screenHeight * 0.02, // 2% من ارتفاع الشاشة
  paddingBottom: screenHeight * 0.01,
},
headerPortrait: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: screenHeight * 0.01,
  height: screenHeight * 0.08, // ارتفاع ثابت للهيدر
  
},
menuButtonPortrait: {
  padding: screenWidth * 0.02,
  borderWidth: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.09)',
  borderRadius: 10,
  borderColor: 'rgba(255, 255, 255, 0.09)',
},
mosqueInfoPortrait: {
  position: 'absolute', // هنا السحر 🎯
  left: 0,
  right: 0,
  alignItems: 'center',
  justifyContent: 'center',
  marginVertical: screenHeight * 0.01,
  height: screenHeight * 0.08, // ارتفاع ثابت
  // marginTop: -screenHeight * 0.015,
},
mosqueNamePortrait: {
  fontSize: Math.min(screenWidth * 0.07, 24), // متجاوب مع حد أقصى
  color: '#fff',
  fontWeight: 'bold',
  marginBottom: 5,
},
 weatherPortrait: {  
  fontSize: Math.min(screenWidth * 0.045, 20), 
  color: '#fff',
},
dateTimePortrait: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.46)',
  padding: screenHeight * 0.015,
  borderRadius: 15,
  marginTop: screenHeight * 0.05,
  height: screenHeight * 0.1, // ارتفاع ثابت
},
hijriDatePortrait: {
  fontSize: Math.min(screenWidth * 0.060, 18),
  color: '#000',
  fontWeight: 'bold'
},
timePortrait: {
  fontSize: Math.min(screenWidth * 0.08, 32),
  color: '#000',
  fontWeight: 'bold'
},
gregorianDatePortrait: {
  fontSize: Math.min(screenWidth * 0.060, 18),
  color: '#000',
  fontWeight: 'bold'
},
nextPrayerPortrait: {
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  padding: screenHeight * 0.025,
  borderRadius: 15,
  alignItems: 'center',
  marginVertical: screenHeight * 0.015,
  flexDirection: 'row',
  justifyContent: 'space-around',
  height: screenHeight * 0.12, // ارتفاع ثابت
},
countdownPortrait: {
  fontSize: Math.min(screenWidth * 0.1, 36),
  color: '#2E8B57',
  fontWeight: 'bold',
  textAlign: 'center',
},
nextPrayerNamePortrait: {
  fontSize: Math.min(screenWidth * 0.08, 22),
  color: '#2E8B57',
  marginTop: 5,
  textAlign: 'center',
  fontWeight: '600',
},
dhikrPortrait: {
  backgroundColor: 'rgba(255, 255, 255, 0.46)',
  padding: screenHeight * 0.015,
  borderRadius: 15,
  marginVertical: screenHeight * 0.004,
  height: screenHeight * 0.1, // ارتفاع ثابت
  justifyContent: 'center', // توسيط النص عمودياً
},
dhikrTextPortrait: {
  fontSize: Math.min(screenWidth * 0.08, 20),
  color: '#000',
  fontWeight: 'bold',
  textAlign: 'center'
},
// هنا التعديل الأهم - إزالة flex وتحديد ارتفاع ثابت
prayerGridPortrait: {
  height: screenHeight * 0.35, // ارتفاع ثابت بدلاً من flex
  justifyContent: 'space-between', // توزيع متساوي
  marginVertical: screenHeight * 0.01,
},
prayerRowPortrait: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginVertical: screenHeight * 0.005,
  paddingHorizontal: screenWidth * 0.02,
},
prayerRowCenterPortrait: {
  flexDirection: 'row',
  justifyContent: 'center',
  marginVertical: screenHeight * 0.008,
},
prayerCardPortrait: {
  width: screenWidth * 0.4, // عرض متجاوب
  minHeight: screenHeight * 0.1, // ارتفاع أدنى
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  paddingVertical: screenHeight * 0.001,
  paddingHorizontal: screenWidth * 0.02,
  borderRadius: 15,
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5
},
prayerNamePortrait: {
  fontSize: Math.min(screenWidth * 0.07, 20),
  fontWeight: 'bold',
  color: '#2E8B57',
  textAlign: 'center',
},
prayerTimePortrait: {
  fontSize: Math.min(screenWidth * 0.075, 26), // أصغر قليلاً للشاشات الصغيرة
  color: '#000',
  fontWeight: 'bold',
  textAlign: 'center',
},
iqamaPortrait: {
  fontSize: Math.min(screenWidth * 0.04, 16),
  color: '#666',
  textAlign: 'center'
},
newsBarPortrait: {
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  paddingVertical: screenHeight * 0.015,
  paddingHorizontal: 5,
  borderRadius: 12,
  overflow: 'hidden',
  height: screenHeight * 0.06,
  marginTop: screenHeight * 0.01,
  borderLeftWidth: 3,
  borderLeftColor: '#28a745',
  width: '100%',
},
weatherContainerPortrait: {
  position: 'absolute', 
  justifyContent: 'center',
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: screenHeight * 0.09,
  marginLeft: screenWidth * 0.35,

},

currentTempPortrait: {
  backgroundColor: 'rgba(255, 255, 255, 0.46)',
  paddingHorizontal: screenWidth * 0.025,
  paddingVertical: screenHeight * 0.008,
  borderRadius: 10,
  marginRight: 10,
  fontSize: Math.min(screenWidth * 0.065, 18),
  fontWeight: 'bold',
  textAlign: 'center',
  color: '#000',
},
tempRangePortrait: {
  fontSize: Math.min(screenWidth * 0.05, 16),
  color: '#fff',
  opacity: 0.9,
},

// Black Screen Overlay Styles
blackScreenOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: '#000',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
},
blackScreenContent: {
  alignItems: 'center',
  justifyContent: 'center',
},
blackScreenText: {
  color: '#fff',
  fontSize: 36,
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: 30,
},
exitButton: {
  position: 'absolute',
  bottom: 30,
  right: 30,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  paddingHorizontal: 20,
  paddingVertical: 10,
  borderRadius: 25,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.3)',
},
exitButtonText: {
  color: '#fff',
  fontSize: 18,
  fontWeight: 'bold',
},
});