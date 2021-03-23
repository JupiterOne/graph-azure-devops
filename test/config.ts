import { ADOIntegrationConfig } from '../src/types';

export const DEFAULT_ORG_NAME = 'default';
export const DEFAULT_ORG_URL = 'https://dev.azure.com/' + DEFAULT_ORG_NAME;

export const config: ADOIntegrationConfig = {
  orgUrl: process.env.ORG_URL || DEFAULT_ORG_URL,
  accessToken: process.env.ACCESS_TOKEN || 'accessToken',
};
