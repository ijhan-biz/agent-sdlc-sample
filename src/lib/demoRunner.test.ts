import { describe, expect, it } from 'vitest'
import { githubAutomation, githubPipeline } from '../data/scenario'
import { getStageIndex, nextStage, previousStage, stageOrder } from './demoRunner'

describe('demo runner', () => {
  it('keeps the storyline order stable', () => {
    expect(stageOrder).toEqual(['bug', 'ac', 'github', 'pr', 'tests', 'harness', 'pilot'])
  })

  it('moves forward and backward within bounds', () => {
    expect(nextStage('bug')).toBe('ac')
    expect(nextStage('ac')).toBe('github')
    expect(nextStage('pilot')).toBe('pilot')
    expect(previousStage('bug')).toBe('bug')
    expect(previousStage('tests')).toBe('pr')
  })

  it('returns a stable index for each stage', () => {
    expect(getStageIndex('bug')).toBe(0)
    expect(getStageIndex('pilot')).toBe(6)
  })

  it('describes the GitHub code generation handoff', () => {
    expect(githubAutomation.artifacts).toEqual(
      expect.arrayContaining(['.github/ISSUE_TEMPLATE/copilot-codegen-task.yml', '.github/workflows/ci.yml']),
    )
    expect(githubPipeline.map((step) => step.id)).toEqual([
      'issue',
      'agent-plan',
      'copilot-assign',
      'generated-pr',
      'checks',
      'merge-gate',
    ])
  })
})
