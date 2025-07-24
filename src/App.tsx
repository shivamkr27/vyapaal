import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import BusinessSetup from './components/BusinessSetup';
import { User } from './types';
import apiService from './services/api';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsBusinessSetup, setNeedsBusinessSetup] = useState(false);

  // Check for existing token and restore session
  useEffect(() => {
    // Function to restore session from localStorage
    const restoreSession = async () => {
      try {
        setIsLoading(true);

        // Get token from localStorage (more persistent than sessionStorage)
        const token = localStorage.getItem('authToken');

        if (!token) {
          console.log('No token found in localStorage');
          setIsLoading(false);
          return;
        }

        console.log('Token found in localStorage, attempting to restore session');

        // Set the token in the API service
        apiService.setToken(token);

        try {
          // Verify token and get user data
          const response = await apiService.verifyToken();

          if (!response || !response.user) {
            console.error('Invalid response from verify token endpoint');
            localStorage.removeItem('authToken');
            apiService.removeToken();
            setIsLoading(false);
            return;
          }

          console.log('Session restored successfully', response.user);

          // Update user state
          setCurrentUser(response.user);

          // Check if business setup is needed
          if (!response.user.business || !response.user.business.businessName) {
            setNeedsBusinessSetup(true);
          } else {
            setNeedsBusinessSetup(false);
          }
        } catch (apiError) {
          console.error('API error during session restore:', apiError);
          localStorage.removeItem('authToken');
          apiService.removeToken();
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        // Clear token on error
        localStorage.removeItem('authToken');
        apiService.removeToken();
      } finally {
        setIsLoading(false);
      }
    };

    // Call the restore session function
    restoreSession();
  }, []);

  const handleLogin = (user: User, token: string, isNewRegistration: boolean = false) => {
    // Save user and token
    setCurrentUser(user);
    apiService.setToken(token);

    // Store token in localStorage for persistence
    localStorage.setItem('authToken', token);

    console.log('User logged in and token saved to localStorage');

    // Check if business setup is needed based on database data
    if (isNewRegistration || !user.business || !user.business.businessName) {
      setNeedsBusinessSetup(true);
    } else {
      setNeedsBusinessSetup(false);
    }
  };

  const handleBusinessSetupComplete = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setNeedsBusinessSetup(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setNeedsBusinessSetup(false);

    // Clear API token and localStorage
    apiService.removeToken();
    localStorage.removeItem('authToken');

    console.log('User logged out and token removed from localStorage');
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