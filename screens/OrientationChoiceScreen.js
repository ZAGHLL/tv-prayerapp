import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function OrientationChoiceScreen({ navigation }) {
  const [selectedOrientation, setSelectedOrientation] = useState('portrait');
  const scaleAnim = new Animated.Value(0.9);

  // Force portrait orientation for this screen
  useFocusEffect(
    React.useCallback(() => {
      const lockOrientation = async () => {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      };
      
      lockOrientation();

      // Animate on focus
      Animated.spring(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      return () => {
        // Don't change orientation here, let the user's choice handle it
      };
    }, [])
  );

  const handleOrientationChoice = async (orientation) => {
    setSelectedOrientation(orientation);
    
    try {
      // Save user preference
      await AsyncStorage.setItem('userOrientation', orientation);
      
      // Set the orientation immediately
      if (orientation === 'landscape') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }
      
      // Navigate to main app with a slight delay for smooth transition
      setTimeout(() => {
        navigation.replace('Main');
      }, 500);
      
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء حفظ التفضيلات');
    }
  };

  return (
    <ImageBackground
      source={require('./pexels-pashal-337904.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>اختر طريقة العرض المفضلة</Text>
            <Text style={styles.subtitle}>كيف تفضل استخدام التطبيق؟</Text>
          </View>

          <View style={styles.choicesContainer}>
            <TouchableOpacity
              style={[
                styles.choiceCard,
                selectedOrientation === 'landscape' && styles.selectedCard
              ]}
              focusable={true}
              onPress={() => handleOrientationChoice('landscape')}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="phone-landscape-outline" size={60} color="#2E8B57" />
              </View>
              <Text style={styles.choiceTitle}>العرض الأفقي</Text>
              <Text style={styles.choiceDescription}>
                مناسب للشاشات الكبيرة{'\n'}
                عرض أكثر للمحتوى{'\n'}
                تجربة تشبه الشاشات العادية
              </Text>
              <View style={styles.features}>
                <Text style={styles.feature}>📱 للأجهزة اللوحية</Text>
                <Text style={styles.feature}>🖥️ عرض واسع</Text>
                <Text style={styles.feature}>📊 محتوى أكثر</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.choiceCard,
                selectedOrientation === 'portrait' && styles.selectedCard
              ]}
              focusable={true}
              onPress={() => handleOrientationChoice('portrait')}
              activeOpacity={0.8}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="phone-portrait-outline" size={60} color="#2E8B57" />
              </View>
              <Text style={styles.choiceTitle}>العرض العمودي</Text>
              <Text style={styles.choiceDescription}>
                مناسب للهواتف المحمولة{'\n'}
                سهولة في الاستخدام{'\n'}
                تجربة تقليدية للهاتف
              </Text>
              <View style={styles.features}>
                <Text style={styles.feature}>📱 للهواتف</Text>
                <Text style={styles.feature}>👆 سهل الاستخدام</Text>
                <Text style={styles.feature}>🔄 قابل للتغيير</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              يمكنك تغيير هذا الإعداد لاحقاً من الإعدادات
            </Text>
          </View>
        </Animated.View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  choicesContainer: {
    width: '100%',
    flexDirection: 'column',
    gap: 20,
  },
  choiceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#2E8B57',
    backgroundColor: 'rgba(46, 139, 87, 0.1)',
    transform: [{ scale: 1.02 }],
  },
  iconContainer: {
    marginBottom: 15,
  },
  choiceTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 10,
    textAlign: 'center',
  },
  choiceDescription: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 15,
  },
  features: {
    alignItems: 'center',
  },
  feature: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  footer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
}); 