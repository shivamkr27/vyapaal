import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import BusinessSetup from './components/BusinessSetup';
import { User } from './types';
import { getUserBusiness, getUserBusinessByEmail } from './utils/businessUtils';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsBusinessSetup, setNeedsBusinessSetup] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('vyapaal_current_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);

      // For existing users, check if they're associated with any business
      const userBusiness = getUserBusinessByEmail(user.email);
      if (!userBusiness) {
        setNeedsBusinessSetup(true);
      } else {
        setNeedsBusinessSetup(false);
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (user: User, isNewRegistration: boolean = false) => {
    setCurrentUser(user);
    localStorage.setItem('vyapaal_current_user', JSON.stringify(user));

    // Only check for business setup if this is a new registration
    // For existing users (login), check if they have business association
    if (isNewRegistration) {
      setNeedsBusinessSetup(true);
    } else {
      // For existing users, check if they're associated with any business
      const userBusiness = getUserBusinessByEmail(user.email);
      if (!userBusiness) {
        setNeedsBusinessSetup(true);
      } else {
        setNeedsBusinessSetup(false);
      }
    }
  };

  const handleBusinessSetupComplete = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('vyapaal_current_user', JSON.stringify(updatedUser));
    setNeedsBusinessSetup(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setNeedsBusinessSetup(false);
    localStorage.removeItem('vyapaal_current_user');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  // Show business setup if user is logged in but hasn't set up business
  if (currentUser && needsBusinessSetup) {
    return (
      <BusinessSetup
        user={currentUser}
        onComplete={handleBusinessSetupComplete}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <>
      {currentUser ? (
        <Dashboard user={currentUser} onLogout={handleLogout} />
      ) : (
        <LandingPage onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;