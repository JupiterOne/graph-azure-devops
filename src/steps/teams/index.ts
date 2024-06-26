import {
  createDirectRelationship,
  createIntegrationEntity,
  Entity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
  IntegrationMissingKeyError,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../../client';
import { ADOIntegrationConfig } from '../../types';
import { Steps, Entities } from '../constant';
import { getUserKey } from '../users';
import { INGESTION_SOURCE_IDS } from '../../constants';

export async function fetchTeams({
  instance,
  jobState,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity = (await jobState.getData(
    Entities.ACCOUNT_ENTITY._type,
  )) as Entity;

  await apiClient.iterateGroups(async (team) => {
    const groupEntity = await jobState.addEntity(
      createIntegrationEntity({
        entityData: {
          source: team,
          assign: {
            _type: 'azure_devops_team',
            _class: 'UserGroup',
            _key: team.id as string,
            name: team.name,
            displayName: team.name,
            webLink: team.url,
            description: team.description,
            identityUrl: team.identityUrl,
            projectName: team.projectName,
            projectId: team.projectId,
          },
        },
      }),
    );

    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: groupEntity,
      }),
    );

    for (const user of team.users || []) {
      const userEntity = await jobState.findEntity(getUserKey(user.id));

      if (!userEntity) {
        throw new IntegrationMissingKeyError(
          `Expected user with key to exist (key=${user.id})`,
        );
      }

      await jobState.addRelationship(
        createDirectRelationship({
          _class: RelationshipClass.HAS,
          from: groupEntity,
          to: userEntity,
        }),
      );
    }

    if (team.projectId != undefined) {
      const projectEntity = await jobState.findEntity(team.projectId);
      if (!projectEntity) {
        throw new IntegrationMissingKeyError(
          `Expected project with key to exist (key=${team.projectId})`,
        );
      }
      await jobState.addRelationship(
        createDirectRelationship({
          _class: RelationshipClass.HAS,
          from: projectEntity,
          to: groupEntity,
        }),
      );
    }
  });
}

export const teamSteps: IntegrationStep<ADOIntegrationConfig>[] = [
  {
    id: 'fetch-teams',
    name: 'Fetch Teams',
    entities: [
      {
        resourceName: 'ADO Team',
        _type: 'azure_devops_team',
        _class: ['UserGroup'],
      },
    ],
    relationships: [
      {
        _type: 'azure_devops_project_has_team',
        _class: RelationshipClass.HAS,
        sourceType: 'azure_devops_project',
        targetType: 'azure_devops_team',
      },
      {
        _type: 'azure_devops_account_has_team',
        _class: RelationshipClass.HAS,
        sourceType: 'azure_devops_account',
        targetType: 'azure_devops_team',
      },
      {
        _type: 'azure_devops_team_has_user',
        _class: RelationshipClass.HAS,
        sourceType: 'azure_devops_team',
        targetType: 'azure_devops_user',
      },
    ],
    dependsOn: ['fetch-users', Steps.FETCH_PROJECTS],
    executionHandler: fetchTeams,
    ingestionSourceId: INGESTION_SOURCE_IDS.TEAMS,
  },
];
