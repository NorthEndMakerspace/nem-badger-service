import { createMachine } from 'xstate'

export const toolMachine = createMachine({
  id: 'tool',

  initial: 'offline',
  states: {
    Offline: {
      on: { turn_on: 'Online' },
    },
    Online: {
      on: { turn_off: 'Offline' },
    },
  },
})
