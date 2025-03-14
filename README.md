# gh-action-handle-web-changelog-generation

Handles creating a changelog via LLM for web PRs

## Overview

This GitHub Action automatically generates changelogs for pull requests by:
1. Extracting Jira ticket information from PR descriptions
2. Fetching detailed ticket information from Jira
3. Using OpenAI's GPT-4o to generate a concise changelog
4. Posting the changelog as a comment on the PR

## Setup

### Required Environment Variables

```env
PR_BOT_TOKEN=your_github_token
JIRA_BASE_URL=https://your-org.atlassian.net/
JIRA_USER=your_jira_email
JIRA_API_TOKEN=your_jira_api_token
OPENAI_API_KEY=your_openai_api_key
```

### Required Permissions

- PR Bot Token needs:
  - Issues (read/write)
  - Pull requests (read/write)
- Jira API Token needs:
  - Read issues permission
- OpenAI API Key needs:
  - Access to GPT-4o model

## Usage

1. Include a Jira ticket reference in your PR description using the format: `[TICKET-123]`
2. The action will automatically fetch the Jira ticket details and generate a changelog
3. The generated changelog will be posted as a comment on the PR using the PR Bot token

## Development

To run locally:
1. Clone the repository
2. Create a `.env` file with the required environment variables
3. Run `npm install`
4. Modify the test values in `index.js`:
   ```javascript
   // For local testing
   const prDescription = "This is a test PR description. [TICKET-123]";
   const prNumber = 1;  // The PR number you want to test with
   const repoFullName = "owner/repo";  // Your test repository
   const workflowName = "workflow-name"
   ```
5. Run `node index.js`

Note: When running locally, you'll need to manually set these values since the GitHub Actions context 
(`github.context`) is only available when running as an action. In production, these values are 
automatically populated from the PR that triggered the action.
