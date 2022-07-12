import { ADOIntegrationConfig } from '../src/types';

import * as dotenv from 'dotenv';
import * as path from 'path';

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
