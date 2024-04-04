import { createMachine } from 'xstate'

export const toolMachine = createMachine({
  id: 'tool',
  initial: 'Offline',
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
      on: {
        badge_out: 'Online',
        usage_started: 'In_Use',
        turn_off: 'Offline',
      },
    },
    In_Use: {
      on: {
        usage_stopped: 'Unlocked',
        badge_out: 'Online',
        turn_off: 'Offline',
      },
    },
  },
})
