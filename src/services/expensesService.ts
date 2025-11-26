import { API_URL } from '../config';

export interface Expense {
  id: string;
  owner_id: string;
  category: string;
  amount: number;
  description?: string;
  created_at?: string;
}

export async function getExpenses(token: string): Promise<Expense[]> {
  const res = await fetch(`${API_URL}/expenses`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch expenses');
  const data = await res.json();
  return Array.isArray(data) ? data : data.expenses || [];
}

export async function createExpense(
  token: string,
  data: Omit<Expense, 'id' | 'owner_id' | 'created_at'>
): Promise<Expense> {
  const res = await fetch(`${API_URL}/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Create expense failed');
  return res.json();
}

export async function updateExpense(
  token: string,
  id: string,
  data: Partial<Expense>
): Promise<Expense> {
  const res = await fetch(`${API_URL}/expenses/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Update expense failed');
  return res.json();
}

export async function deleteExpense(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_URL}/expenses/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Delete expense failed');
}
