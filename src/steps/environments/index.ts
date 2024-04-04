import {
  IntegrationStep,
  IntegrationStepExecutionContext,
  getRawData,
  createIntegrationEntity,
  Entity,
  IntegrationMissingKeyError,
  createDirectRelationship,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';
import { TeamProjectReference } from 'azure-devops-node-api/interfaces/CoreInterfaces';

import { createAPIClient } from '../../client';
import { ADOIntegrationConfig } from '../../types';
import { EnvironmentInstance } from 'azure-devops-node-api/interfaces/TaskAgentInterfaces';
import { Entities, Relationships, Steps } from '../constant';

function getEnvironmentKey(environmentId): string {
  return `${Entities.ENVIRONMENT_ENTITY._type}:${environmentId}`;
}

function createEnvironmentEntity(environment: EnvironmentInstance): Entity {
  return createIntegrationEntity({
    entityData: {
      source: environment,
      assign: {
        _key: getEnvironmentKey(environment.id),
        _type: Entities.ENVIRONMENT_ENTITY._type,
        _class: Entities.ENVIRONMENT_ENTITY._class,
        id: String(environment.id),
        name: environment.name,
        projectId: environment.project?.id,
        description: environment.description,
        createdBy: environment.createdBy?.uniqueName,
        createdOn: environment.createdOn
          ? environment.createdOn.getTime()
          : undefined,
        lastModifiedBy: environment.lastModifiedBy?.uniqueName,
        lastModifiedOn: environment.lastModifiedOn
          ? environment.lastModifiedOn.getTime()
          : undefined,
      },
    },
  });
}
export async function fetchEnvironment({
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

      await apiClient.iterateEnvironments(project.id, async (environment) => {
        // create a Environment Entity
        await jobState.addEntity(createEnvironmentEntity(environment));
      });
    },
  );
}

export async function buildProjectEnvironmentRelationship({ jobState }) {
  await jobState.iterateEntities(
    { _type: Entities.ENVIRONMENT_ENTITY._type },
    async (environmentEntity) => {
      const projectKey = String(environmentEntity.projectId);
      if (jobState.hasKey(projectKey)) {
        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.HAS,
            fromKey: projectKey,
            fromType: Entities.PROJECT_ENTITY._type,
            toKey: environmentEntity._key,
            toType: Entities.ENVIRONMENT_ENTITY._type,
          }),
        );
      } else {
        throw new IntegrationMissingKeyError(
          `Build-Project-Environment-Relationship: ${projectKey} Missing.`,
        );
      }
    },
  );
}

export const environmentSteps: IntegrationStep<ADOIntegrationConfig>[] = [
  {
    id: Steps.FETCH_ENVIRONMENTS,
    name: 'Fetch Environment',
    entities: [Entities.ENVIRONMENT_ENTITY],
    relationships: [],
    dependsOn: [Steps.FETCH_PROJECTS],
    executionHandler: fetchEnvironment,
  },
  {
    id: Steps.BUILD_PROJECT_ENVIRONMENT_RELATIONSHIP,
    name: 'Build Project Has Environment Relationship',
    entities: [],
    relationships: [Relationships.PROJECT_HAS_ENVIRONMENT],
    dependsOn: [Steps.FETCH_PROJECTS, Steps.FETCH_ENVIRONMENTS],
    executionHandler: buildProjectEnvironmentRelationship,
  },
];
