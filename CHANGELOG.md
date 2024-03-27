# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## 2.1.0 - 2023-03-27

### Added

- Support for ingesting the following **new** resources

- New relationships

  - `azure_devops_project` **HAS** `azure_devops_build_settings`
  - `azure_devops_project` **HAS** `azure_devops_environment`
  - `azure_devops_project` **HAS** `azure_devops_pipeline`
  - `azure_devops` **SCANS** `azure_devops_project`
  - `azure_devops` **HAS** `azure_devops_account`
  - `azure_devops_user` **REVIEWED** `azure_devops_pr`
  - `azure_devops_user` **APPROVED** `azure_devops_pr`
  - `azure_devops_user` **OPENED** `azure_devops_pr`
  - `azure_devops_repo` **HAS** `azure_devops_pr`
  - `azure_devops_repo` **HAS** `azure_devops_alert_finding`
  - `azure_devops_account` **OWNS** `azure_devops_repo`

- New entities
  - `azure_devops_build_settings`
  - `azure_devops_environment`
  - `azure_devops_alert_finding`
  - `azure_devops_pipeline`
  - `azure_devops`
  - `azure_devops_pr`

## 2.0.1 - 2022-11-10

### Fixed

- Fixed issue related to duplicate keys when project has more than one pipeline
  for a repository hosted on Azure DevOps.

## 2.0.0 - 2022-10-18

### Updated

- Updated SDK package versions to v8

### Added

- Added new entity `azure_devops_repo`
- Added new mapped relationship `azure_devops_project_uses_repo`
- Added new relationship `azure_devops_project_uses_repo` if repo isn't github
  or bitbucket

## [1.0.3] - 11-12-2021

### Fixed

- Fixed the `url`, `status`, and `statusText` properties passed into
  `IntegrationProviderAuthenticationError` in this client

## 1.0.2 - 3-23-21

### Added

- Support for ingesting the following **new** resources

- New relationships -`azure_devops_user` **ASSIGNED**
  `azure_devops_work_item` -`azure_devops_user` **CREATED**
  `azure_devops_work_item`

- test recording infrastructure

- `descriptor` and `emailDomain` properties to `azure_devops_user` entities

### Removed

- `description` property on `azure_devops_user` entities

## 1.0.1 - 3-19-21

### Updated

- `README.md` with build status badges

## 1.0.0 - 3-19-21

### Added

- Support for ingesting the following **new** resources

- New relationships

  - `azure_devops_account` **HAS** `azure_devops_project`
  - `azure_devops_account` **HAS** `azure_devops_team`
  - `azure_devops_account` **HAS** `azure_devops_user`
  - `azure_devops_project` **HAS** `azure_devops_team`
  - `azure_devops_project` **HAS** `azure_devops_work_item`
  - `azure_devops_team` **HAS** `azure_devops_user`

- New entities
  - `azure_devops_project`
  - `azure_devops_team`
  - `azure_devops_user`
  - `azure_devops_work_item`
  - `azure_devops_account`
