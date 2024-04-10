import {
  IntegrationStep,
  IntegrationStepExecutionContext,
  getRawData,
  createIntegrationEntity,
  RelationshipClass,
  createMappedRelationship,
  RelationshipDirection,
  createDirectRelationship,
  IntegrationMissingKeyError,
} from '@jupiterone/integration-sdk-core';
import { TeamProjectReference } from 'azure-devops-node-api/interfaces/CoreInterfaces';

import { createAPIClient } from '../../client';
import { ADOIntegrationConfig } from '../../types';
import {
  Steps,
  Entities,
  Relationships,
  MappedRelationships,
} from '../constant';
import { getAccountKey } from '../account';
import { INGESTION_SOURCE_IDS } from '../../constants';

const DOMAINS = {
  Bitbucket: 'https://bitbucket.org/',
  GitHub: 'https://github.com/',
};

export function getRepoKey(repoId) {
  return `azure_devops_repo:${repoId}`;
}

export async function fetchRepositories({
  instance,
  jobState,
  logger,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  await jobState.iterateEntities(
    { _type: Entities.PROJECT_ENTITY._type },
    async (projectEntity) => {
      const project = getRawData<TeamProjectReference>(projectEntity);
      if (!project) {
        logger.warn(
          { _key: projectEntity._key },
          `Can not get raw data for project entity`,
        );
        return;
      }

      await apiClient.iterateBuildRepositories(
        project.id,
        async (repository) => {
          const type = repository.type;
          if (type && Object.keys(DOMAINS).includes(type)) {
            const relationship = createMappedRelationship({
              _class: RelationshipClass.USES,
              _type: 'azure_devops_project_uses_repo',
              _mapping: {
                sourceEntityKey: projectEntity._key,
                relationshipDirection: RelationshipDirection.FORWARD,
                targetFilterKeys: [['webLink', '_class', 'fullName']],
                targetEntity: {
                  _class: 'CodeRepo',
                  webLink: `${DOMAINS[type]}${repository.id}`,
                  fullName: repository.id,
                },
              },
            });

            if (!jobState.hasKey(relationship._key)) {
              await jobState.addRelationship(relationship);
            }
          } else {
            const repositoryEntity = createIntegrationEntity({
              entityData: {
                source: repository,
                assign: {
                  _type: Entities.REPOSITORY_ENTITY._type,
                  _class: Entities.REPOSITORY_ENTITY._class,
                  _key: getRepoKey(repository.id),
                  defaultBranch: repository.defaultBranch,
                  fullName: repository.name,
                  id: repository.id,
                  webLink: repository.url,
                  type: repository.type,
                  projectId: project.id,
                },
              },
            });

            if (!jobState.hasKey(repositoryEntity._key)) {
              await jobState.addEntity(repositoryEntity);

              await jobState.addRelationship(
                createDirectRelationship({
                  _class: RelationshipClass.USES,
                  from: projectEntity,
                  to: repositoryEntity,
                }),
              );
            }
          }
        },
      );
    },
  );
}

export async function buildAccountRepoRelationship({
  jobState,
  instance,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  await jobState.iterateEntities(
    { _type: Entities.REPOSITORY_ENTITY._type },
    async (repoEntity) => {
      const accountKey = getAccountKey(instance.id);
      if (jobState.hasKey(accountKey)) {
        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.OWNS,
            fromKey: accountKey,
            fromType: Entities.ACCOUNT_ENTITY._type,
            toKey: repoEntity._key,
            toType: Entities.REPOSITORY_ENTITY._type,
          }),
        );
      } else {
        throw new IntegrationMissingKeyError(
          `Build Account Repo Relationship: ${accountKey} Missing.`,
        );
      }
    },
  );
}

export const repositorySteps: IntegrationStep<ADOIntegrationConfig>[] = [
  {
    id: Steps.FETCH_REPOSITORY,
    name: 'Fetch Repositories',
    entities: [Entities.REPOSITORY_ENTITY],
    relationships: [Relationships.PROJECT_HAS_REPO],
    mappedRelationships: [
      MappedRelationships.PROJECT_USES_GITHUB_REPO,
      MappedRelationships.PROJECT_USES_BITBUCKET_REPO,
    ],
    dependsOn: [Steps.FETCH_PROJECTS],
    executionHandler: fetchRepositories,
    ingestionSourceId: INGESTION_SOURCE_IDS.REPOS,
  },
  {
    id: Steps.BUILD_ACCOUNT_REPO_RELATIONSHIP,
    name: 'Build Account Repo Relationship',
    entities: [],
    relationships: [Relationships.ACCOUNT_OWNS_REPO],
    dependsOn: [Steps.FETCH_ACCOUNT, Steps.FETCH_REPOSITORY],
    executionHandler: buildAccountRepoRelationship,
    ingestionSourceId: INGESTION_SOURCE_IDS.REPOS,
  },
];
