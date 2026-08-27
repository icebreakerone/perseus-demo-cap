# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed

- Request the current Registry License URL as the OAuth scope, `…/scheme/perseus/license/energy-consumption-edp-cap/2026-03-12`. The retired `energy-consumption-data/2024-12-05` does not resolve in the Registry, and is not the scope the authorization server advertises

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
