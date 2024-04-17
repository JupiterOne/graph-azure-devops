import {
  createIntegrationEntity,
  IntegrationStep,
  IntegrationStepExecutionContext,
} from '@jupiterone/integration-sdk-core';

import { ADOIntegrationConfig } from '../types';
import { Entities, Steps } from './constant';

export function getAccountKey(uniqueId) {
  return `azure-devops-account:${uniqueId}`;
}

export async function fetchAccountDetails({
  instance,
  jobState,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  const name = `Azure Devops - ${instance.name}`;
  const accountEntity = await jobState.addEntity(
    createIntegrationEntity({
      entityData: {
        source: {
          id: 'azure-devops',
          name: 'Azure Devops Account',
        },
        assign: {
          _key: getAccountKey(instance.id),
          _type: Entities.ACCOUNT_ENTITY._type,
          _class: 'Account',
          name,
          displayName: name,
        },
      },
    }),
  );
  await jobState.setData(Entities.ACCOUNT_ENTITY._type, accountEntity);
}

export const accountSteps: IntegrationStep<ADOIntegrationConfig>[] = [
  {
    id: Steps.FETCH_ACCOUNT,
    name: 'Fetch Account Details',
    entities: [Entities.ACCOUNT_ENTITY],
    relationships: [],
    dependsOn: [],
    executionHandler: fetchAccountDetails,
  },
];
