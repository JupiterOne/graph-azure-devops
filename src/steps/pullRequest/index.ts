import {
  Entity,
  IntegrationMissingKeyError,
  IntegrationStep,
  IntegrationStepExecutionContext,
  RelationshipClass,
  createDirectRelationship,
  createIntegrationEntity,
} from '@jupiterone/integration-sdk-core';
import { createAPIClient } from '../../client';
import { ADOIntegrationConfig } from '../../types';
import {
  GitPullRequest,
  PullRequestStatus,
} from 'azure-devops-node-api/interfaces/GitInterfaces';
import { Entities, Relationships, Steps } from '../constant';
import { getRepoKey } from '../repos';
import { getUserKey } from '../users';

function getPullRequestKey(pullRequestId) {
  return `${Entities.PULL_REQUEST_ENTITY._type}:${pullRequestId}`;
}

function createPullRequestEntity(pullRequest: GitPullRequest): Entity {
  const reviewers: string[] = (pullRequest.reviewers || [])
    .map((reviewer) => `${reviewer.id}:${reviewer.vote}`)
    .filter(Boolean) as string[];

  const pullRequestEntity = createIntegrationEntity({
    entityData: {
      source: pullRequest,
      assign: {
        _key: getPullRequestKey(pullRequest.pullRequestId),
        _type: Entities.PULL_REQUEST_ENTITY._type,
        _class: Entities.PULL_REQUEST_ENTITY._class,
        id: String(pullRequest.pullRequestId),
        name: pullRequest.title,
        description: pullRequest.description,
        reviewers: reviewers,
        creationDate: pullRequest.creationDate?.toLocaleString(),
        createdBy: pullRequest.createdBy?.id,
        mergeId: pullRequest.mergeId,
        codeReviewId: pullRequest.codeReviewId,
        mergeStatus: pullRequest.mergeStatus,
        source: pullRequest.sourceRefName,
        forkSource: pullRequest.forkSource?.repository?.name,
        target: pullRequest.targetRefName,
        state: pullRequest.status ? PullRequestStatus[pullRequest.status] : 0,
        repository: pullRequest.repository?.id,
      },
    },
  });

  return pullRequestEntity;
}

export async function fetchRepositories({
  instance,
  jobState,
  logger,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  const apiClient = createAPIClient(instance.config);

  await jobState.iterateEntities(
    { _type: 'azure_devops_repo' },
    async (repositoryEntity) => {
      const projectId = repositoryEntity?.projectId;
      const repoId = repositoryEntity.id;

      if (!projectId || !repoId) {
        logger.warn(`cannot get data for project id or repo Id`);
        return;
      }

      await apiClient.iteratePullRequests(
        projectId,
        repoId,
        async (pullRequest) => {
          await jobState.addEntity(createPullRequestEntity(pullRequest));
        },
      );
    },
  );
}

export async function buildRepoPRRelationship({
  jobState,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  await jobState.iterateEntities(
    { _type: Entities.PULL_REQUEST_ENTITY._type },
    async (pullRequestEntity) => {
      const repoId = String(pullRequestEntity.repository);
      const repoKey = getRepoKey(repoId);

      if (jobState.hasKey(repoKey)) {
        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.HAS,
            fromKey: repoKey,
            fromType: Entities.REPOSITORY_ENTITY._type,
            toKey: pullRequestEntity._key,
            toType: Entities.PULL_REQUEST_ENTITY._type,
          }),
        );
      } else {
        throw new IntegrationMissingKeyError(
          `Build-Repo-PR-Relationship: ${repoKey} Missing.`,
        );
      }
    },
  );
}

export async function buildUserOpenedPRRelationship({
  jobState,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  await jobState.iterateEntities(
    { _type: Entities.PULL_REQUEST_ENTITY._type },
    async (pullRequestEntity) => {
      const userKey = getUserKey(pullRequestEntity.createdBy);
      if (jobState.hasKey(userKey)) {
        await jobState.addRelationship(
          createDirectRelationship({
            _class: RelationshipClass.OPENED,
            fromKey: userKey,
            fromType: Entities.USER_ENTITY._type,
            toKey: pullRequestEntity._key,
            toType: Entities.PULL_REQUEST_ENTITY._type,
          }),
        );
      } else {
        throw new IntegrationMissingKeyError(
          `Build-User-Opened-PR-Relationship: ${userKey} Missing.`,
        );
      }
    },
  );
}

export async function buildUserReviewedPRRelationship({
  jobState,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  await jobState.iterateEntities(
    { _type: Entities.PULL_REQUEST_ENTITY._type },
    async (pullRequestEntity) => {
      const reviewers: string[] =
        (pullRequestEntity.reviewers as string[]) || [];

      for (let reviewer of reviewers) {
        const [reviewerId, vote] = reviewer.split(':').slice(0, 2);
        const userKey = getUserKey(reviewerId);
        if (jobState.hasKey(userKey)) {
          if (vote != '0') {
            // vote 0: reviewer taken no action
            await jobState.addRelationship(
              createDirectRelationship({
                _class: RelationshipClass.REVIEWED,
                fromKey: userKey,
                fromType: Entities.USER_ENTITY._type,
                toKey: pullRequestEntity._key,
                toType: Entities.PULL_REQUEST_ENTITY._type,
              }),
            );
          }
        } else {
          throw new IntegrationMissingKeyError(
            `Build-User-Opened-PR-Relationship: ${userKey} Missing.`,
          );
        }
      }
    },
  );
}

export async function buildUserApprovedPRRelationship({
  jobState,
}: IntegrationStepExecutionContext<ADOIntegrationConfig>) {
  await jobState.iterateEntities(
    { _type: Entities.PULL_REQUEST_ENTITY._type },
    async (pullRequestEntity) => {
      const reviewers: string[] =
        (pullRequestEntity.reviewers as string[]) || [];

      for (let reviewer of reviewers) {
        const [reviewerId, vote] = reviewer.split(':').slice(0, 2);
        const userKey = getUserKey(reviewerId);
        if (jobState.hasKey(userKey)) {
          if (vote == '5' || vote == '10') {
            // vote 0: reviewer taken no action
            await jobState.addRelationship(
              createDirectRelationship({
                _class: RelationshipClass.APPROVED,
                fromKey: userKey,
                fromType: Entities.USER_ENTITY._type,
                toKey: pullRequestEntity._key,
                toType: Entities.PULL_REQUEST_ENTITY._type,
              }),
            );
          }
        } else {
          throw new IntegrationMissingKeyError(
            `Build-User-Opened-PR-Relationship: ${userKey} Missing.`,
          );
        }
      }
    },
  );
}

export const pullRequestStep: IntegrationStep<ADOIntegrationConfig>[] = [
  {
    id: Steps.FETCH_PULL_REQUEST,
    name: 'Fetch PullRequests',
    entities: [Entities.PULL_REQUEST_ENTITY],
    relationships: [],
    dependsOn: [Steps.FETCH_REPOSITORY],
    executionHandler: fetchRepositories,
  },
  {
    id: Steps.BUILD_REPO_PR_RELATIONSHIP,
    name: 'Build PR Repository Relationship',
    entities: [],
    relationships: [Relationships.REPO_HAS_PULL_REQUEST],
    dependsOn: [Steps.FETCH_REPOSITORY, Steps.FETCH_PULL_REQUEST],
    executionHandler: buildRepoPRRelationship,
  },
  {
    id: Steps.BUILD_USER_OPENED_PR_RELATIONSHIP,
    name: 'Build User Opened PR Relationship',
    entities: [],
    relationships: [Relationships.USER_OPENED_PR],
    dependsOn: [Steps.FETCH_USERS, Steps.FETCH_PULL_REQUEST],
    executionHandler: buildUserOpenedPRRelationship,
  },
  {
    id: Steps.BUILD_USER_REVIEWED_PR_RELATIONSHIP,
    name: 'Build User Reviewed PR Relationship',
    entities: [],
    relationships: [Relationships.USER_REVIEWED_PR],
    dependsOn: [Steps.FETCH_USERS, Steps.FETCH_PULL_REQUEST],
    executionHandler: buildUserReviewedPRRelationship,
  },
  {
    id: Steps.BUILD_USER_APPROVED_PR_RELATIONSHIP,
    name: 'Build User Reviewed PR Relationship',
    entities: [],
    relationships: [Relationships.USER_APPROVED_PR],
    dependsOn: [Steps.FETCH_USERS, Steps.FETCH_PULL_REQUEST],
    executionHandler: buildUserApprovedPRRelationship,
  },
];
