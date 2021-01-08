import {
  createDirectRelationship,
  createIntegrationEntity,
  Entity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
  //IntegrationMissingKeyError,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../../client';
import { ADOIntegrationConfig } from '../../types';
import { AZURE_DEVOPS_ACCOUNT } from '../account';

export async function fetchProjects({
  instance,
  jobState,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity = (await jobState.getData(
    AZURE_DEVOPS_ACCOUNT,
  )) as Entity;

  await apiClient.iterateProjects(async (project) => {
    const projectEntity = await jobState.addEntity(
      createIntegrationEntity({
        entityData: {
          source: project,
          assign: {
            _type: 'azure_devops_project',
            _class: 'Project',
            _key: project.id,
            name: project.name,
            displayName: project.name,
            abbreviation: project.abbreviation,
            description: project.description,
            webLink: project.url,
            state: project.state,
            revision: project.revision,
            visibility: project.visibility,
            createdOn: undefined,
            updatedOn: undefined,
          },
        },
      }),
    );

    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: projectEntity,
      }),
    );
  });
}

export const projectSteps: IntegrationStep<ADOIntegrationConfig>[] = [
  {
    id: 'fetch-projects',
    name: 'Fetch Projects',
    entities: [
      {
        resourceName: 'ADO Project',
        _type: 'azure_devops_project',
        _class: 'Project',
      },
    ],
    relationships: [
      {
        _type: 'azure_devops_account_has_project',
        _class: RelationshipClass.HAS,
        sourceType: 'azure_devops_account',
        targetType: 'azure_devops_project',
      },
    ],
    dependsOn: ['fetch-account'],
    executionHandler: fetchProjects,
  },
];
