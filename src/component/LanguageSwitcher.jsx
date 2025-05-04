import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSwitcher = () => {
  const { language, changeLanguage, t } = useLanguage();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'he', name: 'עברית' },
    { code: 'ru', name: 'Русский' },
    { code: 'ar', name: 'العربية' }
  ];

  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 1000,
      }}
    >
      <select
        value={language}
        onChange={handleLanguageChange}
        aria-label={t('common.switchLanguage')}
        className="rounded-md px-3 py-1 border border-gray-300 bg-white shadow-sm focus:outline-none transition"
        style={{ minWidth: 100 }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher; 