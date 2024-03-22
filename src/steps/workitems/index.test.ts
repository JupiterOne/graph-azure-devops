import { RelationshipClass } from '@jupiterone/data-model';
import {
  createMockStepExecutionContext,
  MockIntegrationStepExecutionContext,
  Recording,
} from '@jupiterone/integration-sdk-testing';
import { fetchWorkItems } from '.';
import { config } from '../../../test/config';
import { setupAzureRecording } from '../../../test/recording';
import { getMatchRequestsBy } from '../../../test/getMatchRequestsBy';
import { testEntities } from '../../../test/testEntities';
import { testRelationships } from '../../../test/testRelationships';
import { toArray } from '../../../test/toArray';
import { ADOIntegrationConfig } from '../../types';
import { fetchAccountDetails } from '../account';
import { fetchProjects } from '../projects';
import { fetchUsers, UNIQUE_NAME_TO_USER_ID_MAPPING_PREFIX } from '../users';
import { Entities, unit_test_custom_timeout } from '../constant';

let recording: Recording;

afterEach(async () => {
  if (recording) {
    await recording.stop();
  }
});

async function setupFetchWorkItemsContext(): Promise<
  MockIntegrationStepExecutionContext<ADOIntegrationConfig>
> {
  const setupContext = createMockStepExecutionContext({
    instanceConfig: config,
  });

  await fetchAccountDetails(setupContext);
  await fetchUsers(setupContext);
  await fetchProjects(setupContext);

  const accountEntity = setupContext.jobState.collectedEntities.filter((e) =>
    toArray(e._class).includes('Account'),
  )[0];
  const userEntity = setupContext.jobState.collectedEntities.filter((e) =>
    toArray(e._class).includes('User'),
  )[0];

  return createMockStepExecutionContext({
    instanceConfig: config,
    entities: setupContext.jobState.collectedEntities,
    relationships: setupContext.jobState.collectedRelationships,
    setData: {
      [Entities.ACCOUNT_ENTITY._type]: accountEntity,
      [UNIQUE_NAME_TO_USER_ID_MAPPING_PREFIX + userEntity.email]:
        userEntity._key,
    },
  });
}

describe('fetchWorkItems', () => {
  it(
    'Should create user entities and relationships',
    async () => {
      recording = setupAzureRecording({
        directory: __dirname,
        name: 'fetchWorkItems',
        options: {
          matchRequestsBy: getMatchRequestsBy({ config: config }),
        },
      });

      const context = await setupFetchWorkItemsContext();
      await fetchWorkItems(context);

      const workItemEntities = context.jobState.collectedEntities;
      testEntities(workItemEntities, 'workItemEntities');
      const createdRelationships =
        context.jobState.collectedRelationships.filter(
          (r) => r._class === RelationshipClass.CREATED,
        );
      testRelationships(createdRelationships, 'createdRelationships');
      const assignedRelationships =
        context.jobState.collectedRelationships.filter(
          (r) => r._class === RelationshipClass.ASSIGNED,
        );
      testRelationships(assignedRelationships, 'assignedRelationships');
      const hasRelationships = context.jobState.collectedRelationships.filter(
        (r) => r._class === RelationshipClass.HAS,
      );
      testRelationships(hasRelationships, 'hasRelationships');
    },
    unit_test_custom_timeout,
  );
});
