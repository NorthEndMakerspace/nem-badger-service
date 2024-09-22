import { callWebhook } from './ha'
import { error } from './log'
import { createActor, Actor } from 'xstate'
import { AllEvents, ToolMachine } from './tool_state_machine'
import { logger } from './logger'

interface ToolConfig {
  usageThreshold: number
  timeoutSeconds: number
}

export class Tool {
  name: string
  toolId: string
  webhookName: WebhookName
  stateMachine: Actor<typeof ToolMachine>

  constructor(name: string, toolId: string, webhookName: WebhookName, config: ToolConfig) {
    this.name = name
    this.toolId = toolId
    this.webhookName = webhookName
    this.stateMachine = createActor(ToolMachine, {
      input: {
        ...config,
        toolId,
        logger: this.stateMachineLogger,
      },
    })
    this.stateMachine.start()
  }

  status() {
    return this.stateMachine.getSnapshot().value
  }

  reportWattage(wattage: number) {
    this.stateMachine.send({ type: 'usage_wattage', wattage })
  }

  stateMachineLogger(event: AllEvents, data?: unknown): void {
    if (data) {
      logger(event, data)
    } else {
      logger(event)
    }
  }

  becameOnline() {
    this.stateMachine.send({ type: 'turn_on' })
  }

  becameOffline() {
    this.stateMachine.send({ type: 'turn_off' })
  }

  startUsage() {
    this.stateMachine.send({ type: 'start_usage' })
  }

  stopUsage() {
    this.stateMachine.send({ type: 'stop_usage' })
  }

  async lock() {
    const currentUserId = this.stateMachine.getSnapshot().context.currentUserId
    if (!currentUserId) {
      error('Trying to lock but there is no currentUserId')
      return
    }

    await callWebhook(this.webhookName, { userId: currentUserId, toolId: this.toolId, action: 'lock' })
    this.stateMachine.send({ type: 'badge_out' })
  }

  async unlock(userId: UserId) {
    if (!userId) {
      error('No userId given for unlock. Unable to unlock.')
      return
    }
    await callWebhook(this.webhookName, { userId, toolId: this.toolId, action: 'unlock' })
    this.stateMachine.send({ type: 'badge_in', user_id: userId })
  }
}
