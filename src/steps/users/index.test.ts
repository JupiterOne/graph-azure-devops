import {
  createMockStepExecutionContext,
  MockIntegrationStepExecutionContext,
  Recording,
} from '@jupiterone/integration-sdk-testing';
import { fetchUsers } from '.';
import { config } from '../../../test/config';
import { setupAzureRecording } from '../../../test/recording';
import { getMatchRequestsBy } from '../../../test/getMatchRequestsBy';
import { testEntities } from '../../../test/testEntities';
import { testRelationships } from '../../../test/testRelationships';
import { toArray } from '../../../test/toArray';
import { ADOIntegrationConfig } from '../../types';
import { fetchAccountDetails } from '../account';
import { Entities } from '../constant';

let recording: Recording;

afterEach(async () => {
  if (recording) {
    await recording.stop();
  }
});

describe('fetchUsers', () => {
  async function setupFetchUsersContext(): Promise<
    MockIntegrationStepExecutionContext<ADOIntegrationConfig>
  > {
    const setupContext = createMockStepExecutionContext({
      instanceConfig: config,
    });

    await fetchAccountDetails(setupContext);

    const accountEntity = setupContext.jobState.collectedEntities.filter((e) =>
      toArray(e._class).includes('Account'),
    )[0];

    return createMockStepExecutionContext({
      instanceConfig: config,
      entities: setupContext.jobState.collectedEntities,
      relationships: setupContext.jobState.collectedRelationships,
      setData: {
        [Entities.ACCOUNT_ENTITY._type]: accountEntity,
      },
    });
  }

  it('Should create user entities and relationships', async () => {
    recording = setupAzureRecording({
      directory: __dirname,
      name: 'fetchUsers',
      options: {
        matchRequestsBy: getMatchRequestsBy({ config: config }),
      },
    });

    const context = await setupFetchUsersContext();

    await fetchUsers(context);

    const userEntities = context.jobState.collectedEntities;
    testEntities(userEntities, 'userEntities');
    const userRelationships = context.jobState.collectedRelationships;
    testRelationships(userRelationships, 'userRelationships');
  });
});
