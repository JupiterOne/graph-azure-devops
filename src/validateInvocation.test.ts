import { IntegrationValidationError } from '@jupiterone/integration-sdk-core';
import {
  createMockExecutionContext,
  setupRecording,
} from '@jupiterone/integration-sdk-testing';

import { ADOIntegrationConfig } from './types';
import validateInvocation from './validateInvocation';

it('requires valid config', async () => {
  const executionContext = createMockExecutionContext<ADOIntegrationConfig>({
    instanceConfig: {} as ADOIntegrationConfig,
  });

  await expect(validateInvocation(executionContext)).rejects.toThrow(
    IntegrationValidationError,
  );
});

it('auth error', async () => {
  const recording = setupRecording({
    directory: '__recordings__',
    name: 'client-auth-error',
  });

  recording.server.any().intercept((req, res) => {
    res.status(401);
  });

  const executionContext = createMockExecutionContext({
    instanceConfig: {
      orgUrl: 'INVALID',
      accessToken: 'INVALID',
    },
  });

  await expect(validateInvocation(executionContext)).rejects.toThrow(
    IntegrationValidationError,
  );
});
