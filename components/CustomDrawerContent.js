import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, BackHandler } from 'react-native';
import { useDrawerStatus } from '@react-navigation/drawer';

const menuItems = [
  { label: 'أوقات الصلاة', route: 'PrayerTimes' },
  { label: 'الأذكار', route: 'azkar' },
  { label: 'القرآن الكريم', route: 'quran' },
  { label: 'الورد اليومي', route: 'dailyWird' },
  { label: 'مكة مباشر', route: 'makkah live' },
  { label: 'المدينة مباشر', route: 'madina live' },
  { label: 'الإعدادات', route: 'setting' },
];

export default function CustomDrawerContent({ navigation, state }) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const firstItemRef = useRef(null);
  const drawerStatus = useDrawerStatus();
  const isOpen = drawerStatus === 'open';

  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(0);
      setTimeout(() => {
        if (firstItemRef.current) {
          firstItemRef.current.focus?.();
        }
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isOpen) {
        navigation.closeDrawer();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [isOpen, navigation]);

  const handlePress = (route) => {
    // التنقل إلى الصفحة داخل MainStack مع animation
    navigation.navigate('MainStack', { 
      screen: route,
      params: { timestamp: Date.now() } // لضمان حدوث animation حتى لو كانت نفس الصفحة
    });
    setTimeout(() => navigation.closeDrawer(), 100);
  };

  return (
    <View style={styles.container}>
      {menuItems.map((item, index) => {
        const isFocused = index === focusedIndex;

        return (
          <TouchableOpacity
            key={item.route}
            ref={index === 0 ? firstItemRef : null}
            onFocus={() => setFocusedIndex(index)}
            focusable={true}
            hasTVPreferredFocus={index === 0 && isOpen}
            onPress={() => handlePress(item.route)}
            style={[styles.item, isFocused && styles.itemFocused]}
            activeOpacity={0.7}
            tvParallaxProperties={{
              enabled: true,
              shiftDistanceX: 2.0,
              shiftDistanceY: 2.0,
              tiltAngle: 0.05,
              magnification: 1.1,
              pressMagnification: 1.0,
            }}
          >
            <Text style={[styles.label, isFocused && styles.labelFocused]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
    paddingTop: 5,
    paddingHorizontal: 10,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: '#ffffffff',
    // TV Focus styles - make them stronger
    ...(Platform.isTV && {
      borderWidth: 3,
      borderColor: 'transparent',
    }),
  },
  itemFocused: {
    backgroundColor: '#1976D2',
    borderLeftWidth: 4,
    borderLeftColor: '#0D47A1',
    // Force strong focus styles for TV
    ...(Platform.isTV && {
      borderWidth: 3,
      borderColor: '#0D47A1',
      elevation: 8,
      shadowColor: '#1976D2',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.6,
      shadowRadius: 8,
      transform: [{ scale: 1.05 }],
    }),
  },
  label: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  labelFocused: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 17,
  },
});