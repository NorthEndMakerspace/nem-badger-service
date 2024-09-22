import { RollingAverage } from './RollingAverage' // Adjust the import path accordingly

describe('RollingAverage', () => {
  let rollingAvg: RollingAverage

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2023-01-01T00:00:00Z').getTime())

    // Initialize the RollingAverage with a period of 60 seconds
    rollingAvg = new RollingAverage(60)
  })

  afterEach(() => {
    jest.useRealTimers() // Reset the timers after each test
  })

  it('should return 0 when no data points have been added', () => {
    expect(rollingAvg.getAverage()).toBe(0)
  })

  it('should correctly calculate the average with one data point', () => {
    rollingAvg.inputData(10)
    jest.advanceTimersByTime(1) // 1 milliseconds

    expect(rollingAvg.getAverage()).toBe(10)
  })

  it('should correctly calculate the average with multiple data points', () => {
    rollingAvg.inputData(10)

    // Advance time by 10 seconds
    jest.advanceTimersByTime(10000) // 10,000 milliseconds
    rollingAvg.inputData(20)

    // Advance time by another 20 seconds
    jest.advanceTimersByTime(20000) // Now at 30 seconds
    rollingAvg.inputData(30)

    // Advance time by another 30 seconds (total time is now 60 seconds)
    jest.advanceTimersByTime(30000)

    // Calculate average
    const average = rollingAvg.getAverage()
    expect(average).toBeCloseTo(23.333, 3) // Expected average is around 20

    jest.useRealTimers()
  })

  it('should remove data points older than the period', () => {
    rollingAvg.inputData(10)

    // Advance time by 70 seconds (beyond the period)
    jest.advanceTimersByTime(70000)

    // At this point, the initial data point should be outside the period
    expect(rollingAvg.getAverage()).toBe(0)
  })

  it('should correctly calculate time-weighted average', () => {
    rollingAvg.inputData(10) // At T=0

    // Advance time by 30 seconds
    jest.advanceTimersByTime(30000) // T=30s
    rollingAvg.inputData(20) // At T=30s

    // Advance time by 30 seconds
    jest.advanceTimersByTime(30000) // T=60s
    rollingAvg.inputData(30) // At T=60s

    // Advance time by 30 seconds
    jest.advanceTimersByTime(30000) // T=90s

    // Now compute the average
    const average = rollingAvg.getAverage()

    // Calculation:
    // The period is the last 60 seconds (from T=30s to T=90s)
    // Data points within period:
    // - Value 10 from T=30s to T=30s: duration = 0
    // - Value 20 from T=30s to T=60s: duration = 30s
    // - Value 30 from T=60s to T=90s: duration = 30s
    // Weighted sum = (20 * 30) + (30 * 30) = 600 + 900 = 1500
    // Total duration = 60s
    // Expected average = 1500 / 60 = 25

    expect(average).toBeCloseTo(25, 5)
  })
})
