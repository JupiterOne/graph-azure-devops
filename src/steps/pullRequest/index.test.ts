import {
  Recording,
  executeStepWithDependencies,
} from '@jupiterone/integration-sdk-testing';
import { Steps } from '../constant';
import { setupAzureRecording } from '../../../test/recording';
import { buildStepTestConfigForStep, config } from '../../../test/config';
import { getMatchRequestsBy } from '../../../test/getMatchRequestsBy';

describe(Steps.FETCH_PULL_REQUEST, () => {
  let recording: Recording;
  afterEach(async () => {
    if (recording) {
      await recording.stop();
    }
  });

  test('Fetch Pull Requests', async () => {
    recording = setupAzureRecording({
      directory: __dirname,
      name: 'fetch-pullrequests',
      options: {
        matchRequestsBy: getMatchRequestsBy({ config: config }),
      },
    });

    const stepConfig = buildStepTestConfigForStep(Steps.FETCH_PULL_REQUEST);
    const stepResult = await executeStepWithDependencies(stepConfig);
    expect(stepResult).toMatchStepMetadata(stepConfig);
  }, 100000);

  test('BUILD REPO PR RELATIONSHIP', async () => {
    recording = setupAzureRecording({
      directory: __dirname,
      name: 'build-repo-pr-relationship',
      options: {
        matchRequestsBy: getMatchRequestsBy({ config: config }),
      },
    });

    const stepConfig = buildStepTestConfigForStep(
      Steps.BUILD_REPO_PR_RELATIONSHIP,
    );
    const stepResult = await executeStepWithDependencies(stepConfig);
    expect(stepResult).toMatchStepMetadata(stepConfig);
  }, 100000);

  test('BUILD USER OPENED PR RELATIONSHIP', async () => {
    recording = setupAzureRecording({
      directory: __dirname,
      name: 'build-user-opened-pr-relationship',
      options: {
        matchRequestsBy: getMatchRequestsBy({ config: config }),
      },
    });

    const stepConfig = buildStepTestConfigForStep(
      Steps.BUILD_USER_OPENED_PR_RELATIONSHIP,
    );
    const stepResult = await executeStepWithDependencies(stepConfig);
    expect(stepResult).toMatchStepMetadata(stepConfig);
  }, 100000);

  test('Build User Reviewed PR Relationship', async () => {
    recording = setupAzureRecording({
      directory: __dirname,
      name: 'build-user-reviewed-pr-relationship',
      options: {
        matchRequestsBy: getMatchRequestsBy({ config: config }),
      },
    });

    const stepConfig = buildStepTestConfigForStep(
      Steps.BUILD_USER_REVIEWED_PR_RELATIONSHIP,
    );
    const stepResult = await executeStepWithDependencies(stepConfig);
    expect(stepResult).toMatchStepMetadata(stepConfig);
  }, 100000);

  test('Build User Approved PR Relationship', async () => {
    recording = setupAzureRecording({
      directory: __dirname,
      name: 'build-user-approved-pr-relationship',
      options: {
        matchRequestsBy: getMatchRequestsBy({ config: config }),
      },
    });

    const stepConfig = buildStepTestConfigForStep(
      Steps.BUILD_USER_APPROVED_PR_RELATIONSHIP,
    );
    const stepResult = await executeStepWithDependencies(stepConfig);
    expect(stepResult).toMatchStepMetadata(stepConfig);
  }, 100000);
});
