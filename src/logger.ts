import { AllEvents } from './tool_state_machine'

export function logger(event: AllEvents, data?: unknown): void {
  // TODO implement
  console.debug('logger', event, data)
}
