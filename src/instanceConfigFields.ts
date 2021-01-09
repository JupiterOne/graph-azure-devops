import { IntegrationInstanceConfigFieldMap } from '@jupiterone/integration-sdk-core';

const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
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
