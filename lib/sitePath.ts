export const SITE_BASE_PATH = "/cindykan-portfolio";

export function withBasePath(path: string) {
  if (!path.startsWith("/") || path === SITE_BASE_PATH || path.startsWith(`${SITE_BASE_PATH}/`)) {
    return path;
  }

  return `${SITE_BASE_PATH}${path}`;
}
