import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createScenarioReport,
  fallbackDataBoundaryFixture,
  fallbackHarnessConfig,
  fallbackObservabilityConfig,
  fallbackOwnerConfig,
  type CouponScenarioReport,
  type DataBoundaryFixture,
  type HarnessArtifacts,
  type HarnessConfig,
  type ObservabilityConfig,
  type OwnerConfig,
} from '../src/lib/gateEvaluator.ts'
import type { ScenarioMode } from '../src/domain/coupon.ts'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const artifactPaths = {
  harnessConfig: 'config/harness.json',
  ownersConfig: 'config/owners.json',
  observabilityConfig: 'config/observability.json',
  rollbackNote: 'docs/rollback.md',
  dataBoundaryFixture: 'src/data/redeem-fixture.json',
}

async function main() {
  const args = process.argv.slice(2)
  const mode = parseMode(args)
  const jsonOutput = args.includes('--json')
  const strictExit = args.includes('--strict')
  const artifacts = await loadArtifacts()
  const report = createScenarioReport(mode, artifacts)

  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.log(formatScenarioReport(report))
  }

  if (strictExit && report.summary.blocked) {
    process.exitCode = 1
  }
}

function parseMode(args: string[]): ScenarioMode {
  const modeFlagIndex = args.indexOf('--mode')
  const rawMode = modeFlagIndex >= 0 ? args[modeFlagIndex + 1] : 'fixed'

  if (rawMode === 'buggy' || rawMode === 'fixed') {
    return rawMode
  }

  throw new Error(`Invalid mode: ${rawMode}. Use --mode buggy or --mode fixed.`)
}

async function loadArtifacts(): Promise<HarnessArtifacts> {
  const missingArtifacts: string[] = []
  const harnessConfig = await readJson<HarnessConfig>(artifactPaths.harnessConfig, fallbackHarnessConfig, missingArtifacts)
  const ownersConfig = await readJson<OwnerConfig>(artifactPaths.ownersConfig, fallbackOwnerConfig, missingArtifacts)
  const observabilityConfig = await readJson<ObservabilityConfig>(
    artifactPaths.observabilityConfig,
    fallbackObservabilityConfig,
    missingArtifacts,
  )
  const dataBoundaryFixture = await readJson<DataBoundaryFixture>(
    artifactPaths.dataBoundaryFixture,
    fallbackDataBoundaryFixture,
    missingArtifacts,
  )
  const rollbackNote = await readText(artifactPaths.rollbackNote, '', missingArtifacts)

  return {
    harnessConfig,
    ownersConfig,
    observabilityConfig,
    rollbackNote,
    dataBoundaryFixture,
    artifactPaths,
    missingArtifacts,
  }
}

async function readJson<T>(relativePath: string, fallback: T, missingArtifacts: string[]): Promise<T> {
  try {
    return JSON.parse(await readFile(resolve(rootDir, relativePath), 'utf8')) as T
  } catch {
    missingArtifacts.push(relativePath)
    return fallback
  }
}

async function readText(relativePath: string, fallback: string, missingArtifacts: string[]): Promise<string> {
  try {
    return await readFile(resolve(rootDir, relativePath), 'utf8')
  } catch {
    missingArtifacts.push(relativePath)
    return fallback
  }
}

function formatScenarioReport(report: CouponScenarioReport): string {
  const gateLines = report.gates.map(
    (gate) =>
      `  [${gate.status}] ${gate.label} (${gate.source})\n    observed: ${gate.observed}\n    expected: ${gate.expected}\n    detail: ${gate.detail}`,
  )
  const sliLines = report.sli.map((item) => `  [${item.status}] ${item.label}: observed=${item.observed}; expected=${item.expected}`)

  return [
    `Coupon scenario: ${report.mode}`,
    `Request: ${report.request.couponId} / ${report.request.memberId} / ${report.request.idempotencyKey}`,
    `Balance: ${report.couponResult.balanceBefore} -> ${report.couponResult.balanceAfter} (delta ${report.couponResult.balanceDelta})`,
    `Redemption records: ${report.couponResult.redemptionRecords.length}`,
    `Duplicate charge detected: ${report.couponResult.duplicateChargeDetected}`,
    `Reused first result: ${report.couponResult.reusedResult}`,
    '',
    'SLI/SLO:',
    ...sliLines,
    '',
    `Harness: ${report.summary.blocked ? 'blocked' : 'pass'} (${report.summary.failed}/${report.summary.total} failing gates)`,
    ...gateLines,
    '',
    `Pilot decision: ${report.pilotDecision.decision}`,
    `Reasons: ${report.pilotDecision.reasons.join(', ')}`,
  ].join('\n')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})