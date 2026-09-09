# Changelog

All notable changes to this project will be documented in this file.

## [v2.3.0] - 2026-09-09

### Added

- `--insecure` (`-k`) on the CLI skips server certificate verification for loopback hosts only. A local authentication or resource API is normally run with a self-signed certificate, so a run against localhost failed with `SELF_SIGNED_CERT_IN_CHAIN`. Every other host is still verified, so a run against a deployed EDP cannot pass with a bad certificate chain, which matters for a tool whose job is checking conformance. `CLI_SKIP_SERVER_VERIFICATION` is unchanged and remains the way to skip verification for every host
- `AGENTS.md`, guidance for coding agents working in this repository: the build commands, the architecture, the certificate handling, and the IB1 specifications and registry URLs the demo is bound by

### Changed

- Request the previous twelve complete calendar months rather than a hardcoded single day. The resource API now honours `from`/`to`; the window is computed in `lib/dateRange.ts` and shared by the web app and the CLI, so the provenance record's metering period cannot drift from the data actually requested
- Aligned the window to month boundaries instead of a literal rolling year, so every bar in the monthly chart is a whole month. A rolling year touches thirteen calendar months, two of them partial
- Send `Accept-Encoding: gzip` on the data request: the resource API serves windows longer than 60 days only compressed and returns `400 invalid_request` otherwise
- Chart consumption as monthly bars and the cumulative reading as a daily line, replacing the half-hourly bars. A year is about 17,500 half-hourly readings, and the API has no granularity parameter, so both series are aggregated client side in `lib/energySeries.ts`. Readings are bucketed on `from`, the interval start — `to` would push each month's last reading into the next month, and `takenAt` has moved to one interval after `to`
- Axes now carry rounded tick values, gridlines and a unit label; watt hours are shown as kWh, since a month of electricity in WHR runs to seven figures
- `package.json` carries the release version, `2.3.0`. It sat at `0.1.5` and had not tracked the changelog since before v2.1.0

### Removed

- `models/IConsumption.ts`, whose shape had not matched the resource API for some time and which nothing imported

## [v2.2.0] - 2026-09-02

### Fixed

- Request `…/scheme/perseus/license/energy-consumption-emissions-edp-cap-fsp/2026-03-12` as the OAuth scope. The retired `energy-consumption-data/2024-12-05` was renamed as well as re-dated, so it no longer resolves in the Registry and is not a scope either demo authorization server advertises
- This demo takes consent for the EDP, the CAP and the FSP in a single permission, so it requests the pass through license rather than `energy-consumption-edp-cap/2026-03-12`, which covers only the EDP to CAP leg. Both are valid for the energy consumption data API, the Scheme Catalog Requirements carry `ib1:requireOneOrMoreOf` on `dcterms:license`. The Ory client registration must list whichever version is requested here

## [v2.1.0] - 2026-06-09

### Added

- mTLS debug logging of the client certificate's decoded roles, member and application (alongside the existing CN)
- `scripts/check-cert.ts` (`npm run check-cert -- <env>`) to inspect the mTLS certificate stored in AWS Secrets Manager and flag the trust-framework registry its role is scoped to
- Progress indicator / stages bar across the CAP flow
- CAP "setup complete" view
- Bank sharing-consent view
- Meter data shown on the final EDP screen

### Changed

- Upgrade to Next.js 16, React 19, Tailwind CSS 4 and ESLint 9 (flat config), with related build/tooling config updates
- Move `SECRET_COOKIE_PASSWORD` to AWS Secrets Manager
- `scripts/create_secrets.sh` accepts `--key`/`--bundle` paths from the command line
- Document uploading certificates to Secrets Manager (leaf + intermediate bundle) and inspecting a stored certificate in the README
- Bump `openid-client` and update CDK deployment

### Fixed

- `NEXT_PUBLIC_SERVER` naming mismatch that caused the prod environment to use preprod servers, plus other environment-variable handling errors

## [v2.0.0] - 2026-02-18

### Added

- Adds a message delivery endpoint
- Add mTLS endpoint to CDK deployment

### Changed

- Update readme with details of the new endpoint and test commands

## [v1.2.0] - 2026-01-20

### Added 

- cli script to test refresh token endpoints

### Changed

- Updates edp_checks.md with details of the new script
- Include refresh token in callback server output

### Fixed

-

## [v1.1.3] - 2026-01-20

### Added

- Add documentation for using cli as edp checklist
- Add cli certificate verification script

### Changed

- 

### Fixed

- Configuration issues in cli
- Minor issues with deployment
- Improve cli terminal output

### Breaking

-


## [v1.1.2] - 2025-12-09

### Added

- 

### Changed

- 

### Fixed

- Upgrade nextjs

### Breaking

-



## [v1.1.1] - 2025-12-08

### Added

- 

### Changed

- cli flow uses the datasources endpoint to retrieve meters and construct data fetching url
- Change the client ID to a valid directory organisation uri

### Fixed

- 

### Breaking

-

## [v1.1.0] - 2025-12-03

### Added

- Implement provenance service for local development environment
- Optional provenance check in cli callback server
- Provenance service added to CDK deployment

### Changed

- Added details about provenance service option to README.md

### Fixed

- 

### Breaking

-

## [v1.0.0] - 2025-12-03

Initial tagged release. Previous history is unversioned
