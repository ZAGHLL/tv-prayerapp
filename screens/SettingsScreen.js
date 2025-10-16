import React, { useEffect, useState , useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Animated,
  Modal,
  FlatList,
  Image
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Switch } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const COUNTRIES_CITIES = {
  'مصر': [
  // محافظات القاهرة الكبرى
  { name: 'القاهرة', lat: 30.044420680147132, lon: 31.235711609454345 },
  { name: 'الجيزة', lat: 30.013056299999997, lon: 31.208888500000002 },
  { name: 'القليوبية', lat: 30.179870573425197, lon: 31.205913584899903 },

  // محافظات الوجه البحري
  { name: 'الإسكندرية', lat: 31.200092372977913, lon: 29.918738700000002 },
  { name: 'البحيرة', lat: 30.848100423698425, lon: 30.343600273132324 },
  { name: 'الغربية', lat: 30.875400234298706, lon: 31.033500671386719 },
  { name: 'كفر الشيخ', lat: 31.110700344848633, lon: 30.938800811767578 },
  { name: 'دمياط', lat: 31.41734056120271, lon: 31.814076963695943 },
  { name: 'الدقهلية', lat: 31.165600538539886, lon: 31.491300582885742 },
  { name: 'الشرقية', lat: 30.732700347900391, lon: 31.719500541687012 },
  { name: 'المنوفية', lat: 30.597200384521484, lon: 30.987600326538086 },

  // محافظات الوجه القبلي
  { name: 'الفيوم', lat: 29.279300447654724, lon: 30.841800212860107 },
  { name: 'بني سويف', lat: 29.066100485324860, lon: 31.099400520324707 },
  { name: 'المنيا', lat: 28.109900474548340, lon: 30.750300407409668 },
  { name: 'أسيوط', lat: 27.180900512695312, lon: 31.183700561523438 },
  { name: 'سوهاج', lat: 26.556900482177734, lon: 31.694800567626953 },
  { name: 'قنا', lat: 26.155100464820862, lon: 32.716000556945801 },
  { name: 'الأقصر', lat: 25.687200469970703, lon: 32.639600563049316 },
  { name: 'أسوان', lat: 24.088900566101074, lon: 32.899800539016724 },

  // محافظات الحدود
  { name: 'البحر الأحمر', lat: 24.692700538635254, lon: 34.153700470924377 },
  { name: 'الوادي الجديد', lat: 25.451900482177734, lon: 30.535900473594666 },
  { name: 'مطروح', lat: 31.354300499916077, lon: 27.237300396919250 },
  { name: 'شمال سيناء', lat: 31.116600513458252, lon: 33.850000500679016 },
  { name: 'جنوب سيناء', lat: 28.459400463104248, lon: 33.971600532531738 },

  // محافظات القناة
  { name: 'السويس', lat: 29.966800451278687, lon: 32.549800559043884 },
  { name: 'الإسماعيلية', lat: 30.596500396728516, lon: 32.271500587463379 },
  { name: 'بورسعيد', lat: 31.265300512313843, lon: 32.301900577545166 },

  // محافظات حضرية إضافية  
  { name: '6 أكتوبر', lat: 29.952654570984840, lon: 30.921919584274292 },
  { name: 'حلوان', lat: 29.841800451278687, lon: 31.305800580978394 }
],

  'السعودية': [
  // المنطقة الوسطى
  { name: 'الرياض', lat: 24.713552396896903, lon: 46.675296783447266 },
  { name: 'القصيم', lat: 26.329166412353516, lon: 43.975000381469727 },

  // المنطقة الغربية (الحجاز)
  { name: 'مكة المكرمة', lat: 21.389082222143555, lon: 39.857910156250000 },
  { name: 'المدينة المنورة', lat: 24.524076461791992, lon: 39.569446563720703 },

  // المنطقة الشرقية
  { name: 'المنطقة الشرقية', lat: 26.428070068359375, lon: 49.975280761718750 },

  // المنطقة الجنوبية
  { name: 'عسير', lat: 18.216043472290039, lon: 42.505016326904297 },
  { name: 'جازان', lat: 16.889400482177734, lon: 42.551700592041016 },
  { name: 'نجران', lat: 17.493900299072266, lon: 44.128700256347656 },
  { name: 'الباحة', lat: 20.012924194335938, lon: 41.467716217041016 },

  // المنطقة الشمالية
  { name: 'تبوك', lat: 28.383899688720703, lon: 36.566898345947266 },
  { name: 'الحدود الشمالية', lat: 30.200242996215820, lon: 42.029567718505859 },
  { name: 'الجوف', lat: 29.785800933837891, lon: 40.209400177001953 },
  { name: 'حائل', lat: 27.523700714111328, lon: 41.690399169921875 },

  // المدن الحضرية الإضافية والمراكز الاقتصادية المهمة
  { name: 'جدة', lat: 21.485811233520508, lon: 39.192505598068237 },
  { name: 'الدمام', lat: 26.420070648193359, lon: 50.088897705078125 },
  { name: 'الخبر', lat: 26.279392242431641, lon: 50.208000183105469 },
  { name: 'الظهران', lat: 26.295700073242188, lon: 50.153900146484375 },
  { name: 'الطائف', lat: 21.270399093627930, lon: 40.415000915527344 },
  { name: 'بريدة', lat: 26.326000213623047, lon: 43.975002288818359 },
  { name: 'أبها', lat: 18.216400146484375, lon: 42.504699707031250 },
  { name: 'خميس مشيط', lat: 18.306699752807617, lon: 42.728000640869141 },
  { name: 'حفر الباطن', lat: 28.432800292968750, lon: 45.971698760986328 },
  { name: 'الجبيل', lat: 27.013700485229492, lon: 49.605400085449219 },
  { name: 'ينبع', lat: 24.089399337768555, lon: 38.063899993896484 },
  { name: 'الأحساء', lat: 25.429699897766113, lon: 49.585899353027344 },
  { name: 'القطيف', lat: 26.565000534057617, lon: 49.975498199462891 },
  { name: 'عرعر', lat: 30.975299835205078, lon: 41.037200927734375 },
  { name: 'سكاكا', lat: 29.969699859619141, lon: 40.206199645996094 },
  { name: 'نجران (المدينة)', lat: 17.493900299072266, lon: 44.128700256347656 },
  { name: 'جازان (المدينة)', lat: 16.889400482177734, lon: 42.551700592041016 },
  { name: 'الباحة (المدينة)', lat: 20.012924194335938, lon: 41.467716217041016 },
  { name: 'رابغ', lat: 22.798000335693359, lon: 39.034698486328125 },
  { name: 'الرس', lat: 25.869199752807617, lon: 43.497100830078125 }
],
  'الإمارات': [
  // الإمارات السبع الرئيسية
  { name: 'أبوظبي', lat: 24.466667175292969, lon: 54.366668701171875 },
  { name: 'دبي', lat: 25.269739151000977, lon: 55.309520721435547 },
  { name: 'الشارقة', lat: 25.337400436401367, lon: 55.412101745605469 },
  { name: 'عجمان', lat: 25.405799865722656, lon: 55.512500762939453 },
  { name: 'أم القيوين', lat: 25.564701080322266, lon: 55.555000305175781 },
  { name: 'رأس الخيمة', lat: 25.789400100708008, lon: 55.943698883056641 },
  { name: 'الفجيرة', lat: 25.128700256347656, lon: 56.326000213623047 },

  // المدن والمناطق الحضرية الإضافية المهمة
  { name: 'العين', lat: 24.207700729370117, lon: 55.745799541473389 },
  { name: 'الظفرة', lat: 23.283300399780273, lon: 53.647498130798340 },
  { name: 'ليوا', lat: 23.133300781250000, lon: 53.799999237060547 },
  { name: 'جبل علي', lat: 25.065000534057617, lon: 55.127098083496094 },
  { name: 'الميناء', lat: 25.279399871826172, lon: 55.320598602294922 },
  { name: 'ديرة', lat: 25.269100189208984, lon: 55.308299064636230 },
  { name: 'بر دبي', lat: 25.265699386596680, lon: 55.302898406982422 },
  { name: 'الجميرا', lat: 25.235700607299805, lon: 55.270198822021484 },
  { name: 'مدينة دبي للإنترنت', lat: 25.217000961303711, lon: 55.281398773193359 },
  { name: 'مدينة دبي الإعلامية', lat: 25.211299896240234, lon: 55.264598846435547 },
  { name: 'دبي مارينا', lat: 25.080499649047852, lon: 55.141498565673828 },
  { name: 'جزيرة النخلة جميرا', lat: 25.112699508666992, lon: 55.138198852539062 },
  { name: 'برج العرب', lat: 25.141199111938477, lon: 55.185600280761719 },
  { name: 'مطار دبي الدولي', lat: 25.252799987792969, lon: 55.364601135253906 },
  { name: 'مطار آل مكتوم الدولي', lat: 24.896400451660156, lon: 55.161300659179688 },
  { name: 'جزيرة ياس', lat: 24.488800048828125, lon: 54.609901428222656 },
  { name: 'جزيرة السعديات', lat: 24.525400161743164, lon: 54.434398651123047 },
  { name: 'كورنيش أبوظبي', lat: 24.478799819946289, lon: 54.354000091552734 },
  { name: 'مطار أبوظبي الدولي', lat: 24.433000564575195, lon: 54.651100158691406 },
  { name: 'خورفكان', lat: 25.342599868774414, lon: 56.354198455810547 },
  { name: 'دبا الفجيرة', lat: 25.620000839233398, lon: 56.259700775146484 },
  { name: 'كلباء', lat: 25.048799514770508, lon: 56.356300354003906 },
  { name: 'الكورنيش الشارقة', lat: 25.359399795532227, lon: 55.391700744628906 },
  { name: 'جزيرة صير بونعير', lat: 25.234699249267578, lon: 55.542198181152344 },
  { name: 'النعيمية', lat: 25.374200820922852, lon: 55.474098205566406 }
],
  'قطر': [
  // البلديات الثمان الرئيسية
  { name: 'الدوحة', lat: 25.285446166992188, lon: 51.531600952148438 },
  { name: 'الريان', lat: 25.292400360107422, lon: 51.423599243164062 },
  { name: 'الوكرة', lat: 25.163299560546875, lon: 51.608001708984375 },
  { name: 'الخور', lat: 25.680200576782227, lon: 51.496700286865234 },
  { name: 'أم صلال', lat: 25.410900115966797, lon: 51.404399871826172 },
  { name: 'الدعين', lat: 25.461400985717773, lon: 51.482700347900391 },
  { name: 'الشمال', lat: 26.128700256347656, lon: 51.201900482177734 },
  { name: 'الشحانية', lat: 25.387800216674805, lon: 51.194000244140625 },

  // المدن والمناطق الحضرية الإضافية المهمة
  { name: 'لوسيل', lat: 25.433799743652344, lon: 51.452098846435547 },
  { name: 'الخليج الغربي', lat: 25.271299362182617, lon: 51.462799072265625 },
  { name: 'الجسرة', lat: 25.252199172973633, lon: 51.458599090576172 },
  { name: 'الصدف', lat: 25.259700775146484, lon: 51.483600616455078 },
  { name: 'المرقاب', lat: 25.287700653076172, lon: 51.521198272705078 },
  { name: 'الخليفة', lat: 25.274700164794922, lon: 51.506698608398438 },
  { name: 'السيلية', lat: 25.300199508666992, lon: 51.447399139404297 },
  { name: 'الغرافة', lat: 25.284299850463867, lon: 51.435199737548828 },
  { name: 'الهلال', lat: 25.262399673461914, lon: 51.440799713134766 },
  { name: 'عين خالد', lat: 25.252199172973633, lon: 51.414600372314453 },
  { name: 'مدينة خليفة الشمالية', lat: 25.328399658203125, lon: 51.429698944091797 },
  { name: 'مدينة خليفة الجنوبية', lat: 25.300100326538086, lon: 51.413700103759766 },
  { name: 'المعمورة', lat: 25.351999282836914, lon: 51.397701263427734 },
  { name: 'الوعب', lat: 25.365699768066406, lon: 51.377700805664062 },
  { name: 'روضة راشد', lat: 25.302299499511719, lon: 51.395599365234375 },
  { name: 'الثمامة', lat: 25.328500747680664, lon: 51.363700866699219 },
  { name: 'أبو نخلة', lat: 25.384700775146484, lon: 51.336498260498047 },
  { name: 'دخان', lat: 25.421100616455078, lon: 50.783599853515625 },
  { name: 'الزبارة', lat: 25.980800628662109, lon: 51.028499603271484 },
  { name: 'راس لفان', lat: 25.921100616455078, lon: 51.222099304199219 },
  { name: 'الغويرية', lat: 25.826900482177734, lon: 51.225399017333984 },
  { name: 'الفوارة', lat: 25.362199783325195, lon: 51.188999176025391 },
  { name: 'الريان الجديد', lat: 25.335399627685547, lon: 51.405101776123047 },
  { name: 'جزيرة اللؤلؤة', lat: 25.371700286865234, lon: 51.537899017333984 },
  { name: 'كتارا', lat: 25.316400527954102, lon: 51.480098724365234 },
  { name: 'مطار حمد الدولي', lat: 25.273000717163086, lon: 51.608299255371094 }
],

};

export default function SettingsScreen() {

  // Location settings
const [selectedCity, setSelectedCity] = useState(null);
const [showCountryPicker, setShowCountryPicker] = useState(false);
const [showCityPicker, setShowCityPicker] = useState(false);
const [selectedCountry, setSelectedCountry] = useState('');
const [availableCities, setAvailableCities] = useState([]);
const [locationMethod, setLocationMethod] = useState('gps');
const [manualLat, setManualLat] = useState('');
const [manualLon, setManualLon] = useState('');

  
  const [newsEnabled, setNewsEnabled] = useState(false);
  const [newsText, setNewsText] = useState('');
  const [orientation, setOrientation] = useState('portrait');
  const [userOrientation, setUserOrientation] = useState('portrait');
  const navigation = useNavigation();
  const [mosqueName, setMosqueName] = useState('');
  const [prayerDurations, setPrayerDurations] = useState({
    Fajr: '',
    Dhuhr: '',
    Asr: '',
    Maghrib: '',
    Isha: ''
  });
  const [iqamaTimes, setIqamaTimes] = useState({
    Fajr: '',
    Dhuhr: '',
    Asr: '',
    Maghrib: '',
    Isha: ''
  });
  const [blackScreenEnabled, setBlackScreenEnabled] = useState(false);
  const [blackScreenDurations, setBlackScreenDurations] = useState({
    Fajr: '',
    Dhuhr: '',
    Asr: '',
    Maghrib: '',
    Isha: ''
  });
    const inputRefs = useRef({});


  // Auto navigation settings
  const [autoNavigationEnabled, setAutoNavigationEnabled] = useState(false);
  const [azkarEnabled, setAzkarEnabled] = useState(false);
  const [quranEnabled, setQuranEnabled] = useState(false);
  const [liveStreamEnabled, setLiveStreamEnabled] = useState(false);
  const [liveMadinaEnabled, setLiveMadinaEnabled] = useState(false);
  
  const [azkarSettings, setAzkarSettings] = useState({
    startAfter: '',
    duration: ''
  });
  const [quranSettings, setQuranSettings] = useState({
    startAfter: '',
    duration: ''
  });
  const [liveStreamSettings, setLiveStreamSettings] = useState({
    startAfter: '',
    duration: ''
  });
  const [liveMadinaSettings, setLiveMadinaSettings] = useState({
    startAfter: '',
    duration: ''
  });

  // Background image settings
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [isDefaultBackground, setIsDefaultBackground] = useState(true);

  // إضافة state للتحقق من التعارض
  const [conflictErrors, setConflictErrors] = useState({
    azkar: { startAfter: false, duration: false, message: '' },
    quran: { startAfter: false, duration: false, message: '' },
    liveStream: { startAfter: false, duration: false, message: '' },
    liveMadina: { startAfter: false, duration: false, message: '' }
  });

  // دالة للتحقق من التعارض مع إظهار الأخطاء
  const checkConflictWithErrors = () => {
    const screens = [
      { 
        type: 'azkar', 
        enabled: azkarEnabled, 
        startAfter: azkarSettings.startAfter, 
        duration: azkarSettings.duration,
        name: 'الأذكار'
      },
      { 
        type: 'quran', 
        enabled: quranEnabled, 
        startAfter: quranSettings.startAfter, 
        duration: quranSettings.duration,
        name: 'القرآن'
      },
      { 
        type: 'liveStream', 
        enabled: liveStreamEnabled, 
        startAfter: liveStreamSettings.startAfter, 
        duration: liveStreamSettings.duration,
        name: 'البث المباشر من مكة'
      },
      { 
        type: 'liveMadina', 
        enabled: liveMadinaEnabled, 
        startAfter: liveMadinaSettings.startAfter, 
        duration: liveMadinaSettings.duration,
        name: 'صفحة المدينة المنورة المباشرة'
      }
    ];

    // تصفير الأخطاء
    const newErrors = {
      azkar: { startAfter: false, duration: false, message: '' },
      quran: { startAfter: false, duration: false, message: '' },
      liveStream: { startAfter: false, duration: false, message: '' },
      liveMadina: { startAfter: false, duration: false, message: '' }
    };

    // فلترة الشاشات المفعلة والتي لها قيم صحيحة
    const activeScreens = screens.filter(screen => 
      screen.enabled && 
      screen.startAfter !== '' && 
      screen.duration !== '' &&
      !isNaN(parseInt(screen.startAfter)) &&
      !isNaN(parseInt(screen.duration)) &&
      parseInt(screen.startAfter) >= 0 &&
      parseInt(screen.duration) > 0
    );

    // التحقق من التداخل بين كل شاشتين
    for (let i = 0; i < activeScreens.length; i++) {
      for (let j = i + 1; j < activeScreens.length; j++) {
        const screen1 = activeScreens[i];
        const screen2 = activeScreens[j];

        const start1 = parseInt(screen1.startAfter);
        const end1 = start1 + parseInt(screen1.duration);
        const start2 = parseInt(screen2.startAfter);
        const end2 = start2 + parseInt(screen2.duration);

        // التحقق من التداخل
        if ((start1 < end2 && end1 > start2)) {
          // تحديد رسالة الخطأ
          const errorMessage = `تداخل مع ${screen2.name}`;
          const errorMessage2 = `تداخل مع ${screen1.name}`;

          // تحديد الحقول المتأثرة
          newErrors[screen1.type].startAfter = true;
          newErrors[screen1.type].duration = true;
          newErrors[screen1.type].message = errorMessage;
          
          newErrors[screen2.type].startAfter = true;
          newErrors[screen2.type].duration = true;
          newErrors[screen2.type].message = errorMessage2;
        }
      }
    }

    setConflictErrors(newErrors);
    
    // إرجاع ما إذا كان هناك أي تعارض
    return Object.values(newErrors).some(error => error.startAfter || error.duration);
  };

  // تشغيل التحقق من التعارض عند تغيير أي إعداد
  useEffect(() => {
    if (autoNavigationEnabled) {
      checkConflictWithErrors();
    } else {
      // مسح الأخطاء إذا كان التنقل التلقائي غير مفعل
      setConflictErrors({
        azkar: { startAfter: false, duration: false, message: '' },
        quran: { startAfter: false, duration: false, message: '' },
        liveStream: { startAfter: false, duration: false, message: '' },
        liveMadina: { startAfter: false, duration: false, message: '' }
      });
    }
  }, [
    autoNavigationEnabled,
    azkarEnabled, azkarSettings.startAfter, azkarSettings.duration,
    quranEnabled, quranSettings.startAfter, quranSettings.duration,
    liveStreamEnabled, liveStreamSettings.startAfter, liveStreamSettings.duration,
    liveMadinaEnabled, liveMadinaSettings.startAfter, liveMadinaSettings.duration
  ]);

  // التحقق من التداخل بين الصفحات
  const checkTimeConflict = (screenType, newStartAfter, newDuration) => {
    const screens = [
      { type: 'azkar', enabled: azkarEnabled, startAfter: azkarSettings.startAfter, duration: azkarSettings.duration },
      { type: 'quran', enabled: quranEnabled, startAfter: quranSettings.startAfter, duration: quranSettings.duration },
      { type: 'liveMakkah', enabled: liveStreamEnabled, startAfter: liveStreamSettings.startAfter, duration: liveStreamSettings.duration },
      { type: 'liveMadina', enabled: liveMadinaEnabled, startAfter: liveMadinaSettings.startAfter, duration: liveMadinaSettings.duration }
    ];

    // تحديث البيانات للشاشة الحالية
    const updatedScreens = screens.map(screen => 
      screen.type === screenType 
        ? { ...screen, startAfter: newStartAfter, duration: newDuration }
        : screen
    );

    // فلترة الشاشات المفعلة فقط
    const activeScreens = updatedScreens.filter(screen => 
      screen.enabled && 
      screen.startAfter !== '' && 
      screen.duration !== '' &&
      parseInt(screen.startAfter) >= 0 &&
      parseInt(screen.duration) > 0
    );

    // التحقق من التداخل
    for (let i = 0; i < activeScreens.length; i++) {
      for (let j = i + 1; j < activeScreens.length; j++) {
        const screen1 = activeScreens[i];
        const screen2 = activeScreens[j];

        const start1 = parseInt(screen1.startAfter);
        const end1 = start1 + parseInt(screen1.duration);
        const start2 = parseInt(screen2.startAfter);
        const end2 = start2 + parseInt(screen2.duration);

        // التحقق من التداخل
        if ((start1 < end2 && end1 > start2)) {
          return {
            hasConflict: true,
            conflictScreens: [getScreenName(screen1.type), getScreenName(screen2.type)]
          };
        }
      }
    }

    return { hasConflict: false };
  };

  const getScreenName = (screenType) => {
    switch (screenType) {
      case 'azkar': return 'الأذكار';
      case 'quran': return 'القرآن';
      case 'liveMakkah': return 'البث المباشر من مكة';
      case 'liveMadina': return 'صفحة المدينة المنورة المباشرة';
      default: return screenType;
    }
  };

  const handleAzkarSettingsChange = (field, value) => {
    const newSettings = { ...azkarSettings, [field]: value };
    
    if (azkarEnabled && field === 'startAfter' && newSettings.duration !== '') {
      const conflict = checkTimeConflict('azkar', value, newSettings.duration);
      if (conflict.hasConflict) {
        Alert.alert(
          '⚠️ تعارض في المواعيد',
          `يوجد تداخل بين صفحة الأذكار وصفحة ${conflict.conflictScreens[1]}. يرجى تعديل المواعيد.`,
          [{ text: 'حسناً' }]
        );
        return;
      }
    }
    
    if (azkarEnabled && field === 'duration' && newSettings.startAfter !== '') {
      const conflict = checkTimeConflict('azkar', newSettings.startAfter, value);
      if (conflict.hasConflict) {
        Alert.alert(
          '⚠️ تعارض في المواعيد',
          `يوجد تداخل بين صفحة الأذكار وصفحة ${conflict.conflictScreens[1]}. يرجى تعديل المواعيد.`,
          [{ text: 'حسناً' }]
        );
        return;
      }
    }

    setAzkarSettings(newSettings);
  };

  const handleQuranSettingsChange = (field, value) => {
    const newSettings = { ...quranSettings, [field]: value };
    
    if (quranEnabled && field === 'startAfter' && newSettings.duration !== '') {
      const conflict = checkTimeConflict('quran', value, newSettings.duration);
      if (conflict.hasConflict) {
        Alert.alert(
          '⚠️ تعارض في المواعيد',
          `يوجد تداخل بين صفحة القرآن وصفحة ${conflict.conflictScreens[1]}. يرجى تعديل المواعيد.`,
          [{ text: 'حسناً' }]
        );
        return;
      }
    }
    
    if (quranEnabled && field === 'duration' && newSettings.startAfter !== '') {
      const conflict = checkTimeConflict('quran', newSettings.startAfter, value);
      if (conflict.hasConflict) {
        Alert.alert(
          '⚠️ تعارض في المواعيد',
          `يوجد تداخل بين صفحة القرآن وصفحة ${conflict.conflictScreens[1]}. يرجى تعديل المواعيد.`,
          [{ text: 'حسناً' }]
        );
        return;
      }
    }

    setQuranSettings(newSettings);
  };

  const handleLiveStreamSettingsChange = (field, value) => {
    const newSettings = { ...liveStreamSettings, [field]: value };
    
    if (liveStreamEnabled && field === 'startAfter' && newSettings.duration !== '') {
      const conflict = checkTimeConflict('liveMakkah', value, newSettings.duration);
      if (conflict.hasConflict) {
        Alert.alert(
          '⚠️ تعارض في المواعيد',
          `يوجد تداخل بين صفحة البث المباشر من مكة وصفحة ${conflict.conflictScreens[1]}. يرجى تعديل المواعيد.`,
          [{ text: 'حسناً' }]
        );
        return;
      }
    }
    
    if (liveStreamEnabled && field === 'duration' && newSettings.startAfter !== '') {
      const conflict = checkTimeConflict('liveMakkah', newSettings.startAfter, value);
      if (conflict.hasConflict) {
        Alert.alert(
          '⚠️ تعارض في المواعيد',
          `يوجد تداخل بين صفحة البث المباشر من مكة وصفحة ${conflict.conflictScreens[1]}. يرجى تعديل المواعيد.`,
          [{ text: 'حسناً' }]
        );
        return;
      }
    }

    setLiveStreamSettings(newSettings);
  };

  const handleLiveMadinaSettingsChange = (field, value) => {
    const newSettings = { ...liveMadinaSettings, [field]: value };
    
    if (liveMadinaEnabled && field === 'startAfter' && newSettings.duration !== '') {
      const conflict = checkTimeConflict('liveMadina', value, newSettings.duration);
      if (conflict.hasConflict) {
        Alert.alert(
          '⚠️ تعارض في المواعيد',
          `يوجد تداخل بين صفحة المدينة المنورة المباشرة وصفحة ${conflict.conflictScreens[1]}. يرجى تعديل المواعيد.`,
          [{ text: 'حسناً' }]
        );
        return;
      }
    }
    
    if (liveMadinaEnabled && field === 'duration' && newSettings.startAfter !== '') {
      const conflict = checkTimeConflict('liveMadina', newSettings.startAfter, value);
      if (conflict.hasConflict) {
        Alert.alert(
          '⚠️ تعارض في المواعيد',
          `يوجد تداخل بين صفحة المدينة المنورة المباشرة وصفحة ${conflict.conflictScreens[1]}. يرجى تعديل المواعيد.`,
          [{ text: 'حسناً' }]
        );
        return;
      }
    }

    setLiveMadinaSettings(newSettings);
  };

  // التحقق عند تفعيل الصفحات
  const handleScreenToggle = (screenType, enabled) => {
    if (enabled) {
      let startAfter, duration;
      switch (screenType) {
        case 'azkar':
          startAfter = azkarSettings.startAfter;
          duration = azkarSettings.duration;
          break;
        case 'quran':
          startAfter = quranSettings.startAfter;
          duration = quranSettings.duration;
          break;
        case 'liveMakkah':
          startAfter = liveStreamSettings.startAfter;
          duration = liveStreamSettings.duration;
          break;
        case 'liveMadina':
          startAfter = liveMadinaSettings.startAfter;
          duration = liveMadinaSettings.duration;
          break;
      }

      if (startAfter !== '' && duration !== '') {
        const conflict = checkTimeConflict(screenType, startAfter, duration);
        if (conflict.hasConflict) {
          Alert.alert(
            '⚠️ تعارض في المواعيد',
            `يوجد تداخل بين صفحة ${getScreenName(screenType)} وصفحة ${conflict.conflictScreens[1]}. يرجى تعديل المواعيد قبل التفعيل.`,
            [{ text: 'حسناً' }]
          );
          return;
        }
      }
    }

    switch (screenType) {
      case 'azkar':
        setAzkarEnabled(enabled);
        break;
      case 'quran':
        setQuranEnabled(enabled);
        break;
      case 'liveMakkah':
        setLiveStreamEnabled(enabled);
        break;
      case 'liveMadina':
        setLiveMadinaEnabled(enabled);
        break;
    }
  };

  // Set screen orientation based on user preference
  useFocusEffect(
    React.useCallback(() => {
      const setScreenOrientation = async () => {
        try {
          const currentOrientation = await AsyncStorage.getItem('userOrientation');
          setUserOrientation(currentOrientation || 'portrait');
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

  useEffect(() => {
    loadSettings();
    loadSelectedCity();
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('تنبيه', 'نحتاج إلى إذن الوصول للصور لتغيير الخلفية');
    }
  };

  // دالة تحميل الموقع المحفوظ
const loadSelectedCity = async () => {
  try {
    const savedCity = await AsyncStorage.getItem('selectedCity');
    if (savedCity) {
      const city = JSON.parse(savedCity);
      setSelectedCity(city);
      
      if (city.country && COUNTRIES_CITIES[city.country]) {
        setSelectedCountry(city.country);
        setAvailableCities(COUNTRIES_CITIES[city.country]);
      }
    }
  } catch (error) {
    console.error('Error loading selected city:', error);
  }
};

// دالة اختيار البلد
const selectCountry = (country) => {
  setSelectedCountry(country);
  setAvailableCities(COUNTRIES_CITIES[country] || []);
  setSelectedCity(null);
  setShowCountryPicker(false);
  setShowCityPicker(true);
};

// دالة اختيار المدينة
const selectCityFromCountry = async (city) => {
  try {
    const cityWithCountry = {
      ...city,
      country: selectedCountry
    };
    
    await AsyncStorage.setItem('selectedCity', JSON.stringify(cityWithCountry));
    
    const coords = {
      latitude: city.lat,
      longitude: city.lon
    };
    await AsyncStorage.setItem('userLocation', JSON.stringify(coords));
    
    setSelectedCity(cityWithCountry);
    setShowCityPicker(false);
    
    Alert.alert('تم التحديد', `تم اختيار ${city.name}, ${selectedCountry}. لا تنسَ حفظ الإعدادات.`);
  } catch (error) {
    console.error('Error saving city:', error);
    Alert.alert('خطأ', 'فشل في حفظ المدينة');
  }
};

// دالة حفظ الإحداثيات اليدوية
const saveManualCoordinates = async () => {
  if (!manualLat || !manualLon) {
    Alert.alert('تنبيه', 'يرجى إدخال خط العرض وخط الطول');
    return;
  }

  const lat = parseFloat(manualLat);
  const lon = parseFloat(manualLon);

  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    Alert.alert('خطأ', 'يرجى إدخال إحداثيات صحيحة\nخط العرض: من -90 إلى 90\nخط الطول: من -180 إلى 180');
    return;
  }

  try {
    const manualLocation = {
      name: 'موقع مخصص',
      lat: lat,
      lon: lon,
      country: 'إحداثيات يدوية',
      isManual: true
    };
    
    await AsyncStorage.setItem('selectedCity', JSON.stringify(manualLocation));
    
    const coords = {
      latitude: lat,
      longitude: lon
    };
    await AsyncStorage.setItem('userLocation', JSON.stringify(coords));
    
    setSelectedCity(manualLocation);
    
    Alert.alert('تم الحفظ', 'تم حفظ الموقع المخصص. لا تنسَ حفظ الإعدادات.');
  } catch (error) {
    Alert.alert('خطأ', 'فشل في حفظ الموقع');
  }
};

// دالة تحديث الموقع من GPS
const updateLocationFromGPS = async () => {
  Alert.alert(
    'إعادة تحديد الموقع',
    'هل تريد إعادة تحديد موقعك من GPS؟',
    [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'نعم',
        onPress: async () => {
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
              Alert.alert('خطأ', 'يرجى السماح بالوصول للموقع');
              return;
            }

            Alert.alert('يرجى الانتظار', 'جاري تحديد الموقع...');

            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
              timeout: 15000,
            });

            if (location?.coords) {
              const coords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
              };

              await AsyncStorage.setItem('userLocation', JSON.stringify(coords));
              
              const gpsLocation = {
                name: 'موقع GPS',
                lat: coords.latitude,
                lon: coords.longitude,
                country: 'تم التحديد تلقائياً',
                isGPS: true
              };
              
              await AsyncStorage.setItem('selectedCity', JSON.stringify(gpsLocation));
              setSelectedCity(gpsLocation);
              
              Alert.alert('تم التحديث', 'تم حفظ موقعك من GPS. لا تنسَ حفظ الإعدادات.');
            }
          } catch (error) {
            Alert.alert('خطأ', 'فشل تحديد الموقع. حاول مرة أخرى.');
          }
        }
      }
    ]
  );
};

  const loadSettings = async () => {
    try {
    const storedNews = await AsyncStorage.getItem('newsSettings');
    if (storedNews) {
      const parsedNews = JSON.parse(storedNews);
      setNewsEnabled(parsedNews.enabled);
      setNewsText(parsedNews.text);
    }
      
      const name = await AsyncStorage.getItem('mosqueName');
      const iqama = await AsyncStorage.getItem('iqamaTimes');
      const durations = await AsyncStorage.getItem('prayerDurations');
      
      // Load background image settings
      const savedBackgroundImage = await AsyncStorage.getItem('backgroundImage');
      const savedIsDefaultBackground = await AsyncStorage.getItem('isDefaultBackground');
      
      if (savedBackgroundImage) {
        setBackgroundImage(savedBackgroundImage);
      }
      if (savedIsDefaultBackground !== null) {
        setIsDefaultBackground(JSON.parse(savedIsDefaultBackground));
      }
      
      // Load black screen settings
      const blackScreenSettings = await AsyncStorage.getItem('blackScreenSettings');
      if (blackScreenSettings) {
        const parsedBlackScreen = JSON.parse(blackScreenSettings);
        setBlackScreenEnabled(parsedBlackScreen.enabled || false);
        setBlackScreenDurations(parsedBlackScreen.durations || {
          Fajr: '',
          Dhuhr: '',
          Asr: '',
          Maghrib: '',
          Isha: ''
        });
      }

      // Load auto navigation settings
      const autoNavSettings = await AsyncStorage.getItem('postPrayerSettings');
      if (autoNavSettings) {
        const parsedAutoNav = JSON.parse(autoNavSettings);
        setAutoNavigationEnabled(parsedAutoNav.enabled || false);
        
        if (parsedAutoNav.screens) {
          setAzkarEnabled(parsedAutoNav.screens.azkar?.enabled || false);
          setQuranEnabled(parsedAutoNav.screens.quran?.enabled || false);
          setLiveStreamEnabled(parsedAutoNav.screens.liveMakkah?.enabled || false);
          setLiveMadinaEnabled(parsedAutoNav.screens.liveMadina?.enabled || false);
          
          setAzkarSettings({
            startAfter: parsedAutoNav.screens.azkar?.startAfter?.toString() || '',
            duration: parsedAutoNav.screens.azkar?.duration?.toString() || ''
          });
          setQuranSettings({
            startAfter: parsedAutoNav.screens.quran?.startAfter?.toString() || '',
            duration: parsedAutoNav.screens.quran?.duration?.toString() || ''
          });
          setLiveStreamSettings({
            startAfter: parsedAutoNav.screens.liveMakkah?.startAfter?.toString() || '',
            duration: parsedAutoNav.screens.liveMakkah?.duration?.toString() || ''
          });
          setLiveMadinaSettings({
            startAfter: parsedAutoNav.screens.liveMadina?.startAfter?.toString() || '',
            duration: parsedAutoNav.screens.liveMadina?.duration?.toString() || ''
          });
        }
      }
      
      if (name) setMosqueName(name);
      if (iqama) setIqamaTimes(JSON.parse(iqama));
      if (durations) setPrayerDurations(JSON.parse(durations));
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('صلاحية مطلوبة', 'يحتاج التطبيق إلى صلاحية الوصول إلى الصور');
    return;
  }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [ImagePicker.MediaType.IMAGE],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setBackgroundImage(imageUri);
        setIsDefaultBackground(false);
        
        // Save immediately
        await AsyncStorage.setItem('backgroundImage', imageUri);
        await AsyncStorage.setItem('isDefaultBackground', JSON.stringify(false));
        
        Alert.alert('✅ تم التغيير', 'تم تغيير صورة الخلفية بنجاح');
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('❌ خطأ', 'حدث خطأ أثناء اختيار الصورة');
    }
  };

  const resetToDefaultBackground = async () => {
    Alert.alert(
      'استعادة الخلفية الأصلية',
      'هل تريد استعادة الخلفية الأصلية؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'استعادة',
          onPress: async () => {
            try {
              setBackgroundImage(null);
              setIsDefaultBackground(true);
              
              // Remove from storage
              await AsyncStorage.removeItem('backgroundImage');
              await AsyncStorage.setItem('isDefaultBackground', JSON.stringify(true));
              
              Alert.alert('✅ تم الاستعادة', 'تم استعادة الخلفية الأصلية بنجاح');
            } catch (error) {
              console.log('Error resetting background:', error);
              Alert.alert('❌ خطأ', 'حدث خطأ أثناء استعادة الخلفية');
            }
          }
        }
      ]
    );
  };

  const handleOrientationChange = async (newOrientation) => {
    try {
      setOrientation(newOrientation);
      await AsyncStorage.setItem('userOrientation', newOrientation);
      
      // Apply orientation immediately
      if (newOrientation === 'landscape') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }
      
      Alert.alert('تم التغيير', 'تم تغيير اتجاه الشاشة بنجاح');
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء تغيير الاتجاه');
    }
  };

  const saveSettings = async () => {
    try {
      // التحقق النهائي من عدم وجود تداخل قبل الحفظ
      const hasConflicts = checkConflictWithErrors();
      if (hasConflicts) {
        Alert.alert(
          '⚠️ لا يمكن الحفظ',
          'يوجد تداخل في مواعيد التنقل التلقائي بين الصفحات. يرجى تعديل الأرقام المعلمة باللون الأحمر قبل الحفظ.',
          [{ text: 'حسناً' }]
        );
        return;
      }

      const finalConflictCheck = () => {
        const activeScreens = [
          { type: 'azkar', enabled: azkarEnabled, startAfter: azkarSettings.startAfter, duration: azkarSettings.duration },
          { type: 'quran', enabled: quranEnabled, startAfter: quranSettings.startAfter, duration: quranSettings.duration },
          { type: 'liveMakkah', enabled: liveStreamEnabled, startAfter: liveStreamSettings.startAfter, duration: liveStreamSettings.duration },
          { type: 'liveMadina', enabled: liveMadinaEnabled, startAfter: liveMadinaSettings.startAfter, duration: liveMadinaSettings.duration }
        ].filter(screen => 
          screen.enabled && 
          screen.startAfter !== '' && 
          screen.duration !== '' &&
          parseInt(screen.startAfter) >= 0 &&
          parseInt(screen.duration) > 0
        );

        for (let i = 0; i < activeScreens.length; i++) {
          for (let j = i + 1; j < activeScreens.length; j++) {
            const screen1 = activeScreens[i];
            const screen2 = activeScreens[j];

            const start1 = parseInt(screen1.startAfter);
            const end1 = start1 + parseInt(screen1.duration);
            const start2 = parseInt(screen2.startAfter);
            const end2 = start2 + parseInt(screen2.duration);

            if ((start1 < end2 && end1 > start2)) {
              return {
                hasConflict: true,
                conflictScreens: [getScreenName(screen1.type), getScreenName(screen2.type)]
              };
            }
          }
        }
        return { hasConflict: false };
      };

      const finalCheck = finalConflictCheck();
      if (finalCheck.hasConflict) {
        Alert.alert(
          '⚠️ لا يمكن الحفظ',
          `يوجد تداخل بين صفحة ${finalCheck.conflictScreens[0]} وصفحة ${finalCheck.conflictScreens[1]}. يرجى تعديل المواعيد قبل الحفظ.`,
          [{ text: 'حسناً' }]
        );
        return;
      }

      const newsToSave = {
        enabled: newsEnabled,
        text: newsText
      };
      await AsyncStorage.setItem('newsSettings', JSON.stringify(newsToSave));
 
      const durationsToSave = {
        Fajr: prayerDurations.Fajr || '20',
        Dhuhr: prayerDurations.Dhuhr || '10',
        Asr: prayerDurations.Asr || '10',
        Maghrib: prayerDurations.Maghrib || '10',
        Isha: prayerDurations.Isha || '10'
      };

      const iqamaToSave = {
        Fajr: iqamaTimes.Fajr || '20',
        Dhuhr: iqamaTimes.Dhuhr || '10',
        Asr: iqamaTimes.Asr || '10',
        Maghrib: iqamaTimes.Maghrib || '10',
        Isha: iqamaTimes.Isha || '10'
      };

      // Save black screen settings
      const blackScreenToSave = {
        enabled: blackScreenEnabled,
        durations: {
          Fajr: blackScreenDurations.Fajr || '0',
          Dhuhr: blackScreenDurations.Dhuhr || '0',
          Asr: blackScreenDurations.Asr || '0',
          Maghrib: blackScreenDurations.Maghrib || '0',
          Isha: blackScreenDurations.Isha || '0'
        }
      };
      await AsyncStorage.setItem('blackScreenSettings', JSON.stringify(blackScreenToSave));

      // Save auto navigation settings
      const autoNavToSave = {
        enabled: autoNavigationEnabled,
        screens: {
          azkar: {
            enabled: azkarEnabled,
            startAfter: parseInt(azkarSettings.startAfter) || 0,
            duration: parseInt(azkarSettings.duration) || 0
          },
          quran: {
            enabled: quranEnabled,
            startAfter: parseInt(quranSettings.startAfter) || 0,
            duration: parseInt(quranSettings.duration) || 0
          },
          liveMakkah: {
            enabled: liveStreamEnabled,
            startAfter: parseInt(liveStreamSettings.startAfter) || 0,
            duration: parseInt(liveStreamSettings.duration) || 0
          },
          liveMadina: {
            enabled: liveMadinaEnabled,
            startAfter: parseInt(liveMadinaSettings.startAfter) || 0,
            duration: parseInt(liveMadinaSettings.duration) || 0
          }
        }
      };
      await AsyncStorage.setItem('postPrayerSettings', JSON.stringify(autoNavToSave));

      // Background image settings are saved immediately when changed
      
      await AsyncStorage.setItem('mosqueName', mosqueName);
      await AsyncStorage.setItem('iqamaTimes', JSON.stringify(iqamaToSave));
      await AsyncStorage.setItem('prayerDurations', JSON.stringify(durationsToSave));
      
      Alert.alert('✅ تم الحفظ', 'تم حفظ الإعدادات بنجاح', [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate('PrayerTimes');
          }
        }
      ]);
      } catch (error) {
        console.log('Error saving settings:', error);
        Alert.alert('❌ خطأ', 'حدث خطأ أثناء الحفظ');
      }
      };

  const handleDurationChange = (prayer, value) => {
    setPrayerDurations({ ...prayerDurations, [prayer]: value });
  };

  const handleIqamaChange = (prayer, value) => {
    setIqamaTimes({ ...iqamaTimes, [prayer]: value });
  };

  const handleBlackScreenDurationChange = (prayer, value) => {
    setBlackScreenDurations({ ...blackScreenDurations, [prayer]: value });
  };

  const handleLogout = async () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تسجيل الخروج',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userData');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            } catch (error) {
              Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الخروج');
            }
          }
        }
      ]
    );
  };

  
  

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <TouchableOpacity style={styles.menuButton}
      focusable={true}
      onPress={() => navigation.openDrawer()}>
        <Ionicons name="menu" size={32} color="#000" />
      </TouchableOpacity>

      <Text style={styles.header}>الإعدادات</Text>

      <View style={styles.section}>
        <Text style={styles.label}>اسم المسجد</Text>
        <TextInput
          style={styles.input}
          placeholder="اكتب اسم المسجد"
          value={mosqueName}
          onChangeText={setMosqueName}
          returnKeyType="done"
          
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { marginBottom: 15 }]}>المدة بين الأذان والإقامة (بالدقائق)</Text>
        <View style={styles.prayersRow}>
          {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
            <View key={prayer} style={styles.prayerBox}>
              <Text style={styles.prayerLabel}>{prayer}</Text>
              <TextInput
                style={styles.prayerInput}
                placeholder="مثال: 10"
                keyboardType="numeric"
                value={iqamaTimes[prayer]}
                onChangeText={(value) => handleIqamaChange(prayer, value)}
                maxLength={4}
                returnKeyType="done"
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>الشاشة السوداء بعد الإقامة</Text>
        
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>تفعيل الشاشة السوداء</Text>
          <Switch
            value={blackScreenEnabled}
            onValueChange={setBlackScreenEnabled}
            thumbColor={blackScreenEnabled ? '#28a745' : '#f44336'}
          />
        </View>

        {blackScreenEnabled && (
          <>
            <Text style={[styles.label, { marginBottom: 15, fontSize: 16, color: '#666' }]}>
              مدة عرض الشاشة السوداء بعد الإقامة (بالدقائق)
            </Text>
            <View style={styles.prayersRow}>
              {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
                <View key={prayer + 'BlackScreen'} style={styles.prayerBox}>
                  <Text style={styles.prayerLabel}>{prayer}</Text>
                  <TextInput
                    style={styles.prayerInput}
                    placeholder="مثال: 5"
                    keyboardType="numeric"
                    value={blackScreenDurations[prayer]}
                    onChangeText={(value) => handleBlackScreenDurationChange(prayer, value)}
                    maxLength={2}
                    returnKeyType="done"
                  />
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
  <Text style={styles.label}>شريط الأخبار</Text>
  
  <View style={styles.switchContainer}>
    <Text style={styles.switchLabel}>تفعيل شريط الأخبار</Text>
    <Switch
      value={newsEnabled}
      onValueChange={setNewsEnabled}
      thumbColor={newsEnabled ? '#28a745' : '#f44336'}
      trackColor={{ false: '#d3d3d3', true: '#90ee90' }}
    />
  </View>

        {newsEnabled && (
          <TextInput
          style={styles.newsInput}
          placeholder="اكتب نص الأخبار هنا... يمكنك استخدام • للفصل بين الأخبار"
          placeholderTextColor="#999"
          value={newsText}
          onChangeText={setNewsText}
          multiline
          textAlignVertical="top"
          maxLength={1000}
          returnKeyType="done"
          blurOnSubmit={true}
        />
        )}
      </View>

      {/* Background Image Section */}
      <View style={styles.section}>
        <Text style={styles.label}>صورة الخلفية</Text>
        
        {backgroundImage && !isDefaultBackground && (
          <View style={styles.backgroundPreview}>
            <Image source={{ uri: backgroundImage }} style={styles.previewImage} />
            <Text style={styles.previewText}>معاينة الخلفية الحالية</Text>
          </View>
        )}

        <View style={styles.backgroundButtonsContainer}>
          <TouchableOpacity style={styles.backgroundButton}
          focusable={true}
          onPress={pickImage}>
            <Ionicons name="image-outline" size={20} color="#fff" />
            <Text style={styles.backgroundButtonText}>اختر صورة جديدة</Text>
          </TouchableOpacity>

          {!isDefaultBackground && (
            <TouchableOpacity 
              style={[styles.backgroundButton, styles.resetButton]} 
              focusable={true}
              onPress={resetToDefaultBackground}
            >
              <Ionicons name="refresh-outline" size={20} color="#fff" />
              <Text style={styles.backgroundButtonText}>استعادة الأصلية</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.backgroundHint}>
          يمكنك اختيار صورة مخصصة للخلفية أو استعادة الخلفية الأصلية
        </Text>
      </View>

      
      <View style={styles.section}>
        <Text style={styles.label}>التنقل التلقائي بعد الصلاة</Text>
        
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>تفعيل التنقل التلقائي</Text>
          <Switch
            value={autoNavigationEnabled}
            onValueChange={setAutoNavigationEnabled}
            thumbColor={autoNavigationEnabled ? '#28a745' : '#f44336'}
          />
        </View>

        {autoNavigationEnabled && (
          <>
            {/* Azkar Section */}
            <View style={styles.subSection}>
              <View style={styles.switchContainer}>
                <Text style={styles.subSwitchLabel}>صفحه الأذكار</Text>
                <Switch
                  value={azkarEnabled}
                  onValueChange={(enabled) => handleScreenToggle('azkar', enabled)}
                  thumbColor={azkarEnabled ? '#28a745' : '#f44336'}
                />
              </View>
              
              {azkarEnabled && (
                <View style={styles.inputsRow}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>المده بعد الشاشه السوداء</Text>
                    <TextInput
                      style={[
                        styles.smallInput,
                        conflictErrors.azkar.startAfter && { borderColor: '#dc3545', borderWidth: 2 }
                      ]}
                      placeholder="0"
                      keyboardType="numeric"
                      value={azkarSettings.startAfter}
                      onChangeText={(value) => handleAzkarSettingsChange('startAfter', value)}
                      maxLength={2}
                    />
                    {conflictErrors.azkar.startAfter && (
                      <Text style={styles.errorText}>{conflictErrors.azkar.message}</Text>
                    )}
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>المدة </Text>
                    <TextInput
                      style={[
                        styles.smallInput,
                        conflictErrors.azkar.duration && { borderColor: '#dc3545', borderWidth: 2 }
                      ]}
                      placeholder="1"
                      keyboardType="numeric"
                      value={azkarSettings.duration}
                      onChangeText={(value) => handleAzkarSettingsChange('duration', value)}
                      maxLength={2}
                    />
                    {conflictErrors.azkar.duration && (
                      <Text style={styles.errorText}>{conflictErrors.azkar.message}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Quran Section */}
            <View style={styles.subSection}>
              <View style={styles.switchContainer}>
                <Text style={styles.subSwitchLabel}>صفحه القرءان</Text>
                <Switch
                  value={quranEnabled}
                  onValueChange={(enabled) => handleScreenToggle('quran', enabled)}
                  thumbColor={quranEnabled ? '#28a745' : '#f44336'}
                />
              </View>
              
              {quranEnabled && (
                <View style={styles.inputsRow}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>المده بعد الشاشه السوداء</Text>
                    <TextInput
                      style={[
                        styles.smallInput,
                        conflictErrors.quran.startAfter && { borderColor: '#dc3545', borderWidth: 2 }
                      ]}
                      placeholder="0"
                      keyboardType="numeric"
                      value={quranSettings.startAfter}
                      onChangeText={(value) => handleQuranSettingsChange('startAfter', value)}
                      maxLength={2}
                    />
                    {conflictErrors.quran.startAfter && (
                      <Text style={styles.errorText}>{conflictErrors.quran.message}</Text>
                    )}
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>المدة </Text>
                    <TextInput
                      style={[
                        styles.smallInput,
                        conflictErrors.quran.duration && { borderColor: '#dc3545', borderWidth: 2 }
                      ]}
                      placeholder="1"
                      keyboardType="numeric"
                      value={quranSettings.duration}
                      onChangeText={(value) => handleQuranSettingsChange('duration', value)}
                      maxLength={2}
                    />
                    {conflictErrors.quran.duration && (
                      <Text style={styles.errorText}>{conflictErrors.quran.message}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Live Stream Section */}
            <View style={styles.subSection}>
              <View style={styles.switchContainer}>
                <Text style={styles.subSwitchLabel}>صفحه البث المباشر من مكة</Text>
                <Switch
                  value={liveStreamEnabled}
                  onValueChange={(enabled) => handleScreenToggle('liveMakkah', enabled)}
                  thumbColor={liveStreamEnabled ? '#28a745' : '#f44336'}
                />
              </View>
              
              {liveStreamEnabled && (
                <View style={styles.inputsRow}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>المده بعد الشاشه السوداء</Text>
                    <TextInput
                      style={[
                        styles.smallInput,
                        conflictErrors.liveStream.startAfter && { borderColor: '#dc3545', borderWidth: 2 }
                      ]}
                      placeholder="0"
                      keyboardType="numeric"
                      value={liveStreamSettings.startAfter}
                      onChangeText={(value) => handleLiveStreamSettingsChange('startAfter', value)}
                      maxLength={2}
                    />
                    {conflictErrors.liveStream.startAfter && (
                      <Text style={styles.errorText}>{conflictErrors.liveStream.message}</Text>
                    )}
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>المدة</Text>
                    <TextInput
                      style={[
                        styles.smallInput,
                        conflictErrors.liveStream.duration && { borderColor: '#dc3545', borderWidth: 2 }
                      ]}
                      placeholder="1"
                      keyboardType="numeric"
                      value={liveStreamSettings.duration}
                      onChangeText={(value) => handleLiveStreamSettingsChange('duration', value)}
                      maxLength={2}
                    />
                    {conflictErrors.liveStream.duration && (
                      <Text style={styles.errorText}>{conflictErrors.liveStream.message}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Madina Live Stream Section */}
            <View style={styles.subSection}>
              <View style={styles.switchContainer}>
                <Text style={styles.subSwitchLabel}>صفحه المدينة المنورة المباشرة</Text>
                <Switch
                  value={liveMadinaEnabled}
                  onValueChange={(enabled) => handleScreenToggle('liveMadina', enabled)}
                  thumbColor={liveMadinaEnabled ? '#28a745' : '#f44336'}
                />
              </View>
              
              {liveMadinaEnabled && (
                <View style={styles.inputsRow}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>المده بعد الشاشه السوداء</Text>
                    <TextInput
                      style={[
                        styles.smallInput,
                        conflictErrors.liveMadina.startAfter && { borderColor: '#dc3545', borderWidth: 2 }
                      ]}
                      placeholder="0"
                      keyboardType="numeric"
                      value={liveMadinaSettings.startAfter}
                      onChangeText={(value) => handleLiveMadinaSettingsChange('startAfter', value)}
                      maxLength={2}
                    />
                    {conflictErrors.liveMadina.startAfter && (
                      <Text style={styles.errorText}>{conflictErrors.liveMadina.message}</Text>
                    )}
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>المدة</Text>
                    <TextInput
                      style={[
                        styles.smallInput,
                        conflictErrors.liveMadina.duration && { borderColor: '#dc3545', borderWidth: 2 }
                      ]}
                      placeholder="1"
                      keyboardType="numeric"
                      value={liveMadinaSettings.duration}
                      onChangeText={(value) => handleLiveMadinaSettingsChange('duration', value)}
                      maxLength={2}
                    />
                    {conflictErrors.liveMadina.duration && (
                      <Text style={styles.errorText}>{conflictErrors.liveMadina.message}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>اتجاه الشاشة</Text>
        
        <View style={styles.orientationContainer}>
          <TouchableOpacity
            style={[
              styles.orientationButton,
              orientation === 'landscape' && styles.orientationButtonSelected
            ]}
            focusable={true}
            onPress={() => handleOrientationChange('landscape')}
          >
            <Ionicons 
              name="phone-landscape-outline" 
              size={24} 
              color={orientation === 'landscape' ? '#fff' : '#2E8B57'} 
            />
            <Text style={[
              styles.orientationButtonText,
              orientation === 'landscape' && styles.orientationButtonTextSelected
            ]}>
              أفقي
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.orientationButton,
              orientation === 'portrait' && styles.orientationButtonSelected
            ]}
            focusable={true}
            onPress={() => handleOrientationChange('portrait')}
          >
            <Ionicons 
              name="phone-portrait-outline" 
              size={24} 
              color={orientation === 'portrait' ? '#fff' : '#2E8B57'} 
            />
            <Text style={[
              styles.orientationButtonText,
              orientation === 'portrait' && styles.orientationButtonTextSelected
            ]}>
              عمودي
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.orientationHint}>
          الاتجاه الأفقي مناسب للأجهزة اللوحية والشاشات الكبيرة
        </Text>
      </View>

      {/* Location Settings Section */}
<View style={styles.section}>
  <Text style={styles.label}>📍 إعدادات الموقع</Text>
  
  {selectedCity && (
    <View style={styles.currentLocationCard}>
      <Text style={styles.currentLocationTitle}>الموقع الحالي:</Text>
      <Text style={styles.currentLocationText}>{selectedCity.name}</Text>
      {selectedCity.country && (
        <Text style={styles.currentLocationSubtext}>{selectedCity.country}</Text>
      )}
      {(selectedCity.isManual || selectedCity.isGPS) && (
        <Text style={styles.coordinatesText}>
          العرض: {selectedCity.lat.toFixed(4)} | الطول: {selectedCity.lon.toFixed(4)}
        </Text>
      )}
    </View>
  )}

  <View style={styles.locationMethodContainer}>
    <TouchableOpacity
      style={[styles.methodButton, locationMethod === 'gps' && styles.activeMethodButton]}
      focusable={true}
      onPress={() => setLocationMethod('gps')}
    >
      <Text style={[styles.methodButtonText, locationMethod === 'gps' && styles.activeMethodButtonText]}>
        استخدام GPS
      </Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={[styles.methodButton, locationMethod === 'cities' && styles.activeMethodButton]}
      focusable={true}
      onPress={() => setLocationMethod('cities')}
    >
      <Text style={[styles.methodButtonText, locationMethod === 'cities' && styles.activeMethodButtonText]}>
        اختيار مدينة
      </Text>
    </TouchableOpacity>
    
    <TouchableOpacity
      style={[styles.methodButton, locationMethod === 'manual' && styles.activeMethodButton]}
      focusable={true}
      onPress={() => setLocationMethod('manual')}
    >
      <Text style={[styles.methodButtonText, locationMethod === 'manual' && styles.activeMethodButtonText]}>
        إدخال يدوي
      </Text>
    </TouchableOpacity>
  </View>

  {locationMethod === 'gps' && (
    <View style={styles.gpsContainer}>
      <TouchableOpacity style={styles.updateLocationButton} focusable={true} onPress={updateLocationFromGPS}>
      
        <Ionicons name="navigate-circle-outline" size={20} color="#fff" />
        <Text style={styles.updateLocationButtonText}>تحديد الموقع من GPS</Text>
      </TouchableOpacity>
      <Text style={styles.locationHint}>سيتم حفظ إحداثيات موقعك الحالي تلقائياً</Text>
    </View>
  )}

  {locationMethod === 'cities' && (
    <View style={styles.citySelectionContainer}>
      <TouchableOpacity style={styles.selectButton}
      focusable={true}
      onPress={() => setShowCountryPicker(true)}>
        <Text style={styles.selectButtonText}>
          {selectedCountry ? `البلد: ${selectedCountry}` : 'اختيار البلد'}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      
      {selectedCountry && (
        <TouchableOpacity style={styles.selectButton}
        focusable={true}
        onPress={() => setShowCityPicker(true)}>
          <Text style={styles.selectButtonText}>
            {selectedCity && selectedCity.country === selectedCountry 
              ? `المدينة: ${selectedCity.name}` 
              : 'اختيار المدينة'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
      )}
    </View>
  )}

  {locationMethod === 'manual' && (
    <View style={styles.manualInputContainer}>
      <View style={styles.coordinateInputContainer}>
        <Text style={styles.coordinateLabel}>خط العرض (Latitude):</Text>
        <TextInput
          style={styles.coordinateInput}
          value={manualLat}
          onChangeText={setManualLat}
          placeholder="مثال: 30.0444"
          keyboardType="numeric"
          returnKeyType="done"
        />
        <Text style={styles.coordinateHint}>من -90 إلى 90</Text>
      </View>
      
      <View style={styles.coordinateInputContainer}>
        <Text style={styles.coordinateLabel}>خط الطول (Longitude):</Text>
        <TextInput
          style={styles.coordinateInput}
          value={manualLon}
          onChangeText={setManualLon}
          placeholder="مثال: 31.2357"
          keyboardType="numeric"
          returnKeyType="done"
        />
        <Text style={styles.coordinateHint}>من -180 إلى 180</Text>
      </View>
      
      <TouchableOpacity style={styles.saveCoordinatesButton} 
      focusable={true}
      onPress={saveManualCoordinates}>
        <Text style={styles.saveCoordinatesButtonText}>حفظ الإحداثيات</Text>
      </TouchableOpacity>
    </View>
  )}
</View>

<Modal visible={showCountryPicker} animationType="slide" transparent={true} onRequestClose={() => setShowCountryPicker(false)}>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>اختيار البلد</Text>
        <TouchableOpacity focusable={true} onPress={() => setShowCountryPicker(false)}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      <FlatList
      showsVerticalScrollIndicator={false}
        data={Object.keys(COUNTRIES_CITIES)}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.countryItem} focusable={true} onPress={() => selectCountry(item)}>
            <Text style={styles.countryItemText}>{item}</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        )}
      />
    </View>
  </View>
</Modal>

<Modal visible={showCityPicker} animationType="slide" transparent={true} onRequestClose={() => setShowCityPicker(false)}>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>اختيار المدينة - {selectedCountry}</Text>
        <TouchableOpacity 
        focusable={true}
        onPress={() => setShowCityPicker(false)}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      <FlatList
      showsVerticalScrollIndicator={false}
        data={availableCities}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.cityItemModal}
          focusable={true}
           onPress={() => selectCityFromCountry(item)}>
            <Text style={styles.cityItemText}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        )}
      />
    </View>
  </View>
</Modal>

      <TouchableOpacity style={styles.saveButton}
      focusable={true}
      onPress={saveSettings}>
        <Text style={styles.saveText}>حفظ الإعدادات</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} focusable={true} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.logoutIcon} />
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    paddingTop: 60,
    backgroundColor: '#f9f9f9',
    flexGrow: 1,
  },
  menuButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25,
    color: '#222',
  },
  section: {
    marginBottom: 30,
  },
  label: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#444',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    marginTop: 10,
    textAlign: 'center',
    color: '#000',
    
    
  },
  prayersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap', // ده هيخلي العناصر تنزل سطر جديد
    justifyContent: 'center', // رجعتها space-between عشان التوزيع
    paddingHorizontal: 8,
    alignContent:'center'
  },
  prayerBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    width: '30%', // عرض أكبر عشان الكلام يظهر أحسن
    minWidth: 60, // أقل عرض أكبر
    maxWidth: 110, // أقصى عرض أكبر
    marginVertical: 6, // مساحة أكبر بين الصفوف
    marginHorizontal: 2,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  prayerLabel: {
    fontSize: 13, // قللت الخط شوية عشان يدخل في السطر
    fontWeight: '600',
    marginBottom: 8,
    color: '#2E8B57',
    textAlign: 'center',
    lineHeight: 16, // تحكم في المسافة بين الأسطر
  },
  prayerInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 0,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#fafafa',
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 20,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
    width:'50%',
    alignSelf:'center'
  },
  saveText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  switchLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  subSection: {
    marginTop: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  subSwitchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  inputsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  smallInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#fff',
    width: '100%',
    minWidth: 60,
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  backgroundPreview: {
    marginVertical: 15,
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 120,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  previewText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  backgroundButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 15,
    gap: 15,
  },
  backgroundButton: {
    backgroundColor: '#2E8B57',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  resetButton: {
    backgroundColor: '#dc3545',
  },
  backgroundButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backgroundHint: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  orientationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
    gap: 20,
  },
  orientationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2E8B57',
    backgroundColor: '#fff',
    minWidth: 120,
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  orientationButtonSelected: {
    backgroundColor: '#2E8B57',
    borderColor: '#2E8B57',
  },
  orientationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E8B57',
    marginLeft: 8,
  },
  orientationButtonTextSelected: {
    color: '#fff',
  },
  orientationHint: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 30,
    shadowColor: "#dc3545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  newsInput: {
    borderWidth: 1,
    borderColor: '#ddd', 
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    marginTop: 15,
    textAlign: 'right',
    minHeight: 100,
    maxHeight: 150,
  },
  // Location Settings Styles
currentLocationCard: {
  backgroundColor: '#f0f8ff',
  padding: 15,
  borderRadius: 10,
  marginBottom: 15,
  borderLeftWidth: 4,
  borderLeftColor: '#2E8B57',
},
currentLocationTitle: {
  fontSize: 14,
  color: '#666',
  marginBottom: 5,
},
currentLocationText: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#000',
},
currentLocationSubtext: {
  fontSize: 14,
  color: '#666',
  marginTop: 3,
},
coordinatesText: {
  fontSize: 12,
  color: '#888',
  marginTop: 5,
},
locationMethodContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 20,
  paddingHorizontal: 5,

},
methodButton: {
  flex: 1,
  backgroundColor: '#f5f5f5',
  paddingVertical: 12,
  paddingHorizontal: 10,
  borderRadius: 8,
  borderWidth: 2,
  borderColor: '#ddd',
  alignItems: 'center',
  marginHorizontal: 3,
},
activeMethodButton: {
  backgroundColor: '#2E8B57',
  borderColor: '#2E8B57',
},
methodButtonText: {
  fontSize: 14,
  color: '#666',
  fontWeight: '600',
  textAlign: 'center',
},
activeMethodButtonText: {
  color: '#fff',
},
gpsContainer: {
  alignItems: 'center',
  marginTop: 10,

},
updateLocationButton: {
  backgroundColor: '#007bff',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 15,
  borderRadius: 10,
  gap: 10,
  width: '100%',
},
updateLocationButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},
locationHint: {
  fontSize: 13,
  color: '#666',
  textAlign: 'center',
  marginTop: 10,
  fontStyle: 'italic',
},
citySelectionContainer: {
  marginTop: 10,
},
selectButton: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#f5f5f5',
  padding: 15,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#ddd',
},
selectButtonText: {
  fontSize: 16,
  color: '#333',
},
manualInputContainer: {
  marginTop: 10,
},
coordinateInputContainer: {
  marginBottom: 15,
},
coordinateLabel: {
  fontSize: 14,
  color: '#333',
  fontWeight: '600',
},
coordinateInput: {
  backgroundColor: '#f5f5f5',
  padding: 12,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#ddd',
  fontSize: 16,
  textAlign: 'right',
},
coordinateHint: {
  fontSize: 12,
  color: '#888',
  fontStyle: 'italic',
},
saveCoordinatesButton: {
  backgroundColor: '#28a745',
  padding: 15,
  borderRadius: 10,
  alignItems: 'center',
  marginTop: 10,
},
saveCoordinatesButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'flex-end',
},
modalContent: {
  backgroundColor: '#fff',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  maxHeight: '80%',
  paddingBottom: 20,
},
modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 20,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
},
modalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#333',
},
countryItem: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 15,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
},
countryItemText: {
  fontSize: 16,
  color: '#333',
},
cityItemModal: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 15,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
},
cityItemText: {
  fontSize: 16,
  color: '#333',
},
});