import {
  Recording,
  executeStepWithDependencies,
} from '@jupiterone/integration-sdk-testing';
import { Steps, unit_test_custom_timout } from '../constant';
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

  test(
    'Fetch Build Settings',
    async () => {
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
    },
    unit_test_custom_timout,
  );

  test(
    'build relationship project-buildSetting',
    async () => {
      recording = setupAzureRecording({
        directory: __dirname,
        name: 'build-project-build-setting-relationship',
        options: {
          matchRequestsBy: getMatchRequestsBy({ config: config }),
        },
      });

      const stepConfig = buildStepTestConfigForStep(
        Steps.BUILD_PROJECT_BUILD_SETTING_RELATIONSHIP,
      );
      const stepResult = await executeStepWithDependencies(stepConfig);
      expect(stepResult).toMatchStepMetadata(stepConfig);
    },
    unit_test_custom_timout,
  );
});
