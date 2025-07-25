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

        // Skip token restoration - use database-only authentication
        console.log('Using database-only authentication - no token restoration');
        setIsLoading(false);
        return;

        // Set the token in the API service
        apiService.setToken(token);

        try {
          // Verify token and get user data
          const response = await apiService.verifyToken();

          if (!response || !response.user) {
            console.error('Invalid response from verify token endpoint');
            // Token cleared from memory automatically
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
          // Token cleared from memory automatically
          apiService.removeToken();
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
        // Clear token on error
        // Token cleared from memory automatically
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

    // Token stored in memory only - no localStorage
    console.log('User logged in - token stored in memory only');

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

    // Clear API token from memory
    apiService.removeToken();

    console.log('User logged out - token cleared from memory');
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