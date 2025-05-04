import React, { useState } from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import useSignupStore from '../../store/signupStore';
import { debounce } from 'lodash';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const Credentials = ({ onComplete }) => {
  const [errors, setErrors] = useState({});
  const [isChecking, setIsChecking] = useState(false);
  const { credentialsData, updateCredentialsData } = useSignupStore();
  const { t } = useLanguage();

  // Debounced email check
  const checkEmailAvailability = debounce(async (email) => {
    if (!email) return;
    
    setIsChecking(true);
    try {
      // Check in users collection for email in credentials.email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('credentials.email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setErrors(prev => ({ ...prev, email: t('auth.credentials.email.inUse') }));
        toast.error(t('auth.credentials.email.inUse'));
      } else {
        setErrors(prev => ({ ...prev, email: '' }));
        if (email.length > 0 && /\S+@\S+\.\S+/.test(email)) {
          toast.success(t('auth.credentials.email.available'));
        }
      }
    } catch (error) {
      console.error('Error checking email:', error);
      toast.error(t('errors.general'));
    } finally {
      setIsChecking(false);
    }
  }, 500);

  // Debounced username check
  const checkUsernameAvailability = debounce(async (username) => {
    if (!username || username.length < 3) return;
    
    setIsChecking(true);
    try {
      const usernameRef = doc(db, 'usernames', username.toLowerCase());
      const usernameDoc = await getDoc(usernameRef);
      
      if (usernameDoc.exists()) {
        setErrors(prev => ({ ...prev, username: t('auth.credentials.username.inUse') }));
        toast.error(t('auth.credentials.username.inUse'));
      } else {
        setErrors(prev => ({ ...prev, username: '' }));
        if (username.length >= 3) {
          toast.success(t('auth.credentials.username.available'));
        }
      }
    } catch (error) {
      console.error('Error checking username:', error);
      toast.error(t('errors.general'));
    } finally {
      setIsChecking(false);
    }
  }, 500);

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateCredentialsData({ [name]: value });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Check availability
    if (name === 'username' && value.length >= 3) {
      checkUsernameAvailability(value);
    } else if (name === 'email') {
      checkEmailAvailability(value);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const { email, password, confirmPassword, username } = credentialsData;

    // Email validation
    if (!email) {
      newErrors.email = t('auth.credentials.email.required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.credentials.email.invalid');
    }

    // Username validation
    if (!username) {
      newErrors.username = t('auth.credentials.username.required');
    } else if (username.length < 3) {
      newErrors.username = t('auth.credentials.username.minLength');
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      newErrors.username = t('auth.credentials.username.invalid');
    }

    // Password validation
    if (!password) {
      newErrors.password = t('auth.credentials.password.required');
    } else if (password.length < 8) {
      newErrors.password = t('auth.credentials.password.minLength');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = t('auth.credentials.password.requirements');
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = t('auth.credentials.confirmPassword.required');
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = t('auth.credentials.confirmPassword.mismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isChecking) {
      toast.error(t('auth.credentials.validation.wait'));
      return;
    }

    if (!validateForm()) {
      toast.error(t('auth.credentials.validation.fix'));
      return;
    }

    // Final availability check before submission
    setIsChecking(true);
    try {
      // Check both email and username one last time
      const [emailAvailable, usernameAvailable] = await Promise.all([
        checkEmailFinal(credentialsData.email),
        checkUsernameFinal(credentialsData.username)
      ]);

      if (!emailAvailable) {
        setErrors(prev => ({ ...prev, email: t('auth.credentials.email.inUse') }));
        toast.error(t('auth.credentials.email.inUse'));
        return;
      }

      if (!usernameAvailable) {
        setErrors(prev => ({ ...prev, username: t('auth.credentials.username.inUse') }));
        toast.error(t('auth.credentials.username.inUse'));
        return;
      }

      // If both are available, proceed
      toast.success(t('auth.credentials.validation.success'));
      onComplete();
    } catch (error) {
      console.error('Error in final validation:', error);
      toast.error(t('errors.general'));
    } finally {
      setIsChecking(false);
    }
  };

  // Final check functions that return promises
  const checkEmailFinal = async (email) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('credentials.email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  };

  const checkUsernameFinal = async (username) => {
    const usernameRef = doc(db, 'usernames', username.toLowerCase());
    const usernameDoc = await getDoc(usernameRef);
    return !usernameDoc.exists();
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-md mt-4 sm:mt-6">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('auth.credentials.title')}</h2>
        <p className="mt-2 text-sm sm:text-base text-gray-600">{t('auth.credentials.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Email Field */}
          <div className="space-y-1">
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              {t('auth.credentials.email.label')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={credentialsData.email || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 sm:py-3 rounded-lg shadow-sm text-sm sm:text-base pr-10 transition-colors duration-200 ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
                }`}
                placeholder={t('auth.credentials.email.placeholder')}
              />
              {isChecking ? (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                </div>
              ) : errors.email ? (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : credentialsData.email && !errors.email ? (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : null}
            </div>
            {errors.email && (
              <p className="mt-1 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email}
              </p>
            )}
          </div>

          {/* Username Field */}
          <div className="space-y-1">
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              {t('auth.credentials.username.label')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="username"
                value={credentialsData.username || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 sm:py-3 rounded-lg shadow-sm text-sm sm:text-base pr-10 transition-colors duration-200 ${
                  errors.username
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
                }`}
                placeholder={t('auth.credentials.username.placeholder')}
              />
              {isChecking ? (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                </div>
              ) : errors.username ? (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : credentialsData.username && !errors.username ? (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : null}
            </div>
            {errors.username && (
              <p className="mt-1 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.username}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              {t('auth.credentials.password.label')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={credentialsData.password || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 sm:py-3 rounded-lg shadow-sm text-sm sm:text-base pr-10 transition-colors duration-200 ${
                  errors.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
                }`}
                placeholder={t('auth.credentials.password.placeholder')}
              />
              {errors.password && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {errors.password && (
              <p className="mt-1 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.password}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {t('auth.credentials.password.requirements')}
            </p>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1">
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              {t('auth.credentials.confirmPassword.label')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                name="confirmPassword"
                value={credentialsData.confirmPassword || ''}
                onChange={handleChange}
                className={`w-full px-3 py-2 sm:py-3 rounded-lg shadow-sm text-sm sm:text-base pr-10 transition-colors duration-200 ${
                  errors.confirmPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
                }`}
                placeholder={t('auth.credentials.confirmPassword.placeholder')}
              />
              {errors.confirmPassword && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <button
            type="submit"
            disabled={isChecking}
            className="w-full bg-[#FFD966] hover:bg-[#FFB800] text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChecking ? t('common.loading') : t('common.continue')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Credentials; 