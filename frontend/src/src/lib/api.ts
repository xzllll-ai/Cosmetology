import { TaskStatus } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function uploadImage(
  file: File,
  userRequirement?: string
): Promise<{ task_id: string }> {
  const formData = new FormData();
  formData.append("image", file);
  if (userRequirement) {
    formData.append("user_requirement", userRequirement);
  }

  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "上传失败");
  }

  return res.json();
}

export async function getTaskStatus(taskId: string): Promise<TaskStatus> {
  const res = await fetch(`${API_BASE}/api/tasks/${taskId}`);
  if (!res.ok) {
    throw new Error("获取状态失败");
  }
  return res.json();
}

export function getImageUrl(path: string): string {
  return `${API_BASE}${path}`;
}
