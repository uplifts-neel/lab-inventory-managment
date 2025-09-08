import React, { useContext } from 'react';
import './Sidebar.css';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Sidebar = ({ isAdmin, isStaff, isTrainee, isGuest }) => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  // Define menu with role-based access
  const menu = [
    { key: 'dashboard', label: 'Dashboard', roles: ['Admin', 'Staff', 'Trainee', 'Guest'] },
    { key: 'assets', label: 'Assets', roles: ['Admin', 'Staff'] },
    { key: 'users', label: 'Users', roles: ['Admin'] },
    { key: 'divisions', label: 'Divisions', roles: ['Admin', 'Staff'] },
    { key: 'assignments', label: 'Assignments', roles: ['Admin', 'Staff'] },
    { key: 'amc', label: 'AMC Tickets', roles: ['Admin', 'Staff', 'Trainee'] },
    { key: 'audit', label: 'Audit Logs', roles: ['Admin'] },
    { key: 'settings', label: 'Settings / Profile', roles: ['Admin', 'Staff', 'Trainee', 'Guest'] },
    { key: 'logout', label: 'Logout', roles: ['Admin', 'Staff', 'Trainee', 'Guest'] },
  ];

  // Determine current role
  let role = 'Guest';
  if (isAdmin) role = 'Admin';
  else if (isStaff) role = 'Staff';
  else if (isTrainee) role = 'Trainee';

  const handleMenuClick = (key) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    } else {
      navigate(`/${key === 'dashboard' ? 'dashboard' : key}`);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-title">Lab Asset Manager</div>
      <ul className="sidebar-list">
        {menu.map(item => {
          if (!item.roles.includes(role)) return null;
          return (
            <li
              key={item.key}
              onClick={() => handleMenuClick(item.key)}
            >
              {item.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Sidebar; 