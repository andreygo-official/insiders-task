
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import AuthForm from "./components/AuthForm";
import Dashboard from "./components/DashBoard";

import type {
  User,
  AuthResponse,
} from "./types";

function getStoredUser(): User | null {
  try {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");

    if (!token || !stored) return null;

    const user = JSON.parse(stored) as User;

    if (
      typeof user.id !== "number" ||
      typeof user.email !== "string"
    ) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export default function App() {
  const queryClient = useQueryClient();

  const [user, setUser] = useState<User | null>(
    getStoredUser
  );

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    queryClient.clear();
    setUser(null);
  }

  useEffect(() => {
    window.addEventListener("auth:expired", logout);

    return () => {
      window.removeEventListener(
        "auth:expired",
        logout
      );
    };
  }, [queryClient]);

  function handleAuth(data: AuthResponse) {
    queryClient.clear();

    localStorage.setItem(
      "token",
      data.token
    );

    localStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );

    setUser(data.user);
  }

  if (!user) {
    return <AuthForm onAuth={handleAuth} />;
  }

  return (
    <Dashboard
      user={user}
      onLogout={logout}
    />
  );
}
