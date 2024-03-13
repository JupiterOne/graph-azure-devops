import {
  Recording,
  executeStepWithDependencies,
} from '@jupiterone/integration-sdk-testing';
import { Steps } from '../constant';
import { setupAzureRecording } from '../../../test/recording';
import { buildStepTestConfigForStep, config } from '../../../test/config';
import { getMatchRequestsBy } from '../../../test/getMatchRequestsBy';

describe(Steps.FETCH_PIPELINE, () => {
  let recording: Recording;
  afterEach(async () => {
    if (recording) {
      await recording.stop();
    }
  });

  test('Fetch Pipelines', async () => {
    recording = setupAzureRecording({
      directory: __dirname,
      name: 'fetch-pipeline',
      options: {
        matchRequestsBy: getMatchRequestsBy({ config: config }),
      },
    });

    const stepConfig = buildStepTestConfigForStep(Steps.FETCH_PIPELINE);
    const stepResult = await executeStepWithDependencies(stepConfig);
    expect(stepResult).toMatchStepMetadata(stepConfig);
  }, 110000);
});