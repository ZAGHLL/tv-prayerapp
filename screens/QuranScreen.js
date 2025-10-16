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
  Platform
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
            flatListRef.current?.scrollToIndex({ 
              index: pageIndex, 
              animated: false 
            });
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
      flatListRef.current?.scrollToIndex({ 
        index: targetIndex, 
        animated: true 
      });
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
    
    const backAction = () => {
      if (showPageInput) {
        setShowPageInput(false);
        setPageInputValue('');
        return true;
      }
      navigation.goBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
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
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    
    statusBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 70,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 20,
      zIndex: 10,
    },
    
    timeDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    timeText: {
      color: '#000',
      fontSize: 20,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    
    menuButton: {
      backgroundColor: 'rgba(46, 139, 87, 0.9)',
      borderRadius: 10,
      padding: 9,
    },

    navigationContainer: {
      position: 'absolute',
      bottom: 30,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 40,
      zIndex: 10,
    },
    
    navButton: {
      backgroundColor: 'rgba(46, 139, 87, 0.9)',
      borderRadius: 50,
      padding: 20,
      minWidth: 70,
      minHeight: 70,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    
    centerNavContainer: {
      alignItems: 'center',
      flex: 1,
      marginHorizontal: 30,
      marginBottom: '-10%'
    },
    
    goToPageButton: {
      backgroundColor: 'rgba(46, 139, 87, 0.9)',
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },
    
    goToPageText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 8,
    },

    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    
    modalContent: {
      backgroundColor: '#fff',
      borderRadius: 20,
      padding: 30,
      width: width * 0.8,
      maxWidth: 400,
      alignItems: 'center',
    },
    
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#2E8B57',
      marginBottom: 20,
      textAlign: 'center',
    },
    
    pageInput: {
      borderWidth: 2,
      borderColor: '#2E8B57',
      borderRadius: 10,
      padding: 15,
      fontSize: 18,
      textAlign: 'center',
      width: '100%',
      marginBottom: 20,
      backgroundColor: '#f9f9f9',
    },
    
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    
    modalButton: {
      flex: 1,
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginHorizontal: 10,
    },
    
    confirmButton: {
      backgroundColor: '#2E8B57',
    },
    
    cancelButton: {
      backgroundColor: '#dc3545',
    },
    
    modalButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },

    pageContainer: {
      width: width,
      height: height,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'white',
    },
    
    pageImage: {
      width: (width / 2) * 0.9,
      height: height,
    },
    
    // Portrait styles
    containerPortrait: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    
    statusBarPortrait: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 15,
      paddingTop: 10,
      zIndex: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(46, 139, 87, 0.2)',
    },
    
    portraitLayout: {
      flex: 1,
      backgroundColor: '#f5f5f5',
      paddingTop: 60,
    },
    
    titlePortrait: {
      fontSize: 22,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#2E8B57',
      marginVertical: 8,
    },
    
    pageContainerPortrait: {
      width: width,
      height: height - 100,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f9f9f9',
      paddingHorizontal: 5,
      paddingVertical: 5,
    },
    
    pageImagePortrait: {
      width: width * 0.98,
      height: (height - 1) * 1,
      backgroundColor: 'white',
      borderRadius: 8,
    },
    
    pageInfoPortrait: {
      position: 'absolute',
      bottom: 8,
      backgroundColor: 'rgba(46, 139, 87, 0.9)',
      paddingHorizontal: 20,
      paddingVertical: 6,
      borderRadius: 15,
    },
    
    pageTextPortrait: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#fff',
      textAlign: 'center',
    },
    
    goToPageButtonPortrait: {
      position: 'absolute',
      bottom: 10,
      alignSelf: 'center',
      backgroundColor: 'rgba(46, 139, 87, 0.95)',
      borderRadius: 20,
      paddingHorizontal: 15,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      zIndex: 10,
      shadowColor: '#2E8B57',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },

    goToPageTextPortrait: {
      color: '#fff',
      fontSize: 13,
      fontWeight: 'bold',
      marginLeft: 6,
    },
  }), [width, height]);

  const renderLandscapeItem = useCallback(({ item, index }) => (
    <View style={styles.pageContainer}>
      {item.map((page, i) =>
        page ? (
          <Image
            key={i}
            source={page}
            style={styles.pageImage}
            resizeMode="contain"
            fadeDuration={0}
            progressiveRenderingEnabled={true}
            cache="force-cache"
          />
        ) : null
      )}
    </View>
  ), [styles]);

  const renderPortraitItem = useCallback(({ item }) => (
    <View style={styles.pageContainerPortrait}>
      <Image
        source={item.page}
        style={styles.pageImagePortrait}
        resizeMode="contain"
        fadeDuration={0}
        progressiveRenderingEnabled={true}
        cache="force-cache"
      />
      <View style={styles.pageInfoPortrait}>
        <Text style={styles.pageTextPortrait}>صفحة {item.index}</Text>
      </View>
    </View>
  ), [styles]);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setCurrentIndex(newIndex);
      AsyncStorage.setItem('lastQuranPage', newIndex.toString());
    }
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50
  };

  const handleMenuPress = useCallback(() => {
    navigation.openDrawer();
  }, [navigation]);

  return (
    <View style={userOrientation === 'portrait' ? styles.containerPortrait : styles.container}>
      <StatusBar hidden={userOrientation === 'landscape'} />
      
      <View style={userOrientation === 'portrait' ? styles.statusBarPortrait : styles.statusBar}>
        <TouchableOpacity
          style={styles.menuButton}
          focusable={true}
          onPress={handleMenuPress}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.timeDisplay}>
          <Ionicons name="time-outline" size={20} color="#2E8B57" />
          <Text style={[styles.timeText, { color: '#2E8B57', fontSize: userOrientation === 'portrait' ? 16 : 20 }]}>
            {currentTime.toLocaleTimeString('ar-EG', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
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
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={11}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
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
          
          <TouchableOpacity 
            style={styles.goToPageButtonPortrait}
            focusable={true}
            onPress={() => setShowPageInput(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={16} color="#fff" />
            <Text style={styles.goToPageTextPortrait}>انتقل لصفحة</Text>
          </TouchableOpacity>
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
          getItemLayout={(data, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
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
          {/* زر اليمين - رجوع للصفحة السابقة */}
          <TouchableOpacity
            style={styles.navButton}
            focusable={true}
            onPress={navigateToNext}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="chevron-back"
              size={35} 
              color="#fff" 
            />
          </TouchableOpacity>

          <View style={styles.centerNavContainer}>
            <TouchableOpacity 
              style={styles.goToPageButton}
              focusable={true}
              onPress={() => setShowPageInput(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={styles.goToPageText}>انتقل لصفحة</Text>
            </TouchableOpacity>
          </View>

          {/* زر الشمال - الصفحة التالية */}
          <TouchableOpacity
            style={styles.navButton}
            focusable={true}
            onPress={navigateToPrevious}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="chevron-forward"
              size={35} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showPageInput}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPageInput(false)}
      >
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
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                focusable={true}
                onPress={() => {
                  setShowPageInput(false);
                  setPageInputValue('');
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonText}>إلغاء</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                focusable={true}
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
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}