import {
  RelationshipClass,
  RelationshipDirection,
  StepEntityMetadata,
  StepMappedRelationshipMetadata,
  StepRelationshipMetadata,
} from '@jupiterone/integration-sdk-core';

export const PullRequestStatus = {
  /**
   * Status not set. Default state.
   */
  NotSet: 0,
  /**
   * Pull request is active.
   */
  Active: 1,
  /**
   * Pull request is abandoned.
   */
  Abandoned: 2,
  /**
   * Pull request is completed.
   */
  Completed: 3,
  /**
   * Used in pull request search criteria to include all statuses.
   */
  All: 4,
};

export const Steps = {
  FETCH_SERVICE: 'fetch-devops-service',
  BUILD_SERVICE_ACCOUNT_RELATIONSHIP:
    'build-devOps-account-service-relationship',
  FETCH_PROJECTS: 'fetch-projects',
  FETCH_ACCOUNT: 'fetch-accounts',
  FETCH_BUILD_SETTINGS: 'fetch-build-settings',
  BUILD_PROJECT_BUILD_SETTING_RELATIONSHIP:
    'build-project-build-setting-relationship',
  FETCH_PIPELINE: 'fetch-pipelines',
  BUILD_PROJECT_PIPELINE_RELATIONSHIP: 'build-project-pipeline-relationship',
  FETCH_PULL_REQUEST: 'fetch-pullrequests',
  FETCH_REPOSITORY: 'fetch-repositories',
  BUILD_REPO_PR_RELATIONSHIP: 'build-repo-pr-relationship',
  BUILD_ACCONT_REPO_RELATIONSHIP: 'build-account-repo-relationship',
  BUILD_USER_OPENED_PR_RELATIONSHIP: 'build-user-opened-pr-relationship',
  FETCH_USERS: 'fetch-users',
  BUILD_USER_REVIEWED_PR_RELATIONSHIP: 'build-user-reviewd-pr-relationship',
  BUILD_USER_APPROVED_PR_RELATIONSHIP: 'build-user-approved-pr-relationship',
};

export const Entities: Record<
  | 'DEVOPS_SERVICE_ENTITY'
  | 'PROJECT_ENTITY'
  | 'ACCOUNT_ENTITY'
  | 'BUILD_SETTING_ENTITY'
  | 'PIPELINE_ENTITY'
  | 'PULL_REQUEST_ENTITY'
  | 'REPOSITORY_ENTITY'
  | 'USER_ENTITY',
  StepEntityMetadata
> = {
  DEVOPS_SERVICE_ENTITY: {
    resourceName: 'AzureDevOps',
    _type: 'azure_devops',
    _class: ['Service'],
  },
  PROJECT_ENTITY: {
    resourceName: 'ADO Project',
    _type: 'azure_devops_project',
    _class: 'Project',
  },
  ACCOUNT_ENTITY: {
    resourceName: 'Azure Devops Account',
    _type: 'azure_devops_account',
    _class: 'Account',
  },
  BUILD_SETTING_ENTITY: {
    resourceName: 'AzureBuildSettings',
    _type: 'azure_devops_build_settings',
    _class: 'Configuration',
  },
  PIPELINE_ENTITY: {
    resourceName: 'AzureDevOpsPipeline',
    _type: 'azure_devops_pipeline',
    _class: 'Workflow',
  },
  PULL_REQUEST_ENTITY: {
    resourceName: 'AzureDevOpsPullRequest',
    _type: 'azure_devops_pr',
    _class: 'PR',
  },
  REPOSITORY_ENTITY: {
    resourceName: 'Repository',
    _type: 'azure_devops_repo',
    _class: 'Repository',
  },
  USER_ENTITY: {
    resourceName: 'ADO User',
    _type: 'azure_devops_user',
    _class: 'User',
  },
};

export const Relationships: Record<
  | 'ACCOUNT_HAS_USERS'
  | 'USERS_MANAGES_ACCOUNT'
  | 'AZURE_DEVOPS_ACCOUNT_HAS_DEVOPS_SERVICE'
  | 'AZURE_DEVOPS_SCANS_PROJECTS'
  | 'AZURE_DEVOPS_ACCOUNT_HAS_PROJECTS'
  | 'PROJECT_HAS_BUILD_SETTINGS'
  | 'AZURE_DEVOPS_PROJECT_HAS_PIPELINE'
  | 'REPO_HAS_PULL_REQUEST'
  | 'PROJECT_HAS_REPO'
  | 'ACCOUNT_OWNS_REPO'
  | 'USER_OPENED_PR'
  | 'USER_REVIEWED_PR'
  | 'USER_APPROVED_PR',
  StepRelationshipMetadata
> = {
  ACCOUNT_HAS_USERS: {
    _type: 'azure_devops_account_has_user',
    _class: RelationshipClass.HAS,
    sourceType: Entities.ACCOUNT_ENTITY._type,
    targetType: Entities.USER_ENTITY._type,
  },
  USERS_MANAGES_ACCOUNT: {
    _type: 'azure_devops_user_manages_account',
    _class: RelationshipClass.MANAGES,
    sourceType: Entities.USER_ENTITY._type,
    targetType: Entities.ACCOUNT_ENTITY._type,
  },
  AZURE_DEVOPS_ACCOUNT_HAS_DEVOPS_SERVICE: {
    _type: 'azure_devops_account_has_devops',
    _class: RelationshipClass.HAS,
    sourceType: Entities.ACCOUNT_ENTITY._type,
    targetType: Entities.DEVOPS_SERVICE_ENTITY._type,
  },
  AZURE_DEVOPS_SCANS_PROJECTS: {
    _type: 'azure_devops_scans_project',
    _class: RelationshipClass.SCANS,
    sourceType: Entities.DEVOPS_SERVICE_ENTITY._type,
    targetType: Entities.PROJECT_ENTITY._type,
  },
  AZURE_DEVOPS_ACCOUNT_HAS_PROJECTS: {
    _type: 'azure_devops_account_has_project',
    _class: RelationshipClass.HAS,
    sourceType: Entities.ACCOUNT_ENTITY._type,
    targetType: Entities.PROJECT_ENTITY._type,
  },
  PROJECT_HAS_BUILD_SETTINGS: {
    _type: 'azure_devops_project_has_build_settings',
    _class: RelationshipClass.HAS,
    sourceType: Entities.PROJECT_ENTITY._type,
    targetType: Entities.BUILD_SETTING_ENTITY._type,
  },
  AZURE_DEVOPS_PROJECT_HAS_PIPELINE: {
    _type: 'azure_devops_project_has_pipeline',
    _class: RelationshipClass.HAS,
    sourceType: Entities.PROJECT_ENTITY._type,
    targetType: Entities.PIPELINE_ENTITY._type,
  },
  REPO_HAS_PULL_REQUEST: {
    _type: 'azure_devops_repo_has_pr',
    _class: RelationshipClass.HAS,
    sourceType: Entities.REPOSITORY_ENTITY._type,
    targetType: Entities.PULL_REQUEST_ENTITY._type,
  },
  PROJECT_HAS_REPO: {
    _type: 'azure_devops_project_uses_repo',
    _class: RelationshipClass.USES,
    sourceType: Entities.PROJECT_ENTITY._type,
    targetType: Entities.REPOSITORY_ENTITY._type,
  },
  ACCOUNT_OWNS_REPO: {
    _type: 'azure_devops_account_owns_repo',
    _class: RelationshipClass.OWNS,
    sourceType: Entities.ACCOUNT_ENTITY._type,
    targetType: Entities.REPOSITORY_ENTITY._type,
  },
  USER_OPENED_PR: {
    _type: 'azure_devops_user_opened_pr',
    _class: RelationshipClass.OPENED,
    sourceType: Entities.USER_ENTITY._type,
    targetType: Entities.PULL_REQUEST_ENTITY._type,
  },
  USER_REVIEWED_PR: {
    _type: 'azure_devops_user_reviewed_pr',
    _class: RelationshipClass.REVIEWED,
    sourceType: Entities.USER_ENTITY._type,
    targetType: Entities.PULL_REQUEST_ENTITY._type,
  },
  USER_APPROVED_PR: {
    _type: 'azure_devops_user_approved_pr',
    _class: RelationshipClass.APPROVED,
    sourceType: Entities.USER_ENTITY._type,
    targetType: Entities.PULL_REQUEST_ENTITY._type,
  },
};

export const MappedRelationships: Record<
  'PROJECT_USES_GITHUB_REPO' | 'PROJECT_USES_BITBUCKET_REPO',
  StepMappedRelationshipMetadata
> = {
  PROJECT_USES_GITHUB_REPO: {
    _type: 'azure_devops_project_uses_repo',
    _class: RelationshipClass.USES,
    sourceType: Entities.PROJECT_ENTITY._type,
    targetType: 'github_repo',
    direction: RelationshipDirection.FORWARD,
  },
  PROJECT_USES_BITBUCKET_REPO: {
    _type: 'azure_devops_project_uses_repo',
    _class: RelationshipClass.USES,
    sourceType: Entities.PROJECT_ENTITY._type,
    targetType: 'bitbucket_repo',
    direction: RelationshipDirection.FORWARD,
  },
};
