import { describe, it, expect, beforeEach } from "vitest"

// Mock for Clarity contract interactions
const mockContractState = {
  impactMetrics: new Map(),
  impactUpdates: new Map(),
  metricCounter: 0,
  updateCounter: 0,
  impactReporters: new Map(),
  contractOwner: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
}

// Mock functions to simulate contract calls
function createMetric(projectId, name, description, targetValue, unit) {
  const newMetricId = mockContractState.metricCounter + 1
  
  mockContractState.metricCounter = newMetricId
  mockContractState.impactMetrics.set(newMetricId, {
    projectId,
    name,
    description,
    targetValue,
    currentValue: 0,
    unit,
  })
  
  return { success: true, value: newMetricId }
}

function updateMetricValue(sender, metricId, newValue) {
  if (!mockContractState.impactMetrics.has(metricId)) {
    return { success: false, error: "Metric not found" }
  }
  
  if (!mockContractState.impactReporters.get(sender)) {
    return { success: false, error: "Not authorized" }
  }
  
  const metric = mockContractState.impactMetrics.get(metricId)
  const oldValue = metric.currentValue
  const newUpdateId = mockContractState.updateCounter + 1
  
  mockContractState.updateCounter = newUpdateId
  mockContractState.impactUpdates.set(newUpdateId, {
    metricId,
    oldValue,
    newValue,
    timestamp: Date.now(),
    reporter: sender,
  })
  
  metric.currentValue = newValue
  mockContractState.impactMetrics.set(metricId, metric)
  
  return { success: true, value: newUpdateId }
}

function addReporter(sender, reporter) {
  if (sender !== mockContractState.contractOwner) {
    return { success: false, error: "Not authorized" }
  }
  
  mockContractState.impactReporters.set(reporter, true)
  return { success: true }
}

function getMetric(metricId) {
  return mockContractState.impactMetrics.get(metricId) || null
}

function getMetricProgress(metricId) {
  const metric = mockContractState.impactMetrics.get(metricId)
  
  if (!metric) {
    return 0
  }
  
  if (metric.targetValue === 0) {
    return 0
  }
  
  return (metric.currentValue * 100) / metric.targetValue
}

function getUpdate(updateId) {
  return mockContractState.impactUpdates.get(updateId) || null
}

describe("Impact Measurement Contract", () => {
  beforeEach(() => {
    // Reset the mock state before each test
    mockContractState.impactMetrics = new Map()
    mockContractState.impactUpdates = new Map()
    mockContractState.metricCounter = 0
    mockContractState.updateCounter = 0
    mockContractState.impactReporters = new Map()
    mockContractState.contractOwner = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  })
  
  it("should create an impact metric correctly", () => {
    const projectId = 1
    const name = "People Served"
    const description = "Number of people who received clean water"
    const targetValue = 1000
    const unit = "people"
    
    const result = createMetric(projectId, name, description, targetValue, unit)
    
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    
    const metric = getMetric(result.value)
    expect(metric).not.toBeNull()
    expect(metric.projectId).toBe(projectId)
    expect(metric.name).toBe(name)
    expect(metric.description).toBe(description)
    expect(metric.targetValue).toBe(targetValue)
    expect(metric.currentValue).toBe(0)
    expect(metric.unit).toBe(unit)
  })
  
  it("should allow a reporter to update a metric value", () => {
    const owner = mockContractState.contractOwner
    const reporter = "ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0"
    
    // Add reporter
    addReporter(owner, reporter)
    
    // Create metric
    const metricId = createMetric(1, "Trees Planted", "Number of trees planted", 500, "trees").value
    
    // Update metric value
    const newValue = 100
    const result = updateMetricValue(reporter, metricId, newValue)
    
    expect(result.success).toBe(true)
    
    const metric = getMetric(metricId)
    expect(metric.currentValue).toBe(newValue)
    
    const update = getUpdate(result.value)
    expect(update).not.toBeNull()
    expect(update.metricId).toBe(metricId)
    expect(update.oldValue).toBe(0)
    expect(update.newValue).toBe(newValue)
    expect(update.reporter).toBe(reporter)
  })
  
  it("should not allow non-reporters to update metric values", () => {
    const nonReporter = "ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0"
    
    // Create metric
    const metricId = createMetric(1, "Trees Planted", "Number of trees planted", 500, "trees").value
    
    // Attempt to update metric value
    const result = updateMetricValue(nonReporter, metricId, 100)
    
    expect(result.success).toBe(false)
    
    const metric = getMetric(metricId)
    expect(metric.currentValue).toBe(0)
  })
  
  it("should calculate metric progress correctly", () => {
    const owner = mockContractState.contractOwner
    const reporter = "ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0"
    
    // Add reporter
    addReporter(owner, reporter)
    
    // Create metric
    const metricId = createMetric(1, "Trees Planted", "Number of trees planted", 500, "trees").value
    
    // Initial progress should be 0
    expect(getMetricProgress(metricId)).toBe(0)
    
    // Update metric value to 20% of target
    updateMetricValue(reporter, metricId, 100)
    expect(getMetricProgress(metricId)).toBe(20)
    
    // Update metric value to 50% of target
    updateMetricValue(reporter, metricId, 250)
    expect(getMetricProgress(metricId)).toBe(50)
    
    // Update metric value to 100% of target
    updateMetricValue(reporter, metricId, 500)
    expect(getMetricProgress(metricId)).toBe(100)
  })
})

