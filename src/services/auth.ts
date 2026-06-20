import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "vidsync_secure_token";
const WORKER_KEY = "vidsync_worker_id";

export const authService = {
  login: async (email: string) => {
    const mockToken = `jwt_${Math.random().toString(36).substring(2)}`;

    await SecureStore.setItemAsync(TOKEN_KEY, mockToken);
    await SecureStore.setItemAsync(WORKER_KEY, email);

    return { worker_id: email, token: mockToken };
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(WORKER_KEY);
  },

  getToken: () => SecureStore.getItemAsync(TOKEN_KEY),

  getWorkerId: () => SecureStore.getItemAsync(WORKER_KEY),
};
