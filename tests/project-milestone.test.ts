import { describe, it, expect, beforeEach } from "vitest"

// Mock for Clarity contract interactions
const mockContractState = {
  projects: new Map(),
  milestones: new Map(),
  projectCounter: 0,
  milestoneCounter: 0,
}

// Mock functions to simulate contract calls
function createProject(name, description, targetAmount) {
  const newProjectId = mockContractState.projectCounter + 1
  
  mockContractState.projectCounter = newProjectId
  mockContractState.projects.set(newProjectId, {
    name,
    description,
    targetAmount,
    startBlock: Date.now(),
    endBlock: null,
    status: "active",
  })
  
  return { success: true, value: newProjectId }
}

function addMilestone(projectId, description, targetBlock) {
  if (!mockContractState.projects.has(projectId)) {
    return { success: false, error: "Project not found" }
  }
  
  const newMilestoneId = mockContractState.milestoneCounter + 1
  
  mockContractState.milestoneCounter = newMilestoneId
  mockContractState.milestones.set(newMilestoneId, {
    projectId,
    description,
    targetBlock,
    completed: false,
    completionBlock: null,
  })
  
  return { success: true, value: newMilestoneId }
}

function completeMilestone(milestoneId) {
  if (!mockContractState.milestones.has(milestoneId)) {
    return { success: false, error: "Milestone not found" }
  }
  
  const milestone = mockContractState.milestones.get(milestoneId)
  
  if (milestone.completed) {
    return { success: false, error: "Milestone already completed" }
  }
  
  milestone.completed = true
  milestone.completionBlock = Date.now()
  mockContractState.milestones.set(milestoneId, milestone)
  
  return { success: true }
}

function getProject(projectId) {
  return mockContractState.projects.get(projectId) || null
}

function getMilestone(milestoneId) {
  return mockContractState.milestones.get(milestoneId) || null
}

describe("Project Milestone Contract", () => {
  beforeEach(() => {
    // Reset the mock state before each test
    mockContractState.projects = new Map()
    mockContractState.milestones = new Map()
    mockContractState.projectCounter = 0
    mockContractState.milestoneCounter = 0
  })
  
  it("should create a project correctly", () => {
    const name = "Clean Water Initiative"
    const description = "Providing clean water to rural communities"
    const targetAmount = 10000
    
    const result = createProject(name, description, targetAmount)
    
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    
    const project = getProject(result.value)
    expect(project).not.toBeNull()
    expect(project.name).toBe(name)
    expect(project.description).toBe(description)
    expect(project.targetAmount).toBe(targetAmount)
    expect(project.status).toBe("active")
  })
  
  it("should add a milestone to an existing project", () => {
    const projectResult = createProject("Education Project", "Building schools", 20000)
    const projectId = projectResult.value
    
    const description = "Complete foundation work"
    const targetBlock = Date.now() + 1000000 // Some future time
    
    const result = addMilestone(projectId, description, targetBlock)
    
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    
    const milestone = getMilestone(result.value)
    expect(milestone).not.toBeNull()
    expect(milestone.projectId).toBe(projectId)
    expect(milestone.description).toBe(description)
    expect(milestone.targetBlock).toBe(targetBlock)
    expect(milestone.completed).toBe(false)
  })
  
  it("should fail to add a milestone to a non-existent project", () => {
    const nonExistentProjectId = 999
    
    const result = addMilestone(nonExistentProjectId, "Test milestone", Date.now() + 1000000)
    
    expect(result.success).toBe(false)
  })
  
  it("should complete a milestone correctly", () => {
    const projectId = createProject("Health Project", "Building clinics", 30000).value
    const milestoneId = addMilestone(projectId, "Purchase medical equipment", Date.now() + 1000000).value
    
    const result = completeMilestone(milestoneId)
    
    expect(result.success).toBe(true)
    
    const milestone = getMilestone(milestoneId)
    expect(milestone.completed).toBe(true)
    expect(milestone.completionBlock).not.toBeNull()
  })
  
  it("should fail to complete an already completed milestone", () => {
    const projectId = createProject("Health Project", "Building clinics", 30000).value
    const milestoneId = addMilestone(projectId, "Purchase medical equipment", Date.now() + 1000000).value
    
    completeMilestone(milestoneId)
    const result = completeMilestone(milestoneId)
    
    expect(result.success).toBe(false)
  })
})

