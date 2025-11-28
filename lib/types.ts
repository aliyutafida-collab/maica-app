export interface User {
  id: string;
  email: string;
  name: string;
  companyName?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  taxAmount: number;
  total: number;
  userId: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  userId: string;
  createdAt: string;
}

export type ExpenseCategory =
  | "Inventory"
  | "Utilities"
  | "Salaries"
  | "Rent"
  | "Marketing"
  | "Other";
