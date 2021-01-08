import {
  createDirectRelationship,
  createIntegrationEntity,
  Entity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
  //IntegrationMissingKeyError,
} from '@jupiterone/integration-sdk-core';
//import { ResultGroupType } from 'azure-devops-node-api/interfaces/TestInterfaces';

import { createAPIClient } from '../../client';
import { ADOIntegrationConfig } from '../../types';
import { AZURE_DEVOPS_ACCOUNT } from '../account';

export async function fetchUsers({
  instance,
  jobState,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity = (await jobState.getData(
    AZURE_DEVOPS_ACCOUNT,
  )) as Entity;

  await apiClient.iterateUsers(async (user) => {
    const userEntity = await jobState.addEntity(
      createIntegrationEntity({
        entityData: {
          source: user,
          assign: {
            _type: 'azure_devops_user',
            _class: 'User',
            _key: user.identity?.id,
            name: user.identity?.displayName,
            displayName: user.identity?.displayName,
            email: user.identity?.uniqueName,
            username: user.identity?.uniqueName,
            webLink: user.identity?.url,
            imageLink: user.identity?.imageUrl,
            description: user.identity?.descriptor,
            profileLink: user.identity?.profileUrl,
          },
        },
      }),
    );

    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: userEntity,
      }),
    );
  });
}

export const userSteps: IntegrationStep<ADOIntegrationConfig>[] = [
  {
    id: 'fetch-users',
    name: 'Fetch Users',
    entities: [
      {
        resourceName: 'ADO User',
        _type: 'azure_devops_user',
        _class: 'User',
      },
    ],
    relationships: [
      {
        _type: 'azure_devops_account_has_user',
        _class: RelationshipClass.HAS,
        sourceType: 'azure_devops_account',
        targetType: 'azure_devops_user',
      },
    ],
    dependsOn: ['fetch-account'],
    executionHandler: fetchUsers,
  },
];
