import { IntegrationValidationError } from '@jupiterone/integration-sdk-core';
import { createMockExecutionContext } from '@jupiterone/integration-sdk-testing';

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
