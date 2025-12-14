import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Modal,
  Alert,
  BackHandler,
  StatusBar,
  Platform,
  Animated,
  findNodeHandle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import { quranPages } from '../assets/quranPages';

const getPagePairs = (pages) => {
  const pairs = [];
  for (let i = 0; i < pages.length; i += 2) {
    pairs.push([pages[i + 1], pages[i]].filter(Boolean));
  }
  return pairs;
};

const getSinglePages = (pages) => {
  return pages.map((page, index) => ({ page, index: index + 1 }));
};

export default function QuranScreen() {
  const navigation = useNavigation();
  const [userOrientation, setUserOrientation] = useState('portrait');
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPageInput, setShowPageInput] = useState(false);
  const [pageInputValue, setPageInputValue] = useState('');
  const flatListRef = useRef(null);
  
  // TV Focus Management - Refs
  const menuButtonRef = useRef(null);
  const prevButtonRef = useRef(null);
  const nextButtonRef = useRef(null);
  const goToPageButtonRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const cancelButtonRef = useRef(null);
  
  // Animated values for smooth focus transitions
  const menuScale = useRef(new Animated.Value(1)).current;
  const prevScale = useRef(new Animated.Value(1)).current;
  const nextScale = useRef(new Animated.Value(1)).current;
  const goToPageScale = useRef(new Animated.Value(1)).current;
  const confirmScale = useRef(new Animated.Value(1)).current;
  const cancelScale = useRef(new Animated.Value(1)).current;
  
  const [focusedButton, setFocusedButton] = useState(null);

  // ==================== SETUP TV FOCUS NAVIGATION ====================
  useEffect(() => {
    const timer = setTimeout(() => {
      const menuHandle = findNodeHandle(menuButtonRef.current);
      const prevHandle = findNodeHandle(prevButtonRef.current);
      const nextHandle = findNodeHandle(nextButtonRef.current);
      const goToPageHandle = findNodeHandle(goToPageButtonRef.current);
      const confirmHandle = findNodeHandle(confirmButtonRef.current);
      const cancelHandle = findNodeHandle(cancelButtonRef.current);

      // ✅ Menu Button Navigation
      if (menuButtonRef.current && goToPageHandle) {
        menuButtonRef.current.setNativeProps({
          nextFocusDown: goToPageHandle,
          nextFocusRight: goToPageHandle,
        });
      }

      // ✅ Portrait Mode: Navigation Buttons
      if (userOrientation === 'portrait') {
        if (goToPageButtonRef.current && menuHandle && prevHandle && nextHandle) {
          goToPageButtonRef.current.setNativeProps({
            nextFocusUp: menuHandle,
            nextFocusLeft: prevHandle,
            nextFocusRight: nextHandle,
          });
        }

        if (prevButtonRef.current && goToPageHandle && nextHandle) {
          prevButtonRef.current.setNativeProps({
            nextFocusRight: goToPageHandle,
            nextFocusUp: menuHandle,
          });
        }

        if (nextButtonRef.current && goToPageHandle && prevHandle) {
          nextButtonRef.current.setNativeProps({
            nextFocusLeft: goToPageHandle,
            nextFocusUp: menuHandle,
          });
        }
      }

      // ✅ Landscape Mode: Navigation Buttons
      if (userOrientation === 'landscape') {
        if (prevButtonRef.current && goToPageHandle && menuHandle) {
          prevButtonRef.current.setNativeProps({
            nextFocusRight: goToPageHandle,
            nextFocusUp: menuHandle,
          });
        }

        if (goToPageButtonRef.current && prevHandle && nextHandle && menuHandle) {
          goToPageButtonRef.current.setNativeProps({
            nextFocusLeft: prevHandle,
            nextFocusRight: nextHandle,
            nextFocusUp: menuHandle,
          });
        }

        if (nextButtonRef.current && goToPageHandle && menuHandle) {
          nextButtonRef.current.setNativeProps({
            nextFocusLeft: goToPageHandle,
            nextFocusUp: menuHandle,
          });
        }
      }

      // ✅ Modal Buttons Navigation
      if (cancelButtonRef.current && confirmHandle) {
        cancelButtonRef.current.setNativeProps({
          nextFocusRight: confirmHandle,
        });
      }

      if (confirmButtonRef.current && cancelHandle) {
        confirmButtonRef.current.setNativeProps({
          nextFocusLeft: cancelHandle,
        });
      }

      console.log('✅ Quran TV Focus Navigation configured');
    }, 150);

    return () => clearTimeout(timer);
  }, [userOrientation, showPageInput]);

  // ==================== BACK BUTTON HANDLER ====================
  useEffect(() => {
    const handleBackPress = () => {
      if (showPageInput) {
        setShowPageInput(false);
        setPageInputValue('');
        return true;
      }
      
      if (focusedButton === 'menu') {
        return false;
      }
      
      if (menuButtonRef.current) {
        menuButtonRef.current.focus();
        setFocusedButton('menu');
      }
      return true;
    };

    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => backHandler.remove();
    }
  }, [focusedButton, showPageInput]);

  const animateFocus = useCallback((scale, isFocused) => {
    Animated.spring(scale, {
      toValue: isFocused ? 1.15 : 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleFocus = useCallback((buttonName, scale) => {
    setFocusedButton(buttonName);
    animateFocus(scale, true);
  }, [animateFocus]);

  const handleBlur = useCallback((scale) => {
    animateFocus(scale, false);
  }, [animateFocus]);

  const pagePairs = useMemo(() => getPagePairs(quranPages), []);
  const singlePages = useMemo(() => getSinglePages(quranPages), []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadLastPage = async () => {
      try {
        const savedPage = await AsyncStorage.getItem('lastQuranPage');
        if (savedPage) {
          const pageIndex = parseInt(savedPage);
          setCurrentIndex(pageIndex);
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: pageIndex, animated: false });
          }, 100);
        }
      } catch (error) {
        console.log('Error loading last page:', error);
      }
    };
    loadLastPage();
  }, []);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
    });
    return () => subscription?.remove();
  }, []);

  const { width, height } = screenData;

  const navigateToNext = useCallback(() => {
    const maxIndex = userOrientation === 'portrait' ? singlePages.length - 1 : pagePairs.length - 1;
    const nextIndex = Math.min(currentIndex + 1, maxIndex);
    if (nextIndex !== currentIndex) {
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }
  }, [currentIndex, userOrientation, singlePages.length, pagePairs.length]);

  const navigateToPrevious = useCallback(() => {
    const prevIndex = Math.max(currentIndex - 1, 0);
    if (prevIndex !== currentIndex) {
      setCurrentIndex(prevIndex);
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
    }
  }, [currentIndex]);

  const goToPage = useCallback((pageNumber) => {
    const totalPages = quranPages.length;
    if (pageNumber < 1 || pageNumber > totalPages) {
      Alert.alert('خطأ', `رقم الصفحة يجب أن يكون بين 1 و ${totalPages}`);
      return;
    }
    let targetIndex;
    if (userOrientation === 'portrait') {
      targetIndex = pageNumber - 1;
    } else {
      targetIndex = Math.floor((pageNumber - 1) / 2);
    }
    setCurrentIndex(targetIndex);
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: targetIndex, animated: true });
    }, 100);
    setShowPageInput(false);
    setPageInputValue('');
  }, [userOrientation, quranPages.length]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      switch (event.key || event.keyCode) {
        case 'ArrowRight':
        case 39:
          event.preventDefault();
          navigateToPrevious();
          break;
        case 'ArrowLeft':
        case 37:
          event.preventDefault();
          navigateToNext();
          break;
        case 'Escape':
        case 27:
          if (showPageInput) {
            setShowPageInput(false);
            setPageInputValue('');
          } else {
            navigation.goBack();
          }
          break;
      }
    };

    if (Platform.OS === 'web') {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [navigateToNext, navigateToPrevious, navigation, showPageInput]);

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
      const interval = setInterval(async () => {
        try {
          const currentOrientation = await AsyncStorage.getItem('userOrientation');
          if (currentOrientation !== userOrientation) {
            setUserOrientation(currentOrientation || 'landscape');
          }
        } catch (error) {
          console.log('Error checking orientation:', error);
        }
      }, 2000);
      return () => clearInterval(interval);
    }, [userOrientation])
  );

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    statusBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, zIndex: 10 },
    timeDisplay: { flexDirection: 'row', alignItems: 'center' },
    timeText: { color: '#000', fontSize: 20, fontWeight: 'bold', marginLeft: 8 },
    menuButton: { backgroundColor: 'rgba(46, 139, 87, 0.9)', borderRadius: 8, padding: 5, borderWidth: 2, borderColor: 'transparent' },
    navigationContainer: { position: 'absolute', bottom: 30, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 40, zIndex: 10 },
    navButton: { backgroundColor: 'rgba(46, 139, 87, 0.9)', borderRadius: 50, padding: 20, minWidth: 70, minHeight: 70, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, borderWidth: 2, borderColor: 'transparent' },
    centerNavContainer: { alignItems: 'center', flex: 1, marginHorizontal: 30, marginBottom: '-10%' },
    goToPageButton: { backgroundColor: 'rgba(46, 139, 87, 0.9)', borderRadius: 30, paddingHorizontal: 25, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    goToPageText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.85)' },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 30, width: width * 0.85, maxWidth: 450, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
    modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#2E8B57', marginBottom: 25, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif' },
    pageInput: { borderWidth: 3, borderColor: '#2E8B57', borderRadius: 15, padding: 18, fontSize: 20, textAlign: 'center', width: '100%', marginBottom: 25, backgroundColor: '#f9f9f9', fontWeight: '600' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 15 },
    modalButton: { flex: 1, padding: 10, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', minHeight: 60 },
    confirmButton: { backgroundColor: '#2E8B57' },
    cancelButton: { backgroundColor: '#dc3545' },
    modalButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    pageContainer: { width: width, height: height, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
    pageImage: { width: (width / 2) * 0.9, height: height },
    containerPortrait: { flex: 1, backgroundColor: '#f5f5f5' },
    statusBarPortrait: { position: 'absolute', top: 0, left: 0, right: 0, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingTop: 10, zIndex: 10, backgroundColor: 'rgba(255, 255, 255, 0.95)', borderBottomWidth: 1, borderBottomColor: 'rgba(46, 139, 87, 0.2)' },
    portraitLayout: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.95)', paddingTop: 60 },
    pageContainerPortrait: { width: width, height: height - 100, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9', paddingHorizontal: 5, paddingVertical: 5 },
    pageImagePortrait: { width: width * 0.98, height: (height - 1) * 1, backgroundColor: 'white', borderRadius: 8 },
    navigationContainerPortrait: { position: 'absolute', bottom: 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, zIndex: 10 },
    navButtonPortrait: { backgroundColor: 'rgba(46, 139, 87, 0.95)', borderRadius: 30, padding: 10, minWidth: 50, minHeight: 50, justifyContent: 'center', alignItems: 'center', shadowColor: '#2E8B57', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 8, borderWidth: 2, borderColor: 'transparent' },
    goToPageButtonPortrait: { backgroundColor: 'rgba(46, 139, 87, 0.95)', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#2E8B57', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 8, borderWidth: 2, borderColor: 'transparent' },
    goToPageTextPortrait: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginLeft: 6 },
    menuButtonPortrait: { backgroundColor: 'rgba(46, 139, 87, 0.9)', borderRadius: 8, padding: 5, borderWidth: 2, borderColor: 'transparent' },
    tvFocusedButton: { borderColor: '#2E8B57', borderWidth: 3, elevation: 12, backgroundColor: 'rgba(46, 139, 87, 0.8)', transform: [{ scale: 1.05 }] },
  }), [width, height]);

  const renderLandscapeItem = useCallback(({ item }) => (
    <View style={styles.pageContainer}>
      {item.map((page, i) => page ? (
        <Image key={i} source={page} style={styles.pageImage} resizeMode="contain" fadeDuration={0} progressiveRenderingEnabled={true} cache="force-cache" />
      ) : null)}
    </View>
  ), [styles]);

  const renderPortraitItem = useCallback(({ item }) => (
    <View style={styles.pageContainerPortrait}>
      <Image source={item.page} style={styles.pageImagePortrait} resizeMode="contain" fadeDuration={0} progressiveRenderingEnabled={true} cache="force-cache" />
    </View>
  ), [styles]);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setCurrentIndex(newIndex);
      AsyncStorage.setItem('lastQuranPage', newIndex.toString());
    }
  }, []);

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };
  const handleMenuPress = useCallback(() => { navigation.openDrawer(); }, [navigation]);

  return (
    <View style={userOrientation === 'portrait' ? styles.containerPortrait : styles.container}>
      <StatusBar hidden={userOrientation === 'landscape'} />
      
      <View style={userOrientation === 'portrait' ? styles.statusBarPortrait : styles.statusBar}>
        <Animated.View style={{ transform: [{ scale: menuScale }] }}>
          <TouchableOpacity
            ref={menuButtonRef}
            style={[userOrientation === 'portrait' ? styles.menuButtonPortrait : styles.menuButton, focusedButton === 'menu' && styles.tvFocusedButton]}
            focusable={true}
            hasTVPreferredFocus={true}
            onFocus={() => handleFocus('menu', menuScale)}
            onBlur={() => handleBlur(menuScale)}
            onPress={handleMenuPress}
            activeOpacity={0.7}
          >
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.timeDisplay}>
          <Ionicons name="time-outline" size={20} color="#2E8B57" />
          <Text style={[styles.timeText, { color: '#2E8B57', fontSize: userOrientation === 'portrait' ? 16 : 20 }]}>
            {currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </Text>
        </View>
      </View>

      {userOrientation === 'portrait' ? (
        <View style={styles.portraitLayout}>
          <FlatList
            ref={flatListRef}
            data={singlePages}
            renderItem={renderPortraitItem}
            keyExtractor={(item) => `page-${item.index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={7}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
            decelerationRate="fast"
            snapToInterval={width}
            snapToAlignment="center"
            inverted
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            scrollEventThrottle={16}
            bounces={false}
            overScrollMode="never"
            legacyImplementation={false}
            disableIntervalMomentum={true}
          />
          
          {/* أزرار التنقل في وضع Portrait */}
          <View style={styles.navigationContainerPortrait}>
            {/* زر اليمين - الصفحة السابقة */}
            <Animated.View style={{ transform: [{ scale: prevScale }] }}>
              <TouchableOpacity
                ref={prevButtonRef}
                style={[styles.navButtonPortrait, focusedButton === 'prev' && styles.tvFocusedButton]}
                focusable={true}
                onFocus={() => handleFocus('prev', prevScale)}
                onBlur={() => handleBlur(prevScale)}
                onPress={navigateToNext}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
            </Animated.View>

            {/* زر الانتقال لصفحة */}
            <Animated.View style={{ transform: [{ scale: goToPageScale }] }}>
              <TouchableOpacity 
                ref={goToPageButtonRef}
                style={[styles.goToPageButtonPortrait, focusedButton === 'goToPage' && styles.tvFocusedButton]}
                focusable={true}
                onFocus={() => handleFocus('goToPage', goToPageScale)}
                onBlur={() => handleBlur(goToPageScale)}
                onPress={() => setShowPageInput(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="search" size={16} color="#fff" />
                <Text style={styles.goToPageTextPortrait}>انتقل لصفحة</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* زر الشمال - الصفحة التالية */}
            <Animated.View style={{ transform: [{ scale: nextScale }] }}>
              <TouchableOpacity
                ref={nextButtonRef}
                style={[styles.navButtonPortrait, focusedButton === 'next' && styles.tvFocusedButton]}
                focusable={true}
                onFocus={() => handleFocus('next', nextScale)}
                onBlur={() => handleBlur(nextScale)}
                onPress={navigateToPrevious}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={pagePairs}
          renderItem={renderLandscapeItem}
          keyExtractor={(_, index) => `pair-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={7}
          removeClippedSubviews={true}
          getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
          decelerationRate="fast"
          snapToInterval={width}
          snapToAlignment="center"
          inverted
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          scrollEventThrottle={16}
          bounces={false}
          overScrollMode="never"
          legacyImplementation={false}
          disableIntervalMomentum={true}
        />
      )}

      {userOrientation === 'landscape' && (
        <View style={styles.navigationContainer}>
          <Animated.View style={{ transform: [{ scale: prevScale }] }}>
            <TouchableOpacity
              ref={prevButtonRef}
              style={[styles.navButton, focusedButton === 'prev' && styles.tvFocusedButton]}
              focusable={true}
              onFocus={() => handleFocus('prev', prevScale)}
              onBlur={() => handleBlur(prevScale)}
              onPress={navigateToNext}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={35} color="#fff" />
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.centerNavContainer}>
            <Animated.View style={{ transform: [{ scale: goToPageScale }] }}>
              <TouchableOpacity 
                ref={goToPageButtonRef}
                style={[styles.goToPageButton, focusedButton === 'goToPage' && styles.tvFocusedButton]}
                focusable={true}
                onFocus={() => handleFocus('goToPage', goToPageScale)}
                onBlur={() => handleBlur(goToPageScale)}
                onPress={() => setShowPageInput(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="search" size={18} color="#fff" />
                <Text style={styles.goToPageText}>انتقل لصفحة</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Animated.View style={{ transform: [{ scale: nextScale }] }}>
            <TouchableOpacity
              ref={nextButtonRef}
              style={[styles.navButton, focusedButton === 'next' && styles.tvFocusedButton]}
              focusable={true}
              onFocus={() => handleFocus('next', nextScale)}
              onBlur={() => handleBlur(nextScale)}
              onPress={navigateToPrevious}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={35} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      <Modal visible={showPageInput} transparent={true} animationType="fade" onRequestClose={() => setShowPageInput(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>انتقل إلى صفحة</Text>
            
            <TextInput
              style={styles.pageInput}
              value={pageInputValue}
              onChangeText={setPageInputValue}
              placeholder={`أدخل رقم الصفحة (1 - ${quranPages.length})`}
              keyboardType="numeric"
              maxLength={3}
              autoFocus={true}
              selectTextOnFocus={true}
              onSubmitEditing={() => {
                const pageNum = parseInt(pageInputValue);
                if (pageNum && pageNum >= 1 && pageNum <= quranPages.length) {
                  goToPage(pageNum);
                } else {
                  Alert.alert('خطأ', `رقم الصفحة يجب أن يكون بين 1 و ${quranPages.length}`);
                }
              }}
            />
            
            <View style={styles.modalButtons}>
              <Animated.View style={{ flex: 1, transform: [{ scale: cancelScale }] }}>
                <TouchableOpacity
                  ref={cancelButtonRef}
                  style={[styles.modalButton, styles.cancelButton, focusedButton === 'cancel' && styles.tvFocusedButton]}
                  focusable={true}
                  hasTVPreferredFocus={showPageInput}
                  onFocus={() => handleFocus('cancel', cancelScale)}
                  onBlur={() => handleBlur(cancelScale)}
                  onPress={() => { setShowPageInput(false); setPageInputValue(''); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonText}>إلغاء</Text>
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View style={{ flex: 1, transform: [{ scale: confirmScale }] }}>
                <TouchableOpacity
                  ref={confirmButtonRef}
                  style={[styles.modalButton, styles.confirmButton, focusedButton === 'confirm' && styles.tvFocusedButton]}
                  focusable={true}
                  onFocus={() => handleFocus('confirm', confirmScale)}
                  onBlur={() => handleBlur(confirmScale)}
                  onPress={() => {
                    const pageNum = parseInt(pageInputValue);
                    if (pageNum && pageNum >= 1 && pageNum <= quranPages.length) {
                      goToPage(pageNum);
                    } else {
                      Alert.alert('خطأ', `رقم الصفحة يجب أن يكون بين 1 و ${quranPages.length}`);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonText}>انتقل</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}