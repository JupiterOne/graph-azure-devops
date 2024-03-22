import {
  Recording,
  executeStepWithDependencies,
} from '@jupiterone/integration-sdk-testing';
import { Steps, unit_test_custom_timeout } from '../constant';
import { setupAzureRecording } from '../../../test/recording';
import { buildStepTestConfigForStep, config } from '../../../test/config';
import { getMatchRequestsBy } from '../../../test/getMatchRequestsBy';

describe(Steps.FETCH_PROJECTS, () => {
  let recording: Recording;
  afterEach(async () => {
    if (recording) {
      await recording.stop();
    }
  });

  test(
    'Fetch Projects',
    async () => {
      recording = setupAzureRecording({
        directory: __dirname,
        name: 'fetch-projects',
        options: {
          matchRequestsBy: getMatchRequestsBy({ config: config }),
        },
      });

      const stepConfig = buildStepTestConfigForStep(Steps.FETCH_PROJECTS);
      const stepResult = await executeStepWithDependencies(stepConfig);
      expect(stepResult).toMatchStepMetadata(stepConfig);
    },
    unit_test_custom_timeout,
  );
});
