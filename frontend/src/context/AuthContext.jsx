import React, { createContext, useContext, useState, useEffect } from 'react';
import { mongoService } from '../config/mongodb';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is authenticated with MongoDB
    const initializeAuth = async () => {
      try {
        if (mongoService.isAuthenticated()) {
          const currentUser = mongoService.getCurrentUser();
          await mongoService.initialize();
          setUser({
            id: currentUser.id,
            email: currentUser.profile.email,
            name: currentUser.profile.email.split('@')[0]
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mongoService.loginUser(email, password);
      
      if (result.success) {
        setUser(result.user);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await mongoService.registerUser(email, password, name);
      
      if (result.success) {
        setUser(result.user);
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await mongoService.logoutUser();
      setUser(null);
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };


  const value = {
    user,
    login,
    register,
    logout,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};