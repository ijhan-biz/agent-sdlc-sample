# Coupon Redeem Rollback

## Rollback trigger

Rollback is required when retry traffic shows duplicate coupon redemption, a required check fails, or the harness reports `blocked` for the fixed scenario.

## Owner

The rollback owner is `coupon-service-owner`.

## Disable path

Disable the idempotency rollout with the `coupon.idempotency.v2` feature flag, stop pilot traffic for the coupon retry path, and keep the runner in `--mode buggy` only for reproduction. Re-enable the fixed path only after the strict harness passes.

## Traffic action

Route pilot traffic back to the stable redeem path and keep new rollout traffic at 0% until the duplicate charge alert is clear.

## Data correction

If duplicate redemption records are observed, freeze coupon settlement for the affected pilot window and hand the record list to `coupon-service-owner` for manual correction.

## Alert path

The duplicate charge alert pages `coupon-service-owner` through the `demo-pager` channel defined in `config/observability.json`.

## Validation command

Run `npm run demo:scenario -- --mode fixed --strict` and confirm `summary.blocked=false` before the pilot can move to Go.