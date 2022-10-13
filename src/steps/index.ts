import { accountSteps } from './account';
import { projectSteps } from './projects';
import { userSteps } from './users';
import { teamSteps } from './teams';
import { workitemSteps } from './workitems';
import { repositorySteps } from './repos';

const integrationSteps = [
  ...accountSteps,
  ...projectSteps,
  ...userSteps,
  ...teamSteps,
  ...workitemSteps,
  ...repositorySteps,
];

export { integrationSteps };
