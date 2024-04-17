import { Recording, setupAzureRecording } from '../test/recording';
import { getMatchRequestsBy } from '../test/getMatchRequestsBy';
import { config } from '../test/config';
import { createAPIClient } from './client';
import { ADOIntegrationConfig } from './types';

let recording: Recording;

afterEach(async () => {
  if (recording) {
    await recording.stop();
  }
});

describe('APIClient', () => {
  describe('verifyAuthentication', () => {
    test('success', async () => {
      recording = setupAzureRecording({
        directory: __dirname,
        name: 'APIClient.verifyAuthentication::success',
        options: {
          matchRequestsBy: getMatchRequestsBy({ config }),
        },
      });

      const client = createAPIClient(config);
      await expect(client.verifyAuthentication()).resolves.toBeUndefined();
    });

    test('should throw Integration API error if org URL is invalid', async () => {
      const configWithInvalidOrgUrl: ADOIntegrationConfig = {
        ...config,
        orgUrl: 'https://dev.azure.com/a-very-invalid-org-url',
      };
      recording = setupAzureRecording({
        directory: __dirname,
        name: 'APIClient.verifyAuthentication::invalid-org-url',
        options: {
          matchRequestsBy: getMatchRequestsBy({
            config: configWithInvalidOrgUrl,
          }),
          recordFailedRequests: true,
        },
      });

      const client = createAPIClient(configWithInvalidOrgUrl);
      await expect(client.verifyAuthentication()).rejects.toThrow(
        /Provider authentication failed at https:\/\/dev.azure.com\/a-very-invalid-org-url\/_apis\/core: undefined Failed to find api location for area: Location id: .*?$/,
      );
    });

    test('should throw Integration API error if Personal Access Token is invalid', async () => {
      const configWithInvalidAccessToken: ADOIntegrationConfig = {
        ...config,
        accessToken: 'a-very-invalid-access-token',
      };
      recording = setupAzureRecording({
        directory: __dirname,
        name: 'APIClient.verifyAuthentication::invalid-access-token',
        options: {
          matchRequestsBy: getMatchRequestsBy({
            config: configWithInvalidAccessToken,
          }),
          recordFailedRequests: true,
        },
      });

      const client = createAPIClient(configWithInvalidAccessToken);
      await expect(client.verifyAuthentication()).rejects.toThrow(
        `Provider authentication failed at ${configWithInvalidAccessToken.orgUrl}/_apis/core: 401 Failed request: (401)`,
      );
    });
  });

  describe('iterateGroups', () => {
    test('success', async () => {
      recording = setupAzureRecording({
        directory: __dirname,
        name: 'APIClient.iterateGroups::success',
        options: {
          matchRequestsBy: getMatchRequestsBy({ config }),
        },
      });

      const client = createAPIClient(config);
      await expect(
        client.iterateGroups(() => undefined),
      ).resolves.toBeUndefined();
    });

    test('should throw Integration API error if scope "Project & Teams [read]" is not granted', async () => {
      /**
       * When re-recording this test, ensure it uses an `ACCESS_TOKEN` that does
       * not have the "Projects & Teams [read]" permission
       */
      recording = setupAzureRecording({
        directory: __dirname,
        name: 'APIClient.iterateGroups::missing-permission',
        options: {
          matchRequestsBy: getMatchRequestsBy({ config }),
          recordFailedRequests: true,
        },
      });

      const client = createAPIClient(config);
      await expect(client.iterateGroups(() => undefined)).rejects.toThrow(
        'Provider authentication failed at https://dev.azure.com/default/_apis/teams: 401 Failed request: (401)',
      );
    });
  });

  describe('iterateWorkitems', () => {
    test('success', async () => {
      recording = setupAzureRecording({
        directory: __dirname,
        name: 'APIClient.iterateWorkItems::success',
        options: {
          matchRequestsBy: getMatchRequestsBy({ config }),
        },
      });

      const client = createAPIClient(config);
      await expect(
        client.iterateWorkitems(() => undefined),
      ).resolves.toBeUndefined();
    });

    test('should throw Integration API error if scope "Work Items [read]" is not granted', async () => {
      /**
       * When re-recording this test, ensure it uses an `ACCESS_TOKEN` that does
       * not have the "Work Items [read]" permission
       */
      recording = setupAzureRecording({
        directory: __dirname,
        name: 'APIClient.iterateWorkItems::missing-permission',
        options: {
          matchRequestsBy: getMatchRequestsBy({ config }),
          recordFailedRequests: true,
        },
      });

      const client = createAPIClient(config);
      await expect(client.iterateWorkitems(() => undefined)).rejects.toThrow(
        'Provider authentication failed at https://dev.azure.com/default/<PROJECT_ID>/_apis/wit/reporting/workItemRevisions: 401 Failed request: (401)',
      );
    });
  });

  describe('iterateProjects', () => {
    test('success', async () => {
      recording = setupAzureRecording({
        directory: __dirname,
        name: 'APIClient.iterateProjects::success',
        options: {
          matchRequestsBy: getMatchRequestsBy({ config }),
        },
      });

      const client = createAPIClient(config);
      await expect(
        client.iterateProjects(() => undefined),
      ).resolves.toBeUndefined();
    });

    test('should throw Integration API error if scope "Project & Teams [read]" is not granted', async () => {
      /**
       * When re-recording this test, ensure it uses an `ACCESS_TOKEN` that does
       * not have the "Projects & Teams [read]" permission
       */
      recording = setupAzureRecording({
        directory: __dirname,
        name: 'APIClient.iterateProjects::missing-permission',
        options: {
          matchRequestsBy: getMatchRequestsBy({ config }),
          recordFailedRequests: true,
        },
      });

      const client = createAPIClient(config);
      await expect(client.iterateProjects(() => undefined)).rejects.toThrow(
        'Provider authentication failed at https://dev.azure.com/default/_apis/projects: 401 Failed request: (401)',
      );
    });
  });

  describe('iterateUsers', () => {
    test('success', async () => {
      recording = setupAzureRecording({
        directory: __dirname,
        name: 'APIClient.iterateUsers::success',
        options: {
          matchRequestsBy: getMatchRequestsBy({ config }),
        },
      });

      const client = createAPIClient(config);
      await expect(
        client.iterateUsers(() => undefined),
      ).resolves.toBeUndefined();
    });

    test('should throw Integration API error if scope "Project & Teams [read]" is not granted', async () => {
      /**
       * When re-recording this test, ensure it uses an `ACCESS_TOKEN` that does
       * not have the "Projects & Teams [read]" permission
       */
      recording = setupAzureRecording({
        directory: __dirname,
        name: 'APIClient.iterateUsers::missing-permission',
        options: {
          matchRequestsBy: getMatchRequestsBy({ config }),
          recordFailedRequests: true,
        },
      });

      const client = createAPIClient(config);
      await expect(client.iterateUsers(() => undefined)).rejects.toThrow(
        'Provider authentication failed at https://dev.azure.com/default/_apis/teams: 401 Failed request: (401)',
      );
    });
  });
});
