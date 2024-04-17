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
import { Entities, Relationships, Steps } from '../constant';
import { INGESTION_SOURCE_IDS } from '../../constants';

export async function fetchProjects({
  instance,
  jobState,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity = (await jobState.getData(
    Entities.ACCOUNT_ENTITY._type,
  )) as Entity;

  await apiClient.iterateProjects(async (project) => {
    const projectEntity = await jobState.addEntity(
      createIntegrationEntity({
        entityData: {
          source: project,
          assign: {
            _type: Entities.PROJECT_ENTITY._type,
            _class: Entities.PROJECT_ENTITY._class,
            _key: project.id as string,
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
    id: Steps.FETCH_PROJECTS,
    name: 'Fetch Projects',
    entities: [Entities.PROJECT_ENTITY],
    relationships: [Relationships.AZURE_DEVOPS_ACCOUNT_HAS_PROJECTS],
    dependsOn: [Steps.FETCH_ACCOUNT],
    executionHandler: fetchProjects,
    ingestionSourceId: INGESTION_SOURCE_IDS.PROJECTS,
  },
];
