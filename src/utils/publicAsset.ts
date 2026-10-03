/** Resolve public assets under root or a Vite deployment subpath. */
export function publicAsset(path: string, base = import.meta.env.BASE_URL): string {
  return (base.endsWith('/') ? base : base + '/') + path.replace(/^\/+/, '');
}
