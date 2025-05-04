import React, { useState } from 'react';
import useSignupStore from '../../store/signupStore';
import { useLanguage } from '../../context/LanguageContext';

const PersonalDetails = ({ onComplete }) => {
  const { personalData, updatePersonalData } = useSignupStore();
  const { t } = useLanguage();
  
  // Initialize form data from store only once
  const [formData, setFormData] = useState(() => ({
    phoneNumber: personalData?.phoneNumber || '',
    maritalStatus: personalData?.maritalStatus || '',
    address: personalData?.address || '',
    nativeLanguage: personalData?.nativeLanguage || '',
    hebrewLevel: personalData?.hebrewLevel || '',
    arrivalDate: personalData?.arrivalDate || '',
    originCountry: personalData?.originCountry || '',
    healthCondition: personalData?.healthCondition || '',
    militaryService: personalData?.militaryService || '',
    hasCar: personalData?.hasCar || false,
    livingAlone: personalData?.livingAlone || false,
    familyInSettlement: personalData?.familyInSettlement || false,
    hasWeapon: personalData?.hasWeapon || false
  }));

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.address) newErrors.address = t('errors.required');
    if (!formData.phoneNumber) newErrors.phoneNumber = t('errors.required');
    if (!formData.nativeLanguage) newErrors.nativeLanguage = t('errors.required');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      updatePersonalData(formData);
      onComplete();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('auth.personalDetails.title')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('auth.personalDetails.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Phone Number */}
          <div className="space-y-1">
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              {t('auth.personalDetails.phone.label', 'Phone Number')}
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg shadow-sm text-sm sm:text-base transition-colors duration-200 ${errors.phoneNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'} border`}
              placeholder={t('auth.personalDetails.phone.placeholder', 'Enter your phone number')}
            />
            {errors.phoneNumber && (
              <p className="text-xs sm:text-sm text-red-500">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Marital Status */}
          <div className="space-y-1">
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              {t('auth.personalDetails.maritalStatus.label', 'Marital Status')}
            </label>
            <select
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg shadow-sm text-sm sm:text-base transition-colors duration-200 ${errors.maritalStatus ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'} border`}
            >
              <option value="">{t('auth.personalDetails.maritalStatus.placeholder', 'Select your marital status')}</option>
              <option value="single">{t('auth.personalDetails.maritalStatus.options.single', 'Single')}</option>
              <option value="married">{t('auth.personalDetails.maritalStatus.options.married', 'Married')}</option>
              <option value="divorced">{t('auth.personalDetails.maritalStatus.options.divorced', 'Divorced')}</option>
              <option value="widowed">{t('auth.personalDetails.maritalStatus.options.widowed', 'Widowed')}</option>
            </select>
            {errors.maritalStatus && (
              <p className="text-xs sm:text-sm text-red-500">{errors.maritalStatus}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              {t('auth.personalDetails.address.label', 'Address')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 rounded-lg shadow-sm text-sm sm:text-base transition-colors duration-200 ${errors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'} border`}
              placeholder={t('auth.personalDetails.address.placeholder', 'Enter your full address')}
            />
            {errors.address && (
              <p className="text-xs sm:text-sm text-red-500">{errors.address}</p>
            )}
          </div>

          {/* Native Language */}
          <div className="space-y-1">
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              {t('auth.personalDetails.nativeLanguage.label', 'Native Language')}
            </label>
            <input
              type="text"
              name="nativeLanguage"
              value={formData.nativeLanguage}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg shadow-sm text-sm sm:text-base transition-colors duration-200 ${errors.nativeLanguage ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'} border`}
              placeholder={t('auth.personalDetails.nativeLanguage.placeholder', 'Enter your native language')}
            />
            {errors.nativeLanguage && (
              <p className="text-xs sm:text-sm text-red-500">{errors.nativeLanguage}</p>
            )}
          </div>

          {/* Hebrew Level */}
          <div className="space-y-1">
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              {t('auth.personalDetails.hebrewLevel.label', 'Hebrew Level')}
            </label>
            <input
              type="text"
              name="hebrewLevel"
              value={formData.hebrewLevel}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg shadow-sm text-sm sm:text-base transition-colors duration-200 ${errors.hebrewLevel ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'} border`}
              placeholder={t('auth.personalDetails.hebrewLevel.placeholder', 'Enter your Hebrew level')}
            />
            {errors.hebrewLevel && (
              <p className="text-xs sm:text-sm text-red-500">{errors.hebrewLevel}</p>
            )}
          </div>

          {/* Arrival Date */}
          <div className="space-y-1">
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              {t('auth.personalDetails.arrivalDate.label', 'Arrival Date')}
            </label>
            <input
              type="date"
              name="arrivalDate"
              value={formData.arrivalDate}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg shadow-sm text-sm sm:text-base transition-colors duration-200 ${errors.arrivalDate ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'} border`}
            />
            {errors.arrivalDate && (
              <p className="text-xs sm:text-sm text-red-500">{errors.arrivalDate}</p>
            )}
          </div>

          {/* Origin Country */}
          <div className="space-y-1">
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              {t('auth.personalDetails.originCountry.label', 'Origin Country')}
            </label>
            <input
              type="text"
              name="originCountry"
              value={formData.originCountry}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg shadow-sm text-sm sm:text-base transition-colors duration-200 ${errors.originCountry ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'} border`}
              placeholder={t('auth.personalDetails.originCountry.placeholder', 'Enter your country of origin')}
            />
            {errors.originCountry && (
              <p className="text-xs sm:text-sm text-red-500">{errors.originCountry}</p>
            )}
          </div>

          {/* Health Condition */}
          <div className="space-y-1">
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              {t('auth.personalDetails.healthCondition.label', 'Health Condition')}
            </label>
            <input
              type="text"
              name="healthCondition"
              value={formData.healthCondition}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg shadow-sm text-sm sm:text-base transition-colors duration-200 ${errors.healthCondition ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'} border`}
              placeholder={t('auth.personalDetails.healthCondition.placeholder', 'Enter your health condition')}
            />
            {errors.healthCondition && (
              <p className="text-xs sm:text-sm text-red-500">{errors.healthCondition}</p>
            )}
          </div>

          {/* Military Service */}
          <div className="space-y-1">
            <label className="block text-sm sm:text-base font-medium text-gray-700">
              {t('auth.personalDetails.militaryService.label', 'Military Service')}
            </label>
            <input
              type="text"
              name="militaryService"
              value={formData.militaryService}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg shadow-sm text-sm sm:text-base transition-colors duration-200 ${errors.militaryService ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-[#FFD966] focus:ring-[#FFD966]'} border`}
              placeholder={t('auth.personalDetails.militaryService.placeholder', 'Enter your military service')}
            />
            {errors.militaryService && (
              <p className="text-xs sm:text-sm text-red-500">{errors.militaryService}</p>
            )}
          </div>
        </div>

        {/* Checkbox Fields */}
        <div className="mt-6">
          <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
            {t('auth.personalDetails.additionalOptions', 'Additional Options')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="flex items-center gap-2 text-sm sm:text-base font-normal text-gray-700">
              <input type="checkbox" name="hasCar" checked={formData.hasCar} onChange={handleChange} className="h-4 w-4 text-[#FFD966] border-gray-300 rounded" />
              {t('auth.personalDetails.hasCar.label', 'Has Car')}
            </label>
            <label className="flex items-center gap-2 text-sm sm:text-base font-normal text-gray-700">
              <input type="checkbox" name="livingAlone" checked={formData.livingAlone} onChange={handleChange} className="h-4 w-4 text-[#FFD966] border-gray-300 rounded" />
              {t('auth.personalDetails.livingAlone.label', 'Living Alone')}
            </label>
            <label className="flex items-center gap-2 text-sm sm:text-base font-normal text-gray-700">
              <input type="checkbox" name="familyInSettlement" checked={formData.familyInSettlement} onChange={handleChange} className="h-4 w-4 text-[#FFD966] border-gray-300 rounded" />
              {t('auth.personalDetails.familyInSettlement.label', 'Family in Settlement')}
            </label>
            <label className="flex items-center gap-2 text-sm sm:text-base font-normal text-gray-700">
              <input type="checkbox" name="hasWeapon" checked={formData.hasWeapon} onChange={handleChange} className="h-4 w-4 text-[#FFD966] border-gray-300 rounded" />
              {t('auth.personalDetails.hasWeapon.label', 'Has Weapon')}
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6">
          <button
            type="submit"
            className="w-full bg-[#FFD966] hover:bg-[#FFB800] text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {t('common.continue')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonalDetails;