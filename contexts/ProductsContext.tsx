import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Product } from "@/src/services/productsService";
import * as productsService from "@/src/services/productsService";
import { useAuth } from "./AuthContext";

interface ProductsContextType {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  createProduct: (data: Omit<Product, 'id' | 'owner_id' | 'created_at'>) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  refreshProducts: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);
const PRODUCTS_CACHE = "@maica_products_cache";

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      refreshProducts();
    }
  }, [token]);

  async function refreshProducts() {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetched = await productsService.getProducts(token);
      setProducts(fetched);
      await AsyncStorage.setItem(PRODUCTS_CACHE, JSON.stringify(fetched));
    } catch (err) {
      console.error("Failed to fetch products:", err);
      const cached = await AsyncStorage.getItem(PRODUCTS_CACHE);
      if (cached) {
        setProducts(JSON.parse(cached));
        setError("Using cached data - offline mode");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load products");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function createProduct(data: Omit<Product, 'id' | 'owner_id' | 'created_at'>) {
    if (!token) throw new Error("Not authenticated");
    try {
      const created = await productsService.createProduct(token, data);
      const updated = [created, ...products];
      setProducts(updated);
      await AsyncStorage.setItem(PRODUCTS_CACHE, JSON.stringify(updated));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create product";
      setError(message);
      throw err;
    }
  }

  async function updateProduct(id: string, data: Partial<Product>) {
    if (!token) throw new Error("Not authenticated");
    try {
      const updated = await productsService.updateProduct(token, id, data);
      const newProducts = products.map((p) => (p.id === id ? updated : p));
      setProducts(newProducts);
      await AsyncStorage.setItem(PRODUCTS_CACHE, JSON.stringify(newProducts));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update product";
      setError(message);
      throw err;
    }
  }

  async function deleteProduct(id: string) {
    if (!token) throw new Error("Not authenticated");
    try {
      await productsService.deleteProduct(token, id);
      const newProducts = products.filter((p) => p.id !== id);
      setProducts(newProducts);
      await AsyncStorage.setItem(PRODUCTS_CACHE, JSON.stringify(newProducts));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete product";
      setError(message);
      throw err;
    }
  }

  return (
    <ProductsContext.Provider
      value={{ products, isLoading, error, createProduct, updateProduct, deleteProduct, refreshProducts }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) throw new Error("useProducts must be used within ProductsProvider");
  return context;
}
