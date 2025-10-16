// utils/validationSchemas.js
import * as Yup from 'yup';

export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('صيغة البريد الإلكتروني غير صحيحة')
    .required('البريد الإلكتروني مطلوب'),
  password: Yup.string()
    .required('كلمة المرور مطلوبة'),
});

export const registerSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'الاسم يجب أن يكون على الأقل حرفين')
    .required('الاسم مطلوب'),
  email: Yup.string()
    .email('صيغة البريد الإلكتروني غير صحيحة')
    .required('البريد الإلكتروني مطلوب'),
  phone: Yup.string()
    .min(10, 'رقم الهاتف يجب أن يكون على الأقل 10 أرقام')
    .required('رقم الهاتف مطلوب'),
  password: Yup.string()
    .min(8, 'كلمة المرور يجب أن تكون على الأقل 8 أحرف')
    .required('كلمة المرور مطلوبة'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'كلمات المرور غير متطابقة')
    .required('تأكيد كلمة المرور مطلوب'),
});