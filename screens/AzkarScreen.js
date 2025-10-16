// AzkarScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';

const azkarRight = [
  'اللّهُـمَّ أَنْـتَ السَّلامُ ، وَمِـنْكَ السَّلام ، تَبارَكْتَ و تعاليت يا مالك الملك يا ذا الجَـلالِ وَالإِكْـرام',
  'لا إلهَ إلاّ اللّهُ وحْـدَهُ لا شريكَ لهُ، لهُ المُلكُ ولهُ الحَمْد، يُحيـي وَيُمـيتُ وهُوَ على كُلّ شيءٍ قدير. (10 مرات بَعْدَ المَغْرِب وَالصّـبْح)',
  'اللّهُـمَّ إِنِّـي أَسْأَلُـكَ عِلْمـاً نافِعـاً وَرِزْقـاً طَيِّـباً ، وَعَمَـلاً مُتَقَـبَّلاً. (بعد السلام من صلاة الفجر)',

  'لا إلهَ إلاّ اللّهُ وحدَهُ لا شريكَ لهُ، لهُ المُـلْكُ ولهُ الحَمْد، وهوَ على كلّ شَيءٍ قَدير، اللّهُـمَّ لا مانِعَ لِما أَعْطَـيْت، وَلا مُعْطِـيَ لِما مَنَـعْت، وَلا يَنْفَـعُ ذا الجَـدِّ مِنْـكَ الجَـد',
  'لا إله إلا الله وحده لا شريك له،له الملك وله الحمد وهو على كل شئ قدير،لا حول ولا قوة إلا بالله،لا إله إلا الله،ولا نعبد إلا إياه ، له النعمة وله الفضل ،وله الثناء الحسن،لا إله إلا الله مخلصين له الدين ولو كره الكافرون',
  'لا إلهَ إلاّ اللّهُ وَحْـدَهُ لا شريكَ لهُ، لهُ الملكُ ولهُ الحَمْد، وهُوَ على كُلّ شَيءٍ قَـدير'
];

const azkarLeft = [
  '﴿ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ... ﴾ [ البقرة: 255]',
  'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
  'سُـبْحانَ اللهِ، والحَمْـدُ لله ، واللهُ أكْـبَر (33 مرة)',


  'قُلْ هُوَ ٱللَّهُ أَحَدٌ... وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ',
  'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ... وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ',
  'قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ... مِنَ ٱلْجِنَّةِ وَٱلنَّاسِ',
  'اللّهُـمَّ إِنِّـي أَسْأَلُـكَ عِلْمـاً نافِعـاً وَرِزْقـاً طَيِّـباً ، وَعَمَـلاً مُتَقَـبَّلاً. (بعد السلام من صلاة الفجر)',
  'اللَّهُمَّ أَجِرْنِي مِنْ النَّار. (7 مرات بعد صلاة الصبح والمغرب)',
  'اللَّهُمَّ إني أسألك رضاك و الجنة.'
];

const allAzkar = [...azkarRight, ...azkarLeft];

export default function AzkarScreen() {
  const navigation = useNavigation();
  const [userOrientation, setUserOrientation] = useState('portrait');

  // Set screen orientation based on user preference
  useFocusEffect(
    React.useCallback(() => {
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
    <ImageBackground source={require('./5848096958965729738.jpg')} style={styles.background} resizeMode="cover">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.menuButton}
        focusable={true}
        onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu" size={32} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.title}>أذكار بعد الصلاة</Text>
        
        {userOrientation === 'portrait' ? (
          // Portrait Layout - Single column with scrolling
          <ScrollView style={styles.portraitContainer} showsVerticalScrollIndicator={false}>
            {allAzkar.map((zekr, index) => (
              <View key={index} style={styles.zekrCardPortrait}>
                <Text style={styles.zekrTextPortrait}>{zekr}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          // Landscape Layout - Two columns (existing)
          <View style={styles.columnsContainer}>
            <View style={styles.zekrColumn}>
              <View style={styles.zekrBox}>
                {azkarRight.map((zekr, index) => (
                  <View key={index} style={styles.zekrCard}>
                    <Text style={styles.zekrText} numberOfLines={2} ellipsizeMode="tail">{zekr}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.zekrColumn}>
              <View style={styles.zekrBox}>
                {azkarLeft.map((zekr, index) => (
                  <View key={index} style={styles.zekrCard}>
                    <Text style={styles.zekrText} numberOfLines={2} ellipsizeMode="tail">{zekr}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.33)',
    paddingTop: 15,
    paddingHorizontal: 10
  },
  menuButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
    padding: 5,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.48)',
    borderRadius: 10,
    borderColor: 'rgba(255, 255, 255, 0)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    
    marginTop: 10,
    textAlign: 'center',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  // Landscape styles (existing)
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    
  },
  zekrColumn: {
    flex: 1,
  },
  zekrBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 5,
    flex: 1,
    justifyContent: 'space-between',
    borderRadius: 10,
    
  },
  zekrCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    // borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 1,
    
    flex: 1,
    justifyContent: 'center',
    // maxHeight: 60,
  },
  zekrText: {
    fontSize: 20,
    textAlign: 'center',
    color: '#fff',
    lineHeight: 24,
    fontWeight: '500',
  },
  // Portrait styles
  portraitContainer: {
    flex: 1,
    paddingHorizontal: 5,
  },
  zekrCardPortrait: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,

  },
  zekrTextPortrait: {
    fontSize: 19,
    textAlign: 'center',
    color: '#333',
    lineHeight: 26,
    fontWeight: '500',
    alignSelf: 'center',
    
    
  },
});
