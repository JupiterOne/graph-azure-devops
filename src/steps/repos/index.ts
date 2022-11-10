import {
  IntegrationStep,
  IntegrationStepExecutionContext,
  getRawData,
  createIntegrationEntity,
  RelationshipClass,
  createMappedRelationship,
  RelationshipDirection,
  createDirectRelationship,
} from '@jupiterone/integration-sdk-core';
import { TeamProjectReference } from 'azure-devops-node-api/interfaces/CoreInterfaces';

import { createAPIClient } from '../../client';
import { ADOIntegrationConfig } from '../../types';

const DOMAINS = {
  Bitbucket: 'https://bitbucket.org/',
  GitHub: 'https://github.com/',
};

export async function fetchRepositories({
  instance,
  jobState,
  logger,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  await jobState.iterateEntities(
    { _type: 'azure_devops_project' },
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

            if (!(await jobState.hasKey(relationship._key))) {
              await jobState.addRelationship(relationship);
            }
          } else {
            const repositoryEntity = createIntegrationEntity({
              entityData: {
                source: repository,
                assign: {
                  _type: 'azure_devops_repo',
                  _class: 'CodeRepo',
                  _key: `azure_devops_repo:${repository.id}`,
                  defaultBranch: repository.defaultBranch,
                  fullName: repository.name,
                  id: repository.id,
                  webLink: repository.url,
                  type: repository.type,
                },
              },
            });

            if (!(await jobState.hasKey(repositoryEntity._key))) {
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

export const repositorySteps: IntegrationStep<ADOIntegrationConfig>[] = [
  {
    id: 'fetch-repositories',
    name: 'Fetch Repositories',
    entities: [
      {
        resourceName: 'Repository',
        _type: 'azure_devops_repo',
        _class: 'Repository',
      },
    ],
    relationships: [
      {
        _type: 'azure_devops_project_uses_repo',
        _class: RelationshipClass.USES,
        sourceType: 'azure_devops_project',
        targetType: 'azure_devops_repo',
      },
    ],
    mappedRelationships: [
      {
        _type: 'azure_devops_project_uses_repo',
        _class: RelationshipClass.USES,
        sourceType: 'azure_devops_project',
        targetType: 'github_repo',
        direction: RelationshipDirection.FORWARD,
      },
      {
        _type: 'azure_devops_project_uses_repo',
        _class: RelationshipClass.USES,
        sourceType: 'azure_devops_project',
        targetType: 'bitbucket_repo',
        direction: RelationshipDirection.FORWARD,
      },
    ],
    dependsOn: ['fetch-projects'],
    executionHandler: fetchRepositories,
  },
];
