import { callWebhook } from './ha'
import { error } from './log'

export class Tool {
  name: string
  toolId: string
  webhookName: WebhookName
  currentUserId?: UserId

  constructor(name: string, toolId: string, webhookName: WebhookName) {
    this.name = name
    this.toolId = toolId
    this.webhookName = webhookName
  }

  lock() {
    if (!this.currentUserId) {
      error('Trying to lock but there is no currentUserId')
      return
    }
    return callWebhook(this.webhookName, { userId: this.currentUserId, toolId: this.toolId, action: 'lock' })
  }

  unlock(userId: UserId) {
    if (!userId) {
      error('No userId given for unlock. Unable to unlock.')
      return
    }
    this.currentUserId = userId
    return callWebhook(this.webhookName, { userId: this.currentUserId, toolId: this.toolId, action: 'unlock' })
  }
}
