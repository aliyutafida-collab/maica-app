import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@/lib/types";
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
const USERS_KEY = "@maica_users";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
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
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
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
    const usersData = await AsyncStorage.getItem(USERS_KEY);
    const users = usersData ? JSON.parse(usersData) : [];

    const existingUser = users.find((u: any) => u.email === email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const newUser: User & { password: string } = {
      id: Date.now().toString(),
      email,
      name,
      password,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

    const { password: _, ...userWithoutPassword } = newUser;
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userWithoutPassword));
    setUser(userWithoutPassword);
    setSetupComplete(false);
  }

  async function login(email: string, password: string) {
    const usersData = await AsyncStorage.getItem(USERS_KEY);
    const users = usersData ? JSON.parse(usersData) : [];

    const foundUser = users.find(
      (u: any) => u.email === email && u.password === password
    );

    if (!foundUser) {
      throw new Error("Invalid email or password");
    }

    const { password: _, ...userWithoutPassword } = foundUser;
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userWithoutPassword));
    setUser(userWithoutPassword);
    
    const setupStatus = await AsyncStorage.getItem(`@maica_setup_complete_${userWithoutPassword.id}`);
    setSetupComplete(setupStatus === 'true');

    const biometricEnabled = await isBiometricEnabled();
    if (biometricEnabled) {
      await saveBiometricUser(userWithoutPassword);
    }
  }

  async function loginWithBiometric(): Promise<boolean> {
    const enabled = await isBiometricEnabled();
    if (!enabled) return false;

    const userData = await getBiometricUser();
    if (!userData) return false;

    const authenticated = await authenticateWithBiometric("Unlock MaiCa");
    if (authenticated) {
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(userData));
      setUser(userData);
      const setupStatus = await AsyncStorage.getItem(`@maica_setup_complete_${userData.id}`);
      setSetupComplete(setupStatus === 'true');
      return true;
    }

    return false;
  }

  async function logout() {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
    setSetupComplete(false);
  }

  function completeSetup() {
    setSetupComplete(true);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
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
