import { Reel, HorizontalVideo, Testimonial, Project, Service, AboutData, SettingsData, ContactMessage } from '../types';

const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('cinema_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Public Endpoints
  async getSettings(): Promise<SettingsData> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async getAbout(): Promise<AboutData> {
    const res = await fetch(`${API_BASE}/about`);
    if (!res.ok) throw new Error('Failed to fetch about data');
    return res.json();
  },

  async getReels(): Promise<Reel[]> {
    const res = await fetch(`${API_BASE}/reels`);
    if (!res.ok) throw new Error('Failed to fetch reels');
    return res.json();
  },

  async getHorizontalVideos(): Promise<HorizontalVideo[]> {
    const res = await fetch(`${API_BASE}/horizontal-videos`);
    if (!res.ok) throw new Error('Failed to fetch horizontal videos');
    return res.json();
  },

  async getTestimonials(): Promise<Testimonial[]> {
    const res = await fetch(`${API_BASE}/testimonials`);
    if (!res.ok) throw new Error('Failed to fetch testimonials');
    return res.json();
  },

  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async getProject(id: number | string): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${id}`);
    if (!res.ok) throw new Error('Failed to fetch project');
    return res.json();
  },

  async getServices(): Promise<Service[]> {
    const res = await fetch(`${API_BASE}/services`);
    if (!res.ok) throw new Error('Failed to fetch services');
    return res.json();
  },

  async submitContact(data: {
    name: string;
    email: string;
    company?: string;
    project_type?: string;
    budget?: string;
    message: string;
    brief_url?: string;
  }) {
    const res = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send message');
    }
    return res.json();
  },

  // Auth
  async login(credentials: { username: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Invalid credentials');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('cinema_admin_token', data.token);
    }
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Session invalid');
    return res.json();
  },

  logout() {
    localStorage.removeItem('cinema_admin_token');
  },

  async changePassword(passwords: { currentPassword: string; newPassword: string }) {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(passwords),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update password');
    }
    return res.json();
  },

  // Admin Endpoints
  async updateSettings(settings: Partial<SettingsData>) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async updateAbout(about: Partial<AboutData>) {
    const res = await fetch(`${API_BASE}/about`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(about),
    });
    if (!res.ok) throw new Error('Failed to update about section');
    return res.json();
  },

  // Reels Admin
  async createReel(data: Partial<Reel>) {
    const res = await fetch(`${API_BASE}/reels`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create reel');
    return res.json();
  },

  async updateReel(id: number, data: Partial<Reel>) {
    const res = await fetch(`${API_BASE}/reels/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update reel');
    return res.json();
  },

  async deleteReel(id: number) {
    const res = await fetch(`${API_BASE}/reels/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete reel');
    return res.json();
  },

  // Horizontal Admin
  async createHorizontalVideo(data: Partial<HorizontalVideo>) {
    const res = await fetch(`${API_BASE}/horizontal-videos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create horizontal video');
    return res.json();
  },

  async updateHorizontalVideo(id: number, data: Partial<HorizontalVideo>) {
    const res = await fetch(`${API_BASE}/horizontal-videos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update horizontal video');
    return res.json();
  },

  async deleteHorizontalVideo(id: number) {
    const res = await fetch(`${API_BASE}/horizontal-videos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete horizontal video');
    return res.json();
  },

  // Testimonials Admin
  async createTestimonial(data: Partial<Testimonial>) {
    const res = await fetch(`${API_BASE}/testimonials`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create testimonial');
    return res.json();
  },

  async updateTestimonial(id: number, data: Partial<Testimonial>) {
    const res = await fetch(`${API_BASE}/testimonials/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update testimonial');
    return res.json();
  },

  async deleteTestimonial(id: number) {
    const res = await fetch(`${API_BASE}/testimonials/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete testimonial');
    return res.json();
  },

  // Projects Admin
  async createProject(data: Partial<Project>) {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  async updateProject(id: number, data: Partial<Project>) {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
  },

  async deleteProject(id: number) {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete project');
    return res.json();
  },

  // Services Admin
  async createService(data: Partial<Service>) {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create service');
    return res.json();
  },

  async updateService(id: number, data: Partial<Service>) {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update service');
    return res.json();
  },

  async deleteService(id: number) {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete service');
    return res.json();
  },

  // Messages Admin
  async getMessages(): Promise<ContactMessage[]> {
    const res = await fetch(`${API_BASE}/messages`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  async updateMessageStatus(id: number, status: string) {
    const res = await fetch(`${API_BASE}/messages/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update message status');
    return res.json();
  },

  async deleteMessage(id: number) {
    const res = await fetch(`${API_BASE}/messages/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete message');
    return res.json();
  },

  // Media File Upload
  async uploadFile(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('cinema_admin_token');

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Upload failed');
    }
    return res.json();
  },

  // Profile Picture Upload
  async uploadProfilePicture(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('cinema_admin_token');

    const res = await fetch(`${API_BASE}/upload/profile-picture`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Profile picture upload failed');
    }
    return res.json();
  },

  async removeProfilePicture(): Promise<void> {
    const res = await fetch(`${API_BASE}/upload/profile-picture`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to remove profile picture');
  },

  async syncSeedCode(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/sync-seed`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to synchronize permanent code');
    return res.json();
  },

  async exportBackup(): Promise<Blob> {
    const res = await fetch(`${API_BASE}/admin/export-content`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to export content backup');
    return res.blob();
  },

  async importBackup(content: any): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/admin/import-content`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(content),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to import backup');
    }
    return res.json();
  },

  async publishLive(): Promise<{ success: boolean; committed: boolean; pushed: boolean; openedDesktop: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/admin/publish-live`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to publish to live website');
    }
    return res.json();
  },
};
