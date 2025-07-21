import React, { createContext, useContext, useMemo } from 'react';
import { User } from '../types';
import { getDataUserId } from '../utils/businessUtils';

interface UserDataContextType {
  user: User;
  dataUserId: string | null;
}

const UserDataContext = createContext<UserDataContextType | null>(null);

interface UserDataProviderProps {
  user: User;
  children: React.ReactNode;
}

export const UserDataProvider: React.FC<UserDataProviderProps> = ({ user, children }) => {
  const dataUserId = useMemo(() => getDataUserId(user.email), [user.email]);

  const contextValue = useMemo(() => ({
    user,
    dataUserId
  }), [user, dataUserId]);

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

// Helper hook to get the correct user ID for localStorage operations
export const useDataUserId = () => {
  const { dataUserId } = useUserData();
  return dataUserId;
};

// Helper hook - always use API only
export const useDataSource = () => {
  return {
    useApi: true
  };
};