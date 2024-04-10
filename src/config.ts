import { IntegrationIngestionConfigFieldMap } from '@jupiterone/integration-sdk-core';
import { INGESTION_SOURCE_IDS } from './constants';

export const ingestionConfig: IntegrationIngestionConfigFieldMap = {
  [INGESTION_SOURCE_IDS.BUILD]: {
    title: 'Build settings',
    description: 'Gather information related to the projects build settings.',
    defaultsToDisabled: true,
    cannotBeDisabled: false,
  },
  [INGESTION_SOURCE_IDS.ALERTS]: {
    title: 'Devops alerts',
    description: 'Gather information about repository alerts.',
    defaultsToDisabled: true,
    cannotBeDisabled: false,
  },
  [INGESTION_SOURCE_IDS.SERVICE]: {
    title: 'Devops service',
    description:
      'Creates structural relationships between repositories and projects.',
    defaultsToDisabled: true,
    cannotBeDisabled: false,
  },
  [INGESTION_SOURCE_IDS.ENVIRONMENTS]: {
    title: 'Environments',
    description: 'Ingest devops project environments.',
    defaultsToDisabled: true,
    cannotBeDisabled: false,
  },
  [INGESTION_SOURCE_IDS.PIPELINES]: {
    title: 'Pipelines',
    description: 'Ingest devops project pipelines.',
    defaultsToDisabled: false,
    cannotBeDisabled: false,
  },
  [INGESTION_SOURCE_IDS.PROJECTS]: {
    title: 'Projects',
    description: 'Ingest devops projects.',
    defaultsToDisabled: false,
    cannotBeDisabled: false,
  },
  [INGESTION_SOURCE_IDS.PULL_REQUESTS]: {
    title: 'Pull Requests',
    description: 'Ingest pull requests and information about their state.',
    defaultsToDisabled: true,
    cannotBeDisabled: false,
  },
  [INGESTION_SOURCE_IDS.REPOS]: {
    title: 'Repositories',
    description: 'Ingest azure devops repositories.',
    defaultsToDisabled: false,
    cannotBeDisabled: false,
  },
  [INGESTION_SOURCE_IDS.TEAMS]: {
    title: 'Teams',
    description: 'Ingest teams and links users that belong to them.',
    defaultsToDisabled: false,
    cannotBeDisabled: false,
  },
  [INGESTION_SOURCE_IDS.USERS]: {
    title: 'Users',
    description: 'Ingest azure devops users.',
    defaultsToDisabled: false,
    cannotBeDisabled: false,
  },
  [INGESTION_SOURCE_IDS.WORK_ITEMS]: {
    title: 'Work items',
    description: 'Ingest work items.',
    defaultsToDisabled: false,
    cannotBeDisabled: false,
  },
};
