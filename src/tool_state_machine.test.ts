import jest from 'jest'
import { toolMachine } from './tool_state_machine'
import { ActorRefFrom, createActor } from 'xstate'

const WATTAGE_THRESHOLD = 100
const TIMEOUT = 600
describe('ToolStateMachine', () => {
  let toolLaser: ActorRefFrom<typeof toolMachine>
  // let listenerSpy = jest.fn()
  beforeEach(() => {
    toolLaser = createActor(toolMachine, {
      input: {
        toolId: 'laser_mira',
        usageThreshold: WATTAGE_THRESHOLD,
        timeoutSeconds: TIMEOUT,
      },
    })
    // toolLaser.subscribe(listenerSpy)
    toolLaser.start()
  })

  afterEach(() => {
    // listenerSpy.mockClear()
  })

  describe('Offline state', () => {
    it('starts in Offline state', () => {
      // expect(listenerSpy).toHaveBeenCalledTimes(1)
      // verify that first call has value: "Offline"
      expect(toolLaser.getSnapshot().value).toBe('Offline')
    })

    it('should not transition to other states', () => {
      toolLaser.send({ type: 'badge_in', user_id: '123' })
      expect(toolLaser.getSnapshot().value).toBe('Offline')
    })

    it('transitions to Online when turn_on is called', () => {
      toolLaser.send({ type: 'turn_on' })
      expect(toolLaser.getSnapshot().value).toBe('Online')
    })

    it('should log online_start when becoming Online', () => {
      // TODO
    })
  })

  describe('Online state', () => {
    beforeEach(() => {
      toolLaser.send({ type: 'turn_on' })
    })

    it('should transition to Offline when turn_off', () => {
      toolLaser.send({ type: 'turn_off' })
      expect(toolLaser.getSnapshot().value).toBe('Offline')
    })

    it('should transition to Unlocked when auth is correct', () => {
      toolLaser.send({ type: 'badge_in', user_id: '123' })
      const state = toolLaser.getSnapshot()
      expect(state.value).toBe('Unlocked')
      expect(state.context.currentUserId).toBe('123')
    })

    it('should remain in Online when auth is not correct', () => {
      toolLaser.send({ type: 'badge_in', user_id: 'INCORRECT' })
      const state = toolLaser.getSnapshot()
      expect(state.value).toBe('Online')
    })

    it('should log online_ended when becomes Offline', () => {
      // TODO
    })

    it('should log unlocked_started when becomes Unlocked', () => {
      // TODO
    })
  })

  describe('when Unlocked', () => {
    beforeEach(() => {
      toolLaser.send({ type: 'turn_on' })
      toolLaser.send({ type: 'badge_in', user_id: '123' })
    })

    it('usageStartTime must be empty before usage_started', () => {
      expect(toolLaser.getSnapshot().context.usageStartTime).toBeUndefined()
    })

    it('should stay Unlocked when usage_wattage is below threshold', () => {
      toolLaser.send({ type: 'usage_wattage', wattage: WATTAGE_THRESHOLD - 1 })
      expect(toolLaser.getSnapshot().value).toBe('Unlocked')
    })

    it('should transition to In_Use when usage_wattage is above threshold', () => {
      toolLaser.send({ type: 'usage_wattage', wattage: WATTAGE_THRESHOLD + 1 })
      expect(toolLaser.getSnapshot().value).toBe('In_Use')
    })

    it('should remember time when usage has started', () => {
      // fake Date.now to return a fixed value
      const now = Date.now()
      toolLaser.send({ type: 'usage_wattage', wattage: WATTAGE_THRESHOLD + 1 })
      expect(toolLaser.getSnapshot().context.usageStartTime).toBe(now)
    })

    it('should transition to Online when badge_out', () => {
      toolLaser.send({ type: 'badge_out' })
      expect(toolLaser.getSnapshot().value).toBe('Online')
    })

    it('should log usage_started event when becomes In_Use', () => {
      // TODO
      expect(false).toBe(true)
    })

    it('should log unlocked_ended event when badge_out', () => {
      // TODO
      expect(false).toBe(true)
    })
  })

  describe('when In_Use', () => {
    let usage_start_ts
    beforeEach(() => {
      toolLaser.send({ type: 'turn_on' })
      toolLaser.send({ type: 'badge_in', user_id: '123' })
      usage_start_ts = Date.now()
      toolLaser.send({ type: 'usage_wattage', wattage: WATTAGE_THRESHOLD + 1 })
    })

    it('should stay In_Use while usage_wattage is above threshold', () => {
      toolLaser.send({ type: 'usage_wattage', wattage: WATTAGE_THRESHOLD + 100 })
      expect(toolLaser.getSnapshot().value).toBe('In_Use')
      toolLaser.send({ type: 'usage_wattage', wattage: WATTAGE_THRESHOLD + 1 })
      expect(toolLaser.getSnapshot().value).toBe('In_Use')
      toolLaser.send({ type: 'usage_wattage', wattage: WATTAGE_THRESHOLD })
      expect(toolLaser.getSnapshot().value).toBe('In_Use')
    })

    it('should transition to Unlocked when usage_wattage is below threshold', () => {
      toolLaser.send({ type: 'usage_wattage', wattage: WATTAGE_THRESHOLD - 1 })
      expect(toolLaser.getSnapshot().value).toBe('Unlocked')
    })

    it('should report usage_time into Notion', () => {
      // TODO
    })

    it('should log usage_stopped event when becomes Unlocked', () => {
      // TODO
    })

    it('should log usage_ended when usage_stopped', () => {
      // TODO
    })

    it('should log usage_ended when badge_out', () => {
      // TODO
    })

    it('should log usage_ended when turn_off', () => {
      // TODO
    })
  })
})
