import { setup, assign } from 'xstate'

export const toolMachine = setup({
  types: {
    input: {} as {
      toolId: string
    },
  },
  actions: {
    logState: () => {
      // TODO log state change
    },
    logUsage: () => {
      // TODO Log usage to DB/Redis/Notion
    },
    unlocked: () => {
      // TODO Remember user ID
    },
    locked: () => {
      // TODO Forget user ID. Logging.
    },
  },
}).createMachine({
  id: 'tool',
  initial: 'Offline',
  context: ({ input }) => ({
    currentUserId: undefined,
    usageStartTime: undefined,
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
        auth: 'Unlocking',
      },
    },
    Unlocking: {
      on: {
        success: 'Unlocked',
        fail: 'Online',
        turn_off: 'Offline',
      },
    },
    Unlocked: {
      entry: ['unlocked'],
      exit: ['locked'],
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
