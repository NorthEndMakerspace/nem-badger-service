export function callWebhook(webhookName: WebhookName, params: Record<string, string>) {
  const searchParams = new URLSearchParams(params)
  return fetch(`http://homeassistant.internal:8123/api/webhook/${webhookName}?${searchParams.toString()}`)
}
