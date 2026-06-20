import { authService } from "./auth";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

export const apiClient = {
  post: async <T>(endpoint: string, body: object): Promise<T> => {
    const token = await authService.getToken();

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}`);
    }

    return response.json() as Promise<T>;
  },
};
