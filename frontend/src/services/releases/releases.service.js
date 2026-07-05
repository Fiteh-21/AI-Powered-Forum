import { apiClient } from '../core/api.client.js';

/**
 * Centralized error handler for release/changelog requests.
 * Mirrors the convention in services/admin/admin.service.js.
 */
function handleReleaseError(error) {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') return new Error('Request timed out. Please try again.');
    return new Error('Unable to connect to server. Please check your internet connection.');
  }
  const backendMessage =
    error.response.data?.error?.message ||
    error.response.data?.msg ||
    error.response.data?.message;
  return new Error(backendMessage || 'Unable to load release notes.');
}

/** Releases the current user has not seen yet. Returns { data, count }. */
async function getUnseen() {
  try {
    const response = await apiClient.get('/api/releases/unseen');
    return { data: response.data?.data || [], count: response.data?.count || 0 };
  } catch (error) {
    throw handleReleaseError(error);
  }
}

/** Marks all published releases as seen for the current user. */
async function markSeen() {
  try {
    const response = await apiClient.post('/api/releases/seen');
    return response.data;
  } catch (error) {
    throw handleReleaseError(error);
  }
}

/** Recent published releases for the navbar bell reopen view. */
async function getRecent() {
  try {
    const response = await apiClient.get('/api/releases');
    return response.data?.data || [];
  } catch (error) {
    throw handleReleaseError(error);
  }
}

export const releasesService = { getUnseen, markSeen, getRecent };
