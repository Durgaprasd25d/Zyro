import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../constants/config";
import Constants from "expo-constants";

const API_URL = `${config.BACKEND_URL}/api/auth`;
const isExpoGo = Constants.appOwnership === "expo";

// Lazy load auth only if NOT in Expo Go
let auth = null;
if (!isExpoGo) {
  try {
    auth = require("@react-native-firebase/auth").default;
  } catch (e) {
    console.log("⚠️ Firebase Auth native module not found");
  }
}

const authService = {
  // Firebase Phone Auth
  signInWithPhoneNumber: async (phoneNumber) => {
    // if (!auth) {
    //     throw new Error('Phone Auth is not available in Expo Go. Please use a native build.');
    // }
    // try {
    //     // Confirmation result will be used to verify the code
    //     const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    //     return { success: true, confirmation };
    // } catch (error) {
    //     console.error('Phone Auth Error:', error);
    //     return { success: false, error: error.message };
    // }
    throw new Error("Phone OTP is temporarily disabled.");
  },

  verifyOTP: async (confirmation, code, name, role) => {
    // try {
    //     // 1. Verify code with Firebase
    //     await confirmation.confirm(code);

    //     // 2. Get the Firebase ID Token
    //     const idToken = await auth().currentUser.getIdToken();

    //     // 3. Sync with Backend
    //     const response = await axios.post(`${API_URL}/firebase-verify`, {
    //         idToken,
    //         name,
    //         role
    //     });

    //     if (response.data.success) {
    //         await AsyncStorage.setItem('userToken', response.data.token);
    //         await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    //     }

    //     return response.data;
    // } catch (error) {
    //     console.error('OTP Verification Error:', error);
    //     return { success: false, error: 'Invalid verification code' };
    // }
    throw new Error("Phone OTP is temporarily disabled.");
  },

  register: async (data) => {
    try {
      const response = await axios.post(`${API_URL}/register`, data);
      if (response.data.success) {
        await AsyncStorage.setItem("userToken", response.data.token);
        await AsyncStorage.setItem(
          "userData",
          JSON.stringify(response.data.user),
        );
      }
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Registration failed",
      };
    }
  },

  login: async (mobile, password) => {
    try {
      console.log(
        `Attempting login to: ${API_URL}/login with mobile: ${mobile}`,
      );
      const response = await axios.post(
        `${API_URL}/login`,
        { mobile, password },
        { timeout: 10000 }, // 10 second timeout
      );
      console.log("Login Response:", response.data);
      if (response.data.success) {
        await AsyncStorage.setItem("userToken", response.data.token);
        await AsyncStorage.setItem(
          "userData",
          JSON.stringify(response.data.user),
        );
      }
      return response.data;
    } catch (error) {
      console.error("Login Error:", error);
      if (error.code === "ECONNABORTED") {
        return {
          success: false,
          error: "Connection timeout. Is the server reachable?",
        };
      }
      return {
        success: false,
        error:
          error.response?.data?.error ||
          "Login failed. Check server connection.",
      };
    }
  },

  logout: async () => {
    try {
      if (auth && auth().currentUser) {
        await auth().signOut();
      }
    } catch (e) {
      console.log("Sign out error:", e);
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

  setUser: async (user) => {
    await AsyncStorage.setItem("userData", JSON.stringify(user));
  },
};

export default authService;
