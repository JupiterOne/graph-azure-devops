import { Relationship } from '@jupiterone/integration-sdk-core';
import { v4 as uuid } from 'uuid';

export function testRelationships(
  relationships: Relationship[],
  snapshotName = uuid(),
) {
  expect(relationships.length).toBeGreaterThan(0);
  expect(relationships).toMatchDirectRelationshipSchema({});
  expect(relationships).toMatchSnapshot(snapshotName);
}
