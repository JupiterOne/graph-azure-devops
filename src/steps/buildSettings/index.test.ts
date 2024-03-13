import {
  Recording,
  executeStepWithDependencies,
} from '@jupiterone/integration-sdk-testing';
import { Steps } from '../constant';
import { setupAzureRecording } from '../../../test/recording';
import { buildStepTestConfigForStep, config } from '../../../test/config';
import { getMatchRequestsBy } from '../../../test/getMatchRequestsBy';

describe(Steps.FETCH_BUILD_SETTINGS, () => {
  let recording: Recording;
  afterEach(async () => {
    if (recording) {
      await recording.stop();
    }
  });

  test('Fetch Build Settings', async () => {
    recording = setupAzureRecording({
      directory: __dirname,
      name: 'fetch-build-settings',
      options: {
        matchRequestsBy: getMatchRequestsBy({ config: config }),
      },
    });

    const stepConfig = buildStepTestConfigForStep(Steps.FETCH_BUILD_SETTINGS);
    const stepResult = await executeStepWithDependencies(stepConfig);
    expect(stepResult).toMatchStepMetadata(stepConfig);
  }, 110000);
});