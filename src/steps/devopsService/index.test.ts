import {
  Recording,
  executeStepWithDependencies,
} from '@jupiterone/integration-sdk-testing';
import { Steps, unit_test_custom_timout } from '../constant';
import { setupAzureRecording } from '../../../test/recording';
import { buildStepTestConfigForStep, config } from '../../../test/config';
import { getMatchRequestsBy } from '../../../test/getMatchRequestsBy';

describe('should be able to create Service entity and relationship', () => {
  let recording: Recording;
  afterEach(async () => {
    if (recording) {
      await recording.stop();
    }
  });

  test(
    'Fetch Service',
    async () => {
      recording = setupAzureRecording({
        directory: __dirname,
        name: 'fetch-devops-service',
        options: {
          matchRequestsBy: getMatchRequestsBy({ config: config }),
        },
      });

      const stepConfig = buildStepTestConfigForStep(Steps.FETCH_SERVICE);
      const stepResult = await executeStepWithDependencies(stepConfig);
      expect(stepResult).toMatchStepMetadata(stepConfig);
    },
    unit_test_custom_timout,
  );
});
