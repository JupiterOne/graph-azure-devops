import { accountSteps } from './account';
import { projectSteps } from './projects';
import { userSteps } from './users';
import { teamSteps } from './teams';
import { workitemSteps } from './workitems';
import { repositorySteps } from './repos';
import { pipelineSteps } from './pipelines';
import { environmentSteps } from './environments';
import { buildSettingSteps } from './buildSettings';
import { devopsServiceSteps } from './devopsService';
import { pullRequestStep } from './pullRequest';
import { alertSteps } from './alerts';

const integrationSteps = [
  ...accountSteps,
  ...projectSteps,
  ...userSteps,
  ...teamSteps,
  ...workitemSteps,
  ...repositorySteps,
  ...pipelineSteps,
  ...environmentSteps,
  ...buildSettingSteps,
  ...devopsServiceSteps,
  ...pullRequestStep,
  ...alertSteps,
];

export { integrationSteps };
