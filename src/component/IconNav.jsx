import React, { useState } from "react";
import { FaBell, FaCog, FaPlusCircle, FaCalendarAlt, FaComments, FaCalendarCheck } from "react-icons/fa";
import IconBox from "./IconBox";
import Cards from "./Cards"; // Import the Cards component
import SettingsCards from "./SettingsCards";
import { useLanguage } from "../context/LanguageContext";

const IconNav = () => {
  const { t } = useLanguage();
  const [selected, setSelected] = useState("upcoming"); // Default selected icon

  const icons = [
    { id: "upcoming", label: t('dashboard.upcomingEvents'), icon: <FaCalendarCheck /> },
    { id: "add", label: t('dashboard.createEvent'), icon: <FaPlusCircle /> },
    { id: "settings", label: t('dashboard.settings'), icon: <FaCog /> },
    { id: "notifications", label: t('dashboard.notifications'), icon: <FaBell /> },
    { id: "calendar", label: t('dashboard.calendar'), icon: <FaCalendarAlt /> },
    { id: "messages", label: t('dashboard.messages'), icon: <FaComments /> }
  ];

  return (
    <div className="">
      {/* Icons Section */}
      <div className="flex justify-around items-center bg-[#ACCFDA] py-3 border-b-1 shadow-md">
        {icons.map(({ id, label, icon }) => (
          <div
            key={id}
            onClick={() => setSelected(id)}
            className={`flex flex-col items-center cursor-pointer transition duration-200 
                        ${selected === id ? "text-orange-500 font-bold" : "text-gray-600 hover:text-orange-400"}`}
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-medium mt-1">{label}</span>
          </div>
        ))}
      </div>

      {/* Selected Box */}
      <IconBox selected={selected} />

      {/* Display event cards only when "Upcoming Events" is selected */}
      {selected === "upcoming" && <Cards />}
      {selected === "settings" && <SettingsCards />}

    </div>
  );
};

export default IconNav;
