import { describe, it, expect, beforeEach } from 'vitest'
import { mockNet } from './mocks'

describe('prediction-market', () => {
  let client: any
  
  beforeEach(() => {
    client = mockNet.createClient()
  })
  
  it('creates a market successfully', async () => {
    const description = 'Will a black swan event occur in 2024?'
    const resolutionTime = 1000 // Some future block height
    
    const result = await client.createMarket(description, resolutionTime)
    expect(result.success).toBe(true)
    expect(typeof result.value).toBe('number')
  })
  
  it('places bets successfully', async () => {
    const marketId = 0
    const betOnYes = true
    const amount = 100
    
    const result = await client.placeBet(marketId, betOnYes, amount)
    expect(result.success).toBe(true)
  })
  
  it('resolves market successfully', async () => {
    const marketId = 0
    const outcome = true
    
    const result = await client.resolveMarket(marketId, outcome)
    expect(result.success).toBe(true)
  })
  
  it('claims winnings successfully', async () => {
    const marketId = 0
    
    const result = await client.claimWinnings(marketId)
    expect(result.success).toBe(true)
    expect(typeof result.value).toBe('number')
  })
  
  it('deposits funds successfully', async () => {
    const amount = 1000
    
    const result = await client.deposit(amount)
    expect(result.success).toBe(true)
  })
  
  it('withdraws funds successfully', async () => {
    const amount = 500
    
    const result = await client.withdraw(amount)
    expect(result.success).toBe(true)
  })
  
  it('fails to place bet on closed market', async () => {
    const marketId = 0
    const betOnYes = true
    const amount = 100
    
    // First, resolve the market
    await client.resolveMarket(marketId, true)
    
    // Then try to place a bet
    const result = await client.placeBet(marketId, betOnYes, amount)
    expect(result.success).toBe(false)
    expect(result.error).toBe(105) // err-market-closed
  })
  
  // New test case to specifically check for success
  it('successfully performs a complete prediction market cycle', async () => {
    // Create a market
    const createResult = await client.createMarket('Will it rain tomorrow?', 1000)
    expect(createResult.success).toBe(true)
    const marketId = createResult.value
    
    // Place a bet
    const betResult = await client.placeBet(marketId, true, 100)
    expect(betResult.success).toBe(true)
    
    // Resolve the market
    const resolveResult = await client.resolveMarket(marketId, true)
    expect(resolveResult.success).toBe(true)
    
    // Claim winnings
    const claimResult = await client.claimWinnings(marketId)
    expect(claimResult.success).toBe(true)
  })
})

