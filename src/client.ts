import {
  IntegrationLogger,
  IntegrationProviderAuthenticationError,
} from '@jupiterone/integration-sdk-core';
import { retry } from '@lifeomic/attempt';

import { ADOIntegrationConfig } from './types';

import * as azdev from 'azure-devops-node-api';
import {
  TeamProjectReference,
  WebApiTeam,
} from 'azure-devops-node-api/interfaces/CoreInterfaces';
import { TeamMember } from 'azure-devops-node-api/interfaces/common/VSSInterfaces';
import { WorkItem } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';
import { ICoreApi } from 'azure-devops-node-api/CoreApi';
import { IBuildApi } from 'azure-devops-node-api/BuildApi';
import {
  BuildDefinitionReference,
  BuildRepository,
  PipelineGeneralSettings,
} from 'azure-devops-node-api/interfaces/BuildInterfaces';
import { ITaskAgentApi } from 'azure-devops-node-api/TaskAgentApi';
import { IGitApi } from 'azure-devops-node-api/GitApi';
import { GitPullRequest } from 'azure-devops-node-api/interfaces/GitInterfaces';
import { IAlertApi } from 'azure-devops-node-api/AlertApi';
import { Alert } from 'azure-devops-node-api/interfaces/AlertInterfaces';

export type ResourceIteratee<T> = (each: T) => Promise<void> | void;

type ADOUser = {
  id: string;
};
interface ADOGroup extends WebApiTeam {
  users?: ADOUser[];
}
interface ADOWorkItem extends WorkItem {
  projectId?: string;
}

/**
 * An APIClient maintains authentication state and provides an interface to
 * third party data APIs.
 *
 * It is recommended that integrations wrap provider data APIs to provide a
 * place to handle error responses and implement common patterns for iterating
 * resources.
 */
export class APIClient {
  constructor(readonly config: ADOIntegrationConfig) {}

  public async verifyAuthentication(): Promise<void> {
    // the most light-weight request possible to validate
    // authentication works with the provided credentials, throw an err if
    // authentication fails

    const connection = getConnection(
      this.config.accessToken,
      this.config.orgUrl,
    );
    await getAzureDevOpsApi(connection, 'core'); //the authen will fail on this line if accessToken is bad and throw an err
  }

  /**
   * Iterates each user resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateProjects(
    iteratee: ResourceIteratee<TeamProjectReference>,
  ): Promise<void> {
    const connection = getConnection(
      this.config.accessToken,
      this.config.orgUrl,
    );
    const core = (await getAzureDevOpsApi(connection, 'core')) as ICoreApi;

    // construct api endpoint
    const apiEndpoint = '_apis/projects';
    const projects = await fetchDataFromAzureDevOpsWithRetry(
      core,
      'projects',
      apiEndpoint,
    );
    for (const proj of projects) {
      await iteratee(proj);
    }
  }

  /**
   * Iterates each user resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateUsers(
    iteratee: ResourceIteratee<TeamMember>,
  ): Promise<void> {
    const users: TeamMember[] = [];
    const connection = getConnection(
      this.config.accessToken,
      this.config.orgUrl,
    );
    const core = (await getAzureDevOpsApi(connection, 'core')) as ICoreApi;
    // construct api endpoint
    const apiEndpoint = '_apis/teams';
    const allTeams: WebApiTeam[] = await fetchDataFromAzureDevOpsWithRetry(
      core,
      'teams',
      apiEndpoint,
    );

    //for every team, get all the users and make a list of uniques
    for (const team of allTeams) {
      if (team.projectId && team.id) {
        // construct api endpoint
        const apiEndpoint = `/projects/${team.projectId}/teams/${team.id}/members`;
        // fetch team members
        const teamMembers = await fetchDataFromAzureDevOpsWithRetry(
          core,
          'team-members',
          apiEndpoint,
          team.projectId,
          undefined,
          team.id,
        );
        for (const teamMember of teamMembers) {
          if (
            teamMember.identity?.id &&
            !users.map((x) => x.identity?.id).includes(teamMember.identity?.id)
          ) {
            users.push(teamMember);
          }
        }
      }
    }

    for (const user of users) {
      await iteratee(user);
    }
  }

  /**
   * Iterates each group resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateGroups(
    iteratee: ResourceIteratee<ADOGroup>,
  ): Promise<void> {
    const groups: ADOGroup[] = [];

    const connection = getConnection(
      this.config.accessToken,
      this.config.orgUrl,
    );
    const core = (await getAzureDevOpsApi(connection, 'core')) as ICoreApi;
    // construct api endpoint
    const apiEndpoint = '_apis/teams';
    const allTeams: WebApiTeam[] = await fetchDataFromAzureDevOpsWithRetry(
      core,
      'teams',
      apiEndpoint,
    );

    //for every team, put all the team member ids in array users
    for (const team of allTeams) {
      if (team.projectId && team.id) {
        const group: ADOGroup = team;
        group.users = [];

        // construct api endpoint
        const apiEndpoint = `/projects/${team.projectId}/teams/${team.id}/members`;
        // fetch team members
        const teamMembers = await fetchDataFromAzureDevOpsWithRetry(
          core,
          'team-members',
          apiEndpoint,
          team.projectId,
          undefined,
          team.id,
        );

        for (const teamMember of teamMembers) {
          if (teamMember.identity?.id !== undefined) {
            const userId = { id: teamMember.identity?.id };
            group.users.push(userId);
          }
        }
        groups.push(group);
      }
    }

    for (const group of groups) {
      await iteratee(group);
    }
  }

  public async iterateWorkitems(
    iteratee: ResourceIteratee<ADOWorkItem>,
  ): Promise<void> {
    const workitems: ADOWorkItem[] = [];

    const connection = getConnection(
      this.config.accessToken,
      this.config.orgUrl,
    );
    // construct api endpoint
    const apiEndpoint = '_apis/projects';
    const core = (await getAzureDevOpsApi(connection, 'core')) as ICoreApi;
    const projects: TeamProjectReference[] =
      await fetchDataFromAzureDevOpsWithRetry(core, 'projects', apiEndpoint);

    try {
      //for every project, get the latest version of each workitem
      const witracker = await connection.getWorkItemTrackingApi();
      for (const project of projects) {
        if (project.id != undefined) {
          const workItemsPerProject = await witracker.readReportingRevisionsGet(
            project.id,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            false,
            undefined,
            true,
          );
          if (workItemsPerProject.values) {
            for (const workitem of workItemsPerProject.values) {
              const adoWorkItem: ADOWorkItem = workitem;
              adoWorkItem.projectId = project.id;
              workitems.push(adoWorkItem);
            }
          }
        }
      }
    } catch (err) {
      if (isRetryableError(err)) {
        return await this.iterateWorkitems(iteratee);
      }
      throw new IntegrationProviderAuthenticationError({
        cause: err,
        endpoint:
          core.baseUrl + `<PROJECT_ID>/_apis/wit/reporting/workItemRevisions`,
        status: err.statusCode,
        statusText: err.message,
      });
    }

    for (const item of workitems) {
      await iteratee(item);
    }
  }

  /**
   * Iterates each repository resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateBuildRepositories(
    projectId,
    iteratee: ResourceIteratee<BuildRepository>,
  ): Promise<void> {
    const connection = getConnection(
      this.config.accessToken,
      this.config.orgUrl,
    );

    const buildApi = (await getAzureDevOpsApi(
      connection,
      'build',
    )) as IBuildApi;

    // construct api endpoint
    const apiEndpoint = `${projectId}/_apis/build`;
    const builds = await fetchDataFromAzureDevOpsWithRetry(
      buildApi,
      'repos',
      apiEndpoint,
      projectId,
    );

    for (const build of builds || []) {
      const { repository } = build;
      if (repository) {
        await iteratee(repository);
      }
    }
  }

  /**
   * Iterates each pipeline resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iteratePipelines(
    projectId,
    iteratee: ResourceIteratee<BuildDefinitionReference>,
  ): Promise<void> {
    const connection = getConnection(
      this.config.accessToken,
      this.config.orgUrl,
    );

    const buildApi = (await getAzureDevOpsApi(
      connection,
      'build',
    )) as IBuildApi;

    // construct api endpoint
    const apiEndpoint = `${projectId}/_apis/pipelines`;
    const pipelines = await fetchDataFromAzureDevOpsWithRetry(
      buildApi,
      'build-pipelines',
      apiEndpoint,
      projectId,
    );

    for (const pipeline of pipelines || []) {
      await iteratee(pipeline);
    }
  }

  /**
   * Iterates each Environments resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateEnvironments(
    projectId,
    iteratee: ResourceIteratee<BuildDefinitionReference>,
  ): Promise<void> {
    const connection = getConnection(
      this.config.accessToken,
      this.config.orgUrl,
    );
    const taskAgentApi = (await getAzureDevOpsApi(
      connection,
      'taskAgent',
    )) as ITaskAgentApi;

    // construct api endpoint
    const apiEndpoint = `${projectId}/_apis/pipelines/environments`;

    const environments = await fetchDataFromAzureDevOpsWithRetry(
      taskAgentApi,
      'environments',
      apiEndpoint,
      projectId,
    );
    for (const environment of environments || []) {
      await iteratee(environment);
    }
  }

  /**
   * Iterates each build Settings resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iterateBuildSettings(
    projectId,
    iteratee: ResourceIteratee<PipelineGeneralSettings>,
  ) {
    const connection = getConnection(
      this.config.accessToken,
      this.config.orgUrl,
    );
    const buildApi = (await getAzureDevOpsApi(
      connection,
      'build',
    )) as IBuildApi;

    // construct api endpoint
    const apiEndpoint = `${projectId}/_apis/build/generalsettings`;
    const buildGeneralSettings = await fetchDataFromAzureDevOpsWithRetry(
      buildApi,
      'build-general-settings',
      apiEndpoint,
      projectId,
    );
    await iteratee(buildGeneralSettings);
  }

  /**
   * Iterates each Pull Request resource in the provider.
   *
   * @param iteratee receives each resource to produce entities/relationships
   */
  public async iteratePullRequests(
    projectId,
    repoId,
    iteratee: ResourceIteratee<GitPullRequest>,
  ) {
    const connection = getConnection(
      this.config.accessToken,
      this.config.orgUrl,
    );
    const gitApi = (await getAzureDevOpsApi(connection, 'git')) as IGitApi;

    // construct api endpoint
    const apiEndpoint = `${projectId}/_apis/git/repositories/${repoId}/pullrequests`;

    const pullRequests = await fetchDataFromAzureDevOpsWithRetry(
      gitApi,
      'pull-requests',
      apiEndpoint,
      projectId,
      repoId,
    );

    for (const pullRequest of pullRequests || []) {
      await iteratee(pullRequest);
    }
  }

  public async iterateAlerts(
    projectId,
    repoId,
    logger: IntegrationLogger,
    iteratee: ResourceIteratee<Alert>,
  ) {
    const connection = getConnection(
      this.config.accessToken,
      this.config.orgUrl,
    );
    const alertApi = (await getAzureDevOpsApi(
      connection,
      'alert',
    )) as IAlertApi;

    // construct api endpoint
    const apiEndpoint = `${projectId}/_apis/alert/repositories/${repoId}/alerts`;

    const alerts = (await fetchDataFromAzureDevOpsWithRetry(
      alertApi,
      'alerts',
      apiEndpoint,
      projectId,
      repoId,
      undefined,
      logger,
    )) as Alert[];

    for (const alert of alerts || []) {
      await iteratee(alert);
    }
  }
}

/**
 * Creates an instance of the Azure DevOps API client based on the provided configuration.
 * @param {ADOIntegrationConfig} config - Configuration object containing necessary parameters for creating the client.
 * @returns {APIClient} - An instance of the Azure DevOps API client.
 */
export function createAPIClient(config: ADOIntegrationConfig): APIClient {
  return new APIClient(config);
}

/**
 * Establishes a connection to the Azure DevOps organization using the provided access token and organization URL.
 * @param {string} accessToken - The personal access token used for authentication.
 * @param {string} orgUrl - The URL of the Azure DevOps organization.
 * @returns {azdev.WebApi} - An instance of the Azure DevOps WebApi representing the connection.
 * @throws {IntegrationProviderAuthenticationError} - If there's an error while establishing the connection, an IntegrationProviderAuthenticationError is thrown.
 */
function getConnection(accessToken: string, orgUrl: string): azdev.WebApi {
  try {
    const authHandler = azdev.getPersonalAccessTokenHandler(accessToken);
    return new azdev.WebApi(orgUrl, authHandler);
  } catch (err) {
    throw new IntegrationProviderAuthenticationError({
      cause: err,
      endpoint: 'ADO WebApi',
      status: err.status,
      statusText: err.statusText,
    });
  }
}

/**
 * Retrieves the Azure DevOps API based on the provided connection and API type.
 * @param {azdev.WebApi} connection - The Azure DevOps connection object.
 * @param {string} apiType - The type of API to retrieve. Can be one of: 'core', 'build', 'alert', 'taskAgent', or 'git'.
 * @returns {Promise<any>} - A promise that resolves to the requested Azure DevOps API.
 * @throws {IntegrationProviderAuthenticationError} - If there's an error while retrieving the API, an IntegrationProviderAuthenticationError is thrown.
 */
async function getAzureDevOpsApi(
  connection: azdev.WebApi,
  apiType: string,
): Promise<any> {
  try {
    switch (apiType) {
      case 'core':
        return await connection.getCoreApi();
      case 'build':
        return await connection.getBuildApi();
      case 'alert':
        return await connection.getAlertApi();
      case 'taskAgent':
        return await connection.getTaskAgentApi();
      case 'git':
        return await connection.getGitApi();
      default:
        throw new Error('Invalid API type provided');
    }
  } catch (err) {
    let status: number | undefined = undefined;
    let statusText: string | undefined = undefined;
    if (err.message === "Cannot read property 'value' of null") {
      status = 404;
      statusText = 'Not Found';
    }
    throw new IntegrationProviderAuthenticationError({
      cause: err,
      endpoint: connection.serverUrl + `/_apis/${apiType}`,
      status: status || err.statusCode,
      statusText: statusText || err.message,
    });
  }
}

/**
 * Checks if the given error is retryable based on its properties.
 * @param {any} err - The error object to check for retryability.
 * @returns {boolean} - True if the error is retryable, false otherwise.
 */
function isRetryableError(err: any): boolean {
  return (
    err.message.includes('connect ETIMEDOUT') ||
    err.statusCode === 429 ||
    (err.statusCode >= 500 && err.statusCode < 600)
  );
}

async function fetchDataFromAzureDevOpsWithRetry(
  api: any,
  dataType: string,
  apiEndpoint: string,
  projectId?: string,
  repoId?: string,
  teamId?: string,
  logger?: IntegrationLogger,
): Promise<any> {
  const nextDelay = {
    value: 200,
  };

  const retryOptions = {
    delay: 200,
    maxAttempts: 5,
    factor: 2,
    handleError: (err) => {
      const isErrorRetryable = isRetryableError(err);
      if (isErrorRetryable) {
        const retryAfterKey = Object.keys(err.response.headers || []).filter(
          (hdrKey) => hdrKey.toLowerCase() === 'retry-after',
        )[0];
        if (retryAfterKey) {
          const delay = +err.response.headers[retryAfterKey] || 100;
          nextDelay.value = delay;
        } else {
          nextDelay.value *= retryOptions.factor || 2;
        }
      } else {
        throw err;
      }
    },
    calculateDelay: () => nextDelay.value,
  };

  return await retry(async () => {
    return await fetchDataFromAzureDevOps(
      api,
      dataType,
      apiEndpoint,
      projectId,
      repoId,
      teamId,
      logger,
    );
  }, retryOptions);
}

/**
 * Fetches data from Azure DevOps API based on the specified data type and API endpoint.
 * @param {any} api - The Azure DevOps API object used for making requests.
 * @param {string} dataType - The type of data to fetch. Supported values are: 'projects', 'teams', 'team-members', 'repos', 'build-pipelines', 'environments', 'build-general-settings', 'pull-requests', and 'alerts'.
 * @param {string} apiEndpoint - The endpoint of the API to fetch data from.
 * @param {string} [projectId] - The ID of the project associated with the data (required for certain data types).
 * @param {string} [repoId] - The ID of the repository associated with the data (required for 'pull-requests' and 'alerts').
 * @param {string} [teamId] - The ID of the team associated with the data (required for 'team-members').
 * @param {IntegrationLogger} [logger] - Optional logger for logging warning.
 * @returns {Promise<any>} - A promise that resolves to the fetched data.
 * @throws {IntegrationProviderAuthenticationError} - If there's an error while fetching data from the API, an IntegrationProviderAuthenticationError is thrown.
 */
async function fetchDataFromAzureDevOps(
  api: any,
  dataType: string,
  apiEndpoint: string,
  projectId?: string,
  repoId?: string,
  teamId?: string,
  logger?: IntegrationLogger,
): Promise<any> {
  try {
    switch (dataType) {
      case 'projects':
        return await api.getProjects();
      case 'teams':
        return await api.getAllTeams();
      case 'team-members':
        return await api.getTeamMembersWithExtendedProperties(
          projectId,
          teamId,
        );
      case 'repos':
        return await api.getBuilds(projectId);
      case 'build-pipelines':
        return await api.getDefinitions(projectId);
      case 'environments':
        return await api.getEnvironments(projectId);
      case 'build-general-settings':
        return await api.getBuildGeneralSettings(projectId);
      case 'pull-requests':
        return await api.getPullRequests(repoId, {}, projectId);
      case 'alerts':
        return await api.getAlerts(projectId, repoId);
      default:
        throw new Error('Invalid API provided');
    }
  } catch (err) {
    if (
      dataType === 'alerts' &&
      err.message.includes(
        'Advanced Security is not enabled for this repository.',
      )
    ) {
      logger?.warn(
        `Advanced Security is not enabled for ${repoId} repository.`,
      );
      return [];
    } else {
      throw new IntegrationProviderAuthenticationError({
        cause: err,
        endpoint: `${api.baseUrl}${apiEndpoint}`,
        status: err.statusCode,
        statusText: err.message,
      });
    }
  }
}
