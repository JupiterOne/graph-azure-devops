import {
  Entity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
  createDirectRelationship,
  createIntegrationEntity,
} from '@jupiterone/integration-sdk-core';
import { ADOIntegrationConfig } from '../../types';
import { getAccountKey } from '../account';
import { Entities, Relationships, Steps } from '../constant';

export function getDevopsServiceKey(uniqueId: string) {
  return `${Entities.DEVOPS_SERVICE_ENTITY._type}:${uniqueId}`;
}

/**
 * create devops service entity.
 * @param compartmentId Compartment id.
 * @returns
 */
export function createDevopsServiceEntity(
  instnaceId: string,
  orgUrl: string,
): Entity {
  return createIntegrationEntity({
    entityData: {
      source: {},
      assign: {
        _key: getDevopsServiceKey(instnaceId),
        _type: Entities.DEVOPS_SERVICE_ENTITY._type,
        _class: Entities.DEVOPS_SERVICE_ENTITY._class,
        name: 'Azure-DevOps-Service',
        category: ['DevOps'],
        function: ['DevOps'],
        endpoints: [orgUrl],
      },
    },
  });
}

export async function createDevopsService({
  jobState,
  instance,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  await jobState.addEntity(
    createDevopsServiceEntity(instance.id, instance.config.orgUrl),
  );
}

export async function buildDevopsAccountServiceRelationship({
  jobState,
  instance,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  await jobState.addRelationship(
    createDirectRelationship({
      _class: RelationshipClass.HAS,
      fromKey: getAccountKey(instance.id),
      fromType: Entities.ACCOUNT_ENTITY._type,
      toKey: getDevopsServiceKey(instance.id),
      toType: Entities.DEVOPS_SERVICE_ENTITY._type,
    }),
  );
}

export async function buildDevopsServiceProjectRelationship({
  jobState,
  instance,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  await jobState.iterateEntities(
    { _type: Entities.PROJECT_ENTITY._type },
    async (projectEntity) => {
      await jobState.addRelationship(
        createDirectRelationship({
          _class: RelationshipClass.SCANS,
          fromKey: getDevopsServiceKey(instance.id),
          fromType: Entities.DEVOPS_SERVICE_ENTITY._type,
          toKey: projectEntity._key,
          toType: Entities.PROJECT_ENTITY._type,
        }),
      );
    },
  );
}

export const devopsServiceSteps: IntegrationStep<ADOIntegrationConfig>[] = [
  {
    id: Steps.FETCH_SERVICE,
    name: 'DevOps Service',
    entities: [Entities.DEVOPS_SERVICE_ENTITY],
    relationships: [], // TODO: Create Relationship
    dependsOn: [],
    executionHandler: createDevopsService,
  },
  {
    id: Steps.BUILD_SERVICE_ACCOUNT_RELATIONSHIP,
    name: 'Build Account Service Relationship',
    entities: [],
    relationships: [Relationships.AZURE_DEVOPS_ACCOUNT_HAS_DEVOPS_SERVICE],
    dependsOn: [Steps.FETCH_SERVICE, Steps.FETCH_ACCOUNT],
    executionHandler: buildDevopsAccountServiceRelationship,
  },
  {
    id: 'build-devOps-service-project-relationship',
    name: 'Build DevOps Service Project Relationship',
    entities: [],
    relationships: [Relationships.AZURE_DEVOPS_SCANS_PROJECTS],
    dependsOn: [Steps.FETCH_SERVICE, Steps.FETCH_PROJECTS],
    executionHandler: buildDevopsServiceProjectRelationship,
  },
];
