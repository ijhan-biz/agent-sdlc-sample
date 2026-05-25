import { describe, expect, it } from 'vitest'
import { getStageIndex, nextStage, previousStage, stageOrder } from './demoRunner'

describe('demo runner', () => {
  it('keeps the storyline order stable', () => {
    expect(stageOrder).toEqual(['bug', 'ac', 'pr', 'tests', 'harness', 'pilot'])
  })

  it('moves forward and backward within bounds', () => {
    expect(nextStage('bug')).toBe('ac')
    expect(nextStage('pilot')).toBe('pilot')
    expect(previousStage('bug')).toBe('bug')
    expect(previousStage('tests')).toBe('pr')
  })

  it('returns a stable index for each stage', () => {
    expect(getStageIndex('bug')).toBe(0)
    expect(getStageIndex('pilot')).toBe(5)
  })
})
