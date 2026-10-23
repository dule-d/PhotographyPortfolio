const BASE_URL = import.meta.env.BASE_URL;

export function assetUrl(path) {
  return `${BASE_URL}${path.replace(/^\/+/, '')}`;
}
