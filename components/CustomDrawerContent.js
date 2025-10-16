import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  BackHandler,
  AppState,
} from 'react-native';
import { useTVRemote } from '../hooks/useTVRemote';

const { height } = Dimensions.get('window');

export default function CustomDrawerContent({ navigation, state }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsRefs = useRef([]);

  const screens = [
    { name: 'PrayerTimes', label: 'أوقات الصلاة' },
    { name: 'azkar', label: 'الأذكار' },
    { name: 'quran', label: 'القرآن الكريم' },
    { name: 'makkah live', label: 'مكة مباشر' },
    { name: 'madina live', label: 'المدينة مباشر' },
    { name: 'setting', label: 'الإعدادات' },
  ];

  useTVRemote({
    onBack: () => {
      console.log('🎮 Closing drawer');
      navigation.closeDrawer();
    },
  });

  useEffect(() => {
    const handleKeyEvent = (keyCode) => {
      console.log('🔘 Key pressed:', keyCode);

      if (keyCode === 20) { // KEY_DOWN
        console.log(`⬇️ DOWN: ${currentIndex} -> ${currentIndex + 1}`);
        if (currentIndex < screens.length - 1) {
          const newIndex = currentIndex + 1;
          setCurrentIndex(newIndex);
        }
      } else if (keyCode === 19) { // KEY_UP
        console.log(`⬆️ UP: ${currentIndex} -> ${currentIndex - 1}`);
        if (currentIndex > 0) {
          const newIndex = currentIndex - 1;
          setCurrentIndex(newIndex);
        }
      } else if (keyCode === 23) { // KEY_CENTER / OK
        console.log(`✅ SELECT at index ${currentIndex}`);
        handlePress(screens[currentIndex].name, currentIndex);
      }
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('🎮 Back pressed');
      navigation.closeDrawer();
      return true;
    });

    return subscription.remove;
  }, [currentIndex, screens, navigation]);

  const handlePress = (screenName, index) => {
    console.log(`🎮 [${index}] Navigating to:`, screenName);
    navigation.navigate(screenName);
    setTimeout(() => navigation.closeDrawer(), 150);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAccent} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerMainTitle}>Simple</Text>
            <Text style={styles.headerSubTitle}>Sidebar Menu</Text>
          </View>
        </View>
      </View> */}

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {screens.map((screen, index) => {
          const hasFocus = index === currentIndex;

          return (
            <TouchableOpacity
              key={screen.name}
              ref={(ref) => {
                itemsRefs.current[index] = ref;
                if (hasFocus && ref) {
                  try {
                    ref.setNativeProps({
                      hasTVPreferredFocus: true,
                    });
                  } catch (e) {
                    console.log('Error setting native props:', e);
                  }
                }
              }}
              onPress={() => handlePress(screen.name, index)}
              focusable={true}
              hasTVPreferredFocus={index === 0}
              onFocus={() => {
                console.log(`✅ FOCUS [${index}]: ${screen.label}`);
                setCurrentIndex(index);
              }}
              onBlur={() => {
                console.log(`❌ BLUR [${index}]: ${screen.label}`);
              }}
              style={[
                styles.menuItem,
                hasFocus && styles.menuItemFocused,
              ]}
            >
              {hasFocus && <View style={styles.menuItemAccent} />}
              
              <View style={styles.menuItemContent}>
                <View style={[
                  styles.menuItemDot,
                  hasFocus && styles.menuItemDotActive
                ]} />
                <Text
                  style={[
                    styles.menuItemText,
                    hasFocus && styles.menuItemTextActive,
                  ]}
                >
                  {screen.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerAccent: {
    width: 5,
    height: 48,
    backgroundColor: '#2E8B57',
    borderRadius: 3,
    marginRight: 12,
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  headerMainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a73e8',
    lineHeight: 32,
  },
  headerSubTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginTop: 2,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  menuItem: {
    marginVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    height: 56,
  },
  menuItemFocused: {
    backgroundColor: '#f0f8f5',
    borderColor: '#2E8B57',
    borderWidth: 2,
    shadowColor: '#2E8B57',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  menuItemAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#2E8B57',
  },
  menuItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  menuItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  menuItemDotActive: {
    backgroundColor: '#2E8B57',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    flex: 1,
  },
  menuItemTextActive: {
    color: '#2E8B57',
    fontWeight: '700',
    fontSize: 17,
  },
});