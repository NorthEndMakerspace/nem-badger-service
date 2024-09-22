interface DataPoint {
  timestamp: number // Time in milliseconds
  value: number
}

export class RollingAverage {
  private period: number // Rolling average duration in milliseconds
  private data: DataPoint[] = []

  constructor(periodInSeconds: number) {
    this.period = periodInSeconds * 1000 // Convert period to milliseconds
  }

  inputData(value: number): void {
    const timestamp = Date.now() // Record the current time
    this.data.push({ timestamp, value })
  }

  getAverage(): number {
    const currentTime = Date.now()
    const cutoffTime = currentTime - this.period

    // Remove data points older than the cutoff time from the front
    while (this.data.length > 0 && this.data[0].timestamp < cutoffTime) {
      this.data.shift()
    }

    if (this.data.length === 0) {
      return 0 // No data points in the given period
    }

    let sumWeightedValues = 0
    let totalDuration = 0

    // Calculate the time-weighted average
    for (let i = 0; i < this.data.length; i++) {
      const currentPoint = this.data[i]
      const nextTimestamp = i + 1 < this.data.length ? this.data[i + 1].timestamp : currentTime

      const startTime = Math.max(currentPoint.timestamp, cutoffTime)
      const endTime = Math.min(nextTimestamp, currentTime)
      const duration = endTime - startTime

      sumWeightedValues += currentPoint.value * duration
      totalDuration += duration
    }

    if (totalDuration === 0) {
      return 0 // Avoid division by zero
    }

    return sumWeightedValues / totalDuration
  }
}
