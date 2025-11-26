import { API_URL } from '../config';

export interface Sale {
  id: string;
  owner_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount: number;
  tax_amount: number;
  total: number;
  created_at?: string;
}

export async function getSales(token: string): Promise<Sale[]> {
  const res = await fetch(`${API_URL}/sales`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch sales');
  const data = await res.json();
  return Array.isArray(data) ? data : data.sales || [];
}

export async function createSale(
  token: string,
  data: Omit<Sale, 'id' | 'owner_id' | 'created_at'>
): Promise<Sale> {
  const res = await fetch(`${API_URL}/sales`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Create sale failed');
  return res.json();
}

export async function updateSale(
  token: string,
  id: string,
  data: Partial<Sale>
): Promise<Sale> {
  const res = await fetch(`${API_URL}/sales/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Update sale failed');
  return res.json();
}

export async function deleteSale(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/sales/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Delete sale failed');
}
