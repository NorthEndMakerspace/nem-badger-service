import { setup, assign } from 'xstate'

export const toolMachine = setup({
  types: {
    input: {} as {
      toolId: string
    },
    events: {} as
      | { type: 'turn_on' }
      | { type: 'auth'; user_id: string }
      | { type: 'turn_off' }
      | { type: 'badge_out' }
      | { type: 'usage_started' },
  },
  actions: {
    logState: () => {
      // TODO log state change
    },
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
  }),
  states: {
    Offline: {
      entry: ['logState'],
      on: {
        ping: 'Online',
        turn_on: 'Online',
      },
    },
    Online: {
      on: {
        turn_off: 'Offline',
        auth: {
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
        usage_started: 'In_Use',
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
        usage_stopped: 'Unlocked',
        badge_out: 'Online',
        turn_off: 'Offline',
      },
    },
  },
})
