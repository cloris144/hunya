import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserMenu = ({ username }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:bg-gray-700 p-2 rounded-lg transition-colors"
      >
        <User className="w-5 h-5" />
        <span className="text-sm">{username}</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-gray-700 w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              登出
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;