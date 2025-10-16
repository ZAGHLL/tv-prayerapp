import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, SafeAreaView } from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';



const slides = [
  {
    key: '1',
    title: 'مواقيت الصلاة',
    text: 'اعرف مواعيد الصلاة بدقة في مدينتك والعد التنازلي للصلاه القادمه',
    icon: 'time-outline',
    color: '#2F80ED',
  },
  {
    key: '2',
    title: 'القرآن الكريم',
    text: 'تلاوة وتدبر كتاب الله تعالى',
    icon: 'book-outline',
    color: '#588157',
  },
  {
    key: '3',
    title: 'بث مباشر',
    text: 'متابعة البث المباشر للحرمين الشريفين',
    icon: 'videocam-outline',
    color: '#bc4749',
  },
  {
    key: '4',
    title: ' أذكار ما بعد الصلاة',
    text: '    أذكار ما بعد الصلاة دبر كل صلاة',
    icon: 'heart-outline',
    color: '#e6ccb2',
  },
  {
    key: '5',
    title: 'إعدادات التطبيق',
    text: 'خصّص التطبيق كما تحب: المسجد، الأذان، شريط الأخبار، التنقل التلقائي، وغيرهم',
    icon: 'settings-outline',
    color: '#415a77',
  },
  {
    key: '6',
    title: 'تواصل معنا',
    text: 'للاستفسار أو تفعيل الاشتراك',
    icon: 'chatbubbles-outline',
    color: '#2D9CDB',
    isLast: true,
  },
];

const OnboardingScreen = ({ navigation }) => {
  const handleDone = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    navigation.replace('Login');
  };

  const renderItem = ({ item }) => (
    <View style={[styles.slide, { backgroundColor: '#FFF' }]}>
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon} size={60} color={item.color} />
      </View>
      <Text style={[styles.title, { color: item.color }]}>{item.title}</Text>
      <Text style={styles.text}>{item.text}</Text>

      {item.isLast && (
  <View style={styles.buttonsContainer}>
    {/* زر واتساب الدعم الفني */}
    <TouchableOpacity 
      style={[styles.button, { backgroundColor: '#25D366' }]} 
      focusable={true}
      onPress={() => Linking.openURL('https://wa.me/+966594856028')}
    >
      <Ionicons name="logo-whatsapp" size={24} color="#FFF" style={styles.buttonIcon} />
      <Text style={styles.buttonText}>تواصل معنا عبر الواتساب  </Text>
    </TouchableOpacity>
    
    {/* زر تواصل معنا (مكالمة هاتفية) */}
    <TouchableOpacity 
      style={[styles.button, { backgroundColor: '#EB5757' }]} 
      focusable={true}
      onPress={() => Linking.openURL('tel:+966114551767')}
    >
      <Ionicons name="call-outline" size={24} color="#FFF" style={styles.buttonIcon} />
      <Text style={styles.buttonText}>تواصل معنا</Text>
    </TouchableOpacity>
    
    {/* زر البريد الإلكتروني */}
    <TouchableOpacity 
      style={[styles.button, { backgroundColor: '#2F80ED' }]} 
      focusable={true}
      onPress={() => Linking.openURL('mailto:Sales@smartcloudksa.com')}
    >
      <Ionicons name="mail-outline" size={24} color="#FFF" style={styles.buttonIcon} />
      <Text style={styles.buttonText}>البريد الإلكتروني</Text>
    </TouchableOpacity>
    
    {/* زر بدء الاستخدام */}
    {/* <TouchableOpacity 
      style={[styles.button, { backgroundColor: '#2F80ED', marginTop: 20 }]} 
      onPress={handleDone}
    >
      <Text style={styles.buttonText}>بدء استخدام التطبيق</Text>
    </TouchableOpacity> */}
  </View>
)}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppIntroSlider
        data={slides}
        renderItem={renderItem}
        onDone={handleDone}
        showSkipButton={false}
        showNextButton={!slides[slides.length - 1].isLast}
        showDoneButton={false}
        dotStyle={styles.dotStyle}
        activeDotStyle={styles.activeDotStyle}
        renderNextButton={() => (
          <View style={styles.navButton}>
            <Ionicons name="arrow-forward" size={24} color="#4CAF50" />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'sans-serif-condensed',
  },
  text: {
    fontSize: 20,
    color: '#555',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
    fontFamily: 'sans-serif',
  },
  buttonsContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 8,
    width: '100%',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  dotStyle: {
    backgroundColor: '#E0E0E0',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDotStyle: {
    backgroundColor: '#4CAF50',
    width: 20,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  navButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
  },
});

export default OnboardingScreen;