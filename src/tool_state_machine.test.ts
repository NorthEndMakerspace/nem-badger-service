import { toolMachine } from './tool_state_machine'
import { ActorRefFrom, createActor } from 'xstate'

describe('ToolStateMachine', () => {
  let toolLaser: ActorRefFrom<typeof toolMachine>
  let listenerSpy = jest.fn()
  beforeEach(() => {
    toolLaser = createActor(toolMachine, { input: { toolId: 'laser_mira' } })
    toolLaser.subscribe(listenerSpy)
    toolLaser.start()
  })

  afterEach(() => {
    listenerSpy.mockClear()
  })

  it('should start in Offline state', () => {
    expect(listenerSpy).toHaveBeenCalledTimes(1)
    // verify that first call has value: "Offline"
    expect(toolLaser.getSnapshot().value).toBe('Offline')
  })

  it('should transition to Online state when turn_on', () => {
    toolLaser.send({ type: 'turn_on' })
    expect(listenerSpy).toHaveBeenCalledTimes(3)
    expect(toolLaser.getSnapshot().value).toBe('Online')
  })

  it('should not transition when Offline', () => {
    toolLaser.send({ type: 'usage_started' })
    expect(toolLaser.getSnapshot().value).toBe('Offline')
  })

  describe('when Online', () => {
    beforeEach(() => {
      toolLaser.send({ type: 'turn_on' })
    })

    it('should transition to Offline when turn_off', () => {
      toolLaser.send({ type: 'turn_off' })
      expect(toolLaser.getSnapshot().value).toBe('Offline')
    })

    it('should transition to Unlocked when auth is correct', () => {
      toolLaser.send({ type: 'auth', user_id: '123' })
      const state = toolLaser.getSnapshot()
      expect(state.value).toBe('Unlocked')
      expect(state.context.currentUserId).toBe('123')
    })

    it('should remain in Online when auth is not correct', () => {
      toolLaser.send({ type: 'auth', user_id: 'INCORRECT' })
      const state = toolLaser.getSnapshot()
      expect(state.value).toBe('Online')
    })
  })

  describe('when Unlocked', () => {
    beforeEach(() => {
      toolLaser.send({ type: 'turn_on' })
      toolLaser.send({ type: 'auth', user_id: '123' })
    })

    it('usageStartTime must be empty before usage_started', () => {
      expect(toolLaser.getSnapshot().context.usageStartTime).toBeUndefined()
    })

    it('should transition to In_Use when usage_started', () => {
      toolLaser.send({ type: 'usage_started' })
      expect(toolLaser.getSnapshot().value).toBe('In_Use')
    })

    it('should log when usage started happening', () => {
      // fake Date.now to return a fixed value
      const now = Date.now()
      toolLaser.send({ type: 'usage_started' })
      expect(toolLaser.getSnapshot().context.usageStartTime).toBe(now)
    })

    it('should transition to Online when badge_out', () => {
      toolLaser.send({ type: 'badge_out' })
      expect(toolLaser.getSnapshot().value).toBe('Online')
    })
  })
})
