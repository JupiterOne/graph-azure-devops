import { IntegrationInvocationConfig } from '@jupiterone/integration-sdk-core';

import instanceConfigFields from './instanceConfigFields';
import { integrationSteps } from './steps';
import { ADOIntegrationConfig } from './types';
import validateInvocation from './validateInvocation';
import { ingestionConfig } from './config';

export const invocationConfig: IntegrationInvocationConfig<ADOIntegrationConfig> =
  {
    instanceConfigFields,
    validateInvocation,
    integrationSteps,
    ingestionConfig,
  };
