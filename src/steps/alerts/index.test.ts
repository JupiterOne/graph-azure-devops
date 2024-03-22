import {
  Recording,
  executeStepWithDependencies,
} from '@jupiterone/integration-sdk-testing';
import { Steps, unit_test_custom_timeout } from '../constant';
import { setupAzureRecording } from '../../../test/recording';
import { buildStepTestConfigForStep, config } from '../../../test/config';
import { getMatchRequestsBy } from '../../../test/getMatchRequestsBy';

describe(Steps.FETCH_ALERTS, () => {
  let recording: Recording;
  afterEach(async () => {
    if (recording) {
      await recording.stop();
    }
  });

  test(
    'Fetch Alerts',
    async () => {
      recording = setupAzureRecording({
        directory: __dirname,
        name: 'fetch-alerts',
        options: {
          matchRequestsBy: getMatchRequestsBy({ config: config }),
          recordFailedRequests: true,
        },
      });

      const stepConfig = buildStepTestConfigForStep(Steps.FETCH_ALERTS);
      const stepResult = await executeStepWithDependencies(stepConfig);
      expect(stepResult).toMatchStepMetadata(stepConfig);
    },
    unit_test_custom_timeout,
  );

  test(
    'Buils Repo Alerts Relationship ',
    async () => {
      recording = setupAzureRecording({
        directory: __dirname,
        name: 'build-alert-repo-relationship',
        options: {
          matchRequestsBy: getMatchRequestsBy({ config: config }),
          recordFailedRequests: true,
        },
      });

      const stepConfig = buildStepTestConfigForStep(
        Steps.BUILD_REPO_ALERT_RELATIONSHIP,
      );
      const stepResult = await executeStepWithDependencies(stepConfig);
      expect(stepResult).toMatchStepMetadata(stepConfig);
    },
    unit_test_custom_timeout,
  );
});
