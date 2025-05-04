import React, { useState } from 'react';
import useSignupStore from '../../store/signupStore';
import { useLanguage } from '../../context/LanguageContext';

const WorkBackground = ({ onComplete }) => {
  const { workData, setWorkData } = useSignupStore();
  const { t } = useLanguage();
  const [formData, setFormData] = useState(workData || {
    retirementStatus: '',
    employmentDate: '',
    employmentType: '',
    lastJobs: [],
    academicDegrees: '',
    currentlyWorking: false,
    dischargeDate: '',
    subspecialty: ''
  });
  const [errors, setErrors] = useState({});

  const jobOptions = [
    'doctor', 'funds', 'sales', 'marketing', 'highTech', 'teaching', 'housewife',
    'admin', 'socialAcademy', 'psychology', 'tourism', 'retailing', 'nursing',
    'engineer', 'management', 'coaching', 'design', 'idf', 'other'
  ];

  const handleJobSelection = (job) => {
    const updatedJobs = formData.lastJobs.includes(job)
      ? formData.lastJobs.filter(j => j !== job)
      : [...formData.lastJobs, job];
    
    setFormData({ ...formData, lastJobs: updatedJobs });
    if (errors.lastJobs) {
      setErrors({ ...errors, lastJobs: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.retirementStatus) {
      newErrors.retirementStatus = t('errors.required');
    }
    
    if (formData.currentlyWorking && !formData.dischargeDate) {
      newErrors.dischargeDate = t('errors.required');
    }
    
    if (formData.lastJobs.length === 0) {
      newErrors.lastJobs = t('errors.required');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setWorkData(formData);
      onComplete();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">{t('auth.workBackground.title')}</h3>
        <p className="mt-1 text-sm text-gray-600">{t('auth.workBackground.subtitle')}</p>
      </div>

      {/* Retirement Status */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">{t('auth.workBackground.retirementStatus.label')}</label>
        <div className="flex gap-4">
          {['notRetired', 'partially', 'full'].map((status) => (
            <label key={status} className="flex items-center">
              <input
                type="radio"
                name="retirementStatus"
                value={status}
                checked={formData.retirementStatus === status}
                onChange={(e) => {
                  setFormData({ ...formData, retirementStatus: e.target.value });
                  if (errors.retirementStatus) {
                    setErrors({ ...errors, retirementStatus: '' });
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm">{t(`auth.workBackground.retirementStatus.options.${status}`)}</span>
            </label>
          ))}
        </div>
        {errors.retirementStatus && (
          <p className="text-sm text-red-500">{errors.retirementStatus}</p>
        )}
      </div>

      {/* Employment Status */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">{t('auth.workBackground.currentEmployment.label')}</label>
        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.currentlyWorking}
              onChange={(e) => {
                setFormData({ ...formData, currentlyWorking: e.target.checked, dischargeDate: '' });
                if (errors.dischargeDate) {
                  setErrors({ ...errors, dischargeDate: '' });
                }
              }}
              className="mr-2"
            />
            <span className="text-sm">{t('auth.workBackground.currentEmployment.yes')}</span>
          </label>
          {formData.currentlyWorking && (
            <div className="flex-1">
              <input
                type="date"
                value={formData.dischargeDate}
                onChange={(e) => {
                  setFormData({ ...formData, dischargeDate: e.target.value });
                  if (errors.dischargeDate) {
                    setErrors({ ...errors, dischargeDate: '' });
                  }
                }}
                className="w-full border rounded-md p-2 text-sm"
                placeholder={t('auth.workBackground.currentEmployment.dischargeDate')}
              />
              {errors.dischargeDate && (
                <p className="text-sm text-red-500">{errors.dischargeDate}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Last Jobs */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">{t('auth.workBackground.lastJobs.label')}</label>
        <div className="grid grid-cols-3 gap-3">
          {jobOptions.map((job) => (
            <label key={job} className="flex items-center p-2 border rounded-md hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.lastJobs.includes(job)}
                onChange={() => handleJobSelection(job)}
                className="mr-2"
              />
              <span className="text-sm">{t(`auth.workBackground.lastJobs.options.${job}`)}</span>
            </label>
          ))}
        </div>
        {errors.lastJobs && (
          <p className="text-sm text-red-500">{errors.lastJobs}</p>
        )}
      </div>

      {/* Subspecialty */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{t('auth.workBackground.subspecialty.label')}</label>
        <input
          type="text"
          value={formData.subspecialty}
          onChange={(e) => setFormData({ ...formData, subspecialty: e.target.value })}
          className="w-full border rounded-md p-2"
          placeholder={t('auth.workBackground.subspecialty.placeholder')}
        />
      </div>

      {/* Academic Degrees */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{t('auth.workBackground.academicDegrees.label')}</label>
        <input
          type="text"
          value={formData.academicDegrees}
          onChange={(e) => setFormData({ ...formData, academicDegrees: e.target.value })}
          className="w-full border rounded-md p-2"
          placeholder={t('auth.workBackground.academicDegrees.placeholder')}
        />
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

export default WorkBackground; 