import harnessConfig from '../../config/harness.json'
import observabilityConfig from '../../config/observability.json'
import ownersConfig from '../../config/owners.json'
import rollbackNote from '../../docs/rollback.md?raw'
import redeemFixture from './redeem-fixture.json'
import type { DataBoundaryFixture, HarnessArtifacts, HarnessConfig, ObservabilityConfig, OwnerConfig } from '../lib/gateEvaluator'

export const demoHarnessArtifacts: HarnessArtifacts = {
  harnessConfig: harnessConfig as HarnessConfig,
  ownersConfig: ownersConfig as OwnerConfig,
  observabilityConfig: observabilityConfig as ObservabilityConfig,
  rollbackNote,
  dataBoundaryFixture: redeemFixture as DataBoundaryFixture,
  artifactPaths: {
    harnessConfig: 'config/harness.json',
    ownersConfig: 'config/owners.json',
    observabilityConfig: 'config/observability.json',
    rollbackNote: 'docs/rollback.md',
    dataBoundaryFixture: 'src/data/redeem-fixture.json',
  },
}