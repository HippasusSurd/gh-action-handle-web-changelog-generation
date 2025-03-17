export const createChangelogComment = (changelog: string, workflowUrl: string): string => {
    return `
<!-- automated-changelog -->
### 🤖 Automated Changelog 🤖

${changelog}

This changelog will be submitted when the PR is merged. 

### How to update it:
- **Manually edit this comment** – but note that re-running the job will overwrite any changes.
- **Re-run the changelog job** if:
  - You've updated the PR title, description, or linked Jira ticket.  
  - The generated changelog could be improved—retrying once or twice may help, but if you're still not satisfied, it's probably better to edit manually.

To re-run the job, follow [this link](${workflowUrl}) and click the "Re-run all jobs" button in the top right corner.

_Note: The changelog is generated based on the PR title, description, and linked Jira ticket._
`
}