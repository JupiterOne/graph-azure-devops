import {
  IntegrationStep,
  IntegrationStepExecutionContext,
  getRawData,
  createIntegrationEntity,
  Entity,
  createDirectRelationship,
  RelationshipClass,
  IntegrationMissingKeyError,
} from '@jupiterone/integration-sdk-core';
import { TeamProjectReference } from 'azure-devops-node-api/interfaces/CoreInterfaces';

import { createAPIClient } from '../../client';
import { ADOIntegrationConfig } from '../../types';
import { BuildDefinitionReference } from 'azure-devops-node-api/interfaces/BuildInterfaces';
import { Entities, Relationships, Steps } from '../constant';
import { INGESTION_SOURCE_IDS } from '../../constants';

function getPipelineKey(pipelineId): string {
  return `${Entities.PIPELINE_ENTITY._type}:${pipelineId}`;
}

function createPipelineEntity(pipeline: BuildDefinitionReference): Entity {
  return createIntegrationEntity({
    entityData: {
      source: pipeline,
      assign: {
        _key: getPipelineKey(pipeline.id),
        _type: Entities.PIPELINE_ENTITY._type,
        _class: Entities.PIPELINE_ENTITY._class,
        id: String(pipeline.id),
        name: pipeline.name,
        projectId: pipeline.project?.id,
        authoredBy: pipeline.authoredBy?.uniqueName,
        url: pipeline._links?.web?.href,
        createdDate: pipeline.createdDate?.toLocaleString(),
      },
    },
  });
}
export async function fetchPipeline({
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

      await apiClient.iteratePipelines(project.id, async (pipeline) => {
        // create a pipeline Entity
        await jobState.addEntity(createPipelineEntity(pipeline));
      });
    },
  );
}

export async function buildProjectPipelineRelationship({ jobState }) {
  await jobState.iterateEntities(
    { _type: Entities.PIPELINE_ENTITY._type },
    async (pipelineEntity) => {
      const projectKey = String(pipelineEntity.projectId);
      if (jobState.hasKey(projectKey)) {
        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.HAS,
            fromKey: projectKey,
            fromType: Entities.PROJECT_ENTITY._type,
            toKey: pipelineEntity._key,
            toType: Entities.PIPELINE_ENTITY._type,
          }),
        );
      } else {
        throw new IntegrationMissingKeyError(
          `Build-Project-Pipeline-Relationship: ${projectKey} Missing.`,
        );
      }
    },
  );
}

export const pipelineSteps: IntegrationStep<ADOIntegrationConfig>[] = [
  {
    id: Steps.FETCH_PIPELINE,
    name: 'Fetch Pipelines',
    entities: [Entities.PIPELINE_ENTITY],
    relationships: [],
    dependsOn: [Steps.FETCH_PROJECTS],
    executionHandler: fetchPipeline,
    ingestionSourceId: INGESTION_SOURCE_IDS.PIPELINES,
  },
  {
    id: Steps.BUILD_PROJECT_PIPELINE_RELATIONSHIP,
    name: 'Build Project Pipeline Relationship',
    entities: [],
    relationships: [Relationships.AZURE_DEVOPS_PROJECT_HAS_PIPELINE],
    dependsOn: [Steps.FETCH_PROJECTS, Steps.FETCH_PIPELINE],
    executionHandler: buildProjectPipelineRelationship,
    ingestionSourceId: INGESTION_SOURCE_IDS.PIPELINES,
  },
];
