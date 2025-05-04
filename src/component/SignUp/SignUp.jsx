import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSignupStore from '../../store/signupStore';
import IDVerification from './IDVerification';
import Credentials from './Credentials';
import PersonalDetails from './PersonalDetails';
import SignUpProgress from './SignUpProgress';
import { toast } from 'react-hot-toast';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { FaArrowLeft } from 'react-icons/fa';
import WorkBackground from './WorkBackground';
import Lifestyle from './Lifestyle';
import VeteransCommunity from './VeteransCommunity';
import { useLanguage } from '../../context/LanguageContext';

const SignUp = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { 
    currentStep, 
    idVerificationData,
    credentialsData,
    personalData,
    workData,
    lifestyleData,
    veteransData,
    setCurrentStep, 
    resetStore, 
    stepValidation,
    setStepValidation
  } = useSignupStore();

  // Reset store when component mounts
  useEffect(() => {
    resetStore();
  }, []);

  const handleStepComplete = async (step) => {
    // Validate and mark step as complete
    setStepValidation(step, true);

    if (step === 5) {
      try {
        // Validate that we have all required data
        if (!idVerificationData || !credentialsData || !personalData) {
          toast.error(t('auth.signup.error.incomplete'));
          return;
        }

        // Show loading toast
        const loadingToast = toast.loading(t('auth.signup.creating'), { id: 'signup' });

        // Check if email is already in use before creating user
        try {
          const methods = await fetchSignInMethodsForEmail(auth, credentialsData.email);
          if (methods && methods.length > 0) {
            throw new Error('auth/email-already-in-use');
          }
        } catch (error) {
          if (error.code === 'auth/email-already-in-use') {
            toast.error(t('auth.credentials.email.inUse'), { id: loadingToast });
            return;
          }
          console.error('Error checking email:', error);
        }
        
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          credentialsData.email,
          credentialsData.password
        ).catch(async (error) => {
          // Handle specific auth errors
          if (error.code === 'auth/email-already-in-use') {
            toast.error(t('auth.credentials.email.inUse'), { id: loadingToast });
          } else if (error.code === 'auth/invalid-email') {
            toast.error(t('auth.credentials.email.invalid'), { id: loadingToast });
          } else if (error.code === 'auth/weak-password') {
            toast.error(t('auth.credentials.password.requirements'), { id: loadingToast });
          } else {
            toast.error(error.message || t('auth.signup.error.general'), { id: loadingToast });
          }
          throw error;
        });

        // Helper function to remove undefined values and clean data
        const cleanObject = (obj) => {
          return Object.entries(obj).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null) {
              if (typeof value === 'object' && !Array.isArray(value)) {
                acc[key] = cleanObject(value);
              } else {
                acc[key] = value;
              }
            }
            return acc;
          }, {});
        };

        // Helper function to validate required fields
        const validateRequiredFields = (data, requiredFields) => {
          const missingFields = requiredFields.filter(field => !data[field]);
          if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
          }
        };

        // Debug log to check personalData before validation
        console.log('personalData at submit:', personalData);
        // Validate required fields for each section
        validateRequiredFields(idVerificationData, ['firstName', 'lastName', 'idNumber', 'dateOfBirth', 'gender']);
        validateRequiredFields(credentialsData, ['email', 'username']);
        validateRequiredFields(personalData, ['address', 'phoneNumber', 'nativeLanguage']);

        // Prepare user data with proper structure and clean undefined values
        const userData = cleanObject({
          idVerification: {
            ...idVerificationData,
            createdAt: new Date().toISOString()
          },
          credentials: {
            email: credentialsData.email,
            username: credentialsData.username,
            createdAt: new Date().toISOString()
          },
          personalDetails: {
            ...personalData,
            createdAt: new Date().toISOString()
          },
          workBackground: workData ? {
            ...workData,
            createdAt: new Date().toISOString()
          } : {},
          lifestyle: lifestyleData ? {
            ...lifestyleData,
            createdAt: new Date().toISOString()
          } : {},
          veteransCommunity: veteransData ? {
            ...veteransData,
            createdAt: new Date().toISOString()
          } : {},
          metadata: {
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            signupCompleted: true,
            lastLogin: null,
            status: 'active'
          }
        });

        // Store user data in Firestore with error handling
        try {
          // Create a batch write to ensure atomicity
          const batch = writeBatch(db);

          // Add main user data to batch
          const userRef = doc(db, 'users', userCredential.user.uid);
          batch.set(userRef, userData);

          // Add username lookup to batch
          const usernameRef = doc(db, 'usernames', credentialsData.username.toLowerCase());
          batch.set(usernameRef, {
            uid: userCredential.user.uid,
            createdAt: new Date().toISOString()
          });

          // Add veterans data to batch if it exists
          if (veteransData) {
            const cleanVeteransData = cleanObject({
              ...veteransData,
              userId: userCredential.user.uid,
              email: credentialsData.email,
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            });
            const veteransRef = doc(db, 'veterans', userCredential.user.uid);
            batch.set(veteransRef, cleanVeteransData);
          }

          // Commit the batch
          await batch.commit();

          // Update loading toast to success
          toast.success(t('auth.signup.success'), { id: loadingToast });
          
          // Reset store
          resetStore();
          
          // Navigate to login after a delay
          setTimeout(() => {
            navigate('/login');
          }, 1500);
        } catch (firestoreError) {
          console.error('Firestore error:', firestoreError);
          // If Firestore fails, delete the auth user to maintain consistency
          await userCredential.user.delete();
          throw new Error(t('auth.signup.error.firestore'));
        }
      } catch (error) {
        console.error('Signup error:', error);
        // Don't show error message if it's already shown in the catch block above
        if (!error.code || !error.code.startsWith('auth/')) {
          toast.error(error.message || t('auth.signup.error.general'), { id: 'signup' });
        }
      }
    } else {
      setCurrentStep(step + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/login');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <IDVerification onComplete={() => handleStepComplete(0)} />;
      case 1:
        return <Credentials onComplete={() => handleStepComplete(1)} />;
      case 2:
        return <PersonalDetails onComplete={() => handleStepComplete(2)} />;
      case 3:
        return <WorkBackground onComplete={() => handleStepComplete(3)} />;
      case 4:
        return <Lifestyle onComplete={() => handleStepComplete(4)} />;
      case 5:
        return <VeteransCommunity onComplete={() => handleStepComplete(5)} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Logo */}
      <div className="absolute top-4 left-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#FFD966]">
          Golden Generation
        </h1>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-20 pb-8">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
            {t('auth.signup.title')}
          </h2>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 sm:mb-12">
          <SignUpProgress currentStep={currentStep} stepValidation={stepValidation} />
        </div>

        {/* Form Container */}
        <div className="flex justify-center">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 w-full max-w-2xl relative">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="absolute top-4 left-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              <FaArrowLeft className="mr-2" />
              <span className="text-sm font-medium">{t('common.back')}</span>
            </button>
            {renderStep()}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t('auth.signup.haveAccount')}{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-[#FFD966] hover:text-[#FFB800] font-medium transition-colors duration-200"
            >
              {t('auth.signup.signIn')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;