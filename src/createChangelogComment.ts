export const createChangelogComment = (changelog: string, workflowUrl: string): string => {
    const comment = `
<!-- generated-changelog -->
### 🤖 Automated Changelog 🤖

${changelog}

This changelog will be submitted when the PR is merged. To improve it, click the button below to re-run the action, or edit the changelog in the comment directly.
[Re-run changelog generation](${workflowUrl})
`;
    return comment;
}; 