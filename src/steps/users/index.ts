import {
  createDirectRelationship,
  createIntegrationEntity,
  Entity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../../client';
import { ADOIntegrationConfig } from '../../types';
import { Entities, Relationships, Steps } from '../constant';

export const UNIQUE_NAME_TO_USER_ID_MAPPING_PREFIX = 'UserUniqueName:';

export function getUserKey(uniqueId) {
  return uniqueId;
}

export async function fetchUsers({
  logger,
  instance,
  jobState,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const accountEntity = (await jobState.getData(
    Entities.ACCOUNT_ENTITY._type,
  )) as Entity;

  await apiClient.iterateUsers(async (user) => {
    if (!user.identity?.id) {
      logger.info('Skipping user resource where user.identity is undefined');
      return;
    }
    const userEntity = await jobState.addEntity(
      createIntegrationEntity({
        entityData: {
          source: user,
          assign: {
            _type: Entities.USER_ENTITY._type,
            _class: Entities.USER_ENTITY._class,
            _key: getUserKey(user.identity?.id),
            name: user.identity?.displayName,
            displayName: user.identity?.displayName,
            email: user.identity?.uniqueName,
            emailDomain: [user.identity?.uniqueName?.split('@').pop() || ''],
            username: user.identity?.uniqueName,
            webLink: user.identity?.url,
            imageLink: user.identity?.imageUrl,
            descriptor: user.identity?.descriptor,
            profileLink: user.identity?.profileUrl,
            active: true,
          },
        },
      }),
    );

    // Need to be able to look up the userId based on the user's email due to the way that work items are linked to users.
    const key =
      UNIQUE_NAME_TO_USER_ID_MAPPING_PREFIX + user.identity?.uniqueName;
    await jobState.setData(key, user.identity?.id);

    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.HAS,
        from: accountEntity,
        to: userEntity,
      }),
    );

    await jobState.addRelationship(
      createDirectRelationship({
        _class: RelationshipClass.MANAGES,
        from: userEntity,
        to: accountEntity,
      }),
    );
  });
}

export const userSteps: IntegrationStep<ADOIntegrationConfig>[] = [
  {
    id: Steps.FETCH_USERS,
    name: 'Fetch Users',
    entities: [Entities.USER_ENTITY],
    relationships: [
      Relationships.ACCOUNT_HAS_USERS,
      Relationships.USERS_MANAGES_ACCOUNT,
    ],
    dependsOn: [Steps.FETCH_ACCOUNT],
    executionHandler: fetchUsers,
  },
];
