import { useEffect } from 'react';
import { BackHandler } from 'react-native';

export function useTVRemote(callbacks) {
  useEffect(() => {
    console.log('🎮 TV Remote Hook initialized');
    
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        console.log('🎮 Back button pressed');
        
        if (callbacks?.onBack) {
          callbacks.onBack();
          return true; // منع السلوك الافتراضي
        }
        
        return false; // السماح بالسلوك الافتراضي
      }
    );

    return () => {
      console.log('🎮 TV Remote Hook cleaned up');
      backHandler.remove();
    };
  }, [callbacks]);
}