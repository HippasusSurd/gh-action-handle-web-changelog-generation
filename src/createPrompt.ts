export const createPrompt = (prTitle: string, prDescription: string, jiraTitle: string, jiraDescription: string): string => {
    return `Your task is to create a concise and clear changelog entry from the given pull request (PR) description and associated Jira ticket description.

Context:
- This repository is a frontend web application that enables users to generate AI-generated images. 
- A "major" feature is something significantly impactful to end users, introducing substantial new capabilities or fundamentally enhancing user experience.
- A "minor" feature refers to incremental improvements or additions that benefit users but do not fundamentally alter how they use the app.
- Developer-facing changes (refactoring, tooling, configuration, workflow improvements) should strictly be placed under "👩‍💻 Internal".
- Avoid categorizing any developer-facing improvements as major or minor features.
- Use as few sections as possible; prefer using a single most-appropriate section unless multiple clearly distinct categories apply.
- The output must always be contained in \`\`\` tags.

Use the following refined changelog template:

\`\`\`
## 🚀 New major features:
- [TICKET-ID] Significant, user-facing features that greatly enhance functionality or experience.

## ✨ New minor features:
- [TICKET-ID] Smaller improvements or additions that incrementally improve user experience.

## 🛠️ Other changes:
- [TICKET-ID] User-impacting updates that do not clearly fit other categories.

## 🐞 Bugs fixed:
- [TICKET-ID] Clearly described fixes for previously reported bugs affecting users.

## 🖥 Copy changes:
- [TICKET-ID] Textual updates, clarifications, or corrections.

## 💅 Style changes:
- [TICKET-ID] UI/UX, visual or stylistic enhancements.

## 👩‍💻 Internal:
- (Internal) [TICKET-ID] Developer-facing refactors, configuration changes, tooling or workflow enhancements.
\`\`\`

Given:
- PR Title: "${prTitle}"
- PR Description: \`\`\`${prDescription}\`\`\`
- Jira Ticket Title: "${jiraTitle}"
- Jira Ticket Description: \`\`\`${jiraDescription}\`\`\`

Create the changelog entry below using the refined template and guidelines provided.
`
}