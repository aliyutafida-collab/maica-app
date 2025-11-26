import { API_URL } from '../config';

export interface Product {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  price: number;
  cost_price: number;
  qty: number;
  description?: string;
  created_at?: string;
}

export async function getProducts(token: string): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch products');
  const data = await res.json();
  return Array.isArray(data) ? data : data.products || [];
}

export async function createProduct(
  token: string,
  data: Omit<Product, 'id' | 'owner_id' | 'created_at'>
): Promise<Product> {
  const res = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Create product failed');
  return res.json();
}

export async function updateProduct(
  token: string,
  id: string,
  data: Partial<Product>
): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Update product failed');
  return res.json();
}

export async function deleteProduct(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Delete product failed');
}
