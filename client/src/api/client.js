import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 20000
});

export const assetUrl = (filename) => {
  if (!filename) return '';
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return `${apiUrl.replace(/\/api\/?$/, '')}/uploads/screenshots/${encodeURIComponent(filename)}`;
};

export function errorMessage(error) {
  const response = error.response?.data;
  const details = response?.errors?.map((item) => item.msg || item.errors?.join(', ') || String(item)).filter(Boolean);
  return details?.length ? `${response.message}: ${details.join('; ')}` : response?.message || error.message || 'Something went wrong';
}
