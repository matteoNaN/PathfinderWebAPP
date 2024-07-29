import React from 'react';
import './RightMenu.css';

const FloatingRightMenu = () => {
  const menuItems = [
    { icon: '⚙️', label: 'Impostazioni' },
    { icon: '📚', label: 'Livelli' },
    { icon: '➕', label: 'aggiungi' },
    { icon: '⬇️', label: 'Scarica' },
    { icon: '🔗', label: 'Condividi' },
  ];

  return (
    <div className="floating-menu">
      {menuItems.map((item, index) => (
        <div key={index} className="menu-item" title={item.label}>
          {item.icon}
        </div>
      ))}
    </div>
  );
};

export default FloatingRightMenu;