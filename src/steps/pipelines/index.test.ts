import {
  Recording,
  executeStepWithDependencies,
} from '@jupiterone/integration-sdk-testing';
import { Steps, unit_test_custom_timout } from '../constant';
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

  test(
    'Fetch Pipelines',
    async () => {
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
    },
    unit_test_custom_timout,
  );

  test(
    'BUILD PROJECT PIPELINE RELATIONSHIP',
    async () => {
      recording = setupAzureRecording({
        directory: __dirname,
        name: 'build-project-pipeline-relationship',
        options: {
          matchRequestsBy: getMatchRequestsBy({ config: config }),
        },
      });

      const stepConfig = buildStepTestConfigForStep(
        Steps.BUILD_PROJECT_PIPELINE_RELATIONSHIP,
      );
      const stepResult = await executeStepWithDependencies(stepConfig);
      expect(stepResult).toMatchStepMetadata(stepConfig);
    },
    unit_test_custom_timout,
  );
});
