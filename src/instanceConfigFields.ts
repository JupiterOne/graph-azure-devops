import { IntegrationInstanceConfigFieldMap } from '@jupiterone/integration-sdk-core';

const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
  /*clientId: {
    type: 'string',
  },
  clientSecret: {
    type: 'string',
    mask: true,
  },*/
  orgUrl: {
    type: 'string',
    mask: false,
  },
  accessToken: {
    type: 'string',
    mask: true,
  },
};

export default instanceConfigFields;
