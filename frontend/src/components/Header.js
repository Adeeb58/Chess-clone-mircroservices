import React from "react";
import { FaUser, FaRegEnvelope, FaCog, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import "./component-styles/Header.css";

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <div className="header">
      {/* Left side: Hello User */}
      <div className="left">
        <p>Hello, {user?.username || 'User'}</p>
      </div>

      {/* Right side: Icons */}
      <div className="right">
        <FaUser size={20} title="Profile" />
        <FaRegEnvelope size={20} title="Messages" />
        <FaCog size={20} title="Settings" />
        <FaSignOutAlt
          size={20}
          title="Logout"
          onClick={logout}
          style={{ cursor: 'pointer' }}
        />
      </div>
    </div>
  );
};

export default Header;
