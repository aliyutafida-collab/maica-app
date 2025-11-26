import { API_URL } from '../config';

export interface AuthResponse {
  id: string;
  name: string;
  email: string;
  token: string;
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ first_name: name.split(' ')[0], last_name: name.split(' ').slice(1).join(' '), email, password }),
  });
  if (!res.ok) {
    try {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Registration failed');
    } catch (e) {
      throw new Error('Registration failed');
    }
  }
  const data = await res.json();
  if (!data.id || !data.token) {
    throw new Error('Invalid response from server');
  }
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    try {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Login failed');
    } catch (e) {
      throw new Error('Invalid email or password');
    }
  }
  const data = await res.json();
  if (!data.id || !data.token) {
    throw new Error('Invalid response from server');
  }
  return data;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/forgot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    throw new Error('Password reset request failed');
  }
  return res.json();
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password: newPassword }),
  });
  if (!res.ok) {
    throw new Error('Password reset failed');
  }
  return res.json();
}
