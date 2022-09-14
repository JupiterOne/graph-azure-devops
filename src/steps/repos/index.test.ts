import {
  createMockStepExecutionContext,
  filterGraphObjects,
} from '@jupiterone/integration-sdk-testing';
import {
  ExplicitRelationship,
  MappedRelationship,
} from '@jupiterone/integration-sdk-core';

import { fetchRepositories } from '.';
import { config } from '../../../test/config';
import { Recording, setupAzureRecording } from '../../../test/recording';
import { getMatchRequestsBy } from '../../../test/getMatchRequestsBy';
import { fetchAccountDetails } from '../account';
import { fetchProjects } from '../projects';

let recording: Recording;
afterEach(async () => {
  await recording.stop();
});

test('#fetchRepositories', async () => {
  recording = setupAzureRecording({
    directory: __dirname,
    name: '#fetchRepositories',
    options: {
      matchRequestsBy: getMatchRequestsBy({ config: config }),
    },
  });

  const context = createMockStepExecutionContext({
    instanceConfig: config,
  });

  await fetchAccountDetails(context);
  await fetchProjects(context);
  await fetchRepositories(context);

  const repositories = context.jobState.collectedEntities.filter((e) =>
    e._class.includes('CodeRepo'),
  );
  expect(repositories.length).toBeGreaterThanOrEqual(1);
  expect(repositories).toMatchGraphObjectSchema({
    _class: ['CodeRepo'],
    schema: {
      additionalProperties: true,
      properties: {
        _type: { const: 'azure_devops_repo' },
        _key: { type: 'string' },
        name: { type: 'string' },
      },
    },
  });

  const {
    targets: directRelationships,
    rest: mappedRelationships,
  } = filterGraphObjects(
    context.jobState.collectedRelationships,
    (r) => !r._mapping,
  ) as {
    targets: ExplicitRelationship[];
    rest: MappedRelationship[];
  };

  expect(mappedRelationships.length).toBeGreaterThan(0);
  expect(directRelationships.length).toBeGreaterThan(0);
  expect(
    mappedRelationships
      .filter(
        (e) =>
          e._mapping.sourceEntityKey ===
            '41a46bd6-bb86-41ee-8ea1-f8abf98d16ed' &&
          e._mapping.targetEntity.webLink ===
            'https://github.com/CreativiceTest/travis-ci',
      )
      .every(
        (mappedRelationship) =>
          mappedRelationship._key ===
          '41a46bd6-bb86-41ee-8ea1-f8abf98d16ed|uses|FORWARD:webLink=https://github.com/CreativiceTest/travis-ci:_class=CodeRepo:fullName=CreativiceTest/travis-ci',
      ),
  ).toBe(true);
});
