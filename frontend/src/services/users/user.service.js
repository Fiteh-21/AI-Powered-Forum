import { apiClient } from '../core/api.client.js';

function handleUserError(error) {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') return new Error('Request timed out. Please try again.');
    return new Error('Unable to connect to server. Please check your internet connection.');
  }

  const status = error.response.status;
  const backendMessage =
    error.response.data?.error?.message ||
    error.response.data?.msg ||
    error.response.data?.message;

  switch (status) {
    case 404: return new Error(backendMessage || 'User not found.');
    case 500: return new Error('Something went wrong on our end. Please try again later.');
    default:  return new Error(backendMessage || 'An unexpected error occurred.');
  }
}

async function getUserProfile(userId) {
  try {
    const response = await apiClient.get(`/api/users/${userId}/profile`);
    return response.data?.data || response.data;
  } catch (error) {
    throw handleUserError(error);
  }
}

export const userService = { getUserProfile };
