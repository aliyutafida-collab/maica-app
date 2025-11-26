import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Expense } from "@/src/services/expensesService";
import * as expensesService from "@/src/services/expensesService";
import { useAuth } from "./AuthContext";

interface ExpensesContextType {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  createExpense: (data: Omit<Expense, 'id' | 'owner_id' | 'created_at'>) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  refreshExpenses: () => Promise<void>;
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined);
const EXPENSES_CACHE = "@maica_expenses_cache";

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      refreshExpenses();
    }
  }, [token]);

  async function refreshExpenses() {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetched = await expensesService.getExpenses(token);
      setExpenses(fetched);
      await AsyncStorage.setItem(EXPENSES_CACHE, JSON.stringify(fetched));
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
      const cached = await AsyncStorage.getItem(EXPENSES_CACHE);
      if (cached) {
        setExpenses(JSON.parse(cached));
        setError("Using cached data - offline mode");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load expenses");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function createExpense(data: Omit<Expense, 'id' | 'owner_id' | 'created_at'>) {
    if (!token) throw new Error("Not authenticated");
    try {
      const created = await expensesService.createExpense(token, data);
      const updated = [created, ...expenses];
      setExpenses(updated);
      await AsyncStorage.setItem(EXPENSES_CACHE, JSON.stringify(updated));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create expense";
      setError(message);
      throw err;
    }
  }

  async function updateExpense(id: string, data: Partial<Expense>) {
    if (!token) throw new Error("Not authenticated");
    try {
      const updated = await expensesService.updateExpense(token, id, data);
      const newExpenses = expenses.map((e) => (e.id === id ? updated : e));
      setExpenses(newExpenses);
      await AsyncStorage.setItem(EXPENSES_CACHE, JSON.stringify(newExpenses));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update expense";
      setError(message);
      throw err;
    }
  }

  async function deleteExpense(id: string) {
    if (!token) throw new Error("Not authenticated");
    try {
      await expensesService.deleteExpense(token, id);
      const newExpenses = expenses.filter((e) => e.id !== id);
      setExpenses(newExpenses);
      await AsyncStorage.setItem(EXPENSES_CACHE, JSON.stringify(newExpenses));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete expense";
      setError(message);
      throw err;
    }
  }

  return (
    <ExpensesContext.Provider
      value={{ expenses, isLoading, error, createExpense, updateExpense, deleteExpense, refreshExpenses }}
    >
      {children}
    </ExpensesContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpensesContext);
  if (!context) throw new Error("useExpenses must be used within ExpensesProvider");
  return context;
}
