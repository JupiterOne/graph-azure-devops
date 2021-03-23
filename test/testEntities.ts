import { Entity } from '@jupiterone/integration-sdk-core';
import { v4 as uuid } from 'uuid';

export function testEntities(entities: Entity[], snapshotName = uuid()) {
  expect(entities.length).toBeGreaterThan(0);
  expect(entities).toMatchGraphObjectSchema({
    _class: entities[0]._class,
  });
  expect(entities).toMatchSnapshot(snapshotName);
}
