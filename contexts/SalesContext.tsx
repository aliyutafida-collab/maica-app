import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Sale } from "@/src/services/salesService";
import * as salesService from "@/src/services/salesService";
import { useAuth } from "./AuthContext";

interface SalesContextType {
  sales: Sale[];
  isLoading: boolean;
  error: string | null;
  createSale: (data: Omit<Sale, 'id' | 'owner_id' | 'created_at'>) => Promise<void>;
  updateSale: (id: string, data: Partial<Sale>) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  refreshSales: () => Promise<void>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);
const SALES_CACHE = "@maica_sales_cache";

export function SalesProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      refreshSales();
    }
  }, [token]);

  async function refreshSales() {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetched = await salesService.getSales(token);
      setSales(fetched);
      await AsyncStorage.setItem(SALES_CACHE, JSON.stringify(fetched));
    } catch (err) {
      console.error("Failed to fetch sales:", err);
      const cached = await AsyncStorage.getItem(SALES_CACHE);
      if (cached) {
        setSales(JSON.parse(cached));
        setError("Using cached data - offline mode");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load sales");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function createSale(data: Omit<Sale, 'id' | 'owner_id' | 'created_at'>) {
    if (!token) throw new Error("Not authenticated");
    try {
      const created = await salesService.createSale(token, data);
      const updated = [created, ...sales];
      setSales(updated);
      await AsyncStorage.setItem(SALES_CACHE, JSON.stringify(updated));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create sale";
      setError(message);
      throw err;
    }
  }

  async function updateSale(id: string, data: Partial<Sale>) {
    if (!token) throw new Error("Not authenticated");
    try {
      const updated = await salesService.updateSale(token, id, data);
      const newSales = sales.map((s) => (s.id === id ? updated : s));
      setSales(newSales);
      await AsyncStorage.setItem(SALES_CACHE, JSON.stringify(newSales));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update sale";
      setError(message);
      throw err;
    }
  }

  async function deleteSale(id: string) {
    if (!token) throw new Error("Not authenticated");
    try {
      await salesService.deleteSale(token, id);
      const newSales = sales.filter((s) => s.id !== id);
      setSales(newSales);
      await AsyncStorage.setItem(SALES_CACHE, JSON.stringify(newSales));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete sale";
      setError(message);
      throw err;
    }
  }

  return (
    <SalesContext.Provider
      value={{ sales, isLoading, error, createSale, updateSale, deleteSale, refreshSales }}
    >
      {children}
    </SalesContext.Provider>
  );
}

export function useSales() {
  const context = useContext(SalesContext);
  if (!context) throw new Error("useSales must be used within SalesProvider");
  return context;
}
