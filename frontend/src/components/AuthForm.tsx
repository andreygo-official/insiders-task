
import { useState } from "react";
import type { FormEvent } from "react";
import { AxiosError } from "axios";
import {
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

import { authApi } from "../api/client";
import type { AuthResponse } from "../types";

interface AuthFormProps {
  onAuth: (data: AuthResponse) => void;
}

export default function AuthForm({
  onAuth,
}: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = isLogin
        ? await authApi.login(email, password)
        : await authApi.register(email, password);

      onAuth(data);
    } catch (err) {
        console.error("Authentication error:", err);
      
        if (err instanceof AxiosError) {
          const message = err.response?.data?.message;
      
          if (message) {
            setError(message);
          } else if (!err.response) {
            setError(
              "Cannot connect to the server. Check if the backend is running."
            );
          } else {
            setError(
              `Registration failed (HTTP ${err.response.status})`
            );
          }
        } else {
          setError("Unexpected error occurred");
        }
     } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setIsLogin((previous) => !previous);
    setPassword("");
    setError("");
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <CheckCircle2 size={30} />
          <span>TaskFlow</span>
        </div>

        <h1>
          {isLogin
            ? "Welcome back"
            : "Create an account"}
        </h1>

        <p className="subtitle">
          {isLogin
            ? "Sign in to organize your tasks."
            : "Get started with TaskFlow."}
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>

          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            minLength={
              isLogin ? undefined : 8
            }
            autoComplete={
              isLogin
                ? "current-password"
                : "new-password"
            }
            required
          />

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <button
            className="btn btn-primary full-width"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : isLogin
                ? "Sign in"
                : "Sign up"}

            <ArrowRight size={17} />
          </button>
        </form>

        <p className="auth-switch">
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}
          {" "}
          <button
            type="button"
            className="text-button"
            onClick={toggleMode}
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </main>
  );
}
