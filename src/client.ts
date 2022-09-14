import { IntegrationProviderAuthenticationError } from '@jupiterone/integration-sdk-core';

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
import { BuildRepository } from 'azure-devops-node-api/interfaces/BuildInterfaces';

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
    await getCoreApi(connection); //the authen will fail on this line if accessToken is bad and throw an err
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
    const core = await getCoreApi(connection);
    const projects = await getProjects(core);
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
    const core = await getCoreApi(connection);
    const allTeams: WebApiTeam[] = await getAllTeams(core);

    //for every team, get all the users and make a list of uniques
    for (const team of allTeams) {
      if (team.projectId && team.id) {
        const teamMembers = await getTeamMembers(core, team.projectId, team.id);
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
    const core = await getCoreApi(connection);
    const allTeams: WebApiTeam[] = await getAllTeams(core);

    //for every team, put all the team member ids in array users
    for (const team of allTeams) {
      if (team.projectId && team.id) {
        const group: ADOGroup = team;
        group.users = [];
        const teamMembers = await getTeamMembers(core, team.projectId, team.id);
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
    const core = await getCoreApi(connection);
    const projects: TeamProjectReference[] = await getProjects(core);

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

    const buildApi = await getBuildApi(connection);
    const builds = await getBuilds(buildApi, projectId);

    for (const build of builds || []) {
      const { repository } = build;
      if (repository) {
        await iteratee(repository);
      }
    }
  }
}

export function createAPIClient(config: ADOIntegrationConfig): APIClient {
  return new APIClient(config);
}

function getConnection(accessToken: string, orgUrl: string) {
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

async function getCoreApi(connection: azdev.WebApi) {
  try {
    return await connection.getCoreApi();
  } catch (err) {
    /**
     * The ADO client does not expose status / status message clearly. We used
     * tests to understand the expected behavior when calling this API with
     * various invalid arguments (see client.test.ts)
     */
    let status: number | undefined = undefined;
    let statusText: string | undefined = undefined;
    if (err.message === "Cannot read property 'value' of null") {
      status = 404;
      statusText = 'Not Found';
    }
    throw new IntegrationProviderAuthenticationError({
      cause: err,
      endpoint: connection.serverUrl + '/_apis/Location',
      status: status || err.statusCode,
      statusText: statusText || err.message,
    });
  }
}

async function getBuildApi(connection: azdev.WebApi) {
  try {
    return await connection.getBuildApi();
  } catch (err) {
    /**
     * The ADO client does not expose status / status message clearly. We used
     * tests to understand the expected behavior when calling this API with
     * various invalid arguments (see client.test.ts)
     */
    let status: number | undefined = undefined;
    let statusText: string | undefined = undefined;
    if (err.message === "Cannot read property 'value' of null") {
      status = 404;
      statusText = 'Not Found';
    }
    throw new IntegrationProviderAuthenticationError({
      cause: err,
      endpoint: connection.serverUrl + '/_apis/Location',
      status: status || err.statusCode,
      statusText: statusText || err.message,
    });
  }
}

async function getProjects(core: ICoreApi) {
  try {
    return await core.getProjects();
  } catch (err) {
    throw new IntegrationProviderAuthenticationError({
      cause: err,
      endpoint: core.baseUrl + '_apis/projects',
      status: err.statusCode,
      statusText: err.message,
    });
  }
}

async function getAllTeams(core: ICoreApi) {
  try {
    return await core.getAllTeams();
  } catch (err) {
    throw new IntegrationProviderAuthenticationError({
      cause: err,
      endpoint: core.baseUrl + '_apis/teams',
      status: err.statusCode,
      statusText: err.message,
    });
  }
}

async function getTeamMembers(
  core: ICoreApi,
  projectId: string,
  teamId: string,
) {
  try {
    return await core.getTeamMembersWithExtendedProperties(projectId, teamId);
  } catch (err) {
    throw new IntegrationProviderAuthenticationError({
      cause: err,
      endpoint: core.baseUrl + `/projects/${projectId}/teams/${teamId}/members`,
      status: err.statusCode,
      statusText: err.message,
    });
  }
}

async function getBuilds(build: IBuildApi, projectId: string) {
  try {
    return await build.getBuilds(projectId);
  } catch (err) {
    throw new IntegrationProviderAuthenticationError({
      cause: err,
      endpoint: build.baseUrl + `${projectId}/_apis/build`,
      status: err.statusCode,
      statusText: err.message,
    });
  }
}
