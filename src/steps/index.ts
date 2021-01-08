import { accountSteps } from './account';
import { projectSteps } from './projects';
import { userSteps } from './users';
import { teamSteps } from './teams';
import { workitemSteps } from './workitems';

const integrationSteps = [
  ...accountSteps,
  ...projectSteps,
  ...userSteps,
  ...teamSteps,
  ...workitemSteps,
];

export { integrationSteps };
