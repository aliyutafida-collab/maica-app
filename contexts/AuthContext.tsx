import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@/lib/types";
import * as authService from "@/src/services/authService";
import {
  authenticateWithBiometric,
  isBiometricEnabled,
  isBiometricSupported,
  saveBiometricUser,
  getBiometricUser,
  clearBiometricUser,
} from "@/services/biometric";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setupComplete: boolean;
  biometricAvailable: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithBiometric: () => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  completeSetup: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = "@maica_auth";
const TOKEN_KEY = "@maica_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    loadUser();
    checkBiometricSupport();
  }, []);

  async function checkBiometricSupport() {
    const supported = await isBiometricSupported();
    setBiometricAvailable(supported);
  }

  async function loadUser() {
    try {
      const userData = await AsyncStorage.getItem(AUTH_KEY);
      const tokenData = await AsyncStorage.getItem(TOKEN_KEY);
      if (userData && tokenData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setToken(tokenData);
        const setupStatus = await AsyncStorage.getItem(`@maica_setup_complete_${parsedUser.id}`);
        setSetupComplete(setupStatus === 'true');
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function register(name: string, email: string, password: string) {
    try {
      const response = await authService.register(name, email, password);
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      setUser(userData);
      setToken(response.token);
      setSetupComplete(false);
    } catch (error) {
      throw error;
    }
  }

  async function login(email: string, password: string) {
    try {
      const response = await authService.login(email, password);
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      await AsyncStorage.setItem(TOKEN_KEY, response.token);
      setUser(userData);
      setToken(response.token);
      
      const setupStatus = await AsyncStorage.getItem(`@maica_setup_complete_${userData.id}`);
      setSetupComplete(setupStatus === 'true');

      const biometricEnabled = await isBiometricEnabled();
      if (biometricEnabled) {
        await saveBiometricUser(userData);
      }
    } catch (error) {
      throw error;
    }
  }

  async function loginWithBiometric(): Promise<boolean> {
    const enabled = await isBiometricEnabled();
    if (!enabled) return false;

    const userData = await getBiometricUser();
    const cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
    if (!userData || !cachedToken) return false;

    const authenticated = await authenticateWithBiometric("Unlock MaiCa");
    if (authenticated) {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      setUser(userData);
      setToken(cachedToken);
      const setupStatus = await AsyncStorage.getItem(`@maica_setup_complete_${userData.id}`);
      setSetupComplete(setupStatus === 'true');
      return true;
    }

    return false;
  }

  async function logout() {
    await AsyncStorage.removeItem(AUTH_KEY);
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
    setSetupComplete(false);
  }

  function completeSetup() {
    setSetupComplete(true);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        setupComplete,
        biometricAvailable,
        login,
        loginWithBiometric,
        register,
        logout,
        completeSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
