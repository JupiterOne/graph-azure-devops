# Graph Azure DevOps

[![Build Status](https://github.com/JupiterOne/graph-azure-devops/workflows/Build/badge.svg)](https://github.com/JupiterOne/graph-azure-devops/actions?query=workflow%3ABuild)
[![Gitleaks Status](https://github.com/JupiterOne/graph-azure-devops/workflows/gitleaks/badge.svg)](https://github.com/JupiterOne/graph-azure-devopsactions?query=workflow%3Agitleaks)

## Development Environment

### Prerequisites

You must have Node.JS installed to run this project. If you don't already have
it installed, you can can download the installer
[here](https://nodejs.org/en/download/). You can alternatively install Node.JS
using a version manager like [fnm](https://github.com/Schniz/fnm) or
[nvm](https://github.com/nvm-sh/nvm).

### Setup

#### Installing dependencies

First, you'll need to
[install `yarn`](https://yarnpkg.com/getting-started/install). Then, from the
root of this project, run `yarn install` to install dependencies.

#### Loading configuration

An integration executes against a configuration that provides credentials and
any other information necessary to ingest data from the provider. The
configuration fields are defined in `src/instanceConfigFields.ts` while the
configuration values are stored in a `.env` file at the root of this project.
This allows the integration to automatically load the field values and complain
when they're not provided.

Create a `.env` file at the root of this project and add environment variables
to match what is in `src/instanceConfigFields.ts`. The `.env` file is ignored by
git, so you won't have to worry about accidentally pushing credentials.

`orgUrl` is https://dev.azure.com/ + your Azure Boards organization name (ex:
"jupiterone").

You can generate a personal access token at this link:
{{`orgUrl`}}/\_usersSettings/tokens

Be sure to give `Read` access for:

- `Work Items` - Neded for `azure_devops_work_item` entities
- `Project and Team` - Needed for `azure_devops_project`, `azure_devops_team`,
  and `azure_devops_user`

Given this example configuration:

```typescript
import { IntegrationInstanceConfigFieldMap } from '@jupiterone/integration-sdk-core';

const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
  orgUrl: {
    type: 'string',
    mask: false,
  },
  accessToken: {
    type: 'string',
    mask: true,
  },
};

export default instanceConfigFields;
```

You would provide a `.env` file like this:

```bash
ORG_URL="https://dev.azure.com/jupiterone"
ACCESS_TOKEN="abcdefghijklmnopqrstuvwxyz1234567890"
```

The snake cased environment variables will automatically be converted and
applied to the camel cased configuration field. So for example, `CLIENT_ID` will
apply to the `clientId` config field, `CLIENT_SECRET` will apply to
`clientSecret`, and `MY_SUPER_SECRET_CONFIGURATION_VALUE` will apply to a
`mySuperSecretConfigurationValue` configuration field.

## Running the integration

To start collecting data, run `yarn start` from the root of the project. This
will load in your configuration from `src/index.ts`.

## Documentation

### Development

Please reference the JupiterOne integration
[development documentation](https://github.com/JupiterOne/sdk/blob/main/docs/integrations/development.md)
for more information on how to use the SDK.

See [docs/development.md](docs/development.md) for details about how to get
started with developing this integration.

### Integration usage and resource coverage

More information about the resources covered by this integration and how to
setup the integration in JupiterOne can be found in
[docs/jupiterone.md](docs/jupiterone.md).

### Changelog

The history of this integration's development can be viewed at
[CHANGELOG.md](CHANGELOG.md).
