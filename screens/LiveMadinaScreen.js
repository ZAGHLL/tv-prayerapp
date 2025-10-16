// LiveMadinahScreen.js
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Dimensions, Alert, StatusBar, Animated, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';

// YouTube API Configuration
const YOUTUBE_API_KEY = 'AIzaSyA6qaTGFnma5wpDm0WYm5I-j_FRPwXlb0c'; // ضع مفتاح API الخاص بك هنا

// استعلامات البحث المخصصة للحرم النبوي الشريف
const SEARCH_QUERIES = [
  'المدينة المنورة مباشر',
  'الحرم النبوي مباشر', 
  'Madinah live',
  'Prophet Mosque live stream',
  'Masjid An Nabawi live',
  'المدينة بث مباشر',
  'الروضة الشريفة مباشر',
  'حرم نبوي مباشر',
  'Medina live stream',
  'Al Masjid An Nabawi live'
];

// معرفات القنوات المتخصصة في بث الحرم النبوي
const CHANNEL_IDS = [
  'UCos52hTKaEQNNmOaHe7s6Ig', // Saudi TV
  'UC4EJ2ZetjT1c_0XEoANKzDQ', // Haramain Live
  'UC80RgBePRQKsHUONd9fhJ0A', // Islam Channel
  'UCXZamCXhKhSQ5z8-dHpOAKQ', // Live Makkah HD
  'UCTG5DM_S1Jhj0wOzTRr0lXA', // Al-Salam Channel
  'UCYV_29xxGZJIhTlWJMUqJ0g', // Al Jazeera Mubasher
  'UCIbREOVFBCpQqnpX7pMhxJw', // Saudi Broadcasting
];

export default function LiveMadinahScreen() {
  const navigation = useNavigation();
  const webViewRef = useRef(null);
  const [userOrientation, setUserOrientation] = useState('portrait');
  const [currentVideoId, setCurrentVideoId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Function to find current live stream from Madinah
  const findLiveStream = async () => {
    setIsLoading(true);
    setError(null);
    setCurrentVideoId(null);
    
    try {
      // البحث المتوازي في جميع الاستعلامات للحصول على أسرع النتائج
      const searchPromises = SEARCH_QUERIES.map(async (query) => {
        try {
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&eventType=live&maxResults=15&order=relevance&key=${YOUTUBE_API_KEY}`
          );
          
          if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
          }
          
          const data = await response.json();
          return data.items || [];
        } catch (error) {
          console.log(`Search failed for "${query}":`, error);
          return [];
        }
      });

      // البحث في القنوات المحددة أيضاً
      const channelPromises = CHANNEL_IDS.map(async (channelId) => {
        try {
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=live&maxResults=10&order=date&key=${YOUTUBE_API_KEY}`
          );
          
          if (!response.ok) {
            throw new Error(`Channel API Error: ${response.status}`);
          }
          
          const data = await response.json();
          return data.items || [];
        } catch (error) {
          console.log(`Channel search failed for ${channelId}:`, error);
          return [];
        }
      });

      // تنفيذ جميع البحوث بشكل متوازي
      const [searchResults, channelResults] = await Promise.all([
        Promise.all(searchPromises),
        Promise.all(channelPromises)
      ]);

      // دمج جميع النتائج
      const allVideos = [
        ...searchResults.flat(),
        ...channelResults.flat()
      ];

      if (allVideos.length === 0) {
        throw new Error('لا يتوفر بث مباشر من الحرم النبوي حالياً');
      }

      // تصفية الفيديوهات للحصول على المرتبطة بالحرم النبوي
      const madinahVideos = allVideos.filter(item => {
        const title = item.snippet.title.toLowerCase();
        const description = item.snippet.description.toLowerCase();
        const channelTitle = item.snippet.channelTitle.toLowerCase();
        
        // كلمات مفتاحية للبحث عن فيديوهات الحرم النبوي
        const keywords = [
          'مدينة', 'المدينة المنورة', 'حرم نبوي', 'النبوي', 'الروضة', 'روضة', 
          'madinah', 'medina', 'nabawi', 'prophet mosque', 'masjid an nabawi', 
          'al masjid an nabawi', 'المسجد النبوي', 'haramain', 'saudi', 'السعودية'
        ];
        
        return keywords.some(keyword => 
          title.includes(keyword) || 
          description.includes(keyword) || 
          channelTitle.includes(keyword)
        );
      });

      // إذا لم نجد فيديوهات مطابقة، استخدم أول فيديو متاح
      const targetVideos = madinahVideos.length > 0 ? madinahVideos : allVideos;

      // ترتيب الفيديوهات حسب الأولوية
      const sortedVideos = targetVideos.sort((a, b) => {
        const aTitle = a.snippet.title.toLowerCase();
        const bTitle = b.snippet.title.toLowerCase();
        
        // إعطاء أولوية للفيديوهات بالعربية
        const aArabic = /[\u0600-\u06FF]/.test(aTitle);
        const bArabic = /[\u0600-\u06FF]/.test(bTitle);
        
        if (aArabic && !bArabic) return -1;
        if (!aArabic && bArabic) return 1;
        
        // إعطاء أولوية للكلمات المفتاحية المهمة
        const priorityKeywords = ['مدينة', 'حرم نبوي', 'نبوي', 'madinah', 'nabawi'];
        const aPriority = priorityKeywords.some(k => aTitle.includes(k));
        const bPriority = priorityKeywords.some(k => bTitle.includes(k));
        
        if (aPriority && !bPriority) return -1;
        if (!aPriority && bPriority) return 1;
        
        return 0;
      });

      // التحقق من أن الفيديو الأول متاح وحالياً مبثوث مباشر
      const bestVideo = sortedVideos[0];
      const isLive = await verifyVideoIsLive(bestVideo.id.videoId);
      
      if (isLive) {
        setCurrentVideoId(bestVideo.id.videoId);
        console.log('Selected live stream:', bestVideo.snippet.title);
      } else {
        // جرب الفيديوهات الأخرى
        for (let i = 1; i < Math.min(sortedVideos.length, 5); i++) {
          const videoIsLive = await verifyVideoIsLive(sortedVideos[i].id.videoId);
          if (videoIsLive) {
            setCurrentVideoId(sortedVideos[i].id.videoId);
            console.log('Selected live stream:', sortedVideos[i].snippet.title);
            break;
          }
        }
        
        if (!currentVideoId) {
          throw new Error('لا يتوفر بث مباشر نشط حالياً');
        }
      }

    } catch (error) {
      console.error('Error finding live stream:', error);
      setError(error.message || 'حدث خطأ في البحث عن البث المباشر');
    } finally {
      setIsLoading(false);
    }
  };

  // التحقق من أن الفيديو مازال مبثوث مباشر
  const verifyVideoIsLive = async (videoId) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
      );
      
      if (!response.ok) return false;
      
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const video = data.items[0];
        return video.snippet.liveBroadcastContent === 'live';
      }
      
      return false;
    } catch (error) {
      console.error('Error verifying video status:', error);
      return true; // إذا فشل التحقق، اعتبر الفيديو متاح
    }
  };

  // تفعيل وضع ملء الشاشة
  const toggleFullscreen = async () => {
    try {
      if (isFullscreen) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setIsFullscreen(false);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setIsFullscreen(true);
      }
    } catch (error) {
      console.log('Error toggling fullscreen:', error);
    }
  };

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
      
      // بدء البحث فوراً عند تحميل الصفحة
      findLiveStream();
      
    }, [])
  );

  // JavaScript محسن للتشغيل التلقائي للصوت ووضع ملء الشاشة
  const injectedJavaScript = `
    (function() {
      function setupVideo() {
        var video = document.querySelector('video');
        var iframe = document.querySelector('iframe');
        
        if (video) {
          // تشغيل الصوت فوراً
          video.muted = false;
          video.volume = 1;
          video.autoplay = true;
          
          // جعل الفيديو يملأ الشاشة
          video.style.position = 'fixed';
          video.style.top = '0';
          video.style.left = '0';
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = 'cover';
          video.style.zIndex = '9999';
          
          // إجبار تشغيل الفيديو
          var playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('Video playing successfully with sound');
            }).catch(error => {
              console.log('Autoplay failed, trying to unmute:', error);
              video.muted = false;
              video.play();
            });
          }
        }
        
        // إخفاء عناصر YouTube الإضافية للحصول على تجربة ملء الشاشة
        var elementsToHide = [
          '.ytp-chrome-top',
          '.ytp-chrome-bottom',
          '.ytp-title',
          '.ytp-watermark',
          '.ytp-gradient-top',
          '.ytp-gradient-bottom'
        ];
        
        elementsToHide.forEach(selector => {
          var elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (el) el.style.display = 'none';
          });
        });

        // جعل الخلفية سوداء
        document.body.style.backgroundColor = '#000';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';
      }
      
      // محاولة فورية
      setupVideo();
      
      // مراقبة التغييرات في الصفحة
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes.length) {
            setupVideo();
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // محاولات إضافية للتأكد من التشغيل
      setTimeout(setupVideo, 500);
      setTimeout(setupVideo, 1000);
      setTimeout(setupVideo, 2000);
      
      // التعامل مع أحداث النقر لإجبار التشغيل
      document.addEventListener('click', function() {
        var video = document.querySelector('video');
        if (video) {
          video.muted = false;
          video.play();
        }
      });
      
      // التعامل مع أحداث اللمس على الأجهزة المحمولة
      document.addEventListener('touchstart', function() {
        var video = document.querySelector('video');
        if (video) {
          video.muted = false;
          video.play();
        }
      });

    })();
  `;

  if (Platform.OS === 'web') {
    return (
      <View style={userOrientation === 'portrait' ? styles.containerPortrait : styles.container}>
        <Text style={styles.fallbackText}>
          Live streaming is not supported on web platform
        </Text>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={[userOrientation === 'portrait' ? styles.containerPortrait : styles.container, styles.centerContent]}>
        {userOrientation === 'portrait' && (
          <View style={styles.headerPortrait}>
            <TouchableOpacity
              style={styles.menuButtonPortrait}
              focusable={true}
              onPress={() => navigation.openDrawer()}
            >
              <Ionicons name="menu" size={32} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.titlePortrait}>البث المباشر من الحرم النبوي</Text>
          </View>
        )}
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2E8B57" />
          <Text style={styles.loadingText}>جاري البحث عن البث المباشر...</Text>
          <Text style={styles.subLoadingText}>يرجى الانتظار قليلاً</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[userOrientation === 'portrait' ? styles.containerPortrait : styles.container, styles.centerContent]}>
        {userOrientation === 'portrait' && (
          <View style={styles.headerPortrait}>
            <TouchableOpacity
              style={styles.menuButtonPortrait}
              focusable={true}
              onPress={() => navigation.openDrawer()}
            >
              <Ionicons name="menu" size={32} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.titlePortrait}>البث المباشر من الحرم النبوي</Text>
          </View>
        )}
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={50} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton}
          focusable={true}
          onPress={findLiveStream}>
            <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.retryButtonText}>البحث مرة أخرى</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={userOrientation === 'portrait' ? styles.containerPortrait : styles.container}>
      {userOrientation === 'portrait' && (
        <View style={styles.headerPortrait}>
          <TouchableOpacity
            style={styles.menuButtonPortrait}
            focusable={true}
            onPress={() => navigation.openDrawer()}
          >
            <Ionicons name="menu" size={32} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.titlePortrait}>البث المباشر من الحرم النبوي</Text>
          <TouchableOpacity
            style={styles.refreshButtonPortrait}
            focusable={true}
            onPress={findLiveStream}
          >
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <View style={userOrientation === 'portrait' ? styles.menuButtonContainerPortrait : styles.menuButtonContainer}>
        {userOrientation === 'landscape' && (
          <>
            <TouchableOpacity
            focusable={true}
            onPress={() => navigation.openDrawer()}>
              <Ionicons 
                name="menu" 
                size={32} 
                color="#fff" 
                style={styles.menuButton}
              />
            </TouchableOpacity>
            <TouchableOpacity 
            focusable={true}
            onPress={findLiveStream} style={styles.refreshButtonLandscape}>
              <Ionicons 
                name="refresh" 
                size={28} 
                color="#fff" 
                style={styles.menuButton}
              />
            </TouchableOpacity>
            <TouchableOpacity
            focusable={true}
            onPress={toggleFullscreen} style={styles.fullscreenButtonLandscape}>
              <Ionicons 
                name={isFullscreen ? "contract" : "expand"} 
                size={28} 
                color="#fff" 
                style={styles.menuButton}
              />
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={userOrientation === 'portrait' ? styles.videoContainerPortrait : styles.videoContainer}>
        {currentVideoId && (
          <WebView
            ref={webViewRef}
            source={{ 
              uri: `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&mute=0&enablejsapi=1&playsinline=0&loop=0&rel=0&modestbranding=1&controls=1&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=1`
            }}
            style={styles.webview}
            injectedJavaScript={injectedJavaScript}
            allowsFullscreenVideo={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            allowsInlineMediaPlayback={false}
            allowsProtectedMedia={true}
            scalesPageToFit={true}
            onLoad={() => {
              // تشغيل JavaScript فوراً بعد التحميل
              setTimeout(() => {
                webViewRef.current?.injectJavaScript(injectedJavaScript);
              }, 100);
            }}
            onLoadStart={() => {
              // تحسين الأداء
            }}
            onLoadEnd={() => {
              // تشغيل الفيديو وتفعيل الصوت
              setTimeout(() => {
                webViewRef.current?.injectJavaScript(injectedJavaScript);
              }, 300);
              setTimeout(() => {
                webViewRef.current?.injectJavaScript(`
                  var video = document.querySelector('video');
                  if (video) {
                    video.muted = false;
                    video.volume = 1;
                    video.play();
                  }
                `);
              }, 1000);
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              setError('حدث خطأ في تحميل البث المباشر');
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView HTTP error: ', nativeEvent);
            }}
            onMessage={(event) => {
              console.log('WebView message:', event.nativeEvent.data);
            }}
          />
        )}
      </View>

      {userOrientation === 'portrait' && (
        <>
          
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Landscape styles
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  menuButtonContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 25,
    padding: 8,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  menuButton: {
    padding: 8,
  },
  refreshButtonLandscape: {
    marginLeft: 10,
  },
  fullscreenButtonLandscape: {
    marginLeft: 10,
  },
  videoContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  fallbackText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
    padding: 20,
  },
  // Portrait styles
  containerPortrait: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerPortrait: {
    backgroundColor: '#2E8B57',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuButtonPortrait: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    marginRight: 15,
  },
  titlePortrait: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  refreshButtonPortrait: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    marginLeft: 15,
  },
  menuButtonContainerPortrait: {
    // Empty for portrait - menu button is in header
  },
  videoContainerPortrait: {
    flex: 1,
    margin: 15,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: '55%',
  },
  fullscreenButtonPortrait: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fullscreenButtonText: {
    color: '#2E8B57',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoContainerPortrait: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTextPortrait: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E8B57',
    textAlign: 'center',
    marginBottom: 8,
  },
  descriptionPortrait: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Loading and error states
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#2E8B57',
    marginTop: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subLoadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    marginTop: 15,
    marginBottom: 25,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#2E8B57',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});