
import { useState } from "react";
import type { FormEvent } from "react";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  CheckCircle2,
  Plus,
  LogOut,
  Pencil,
  Trash2,
  Clock3,
  ListTodo,
  CircleCheck,
  X,
} from "lucide-react";

import { taskApi } from "../api/client";

import type {
  User,
  Task,
  TaskStatus,
  TaskFilter,
  TaskInput,
} from "../types";

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const statusOptions: {
  value: TaskStatus;
  label: string;
}[] = [
  { value: "todo", label: "To Do" },
  { value: "in progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const initialForm: TaskInput = {
  title: "",
  description: "",
  status: "todo",
};

export default function Dashboard({
  user,
  onLogout,
}: DashboardProps) {
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<TaskFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskInput>(initialForm);
  const [error, setError] = useState("");

  const {
    data: tasks = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tasks", filter],
    queryFn: () => taskApi.getAll(filter),
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ["tasks", "all"],
    queryFn: () => taskApi.getAll("all"),
  });

  function refreshTasks() {
    return queryClient.invalidateQueries({
      queryKey: ["tasks"],
    });
  }

  function handleError(err: unknown) {
    console.error(err);
    setError("Operation failed. Please try again.");
  }

  function closeModal() {
    setModalOpen(false);
    setEditingTask(null);
    setError("");
  }

  const createMutation = useMutation({
    mutationFn: taskApi.create,
    onSuccess: async () => {
      await refreshTasks();
      closeModal();
    },
    onError: handleError,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<TaskInput>;
    }) => taskApi.update(id, data),

    onSuccess: async () => {
      await refreshTasks();
      closeModal();
    },
    onError: handleError,
  });

  const deleteMutation = useMutation({
    mutationFn: taskApi.delete,
    onSuccess: refreshTasks,
    onError: handleError,
  });

  function openCreate() {
    setEditingTask(null);
    setForm({ ...initialForm });
    setError("");
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setEditingTask(task);

    setForm({
      title: task.title,
      description: task.description,
      status: task.status,
    });

    setError("");
    setModalOpen(true);
  }

  function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Task title is required");
      return;
    }

    setError("");

    const payload: TaskInput = {
      title: form.title.trim(),
      description: form.description,
      status: form.status,
    };

    if (editingTask) {
      updateMutation.mutate({
        id: editingTask.id,
        data: payload,
      });
    } else {
      createMutation.mutate(payload);
    }
  }

  function deleteTask(task: Task) {
    if (
      window.confirm(`Delete "${task.title}"?`)
    ) {
      setError("");
      deleteMutation.mutate(task.id);
    }
  }

  function changeStatus(
    task: Task,
    status: TaskStatus
  ) {
    setError("");

    updateMutation.mutate({
      id: task.id,
      data: { status },
    });
  }

  const counts: Record<TaskFilter, number> = {
    all: allTasks.length,
    todo: allTasks.filter(
      (task) => task.status === "todo"
    ).length,
    "in progress": allTasks.filter(
      (task) => task.status === "in progress"
    ).length,
    done: allTasks.filter(
      (task) => task.status === "done"
    ).length,
  };

  const filters: {
    value: TaskFilter;
    label: string;
  }[] = [
    { value: "all", label: "All Tasks" },
    ...statusOptions,
  ];

  const saving =
    createMutation.isPending ||
    updateMutation.isPending;

  return (
    <div className="app-layout">
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="brand">
            <CheckCircle2 size={28} />
            <span>TaskFlow</span>
          </div>

          <div className="header-right">
            <span className="user-email">
              {user.email}
            </span>

            <button
              className="btn btn-secondary"
              onClick={onLogout}
            >
              <LogOut size={17} />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="container main-content">
        <div className="page-heading">
          <div>
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h1>My Tasks</h1>
            <p className="subtitle">
              Organize your work and track progress.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={openCreate}
          >
            <Plus size={18} />
            New Task
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <ListTodo size={22} />
            <span>Total Tasks</span>
            <strong>{counts.all}</strong>
          </div>

          <div className="stat-card">
            <Clock3 size={22} />
            <span>In Progress</span>
            <strong>{counts["in progress"]}</strong>
          </div>

          <div className="stat-card">
            <CircleCheck size={22} />
            <span>Completed</span>
            <strong>{counts.done}</strong>
          </div>
        </div>

        <h2 className="section-title">Task Overview</h2>

        <div className="filters">
          {filters.map((item) => (
            <button
              key={item.value}
              className={
                filter === item.value
                  ? "filter active"
                  : "filter"
              }
              onClick={() => setFilter(item.value)}
            >
              {item.label}
              <span>{counts[item.value]}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="empty-state">
            Loading tasks...
          </div>
        ) : isError ? (
          <div className="empty-state">
            Failed to load tasks.
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <ListTodo size={40} />
            <h3>No tasks found</h3>
            <p>
              Create a task or change the filter.
            </p>
          </div>
        ) : (
          <div className="task-grid">
            {tasks.map((task) => (
              <article
                key={task.id}
                className="task-card"
              >
                <div className="task-card-top">
                  <span
                    className={`status-badge ${task.status.replace(" ", "-")}`}
                  >
                    {statusOptions.find(
                      (item) =>
                        item.value === task.status
                    )?.label}
                  </span>

                  <div className="task-actions">
                    <button
                      aria-label={`Edit ${task.title}`}
                      title="Edit"
                      onClick={() => openEdit(task)}
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      aria-label={`Delete ${task.title}`}
                      title="Delete"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteTask(task)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                <h3>{task.title}</h3>

                <p className="task-description">
                  {task.description ||
                    "No description provided."}
                </p>

                <div className="task-card-footer">
                  <select
                    aria-label={`Status for ${task.title}`}
                    value={task.status}
                    disabled={updateMutation.isPending}
                    onChange={(event) =>
                      changeStatus(
                        task,
                        event.target.value as TaskStatus
                      )
                    }
                  >
                    {statusOptions.map((item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <span>
                    {new Date(
                      task.createdAt
                    ).toLocaleDateString()}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              editingTask
                ? "Edit task"
                : "Create task"
            }
          >
            <div className="modal-header">
              <h2>
                {editingTask
                  ? "Edit Task"
                  : "Create New Task"}
              </h2>

              <button
                className="icon-button"
                aria-label="Close"
                onClick={closeModal}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="task-form"
              onSubmit={saveTask}
            >
              <label htmlFor="task-title">
                Title
              </label>

              <input
                id="task-title"
                value={form.title}
                placeholder="Task title"
                maxLength={200}
                required
                onChange={(event) =>
                  setForm({
                    ...form,
                    title: event.target.value,
                  })
                }
              />

              <label htmlFor="task-description">
                Description
              </label>

              <textarea
                id="task-description"
                rows={4}
                maxLength={2000}
                value={form.description}
                placeholder="Task details"
                onChange={(event) =>
                  setForm({
                    ...form,
                    description: event.target.value,
                  })
                }
              />

              <label htmlFor="task-status">
                Status
              </label>

              <select
                id="task-status"
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status:
                      event.target.value as TaskStatus,
                  })
                }
              >
                {statusOptions.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingTask
                      ? "Save Changes"
                      : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
