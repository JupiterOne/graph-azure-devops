import {
  Entity,
  IntegrationMissingKeyError,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
  createDirectRelationship,
  createIntegrationEntity,
} from '@jupiterone/integration-sdk-core';
import { createAPIClient } from '../../client';
import { ADOIntegrationConfig } from '../../types';

import {
  AlertSeverity,
  AlertState,
  Entities,
  Relationships,
  Steps,
} from '../constant';
import {
  Alert,
  AlertType,
} from 'azure-devops-node-api/interfaces/AlertInterfaces';
import { getRepoKey } from '../repos';

function getAlertsKey(alertID) {
  return `${Entities.ALERT_ENTITY._type}:${alertID}`;
}

function createAlertEntity(alert: Alert, repoId): Entity {
  return createIntegrationEntity({
    entityData: {
      source: alert,
      assign: {
        _key: getAlertsKey(alert.alertId),
        _type: Entities.ALERT_ENTITY._type,
        _class: Entities.ALERT_ENTITY._class,
        id: String(alert.alertId),
        category: alert.alertType ? AlertType[alert.alertType] : 'Unknown',
        status: alert.state ? AlertState[alert.state] : 'Unknown',
        severity: alert.severity ? AlertSeverity[alert.severity] : 'Unknown',
        numericSeverity: alert.severity,
        gitRef: alert.gitRef,
        open: alert.state == 1, // state 1 = active
        repositoryUrl: alert.repositoryUrl,
        name: alert.title,
        repoId: repoId,
      },
    },
  });
}

export async function fetchAlerts({
  instance,
  jobState,
  logger,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  await jobState.iterateEntities(
    { _type: Entities.REPOSITORY_ENTITY._type },
    async (repositoryEntity) => {
      const projectId = repositoryEntity?.projectId;
      const repoId = repositoryEntity.id;

      if (!projectId || !repoId) {
        logger.warn(`cannot get data for project id or repo Id`);
        return;
      }

      await apiClient.iterateAlerts(
        projectId,
        repoId,
        logger,
        async (alert) => {
          await jobState.addEntity(createAlertEntity(alert, repoId));
        },
      );
    },
  );
}

export async function buildRepoAlertRelationship({
  jobState,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  await jobState.iterateEntities(
    { _type: Entities.ALERT_ENTITY._type },
    async (alertEntity) => {
      const repoKey = getRepoKey(alertEntity.repoId);

      if (!repoKey) {
        throw new IntegrationMissingKeyError(
          `Build-Repo-Alert-Relationship: ${repoKey} Missing.`,
        );
      } else {
        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.HAS,
            fromKey: repoKey,
            fromType: Entities.REPOSITORY_ENTITY._type,
            toKey: alertEntity._key,
            toType: Entities.ALERT_ENTITY._type,
          }),
        );
      }
    },
  );
}

export const alertSteps: IntegrationStep<ADOIntegrationConfig>[] = [
  {
    id: Steps.FETCH_ALERTS,
    name: 'Fetch Alerts',
    entities: [Entities.ALERT_ENTITY],
    relationships: [],
    dependsOn: [Steps.FETCH_REPOSITORY],
    executionHandler: fetchAlerts,
  },
  {
    id: Steps.BUILD_REPO_ALERT_RELATIONSHIP,
    name: 'Build Repo Alert Relationship',
    entities: [],
    relationships: [Relationships.REPO_HAS_ALERTS],
    dependsOn: [Steps.FETCH_REPOSITORY, Steps.FETCH_ALERTS],
    executionHandler: buildRepoAlertRelationship,
  },
];
