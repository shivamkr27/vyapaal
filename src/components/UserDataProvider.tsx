import React, { createContext, useContext, useMemo } from 'react';
import { User } from '../types';

interface UserDataContextType {
  user: User;
}

const UserDataContext = createContext<UserDataContextType | null>(null);

interface UserDataProviderProps {
  user: User;
  children: React.ReactNode;
}

export const UserDataProvider: React.FC<UserDataProviderProps> = ({ user, children }) => {
  const contextValue = useMemo(() => ({
    user
  }), [user]);

  return (
    <UserDataContext.Provider value={contextValue}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};

// Helper hook to get the user ID directly from the user object
export const useDataUserId = () => {
  const { user } = useUserData();
  return user.id;
};

// Helper hook - always use API only
export const useDataSource = () => {
  return {
    useApi: true
  };
};