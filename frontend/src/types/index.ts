
export type TaskStatus =
| "todo"
| "in progress"
| "done";

export type TaskFilter = TaskStatus | "all";

export interface User {
id: number;
email: string;
}

export interface AuthResponse {
token: string;
user: User;
}

export interface Task {
id: number;
title: string;
description: string;
status: TaskStatus;
userId: number;
createdAt: string;
updatedAt: string;
}

export interface TaskInput {
title: string;
description: string;
status: TaskStatus;
}

export type TaskUpdate = Partial<TaskInput>;
