import { stages, type StageId } from '../data/scenario'

export const stageOrder = stages.map((stage) => stage.id)

export function getStageIndex(stageId: StageId) {
  return Math.max(0, stageOrder.indexOf(stageId))
}

export function nextStage(stageId: StageId): StageId {
  const nextIndex = Math.min(getStageIndex(stageId) + 1, stageOrder.length - 1)
  return stageOrder[nextIndex]
}

export function previousStage(stageId: StageId): StageId {
  const previousIndex = Math.max(getStageIndex(stageId) - 1, 0)
  return stageOrder[previousIndex]
}
