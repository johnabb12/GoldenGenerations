import React, { useState } from 'react';
import useSignupStore from '../../store/signupStore';
import { useLanguage } from '../../context/LanguageContext';

const VeteransCommunity = ({ onComplete }) => {
  const { veteransData, setVeteransData } = useSignupStore();
  const { t } = useLanguage();

  const [formData, setFormData] = useState(() => ({
    ...veteransData,
    currentActivities: veteransData?.currentActivities || [],
    notParticipatingReason: veteransData?.notParticipatingReason || '',
    isVolunteer: veteransData?.isVolunteer || false,
    volunteerAreas: veteransData?.volunteerAreas || [],
    volunteerFrequency: veteransData?.volunteerFrequency || '',
    volunteerHours: veteransData?.volunteerHours || '',
    volunteerDays: veteransData?.volunteerDays || [],
    additionalVolunteering: veteransData?.additionalVolunteering || false,
    additionalVolunteerFields: veteransData?.additionalVolunteerFields || [],
    additionalVolunteerFrequency: veteransData?.additionalVolunteerFrequency || '',
    additionalVolunteerHours: veteransData?.additionalVolunteerHours || '',
    additionalVolunteerDays: veteransData?.additionalVolunteerDays || [],
    needsConsultation: veteransData?.needsConsultation || false,
    consultationFields: veteransData?.consultationFields || []
  }));

  const activityOptions = [
    'cooking', 'trips', 'choir', 'torahClasses', 'lectures', 'exercise'
  ];
  const reasonOptions = [
    'noChallenge', 'notRelevant', 'noInfo', 'notInteresting', 'noTime'
  ];
  const volunteerAreaOptions = [
    'publicity', 'health', 'eater', 'teaching', 'highTech', 'tourism',
    'safety', 'funds', 'specialTreat', 'craftsmanship', 'aaliyah', 'culture'
  ];
  const frequencyOptions = [
    'onceMonth', 'onceTwoWeeks', 'onceWeek', 'twiceWeek'
  ];
  const timeOptions = ['morning', 'noon', 'evening'];
  const dayOptions = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
  ];
  const consultationOptions = [
    'company', 'gardening', 'health', 'nutrition', 'homeEconomics', 'houseOrder',
    'marketing', 'shopping', 'mobility', 'digital', 'legal', 'psychology', 'houseRules', 'sport'
  ];

  const handleArraySelection = (field, value) => {
    setFormData(prev => {
      const currentArray = prev[field] || [];
      const updatedArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return {
        ...prev,
        [field]: updatedArray
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ensure arrays are initialized even if empty
    const finalData = {
      ...formData,
      currentActivities: formData.currentActivities || [],
      volunteerAreas: formData.volunteerAreas || [],
      volunteerDays: formData.volunteerDays || [],
      additionalVolunteerFields: formData.additionalVolunteerFields || [],
      additionalVolunteerDays: formData.additionalVolunteerDays || [],
      consultationFields: formData.consultationFields || []
    };
    // If not participating in activities, ensure reason is set
    if (finalData.currentActivities.length === 0 && !finalData.notParticipatingReason) {
      finalData.notParticipatingReason = reasonOptions[0];
    }
    setVeteransData(finalData);
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">{t('auth.veteransCommunity.title')}</h3>
        <p className="mt-1 text-sm text-gray-600">{t('auth.veteransCommunity.subtitle')}</p>
      </div>

      {/* Current Activities */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">{t('auth.veteransCommunity.currentActivities.label')}</label>
        <div className="grid grid-cols-2 gap-3">
          {activityOptions.map((activity) => (
            <label key={activity} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.currentActivities?.includes(activity)}
                onChange={() => handleArraySelection('currentActivities', activity)}
                className="mr-2"
              />
              <span className="text-sm">{t(`auth.veteransCommunity.currentActivities.options.${activity}`)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Reason for Not Participating */}
      {(!formData.currentActivities || formData.currentActivities.length === 0) && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">{t('auth.veteransCommunity.notParticipating.label')}</label>
          <select
            value={formData.notParticipatingReason}
            onChange={(e) => setFormData({ ...formData, notParticipatingReason: e.target.value })}
            className="w-full border rounded-md p-2"
          >
            <option value="">{t('auth.veteransCommunity.notParticipating.placeholder')}</option>
            {reasonOptions.map((reason) => (
              <option key={reason} value={reason}>{t(`auth.veteransCommunity.notParticipating.options.${reason}`)}</option>
            ))}
          </select>
        </div>
      )}

      {/* Volunteering Section */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">{t('auth.veteransCommunity.volunteering.isVolunteer.label')}</label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isVolunteer}
            onChange={(e) => setFormData({ ...formData, isVolunteer: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm">{t('common.yes')}</span>
        </label>

        {formData.isVolunteer && (
          <div className="space-y-4 pl-4">
            {/* Volunteer Areas */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('auth.veteransCommunity.volunteering.areas.label')}</label>
              <div className="grid grid-cols-2 gap-3">
                {volunteerAreaOptions.map((area) => (
                  <label key={area} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.volunteerAreas?.includes(area)}
                      onChange={() => handleArraySelection('volunteerAreas', area)}
                      className="mr-2"
                    />
                    <span className="text-sm">{t(`auth.veteransCommunity.volunteering.areas.options.${area}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('auth.veteransCommunity.volunteering.frequency.label')}</label>
              <select
                value={formData.volunteerFrequency}
                onChange={(e) => setFormData({ ...formData, volunteerFrequency: e.target.value })}
                className="w-full border rounded-md p-2"
              >
                <option value="">{t('auth.veteransCommunity.volunteering.frequency.placeholder')}</option>
                {frequencyOptions.map((freq) => (
                  <option key={freq} value={freq}>{t(`auth.veteransCommunity.volunteering.frequency.options.${freq}`)}</option>
                ))}
              </select>
            </div>

            {/* Hours */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('auth.veteransCommunity.volunteering.hours.label')}</label>
              <select
                value={formData.volunteerHours}
                onChange={(e) => setFormData({ ...formData, volunteerHours: e.target.value })}
                className="w-full border rounded-md p-2"
              >
                <option value="">{t('auth.veteransCommunity.volunteering.hours.placeholder')}</option>
                {timeOptions.map((time) => (
                  <option key={time} value={time}>{t(`auth.veteransCommunity.volunteering.hours.options.${time}`)}</option>
                ))}
              </select>
            </div>

            {/* Days */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('auth.veteransCommunity.volunteering.days.label')}</label>
              <div className="grid grid-cols-3 gap-3">
                {dayOptions.map((day) => (
                  <label key={day} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.volunteerDays?.includes(day)}
                      onChange={() => handleArraySelection('volunteerDays', day)}
                      className="mr-2"
                    />
                    <span className="text-sm">{t(`auth.veteransCommunity.volunteering.days.options.${day}`)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Additional Volunteering */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">{t('auth.veteransCommunity.additionalVolunteering.label')}</label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.additionalVolunteering}
            onChange={(e) => setFormData({ ...formData, additionalVolunteering: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm">{t('common.yes')}</span>
        </label>

        {formData.additionalVolunteering && (
          <div className="space-y-4 pl-4">
            {/* Additional Volunteer Fields */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('auth.veteransCommunity.additionalVolunteering.areas.label')}</label>
              <div className="grid grid-cols-2 gap-3">
                {volunteerAreaOptions.map((area) => (
                  <label key={area} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.additionalVolunteerFields?.includes(area)}
                      onChange={() => handleArraySelection('additionalVolunteerFields', area)}
                      className="mr-2"
                    />
                    <span className="text-sm">{t(`auth.veteransCommunity.volunteering.areas.options.${area}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Frequency */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('auth.veteransCommunity.additionalVolunteering.frequency.label')}</label>
              <select
                value={formData.additionalVolunteerFrequency}
                onChange={(e) => setFormData({ ...formData, additionalVolunteerFrequency: e.target.value })}
                className="w-full border rounded-md p-2"
              >
                <option value="">{t('auth.veteransCommunity.volunteering.frequency.placeholder')}</option>
                {frequencyOptions.map((freq) => (
                  <option key={freq} value={freq}>{t(`auth.veteransCommunity.volunteering.frequency.options.${freq}`)}</option>
                ))}
              </select>
            </div>

            {/* Additional Hours */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('auth.veteransCommunity.additionalVolunteering.hours.label')}</label>
              <select
                value={formData.additionalVolunteerHours}
                onChange={(e) => setFormData({ ...formData, additionalVolunteerHours: e.target.value })}
                className="w-full border rounded-md p-2"
              >
                <option value="">{t('auth.veteransCommunity.volunteering.hours.placeholder')}</option>
                {timeOptions.map((time) => (
                  <option key={time} value={time}>{t(`auth.veteransCommunity.volunteering.hours.options.${time}`)}</option>
                ))}
              </select>
            </div>

            {/* Additional Days */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">{t('auth.veteransCommunity.additionalVolunteering.days.label')}</label>
              <div className="grid grid-cols-3 gap-3">
                {dayOptions.map((day) => (
                  <label key={day} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.additionalVolunteerDays?.includes(day)}
                      onChange={() => handleArraySelection('additionalVolunteerDays', day)}
                      className="mr-2"
                    />
                    <span className="text-sm">{t(`auth.veteransCommunity.volunteering.days.options.${day}`)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Consultation Needs */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">{t('auth.veteransCommunity.consultation.label')}</label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.needsConsultation}
            onChange={(e) => setFormData({ ...formData, needsConsultation: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm">{t('common.yes')}</span>
        </label>

        {formData.needsConsultation && (
          <div className="space-y-4 pl-4">
            <label className="block text-sm font-medium text-gray-700">{t('auth.veteransCommunity.consultation.fieldsLabel')}</label>
            <div className="grid grid-cols-2 gap-3">
              {consultationOptions.map((field) => (
                <label key={field} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.consultationFields?.includes(field)}
                    onChange={() => handleArraySelection('consultationFields', field)}
                    className="mr-2"
                  />
                  <span className="text-sm">{t(`auth.veteransCommunity.consultation.options.${field}`)}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-[#FFD966] hover:bg-[#FFB800] text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
      >
        {t('common.continue')}
      </button>
    </form>
  );
};

export default VeteransCommunity; 