import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

export function useTVRemote(callbacks) {
  // استخدام ref للاحتفاظ بآخر نسخة من callbacks
  const callbacksRef = useRef(callbacks);
  
  // تحديث الـ ref في كل render
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    // console.log يمكن تفعيله للتطوير فقط
    // console.log('🎮 TV Remote Hook initialized');
    
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // console.log للتطوير فقط
        // console.log('🎮 Back button pressed');
        
        if (callbacksRef.current?.onBack) {
          callbacksRef.current.onBack();
          return true; // منع السلوك الافتراضي
        }
        
        return false; // السماح بالسلوك الافتراضي
      }
    );

    return () => {
      // console.log للتطوير فقط
      // console.log('🎮 TV Remote Hook cleaned up');
      backHandler.remove();
    };
  }, []); // مش محتاجين dependencies - الـ hook هيشتغل مرة واحدة بس
}