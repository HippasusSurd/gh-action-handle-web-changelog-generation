# gh-action-handle-web-changelog-generation

Handles creating a changelog via LLM for web PRs

## Overview

This GitHub Action automatically generates changelogs for pull requests by:
1. Extracting Jira ticket information from PR descriptions
2. Fetching detailed ticket information from Jira
3. Using OpenAI's GPT-4 to generate a concise changelog
4. Posting or updating the changelog as a comment on the PR

## Setup

### Required Action Inputs

```yaml
inputs:
  pr-bot-token:
    description: 'GitHub token for PR operations'
    required: true
  atlassian-base-url:
    description: 'Atlassian base URL (e.g., https://your-org.atlassian.net)'
    required: true
  atlassian-email:
    description: 'Atlassian account email'
    required: true
  atlassian-secret:
    description: 'Atlassian API token'
    required: true
  openai-secret:
    description: 'OpenAI API key'
    required: true
```

### Required Permissions

- PR Bot Token needs:
  - Issues (read/write)
  - Pull requests (read/write)
- Jira API Token needs:
  - Read issues permission
- OpenAI API Key needs:
  - Access to GPT-4 model

## Usage

1. Include a Jira ticket reference in your PR description using the format: `[TICKET-123]:`
2. The action will automatically:
   - Fetch the Jira ticket details
   - Generate a changelog using GPT-4
   - Post the changelog as a comment on the PR
3. If the changelog needs to be regenerated:
   - Click the rerun link in the changelog comment
   - The action will update the existing comment with the new changelog

## Example Workflow

```yaml
name: Generate Changelog
on:
  pull_request:
    types: [opened, edited]

jobs:
  generate-changelog:
    runs-on: ubuntu-latest
    steps:
      - uses: your-org/gh-action-handle-web-changelog-generation@main
        with:
          pr-bot-token: ${{ secrets.GITHUB_TOKEN }}
          atlassian-base-url: ${{ secrets.ATLASSIAN_BASE_URL }}
          atlassian-email: ${{ secrets.ATLASSIAN_EMAIL }}
          atlassian-secret: ${{ secrets.ATLASSIAN_SECRET }}
          openai-secret: ${{ secrets.OPENAI_SECRET }}
```

## Development

⚠️ **Important**: This action is written in TypeScript. After making any changes, you must run `npm run build` before committing to ensure the JavaScript files are properly compiled.
