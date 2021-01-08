import { IntegrationInstanceConfig } from '@jupiterone/integration-sdk-core';

/**
 * Properties provided by the `IntegrationInstance.config`. This reflects the
 * same properties defined by `instanceConfigFields`.
 */
export interface ADOIntegrationConfig extends IntegrationInstanceConfig {
  // clientId: string; // not used
  // clientSecret: string; // not used
  /**
   * The provider API client ID used to authenticate requests.
   */
  orgUrl: string;

  /**
   * The personal access token used to authenticate requests.
   */
  accessToken: string;
}
