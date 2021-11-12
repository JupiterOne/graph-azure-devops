# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
