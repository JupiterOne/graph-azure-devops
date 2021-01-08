import {
  createMockStepExecutionContext,
  Recording,
} from '@jupiterone/integration-sdk-testing';

import { setupADORecording } from '../../test/recording';
import { ADOIntegrationConfig } from '../types';
import { fetchProjects } from './projects';
import { fetchWorkitems } from './workitems';
import { fetchTeams } from './teams';
import { fetchUsers } from './users';
import { fetchAccountDetails } from './account';

const DEFAULT_ORG_URL = 'https://dev.azure.com/tkcasey1';
const DEFAULT_ACCESS_TOKEN = 'topsecret123'; //fake secret because we have a recording

const integrationConfig: ADOIntegrationConfig = {
  orgUrl: process.env.ORG_URL || DEFAULT_ORG_URL,
  accessToken: process.env.ACCESS_TOKEN || DEFAULT_ACCESS_TOKEN,
};

jest.setTimeout(1000 * 60 * 1);

let recording: Recording;

afterEach(async () => {
  await recording.stop();
});

test('should collect data', async () => {
  recording = setupADORecording({
    directory: __dirname,
    name: 'steps',
  });

  const context = createMockStepExecutionContext<ADOIntegrationConfig>({
    instanceConfig: integrationConfig,
  });

  // Simulates dependency graph execution.
  // See https://github.com/JupiterOne/sdk/issues/262.
  await fetchAccountDetails(context);
  await fetchProjects(context);
  await fetchWorkitems(context);
  await fetchUsers(context);
  await fetchTeams(context);

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
  expect(accounts.length).toBeGreaterThan(0);
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
  //expect(projects.length).toBeGreaterThan(0);
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
  //expect(workitems.length).toBeGreaterThan(0);
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
