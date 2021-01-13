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
    const fields = item.fields || {};
    const workItemEntity = await jobState.addEntity(
      createIntegrationEntity({
        entityData: {
          source: item,
          assign: {
            _type: 'azure_devops_work_item',
            _class: 'Record',
            _key: (item.projectId || '') + item.id?.toString(),
            name: fields['System.Title'],
            displayName: fields['System.Title'],
            type: fields['System.WorkItemType'],
            webLink: item.url,
            workItemType: fields['System.WorkItemType'],
            description: fields['System.Description'],
            projectId: item.projectId,
            projectName: fields['System.TeamProject'],
            teamProject: fields['System.TeamProject'],
            revision: item.rev,
            areaPath: fields['System.AreaPath'],
            interationPath: fields['System.IterationPath'],
            state: fields['System.State'],
            reason: fields['System.Reason'],
            createdDate: fields['System.CreatedDate'],
            createdBy: fields['System.CreatedBy'],
            changedDate: fields['System.ChangedDate'],
            changedBy: fields['System.ChangedBy'],
            commentCount: fields['System.CommentCount'],
            stateChangeDate: fields[
              'Microsoft.VSTS.Common.StateChangeDate'
            ],
            priority: fields['Microsoft.VSTS.Common.Priority'],
            history: fields['System.History'],
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
