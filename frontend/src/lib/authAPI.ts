import apiClient from "./api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  phone: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  phone: string;
}

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  },

  signup: async (data: SignupData): Promise<RegisterResponse> => {
    const response = await apiClient.post("/auth/register", data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
  },

  getProfile: async () => {
    const response = await apiClient.get("/auth/status");
    return response.data;
  },
};
