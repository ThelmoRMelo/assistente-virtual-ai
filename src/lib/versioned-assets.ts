const VERSION_PARAM = 'v';

export function stripAssetVersion(url: string | null | undefined) {
  if (!url) return '';

  try {
    const parsed = new URL(url, window.location.origin);
    parsed.searchParams.delete(VERSION_PARAM);
    return parsed.toString();
  } catch {
    return url.replace(/([?&])v=[^&]*(&?)/, (_match, prefix, suffix) => (suffix ? prefix : ''));
  }
}

export function versionAssetUrl(url: string | null | undefined, version: string | number = Date.now()) {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  try {
    const parsed = new URL(url, window.location.origin);
    parsed.searchParams.set(VERSION_PARAM, String(version));
    return parsed.toString();
  } catch {
    const base = stripAssetVersion(url);
    return `${base}${base.includes('?') ? '&' : '?'}${VERSION_PARAM}=${encodeURIComponent(String(version))}`;
  }
}

export function assetVersionKey(...values: Array<string | number | null | undefined>) {
  return values.filter(Boolean).join('-') || Date.now().toString();
}