import { setup, assign } from 'xstate'

export const toolMachine = setup({
  types: {
    input: {} as {
      toolId: string
      usageThreshold: number
      timeoutSeconds: number
    },
    events: {} as
      | { type: 'turn_on' }
      | { type: 'turn_off' }
      | { type: 'badge_in'; user_id: string }
      | { type: 'badge_out' }
      | { type: 'usage_wattage'; wattage: number },
  },
  actions: {
    logUsage: () => {
      // TODO Log usage to DB/Redis/Notion
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
  }),
  states: {
    Offline: {
      on: {
        ping: 'Online',
        turn_on: 'Online',
      },
    },
    Online: {
      on: {
        turn_off: 'Offline',
        badge_in: {
          guard: ({ event }) => {
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
      on: {
        badge_out: 'Online',
        usage_wattage: {
          target: 'In_Use',
          guard: ({ event, context }) => event.wattage >= context.usageThreshold,
        },
        turn_off: 'Offline',
      },
    },
    In_Use: {
      entry: assign({
        usageStartTime: ({ context }) => Date.now(),
      }),
      exit: [
        'logUsage',
        assign({
          usageStartTime: undefined,
        }),
      ],
      on: {
        usage_wattage: {
          target: 'Unlocked',
          guard: ({ event, context }) => event.wattage < context.usageThreshold,
        },
        badge_out: 'Online',
        turn_off: 'Offline',
      },
    },
  },
})
