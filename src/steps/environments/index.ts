import {
  IntegrationStep,
  IntegrationStepExecutionContext,
  getRawData,
  createIntegrationEntity,
  Entity,
} from '@jupiterone/integration-sdk-core';
import { TeamProjectReference } from 'azure-devops-node-api/interfaces/CoreInterfaces';

import { createAPIClient } from '../../client';
import { ADOIntegrationConfig } from '../../types';
import { EnvironmentInstance } from 'azure-devops-node-api/interfaces/TaskAgentInterfaces';
import { Entities, Steps } from '../constant';

const ENVIRONMENT_ENTITY = {
  resourceName: 'Environments',
  _type: 'azure_devops_environment',
  _class: 'Configuration',
};

function getEnvironmentKey(environmentId): string {
  return `${ENVIRONMENT_ENTITY._type}:${environmentId}`;
}

function createEnvironmentEntity(environment: EnvironmentInstance): Entity {
  return createIntegrationEntity({
    entityData: {
      source: environment,
      assign: {
        _key: getEnvironmentKey(environment.id),
        _type: ENVIRONMENT_ENTITY._type,
        _class: ENVIRONMENT_ENTITY._class,
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

export const environmentSteps: IntegrationStep<ADOIntegrationConfig>[] = [
  {
    id: 'fetch-environment',
    name: 'Fetch Environment',
    entities: [ENVIRONMENT_ENTITY],
    relationships: [], // TODO : create relationship
    dependsOn: [Steps.FETCH_PROJECTS],
    executionHandler: fetchEnvironment,
  },
];
