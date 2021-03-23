import {
  createMockStepExecutionContext,
  Recording,
} from '@jupiterone/integration-sdk-testing';

import { setupAzureRecording } from '../../test/recording';
import { config } from '../../test/config';
import { getMatchRequestsBy } from '../../test/getMatchRequestsBy';
import { ADOIntegrationConfig } from '../types';
import { fetchProjects } from './projects';
import { fetchWorkItems } from './workitems';
import { fetchTeams } from './teams';
import { fetchUsers } from './users';
import { fetchAccountDetails } from './account';

jest.setTimeout(1000 * 60 * 1);

let recording: Recording;

afterEach(async () => {
  await recording.stop();
});

test('should collect data', async () => {
  recording = setupAzureRecording({
    directory: __dirname,
    name: 'fullIntegrationTest',
    options: {
      matchRequestsBy: getMatchRequestsBy({ config: config }),
    },
  });

  const context = createMockStepExecutionContext<ADOIntegrationConfig>({
    instanceConfig: config,
  });

  // Simulates dependency graph execution.
  // See https://github.com/JupiterOne/sdk/issues/262.
  await fetchAccountDetails(context);
  await fetchProjects(context);
  await fetchUsers(context);
  await fetchTeams(context);
  await fetchWorkItems(context);

  // Review snapshot, failure is a regression
  expect({
    numCollectedEntities: context.jobState.collectedEntities.length,
    numCollectedRelationships: context.jobState.collectedRelationships.length,
    collectedEntities: context.jobState.collectedEntities,
    collectedRelationships: context.jobState.collectedRelationships,
    encounteredTypes: context.jobState.encounteredTypes,
  }).toMatchSnapshot();

  const accounts = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('Account'),
  );
  expect(accounts.length).toBe(1);
  expect(accounts).toMatchGraphObjectSchema({
    _class: ['Account'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'azure_devops_account' },
        _key: { type: 'string' },
        name: { type: 'string' },
        displayName: { type: 'string' },
      },
      required: ['name'],
    },
  });

  const users = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('User'),
  );
  expect(users.length).toBeGreaterThan(0);
  expect(users).toMatchGraphObjectSchema({
    _class: ['User'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'azure_devops_user' },
        _key: { type: 'string' },
        name: { type: 'string' },
        displayName: { type: 'string' },
        email: { type: 'string' },
        webLink: { type: 'string' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['name'],
    },
  });

  const userGroups = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('UserGroup'),
  );
  expect(userGroups.length).toBeGreaterThan(0);
  expect(userGroups).toMatchGraphObjectSchema({
    _class: ['UserGroup'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'azure_devops_team' },
        _key: { type: 'string' },
        name: { type: 'string' },
        displayName: { type: 'string' },
        webLink: { type: 'string' },
        projectName: { type: 'string' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['name'],
    },
  });

  const projects = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('Project'),
  );
  expect(projects.length).toBeGreaterThan(0);
  expect(projects).toMatchGraphObjectSchema({
    _class: ['Project'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'azure_devops_project' },
        _key: { type: 'string' },
        name: { type: 'string' },
        displayName: { type: 'string' },
        webLink: { type: 'string' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['name'],
    },
  });

  const workitems = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('Record'),
  );
  expect(workitems.length).toBeGreaterThan(0);
  expect(workitems).toMatchGraphObjectSchema({
    _class: ['Record'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'azure_devops_work_item' },
        _key: { type: 'string' },
        name: { type: 'string' },
        displayName: { type: 'string' },
        webLink: { type: 'string' },
        _rawData: {
          type: 'array',
          items: { type: 'object' },
        },
      },
      required: ['name'],
    },
  });
});
