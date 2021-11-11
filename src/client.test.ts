import { Recording, setupAzureRecording } from '../test/recording';
import { getMatchRequestsBy } from '../test/getMatchRequestsBy';
import { config } from '../test/config';
import { createAPIClient } from './client';
import { ADOIntegrationConfig } from './types';
import { IntegrationProviderAuthenticationError } from '@jupiterone/integration-sdk-core';
import { getMatchers } from 'expect/build/jestMatchersObject';

let recording: Recording;

afterEach(async () => {
  if (recording) {
    await recording.stop();
  }
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toThrowIntegrationAPIError(): R;
    }
  }
}

function getProviderAPIErrorRegex() {
  const URL_MATCHER = '(www|http:|https:)+[^\\s]+[\\w]';
  const STATUS_CODE_MATCHER = '[0-9]{3}';
  const STATUS_MATCHER = '(?!(undefined)).+';
  return new RegExp(
    `Provider (authentication|authorization|API) failed at ${URL_MATCHER}: ${STATUS_CODE_MATCHER} ${STATUS_MATCHER}`,
  );
}

function toThrowIntegrationAPIError(callable: () => any) {
  // TODO this does not seem to work with `rejects`, e.g.
  //   await expect(cb).rejects.toThrowIntegrationAPIError()
  return getMatchers().toThrow(callable, getProviderAPIErrorRegex());
}

expect.extend({
  toThrowIntegrationAPIError,
});

describe('toThrowIntegrationAPIError', () => {
  // TODO move to SDK
  test('should fail if url does not match', () => {
    expect(() => {
      throw new IntegrationProviderAuthenticationError({
        endpoint: 'web.uri.something',
        status: 401,
        statusText: 'Unauthorized',
      });
    }).not.toThrowIntegrationAPIError();
  });

  test('should fail if status code is not 3-digit numeric', () => {
    expect(() => {
      throw new IntegrationProviderAuthenticationError({
        endpoint: 'www.google.com',
        status: 40,
        statusText: 'Unauthorized',
      });
    }).not.toThrowIntegrationAPIError();
  });

  test('should fail if status is undefined', () => {
    expect(() => {
      throw new IntegrationProviderAuthenticationError({
        endpoint: 'www.google.com',
        status: 401,
        statusText: (undefined as unknown) as string,
      });
    }).not.toThrowIntegrationAPIError();
  });

  test('should pass if all args are valid', () => {
    expect(() => {
      throw new IntegrationProviderAuthenticationError({
        endpoint: 'www.google.com',
        status: 401,
        statusText: 'Unauthorized',
      });
    }).toThrowIntegrationAPIError();
  });
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
        getProviderAPIErrorRegex(),
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
        getProviderAPIErrorRegex(),
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
        getProviderAPIErrorRegex(),
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
        getProviderAPIErrorRegex(),
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
        getProviderAPIErrorRegex(),
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
        getProviderAPIErrorRegex(),
      );
    });
  });
});
