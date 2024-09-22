import { ToolMachine } from './tool_state_machine'
import { ActorRefFrom, createActor } from 'xstate'

const WATTAGE_THRESHOLD = 100
const TIMEOUT = 600
const USER_ID = '123'

describe('ToolStateMachine', () => {
  let toolLaser: ActorRefFrom<typeof ToolMachine>
  let logger: typeof jest.fn

  beforeEach(() => {
    logger = jest.fn()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-01-01T00:00:00Z').getTime())

    toolLaser = createActor(ToolMachine, {
      input: {
        toolId: 'laser_mira',
        usageThreshold: WATTAGE_THRESHOLD,
        timeoutSeconds: TIMEOUT,
        logger,
      },
    })
    toolLaser.start()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  describe('Offline state', () => {
    it('starts in Offline state', () => {
      // verify that first call has value: "Offline"
      expect(toolLaser.getSnapshot().value).toBe('Offline')
    })

    it('should not transition to other states', () => {
      toolLaser.send({ type: 'badge_in', user_id: USER_ID })
      expect(toolLaser.getSnapshot().value).toBe('Offline')
    })

    it('transitions to Online when turn_on is called', () => {
      toolLaser.send({ type: 'turn_on' })
      expect(toolLaser.getSnapshot().value).toBe('Online')
    })

    it('should log online_start when becoming Online', () => {
      expect(logger).toHaveBeenCalledTimes(0)
      toolLaser.send({ type: 'turn_on' })
      expect(logger).toHaveBeenCalledWith('online_start')
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
      toolLaser.send({ type: 'badge_in', user_id: USER_ID })
      const state = toolLaser.getSnapshot()
      expect(state.value).toBe('Unlocked')
      expect(state.context.currentUserId).toBe(USER_ID)
    })

    it('should remain in Online when auth is not correct', () => {
      toolLaser.send({ type: 'badge_in', user_id: 'INCORRECT' })
      const state = toolLaser.getSnapshot()
      expect(state.value).toBe('Online')
    })

    it('should log online_end when becomes Offline', () => {
      toolLaser.send({ type: 'turn_off' })
      expect(toolLaser.getSnapshot().value).toBe('Offline')
      expect(logger).toHaveBeenCalledWith('online_end')
    })

    it('should log unlocked_start when becomes Unlocked', () => {
      toolLaser.send({ type: 'badge_in', user_id: USER_ID })
      expect(logger).toHaveBeenCalledWith('unlocked_start', { userId: USER_ID })
    })
  })

  describe('when Unlocked', () => {
    beforeEach(() => {
      toolLaser.send({ type: 'turn_on' })
      toolLaser.send({ type: 'badge_in', user_id: USER_ID })
    })

    it('usageStartTime must be empty before usage_start', () => {
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

    it('should log unlocked_start event when becomes In_Use', () => {
      expect(logger).toHaveBeenCalledWith('unlocked_start', { userId: USER_ID })
    })

    it('should log unlocked_end event when badge_out', () => {
      toolLaser.send({ type: 'badge_out' })
      expect(logger).toHaveBeenCalledWith('unlocked_end', { userId: USER_ID })
    })

    it('should log usage_start event when wattage is above threshold', () => {
      toolLaser.send({ type: 'usage_wattage', wattage: WATTAGE_THRESHOLD + 1 })
      expect(logger).toHaveBeenCalledWith('usage_start', { userId: USER_ID })
    })
  })

  describe('when In_Use', () => {
    let usage_start_ts
    beforeEach(() => {
      toolLaser.send({ type: 'turn_on' })
      toolLaser.send({ type: 'badge_in', user_id: USER_ID })
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

    it('should calculate usage time correctly', () => {
      const USAGE_SECONDS = 100
      jest.advanceTimersByTime(USAGE_SECONDS * 1000)
      toolLaser.send({ type: 'usage_wattage', wattage: WATTAGE_THRESHOLD - 1 })
      expect(logger).toHaveBeenCalledWith('usage_end', { userId: USER_ID, usageSeconds: USAGE_SECONDS })
    })

    it('should log usage_end when badge_out', () => {
      const USAGE_SECONDS = 100
      jest.advanceTimersByTime(USAGE_SECONDS * 1000)
      toolLaser.send({ type: 'badge_out' })
      expect(logger).toHaveBeenCalledWith('usage_end', { userId: USER_ID, usageSeconds: USAGE_SECONDS })
    })

    it('should log usage_ended when suddenly turns off', () => {
      const USAGE_SECONDS = 100
      jest.advanceTimersByTime(USAGE_SECONDS * 1000)
      toolLaser.send({ type: 'turn_off' })
      expect(logger).toHaveBeenCalledWith('usage_end', { userId: USER_ID, usageSeconds: USAGE_SECONDS })
    })
  })
})
