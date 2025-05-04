import React from "react";
import { FaSearch, FaBell, FaCog, FaPlusCircle, FaCalendarAlt, FaComments, FaCalendarCheck } from "react-icons/fa";
import { MdLanguage } from "react-icons/md";
import profile from "../assets/profile.jpeg";
import IconNav from "./IconNav"; // Importing icon navigation
import LanguageSwitcher from '../components/LanguageSwitcher';
import 'antd/dist/antd.css';

const Header = () => {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between min-w-screen p-4 border-b bg-[#D3D3D3] shadow-md">
        <h1 className="text-2xl font-bold text-orange-500">Golden Generation</h1>

        {/* Search Bar */}
        <div className="flex ml-146 items-center border px-3 py-1 rounded-md bg-gray-100">
          <FaSearch className="text-gray-500" />
          <input type="text" placeholder="Events" className="border-none outline-none text-sm ml-2 bg-gray-100" />
          <span className="ml-2 text-gray-600 text-sm">Search</span>
        </div>

        {/* Language & Profile */}
        <div className="flex items-center mr-11 space-x-4">
          <div className="flex items-center space-x-1">
            <MdLanguage className="text-xl text-gray-600" />
            <LanguageSwitcher />
          </div>
          <img src={profile} alt="Profile" className="w-10 h-10 rounded-full" />
        </div>
      </div>

      {/* Icons + Selected Box */}
      <IconNav />
    </div>
  );
};

export default Header;
