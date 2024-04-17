import { IntegrationInstanceConfig } from '@jupiterone/integration-sdk-core';

/**
 * Properties provided by the `IntegrationInstance.config`. This reflects the
 * same properties defined by `instanceConfigFields`.
 */
export interface ADOIntegrationConfig extends IntegrationInstanceConfig {
  /**
   * https://dev.azure.com/ + an Azure Boards organization name (ex: "https://dev.azure.com/jupiterone")
   */
  orgUrl: string;

  /**
   * The personal access token used to authenticate requests.
   * Can be generated at {{`orgUrl`}}/_usersSettings/tokens.
   * Requires `Read` permissions for `Work Items` and `Project and Team`
   */
  accessToken: string;
  alertSeverities?: string;
}
