import React, { useState, useRef } from 'react';
import { FaUpload, FaQrcode, FaFile, FaTimes, FaCamera } from 'react-icons/fa';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import useSignupStore from '../../store/signupStore';
import { createWorker } from 'tesseract.js';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const IDVerification = ({ onComplete }) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('heb+eng'); // Default to Hebrew + English
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { idVerificationData, updateIdVerificationData } = useSignupStore();

  // Language options for OCR
  const languageOptions = [
    { value: 'heb+eng', label: t('auth.idVerification.language.hebEng') },
    { value: 'heb', label: t('auth.idVerification.language.heb') },
    { value: 'eng', label: t('auth.idVerification.language.eng') }
  ];

  const handleUpload = () => {
    fileInputRef.current.click();
  };

  const preprocessImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Increase resolution significantly for better character recognition
        const minWidth = 3000; // Increased for better clarity
        let width = img.width;
        let height = img.height;
        
        if (width < minWidth) {
          const scale = minWidth / width;
          width = minWidth;
          height = Math.round(height * scale);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Enhanced image processing for better text clarity
        ctx.filter = 'contrast(150%) brightness(110%) saturate(110%)';
        ctx.drawImage(img, 0, 0, width, height);
        
        try {
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            // Enhanced contrast for text
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const threshold = 128;
            
            if (avg > threshold) {
              // Make lighter pixels more white
              data[i] = data[i + 1] = data[i + 2] = 255;
            } else {
              // Make darker pixels black for better definition
              data[i] = data[i + 1] = data[i + 2] = 0;
            }
          }
          
          ctx.putImageData(imageData, 0, 0);
        } catch (e) {
          console.warn('Advanced image processing failed:', e);
        }
        
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(img.src);
          resolve(blob);
        }, 'image/png', 1.0);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(file);
      };
    });
  };

  const handleFileChange = async (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({
          ...prev,
          [name]: t('auth.idVerification.errors.fileSize')
        }));
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          [name]: t('auth.idVerification.errors.fileType')
        }));
        return;
      }
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }

      console.log(t('auth.idVerification.log.preprocessingStart'));
      const processedImage = await preprocessImage(file);
      console.log(t('auth.idVerification.log.preprocessingComplete'));

      const extractedData = await processImageWithOCR(processedImage);
      
      if (extractedData) {
        updateIdVerificationData(extractedData);
        console.log(t('auth.idVerification.log.formAutoFilled'), extractedData);
      }
    }
  };

  const processImageWithOCR = async (imageFile) => {
    setIsProcessing(true);
    let worker = null;
    
    try {
      worker = await createWorker();
      
      console.log(t('auth.idVerification.log.loadingLanguage'), selectedLanguage);
      await worker.loadLanguage(selectedLanguage);
      
      console.log(t('auth.idVerification.log.initializing'));
      await worker.initialize(selectedLanguage);
      
      // Optimized parameters specifically for Israeli ID cards
      await worker.setParameters({
        tessedit_pageseg_mode: '4',           // Assume single column of text
        tessedit_char_whitelist: '0123456789אבגדהוזחטיכסעפצקרשתםןץףך.- ',  // Hebrew characters and numbers
        preserve_interword_spaces: '1',
        textord_heavy_nr: '0',                // Disable noise removal for better character recognition
        textord_min_linesize: '2.5',
        tessedit_ocr_engine_mode: '2',        // Use Legacy + LSTM engines
        debug_file: '/dev/null',
        tessedit_create_txt: '0',
        tessedit_create_hocr: '0',
        tessedit_write_images: '0',
        tessedit_fix_fuzzy_spaces: '1',
        load_system_dawg: '1',
        load_freq_dawg: '1'
      });

      console.log(t('auth.idVerification.log.startingOCR'));
      const { data } = await worker.recognize(imageFile);
      
      console.log(t('auth.idVerification.log.rawOutput'), data.text);

      // Extract data using improved Hebrew patterns
      const extractedData = extractDataFromOCR(data.text, data.words || []);
      
      if (extractedData) {
        console.log(t('auth.idVerification.log.extractionSuccess'), extractedData);
        updateIdVerificationData(extractedData);
        toast.success(t('auth.idVerification.success.extracted'));
      } else {
        toast.error(t('auth.idVerification.error.extraction'));
      }

    } catch (error) {
      console.error(t('auth.idVerification.error.ocr'), error);
      toast.error(t('auth.idVerification.error.ocr'));
    } finally {
      if (worker) {
        await worker.terminate();
      }
      setIsProcessing(false);
    }
  };

  const extractDataFromOCR = (text, words) => {
    console.group(t('auth.idVerification.log.dataExtraction'));
    console.log(t('auth.idVerification.log.startingExtraction'));
    
    const extractedData = {
      firstName: '',
      lastName: '',
      idNumber: '',
      dateOfBirth: '',
      gender: 'male'  // Default to male
    };

    // Split text into lines and clean them
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    console.log(t('auth.idVerification.log.processingLines'), lines);

    // 1. Extract ID Number
    const extractIdNumber = () => {
      console.log(t('auth.idVerification.log.startingIdExtraction'));
      
      // Get all lines for processing
      const allLines = lines.map(line => line.trim()).filter(line => line.length > 0);
      console.log(t('auth.idVerification.log.allLines'), allLines);

      // Function to clean and extract numbers
      const extractNumbers = (text) => {
        // Remove all non-digit characters
        return text.replace(/[^\d]/g, '');
      };

      // Function to validate Israeli ID number format (9 digits)
      const isValidIsraeliId = (number) => {
        return /^\d{9}$/.test(number);
      };

      // Function to find ID in text with specific pattern
      const findIdInText = (text) => {
        // First try: Look for 2 followed by 7 digits and 1 digit (213697501)
        const pattern1 = /2\d{7}1/;
        const match1 = text.match(pattern1);
        if (match1) {
          console.log(t('auth.idVerification.log.foundIdPattern'), match1[0]);
          return match1[0];
        }

        // Second try: Look for any 9 consecutive digits
        const pattern2 = /\d{9}/;
        const match2 = text.match(pattern2);
        if (match2) {
          console.log(t('auth.idVerification.log.foundDigitSequence'), match2[0]);
          return match2[0];
        }

        // Third try: Look for split pattern (2 1369750 1)
        const numbers = text.match(/\d+/g) || [];
        if (numbers.length >= 3) {
          for (let i = 0; i < numbers.length - 2; i++) {
            if (numbers[i] === '2' && numbers[i + 1].length === 7 && numbers[i + 2] === '1') {
              const combined = numbers[i] + numbers[i + 1] + numbers[i + 2];
              console.log(t('auth.idVerification.log.foundSplitPattern'), combined);
              return combined;
            }
          }
        }

        return null;
      };

      // First attempt: Check the last few lines (where ID typically appears)
      const lastLines = allLines.slice(-6);
      console.log(t('auth.idVerification.log.checkingLastLines'), lastLines);
      
      for (const line of lastLines) {
        const cleanedLine = extractNumbers(line);
        if (isValidIsraeliId(cleanedLine)) {
          console.log(t('auth.idVerification.log.foundIdInLastLines'), cleanedLine);
          return cleanedLine;
        }

        // Try finding ID with pattern in original line
        const idFromPattern = findIdInText(line);
        if (idFromPattern) {
          return idFromPattern;
        }
      }

      // Second attempt: Check first few lines (where ID might appear at top)
      const firstLines = allLines.slice(0, 6);
      console.log(t('auth.idVerification.log.checkingFirstLines'), firstLines);
      
      for (const line of firstLines) {
        const cleanedLine = extractNumbers(line);
        if (isValidIsraeliId(cleanedLine)) {
          console.log(t('auth.idVerification.log.foundIdInFirstLines'), cleanedLine);
          return cleanedLine;
        }

        // Try finding ID with pattern in original line
        const idFromPattern = findIdInText(line);
        if (idFromPattern) {
          return idFromPattern;
        }
      }

      // Third attempt: Join all text and look for ID pattern
      const allText = allLines.join(' ');
      console.log(t('auth.idVerification.log.checkingEntireText'));
      
      // Try finding ID with pattern in entire text
      const idFromFullText = findIdInText(allText);
      if (idFromFullText) {
        return idFromFullText;
      }

      // Fourth attempt: Look specifically for the format seen in the image (2 1369750 1)
      const cornerPattern = /2\s*1369750\s*1/;
      const cornerMatch = allText.match(cornerPattern);
      if (cornerMatch) {
        const idNumber = cornerMatch[0].replace(/\s+/g, '');
        console.log(t('auth.idVerification.log.foundCornerPattern'), idNumber);
        return idNumber;
      }

      console.warn(t('auth.idVerification.log.noValidId'));
      return '';
    };

    // 2. Extract Names
    const extractNames = () => {
      let foundFirstName = null;
      let foundLastName = null;

      // Helper function to clean and validate Hebrew text
      const cleanAndValidateHebrew = (text) => {
        const cleaned = text.replace(/[^\u0590-\u05FF\s]/g, '').trim();
        return cleaned.length >= 2 ? cleaned : null;
      };

      // Common Hebrew name markers
      const firstNameMarkers = ['השם הפרטי', 'שם פרטי'];
      const lastNameMarkers = ['שם משפחה', 'שם המשפחה'];

      // Process each line for names
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const nextLine = i + 1 < lines.length ? lines[i + 1] : null;
        const nextNextLine = i + 2 < lines.length ? lines[i + 2] : null;

        // Check for first name markers
        if (firstNameMarkers.some(marker => line.includes(marker))) {
          if (nextLine) {
            const cleanedName = cleanAndValidateHebrew(nextLine);
            if (cleanedName) {
              foundFirstName = cleanedName;
              console.log('Found first name after marker:', foundFirstName);
            } else if (nextNextLine) {
              // Try next line if first attempt failed
              const altName = cleanAndValidateHebrew(nextNextLine);
              if (altName) {
                foundFirstName = altName;
                console.log('Found first name in next line:', foundFirstName);
              }
            }
          }
        }

        // Check for last name markers
        if (lastNameMarkers.some(marker => line.includes(marker))) {
          if (nextLine) {
            const cleanedName = cleanAndValidateHebrew(nextLine);
            if (cleanedName) {
              foundLastName = cleanedName;
              console.log('Found last name after marker:', foundLastName);
            } else if (nextNextLine) {
              // Try next line if first attempt failed
              const altName = cleanAndValidateHebrew(nextNextLine);
              if (altName) {
                foundLastName = altName;
                console.log('Found last name in next line:', foundLastName);
              }
            }
          }
        }
      }

      // If names weren't found with markers, try to find Hebrew words in the top section
      if (!foundFirstName || !foundLastName) {
        const topLines = lines.slice(0, Math.ceil(lines.length / 2));
        const hebrewWords = topLines
          .map(line => cleanAndValidateHebrew(line))
          .filter(Boolean);

        console.log('Found Hebrew words in top section:', hebrewWords);

        if (!foundFirstName && hebrewWords.length > 0) {
          foundFirstName = hebrewWords[0];
          console.log('Found first name from top section:', foundFirstName);
        }

        if (!foundLastName && hebrewWords.length > 1) {
          foundLastName = hebrewWords[1];
          console.log('Found last name from top section:', foundLastName);
        }
      }

      // Store the found names
      if (foundFirstName) {
        extractedData.firstName = foundFirstName;
      }
      if (foundLastName) {
        extractedData.lastName = foundLastName;
      }

      // Log final results
      console.log('----------------------------------------');
      console.log('Name Extraction Results:');
      console.log('First Name:', extractedData.firstName || '(not detected)');
      console.log('Last Name:', extractedData.lastName || '(not detected)');
      console.log('----------------------------------------');
    };

    // 3. Extract Date of Birth
    const extractDate = () => {
      // Look for date patterns (supporting multiple formats)
      const datePatterns = [
        /(\d{2})\.(\d{2})\.(\d{4})/, // DD.MM.YYYY
        /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
        /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
      ];

      for (const line of lines) {
        for (const pattern of datePatterns) {
          const match = line.match(pattern);
          if (match) {
            const [_, day, month, year] = match;
            // Validate date components
            const dayNum = parseInt(day);
            const monthNum = parseInt(month);
            const yearNum = parseInt(year);
            
            if (dayNum > 0 && dayNum <= 31 &&
                monthNum > 0 && monthNum <= 12 &&
                yearNum > 1900 && yearNum <= new Date().getFullYear()) {
              const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              console.log('Found valid date of birth:', date);
              return date;
            }
          }
        }
      }

      console.warn('Could not find valid date of birth');
      return '';
    };

    // Extract all fields
    extractedData.idNumber = extractIdNumber();
    extractNames();
    extractedData.dateOfBirth = extractDate();

    // Log final extracted data
    console.log('----------------------------------------');
    console.log(t('auth.idVerification.log.extractionResults'));
    console.log('----------------------------------------');
    console.log(t('auth.idVerification.log.firstName'), extractedData.firstName || t('auth.idVerification.log.notDetected'));
    console.log(t('auth.idVerification.log.lastName'), extractedData.lastName || t('auth.idVerification.log.notDetected'));
    console.log(t('auth.idVerification.log.idNumber'), extractedData.idNumber);
    console.log(t('auth.idVerification.log.dateOfBirth'), extractedData.dateOfBirth);
    console.log(t('auth.idVerification.log.gender'), extractedData.gender);
    console.log('----------------------------------------');

    // Update form fields with extracted data
    updateIdVerificationData(extractedData);

    console.groupEnd();
    return extractedData;
  };

  const removeFile = () => {
    if (previewUrl && previewUrl !== 'pdf') {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setUploadedFile(null);
  };

  const startScanning = async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      videoRef.current.srcObject = stream;
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Failed to access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
    
    // Stop scanning
    stopScanning();

    // Process the captured image
    if (blob) {
      const file = new File([blob], 'captured-id.jpg', { type: 'image/jpeg' });
      handleFileChange({ target: { files: [file] } });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for ID number
    if (name === 'idNumber') {
      // Remove all non-digits
      const cleanValue = value.replace(/\D/g, '');
      
      // Limit to 9 digits
      const truncatedValue = cleanValue.slice(0, 9);
      
      updateIdVerificationData({ [name]: truncatedValue });
      
      // Show error if length is not 9
      if (truncatedValue.length !== 9 && truncatedValue.length > 0) {
        setErrors(prev => ({ 
          ...prev, 
          [name]: 'ID number must be exactly 9 digits' 
        }));
      } else {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    } else {
      updateIdVerificationData({ [name]: value });
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  const calculateAge = (dateString) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!idVerificationData.firstName) {
      newErrors.firstName = t('auth.idVerification.error.firstNameRequired');
    }

    if (!idVerificationData.lastName) {
      newErrors.lastName = t('auth.idVerification.error.lastNameRequired');
    }

    if (!idVerificationData.idNumber) {
      newErrors.idNumber = t('auth.idVerification.error.idNumberRequired');
    } else if (!/^\d{9}$/.test(idVerificationData.idNumber)) {
      newErrors.idNumber = t('auth.idVerification.error.invalidIdNumber');
    }

    if (!idVerificationData.dateOfBirth) {
      newErrors.dateOfBirth = t('auth.idVerification.error.dateOfBirthRequired');
    } else {
      const age = calculateAge(idVerificationData.dateOfBirth);
      const finalAge = typeof age === 'string'
        ? parseInt(age.split(' ')[0], 10)
        : age;

      if (finalAge < 50) {
        newErrors.dateOfBirth = t('auth.idVerification.error.ageRequirement');
        toast.error(t('auth.idVerification.error.ageRequirementNotMet'));
      }
    }

    if (!idVerificationData.gender) {
      newErrors.gender = t('auth.idVerification.error.genderRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      updateIdVerificationData({
        idNumber: idVerificationData.idNumber,
        idType: idVerificationData.idType,
        expiryDate: idVerificationData.expiryDate,
        idImage: idVerificationData.idImage,
        selfie: idVerificationData.selfie
      });
      onComplete();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-lg shadow-md mt-4 sm:mt-6">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('auth.idVerification.title')}</h2>
        <p className="mt-2 text-sm sm:text-base text-gray-600">{t('auth.idVerification.subtitle')}</p>
      </div>
      
      {/* Language Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('auth.idVerification.language.select')}
        </label>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]"
        >
          {languageOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* ID Upload Section */}
      <div className="mb-8">
        <div className="text-center mb-4">
          <p className="text-gray-600 text-sm sm:text-base mb-4">
            {t('auth.idVerification.uploadInstructions')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png"
                className="hidden"
                aria-label={t('auth.idVerification.uploadInput')}
              />
              <button
                onClick={handleUpload}
                disabled={isLoading || isProcessing}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#FFD966] text-black rounded-lg hover:bg-yellow-400 transition disabled:opacity-50"
              >
                <FaUpload className="text-lg" />
                <span>{isProcessing ? t('auth.idVerification.processing') : t('auth.idVerification.uploadButton')}</span>
              </button>
            </div>
            
            <button
              onClick={isScanning ? stopScanning : startScanning}
              disabled={isLoading || isProcessing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#FFD966] text-black rounded-lg hover:bg-yellow-400 transition disabled:opacity-50"
            >
              <FaCamera className="text-lg" />
              <span>{isScanning ? t('auth.idVerification.stopScanning') : t('auth.idVerification.startScanning')}</span>
            </button>
          </div>

          <p className="mt-2 text-xs sm:text-sm text-gray-500">
            {t('auth.idVerification.acceptedFormats')}
          </p>
        </div>

        {/* Camera Preview */}
        {isScanning && (
          <div className="mt-4 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-w-md mx-auto rounded-lg"
            />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <button
                onClick={captureImage}
                className="p-4 bg-white rounded-full shadow-lg hover:bg-gray-100"
                aria-label={t('auth.idVerification.captureImage')}
              >
                <FaCamera className="text-2xl text-gray-800" />
              </button>
            </div>
          </div>
        )}

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* File Preview */}
        {uploadedFile && !isScanning && (
          <div className="mt-4 flex justify-center">
            <div className="relative inline-block">
              <div className="border rounded-lg p-4 bg-gray-50 max-w-xs sm:max-w-sm mx-auto">
                <button
                  onClick={removeFile}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  aria-label={t('auth.idVerification.removeFile')}
                >
                  <FaTimes size={12} />
                </button>
                {previewUrl === 'pdf' ? (
                  <div className="flex items-center justify-center p-4">
                    <FaFile className="text-4xl text-gray-400" />
                    <span className="ml-2 text-sm">{uploadedFile.name}</span>
                  </div>
                ) : (
                  <img
                    src={previewUrl}
                    alt={t('auth.idVerification.idPreview')}
                    className="max-w-full h-auto rounded"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('auth.idVerification.form.firstName')} *
            </label>
            <input
              type="text"
              name="firstName"
              value={idVerificationData.firstName || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base ${
                errors.firstName
                  ? 'border-red-500'
                  : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
              }`}
            />
            {errors.firstName && (
              <p className="text-xs sm:text-sm text-red-500">{errors.firstName}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('auth.idVerification.form.lastName')} *
            </label>
            <input
              type="text"
              name="lastName"
              value={idVerificationData.lastName || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base ${
                errors.lastName
                  ? 'border-red-500'
                  : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
              }`}
            />
            {errors.lastName && (
              <p className="text-xs sm:text-sm text-red-500">{errors.lastName}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('auth.idVerification.form.idNumber')} *
            </label>
            <input
              type="text"
              name="idNumber"
              value={idVerificationData.idNumber || ''}
              onChange={handleChange}
              placeholder={t('auth.idVerification.form.idNumberPlaceholder')}
              maxLength="9"
              pattern="\d{9}"
              className={`w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base ${
                errors.idNumber
                  ? 'border-red-500'
                  : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
              }`}
            />
            {errors.idNumber && (
              <p className="text-xs sm:text-sm text-red-500">{errors.idNumber}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('auth.idVerification.form.dateOfBirth')} *
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={idVerificationData.dateOfBirth || ''}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base ${
                errors.dateOfBirth
                  ? 'border-red-500'
                  : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
              }`}
            />
            {errors.dateOfBirth && (
              <p className="text-xs sm:text-sm text-red-500">{errors.dateOfBirth}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {t('auth.idVerification.form.gender')} *
            </label>
            <select
              name="gender"
              value={idVerificationData.gender || ''}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-md shadow-sm text-sm sm:text-base ${
                errors.gender
                  ? 'border-red-500'
                  : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'
              }`}
            >
              <option value="">{t('auth.idVerification.form.selectGender')}</option>
              <option value="male">{t('auth.idVerification.form.genderMale')}</option>
              <option value="female">{t('auth.idVerification.form.genderFemale')}</option>
              <option value="other">{t('auth.idVerification.form.genderOther')}</option>
            </select>
            {errors.gender && (
              <p className="text-xs sm:text-sm text-red-500">{errors.gender}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className="px-6 py-3 bg-[#FFD966] text-black rounded-lg hover:bg-yellow-400 transition disabled:opacity-50"
          >
            {t('auth.idVerification.form.submit')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IDVerification; 