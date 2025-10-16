import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Animated,
  Dimensions
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const [backgroundImage, setBackgroundImage] = useState(null);

  // Load background image from AsyncStorage
  const loadBackgroundImage = async () => {
    try {
      const savedBackground = await AsyncStorage.getItem('backgroundImage');
      if (savedBackground) {
        setBackgroundImage(savedBackground);
      }
    } catch (error) {
      console.error('Error loading background image:', error);
    }
  };

  // Force portrait orientation when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const lockOrientation = async () => {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      };
      
      lockOrientation();
      loadBackgroundImage(); // Load background image when screen is focused

      return () => {
        // Don't force landscape when leaving - let the next screen handle its orientation
      };
    }, [])
  );

  useEffect(() => {
    // Load background image on component mount
    loadBackgroundImage();

    // Animation sequence
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to Auth screen after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace('Auth');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <ImageBackground
      source={backgroundImage ? { uri: backgroundImage } : require('./pexels-pashal-337904.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.appIcon}>🕌</Text>
            <Text style={styles.appTitle}>تطبيق الصلاة</Text>
            <Text style={styles.appSubtitle}>دليلك الروحاني اليومي</Text>
          </View>
          
          <View style={styles.featuresContainer}>
            <Text style={styles.feature}>📿 أذكار يومية</Text>
            <Text style={styles.feature}>🕌 مواقيت الصلاة</Text>
            <Text style={styles.feature}>📖 القرآن الكريم</Text>
            <Text style={styles.feature}>📡 بث مباشر من الحرم</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  appSubtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  featuresContainer: {
    alignItems: 'center',
  },
  feature: {
    fontSize: 16,
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});