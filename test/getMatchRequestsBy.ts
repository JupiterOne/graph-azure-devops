import { ADOIntegrationConfig } from '../src/types';
import { DEFAULT_ORG_NAME } from './config';
import { last } from 'lodash';

export function getMatchRequestsBy({
  config,
}: {
  config: ADOIntegrationConfig;
}) {
  return {
    headers: false,
    url: {
      pathname: (pathname) => {
        // Set orgUrl property to the `default` for matching in ci
        const configOrgName = last(config.orgUrl.split('/'));
        pathname = pathname.replace(configOrgName, DEFAULT_ORG_NAME);
        return pathname;
      },
    },
  };
}
