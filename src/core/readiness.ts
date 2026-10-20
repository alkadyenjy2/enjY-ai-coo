const TRUSTED_N8N_HOST = "zeoutsourse.app.n8n.cloud";

export function isTrustedN8nWebhookConfigured(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:"
      && url.hostname === TRUSTED_N8N_HOST
      && !url.port
      && url.pathname.startsWith("/webhook/")
      && !url.username
      && !url.password
      && !url.hash
      && !url.search;
  } catch {
    return false;
  }
}
