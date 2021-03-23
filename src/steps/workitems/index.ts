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
import { UNIQUE_NAME_TO_USER_ID_MAPPING_PREFIX } from '../users';

function extractEmail(
  lifecycleIdentifier: string | undefined,
): string | undefined {
  return (lifecycleIdentifier?.match(/<(.*?)>/) ?? [])[0]?.slice(1, -1);
}

export async function fetchWorkItems({
  instance,
  jobState,
  logger,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  const emailToIdMap = new Map<string, string>();

  await apiClient.iterateWorkitems(async (item) => {
    const fields = item.fields || {};
    const createdBy = extractEmail(fields['System.CreatedBy']);
    const assignedTo = extractEmail(fields['System.AssignedTo']);
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
            changedDate: fields['System.ChangedDate'],
            changedBy: fields['System.ChangedBy'],
            commentCount: fields['System.CommentCount'],
            stateChangeDate: fields['Microsoft.VSTS.Common.StateChangeDate'],
            priority: fields['Microsoft.VSTS.Common.Priority'],
            history: fields['System.History'],
          },
        },
      }),
    );

    let createdByUserEntity;
    if (createdBy) {
      const createdByUserId =
        emailToIdMap.get(createdBy) ??
        (await jobState.getData(
          UNIQUE_NAME_TO_USER_ID_MAPPING_PREFIX + createdBy,
        ));
      if (typeof createdByUserId === 'string') {
        emailToIdMap.set(createdBy, createdByUserId);
        createdByUserEntity = await jobState.findEntity(createdByUserId);
        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.CREATED,
            from: createdByUserEntity,
            to: workItemEntity,
          }),
        );
      } else {
        logger.info(
          `User who created ticket ${item.id?.toString()} does not exist: ${createdBy}`,
        );
      }
    }

    if (assignedTo) {
      let assignedToUserEntity;
      if (assignedTo === createdBy) {
        assignedToUserEntity = createdByUserEntity;
      } else {
        const assignedToUserId =
          emailToIdMap.get(assignedTo) ??
          (await jobState.getData(
            UNIQUE_NAME_TO_USER_ID_MAPPING_PREFIX + assignedTo,
          ));
        if (typeof assignedToUserId === 'string') {
          emailToIdMap.set(assignedTo, assignedToUserId);
          createdByUserEntity = await jobState.findEntity(assignedToUserId);
        } else {
          logger.info(
            `User who is assigned ticket ${item.id?.toString()} does not exist: ${assignedTo}`,
          );
        }
      }
      if (assignedToUserEntity) {
        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.ASSIGNED,
            from: assignedToUserEntity,
            to: workItemEntity,
          }),
        );
      }
    }

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
      {
        _type: 'azure_devops_user_created_work_item',
        _class: RelationshipClass.CREATED,
        sourceType: 'azure_devops_user',
        targetType: 'azure_devops_work_item',
      },
      {
        _type: 'azure_devops_user_assigned_work_item',
        _class: RelationshipClass.ASSIGNED,
        sourceType: 'azure_devops_user',
        targetType: 'azure_devops_work_item',
      },
    ],
    dependsOn: ['fetch-projects', 'fetch-users'],
    executionHandler: fetchWorkItems,
  },
];
