import { setup, assign } from 'xstate'

type Event = 'online_start' | 'online_end'
type UserEvent = 'unlocked_start' | 'unlocked_end' | 'usage_start'
type UsageEvent = 'usage_end'
export type AllEvents = Event | UserEvent | UsageEvent

type USER_ID = string
export const ToolMachine = setup({
  types: {
    input: {} as {
      toolId: string
      usageThreshold: number
      timeoutSeconds: number
      logger: (event: AllEvents, data: unknown) => void
    },
    events: {} as
      | { type: 'turn_on' }
      | { type: 'turn_off' }
      | { type: 'badge_in'; user_id: USER_ID }
      | { type: 'badge_out' }
      | { type: 'start_usage' }
      | { type: 'stop_usage' }
      | { type: 'usage_wattage'; wattage: number },
  },
  actions: {
    logEvent: ({ context }, params: { event: Event }) => {
      context.logger(params.event)
    },
    logUserEvent: ({ context }, params: { event: UserEvent }) => {
      context.logger(params.event, { userId: context.currentUserId })
    },
    logUsage: ({ context }) => {
      context.logger('usage_end', {
        userId: context.currentUserId,
        usageSeconds: (Date.now() - context.usageStartTime) / 1000,
      })
    },
  },
}).createMachine({
  id: 'tool',
  initial: 'Offline',
  context: ({ input }) => ({
    currentUserId: undefined,
    usageStartTime: undefined,
    lastUsedAt: undefined,
    toolId: input.toolId,
    usageThreshold: input.usageThreshold,
    timeoutSeconds: input.timeoutSeconds,
    logger: input.logger,
  }),
  states: {
    Offline: {
      on: {
        turn_on: 'Online',
      },
    },
    Online: {
      entry: [{ type: 'logEvent', params: { event: 'online_start' } }],
      exit: [{ type: 'logEvent', params: { event: 'online_end' } }],
      on: {
        turn_off: 'Offline',
        badge_in: {
          guard: ({ event }) => {
            // TODO temp hack to simulate auth
            return event.user_id === '123'
          },
          actions: assign({
            currentUserId: ({ event }) => event.user_id,
          }),
          target: 'Unlocked',
        },
      },
    },
    Unlocked: {
      entry: [{ type: 'logUserEvent', params: { event: 'unlocked_start' } }],
      exit: [{ type: 'logUserEvent', params: { event: 'unlocked_end' } }],
      on: {
        badge_out: 'Online',
        start_usage: 'In_Use',
        usage_wattage: {
          target: 'In_Use',
          guard: ({ event, context }) => event.wattage >= context.usageThreshold,
        },
        turn_off: 'Offline',
      },
    },
    In_Use: {
      entry: [
        assign({
          usageStartTime: () => Date.now(),
        }),
        { type: 'logUserEvent', params: { event: 'usage_start' } },
      ],
      exit: [
        { type: 'logUsage' },
        assign({
          usageStartTime: undefined,
        }),
      ],
      on: {
        usage_wattage: {
          target: 'Unlocked',
          guard: ({ event, context }) => event.wattage < context.usageThreshold,
        },
        stop_usage: 'Unlocked',
        badge_out: 'Online',
        turn_off: 'Offline',
      },
    },
  },
})
