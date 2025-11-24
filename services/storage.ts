import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Product, Sale, Expense } from "@/lib/types";

const PRODUCTS_KEY = "@maica_products";
const SALES_KEY = "@maica_sales";
const EXPENSES_KEY = "@maica_expenses";

export async function getProducts(userId: string): Promise<Product[]> {
  const data = await AsyncStorage.getItem(PRODUCTS_KEY);
  const allProducts = data ? JSON.parse(data) : [];
  return allProducts.filter((p: Product) => p.userId === userId);
}

export async function addProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
  const data = await AsyncStorage.getItem(PRODUCTS_KEY);
  const products = data ? JSON.parse(data) : [];

  const newProduct: Product = {
    ...product,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  products.push(newProduct);
  await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  return newProduct;
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>
): Promise<void> {
  const data = await AsyncStorage.getItem(PRODUCTS_KEY);
  const products = data ? JSON.parse(data) : [];

  const index = products.findIndex((p: Product) => p.id === id);
  if (index !== -1) {
    products[index] = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const data = await AsyncStorage.getItem(PRODUCTS_KEY);
  const products = data ? JSON.parse(data) : [];
  const filtered = products.filter((p: Product) => p.id !== id);
  await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));
}

export async function getSales(userId: string): Promise<Sale[]> {
  const data = await AsyncStorage.getItem(SALES_KEY);
  const allSales = data ? JSON.parse(data) : [];
  return allSales.filter((s: Sale) => s.userId === userId);
}

export async function addSale(sale: Omit<Sale, "id" | "createdAt">): Promise<Sale> {
  const data = await AsyncStorage.getItem(SALES_KEY);
  const sales = data ? JSON.parse(data) : [];

  const newSale: Sale = {
    ...sale,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };

  sales.push(newSale);
  await AsyncStorage.setItem(SALES_KEY, JSON.stringify(sales));
  return newSale;
}

export async function getExpenses(userId: string): Promise<Expense[]> {
  const data = await AsyncStorage.getItem(EXPENSES_KEY);
  const allExpenses = data ? JSON.parse(data) : [];
  return allExpenses.filter((e: Expense) => e.userId === userId);
}

export async function addExpense(expense: Omit<Expense, "id" | "createdAt">): Promise<Expense> {
  const data = await AsyncStorage.getItem(EXPENSES_KEY);
  const expenses = data ? JSON.parse(data) : [];

  const newExpense: Expense = {
    ...expense,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };

  expenses.push(newExpense);
  await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  return newExpense;
}
