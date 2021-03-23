import { ADOIntegrationConfig } from '../src/types';

export const config: ADOIntegrationConfig = {
  orgUrl: process.env.ORG_URL || 'orgUrl',
  accessToken: process.env.ACCESS_TOKEN || 'accessToken',
};
