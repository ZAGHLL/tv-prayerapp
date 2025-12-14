import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet,Alert, TouchableOpacity, ImageBackground, Animated, Dimensions, ScrollView, Image, AppState, Easing } from 'react-native';
import * as Location from 'expo-location';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useTVRemote } from '../hooks/useTVRemote';

// Total Quran pages for Daily Wird
const DAILY_WIRD_TOTAL_PAGES = 604;



export default function PrayerTimesScreen() {
  const navigation = useNavigation();
  
  // Dynamic screen dimensions
  const [screenDimensions, setScreenDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });
  
  const [prayerTimes, setPrayerTimes] = useState([]);
  const [sunriseTime, setSunriseTime] = useState(''); // وقت الشروق منفصل
  const [imsakTime, setImsakTime] = useState(''); // وقت الإمساك منفصل
  const [showSunrise, setShowSunrise] = useState(true); // للتبديل بين الشروق والإمساك
  const [nextPrayer, setNextPrayer] = useState({ name: '', time: '' });
  const [countdown, setCountdown] = useState('');
  const [hijriDate, setHijriDate] = useState('');
  const [gregorianDate, setGregorianDate] = useState('');
  const [dayName, setDayName] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [orientation, setOrientation] = useState('portrait');
  const [temperature, setTemperature] = useState(null);
  const [weatherIcon, setWeatherIcon] = useState(null);
  const [tempMax, setTempMax] = useState(null);
  const [tempMin, setTempMin] = useState(null);
  const [mosqueName, setMosqueName] = useState('مسجد الفاروق');
  const [backgroundImage, setBackgroundImage] = useState(null);

  // TV Focus Management
  const [currentFocusedElement, setCurrentFocusedElement] = useState(null);
  const handleFocus = (elementName) => setCurrentFocusedElement(elementName);
  const handleBlur = () => setCurrentFocusedElement(null);
  const isFocused = (elementName) => currentFocusedElement === elementName;
  
  // Force menu button to regain focus when returning to screen
  const [focusKey, setFocusKey] = useState(0);

  const [isLoadingPrayer, setIsLoadingPrayer] = useState(false);
const [isLoadingWeather, setIsLoadingWeather] = useState(false);
const [lastPrayerUpdate, setLastPrayerUpdate] = useState(null);
const [lastWeatherUpdate, setLastWeatherUpdate] = useState(null);
const [userLocation, setUserLocation] = useState(null);

const [showNumericDate, setShowNumericDate] = useState(false);
const [hijriDateNumeric, setHijriDateNumeric] = useState('');
const [gregorianDateNumeric, setGregorianDateNumeric] = useState('');
const [userCity, setUserCity] = useState('');
const [userCountry, setUserCountry] = useState('');

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
    },
    text: 'وقت الصلاة'
  });
  const [showBlackScreen, setShowBlackScreen] = useState(false);
  const [blackScreenTimeLeft, setBlackScreenTimeLeft] = useState(0);
  const [fridayOverrides, setFridayOverrides] = useState({ iqamaJumuah: null, blackScreenJumuah: null });
  
  const [showDuaaScreen, setShowDuaaScreen] = useState(false);
  const [currentDuaaIndex, setCurrentDuaaIndex] = useState(0);
  const [iqamaCountdown, setIqamaCountdown] = useState('');
  const [currentPrayerName, setCurrentPrayerName] = useState('');

  // ✅ Animation values for screens
  const duaaOpacity = useRef(new Animated.Value(0)).current;
  const duaaScale = useRef(new Animated.Value(0.8)).current;
  const blackScreenOpacity = useRef(new Animated.Value(0)).current;
  const blackScreenScale = useRef(new Animated.Value(0.9)).current;

  const duaaBetweenAdhanIqama = [
    {
      title: "دعاء بعد الوضوء",
      duaa: "أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ، اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ، وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ",
      source: "(من يتوضأ هذا التوضؤ ثم خرج إلى المسجد، فتح له أبواب الجنة يدخل من أيها شاء)"
    },
    {
      title: "دعاء دخول المسجد",
      duaa: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
      source: "(وَعِنْدَ الْخُرُوجِ: إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ)"
    },
    {
      title: "الدعاء بعد الأذان",
      duaa: "اللَّهُمَّ رَبَّ هَٰذِهِ الدَّعْوَةِ التَّامَّةِ، وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ، وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ",
      source: "(من قالها بعد سماع الأذان حلت له شفاعة النبي ﷺ يوم القيامة)"
    },
    {
      title: "أدعية بين الأذان والإقامة",
      duaa: "اللَّهُمَّ إِنِّي أَسْأَلُكَ أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ أَصْلِحْ لِي دِينِي أَهْجِنِّي الْأَعْمَالَ وَالْأَخْلَاقَ، جَعَلَ قَلْبِي خَاشِعًا، وَاسَلَكَ ذَاكِرًا وَعَمَلِي صَالِحًا اللَّهُمَّ مِنَ الْقَنُوتِينَ فِي هَٰذِهِ الصَّلَاةِ وَمِنَ الَّذِينَ يَسْتَمِعُونَ وَمِنَ الَّذِينَ يَتَّبِعُونَ أَحْسَنَهُ",
      source: "(وقت إجابة من أوقات الدعاء)"
    },
    {
      title: "تذكير بفضل الخشوع في الصلاة",
      duaa: "﴿قَدْ أَفْلَحَ الْمُؤْمِنُونَ، الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ﴾",
      source: "التشهد، حضور القلب، الأفئدة والحركات، فهي روح الصلاة، سر بقبها"
    }
  ];  

  // السنن الرواتب لكل صلاة
const sunanRawatib = {
  'الفجر': { before: "2 ركعه", after: "0 ركعه" },
  'الظهر': { before: "4 ركعات", after: "2 ركعه" },
  'العصر': { before: "0 ركعه" , after: "0 ركعه" },
  'المغرب': { before: "0 ركعه", after: "2 ركعه" },
  'العشاء': { before: "0 ركعه", after: "2 ركعه" },
  'الجمعة': { before: "0 ركعه", after: "4 ركعات" } // الجمعة بدل الظهر
};

// دالة للحصول على معلومات السنن
const getSunanForPrayer = (prayerName) => {
  return sunanRawatib[prayerName] || { before: 0, after: 0 };
};


  // Post-prayer screen scheduling states
  const [postPrayerSettings, setPostPrayerSettings] = useState({
    enabled: false,
    screens: {
      azkar: { enabled: false, startAfter: 0, duration: 0 },
      quran: { enabled: false, startAfter: 0, duration: 0 },
      dailyWird: { enabled: false, startAfter: 0, duration: 0, imagesCount: 1, minutesPerImage: 1 },
      liveMakkah: { enabled: false, startAfter: 0, duration: 0 },
      liveMadina: { enabled: false, startAfter: 0, duration: 0 }, // إضافة جديدة

    }
  });
  
  // Pre-prayer screen scheduling states (قبل الصلاة)
  const [prePrayerSettings, setPrePrayerSettings] = useState({
    enabled: false,
    screens: {
      azkar: { enabled: false, startBefore: 0, duration: 0 },
      quran: { enabled: false, startBefore: 0, duration: 0 },
      dailyWird: { enabled: false, startBefore: 0, duration: 0, imagesCount: 1, minutesPerImage: 1 },
      liveMakkah: { enabled: false, startBefore: 0, duration: 0 },
      liveMadina: { enabled: false, startBefore: 0, duration: 0 },
    }
  });
  
  const scheduledTimeoutsRef = useRef([]);
  const scheduledPrePrayerTimeoutsRef = useRef([]);
  const lastAdvanceCheckKeyRef = useRef('');
  const scheduledPrePrayersRef = useRef(new Set()); // لتتبع الصلوات التي تم جدولة الشاشات قبلها

  const scrollViewRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(screenDimensions.width);
  const rafRef = useRef(null);
  const lastTsRef = useRef(null);

  // Helper function for prayer icons
  const getPrayerIcon = (prayerName) => {
    const name = prayerName.toLowerCase();
    
    if (name.includes('فجر') || name.includes('fajr')) return 'moon-outline';
    if (name.includes('ظهر') || name.includes('dhuhr') || name.includes('zuhr')) return 'sunny';
    if (name.includes('عصر') || name.includes('asr')) return 'partly-sunny';
    if (name.includes('مغرب') || name.includes('maghrib')) return 'cloudy-night';
    if (name.includes('عشاء') || name.includes('isha')) return 'moon';
    
    return 'time-outline';
  };
  
  const getPrayerColor = (prayerName) => {
    const name = prayerName.toLowerCase();
    
    if (name.includes('فجر') || name.includes('fajr')) return '#4A90E2';
    if (name.includes('ظهر') || name.includes('dhuhr') || name.includes('zuhr')) return '#FFB800';
    if (name.includes('عصر') || name.includes('asr')) return '#FF8C42';
    if (name.includes('مغرب') || name.includes('maghrib')) return '#E74C3C';
    if (name.includes('عشاء') || name.includes('isha')) return '#34495E';
    
    return '#666';
  };
  
  const verses = [
    "وَذَكَرَ اسْمَ رَبِّهِ فَصَلَّى",
    "فَاذْكُرُونِي أَذْكُرْكُمْ",
    "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ",
    "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ",
    "إِنَّ الْحَسَنَاتِ يُذْهِبْنَ السَّيِّئَاتِ",
    "ادْخلوا الْجَنَّةَ بِمَا كنْتمْ تَعْمَلونَ",
    "قُلِ اللَّهُ يُنَجِّيكُمْ مِنْهَا وَمِنْ كُلِّ كَرْبٍ",
    "وَمَنْ يَتَّقِ اللَّهَ يَجْعَلْ لَهُ مَخْرَجًا",
    "أَمَّن يُجِيبُ الْمُضْطَرَّ إِذَا دَعَاهُ",
    "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَى",
    "وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ",
    "وجَزَاهُم بِمَا صَبَرُواْ جَنَّةً وَحَرِيرًا",
    "وَمَنْ يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    "ونَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ",
    "إِنَّ أَكْرَمَكُمْ عِنْدَ اللَّهِ أَتْقَاكُمْ",

  ];

  const [currentVerse, setCurrentVerse] = useState(verses[0]);

  // ============ MEMORY & BACKGROUND CLEANUP ============

useEffect(() => {
  const subscription = AppState.addEventListener('memoryWarning', () => {
    console.warn('⚠️ Memory warning received! Cleaning up...');
    clearScheduledScreens();
    clearScheduledPrePrayerScreens();
    if (global.gc) {
      global.gc();
      console.log('🧹 Manual GC triggered');
    }
  });
  return () => {
    subscription.remove();
  };
}, [clearScheduledScreens, clearScheduledPrePrayerScreens]);

useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'background') {
      console.log('🟡 App went to background - cleaning up timeouts');
      clearScheduledScreens();
      clearScheduledPrePrayerScreens();
    } else if (nextAppState === 'active') {
      console.log('🟢 App became active');
    }
  });
  return () => {
    subscription.remove();
  };
}, [clearScheduledScreens, clearScheduledPrePrayerScreens]);
// ============ END MEMORY & BACKGROUND CLEANUP ============

  useEffect(() => {
    const dateToggleInterval = setInterval(() => {
      setShowNumericDate(prev => !prev);
    }, 60000);

    return () => clearInterval(dateToggleInterval);
  }, []);

  // التبديل بين الشروق والإمساك كل دقيقة في رمضان فقط
  useEffect(() => {
    if (!isRamadan()) return;

    const toggleInterval = setInterval(() => {
      setShowSunrise(prev => !prev);
    }, 120000); // كل دقيقة

    return () => clearInterval(toggleInterval);
  }, [hijriDate]);

  // Listen to dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      console.log('Screen dimensions changed:', window);
      setScreenDimensions({ width: window.width, height: window.height });
      setContainerWidth(window.width);
    });

    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    const verseInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * verses.length);
      setCurrentVerse(verses[randomIndex]);
    }, 30000);

    return () => clearInterval(verseInterval);
  }, []);

  useEffect(() => {
    if (showDuaaScreen) {
      setCurrentDuaaIndex(0); // ✅ reset only once when screen appears
  
      const duaaInterval = setInterval(() => {
        setCurrentDuaaIndex((prev) => (prev + 1) % duaaBetweenAdhanIqama.length);
      }, 30000);
  
      return () => clearInterval(duaaInterval);
    }
  }, [showDuaaScreen]);

  // ✅ Duaa Screen Animation Effect
useEffect(() => {
  if (showDuaaScreen) {
    // Fade in & scale up
    Animated.parallel([
      Animated.timing(duaaOpacity, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(duaaScale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(0.9)),
        useNativeDriver: true,
      }),
    ]).start();
  } else {
    // Fade out & scale down
    Animated.parallel([
      Animated.timing(duaaOpacity, {
        toValue: 0,
        duration: 1200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(duaaScale, {
        toValue: 0.8,
        duration: 900,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }
}, [showDuaaScreen]);

// ✅ Black Screen Animation Effect
useEffect(() => {
  if (showBlackScreen) {
    // Fade in & scale up
    Animated.parallel([
      Animated.timing(blackScreenOpacity, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(blackScreenScale, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.back(0.9)),
        useNativeDriver: true,
      }),
    ]).start();
  } else {
    // Fade out & scale down
    Animated.parallel([
      Animated.timing(blackScreenOpacity, {
        toValue: 0,
        duration: 1200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(blackScreenScale, {
        toValue: 0.9,
        duration: 900,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }
}, [showBlackScreen]);
  

  useTVRemote({
    onBack: () => {
      console.log('🎮 Back pressed in PrayerTimes');
      navigation.closeDrawer();
    },
  });

  // Force menu button focus restoration when screen becomes focused or drawer closes
  useFocusEffect(
    useCallback(() => {
      // Increment key to force re-render and restore focus
      setFocusKey(prev => prev + 1);
      console.log('🎯 Screen focused - restoring menu button focus');
      
      // Listen for drawer state changes
      const unsubscribe = navigation.addListener('state', () => {
        // Small delay to ensure drawer animation is complete
        setTimeout(() => {
          setFocusKey(prev => prev + 1);
          console.log('🎯 Navigation state changed - restoring menu button focus');
        }, 300);
      });
      
      return () => {
        unsubscribe();
      };
    }, [navigation])
  );
  
  // Create dynamic styles based on screen dimensions
  const styles = React.useMemo(() => createStyles(screenDimensions.width, screenDimensions.height), [screenDimensions]);
  
  // تنسيق النص
  const formatNewsText = (text) => {
    if (!text || text.trim() === '') return '';
    // استبدال النقطة (.) بالزخرفة الإسلامية ۞
    return text.trim().replace(/\.\s*/g, ' ◆ ')
  };
  // تقسيم الأخبار لعناصر منفصلة ووضع الأيقونة كفاصل بين العناصر
  const getNewsSegments = (text) => {
    if (!text) return [];
    const normalized = text
      .trim()
      .replace(/\s*•\s*/g, '◆') // دعم الفاصل • من الإعدادات
      .replace(/\.+\s*/g, '◆')  // دعم النقاط المتتالية
      .replace(/\s*◆\s*/g, '◆');
    return normalized.split('◆').map(s => s.trim()).filter(Boolean);
  };
  
  
  const toArabicNumbers = (str) => {
    const numbers = { 0: '٠', 1: '١', 2: '٢', 3: '٣', 4: '٤', 5: '٥', 6: '٦', 7: '٧', 8: '٨', 9: '٩' };
    return str.toString().replace(/[0-9]/g, (digit) => numbers[digit]);
  };

  // دالة للتحقق من رمضان
  const isRamadan = () => {
    if (!hijriDate) return false;
    // استخراج الشهر الهجري من التاريخ
    // التاريخ بصيغة: "١ رمضان ١٤٤٦ هـ"
    return hijriDate.includes('رمضان');
  };

  const formatTime12Hour = (time24) => {
    const [hour, minute] = time24.split(':');
    let h = parseInt(hour);
    const m = minute;
    const suffix = h >= 12 ? 'م' : 'ص';
    h = h % 12 || 12;
    return `${toArabicNumbers(h)}:${toArabicNumbers(m)} ${suffix}`;
  };

// إعادة تعيين موضع التمرير لبداية السلسلة عند تغير النص أو العرض
useEffect(() => {
  if (contentWidth > 0) {
    setScrollPosition(0);
  }
}, [newsSettings.text, contentWidth]);

// تشغيل سلاسة الحركة باستخدام requestAnimationFrame بدون توقف
useEffect(() => {
  if (!newsSettings.enabled || !newsSettings.text || contentWidth === 0) {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    return;
  }

  let isActive = true;
  let frameCount = 0;
  const gapWidth = 100;
  const speedPxPerSecond = 20;

  const step = (ts) => {
    if (!isActive) return;
    
    if (lastTsRef.current == null) {
      lastTsRef.current = ts;
    }
    const dt = (ts - lastTsRef.current) / 1000;
    lastTsRef.current = ts;

    // ✅ نحدث كل 2 frames بدل كل frame
    frameCount++;
    if (frameCount % 2 === 0) {
      setScrollPosition(prev => {
        const cycleWidth = contentWidth + gapWidth;
        let next = prev - speedPxPerSecond * dt * 2;
        if (next < 0) {
          next += cycleWidth;
        }
        return next;
      });
    }

    rafRef.current = requestAnimationFrame(step);
  };

  rafRef.current = requestAnimationFrame(step);

  return () => {
    isActive = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastTsRef.current = null;
  };
}, [newsSettings.enabled, newsSettings.text, contentWidth]);

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
    
    // حفظ وقت الشروق منفصل
    setSunriseTime(timings.Sunrise || '');
    
    // حفظ وقت الإمساك (Imsak) منفصل
    setImsakTime(timings.Imsak || '');

    // مصفوفة أسماء الأشهر الميلادية بالعربي
    const gregorianMonthsAr = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    // تنسيق التاريخ الهجري بشكل مختصر
    const hijriDay = toArabicNumbers(data.data.date.hijri.day);
    const hijriMonthAr = data.data.date.hijri.month.ar || '';
    const hijriYear = toArabicNumbers(data.data.date.hijri.year);
    const formattedHijriDate = `${hijriDay} ${hijriMonthAr} ${hijriYear} هـ`;
    const hijriMonthNumber = toArabicNumbers(data.data.date.hijri.month.number);
    const formattedHijriDateNumeric = `${hijriYear}/${hijriMonthNumber}/${hijriDay} هـ`; 
    
    // تنسيق التاريخ الميلادي بشكل مختصر
    const gregorianDay = toArabicNumbers(data.data.date.gregorian.day);
    const gregorianMonthNumber = parseInt(data.data.date.gregorian.month.number);
    const gregorianMonthAr = gregorianMonthsAr[gregorianMonthNumber - 1] || '';
    const gregorianYear = toArabicNumbers(data.data.date.gregorian.year);
    const formattedGregorianDate = `${gregorianDay} ${gregorianMonthAr} ${gregorianYear} م`;
    const formattedGregorianDateNumeric = `${gregorianYear}/${toArabicNumbers(gregorianMonthNumber)}/${gregorianDay} م`;
    
    // اسم اليوم (مرة واحدة فقط)
    const dayNameAr = data.data.date.hijri.weekday.ar || '';

    // تحديث الحالة
    setPrayerTimes(prayerData);
    setHijriDate(formattedHijriDate);
    setGregorianDate(formattedGregorianDate);
    setHijriDateNumeric(formattedHijriDateNumeric); 
    setGregorianDateNumeric(formattedGregorianDateNumeric);
    setDayName(dayNameAr);
    setLastPrayerUpdate(new Date().getTime());

     // ✅ جلب اسم المدينة والدولة بالعربي
     let cityName = '';
     let countryName = '';
     
     try {
       const geoResponse = await fetch(
         `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ar`
       );
       const geoData = await geoResponse.json();
       
       cityName = geoData.city || geoData.locality || geoData.principalSubdivision || '';
countryName = geoData.countryName || '';

setUserCity(cityName);
setUserCountry(cityName || countryName); // 👈 التعديل الوحيد هنا

console.log('Location data - City:', cityName, 'Country:', countryName);
     } catch (geoError) {
       console.log('Could not get location name, using timezone:', geoError);
       // في حالة الفشل، استخدم timezone كبديل
       const timezone = data.data.meta?.timezone || '';
       if (timezone) {
         // استخراج اسم المدينة من timezone (مثل Africa/Cairo -> Cairo)
         const locationName = timezone.split('/')[1]?.replace(/_/g, ' ') || '';
         countryName = locationName;
         setUserCountry(locationName);
       }
     }

    // حفظ في AsyncStorage
    await AsyncStorage.setItem('prayerData', JSON.stringify({
      prayerTimes: prayerData,
      sunriseTime: timings.Sunrise || '',
      imsakTime: timings.Imsak || '',
      hijriDate: formattedHijriDate,
      gregorianDate: formattedGregorianDate,
      hijriDateNumeric: formattedHijriDateNumeric, 
      gregorianDateNumeric: formattedGregorianDateNumeric,
      dayName: dayNameAr,
      userCity: cityName,
      userCountry: countryName,
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
          },
          text: parsedBlackScreen.text || 'وقت الصلاة'
        });
      }
    }

    // تحميل إعدادات الجمعة (الجمعة بدلاً من الظهر)
    const storedFridaySettings = await AsyncStorage.getItem('fridaySettings');
    if (storedFridaySettings) {
      try {
        const parsedFriday = JSON.parse(storedFridaySettings);
        setFridayOverrides({
          iqamaJumuah: parsedFriday?.iqamaJumuah != null ? parseInt(parsedFriday.iqamaJumuah) : null,
          blackScreenJumuah: parsedFriday?.blackScreenJumuah != null ? parseInt(parsedFriday.blackScreenJumuah) : null,
        });
      } catch (_) {}
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
            dailyWird: {
              enabled: Boolean(parsedPostPrayer.screens?.dailyWird?.enabled),
              startAfter: parseInt(parsedPostPrayer.screens?.dailyWird?.startAfter) || 0,
              duration: parseInt(parsedPostPrayer.screens?.dailyWird?.duration) || 0,
              imagesCount: parseInt(parsedPostPrayer.screens?.dailyWird?.imagesCount) || 1,
              minutesPerImage: parseInt(parsedPostPrayer.screens?.dailyWird?.minutesPerImage) || 1
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

        // تهيئة قيم الورد اليومي لأول مرة
        try {
          if (parsedPostPrayer?.screens?.dailyWird?.enabled) {
            const baseIndexRaw = await AsyncStorage.getItem('dailyWirdBaseIndex');
            if (baseIndexRaw === null) {
              await AsyncStorage.setItem('dailyWirdBaseIndex', '0');
            }
            const lastAdvance = await AsyncStorage.getItem('dailyWirdLastAdvanceDate');
            if (!lastAdvance) {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const y = yesterday.getFullYear();
              const m = String(yesterday.getMonth() + 1).padStart(2, '0');
              const d = String(yesterday.getDate()).padStart(2, '0');
              await AsyncStorage.setItem('dailyWirdLastAdvanceDate', `${y}-${m}-${d}`);
            }
          }
        } catch (e) {}
      }
    }

    // تحميل إعدادات شاشات ما قبل الصلاة
    const storedPrePrayerSettings = await AsyncStorage.getItem('prePrayerSettings');
    if (storedPrePrayerSettings) {
      const parsedPrePrayer = JSON.parse(storedPrePrayerSettings);
      if (parsedPrePrayer && typeof parsedPrePrayer === 'object') {
        setPrePrayerSettings({
          enabled: Boolean(parsedPrePrayer.enabled),
          screens: {
            azkar: {
              enabled: Boolean(parsedPrePrayer.screens?.azkar?.enabled),
              startBefore: parseInt(parsedPrePrayer.screens?.azkar?.startBefore) || 0,
              duration: parseInt(parsedPrePrayer.screens?.azkar?.duration) || 0
            },
            quran: {
              enabled: Boolean(parsedPrePrayer.screens?.quran?.enabled),
              startBefore: parseInt(parsedPrePrayer.screens?.quran?.startBefore) || 0,
              duration: parseInt(parsedPrePrayer.screens?.quran?.duration) || 0
            },
            dailyWird: {
              enabled: Boolean(parsedPrePrayer.screens?.dailyWird?.enabled),
              startBefore: parseInt(parsedPrePrayer.screens?.dailyWird?.startBefore) || 0,
              duration: parseInt(parsedPrePrayer.screens?.dailyWird?.duration) || 0,
              imagesCount: parseInt(parsedPrePrayer.screens?.dailyWird?.imagesCount) || 1,
              minutesPerImage: parseInt(parsedPrePrayer.screens?.dailyWird?.minutesPerImage) || 1
            },
            liveMakkah: {
              enabled: Boolean(parsedPrePrayer.screens?.liveMakkah?.enabled),
              startBefore: parseInt(parsedPrePrayer.screens?.liveMakkah?.startBefore) || 0,
              duration: parseInt(parsedPrePrayer.screens?.liveMakkah?.duration) || 0
            },
            liveMadina: {
              enabled: Boolean(parsedPrePrayer.screens?.liveMadina?.enabled),
              startBefore: parseInt(parsedPrePrayer.screens?.liveMadina?.startBefore) || 0,
              duration: parseInt(parsedPrePrayer.screens?.liveMadina?.duration) || 0
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
};

// حساب الفرق بالأيام (تجاهل الوقت)
const daysBetween = (fromStr, toStr) => {
  try {
    const [fy, fm, fd] = fromStr.split('-').map(Number);
    const [ty, tm, td] = toStr.split('-').map(Number);
    const from = new Date(fy, fm - 1, fd);
    const to = new Date(ty, tm - 1, td);
    const ms = to - from;
    return Math.floor(ms / (24 * 60 * 60 * 1000));
  } catch (_) {
    return 0;
  }
};

// محاولة زيادة الورد اليومي عند الفجر
const maybeAdvanceDailyWirdBaseIndex = async () => {
  try {
    if (!postPrayerSettings?.screens?.dailyWird?.enabled) return;
    
    // إيجاد وقت الفجر لليوم
    const fajrEntry = prayerTimes.find(p => p.name === 'الفجر');
    if (!fajrEntry?.time) return;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const [fh, fm] = fajrEntry.time.split(':').map(Number);
    const fajrToday = new Date(now);
    fajrToday.setHours(fh, fm, 0, 0);

    const lastAdvance = (await AsyncStorage.getItem('dailyWirdLastAdvanceDate')) || null;

    // ✅ تحديد كم يوم نحتاج للانتقال (فقط إذا كان الورد مفعّل اليوم وبعد الفجر)
    let shouldAdvance = false;
    
    if (lastAdvance) {
      const diff = daysBetween(lastAdvance, todayStr);
      // إذا مر يوم أو أكثر ووصلنا الفجر اليوم
      if (diff > 0 && now >= fajrToday) {
        shouldAdvance = true;
      }
    } else {
      // أول مرة: نتقدم بس لو مر الفجر
      if (now >= fajrToday) {
        shouldAdvance = true;
      }
    }

    if (shouldAdvance) {
      const imagesPerSession = parseInt(postPrayerSettings?.screens?.dailyWird?.imagesCount) || 3;
      const currentBaseRaw = await AsyncStorage.getItem('dailyWirdBaseIndex');
      const currentBase = currentBaseRaw ? parseInt(currentBaseRaw) : 0;
      
      // ✅ نتقدم بس بعدد الصور في جلسة واحدة (مش حسب الأيام)
      const newBase = (currentBase + imagesPerSession) % DAILY_WIRD_TOTAL_PAGES;
      
      await AsyncStorage.setItem('dailyWirdBaseIndex', String(newBase));
      await AsyncStorage.setItem('dailyWirdLastAdvanceDate', todayStr);
      
      console.log(`Daily Wird advanced by ${imagesPerSession} pages to base ${newBase} on ${todayStr}`);
    }
  } catch (e) {
    console.log('maybeAdvanceDailyWirdBaseIndex error:', e);
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
    
    // Ensure dimensions are correct at start
    const { width, height } = Dimensions.get('window');
    setScreenDimensions({ width, height });
    setContainerWidth(width);
    console.log('Initial dimensions:', width, height);
    
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
          setSunriseTime(parsed.sunriseTime || '');
          setImsakTime(parsed.imsakTime || '');
          setHijriDate(parsed.hijriDate || '');
          setGregorianDate(parsed.gregorianDate || '');
          setHijriDateNumeric(parsed.hijriDateNumeric || '');
          setGregorianDateNumeric(parsed.gregorianDateNumeric || '');
          setDayName(parsed.dayName || '');
          setUserCity(parsed.userCity || '');
          setUserCountry(parsed.userCountry || '');
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
          
          // Update dimensions after orientation change
          setTimeout(() => {
            const { width, height } = Dimensions.get('window');
            console.log('Updating dimensions after orientation:', width, height);
            setScreenDimensions({ width, height });
            setContainerWidth(width);
          }, 100);
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

  // Clear all scheduled pre-prayer timeouts
  const clearScheduledPrePrayerScreens = useCallback(() => {
    scheduledPrePrayerTimeoutsRef.current.forEach(timeout => {
      if (timeout) {
        clearTimeout(timeout);
      }
    });
    scheduledPrePrayerTimeoutsRef.current = [];
    console.log('All scheduled pre-prayer screens cleared');
  }, []);

  // Schedule pre-prayer screens function (قبل الأذان)
  const schedulePrePrayerScreens = useCallback((minutesBeforeAzan) => {
    clearScheduledPrePrayerScreens();
    
    if (!prePrayerSettings.enabled) {
      console.log('Pre-prayer screens are disabled');
      return;
    }
    
    console.log(`Scheduling pre-prayer screens ${minutesBeforeAzan} minutes before azan...`);
    
    const { azkar, quran, dailyWird, liveMakkah, liveMadina } = prePrayerSettings.screens;
    
    // ترتيب الشاشات حسب وقت البداية (كم دقيقة قبل الأذان)
    const screens = [];
    
    if (azkar.enabled && azkar.duration > 0) {
      screens.push({
        name: 'azkar',
        route: 'azkar',
        startBefore: azkar.startBefore,
        duration: azkar.duration
      });
    }
    
    if (quran.enabled && quran.duration > 0) {
      screens.push({
        name: 'quran',
        route: 'quran',
        startBefore: quran.startBefore,
        duration: quran.duration
      });
    }
    
    if (dailyWird.enabled) {
      const imagesPerSession = parseInt(dailyWird.imagesCount) || 3;
      const minutesPerImage = parseInt(dailyWird.minutesPerImage) || 1;
      const configuredDuration = parseInt(dailyWird.duration) || 0;
      const minNeededDuration = imagesPerSession * minutesPerImage;
      const effectiveDuration = Math.max(configuredDuration, minNeededDuration);
      if (effectiveDuration > 0) {
        screens.push({
          name: 'dailyWird',
          route: 'dailyWird',
          startBefore: dailyWird.startBefore,
          duration: effectiveDuration
        });
      }
    }
    
    if (liveMakkah.enabled && liveMakkah.duration > 0) {
      screens.push({
        name: 'live makkah',
        route: 'makkah live',
        startBefore: liveMakkah.startBefore,
        duration: liveMakkah.duration
      });
    }
    
    if (liveMadina.enabled && liveMadina.duration > 0) {
      screens.push({
        name: 'live madina',
        route: 'madina live',
        startBefore: liveMadina.startBefore,
        duration: liveMadina.duration
      });
    }
    
    // ترتيب الشاشات حسب وقت البداية (من الأبعد إلى الأقرب للأذان)
    screens.sort((a, b) => b.startBefore - a.startBefore);
    
    if (screens.length === 0) {
      console.log('No pre-prayer screens to schedule');
      return;
    }
    
    console.log('Pre-prayer screens sequence:', screens.map(s => `${s.name} (${s.startBefore}min before azan, for ${s.duration}min)`));
    
    // جدولة الشاشات بشكل متتابع
    screens.forEach((screen, index) => {
      const isLastScreen = index === screens.length - 1;
      
      // حساب متى تبدأ هذه الشاشة بالدقائق من الآن
      const startDelay = minutesBeforeAzan - screen.startBefore;
      
      if (startDelay < 0) {
        console.log(`Skipping ${screen.name} - should have started already`);
        return;
      }
      
      // جدولة بداية الشاشة
      const startTimeout = setTimeout(() => {
        console.log(`Starting pre-prayer ${screen.name} screen ${screen.startBefore} minutes before azan`);
        navigation.navigate(screen.route, { isScheduled: true, isPrePrayer: true });
        
        // جدولة نهاية الشاشة
        const endTimeout = setTimeout(() => {
          console.log(`Ending pre-prayer ${screen.name} screen after ${screen.duration} minutes`);
          
          if (isLastScreen) {
            // آخر شاشة: العودة لشاشة مواعيد الصلاة
            console.log('Returning to PrayerTimes (last pre-prayer screen ended)');
            navigation.navigate('PrayerTimes');
          } else {
            // ليس آخر شاشة: الانتقال للشاشة التالية سيحدث في موعده
            console.log(`Pre-prayer ${screen.name} ended, next screen will start automatically`);
          }
        }, screen.duration * 60 * 1000);
        
        scheduledPrePrayerTimeoutsRef.current.push(endTimeout);
      }, startDelay * 60 * 1000);
      
      scheduledPrePrayerTimeoutsRef.current.push(startTimeout);
    });
    
    console.log(`All pre-prayer screens scheduled.`);
  }, [prePrayerSettings, navigation, clearScheduledPrePrayerScreens]);

 // Schedule post-prayer screens function   
 const schedulePostPrayerScreens = useCallback(() => {
  clearScheduledScreens();
  
  if (!postPrayerSettings.enabled) {
    console.log('Post-prayer screens are disabled');
    return;
  }
  
  console.log('Scheduling post-prayer screens...');
  
  const { azkar, quran, dailyWird, liveMakkah, liveMadina } = postPrayerSettings.screens;
  
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
  
  if (dailyWird.enabled) {
    const imagesPerSession = parseInt(dailyWird.imagesCount) || 3;
    const minutesPerImage = parseInt(dailyWird.minutesPerImage) || 1;
    const configuredDuration = parseInt(dailyWird.duration) || 0;
    const minNeededDuration = imagesPerSession * minutesPerImage;
    const effectiveDuration = Math.max(configuredDuration, minNeededDuration);
    if (effectiveDuration > 0) {
      screens.push({
        name: 'dailyWird',
        route: 'dailyWird',
        startAfter: dailyWird.startAfter,
        duration: effectiveDuration
      });
    }
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
  
  screens.sort((a, b) => a.startAfter - b.startAfter);
  
  if (screens.length === 0) {
    console.log('No screens to schedule');
    return;
  }
  
  console.log('Screens sequence:', screens.map(s => `${s.name} (after ${s.startAfter}min, for ${s.duration}min)`));
  
  let currentTime = 0;
  
  screens.forEach((screen, index) => {
    const isFirstScreen = index === 0;
    const isLastScreen = index === screens.length - 1;
    
    let startDelay;
    if (isFirstScreen) {
      startDelay = screen.startAfter;
    } else {
      startDelay = Math.max(currentTime, screen.startAfter);
    }
    
    const startTimeout = setTimeout(() => {
      console.log(`Starting ${screen.name} screen at ${startDelay} minutes from black screen end`);
      navigation.navigate(screen.route, { isScheduled: true });
      
      const endTimeout = setTimeout(() => {
        console.log(`Ending ${screen.name} screen after ${screen.duration} minutes`);
        
        if (isLastScreen) {
          console.log('✅ Last screen ended - navigating to PrayerTimes');
          navigation.navigate('PrayerTimes');
        }
      }, screen.duration * 60 * 1000);
      
      scheduledTimeoutsRef.current.push(endTimeout);
    }, startDelay * 60 * 1000);
    
    scheduledTimeoutsRef.current.push(startTimeout);
    currentTime = startDelay + screen.duration;
  });
  
  // ✅ **الإضافة المهمة: timeout احتياطي يرجع للـ PrayerTimes**
  const totalDuration = currentTime + 0.5; // نضيف 30 ثانية margin
  const finalReturnTimeout = setTimeout(() => {
    console.log('⚠️ Safety timeout triggered - forcing return to PrayerTimes');
    try {
      navigation.navigate('PrayerTimes');
    } catch (error) {
      console.error('Error in final navigation:', error);
    }
  }, totalDuration * 60 * 1000);
  
  scheduledTimeoutsRef.current.push(finalReturnTimeout);
  
  console.log(`✅ All screens scheduled. Total duration: ${currentTime} minutes, safety return at: ${totalDuration} minutes`);
}, [postPrayerSettings, navigation, clearScheduledScreens]);

// Clean up scheduled screens when component unmounts
useEffect(() => {
  return () => {
    clearScheduledScreens();
    clearScheduledPrePrayerScreens();
  };
}, [clearScheduledScreens, clearScheduledPrePrayerScreens]);

  
// ✅ الحل 1: تنظيف updateCountdown
useEffect(() => {
  let interval;
  let isMounted = true;
  
  const updateCountdown = () => {
    if (!isMounted || prayerTimes.length === 0) return;
    
    const now = new Date();
    let foundActiveDuaaTime = false;
    let nextPrayerFound = false;
    
    for (let i = 0; i < prayerTimes.length && !nextPrayerFound; i++) {
      const [h, m] = prayerTimes[i].time.split(':');
      const azanTime = new Date();
      azanTime.setHours(h, m, 0, 0);

      const iqamaMinutes = getIqamaMinutesFor(prayerTimes[i].name);
      const iqamaTime = new Date(azanTime.getTime() + iqamaMinutes * 60000);

      // Check black screen
      if (blackScreenSettings.enabled && 
          getBlackScreenMinutesFor(prayerTimes[i].name) > 0 &&
          Math.abs(now - iqamaTime) < 1000 && 
          !showBlackScreen) {
        const duration = getBlackScreenMinutesFor(prayerTimes[i].name);
        setShowBlackScreen(true);
        setBlackScreenTimeLeft(duration * 60);
      }

      // Check duaa time
      if (now >= azanTime && now < iqamaTime) {
        foundActiveDuaaTime = true;
        const diff = iqamaTime - now;
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        
        const countdownText = `${toArabicNumbers(mins)}:${toArabicNumbers(secs.toString().padStart(2, '0'))}`;
        setIqamaCountdown(countdownText);
        
        if (!showDuaaScreen) {
          setShowDuaaScreen(true);
          setCurrentPrayerName(prayerTimes[i].name);
        }
        
        setCountdown(`المتبقي للإقامة ${countdownText}`);
        setNextPrayer({ name: '', time: '' });
        nextPrayerFound = true;
        break;
      }
      
      // Check next prayer
      if (azanTime > now && !nextPrayerFound) {
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
        nextPrayerFound = true;
        break;
      }
    }
    
    if (showDuaaScreen && !foundActiveDuaaTime) {
      setShowDuaaScreen(false);
      setCurrentPrayerName('');
    }

    // Tomorrow's Fajr
    if (!nextPrayerFound && prayerTimes.length > 0) {
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
    }
  };

  updateCountdown();
  
  interval = setInterval(() => {
    if (isMounted) {
      updateCountdown();
      setCurrentTime(new Date());
    }
  }, 1000);

  return () => {
    isMounted = false;
    if (interval) clearInterval(interval);
  };
}, [prayerTimes, iqamaDurations, blackScreenSettings, showBlackScreen]);

// ✅ الحل 2: فصل maybeAdvanceDailyWirdBaseIndex (useEffect جديد)
useEffect(() => {
  const checkDailyWirdInterval = setInterval(async () => {
    if (prayerTimes.length === 0) return;
    
    const now = new Date();
    const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
    
    if (lastAdvanceCheckKeyRef.current !== minuteKey) {
      lastAdvanceCheckKeyRef.current = minuteKey;
      await maybeAdvanceDailyWirdBaseIndex();
    }
  }, 60000);

  return () => {
    clearInterval(checkDailyWirdInterval);
  };
}, [prayerTimes]);

// ✅ الحل 3: فصل Pre-Prayer Scheduling (useEffect جديد)
useEffect(() => {
  if (!prePrayerSettings.enabled || prayerTimes.length === 0) {
    scheduledPrePrayersRef.current.clear();
    return;
  }

  const checkPrePrayerInterval = setInterval(() => {
    const now = new Date();

    for (let i = 0; i < prayerTimes.length; i++) {
      const [h, m] = prayerTimes[i].time.split(':');
      const azanTime = new Date();
      azanTime.setHours(h, m, 0, 0);
      
      if (azanTime > now) {
        const minutesUntilAzan = Math.floor((azanTime - now) / 60000);
        
        const { azkar, quran, dailyWird, liveMakkah, liveMadina } = prePrayerSettings.screens;
        const allScreens = [
          azkar.enabled ? azkar : null,
          quran.enabled ? quran : null,
          dailyWird.enabled ? dailyWird : null,
          liveMakkah.enabled ? liveMakkah : null,
          liveMadina.enabled ? liveMadina : null,
        ].filter(Boolean);
        
        const maxStartBefore = Math.max(...allScreens.map(s => s.startBefore || 0), 0);
        const prayerKey = `${prayerTimes[i].name}-${h}:${m}`;
        
        if (minutesUntilAzan <= maxStartBefore && 
            minutesUntilAzan > 0 && 
            !scheduledPrePrayersRef.current.has(prayerKey)) {
          
          console.log(`⏰ Scheduling pre-prayer screens for ${prayerTimes[i].name}`);
          scheduledPrePrayersRef.current.add(prayerKey);
          schedulePrePrayerScreens(minutesUntilAzan);
          
          setTimeout(() => {
            scheduledPrePrayersRef.current.delete(prayerKey);
          }, (minutesUntilAzan + 5) * 60 * 1000);
        }
        
        break;
      }
    }
  }, 60000);

  return () => {
    clearInterval(checkPrePrayerInterval);
  };
}, [prePrayerSettings, prayerTimes, schedulePrePrayerScreens]);


  // Black screen countdown timer
  useEffect(() => {
    let interval;
    if (showBlackScreen && blackScreenTimeLeft > 0) {
      interval = setInterval(() => {
        setBlackScreenTimeLeft(prev => {
          if (prev <= 1) {
            // ✅ نتأكد إن في شاشات مفعلة
            const hasActiveScreens = postPrayerSettings.enabled && 
              Object.values(postPrayerSettings.screens).some(screen => screen.enabled && screen.duration > 0);
            
            if (hasActiveScreens) {
              // في شاشات هتفتح، نخفي الشاشة السودة ونجدول الشاشات
              schedulePostPrayerScreens();
              // ✅ نأخر إخفاء الشاشة السودة شوية عشان الشاشة التانية تكون جاهزة
              setTimeout(() => {
                setShowBlackScreen(false);
              }, 300);
            } else {
              // مفيش شاشات، نرجع للـ PrayerTimes
              setShowBlackScreen(false);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showBlackScreen, blackScreenTimeLeft, schedulePostPrayerScreens, postPrayerSettings]);

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
  setBlackScreenTimeLeft(0);
  
  const hasActiveScreens = postPrayerSettings.enabled && 
    Object.values(postPrayerSettings.screens).some(screen => screen.enabled && screen.duration > 0);
  
  if (hasActiveScreens) {
    schedulePostPrayerScreens();
    setTimeout(() => {
      setShowBlackScreen(false);
    }, 300);
  } else {
    setShowBlackScreen(false);
  }
};

  const formatTimeFromSeconds = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${toArabicNumbers(mins)}:${toArabicNumbers(secs.toString().padStart(2, '0'))}`;
  };

  // Friday helpers
  const isFriday = () => new Date().getDay() === 5;
  const displayPrayerName = (arabicName) => (isFriday() && arabicName === 'الظهر' ? 'الجمعة' : arabicName);
  const getIqamaMinutesFor = (arabicName) => {
    if (isFriday() && arabicName === 'الظهر' && fridayOverrides?.iqamaJumuah != null && !isNaN(fridayOverrides.iqamaJumuah)) {
      return fridayOverrides.iqamaJumuah;
    }
    return iqamaDurations[arabicName] || 0;
  };
  const getBlackScreenMinutesFor = (arabicName) => {
    if (isFriday() && arabicName === 'الظهر' && fridayOverrides?.blackScreenJumuah != null && !isNaN(fridayOverrides.blackScreenJumuah)) {
      return fridayOverrides.blackScreenJumuah;
    }
    return blackScreenSettings.durations[arabicName] || 0;
  };

  const DuaaScreenOverlay = () => {
    const currentDuaa = duaaBetweenAdhanIqama[currentDuaaIndex];
    const sunan = getSunanForPrayer(currentPrayerName); // ✅ جلب السنن للصلاة الحالية
    
    return (
      <Animated.View style={styles.duaaScreenOverlay}>
        {/* الساعة الديجيتال للعد التنازلي */}
        <View style={styles.duaaDigitalClockContainer}>
          <Text style={styles.duaaClockLabel}>المتبقي للإقامة</Text>
          <Text style={styles.duaaDigitalTime}>{iqamaCountdown}</Text>
        </View>
  
        {/* ✅ عرض السنن الرواتب */}
        <View style={styles.sunanContainer}>
          <Text style={styles.sunanTitle}>السنن الرواتب لصلاة {currentPrayerName}</Text>
          <View style={styles.sunanRow}>
            <View style={styles.sunanItem}>
              <Text style={styles.sunanLabel}>قبل</Text>
              <Text style={styles.sunanNumber}>{toArabicNumbers(sunan.before)}</Text>
            </View>
            {/* <View style={styles.sunanDivider} /> */}
            <View style={styles.sunanItem}>
              <Text style={styles.sunanLabel}>بعد</Text>
              <Text style={styles.sunanNumber}>{toArabicNumbers(sunan.after)}</Text>
            </View>
          </View>
        </View>
  
        {/* نص الدعاء */}
        <View style={styles.duaaContentContainer}>
          {currentDuaa.title && (
            <Text style={styles.duaaTitleSimple}>{currentDuaa.title}</Text>
          )}
          
          <Text style={styles.duaaSimpleText}>{currentDuaa.duaa}</Text>
          
          {currentDuaa.source && (
            <Text style={styles.duaaSourceSimple}>{currentDuaa.source}</Text>
          )}
        </View>
      </Animated.View>
    );
  };



// Black Screen Overlay Component
const BlackScreenOverlay = () => (
  <Animated.View style={styles.blackScreenOverlay}>
    <View style={styles.blackScreenContent}>
      <Text style={styles.blackScreenText}>
        {blackScreenSettings.text || ' '}
      </Text>
     
    </View>
    {/* <TouchableOpacity 
      style={[
        styles.exitButton,
        isFocused('exitBlackScreen') && styles.tvFocusedButton
      ]} 
      focusable={true}
      hasTVPreferredFocus={true}
      onFocus={() => handleFocus('exitBlackScreen')}
      onBlur={handleBlur}
      onPress={exitBlackScreen}
    >
      <Text style={styles.exitButtonText}>خروج</Text>
    </TouchableOpacity> */}
  </Animated.View>
);

  // Portrait layout
  if (orientation === 'portrait') {
    return (
      <View style={{ flex: 1 }}>
        {/* المحتوى الأساسي */}
        <View style={{ flex: 1, position: 'relative' }}>
          <ImageBackground
            source={backgroundImage ? { uri: backgroundImage } : require('../assets/ishan-seefromthesky-66Tu10CxYY0-unsplash.jpg')}
            style={styles.topBackgroundPortrait}
            resizeMode="cover"
          >
            <View style={styles.overlayPortrait}>
              {/* Header with menu, mosque name and weather in one row */}
              <View style={styles.headerPortrait}>
                <TouchableOpacity 
                  key={`menu-portrait-${focusKey}`}
                  focusable={true}
                  hasTVPreferredFocus={true}
                  onFocus={() => handleFocus('menuButtonPortrait')}
                  onBlur={handleBlur}
                  onPress={() => navigation.openDrawer()} 
                  style={[
                    styles.menuButtonPortrait,
                    isFocused('menuButtonPortrait') && styles.tvFocusedButton
                  ]}>
                  <Ionicons name="menu" size={24} color="#fff" />
                </TouchableOpacity>
  
                <View style={styles.headerCenterPortrait}>
                  <Text style={styles.mosqueNameHeaderPortrait}>{mosqueName}</Text>
                  {dayName && userCountry && (
                    <Text style={styles.locationHeaderPortrait}>{dayName} - {userCountry}</Text>
                  )}
                </View>
  
                <View style={styles.weatherHeaderPortrait}>
                  <Text style={styles.weatherTempHeaderPortrait}>
                    {weatherIcon && (
                      <FontAwesome name="cloud" size={24} color="#fff" />
                    )}
                    {temperature !== null ? `${toArabicNumbers(temperature)}°` : ''}
                  </Text>
                  {tempMax !== null && tempMin !== null && (
                    <Text style={styles.weatherRangeHeaderPortrait}>
                      {`${toArabicNumbers(tempMax)}° ${toArabicNumbers(tempMin)}°`}
                    </Text>
                  )}
                </View>
              </View>
  
              {/* Time Display with dates */}
              <View style={styles.timeBoxPortrait}>
                <Text style={styles.timeNewPortrait}>
                  {toArabicNumbers(currentTime.toLocaleTimeString('ar-EG', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  }))}
                </Text>
                <View style={styles.datesRowPortrait}>
                  <Text style={styles.dateTextPortrait}>
                    {showNumericDate ? gregorianDateNumeric : gregorianDate}
                  </Text>
                  <Text style={styles.dateTextPortrait}>
                    {showNumericDate ? hijriDateNumeric : hijriDate}
                  </Text>
                </View>
              </View>
            </View>
          </ImageBackground>
  
          {/* الجزء الأبيض (الكارد الرئيسي) */}
          <View style={styles.mainWhiteCardPortrait}>
            {/* Dhikr Section */}
            <View style={styles.dhikrSectionPortrait}>
              <Text style={styles.dhikrTextNewPortrait}>{currentVerse}</Text>
            </View>
  
            {/* Divider */}
            <View style={styles.dividerPortrait} />
  
            {/* Next Prayer Countdown */}
            <View style={styles.nextPrayerSectionPortrait}>
              <Text style={styles.nextPrayerLabelPortrait}>
                {nextPrayer.name ? `المتبقي لصلاة ${displayPrayerName(nextPrayer.name)}` : ''}
              </Text>
              <Text style={styles.countdownCompactPortrait}>{countdown}</Text>
            </View>
  
            <View style={styles.dividerPortrait} />
  
            {/* Prayer Times List */}
            
            
            <View style={styles.prayerListSectionPortrait}>
              {prayerTimes.map((prayer, index) => {
                // عرض الشروق/الإمساك بعد الفجر مباشرة
                const showSunriseAfter = prayer.name === 'الفجر' && (sunriseTime || imsakTime);
                
                return (
                  <React.Fragment key={index}>
                    {/* عرض الصلاة الأساسية */}
                    <View 
                      style={[
                        styles.prayerRowNewPortrait,
                        index === prayerTimes.length - 1 && !showSunriseAfter && styles.prayerRowLastPortrait
                      ]}
                    >
                      <View style={styles.prayerInfoPortrait}>
                        <Ionicons 
                          name={getPrayerIcon(prayer.name)} 
                          size={20} 
                          color={getPrayerColor(prayer.name)}
                          style={styles.prayerIconPortrait}
                        />
                        <Text style={styles.prayerNameListPortrait}>
                          {displayPrayerName(prayer.name)}
                        </Text>
                      </View>
                      <View style={styles.prayerTimesPortrait}>
                        <Text style={styles.prayerTimeListPortrait}>
                          {formatTime12Hour(prayer.time)}
                        </Text>
                        <View style={styles.iqamaBadgePortrait}>
                          <Text style={styles.iqamaBadgeTextPortrait}>
                            الإقامة بعد {toArabicNumbers(getIqamaMinutesFor(prayer.name))} د
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    {/* عرض الشروق/الإمساك بعد الفجر */}
                    {showSunriseAfter && (
                      <View 
                        style={[
                          styles.prayerRowNewPortrait,
                          index === prayerTimes.length - 1 && styles.prayerRowLastPortrait
                        ]}
                      >
                        <View style={styles.prayerInfoPortrait}>
                          <Ionicons 
                            name={isRamadan() && !showSunrise ? "moon-outline" : "sunny-outline"} 
                            size={20} 
                            color={isRamadan() && !showSunrise ? "#4A90E2" : "#FFA500"} 
                            style={styles.prayerIconPortrait} 
                          />
                          <Text style={styles.prayerNameListPortrait}>
                            {isRamadan() ? (showSunrise ? 'الشروق' : 'الإمساك') : 'الشروق'}
                          </Text>
                        </View>
                        <View style={styles.prayerTimesPortrait}>
                          <Text style={styles.prayerTimeListPortrait}>
                            {isRamadan() 
                              ? (showSunrise ? formatTime12Hour(sunriseTime) : formatTime12Hour(imsakTime))
                              : formatTime12Hour(sunriseTime)
                            }
                          </Text>
                          <View style={styles.sunrisePlaceholder}></View>
                        </View>
                      </View>
                    )}
                  </React.Fragment>
                );
              })}
            </View>
  
            {/* News Bar */}
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
                    }}        
                  >
                    {getNewsSegments(newsSettings.text).map((seg, idx, arr) => (
                      <View key={`ls-seg1-${idx}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                          {seg}
                        </Text>
                        {idx < arr.length - 1 && (
                          <Image
                            source={require('../assets/WhatsApp Image 2025-10-30 at 3.12.53 PM.jpeg')}
                            style={styles.newsIcon}
                            resizeMode="cover"
                          />
                        )}
                      </View>
                    ))}
                    <View style={{ width: 100 }} />
                    {getNewsSegments(newsSettings.text).map((seg, idx, arr) => (
                      <View key={`ls-seg2-${idx}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.newsText, { textAlign: 'right' }]} numberOfLines={1}>{seg}</Text>
                        {idx < arr.length - 1 && (
                          <Image
                            source={require('../assets/WhatsApp Image 2025-10-30 at 3.12.53 PM.jpeg')}
                            style={styles.newsIcon}
                            resizeMode="cover"
                          />
                        )}
                      </View>
                    ))}
                    <View style={{ width: 100 }} />
                    {getNewsSegments(newsSettings.text).map((seg, idx, arr) => (
                      <View key={`ls-seg3-${idx}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.newsText, { textAlign: 'right' }]} numberOfLines={1}>{seg}</Text>
                        {idx < arr.length - 1 && (
                          <Image
                            source={require('../assets/WhatsApp Image 2025-10-30 at 3.12.53 PM.jpeg')}
                            style={styles.newsIcon}
                            resizeMode="cover"
                          />
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}
          </View>
        </View>
  
        {/* ✅ الـ Overlays برّة تماماً في root level */}
        {(showDuaaScreen || duaaOpacity._value > 0) && <DuaaScreenOverlay />}
{(showBlackScreen || blackScreenOpacity._value > 0) && <BlackScreenOverlay />}
      </View>
    );
  }


 return (
  
  <ImageBackground source={backgroundImage ? { uri: backgroundImage } : require('../assets/pexels-pashal-337904.jpg')} style={styles.backgroundPortrait} resizeMode="cover">
    <View style={styles.overlay}>
      <View style={styles.mainContent}>
        <View style={styles.headerSection}>
          <TouchableOpacity 
            key={`menu-landscape-${focusKey}`}
            focusable={true}
            hasTVPreferredFocus={true}
            onFocus={() => handleFocus('menuButtonLandscape')}
            onBlur={handleBlur}
            onPress={() => navigation.openDrawer()}
            style={[
              { 
                padding: 5,
                borderRadius: 8,
                borderWidth: 3,
                borderColor: 'transparent',
              },
              isFocused('menuButtonLandscape') && styles.tvFocusedButton
            ]}
          >
            <Ionicons name="menu" size={32} color="#fff" />
          </TouchableOpacity>

          

         

          <Text style={styles.subtitle }>
         
  {showNumericDate ? hijriDateNumeric : hijriDate}
  
</Text>




<Text style={styles.subtitle}>
<Text style={[styles.subtitle, { alignSelf: 'center', marginLeft: 0 }]}>
  {dayName && (
    <Text style={[styles.dayTextlandscape]}>
      {dayName}
    </Text>
  )}
</Text>
  {showNumericDate ? gregorianDateNumeric : gregorianDate}
  
</Text>

<Text style={styles.subtitle}>{mosqueName}</Text>

        </View>

        {/* صلاة الشروق/الإمساك في View منفصل تحت اسم المسجد */}
        {(sunriseTime || imsakTime) && (
  <View style={styles.sunriseContainer}>
    <Text style={styles.sunriseText}>
      {isRamadan() 
        ? (showSunrise 
            ? `الشروق: ${formatTime12Hour(sunriseTime)}`
            : `الإمساك: ${formatTime12Hour(imsakTime)}`)
        : `الشروق: ${formatTime12Hour(sunriseTime)}`
      }
    </Text>
<View style={styles.dayLocationContainer}>
   

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

    {userCountry && (
      <Text style={[styles.sunriseText, { marginTop: 5 }]}>
        {userCountry}
      </Text>
    )}
    </View>
  </View>
)}


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
              <Text style={styles.nextPrayerText}> المتبقي لصلاة {displayPrayerName(nextPrayer.name)}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.bottomSection}>
          {prayerTimes.map((prayer, index) => (
            <View key={index} style={styles.prayerBox}>
              <Text style={styles.prayerName}>{displayPrayerName(prayer.name)}</Text>
              <Text style={styles.prayerTime}>{formatTime12Hour(prayer.time)}</Text>
              <Text style={styles.iqamaText}>الإقامة بعد {toArabicNumbers(getIqamaMinutesFor(prayer.name))} د</Text>
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
      {getNewsSegments(newsSettings.text).map((seg, idx, arr) => (
        <View key={`ls-seg1-${idx}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
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
            {seg}
          </Text>
          {idx < arr.length - 1 && (
            <Image
              source={require('../assets/WhatsApp Image 2025-10-30 at 3.12.53 PM.jpeg')}
              style={styles.newsIcon}
              resizeMode="cover"
            />
          )}
        </View>
      ))}
      {/* مساحة فارغة */}
      <View style={{ width: 100 }} />
      {getNewsSegments(newsSettings.text).map((seg, idx, arr) => (
        <View key={`ls-seg2-${idx}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.newsText, { textAlign: 'right' }]} numberOfLines={1}>{seg}</Text>
          {idx < arr.length - 1 && (
            <Image
              source={require('../assets/WhatsApp Image 2025-10-30 at 3.12.53 PM.jpeg')}
              style={styles.newsIcon}
              resizeMode="cover"
            />
          )}
        </View>
      ))}
      {/* مساحة فارغة تانية */}
      <View style={{ width: 100 }} />
      {getNewsSegments(newsSettings.text).map((seg, idx, arr) => (
        <View key={`ls-seg3-${idx}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.newsText, { textAlign: 'right' }]} numberOfLines={1}>{seg}</Text>
          {idx < arr.length - 1 && (
            <Image
              source={require('../assets/WhatsApp Image 2025-10-30 at 3.12.53 PM.jpeg')}
              style={styles.newsIcon}
              resizeMode="cover"
            />
          )}
        </View>
      ))}
    </ScrollView>
  </View>
</View>
)}
    </View>
    {(showDuaaScreen || duaaOpacity._value > 0) && <DuaaScreenOverlay />}
    {(showBlackScreen || blackScreenOpacity._value > 0) && <BlackScreenOverlay />}
  </ImageBackground>
);
}

const createStyles = (screenWidth, screenHeight) => StyleSheet.create({
  // ==================== Landscape Styles ====================
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
    marginTop: 23,
    // marginBottom: 10,
  },
  subtitle: {
    fontSize: 28,
    color: '#fff',
    textAlign: 'center',
    alignSelf: 'flex-start',
    marginLeft: 30,
  },
  sunriseContainer: {
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
    flexDirection: 'row-reverse',
    // justifyContent: 'space-between',
  },
  sunriseText: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  dayLocationContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 30,
    marginTop: 1,
    position: 'absolute', // أضف دي
    left: 10, // ودي
  },
  
  weatherContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: 20,
  },
  weatherTemp: {
    fontSize: 20,
    color: '#fff',
  },
  weatherMinMax: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 20,
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
    width: 160,
    height: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.46)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 70,
    marginLeft: 15,
    padding: 15,
  },
  countdownText: {
    fontSize: 31,
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
    marginTop: 5,
  },
  prayerBox: {
    width: '18.5%',
    height: 140,
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
  newsIcon: {
    width: Math.min(20, screenHeight * 0.03),
    height: Math.min(20, screenHeight * 0.03),
    marginHorizontal: 35,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)'
  },
  newsSeparator: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 18,
  },

  // ==================== Portrait Styles ====================
  backgroundPortrait: {
    flex: 1,
  },
  overlayPortrait: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: screenWidth * 0.04,
    paddingTop: screenHeight * 0.035,
    paddingBottom: screenHeight * 0.01,
  },

  // Header - menu, mosque name and weather in one row
  headerPortrait: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: screenHeight * 0.01,
    paddingHorizontal: screenWidth * 0.02,
  },
  menuButtonPortrait: {
    padding: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerCenterPortrait: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  mosqueNameHeaderPortrait: {
    fontSize: Math.min(screenWidth * 0.065, 22),
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  locationHeaderPortrait: {
    fontSize: Math.min(screenWidth * 0.045, 15),
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
    textAlign: 'center',
  },
  weatherHeaderPortrait: {
    alignItems: 'center',
  },
  weatherTempHeaderPortrait: {
    fontSize: Math.min(screenWidth * 0.055, 18),
    color: '#fff',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 5,

  },
  weatherRangeHeaderPortrait: {
    fontSize: Math.min(screenWidth * 0.08, 18),
    color: '#fff',
    // opacity: 0.8,
    
  },

  // Time box with dates
  timeBoxPortrait: {
    alignItems: 'center',
    paddingVertical: screenHeight * 0.02,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    marginBottom: screenHeight * 0.001,
  },
  timeNewPortrait: {
    fontSize: Math.min(screenWidth * 0.20, 75),
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  datesRowPortrait: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: screenHeight * 0.01,
    paddingHorizontal: screenWidth * 0.02,
  },
  dateTextPortrait: {
    fontSize: Math.min(screenWidth * 0.06, 18),
    color: '#fff',
    fontWeight: '500',
    opacity: 0.9,
  },

  // Main white card - contains dhikr, countdown and prayers
  mainWhiteCardPortrait: {
    flex: 1,
    backgroundColor: '#fff',
    // borderRadius: 20,
    padding: screenHeight * 0.02,
    // marginBottom: screenHeight * 0.01,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    
  },

  // Dhikr section inside main card
  dhikrSectionPortrait: {
    paddingVertical: screenHeight * 0.005,
  },
  dhikrTextNewPortrait: {
    fontSize: Math.min(screenWidth * 0.095, 24),
    color: '#333',
    textAlign: 'center',
    // lineHeight: Math.min(screenWidth * 0.065, 22),
    fontWeight: '500',
    
  },

  // Divider line
  dividerPortrait: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: screenHeight * 0.008,
  },

  // Next prayer section inside main card
  nextPrayerSectionPortrait: {
    // backgroundColor: 'rgba(46, 139, 87, 0.1)',
    borderRadius: 12,
    padding: screenHeight * 0.005,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextPrayerLabelPortrait: {
    fontSize: Math.min(screenWidth * 0.070, 24),
    color: '#2e7d32',
    fontWeight: '600',
  },
  countdownCompactPortrait: {
    fontSize: Math.min(screenWidth * 0.080, 28),
    color: '#2e7d32',
    fontWeight: 'bold',
  },

  // Prayer list section inside main card
  prayerListSectionPortrait: {
    flex: 1,
    paddingTop: screenHeight * 0.0001,
  },
  prayerRowNewPortrait: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: screenHeight * 0.012,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  prayerRowLastPortrait: {
    borderBottomWidth: 0,
  },
  prayerInfoPortrait: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prayerIconPortrait: {
    marginLeft: 5,
  },
  prayerNameListPortrait: {
    fontSize: Math.min(screenWidth * 0.06, 20),
    color: '#333',
    fontWeight: '600',
    marginLeft: 15,
  },
  prayerTimesPortrait: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
    
    
  },
  prayerTimeListPortrait: {
    fontSize: Math.min(screenWidth * 0.06, 20),
    color: '#333',
    fontWeight: 'bold',
  },
  sunriseTimeOnlyPortrait: {
    // flex: 1,

    alignItems: 'center',
    justifyContent: 'center',
  },
  sunrisePlaceholder: {
    width: 102,
    height: 30,  // ← مهم عشان المحاذاة
  },
  iqamaBadgePortrait: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    
  },
  iqamaBadgeTextPortrait: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    color: '#2e7d32',
    fontWeight: '600',
  },

  newsBarPortrait: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 10,
    overflow: 'hidden',
    height: 40,
    width: '100%',
  },
  topBackgroundPortrait: {
    height: screenHeight * 0.35, // الجزء اللي فيه الصورة (تقدر تزود أو تقلل النسبة)
    width: '100%',
  },

  // ==================== Black Screen Overlay ====================
  blackScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,        // ✅ زودناه
    elevation: 10000,    // ✅ أضفناه
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
  blackScreenCountdown: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
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

  // ==================== TV Focus Styles ====================
  tvFocusedButton: {
    borderWidth: 3,
    borderColor: 'rgba(216, 232, 223, 0)',
    transform: [{ scale: 1.05 }],
    elevation: 10,
    backgroundColor: 'rgba(71, 71, 67, 0.13)',
  },

  // ==================== Duaa Screen Overlay ====================
  duaaScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#03172b',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.02,
    zIndex: 9999,        // ✅ زودناه
    elevation: 10000,
  },
  duaaDigitalClockContainer: {
    alignItems: 'center',
    marginTop: screenHeight * 0.0002,
    marginBottom: screenHeight * 0.02,
  },
  duaaDigitalTime: {
    fontSize: Math.min(screenWidth * 0.35, 60),
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    paddingHorizontal: screenWidth * 0.1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  duaaClockLabel: {
    fontSize: Math.min(screenWidth * 0.06, 24),
    color: '#D4AF37',
    marginTop: screenHeight * 0.02,
    fontWeight: '600',
    textAlign: 'center',
  },
  duaaContentContainer: {
    width: screenWidth * 0.9,
    maxWidth: screenWidth * 0.9,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: screenHeight * 0.02,
    paddingHorizontal: screenWidth * 0.01,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    alignItems: 'center',
  },
  duaaTitleSimple: {
    fontSize: Math.min(screenWidth * 0.055, 24),
    color: '#D4AF37',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: screenHeight * 0.02,
  },
  duaaSimpleText: {
    fontSize: Math.min(screenWidth * 0.065, 28),
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: Math.min(screenWidth * 0.1, 45),
    fontWeight: '600',
  },
  duaaSourceSimple: {
    fontSize: Math.min(screenWidth * 0.045, 18),
    color: '#B8956A',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: screenHeight * 0.02,
    fontStyle: 'italic',
  },
  sunanContainer: {
    width: screenWidth * 0.9,
    maxWidth: screenWidth * 0.9,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: screenHeight * 0.025,
    paddingHorizontal: screenWidth * 0.05,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginBottom: screenHeight * 0.015,
    alignItems: 'center',
  },
  sunanTitle: {
    fontSize: Math.min(screenWidth * 0.055, 22),
    color: '#D4AF37',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: screenHeight * 0.0005,
  },
  sunanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: screenWidth * 0.08,
  },
  sunanItem: {
    alignItems: 'center',
    minWidth: screenWidth * 0.25,
  },
  sunanLabel: {
    fontSize: Math.min(screenWidth * 0.05, 20),
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 1,
  },
  sunanNumber: {
    fontSize: Math.min(screenWidth * 0.075, 38),
    color: '#FFFFFF',
    fontWeight: '500',
    backgroundColor: '#0a2540',
    paddingHorizontal: screenWidth * 0.07,
    paddingVertical: screenHeight * 0.001,
    borderRadius: 12,
    // minWidth: screenWidth * 0.2,
    textAlign: 'center',
  },
  sunanDivider: {
    width: 2,
    height: screenHeight * 0.06,
    backgroundColor: 'rgba(212, 175, 55, 0.5)',
  },
});

