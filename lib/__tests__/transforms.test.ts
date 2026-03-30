import { describe, it, expect } from 'vitest'
import {
  transformLeaderboardEntry,
  calculateRanks,
  normalizeProvider,
} from '@/lib/transforms'
import type { ApiLeaderboardEntry } from '@/lib/types'

describe('transformLeaderboardEntry', () => {
  it('should transform API entry to leaderboard entry with value_score', () => {
    const apiEntry: ApiLeaderboardEntry = {
      model: 'claude-sonnet-4',
      provider: 'anthropic',
      best_score_percentage: 0.85,
      latest_submission: '2024-01-15T10:00:00Z',
      best_submission_id: 'sub-123',
      best_cost_usd: 0.50,
      average_cost_usd: 0.60,
      average_execution_time_seconds: 120,
      best_execution_time_seconds: 100,
      submission_count: 5,
      average_score_percentage: 0.80,
    }

    const result = transformLeaderboardEntry(apiEntry)

    expect(result.model).toBe('claude-sonnet-4')
    expect(result.provider).toBe('anthropic')
    expect(result.percentage).toBe(85)
    expect(result.submission_id).toBe('sub-123')
    expect(result.value_score).toBe(170) // 85 * 100 / 0.50
    expect(result.cpst).toBeCloseTo(0.5 / 34) // 0.50 / (0.85 * 40) ≈ 0.0147
    expect(result.rank).toBe(0) // rank is set by calculateRanks
  })

  it('should handle missing cost data', () => {
    const apiEntry: ApiLeaderboardEntry = {
      model: 'gpt-4',
      provider: 'openai',
      best_score_percentage: 0.75,
      latest_submission: '2024-01-15T10:00:00Z',
      best_submission_id: 'sub-456',
      best_cost_usd: null,
      average_cost_usd: null,
    }

    const result = transformLeaderboardEntry(apiEntry)

    expect(result.value_score).toBeNull()
    expect(result.cpst).toBeNull()
  })

  it('should handle zero cost', () => {
    const apiEntry: ApiLeaderboardEntry = {
      model: 'free-model',
      provider: 'openrouter',
      best_score_percentage: 0.50,
      latest_submission: '2024-01-15T10:00:00Z',
      best_submission_id: 'sub-789',
      best_cost_usd: 0,
    }

    const result = transformLeaderboardEntry(apiEntry)

    expect(result.value_score).toBeNull()
    expect(result.cpst).toBeNull()
  })

  it('should normalize openrouter provider from model name', () => {
    const apiEntry: ApiLeaderboardEntry = {
      model: 'anthropic/claude-sonnet-4',
      provider: 'openrouter',
      best_score_percentage: 0.90,
      latest_submission: '2024-01-15T10:00:00Z',
      best_submission_id: 'sub-001',
    }

    const result = transformLeaderboardEntry(apiEntry)

    expect(result.provider).toBe('anthropic')
  })
})

describe('calculateRanks', () => {
  it('should rank entries by percentage descending', () => {
    const entries = [
      { rank: 0, model: 'a', provider: 'p', percentage: 70, timestamp: '2024-01-01', submission_id: '1' },
      { rank: 0, model: 'b', provider: 'p', percentage: 90, timestamp: '2024-01-01', submission_id: '2' },
      { rank: 0, model: 'c', provider: 'p', percentage: 80, timestamp: '2024-01-01', submission_id: '3' },
    ] as any[]

    const result = calculateRanks(entries)

    expect(result[0].rank).toBe(1)
    expect(result[0].model).toBe('b')
    expect(result[1].rank).toBe(2)
    expect(result[1].model).toBe('c')
    expect(result[2].rank).toBe(3)
    expect(result[2].model).toBe('a')
  })

  it('should handle tie-breaking by timestamp', () => {
    const entries = [
      { rank: 0, model: 'a', provider: 'p', percentage: 80, timestamp: '2024-01-01', submission_id: '1' },
      { rank: 0, model: 'b', provider: 'p', percentage: 80, timestamp: '2024-01-02', submission_id: '2' },
    ] as any[]

    const result = calculateRanks(entries)

    expect(result[0].rank).toBe(1)
    expect(result[0].model).toBe('b') // newer timestamp wins
  })

  it('should assign same rank to tied entries', () => {
    const entries = [
      { rank: 0, model: 'a', provider: 'p', percentage: 80, timestamp: '2024-01-02', submission_id: '1' },
      { rank: 0, model: 'b', provider: 'p', percentage: 80, timestamp: '2024-01-01', submission_id: '2' },
    ] as any[]

    const result = calculateRanks(entries)

    expect(result[0].rank).toBe(1)
    expect(result[1].rank).toBe(1) // same rank for tied percentage
  })
})

describe('normalizeProvider', () => {
  it('should return lowercase provider', () => {
    expect(normalizeProvider('Anthropic')).toBe('anthropic')
  })

  it('should extract provider from openrouter model name', () => {
    expect(normalizeProvider('openrouter', 'anthropic/claude-sonnet-4')).toBe('anthropic')
    expect(normalizeProvider('openrouter', 'openai/gpt-4')).toBe('openai')
  })

  it('should return openrouter if no slash in model name', () => {
    expect(normalizeProvider('openrouter', 'some-model')).toBe('openrouter')
  })
})
