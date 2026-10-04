import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import config from "../constants/config";

const API_URL = `${config.BACKEND_URL}/api/auth`;

// Configure Official Native Google Sign-In Provider
try {
  GoogleSignin.configure({
    webClientId: config.GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });
} catch (e) {
  console.log("ℹ️ GoogleSignin.configure notice:", e.message);
}

const authService = {
  /**
   * Official Native Google Sign-In
   * Opens the official Android Google Account Picker sheet where user simply selects account
   */
  googleLogin: async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const signInResult = await GoogleSignin.signIn();

      // Support GoogleSignin response shapes
      const idToken = signInResult.data?.idToken || signInResult.idToken;
      const user = signInResult.data?.user || signInResult.user;

      if (!idToken && !user) {
        throw new Error("No credentials returned from Google Sign-In.");
      }

      // Sync with Zyro Backend
      const response = await axios.post(`${API_URL}/google`, {
        idToken,
        googleUser: user
          ? {
              id: user.id,
              email: user.email,
              name: user.name,
              photo: user.photo,
            }
          : null,
      });

      if (response.data.success) {
        if (response.data.token) {
          await AsyncStorage.setItem("userToken", response.data.token);
        }
        if (response.data.user) {
          await AsyncStorage.setItem("userData", JSON.stringify(response.data.user));
        }
      }

      return response.data;
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { success: false, cancelled: true };
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        return { success: false, error: "Sign in is already in progress." };
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { success: false, error: "Google Play Services are not available or outdated." };
      }
      console.error("[AuthService] Official Google Sign-In Error:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Google Sign-In failed.",
      };
    }
  },

  /**
   * Register a new customer
   * Role is unconditionally enforced as customer
   */
  register: async ({ name, mobile, password }) => {
    try {
      const response = await axios.post(`${API_URL}/register`, {
        name,
        mobile,
        password,
      });

      if (response.data.success) {
        if (response.data.token) {
          await AsyncStorage.setItem("userToken", response.data.token);
        }
        if (response.data.user) {
          await AsyncStorage.setItem("userData", JSON.stringify(response.data.user));
        }
      }
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Registration failed. Please try again.",
      };
    }
  },

  /**
   * Login with Mobile and Password
   */
  login: async (mobile, password) => {
    try {
      console.log(`[AuthService] Attempting login for mobile: ${mobile}`);
      const response = await axios.post(
        `${API_URL}/login`,
        { mobile, password },
        { timeout: 10000 }
      );

      if (response.data.success) {
        if (response.data.token) {
          await AsyncStorage.setItem("userToken", response.data.token);
        }
        if (response.data.user) {
          await AsyncStorage.setItem("userData", JSON.stringify(response.data.user));
        }
      }
      return response.data;
    } catch (error) {
      if (error.code === "ECONNABORTED") {
        return {
          success: false,
          error: "Connection timeout. Please check your internet connection.",
        };
      }
      const errorMessage = error.response?.data?.error || "Invalid mobile number or password.";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Log out user and clear storage
   */
  logout: async () => {
    try {
      await GoogleSignin.signOut().catch(() => {});
    } catch (e) {
      console.log("Sign out notice:", e.message);
    }
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("userData");
  },

  isLoggedIn: async () => {
    const token = await AsyncStorage.getItem("userToken");
    return !!token;
  },

  getUser: async () => {
    const user = await AsyncStorage.getItem("userData");
    return user ? JSON.parse(user) : null;
  },

  getToken: async () => {
    return await AsyncStorage.getItem("userToken");
  },

  setUser: async (user) => {
    await AsyncStorage.setItem("userData", JSON.stringify(user));
  },

  changePassword: async (userId, currentPassword, newPassword) => {
    try {
      const response = await axios.post(`${API_URL}/change-password`, {
        userId,
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to change password.",
      };
    }
  },

  updateProfile: async (updateData) => {
    try {
      const response = await axios.put(`${API_URL}/update-profile`, updateData);
      if (response.data.success && response.data.user) {
        await AsyncStorage.setItem("userData", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || "Failed to update profile.",
      };
    }
  },
};

export default authService;
