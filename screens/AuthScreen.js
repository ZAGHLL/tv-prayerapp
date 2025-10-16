import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Formik } from 'formik';
import { authAPI } from '../services/api';
import { loginSchema, registerSchema } from '../services/utils/validationSchemas';

const { width, height } = Dimensions.get('window');

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, title: '', message: '' });
  const formikRef = useRef();

  // Custom Alert Component
  const showCustomAlert = (title, message) => {
    setErrorModal({ visible: true, title, message });
  };

  const hideCustomAlert = () => {
    setErrorModal({ visible: false, title: '', message: '' });
  };
  // Force portrait orientation when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const lockOrientation = async () => {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      };
      
      lockOrientation();

      return () => {
        // Do nothing - let the next screen handle its orientation
      };
    }, [])
  );

  const handleLogin = async (values) => {
    console.log('Login values being sent:', values);
    setLoading(true);
    try {
      const response = await authAPI.login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      if (response.success) {
        await AsyncStorage.setItem('auth_token', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        
        // Navigate directly without success message
        navigation.navigate('Main');
      }
    } catch (error) {
      console.log('Login Error:', error);
      showCustomAlert('خطأ في تسجيل الدخول', error.message || 'فشل في تسجيل الدخول. يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values) => {
    console.log('Register values being sent:', values);
    setLoading(true);
    try {
      const response = await authAPI.register({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword,
      });

      if (response.success) {
        await AsyncStorage.setItem('auth_token', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
        
        // Reset form after successful registration
        formikRef.current?.resetForm();
        
        // Navigate directly without success message
        navigation.navigate('OrientationChoice');
      }
    } catch (error) {
      console.log('Register Error:', error);
      
      if (error.errors) {
        let errorMessage = '';
        Object.keys(error.errors).forEach(key => {
          errorMessage += `• ${error.errors[key][0]}\n`;
        });
        showCustomAlert('خطأ في البيانات', errorMessage.trim());
      } else {
        showCustomAlert('خطأ في إنشاء الحساب', error.message || 'فشل في إنشاء الحساب. يرجى المحاولة مرة أخرى');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    // Reset form when switching modes
    if (formikRef.current) {
      formikRef.current.resetForm();
    }
  };

  const getInitialValues = () => {
    if (isLogin) {
      return { email: '', password: '' };
    } else {
      return { name: '', email: '', phone: '', password: '', confirmPassword: '' };
    }
  };

  return (
    <ImageBackground
      source={require('./pexels-pashal-337904.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.authContainer}>
            <View style={styles.header}>
              <Text style={styles.appTitle}>تطبيق الصلاة</Text>
              <Text style={styles.welcomeText}>
                {isLogin ? 'مرحباً بعودتك' : 'انضم إلينا'}
              </Text>
            </View>

            <Formik
              ref={formikRef}
              initialValues={getInitialValues()}
              validationSchema={isLogin ? loginSchema : registerSchema}
              onSubmit={isLogin ? handleLogin : handleRegister}
              enableReinitialize={true}
              key={isLogin ? 'login' : 'register'} // Force re-render
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                values,
                errors,
                touched,
                isValid,
                resetForm,
              }) => (
                <View style={styles.formContainer}>
                  {!isLogin && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>الاسم</Text>
                      <TextInput
                        style={[
                          styles.input,
                          touched.name && errors.name ? styles.inputError : null,
                        ]}
                        value={values.name || ''}
                        onChangeText={handleChange('name')}
                        onBlur={handleBlur('name')}
                        placeholder="أدخل اسمك الكامل"
                        placeholderTextColor="#999"
                        textAlign="right"
                      />
                      {touched.name && errors.name && (
                        <Text style={styles.errorText}>{errors.name}</Text>
                      )}
                    </View>
                  )}

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>البريد الإلكتروني</Text>
                    <TextInput
                      style={[
                        styles.input,
                        touched.email && errors.email ? styles.inputError : null,
                      ]}
                      value={values.email || ''}
                      onChangeText={handleChange('email')}
                      onBlur={handleBlur('email')}
                      placeholder="أدخل بريدك الإلكتروني"
                      placeholderTextColor="#999"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      textAlign="right"
                    />
                    {touched.email && errors.email && (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    )}
                  </View>

                  {!isLogin && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>رقم الموبايل</Text>
                      <TextInput
                        style={[
                          styles.input,
                          touched.phone && errors.phone ? styles.inputError : null,
                        ]}
                        value={values.phone || ''}
                        onChangeText={handleChange('phone')}
                        onBlur={handleBlur('phone')}
                        placeholder="أدخل رقم هاتفك"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                        textAlign="right"
                      />
                      {touched.phone && errors.phone && (
                        <Text style={styles.errorText}>{errors.phone}</Text>
                      )}
                    </View>
                  )}

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>كلمة المرور</Text>
                    <TextInput
                      style={[
                        styles.input,
                        touched.password && errors.password ? styles.inputError : null,
                      ]}
                      value={values.password || ''}
                      onChangeText={handleChange('password')}
                      onBlur={handleBlur('password')}
                      placeholder="أدخل كلمة المرور"
                      placeholderTextColor="#999"
                      secureTextEntry
                      textAlign="right"
                    />
                    {touched.password && errors.password && (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    )}
                  </View>

                  {!isLogin && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>تأكيد كلمة المرور</Text>
                      <TextInput
                        style={[
                          styles.input,
                          touched.confirmPassword && errors.confirmPassword
                            ? styles.inputError
                            : null,
                        ]}
                        value={values.confirmPassword || ''}
                        onChangeText={handleChange('confirmPassword')}
                        onBlur={handleBlur('confirmPassword')}
                        placeholder="أعد إدخال كلمة المرور"
                        placeholderTextColor="#999"
                        secureTextEntry
                        textAlign="right"
                      />
                      {touched.confirmPassword && errors.confirmPassword && (
                        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                      )}
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.authButton,
                      (!isValid || loading) ? styles.buttonDisabled : null,
                    ]}
                    onPress={handleSubmit}
                    focusable={true}
                    disabled={!isValid || loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.authButtonText}>
                        {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <View style={styles.toggleContainer}>
                    <Text style={styles.toggleText}>
                      {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
                    </Text>
                    <TouchableOpacity  focusable={true} onPress={toggleAuthMode}>
                      <Text style={styles.toggleButton}>
                        {isLogin ? 'إنشاء حساب جديد' : 'تسجيل الدخول'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
  style={[styles.authButton, { backgroundColor: '#6c757d', marginTop: 10 }]}
  focusable={true}
  onPress={async () => {
    await AsyncStorage.setItem('auth_token', 'guest_token');
    await AsyncStorage.setItem('userData', JSON.stringify({
      id: 'guest',
      name: 'ضيف',
      email: 'guest@example.com',
      isGuest: true
    }));
    navigation.navigate('Main');
  }}
>
  <Text style={styles.authButtonText}>الدخول كضيف</Text>
</TouchableOpacity>


                  {/* زر تنظيف البيانات للتجربة */}
                 
                </View>
              )}
            </Formik>
          </View>

          {/* Custom Alert Modal */}
          <Modal
            visible={errorModal.visible}
            transparent={true}
            animationType="fade"
            onRequestClose={hideCustomAlert}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{errorModal.title}</Text>
                </View>
                <View style={styles.modalBody}>
                  <Text style={styles.modalMessage}>{errorModal.message}</Text>
                </View>
                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={styles.modalButton} 
                    focusable={true}
                    onPress={hideCustomAlert}
                  >
                    <Text style={styles.modalButtonText}>موافق</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  authContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E8B57',
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    textAlign: 'right',
  },
  inputError: {
    borderColor: '#ff6b6b',
    borderWidth: 2,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'right',
  },
  authButton: {
    backgroundColor: '#2E8B57',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#2E8B57',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  authButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  toggleText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  toggleButton: {
    fontSize: 16,
    color: '#2E8B57',
    fontWeight: '600',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    backgroundColor: '#2E8B57',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalBody: {
    paddingVertical: 25,
    paddingHorizontal: 20,
    minHeight: 80,
    justifyContent: 'center',
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    textAlign: 'center',
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  modalButton: {
    backgroundColor: '#2E8B57',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});