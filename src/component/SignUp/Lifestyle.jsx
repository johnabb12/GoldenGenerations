import React, { useState } from 'react';
import useSignupStore from '../../store/signupStore';
import { useLanguage } from '../../context/LanguageContext';

const Lifestyle = ({ onComplete }) => {
  const { lifestyleData, setLifestyleData } = useSignupStore();
  const { t } = useLanguage();
  const [formData, setFormData] = useState(lifestyleData || {
    computerAbility: 0,
    sportActivity: 0,
    weeklySchedule: 0,
    interests: [],
    sportsSubspecialty: ''
  });
  const [errors, setErrors] = useState({});

  const interestOptions = [
    'books', 'culture', 'cooking', 'trips', 'photography', 'sport',
    'other', 'none', 'study', 'gardening', 'computer', 'craftsmanship'
  ];

  const handleInterestSelection = (interest) => {
    const updatedInterests = formData.interests.includes(interest)
      ? formData.interests.filter(i => i !== interest)
      : [...formData.interests, interest];
    
    setFormData({ ...formData, interests: updatedInterests });
    if (errors.interests) {
      setErrors({ ...errors, interests: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.computerAbility === undefined) {
      newErrors.computerAbility = t('errors.required');
    }
    
    if (formData.sportActivity === undefined) {
      newErrors.sportActivity = t('errors.required');
    }
    
    if (formData.weeklySchedule === undefined) {
      newErrors.weeklySchedule = t('errors.required');
    }
    
    if (formData.interests.length === 0) {
      newErrors.interests = t('errors.required');
    }
    
    if (formData.interests.includes('sport') && !formData.sportsSubspecialty) {
      newErrors.sportsSubspecialty = t('errors.required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setLifestyleData(formData);
      onComplete();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">{t('auth.lifestyle.title')}</h3>
        <p className="mt-1 text-sm text-gray-600">{t('auth.lifestyle.subtitle')}</p>
      </div>

      {/* Computer/Smartphone Ability */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          {t('auth.lifestyle.computerAbility.label')}
        </label>
        <div className="flex justify-between gap-2">
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <label key={level} className="flex flex-col items-center">
              <input
                type="radio"
                name="computerAbility"
                value={level}
                checked={formData.computerAbility === level}
                onChange={(e) => {
                  setFormData({ ...formData, computerAbility: Number(e.target.value) });
                  if (errors.computerAbility) {
                    setErrors({ ...errors, computerAbility: '' });
                  }
                }}
                className="mb-1"
              />
              <span className="text-sm">{t(`auth.lifestyle.computerAbility.levels.${level}`)}</span>
            </label>
          ))}
        </div>
        {errors.computerAbility && (
          <p className="text-sm text-red-500">{errors.computerAbility}</p>
        )}
      </div>

      {/* Sport Activity Level */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          {t('auth.lifestyle.sportActivity.label')}
        </label>
        <div className="flex justify-between gap-2">
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <label key={level} className="flex flex-col items-center">
              <input
                type="radio"
                name="sportActivity"
                value={level}
                checked={formData.sportActivity === level}
                onChange={(e) => {
                  setFormData({ ...formData, sportActivity: Number(e.target.value) });
                  if (errors.sportActivity) {
                    setErrors({ ...errors, sportActivity: '' });
                  }
                }}
                className="mb-1"
              />
              <span className="text-sm">{t(`auth.lifestyle.sportActivity.levels.${level}`)}</span>
            </label>
          ))}
        </div>
        {errors.sportActivity && (
          <p className="text-sm text-red-500">{errors.sportActivity}</p>
        )}
      </div>

      {/* Weekly Schedule Occupancy */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          {t('auth.lifestyle.weeklySchedule.label')}
        </label>
        <div className="flex justify-between gap-2">
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <label key={level} className="flex flex-col items-center">
              <input
                type="radio"
                name="weeklySchedule"
                value={level}
                checked={formData.weeklySchedule === level}
                onChange={(e) => {
                  setFormData({ ...formData, weeklySchedule: Number(e.target.value) });
                  if (errors.weeklySchedule) {
                    setErrors({ ...errors, weeklySchedule: '' });
                  }
                }}
                className="mb-1"
              />
              <span className="text-sm">{t(`auth.lifestyle.weeklySchedule.levels.${level}`)}</span>
            </label>
          ))}
        </div>
        {errors.weeklySchedule && (
          <p className="text-sm text-red-500">{errors.weeklySchedule}</p>
        )}
      </div>

      {/* Interests */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">{t('auth.lifestyle.interests.label')}</label>
        <div className="grid grid-cols-3 gap-3">
          {interestOptions.map((interest) => (
            <label key={interest} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.interests.includes(interest)}
                onChange={() => handleInterestSelection(interest)}
                className="mr-2"
              />
              <span className="text-sm">{t(`auth.lifestyle.interests.options.${interest}`)}</span>
            </label>
          ))}
        </div>
        {errors.interests && (
          <p className="text-sm text-red-500">{errors.interests}</p>
        )}
      </div>

      {/* Sports Subspecialty */}
      {formData.interests.includes('sport') && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">{t('auth.lifestyle.sportsSubspecialty.label')}</label>
          <input
            type="text"
            value={formData.sportsSubspecialty}
            onChange={(e) => {
              setFormData({ ...formData, sportsSubspecialty: e.target.value });
              if (errors.sportsSubspecialty) {
                setErrors({ ...errors, sportsSubspecialty: '' });
              }
            }}
            className="w-full border rounded-md p-2"
            placeholder={t('auth.lifestyle.sportsSubspecialty.placeholder')}
          />
          {errors.sportsSubspecialty && (
            <p className="text-sm text-red-500">{errors.sportsSubspecialty}</p>
          )}
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-[#FFD966] hover:bg-[#FFB800] text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
      >
        {t('common.continue')}
      </button>
    </form>
  );
};

export default Lifestyle; 