import { api } from "./client.js";

export function listTasks() {
  return api("/api/tasks");
}

export function createTask(task) {
  return api("/api/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });
}

export function deleteTask(taskId) {
  return api(`/api/tasks/${taskId}`, {
    method: "DELETE",
  });
}
