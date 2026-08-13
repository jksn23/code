export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const ASSET_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL || 'http://localhost:5000';

export const assetUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${ASSET_BASE_URL}/${path.replace(/^\/+/, '')}`;
};
