import {
  createDirectRelationship,
  createIntegrationEntity,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
  IntegrationMissingKeyError,
} from '@jupiterone/integration-sdk-core';

import { createAPIClient } from '../../client';
import { ADOIntegrationConfig } from '../../types';

export async function fetchWorkitems({
  instance,
  jobState,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  await apiClient.iterateWorkitems(async (item) => {
    const workItemEntity = await jobState.addEntity(
      createIntegrationEntity({
        entityData: {
          source: item,
          assign: {
            _type: 'azure_devops_work_item',
            _class: 'Record',
            _key: (item.projectId || '') + item.id?.toString(),
            name: (item.fields || {})['System.Title'],
            displayName: (item.fields || {})['System.Title'],
            type: (item.fields || {})['System.WorkItemType'],
            webLink: item.url,
            workItemType: (item.fields || {})['System.WorkItemType'],
            description: (item.fields || {})['System.Description'],
            projectId: item.projectId,
            projectName: (item.fields || {})['System.TeamProject'],
            teamProject: (item.fields || {})['System.TeamProject'],
            revision: item.rev,
            areaPath: (item.fields || {})['System.AreaPath'],
            interationPath: (item.fields || {})['System.IterationPath'],
            state: (item.fields || {})['System.State'],
            reason: (item.fields || {})['System.Reason'],
            createdDate: (item.fields || {})['System.CreatedDate'],
            createdBy: (item.fields || {})['System.CreatedBy'],
            changedDate: (item.fields || {})['System.ChangedDate'],
            changedBy: (item.fields || {})['System.ChangedBy'],
            commentCount: (item.fields || {})['System.CommentCount'],
            stateChangeDate: (item.fields || {})[
              'Microsoft.VSTS.Common.StateChangeDate'
            ],
            priority: (item.fields || {})['Microsoft.VSTS.Common.Priority'],
            history: (item.fields || {})['System.History'],
          },
        },
      }),
    );

    if (item.projectId != undefined) {
      const projectEntity = await jobState.findEntity(item.projectId);
      if (!projectEntity) {
        throw new IntegrationMissingKeyError(
          `Expected project with key to exist (key=${item.projectId})`,
        );
      }
      await jobState.addRelationship(
        createDirectRelationship({
          _class: RelationshipClass.HAS,
          from: projectEntity,
          to: workItemEntity,
        }),
      );
    }
  });
}

export const workitemSteps: IntegrationStep<ADOIntegrationConfig>[] = [
  {
    id: 'fetch-workitems',
    name: 'Fetch Workitems',
    entities: [
      {
        resourceName: 'ADO WorkItem',
        _type: 'azure_devops_work_item',
        _class: 'Record',
      },
    ],
    relationships: [
      {
        _type: 'azure_devops_project_has_work_item',
        _class: RelationshipClass.HAS,
        sourceType: 'azure_devops_project',
        targetType: 'azure_devops_work_item',
      },
    ],
    dependsOn: ['fetch-projects'],
    executionHandler: fetchWorkitems,
  },
];
