import { Tool } from './tool'

// Mock the logger module
jest.mock('./logger', () => ({
  logger: jest.fn(),
}))

jest.mock('./ha', () => ({
  callWebhook: jest.fn(),
}))

const logger = require('./logger').logger

const WATTAGE_THRESHOLD = 100
const TIMEOUT = 600
const USER_ID = '123'
jest.useFakeTimers()

describe('Tool', () => {
  let toolLaser: Tool

  beforeEach(() => {
    toolLaser = new Tool('Laser Mira', 'laser_mira', 'mira_12345', {
      usageThreshold: WATTAGE_THRESHOLD,
      timeoutSeconds: TIMEOUT,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('starts as Offline', () => {
    expect(toolLaser.status()).toBe('Offline')
    expect(logger).not.toHaveBeenCalled()
  })

  describe('becomes Online', () => {
    beforeEach(() => {
      toolLaser.becameOnline()
    })

    it('becomes Online', () => {
      expect(toolLaser.status()).toBe('Online')
      expect(logger).toHaveBeenCalledWith('online_start')
    })

    it('becomes Offline after Online', () => {
      toolLaser.becameOffline()
      expect(toolLaser.status()).toBe('Offline')
      expect(logger).toHaveBeenCalledWith('online_end')
    })
  })

  it('end to end scenario', async () => {
    toolLaser.becameOnline()
    toolLaser.reportWattage(WATTAGE_THRESHOLD * 0.3)
    jest.advanceTimersByTime(1000)
    toolLaser.reportWattage(WATTAGE_THRESHOLD * 0.5)
    jest.advanceTimersByTime(1000)
    await toolLaser.unlock(USER_ID)
    expect(logger).toHaveBeenCalledWith('unlocked_start', { userId: USER_ID })
    toolLaser.reportWattage(WATTAGE_THRESHOLD * 0.7)
    jest.advanceTimersByTime(1000)
    expect(logger).not.toHaveBeenCalledWith('usage_start')
    toolLaser.reportWattage(WATTAGE_THRESHOLD * 1.1)
    expect(logger).toHaveBeenCalledWith('usage_start', { userId: USER_ID })
    jest.advanceTimersByTime(10000)
    toolLaser.reportWattage(WATTAGE_THRESHOLD * 1.5)
    jest.advanceTimersByTime(10000)
    toolLaser.reportWattage(WATTAGE_THRESHOLD * 2)
    jest.advanceTimersByTime(100000)
    toolLaser.reportWattage(WATTAGE_THRESHOLD * 0.9)
    expect(logger).toHaveBeenCalledWith('usage_end', { userId: USER_ID, usageSeconds: 120 })
    toolLaser.lock()
    expect(logger).toHaveBeenCalledWith('unlocked_end', { userId: USER_ID })
  })

  it('end to end: turned off while being used', async () => {
    toolLaser.becameOnline()
    await toolLaser.unlock(USER_ID)
    toolLaser.reportWattage(WATTAGE_THRESHOLD * 1.1)
    expect(logger).toHaveBeenCalledWith('usage_start', { userId: USER_ID })
    jest.advanceTimersByTime(10000)
    toolLaser.reportWattage(WATTAGE_THRESHOLD * 1.5)
    jest.advanceTimersByTime(10000)
    toolLaser.reportWattage(WATTAGE_THRESHOLD * 2)
    jest.advanceTimersByTime(100000)
    toolLaser.becameOffline()
    expect(logger).toHaveBeenCalledWith('usage_end', { userId: USER_ID, usageSeconds: 120 })
    expect(logger).toHaveBeenCalledWith('unlocked_end', { userId: USER_ID })
    expect(logger).toHaveBeenCalledWith('online_end')
  })
})
