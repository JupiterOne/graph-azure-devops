import { StepTestConfig } from '@jupiterone/integration-sdk-testing';
import { ADOIntegrationConfig } from '../src/types';

import * as dotenv from 'dotenv';
import * as path from 'path';
import { invocationConfig } from '../src';
import { IntegrationInvocationConfig } from '@jupiterone/integration-sdk-core';

if (process.env.LOAD_ENV) {
  dotenv.config({
    path: path.join(__dirname, '../.env'),
  });
}

export const DEFAULT_ORG_NAME = 'default';
export const DEFAULT_ORG_URL = 'https://dev.azure.com/' + DEFAULT_ORG_NAME;

export const config: ADOIntegrationConfig = {
  orgUrl: process.env.ORG_URL || 'https://dev.azure.com/metron0620',
  accessToken:
    process.env.ACCESS_TOKEN ||
    'fip4ujj6pct5pj5m6k6uju35xe6z6db6xwxkxg5kffkdfi7gizwa',
};

export function buildStepTestConfigForStep(stepId: string): StepTestConfig {
  return {
    stepId,
    instanceConfig: config,
    invocationConfig: invocationConfig as IntegrationInvocationConfig,
  };
}
