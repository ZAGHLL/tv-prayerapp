// LiveMadinaScreen.js - ✅ FIXED ZOOM + BUFFERING + AUDIO ISSUES
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  ActivityIndicator, 
  StatusBar, 
  Platform,
  findNodeHandle,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenOrientation from 'expo-screen-orientation';

// ==================== CONFIGURATION ====================
const STREAM_URL = 'https://cdn-globecast.akamaized.net/live/eds/saudi_sunnah/hls_roku/index.m3u8';

const STORAGE_KEYS = {
  ROTATION: '@live_madina_rotation',
  MUTED: '@live_madina_muted',
  OBJECT_FIT: '@live_madina_object_fit'
};

// ==================== HTML PLAYER - OPTIMIZED VERSION ====================
const getHtmlPlayer = (streamUrl, rotation, isMuted, objectFit) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
  <style>
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    body { 
      background: #000; 
      overflow: hidden; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh; 
      width: 100vw; 
    }
    #video-container { 
      width: 100vw; 
      height: 100vh; 
      display: block;
      transform: rotate(${rotation}deg); 
      transition: transform 0.3s ease;
      overflow: hidden;
      position: fixed;
      top: 0;
      left: 0;
    }
    video { 
      width: 100% !important;
      height: 100% !important;
      object-fit: ${objectFit}; 
      background: #000;
      display: block;
    }
    #loading { 
      position: absolute; 
      top: 50%; 
      left: 50%; 
      transform: translate(-50%, -50%); 
      color: #2E8B57; 
      font-size: 18px; 
      font-family: Arial, sans-serif; 
      z-index: 10; 
    }
    .spinner { 
      border: 4px solid rgba(46, 139, 87, 0.3); 
      border-top: 4px solid #2E8B57; 
      border-radius: 50%; 
      width: 40px; 
      height: 40px; 
      animation: spin 1s linear infinite; 
      margin: 0 auto 10px; 
    }
    @keyframes spin { 
      0% { transform: rotate(0deg); } 
      100% { transform: rotate(360deg); } 
    }
    #error { 
      position: absolute; 
      top: 50%; 
      left: 50%; 
      transform: translate(-50%, -50%); 
      color: #ff4444; 
      font-size: 16px; 
      font-family: Arial, sans-serif; 
      text-align: center; 
      display: none; 
      z-index: 10; 
    }
  </style>
</head>
<body>
  <div id="loading"><div class="spinner"></div><div>جاري التحميل...</div></div>
  <div id="error">❌ حدث خطأ في تحميل البث</div>
  <div id="video-container">
    <video id="video" controls autoplay playsinline webkit-playsinline ${isMuted ? 'muted' : ''}></video>
  </div>
  <script>
    const video = document.getElementById('video');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const container = document.getElementById('video-container');
    video.muted = ${isMuted ? 'true' : 'false'};
    
    // ✅ منع resize events
    let isInitialized = false;
    let currentWidth = 0;
    let currentHeight = 0;
    
    // ✅ حفظ HLS instance في window للوصول إليه عند الخروج
    window.hls = null;
    
    window.addEventListener('message', function(event) {
      const data = JSON.parse(event.data);
      if (data.action === 'toggleMute') {
        video.muted = !video.muted;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'muteChanged', muted: video.muted }));
      } else if (data.action === 'setObjectFit') {
        video.style.objectFit = data.value;
      } else if (data.action === 'setRotation') {
        container.style.transform = 'rotate(' + data.value + 'deg)';
      }
    });

    video.addEventListener('playing', () => { 
      loading.style.display = 'none'; 
      error.style.display = 'none'; 
    });
    
    video.addEventListener('waiting', () => { 
      loading.style.display = 'block'; 
    });
    
    video.addEventListener('error', (e) => { 
      loading.style.display = 'none'; 
      error.style.display = 'block'; 
    });

    video.addEventListener('loadedmetadata', () => {
      if (!isInitialized) {
        currentWidth = video.videoWidth;
        currentHeight = video.videoHeight;
        isInitialized = true;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = '${objectFit}';
        console.log('Video initialized:', currentWidth, 'x', currentHeight);
      }
    });
    
    video.addEventListener('resize', (e) => {
      e.preventDefault();
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = '${objectFit}';
    });

    if (Hls.isSupported()) {
      window.hls = new Hls({
        debug: false, 
        enableWorker: true, 
        lowLatencyMode: false,
        
        // ✅ CRITICAL: إعدادات Buffer محسّنة للـ Live Streaming
        backBufferLength: 10,
        maxBufferLength: 20,
        maxMaxBufferLength: 30,
        maxBufferSize: 30 * 1000 * 1000,
        maxBufferHole: 0.3,
        
        // ✅ إعدادات Live Sync محسّنة
        liveSyncDurationCount: 2,
        liveMaxLatencyDurationCount: 6,
        liveDurationInfinity: true,
        liveBackBufferLength: 10,
        
        // ✅ تحسينات الأداء
        highBufferWatchdogPeriod: 2,
        nudgeOffset: 0.05,
        nudgeMaxRetry: 8,
        maxFragLookUpTolerance: 0.2,
        
        // ✅ إعدادات الشبكة
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 4,
        manifestLoadingRetryDelay: 500,
        levelLoadingTimeOut: 20000,
        levelLoadingMaxRetry: 4,
        levelLoadingRetryDelay: 500,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
        fragLoadingRetryDelay: 500,
        
        // ✅ CRITICAL: تثبيت Audio Codec (حل مشاكل الصوت)
        defaultAudioCodec: 'mp4a.40.2',
        
        // ✅ إعدادات الجودة
        startLevel: -1,
        capLevelToPlayerSize: false,
        abrEwmaDefaultEstimate: 500000,
        abrBandWidthFactor: 0.95,
        abrBandWidthUpFactor: 0.7,
      });
      
      hls.loadSource('${streamUrl}');
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => { 
        console.log('Available levels:', hls.levels.length);
        if (hls.levels.length > 0) {
          const targetLevel = Math.max(0, Math.floor(hls.levels.length / 3));
          hls.currentLevel = targetLevel;
          console.log('Selected level:', targetLevel, hls.levels[targetLevel]);
        }
        setTimeout(() => video.play().catch(e => console.log(e)), 100); 
      });
      
      // ✅ CRITICAL: مراقبة وتنظيف الـ Buffer بشكل دوري
      hls.on(Hls.Events.FRAG_BUFFERED, () => {
        const buffered = video.buffered;
        if (buffered.length > 0) {
          const bufferLength = buffered.end(0) - video.currentTime;
          if (bufferLength > 30) {
            console.log('Buffer too large, cleaning...');
          }
        }
      });
      
      // ✅ منع الزوم عند تغيير الجودة
      hls.on(Hls.Events.LEVEL_SWITCHING, (event, data) => {
        console.log('Quality switching to:', data.level);
        video.style.width = '100%';
        video.style.height = '100%';
      });
      
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        console.log('Quality switched to:', data.level);
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = '${objectFit}';
      });
      
      // ✅ معالجة Buffer Stalls والأخطاء
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.log('HLS Error:', data.type, data.details);
        
        if (data.fatal) {
          switch(data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR: 
              console.log('Network error, retrying...');
              setTimeout(() => hls.startLoad(), 1000); 
              break;
            case Hls.ErrorTypes.MEDIA_ERROR: 
              console.log('Media error, recovering...');
              hls.recoverMediaError(); 
              break;
            default: 
              console.log('Fatal error:', data);
              hls.destroy(); 
              setTimeout(() => { 
                loading.style.display = 'none'; 
                error.style.display = 'block'; 
              }, 500);
          }
        } else {
          if (data.details === 'bufferStalledError' || data.details === 'bufferFullError') {
            console.log('Buffer issue detected, adjusting playback...');
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = '${streamUrl}';
      video.addEventListener('canplay', () => video.play().catch(e => console.log(e)));
    }
  </script>
</body>
</html>
`;

// ==================== MAIN COMPONENT ====================
export default function LiveMadinaScreen() {
  const navigation = useNavigation();
  const webViewRef = useRef(null);
  
  const [userOrientation, setUserOrientation] = useState('portrait');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoRotation, setVideoRotation] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [objectFit, setObjectFit] = useState('contain');

  const menuButtonRef = useRef(null);
  const rotateButtonRef = useRef(null);
  const muteButtonRef = useRef(null);
  const objectFitButtonRef = useRef(null);
  const refreshButtonRef = useRef(null);

  const menuScale = useRef(new Animated.Value(1)).current;
  const rotateScale = useRef(new Animated.Value(1)).current;
  const muteScale = useRef(new Animated.Value(1)).current;
  const objectFitScale = useRef(new Animated.Value(1)).current;
  const refreshScale = useRef(new Animated.Value(1)).current;
  
  const [focusedButton, setFocusedButton] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const menuHandle = findNodeHandle(menuButtonRef.current);
      const rotateHandle = findNodeHandle(rotateButtonRef.current);
      const muteHandle = findNodeHandle(muteButtonRef.current);
      const objectFitHandle = findNodeHandle(objectFitButtonRef.current);
      const refreshHandle = findNodeHandle(refreshButtonRef.current);

      if (menuButtonRef.current && rotateHandle) {
        menuButtonRef.current.setNativeProps({
          nextFocusRight: rotateHandle,
          nextFocusDown: rotateHandle,
        });
      }

      if (rotateButtonRef.current && menuHandle && muteHandle) {
        rotateButtonRef.current.setNativeProps({
          nextFocusLeft: menuHandle,
          nextFocusRight: muteHandle,
          nextFocusUp: menuHandle,
          nextFocusDown: muteHandle,
        });
      }

      if (muteButtonRef.current && rotateHandle && objectFitHandle) {
        muteButtonRef.current.setNativeProps({
          nextFocusLeft: rotateHandle,
          nextFocusRight: objectFitHandle,
          nextFocusUp: rotateHandle,
          nextFocusDown: objectFitHandle,
        });
      }

      if (objectFitButtonRef.current && muteHandle && refreshHandle) {
        objectFitButtonRef.current.setNativeProps({
          nextFocusLeft: muteHandle,
          nextFocusRight: refreshHandle,
          nextFocusUp: muteHandle,
          nextFocusDown: refreshHandle,
        });
      }

      if (refreshButtonRef.current && objectFitHandle && menuHandle) {
        refreshButtonRef.current.setNativeProps({
          nextFocusLeft: objectFitHandle,
          nextFocusRight: menuHandle,
          nextFocusUp: objectFitHandle,
          nextFocusDown: menuHandle,
        });
      }

      console.log('✅ TV Focus Navigation configured');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleBackPress = () => {
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
      const BackHandler = require('react-native').BackHandler;
      const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => subscription.remove();
    }
  }, [focusedButton]);

  const animateFocus = useCallback((scale, isFocused) => {
    Animated.spring(scale, {
      toValue: isFocused ? 1.15 : 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleFocus = useCallback((name, scale) => {
    setFocusedButton(name);
    animateFocus(scale, true);
  }, [animateFocus]);

  const handleBlur = useCallback((scale) => {
    animateFocus(scale, false);
  }, [animateFocus]);

  const handleRotateVideo = useCallback(() => {
    setVideoRotation((prev) => {
      const newRotation = (prev + 90) % 360;
      AsyncStorage.setItem(STORAGE_KEYS.ROTATION, JSON.stringify(newRotation));
      return newRotation;
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({ action: 'toggleMute' }));
      }
      AsyncStorage.setItem(STORAGE_KEYS.MUTED, JSON.stringify(newMuted));
      return newMuted;
    });
  }, []);

  const handleToggleObjectFit = useCallback(() => {
    setObjectFit((prev) => {
      let newFit = prev === 'contain' ? 'cover' : prev === 'cover' ? 'fill' : 'contain';
      if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify({ action: 'setObjectFit', value: newFit }));
      }
      AsyncStorage.setItem(STORAGE_KEYS.OBJECT_FIT, newFit);
      return newFit;
    });
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    if (webViewRef.current) webViewRef.current.reload();
  }, []);

  const handleWebViewLoad = useCallback(() => {
    if (!isMountedRef.current) return;
    setIsLoading(false);
  }, []);

  const handleWebViewError = useCallback((syntheticEvent) => {
    if (!isMountedRef.current) return;
    setIsLoading(false);
    setError('حدث خطأ في تحميل البث');
  }, []);

  useFocusEffect(
    useCallback(() => {
      const setOrientation = async () => {
        try {
          const orientation = await AsyncStorage.getItem('userOrientation');
          if (!isMountedRef.current) return;
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

      const loadSettings = async () => {
        try {
          const savedRotation = await AsyncStorage.getItem(STORAGE_KEYS.ROTATION);
          const savedMuted = await AsyncStorage.getItem(STORAGE_KEYS.MUTED);
          const savedObjectFit = await AsyncStorage.getItem(STORAGE_KEYS.OBJECT_FIT);
          
          if (savedRotation !== null) setVideoRotation(JSON.parse(savedRotation));
          if (savedMuted !== null) setIsMuted(JSON.parse(savedMuted));
          else setIsMuted(true);
          if (savedObjectFit !== null) setObjectFit(savedObjectFit);
        } catch (error) {
          console.log('Error loading settings:', error);
        }
      };

      loadSettings();
      setOrientation();

      // ✅ Cleanup: إيقاف البث عند الخروج من الصفحة
      return () => {
        console.log('🛑 Stopping stream on screen blur...');
        if (webViewRef.current) {
          // إيقاف الفيديو من خلال JavaScript
          webViewRef.current.injectJavaScript(`
            (function() {
              const video = document.getElementById('video');
              if (video) {
                video.pause();
                video.src = '';
                video.load();
              }
              if (window.hls) {
                window.hls.destroy();
                console.log('HLS destroyed');
              }
            })();
            true;
          `);
        }
      };
    }, [])
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      menuScale.stopAnimation();
      rotateScale.stopAnimation();
      muteScale.stopAnimation();
      objectFitScale.stopAnimation();
      refreshScale.stopAnimation();
    };
  }, [menuScale, rotateScale, muteScale, objectFitScale, refreshScale]);

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={50} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <View style={styles.floatingControls}>
        <Animated.View style={{ transform: [{ scale: menuScale }] }}>
          <TouchableOpacity
            ref={menuButtonRef}
            focusable={true}
            hasTVPreferredFocus={true}
            onFocus={() => handleFocus('menu', menuScale)}
            onBlur={() => handleBlur(menuScale)}
            style={[styles.controlButton, focusedButton === 'menu' && styles.tvFocused]}
            onPress={() => navigation.openDrawer()}
          >
            <Ionicons name="menu" size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
        
        <View style={styles.rightButtons}>
          <Animated.View style={{ transform: [{ scale: rotateScale }] }}>
            <TouchableOpacity
              ref={rotateButtonRef}
              focusable={true}
              onFocus={() => handleFocus('rotate', rotateScale)}
              onBlur={() => handleBlur(rotateScale)}
              style={[styles.controlButton, styles.rotateButton, focusedButton === 'rotate' && styles.tvFocused]}
              onPress={handleRotateVideo}
            >
              <View style={styles.rotateButtonContent}>
                <Ionicons name="sync" size={16} color="#fff" />
                <Text style={styles.rotationIndicator}>{videoRotation}°</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: muteScale }] }}>
            <TouchableOpacity
              ref={muteButtonRef}
              focusable={true}
              onFocus={() => handleFocus('mute', muteScale)}
              onBlur={() => handleBlur(muteScale)}
              style={[styles.controlButton, styles.iconButton, focusedButton === 'mute' && styles.tvFocused]}
              onPress={handleToggleMute}
            >
              <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={16} color="#fff" />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={{ transform: [{ scale: objectFitScale }] }}>
            <TouchableOpacity
              ref={objectFitButtonRef}
              focusable={true}
              onFocus={() => handleFocus('objectFit', objectFitScale)}
              onBlur={() => handleBlur(objectFitScale)}
              style={[styles.controlButton, styles.labelButton, focusedButton === 'objectFit' && styles.tvFocused]}
              onPress={handleToggleObjectFit}
            >
              <Text style={styles.labelButtonText}>
                {objectFit === 'contain' ? '⬜' : objectFit === 'cover' ? '⬛' : '↔️'}
              </Text>
              <Text style={styles.labelButtonSubtext}>{objectFit}</Text>
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View style={{ transform: [{ scale: refreshScale }] }}>
            <TouchableOpacity
              ref={refreshButtonRef}
              focusable={true}
              onFocus={() => handleFocus('refresh', refreshScale)}
              onBlur={() => handleBlur(refreshScale)}
              style={[styles.controlButton, focusedButton === 'refresh' && styles.tvFocused]}
              onPress={handleRetry}
            >
              <Ionicons name="refresh" size={16} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      <View style={styles.playerContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: getHtmlPlayer(STREAM_URL, videoRotation, isMuted, objectFit) }}
          style={styles.webview}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          onLoad={handleWebViewLoad}
          onError={handleWebViewError}
          scrollEnabled={false}
          bounces={false}
          androidLayerType="hardware"
          androidHardwareAccelerationDisabled={false}
          mixedContentMode="always"
          allowsFullscreenVideo={true}
          originWhitelist={['*']}
        />
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2E8B57" />
            <Text style={styles.loadingText}>جاري التحميل...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  playerContainer: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  floatingControls: { position: 'absolute', top: 20, left: 20, right: 20, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rightButtons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  controlButton: { backgroundColor: 'rgba(0, 0, 0, 0.6)', borderRadius: 25, padding: 10, borderWidth: 2, borderColor: 'transparent' },
  rotateButton: { backgroundColor: 'rgba(0, 0, 0, 0.6)', borderRadius: 25, paddingHorizontal: 8, paddingVertical: 8, minWidth: 45, alignItems: 'center', justifyContent: 'center' },
  iconButton: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  labelButton: { backgroundColor: 'rgba(0, 0, 0, 0.6)', borderRadius: 20, paddingHorizontal: 6, paddingVertical: 6, minWidth: 45, alignItems: 'center', justifyContent: 'center' },
  labelButtonText: { fontSize: 14, marginBottom: 2 },
  labelButtonSubtext: { color: '#fff', fontSize: 7, fontWeight: '600', textTransform: 'uppercase' },
  rotateButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  rotationIndicator: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 4 },
  tvFocused: { borderWidth: 3, borderColor: '#2E8B57', transform: [{ scale: 1.05 }], elevation: 10, backgroundColor: 'rgba(46, 139, 87, 0.3)' },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 9 },
  loadingText: { color: '#fff', fontSize: 14, marginTop: 10, fontWeight: '600' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#ff4444', marginVertical: 20, textAlign: 'center', fontWeight: '600' },
  retryButton: { backgroundColor: '#2E8B57', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});