import { IntegrationInstanceConfigFieldMap } from '@jupiterone/integration-sdk-core';

const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
  /**
   * https://dev.azure.com/ + an Azure Boards organization name (ex: "https://dev.azure.com/jupiterone")
   */
  orgUrl: {
    type: 'string',
    mask: false,
  },
  /**
   * The personal access token used to authenticate requests.
   * Can be generated at {{`orgUrl`}}/_usersSettings/tokens.
   * Requires `Read` permissions for `Work Items` and `Project and Team`
   */
  accessToken: {
    type: 'string',
    mask: true,
  },
  alertSeverities: {
    type: 'string',
  },
};

export default instanceConfigFields;
