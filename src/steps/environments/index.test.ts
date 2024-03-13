import {
  Recording,
  executeStepWithDependencies,
} from '@jupiterone/integration-sdk-testing';
import { Steps } from '../constant';
import { setupAzureRecording } from '../../../test/recording';
import { buildStepTestConfigForStep, config } from '../../../test/config';
import { getMatchRequestsBy } from '../../../test/getMatchRequestsBy';

describe(Steps.FETCH_ENVIRONMENTS, () => {
  let recording: Recording;
  afterEach(async () => {
    if (recording) {
      await recording.stop();
    }
  });

  test('Fetch Pipelines', async () => {
    recording = setupAzureRecording({
      directory: __dirname,
      name: 'fetch-environments',
      options: {
        matchRequestsBy: getMatchRequestsBy({ config: config }),
      },
    });

    const stepConfig = buildStepTestConfigForStep(Steps.FETCH_ENVIRONMENTS);
    const stepResult = await executeStepWithDependencies(stepConfig);
    expect(stepResult).toMatchStepMetadata(stepConfig);
  }, 110000);
});