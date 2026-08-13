import React from 'react';
import { Stethoscope } from 'lucide-react';
import './Logo.css'; 

function Logo({ className = "" }) {
  return (
    <div className={`logo-container ${className}`}>
      <div className="logo-icon">
        <Stethoscope className="icon" />
      </div>
      <span className="logo-text">MediCare</span>
    </div>
  );
}

export default Logo;