
import axios from "axios";

import type {
  AuthResponse,
  Task,
  TaskFilter,
  TaskInput,
  TaskUpdate,
} from "../types";

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5001/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.startsWith("/auth/")
    ) {
      window.dispatchEvent(
        new Event("auth:expired")
      );
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  register: async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(
      "/auth/register",
      { email, password }
    );

    return response.data;
  },

  login: async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(
      "/auth/login",
      { email, password }
    );

    return response.data;
  },
};

export const taskApi = {
  getAll: async (filter: TaskFilter): Promise<Task[]> => {
    const response = await api.get<Task[]>("/tasks", {
      params:
        filter === "all"
          ? {}
          : { status: filter },
    });

    return response.data;
  },

  create: async (task: TaskInput): Promise<Task> => {
    const response = await api.post<Task>(
      "/tasks",
      task
    );

    return response.data;
  },

  update: async (
    id: number,
    changes: TaskUpdate
  ): Promise<Task> => {
    const response = await api.put<Task>(
      `/tasks/${id}`,
      changes
    );

    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
};
