import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const approvalService = {
  // Create a new approval request
  createApproval: async (title) => {
    try {
      const response = await api.post('/approvals', { title });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all approvals (we'll fetch by ID when needed)
  getApproval: async (id) => {
    try {
      const response = await api.get(`/approvals/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Approve an approval request
  approveApproval: async (id) => {
    try {
      const response = await api.post(`/approvals/${id}/approve`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Reject an approval request
  rejectApproval: async (id) => {
    try {
      const response = await api.post(`/approvals/${id}/reject`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default api;
