# Development

## Provider account setup

Create a free trial account
[here][https://azure.microsoft.com/en-us/services/devops/boards/].

## Authentication

Generate a personal access token at
https://dev.azure.com/{{`your_azure_boards_organiztion_name`}}/_usersSettings/tokens.
Be sure to provide the following permissions:

- Project and Team : `read`
- Work Items: `read`
- Build: `read`
- Environment: `read & manage`
- User Profile: `read`
- Code: `read`
- Graph: `read`
- Identity: `read`
- Advanced Security: `read`
