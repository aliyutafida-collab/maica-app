import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "https://maica-app.onrender.com";
const TOKEN_KEY = "@maica_token";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  requireAuth?: boolean;
}

interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
}

async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function request<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = "GET",
    body,
    headers = {},
    timeout = 30000,
    requireAuth = true,
  } = options;

  try {
    const token = await getAuthToken();
    
    if (requireAuth && !token) {
      return { ok: false, error: "Authentication required", status: 401 };
    }

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data: any;
    const contentType = response.headers.get("content-type");
    
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      return {
        ok: false,
        error: data?.error || data?.message || `Request failed with status ${response.status}`,
        status: response.status,
        data,
      };
    }

    return { ok: true, data, status: response.status };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return { ok: false, error: "Request timed out", status: 408 };
    }
    
    if (error.message?.includes("Network request failed") || 
        error.message?.includes("fetch failed")) {
      return { ok: false, error: "Network error. Please check your connection.", status: 0 };
    }

    console.error("API request error:", error);
    return { ok: false, error: error.message || "An unexpected error occurred" };
  }
}

export const api = {
  get: <T = any>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, "method">) =>
    request<T>(endpoint, { ...options, method: "POST", body }),

  put: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, "method">) =>
    request<T>(endpoint, { ...options, method: "PUT", body }),

  delete: <T = any>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),

  patch: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, "method">) =>
    request<T>(endpoint, { ...options, method: "PATCH", body }),
};

export async function withRetry<T>(
  fn: () => Promise<ApiResponse<T>>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<ApiResponse<T>> {
  let lastError: ApiResponse<T> = { ok: false, error: "Max retries exceeded" };
  
  for (let i = 0; i < maxRetries; i++) {
    const result = await fn();
    
    if (result.ok) {
      return result;
    }
    
    if (result.status === 401 || result.status === 403 || result.status === 404) {
      return result;
    }
    
    lastError = result;
    
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
    }
  }
  
  return lastError;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default api;
