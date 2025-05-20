import { describe, it, expect, beforeEach } from "vitest"

// Mock the Clarity contract environment
const mockContractState = {
  admin: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  consumerProfiles: new Map(),
  dataSharingConsent: new Map(),
  blockHeight: 100,
}

// Mock contract functions
const mockContract = {
  registerConsumer: (caller: string, username: string) => {
    mockContractState.consumerProfiles.set(caller, {
      username: username,
      registrationDate: mockContractState.blockHeight,
      preferencesShared: false,
    })
    
    return { success: true }
  },
  
  updateDataSharingConsent: (caller: string, transactionConsent: boolean, preferenceConsent: boolean) => {
    mockContractState.dataSharingConsent.set(caller, {
      transactionData: transactionConsent,
      preferenceData: preferenceConsent,
      lastUpdated: mockContractState.blockHeight,
    })
    
    return { success: true }
  },
  
  consumerExists: (consumer: string) => {
    return mockContractState.consumerProfiles.has(consumer)
  },
  
  getConsumerProfile: (consumer: string) => {
    return mockContractState.consumerProfiles.get(consumer) || null
  },
  
  getConsumerConsent: (consumer: string) => {
    return (
        mockContractState.dataSharingConsent.get(consumer) || {
          transactionData: false,
          preferenceData: false,
          lastUpdated: 0,
        }
    )
  },
  
  markPreferencesShared: (caller: string, consumer: string) => {
    if (!mockContractState.consumerProfiles.has(consumer)) {
      return { error: 2 }
    }
    
    if (caller !== mockContractState.admin && caller !== consumer) {
      return { error: 1 }
    }
    
    const profile = mockContractState.consumerProfiles.get(consumer)
    mockContractState.consumerProfiles.set(consumer, {
      ...profile,
      preferencesShared: true,
    })
    
    return { success: true }
  },
}

describe("Consumer Identity Contract", () => {
  beforeEach(() => {
    mockContractState.consumerProfiles.clear()
    mockContractState.dataSharingConsent.clear()
    mockContractState.admin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    mockContractState.blockHeight = 100
  })
  
  it("should register a consumer", () => {
    const consumer = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    const result = mockContract.registerConsumer(consumer, "TestUser")
    
    expect(result).toHaveProperty("success", true)
    expect(mockContractState.consumerProfiles.has(consumer)).toBe(true)
    
    const profile = mockContractState.consumerProfiles.get(consumer)
    expect(profile.username).toBe("TestUser")
    expect(profile.registrationDate).toBe(100)
    expect(profile.preferencesShared).toBe(false)
  })
  
  it("should update data sharing consent", () => {
    const consumer = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    const result = mockContract.updateDataSharingConsent(consumer, true, false)
    
    expect(result).toHaveProperty("success", true)
    expect(mockContractState.dataSharingConsent.has(consumer)).toBe(true)
    
    const consent = mockContractState.dataSharingConsent.get(consumer)
    expect(consent.transactionData).toBe(true)
    expect(consent.preferenceData).toBe(false)
    expect(consent.lastUpdated).toBe(100)
  })
  
  it("should check if a consumer exists", () => {
    const consumer = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    
    // Consumer doesn't exist initially
    expect(mockContract.consumerExists(consumer)).toBe(false)
    
    // Register the consumer
    mockContract.registerConsumer(consumer, "TestUser")
    
    // Consumer should now exist
    expect(mockContract.consumerExists(consumer)).toBe(true)
  })
  
  it("should get consumer profile", () => {
    const consumer = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    
    // No profile initially
    expect(mockContract.getConsumerProfile(consumer)).toBe(null)
    
    // Register the consumer
    mockContract.registerConsumer(consumer, "TestUser")
    
    // Get the profile
    const profile = mockContract.getConsumerProfile(consumer)
    expect(profile).not.toBe(null)
    expect(profile.username).toBe("TestUser")
  })
  
  it("should get consumer consent", () => {
    const consumer = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    
    // Default consent values initially
    const initialConsent = mockContract.getConsumerConsent(consumer)
    expect(initialConsent.transactionData).toBe(false)
    expect(initialConsent.preferenceData).toBe(false)
    
    // Update consent
    mockContract.updateDataSharingConsent(consumer, true, true)
    
    // Get updated consent
    const updatedConsent = mockContract.getConsumerConsent(consumer)
    expect(updatedConsent.transactionData).toBe(true)
    expect(updatedConsent.preferenceData).toBe(true)
  })
  
  it("should mark preferences as shared", () => {
    const consumer = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    
    // Register the consumer
    mockContract.registerConsumer(consumer, "TestUser")
    
    // Mark preferences as shared (by the consumer)
    const result = mockContract.markPreferencesShared(consumer, consumer)
    expect(result).toHaveProperty("success", true)
    
    // Check that preferences are marked as shared
    const profile = mockContract.getConsumerProfile(consumer)
    expect(profile.preferencesShared).toBe(true)
  })
  
  it("should not mark preferences as shared for non-existent consumer", () => {
    const consumer = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    
    // Try to mark preferences as shared for non-existent consumer
    const result = mockContract.markPreferencesShared("ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", consumer)
    
    expect(result).toHaveProperty("error", 2)
  })
  
  it("should not allow unauthorized users to mark preferences as shared", () => {
    const consumer = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
    const unauthorized = "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP"
    
    // Register the consumer
    mockContract.registerConsumer(consumer, "TestUser")
    
    // Try to mark preferences as shared by unauthorized user
    const result = mockContract.markPreferencesShared(unauthorized, consumer)
    expect(result).toHaveProperty("error", 1)
    
    // Check that preferences are not marked as shared
    const profile = mockContract.getConsumerProfile(consumer)
    expect(profile.preferencesShared).toBe(false)
  })
})
