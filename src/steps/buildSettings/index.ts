import {
  IntegrationStep,
  IntegrationStepExecutionContext,
  getRawData,
  createIntegrationEntity,
  Entity,
  createDirectRelationship,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';
import { TeamProjectReference } from 'azure-devops-node-api/interfaces/CoreInterfaces';

import { createAPIClient } from '../../client';
import { ADOIntegrationConfig } from '../../types';
import { PipelineGeneralSettings } from 'azure-devops-node-api/interfaces/BuildInterfaces';
import { Entities, Relationships, Steps } from '../constant';

function getBuildGeneralSettingKey(projectId): string {
  return `${Entities.BUILD_SETTING_ENTITY._type}:${projectId}`;
}

function createBuildSettingEntity(
  buildGeneralSettings: PipelineGeneralSettings,
  projectId,
): Entity {
  return createIntegrationEntity({
    entityData: {
      source: buildGeneralSettings,
      assign: {
        _key: getBuildGeneralSettingKey(projectId),
        _type: Entities.BUILD_SETTING_ENTITY._type,
        _class: Entities.BUILD_SETTING_ENTITY._class,
        name: 'Azure Build Setting',
        projectId: projectId,
        ...buildGeneralSettings,
      },
    },
  });
}
export async function fetchBuildSettings({
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

      await apiClient.iterateBuildSettings(project.id, async (buildSetting) => {
        // create a build Setting Entity
        await jobState.addEntity(
          createBuildSettingEntity(buildSetting, project.id),
        );
      });
    },
  );
}

export async function buildProjectBuildSettingsRelationship({
  jobState,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  await jobState.iterateEntities(
    { _type: Entities.BUILD_SETTING_ENTITY._type },
    async (buildSettingsEntity) => {
      const projectKey = String(buildSettingsEntity.projectId);
      if (jobState.hasKey(projectKey)) {
        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.HAS,
            fromKey: projectKey,
            fromType: Entities.PROJECT_ENTITY._type,
            toKey: buildSettingsEntity._key,
            toType: Entities.BUILD_SETTING_ENTITY._type,
          }),
        );
      }
    },
  );
}

export const buildSettingSteps: IntegrationStep<ADOIntegrationConfig>[] = [
  {
    id: Steps.FETCH_BUILD_SETTINGS,
    name: 'Fetch Build Settings',
    entities: [Entities.BUILD_SETTING_ENTITY],
    relationships: [],
    dependsOn: [Steps.FETCH_PROJECTS],
    executionHandler: fetchBuildSettings,
  },
  {
    id: Steps.BUILD_PROJECT_BUILD_SETTING_RELATIONSHIP,
    name: 'Build Project Build Relationship',
    entities: [],
    relationships: [Relationships.PROJECT_HAS_BUILD_SETTINGS],
    dependsOn: [Steps.FETCH_PROJECTS, Steps.FETCH_BUILD_SETTINGS],
    executionHandler: buildProjectBuildSettingsRelationship,
  },
];
