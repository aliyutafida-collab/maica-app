import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./httpClient";
import type { Product, Sale, Expense } from "@/lib/types";

const PRODUCTS_CACHE_KEY = "@maica_products_cache";
const SALES_CACHE_KEY = "@maica_sales_cache";
const EXPENSES_CACHE_KEY = "@maica_expenses_cache";

async function cacheData(key: string, data: any): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (error) {
    console.error("Failed to cache data:", error);
  }
}

async function getCachedData<T>(key: string, maxAge: number = 5 * 60 * 1000): Promise<T[] | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > maxAge) return null;
    
    return data as T[];
  } catch {
    return null;
  }
}

export async function getProducts(userId: string): Promise<Product[]> {
  const response = await api.get<{ data: any[] }>("/products");
  
  if (response.ok && response.data?.data) {
    const products = response.data.data.map(mapProductFromApi);
    await cacheData(`${PRODUCTS_CACHE_KEY}_${userId}`, products);
    return products;
  }

  const cached = await getCachedData<Product>(`${PRODUCTS_CACHE_KEY}_${userId}`);
  if (cached) return cached;

  console.error("Failed to fetch products:", response.error);
  return [];
}

export async function addProduct(
  userId: string,
  product: { name: string; category?: string; price: number; cost?: number; stock?: number; description?: string }
): Promise<Product> {
  const response = await api.post<{ product: any; ok: boolean }>("/products", {
    name: product.name,
    category: product.category || "General",
    price: product.price,
    cost: product.cost || 0,
    qty: product.stock || 0,
    stock: product.stock || 0,
    description: product.description || "",
  });

  if (!response.ok) {
    if (response.status === 401) {
      const fallbackProduct: Product = {
        id: Date.now().toString(),
        userId,
        name: product.name,
        category: product.category || "General",
        price: product.price,
        cost: product.cost || 0,
        stock: product.stock || 0,
        description: product.description || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const existing = await AsyncStorage.getItem("@maica_products_local");
      const products = existing ? JSON.parse(existing) : [];
      products.push(fallbackProduct);
      await AsyncStorage.setItem("@maica_products_local", JSON.stringify(products));
      return fallbackProduct;
    }
    throw new Error(response.error || "Failed to create product");
  }

  if (!response.data?.product) {
    throw new Error("Invalid response from server");
  }

  return mapProductFromApi(response.data.product);
}

export async function addProducts(
  userId: string,
  products: Array<{ name: string; category?: string; price: number; cost?: number; stock?: number; description?: string }>
): Promise<Product[]> {
  const response = await api.post<{ products: any[]; ok: boolean }>("/products/bulk", {
    products: products.map(p => ({
      name: p.name,
      category: p.category || "General",
      price: p.price,
      cost: p.cost || 0,
      qty: p.stock || 0,
      stock: p.stock || 0,
      description: p.description || "",
    })),
  });

  if (!response.ok) {
    if (response.status === 401) {
      const fallbackProducts: Product[] = products.map((p, index) => ({
        id: (Date.now() + index).toString(),
        userId,
        name: p.name,
        category: p.category || "General",
        price: p.price,
        cost: p.cost || 0,
        stock: p.stock || 0,
        description: p.description || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      const existing = await AsyncStorage.getItem("@maica_products_local");
      const stored = existing ? JSON.parse(existing) : [];
      stored.push(...fallbackProducts);
      await AsyncStorage.setItem("@maica_products_local", JSON.stringify(stored));
      return fallbackProducts;
    }
    throw new Error(response.error || "Failed to create products");
  }

  if (!response.data?.products) {
    throw new Error("Invalid response from server");
  }

  return response.data.products.map(mapProductFromApi);
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const response = await api.put(`/products/${id}`, {
    name: updates.name,
    price: updates.price,
    cost: updates.cost,
    qty: updates.stock,
    category: updates.category,
    description: updates.description,
  });

  if (!response.ok) {
    throw new Error(response.error || "Failed to update product");
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const response = await api.delete(`/products/${id}`);

  if (!response.ok) {
    throw new Error(response.error || "Failed to delete product");
  }
}

export async function getSales(userId: string): Promise<Sale[]> {
  const response = await api.get<{ data: any[] }>("/sales");
  
  if (response.ok && response.data?.data) {
    const sales = response.data.data.map(mapSaleFromApi);
    await cacheData(`${SALES_CACHE_KEY}_${userId}`, sales);
    return sales;
  }

  const cached = await getCachedData<Sale>(`${SALES_CACHE_KEY}_${userId}`);
  if (cached) return cached;

  const localData = await AsyncStorage.getItem("@maica_sales");
  if (localData) {
    const allSales = JSON.parse(localData);
    return allSales.filter((s: Sale) => s.userId === userId);
  }

  return [];
}

export async function addSale(sale: Omit<Sale, "id" | "createdAt">): Promise<Sale> {
  const response = await api.post<{ sale: any }>("/sales", {
    product_id: sale.productId,
    product_name: sale.productName,
    quantity: sale.quantity,
    unit_price: sale.unitPrice,
    tax_rate: sale.taxRate,
    discount: sale.discount,
    tax_amount: sale.taxAmount,
    total: sale.total,
  });

  if (response.ok && response.data?.sale) {
    return mapSaleFromApi(response.data.sale);
  }

  const localData = await AsyncStorage.getItem("@maica_sales");
  const sales = localData ? JSON.parse(localData) : [];
  
  const newSale: Sale = {
    ...sale,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  
  sales.push(newSale);
  await AsyncStorage.setItem("@maica_sales", JSON.stringify(sales));
  return newSale;
}

export async function getExpenses(userId: string): Promise<Expense[]> {
  const response = await api.get<{ data: any[] }>("/expenses");
  
  if (response.ok && response.data?.data) {
    const expenses = response.data.data.map(mapExpenseFromApi);
    await cacheData(`${EXPENSES_CACHE_KEY}_${userId}`, expenses);
    return expenses;
  }

  const cached = await getCachedData<Expense>(`${EXPENSES_CACHE_KEY}_${userId}`);
  if (cached) return cached;

  const localData = await AsyncStorage.getItem("@maica_expenses");
  if (localData) {
    const allExpenses = JSON.parse(localData);
    return allExpenses.filter((e: Expense) => e.userId === userId);
  }

  return [];
}

export async function addExpense(expense: Omit<Expense, "id" | "createdAt">): Promise<Expense> {
  const response = await api.post<{ expense: any }>("/expenses", {
    category: expense.category,
    amount: expense.amount,
    description: expense.description,
  });

  if (response.ok && response.data?.expense) {
    return mapExpenseFromApi(response.data.expense);
  }

  const localData = await AsyncStorage.getItem("@maica_expenses");
  const expenses = localData ? JSON.parse(localData) : [];
  
  const newExpense: Expense = {
    ...expense,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  
  expenses.push(newExpense);
  await AsyncStorage.setItem("@maica_expenses", JSON.stringify(expenses));
  return newExpense;
}

function mapProductFromApi(apiProduct: any): Product {
  return {
    id: apiProduct.id,
    userId: apiProduct.owner_id,
    name: apiProduct.name,
    category: apiProduct.category || "General",
    price: apiProduct.price || 0,
    cost: apiProduct.cost_price || 0,
    stock: apiProduct.qty || 0,
    description: apiProduct.description || "",
    createdAt: apiProduct.created_at,
    updatedAt: apiProduct.updated_at || apiProduct.created_at,
  };
}

function mapSaleFromApi(apiSale: any): Sale {
  return {
    id: apiSale.id,
    userId: apiSale.owner_id,
    productId: apiSale.product_id,
    productName: apiSale.product_name,
    quantity: apiSale.quantity || 0,
    unitPrice: apiSale.unit_price || 0,
    taxRate: apiSale.tax_rate || 0,
    discount: apiSale.discount || 0,
    taxAmount: apiSale.tax_amount || 0,
    total: apiSale.total || 0,
    createdAt: apiSale.created_at,
  };
}

function mapExpenseFromApi(apiExpense: any): Expense {
  return {
    id: apiExpense.id,
    userId: apiExpense.owner_id,
    category: apiExpense.category || "Other",
    amount: apiExpense.amount || 0,
    description: apiExpense.description || "",
    createdAt: apiExpense.created_at,
  };
}
