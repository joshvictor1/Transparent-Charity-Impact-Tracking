import { describe, it, expect, beforeEach } from "vitest"

// Mock for Clarity contract interactions
const mockContractState = {
  expenses: new Map(),
  expenseCounter: 0,
  verifiers: new Map(),
  contractOwner: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
}

// Mock functions to simulate contract calls
function recordExpense(projectId, amount, recipient, description) {
  const newExpenseId = mockContractState.expenseCounter + 1
  
  mockContractState.expenseCounter = newExpenseId
  mockContractState.expenses.set(newExpenseId, {
    projectId,
    amount,
    recipient,
    description,
    timestamp: Date.now(),
    verified: false,
    verifier: null,
  })
  
  return { success: true, value: newExpenseId }
}

function verifyExpense(sender, expenseId) {
  if (!mockContractState.expenses.has(expenseId)) {
    return { success: false, error: "Expense not found" }
  }
  
  if (!mockContractState.verifiers.get(sender)) {
    return { success: false, error: "Not authorized" }
  }
  
  const expense = mockContractState.expenses.get(expenseId)
  
  if (expense.verified) {
    return { success: false, error: "Already verified" }
  }
  
  expense.verified = true
  expense.verifier = sender
  mockContractState.expenses.set(expenseId, expense)
  
  return { success: true }
}

function addVerifier(sender, verifier) {
  if (sender !== mockContractState.contractOwner) {
    return { success: false, error: "Not authorized" }
  }
  
  mockContractState.verifiers.set(verifier, true)
  return { success: true }
}

function getExpense(expenseId) {
  return mockContractState.expenses.get(expenseId) || null
}

function isExpenseVerified(expenseId) {
  const expense = mockContractState.expenses.get(expenseId)
  return expense ? expense.verified : false
}

describe("Expense Verification Contract", () => {
  beforeEach(() => {
    // Reset the mock state before each test
    mockContractState.expenses = new Map()
    mockContractState.expenseCounter = 0
    mockContractState.verifiers = new Map()
    mockContractState.contractOwner = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
  })
  
  it("should record an expense correctly", () => {
    const projectId = 1
    const amount = 500
    const recipient = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    const description = "Purchase of building materials"
    
    const result = recordExpense(projectId, amount, recipient, description)
    
    expect(result.success).toBe(true)
    expect(result.value).toBe(1)
    
    const expense = getExpense(result.value)
    expect(expense).not.toBeNull()
    expect(expense.projectId).toBe(projectId)
    expect(expense.amount).toBe(amount)
    expect(expense.recipient).toBe(recipient)
    expect(expense.description).toBe(description)
    expect(expense.verified).toBe(false)
  })
  
  it("should allow a verifier to verify an expense", () => {
    const owner = mockContractState.contractOwner
    const verifier = "ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0"
    
    // Add verifier
    addVerifier(owner, verifier)
    
    // Record expense
    const expenseId = recordExpense(1, 500, "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG", "Test expense").value
    
    // Verify expense
    const result = verifyExpense(verifier, expenseId)
    
    expect(result.success).toBe(true)
    expect(isExpenseVerified(expenseId)).toBe(true)
    
    const expense = getExpense(expenseId)
    expect(expense.verifier).toBe(verifier)
  })
  
  it("should not allow non-verifiers to verify expenses", () => {
    const nonVerifier = "ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0"
    
    // Record expense
    const expenseId = recordExpense(1, 500, "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG", "Test expense").value
    
    // Attempt to verify expense
    const result = verifyExpense(nonVerifier, expenseId)
    
    expect(result.success).toBe(false)
    expect(isExpenseVerified(expenseId)).toBe(false)
  })
  
  it("should not allow verifying an already verified expense", () => {
    const owner = mockContractState.contractOwner
    const verifier = "ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0"
    
    // Add verifier
    addVerifier(owner, verifier)
    
    // Record expense
    const expenseId = recordExpense(1, 500, "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG", "Test expense").value
    
    // Verify expense
    verifyExpense(verifier, expenseId)
    
    // Attempt to verify again
    const result = verifyExpense(verifier, expenseId)
    
    expect(result.success).toBe(false)
  })
})

