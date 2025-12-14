// AzkarScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';

// قائمة الأذكار الجديدة
const azkarList = [
  'أَسْـتَغْفِرُ اللهَ، أَسْـتَغْفِرُ اللهَ، أَسْـتَغْفِرُ اللهَ.',
  'اللَّهُـمَّ أَنْـتَ السَّلامُ، وَمِـنْكَ السَّلامُ، تَبَارَكْتَ يَا ذَا الجَـلالِ وَالإِكْـرَامِ',
  'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُـلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، اللَّهُـمَّ لَا مَانِعَ لِمَا أَعْطَـيْتَ، وَلَا مُعْطِـيَ لِمَا مَنَـعْتَ، وَلَا يَنْفَـعُ ذَا الجَـدِّ مِنْـكَ الجَـدُّ',
  'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
  'لَا إِلَهَ إِلَّا اللهُ، وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، لَا حَـوْلَ وَلَا قُـوَّةَ إِلَّا بِاللهِ، لَا إِلَهَ إِلَّا اللهُ، وَلَا نَعْـبُـدُ إِلَّا إِيَّـاهُ، لَهُ النِّعْـمَةُ وَلَهُ الْفَضْلُ وَلَهُ الثَّـنَاءُ الْحَـسَنُ، لَا إِلَهَ إِلَّا اللهُ مُخْلِصِـينَ لَـهُ الدِّينَ وَلَوْ كَـرِهَ الْكَافِرُونَ',
  'سُـبْحَانَ اللهِ، وَالْحَمْـدُ للهِ، وَاللهُ أَكْـبَرُ (ثلاثاً وثلاثون مرة)',
  'ثُمَّ تَمَامُ الْمِائَةِ: لَا إِلَهَ إِلَّا اللهُ وَحْـدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَـدِيرٌ',
  'قِرَاءَةُ آيَةِ الْكُرْسِيِّ: (اللهُ لَا إِلَـهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...)',
  'قِرَاءَةُ سُور الْإِخْلَاصِ و الْفَلَقِ و النَّاسِ',
  'لَا إِلَهَ إِلَّا اللهُ وَحْـدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، يُحْيِـي وَيُمِـيتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ (عَشْرَ مَرَّاتٍ بَعْدَ صَلَاتَيِ الْمَغْرِبِ وَالْفَجْرِ)',
];

// تقسيم للوضع الأفقي
const azkarRight = azkarList.slice(0, 5);
const azkarLeft = azkarList.slice(5);

export default function AzkarScreen() {
  const navigation = useNavigation();
  const [userOrientation, setUserOrientation] = useState('portrait');
  const [currentFocusedElement, setCurrentFocusedElement] = useState(null);
  const [focusKey, setFocusKey] = useState(0);

  // TV Focus Management
  const handleFocus = (elementName) => setCurrentFocusedElement(elementName);
  const handleBlur = () => setCurrentFocusedElement(null);
  const isFocused = (elementName) => currentFocusedElement === elementName;

  // Restore focus to menu button when screen becomes focused
  useFocusEffect(
    useCallback(() => {
      setFocusKey(prev => prev + 1);
      console.log('🎯 Azkar screen focused - restoring menu button focus');
    }, [])
  );

  // Set screen orientation based on user preference
  useFocusEffect(
    useCallback(() => {
      const setOrientation = async () => {
        try {
          const orientation = await AsyncStorage.getItem('userOrientation');
          setUserOrientation(orientation || 'portrait');
          
          if (orientation === 'portrait') {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
          } else {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
          }
        } catch (error) {
          console.log('Error setting orientation:', error);
        }
      };
      
      setOrientation();
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Header - مختلف حسب الـ orientation */}
      <View style={[
        styles.header,
        userOrientation === 'portrait' ? styles.headerPortrait : styles.headerLandscape
      ]}>
        <TouchableOpacity 
          key={`menu-azkar-${focusKey}`}
          style={[
            styles.menuButton,
            userOrientation === 'portrait' ? styles.menuButtonPortrait : styles.menuButtonLandscape,
            isFocused('menuButton') && styles.tvFocusedButton
          ]}
          focusable={true}
          hasTVPreferredFocus={true}
          onFocus={() => handleFocus('menuButton')}
          onBlur={handleBlur}
          onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={[
          styles.title,
          userOrientation === 'portrait' ? styles.titlePortrait : styles.titleLandscape
        ]}>
          الأذكار بعد الصلاة
        </Text>
      </View>

      {userOrientation === 'portrait' ? (
        // Portrait Layout - كل الأذكار بدون سكرول
        <View style={styles.portraitContainer}>
          {azkarList.map((zekr, index) => (
            <View key={index} style={styles.zekrItem}>
              <Text style={styles.zekrText}>{zekr}</Text>
            </View>
          ))}
        </View>
      ) : (
        // Landscape Layout - عمودين مع سكرول
        <ScrollView style={styles.landscapeScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.landscapeContainer}>
            <View style={styles.column}>
              {azkarRight.map((zekr, index) => (
                <View key={index} style={styles.zekrCardLandscape}>
                  <Text style={styles.zekrTextLandscape}>{zekr}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.column}>
              {azkarLeft.map((zekr, index) => (
                <View key={index + 5} style={styles.zekrCardLandscape}>
                  <Text style={styles.zekrTextLandscape}>{zekr}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#03172b', // خلفية زرقاء غامقة
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  headerPortrait: {
    paddingHorizontal: 12,
    paddingTop: 28,
    backgroundColor: '#03172b'
    },
  headerLandscape: {
    paddingHorizontal: 8,
    paddingTop: 20,
    backgroundColor: '#03172b'
    },
  menuButton: {
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonPortrait: {
    width: 30,
    height: 30,
    marginRight: 12,
  },
  
  menuButtonLandscape: {
    width: 30,
    height: 30,
    marginRight: 8,
  },
  title: {
    fontWeight: 'bold',
    color: '#d4af37',
    flex: 1,
    textAlign: 'center',
  },
  
  titlePortrait: {
    fontSize: 26,
  },
  
  titleLandscape: {
    fontSize: 28,
  },
  
  // Portrait Styles - قائمة بسيطة بدون سكرول
  portraitContainer: {
    flex: 1,
    paddingHorizontal: 7,
    paddingVertical: .5,
    justifyContent: 'space-evenly',
  },
  zekrItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: .5,
    justifyContent: 'center',


  },
 
  zekrText: {
    flex: 1,
    fontSize: 22,
    color: '#e8f0f2',
    // lineHeight: 21,
    textAlign: 'center',
  },
  
  // Landscape Styles
  landscapeScroll: {
    flex: 1,
  },
  landscapeContainer: {
    flexDirection: 'row',
    padding: 5,
    gap: 5,
  },
  column: {
    flex: 1,
    gap: 8,
  },
  zekrCardLandscape: {
    backgroundColor: 'rgba(20, 40, 70, 0.6)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical:5,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    minHeight: 65,
    justifyContent: 'center',
  },
  
  zekrTextLandscape: {
    fontSize: 21,
    textAlign: 'center',
    color: '#e8f0f2',
    lineHeight: 24,
    marginTop: 4,
  },
  
  // TV Focus Styles
  tvFocusedButton: {
    borderWidth: 3,
    borderColor: 'rgba(216, 232, 223, 0)',
    transform: [{ scale: 1.05 }],
    elevation: 10,
    backgroundColor: 'rgba(71, 71, 67, 0.13)',
  },
});