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
  orgUrl: process.env.ORG_URL || DEFAULT_ORG_URL,
  accessToken: process.env.ACCESS_TOKEN || 'accessToken',
};

export function buildStepTestConfigForStep(stepId: string): StepTestConfig {
  return {
    stepId,
    instanceConfig: config,
    invocationConfig: invocationConfig as IntegrationInvocationConfig,
  };
}
