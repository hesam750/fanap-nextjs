// app/lib/api-client.ts
class ApiClient {
  private baseUrl = process.env.NODE_ENV === 'production' 
    ? (process.env.NEXT_PUBLIC_API_URL || '') 
    : '' 

  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    return headers
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: this.getAuthHeaders(),
      credentials: 'include',
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        credentials: 'include',
      })
      if (!response.ok) {
        const errorDetails = await response.json()
        console.error("API Error details:", errorDetails)
        throw new Error(`API Error: ${response.statusText}`)
      }
      return response.json()
    } catch (error) {
      console.error("API Client Error:", error)
      throw error
    }
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
      credentials: 'include',
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
      credentials: 'include',
    })
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    return response.json()
  }

  // User operations
  async getUsers() {
    return this.get<{ users: User[] }>("/api/users")
  }

  async createUser(userData: any): Promise<any> {
    try {
      const { permissions, ...dataToSend } = userData;
      console.log('Sending to server:', dataToSend);

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', response.status, errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API Client Error:', error);
      throw error;
    }
  }

  async getUserById(id: string) {
    return this.get<{ user: User }>(`/api/users/${id}`)
  }

  async updateUser(id: string, updates: Partial<{ name: string; email: string; role: string; isActive: boolean; password: string }>) {
    try {
      console.log('Sending update request to server:', { id, updates });

      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', response.status, errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API Client Error:', error);
      throw error;
    }
  }

  // System Settings operations
  async getSystemSettings() {
    return this.get<{ settings: SystemSettings }>("/api/system/settings")
  }

  async updateSystemSettings(settings: Partial<SystemSettings>) {
    return this.put<{ message: string }>("/api/system/settings", settings)
  }

  // Tank operations
  async getTanks() {
    return this.get<{ tanks: Tank[] }>("/api/tanks")
  }

  async createTank(tankData: any) {
    try {
      const response = await fetch('/api/tanks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tankData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API Client Error:', error);
      throw error;
    }
  }

  async updateTank(id: string, updates: any) {
    try {
      const response = await fetch(`/api/tanks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API Client Error:', error);
      throw error;
    }
  }

  // Generator operations
  async getGenerators() {
    return this.get<{ generators: Generator[] }>("/api/generators")
  }

  async createGenerator(generatorData: any) {
    try {
      const response = await fetch('/api/generators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generatorData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API Client Error:', error);
      throw error;
    }
  }

  async updateGenerator(id: string, updates: any) {
    try {
      const response = await fetch(`/api/generators/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API Client Error:', error);
      throw error;
    }
  }

  // Task operations
  async getTasks() {
    return this.get<{ tasks: Task[] }>("/api/tasks")
  }

  async createTask(taskData: CreateTaskInput) {
    return this.post<{ task: Task }>("/api/tasks", taskData)
  }

  async updateTask(id: string, updates: Partial<Task>) {
    return this.put<{ task: Task }>(`/api/tasks/${id}`, updates)
  }

  // Alert operations
  async getAlerts() {
    return this.get<{ alerts: Alert[] }>("/api/alerts")
  }

  async updateAlert(id: string, updates: Partial<Alert>) {
    return this.put<{ alert: Alert }>(`/api/alerts/${id}`, updates)
  }

  async deleteAlert(id: string) {
    return this.delete<{ message: string }>(`/api/alerts/${id}`)
  }

  // Notification operations
  async getNotifications(userId?: string) {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : ""
    return this.get<{ notifications: Notification[] }>(`/api/notifications${qs}`)
  }

  async createNotification(data: Partial<Notification> & { userId: string; title: string; message: string }) {
    return this.post<{ notification: Notification }>(`/api/notifications`, data)
  }

  async updateNotification(id: string, updates: Partial<Notification>) {
    return this.put<{ notification: Notification }>(`/api/notifications/${id}`, updates)
  }

  async deleteNotification(id: string) {
    return this.delete<{ message: string }>(`/api/notifications/${id}`)
  }
}

export const apiClient = new ApiClient()

// Types referenced in method signatures
import type { User, SystemSettings, Tank, Generator, Task, CreateTaskInput, Alert, Notification } from "./types"