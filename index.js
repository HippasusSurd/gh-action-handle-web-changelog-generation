const core = require('@actions/core');
const github = require('@actions/github');
const fetch = require('node-fetch');
const OpenAI = require('openai');
const { createPrompt } = require('./createPrompt');
const { createChangelogComment } = require('./createChangelogComment');

async function run() {
  try {
    // Use GitHub Actions inputs with fallback to environment variables
    const token = core.getInput('pr-bot-token') 
    const jiraBaseUrl = core.getInput('atlassian-base-url') 
    const jiraUser = core.getInput('atlassian-email') 
    const jiraApiToken = core.getInput('atlassian-secret')
    const openaiApiKey = core.getInput('openai-secret')

    const context = github.context;
    const prDescription = context.payload.pull_request.body;
    const prNumber = context.payload.pull_request.number;
    const repoFullName = context.payload.repository.full_name;
    const workflowName = context.workflow;

    // Extract Jira ticket key from PR description
    const ticketKeyMatch = prDescription.match(/\[(\w+-\d+)\]:/);
    if (!ticketKeyMatch) {
      core.setFailed('No Jira ticket key found.');
      return;
    }
    const ticketKey = ticketKeyMatch[1];

    // Fetch Jira ticket details
    const jiraApiUrl = `${jiraBaseUrl}/rest/api/2/issue/${ticketKey}`;
    console.log('Fetching Jira ticket from:', jiraApiUrl);
    
    const jiraResponse = await fetch(jiraApiUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${jiraUser}:${jiraApiToken}`).toString('base64'),
        'Accept': 'application/json'
      }
    });
    
    const jiraData = await jiraResponse.json();
    
    if (!jiraResponse.ok) {
      throw new Error(`Jira API error: ${jiraResponse.status} - ${JSON.stringify(jiraData)}`);
    }
    
    if (!jiraData.fields) {
      throw new Error('Unexpected Jira API response format - missing fields property');
    }
    
    const jiraDescription = jiraData.fields.description || "";

    // Compose prompt for LLM
    const prompt = createPrompt(prDescription, jiraDescription);

    const openAiClient = new OpenAI({
      apiKey: openaiApiKey,
    });

    const openaiData = await openAiClient.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "user",
                content: prompt
            }
        ]
    });

    // console.log('OpenAI API Response:', JSON.stringify(openaiData, null, 2));

    if (!openaiData?.choices?.[0]?.message?.content) {
        throw new Error(`Unexpected OpenAI API response format: ${JSON.stringify(openaiData)}`);
    }

    console.log('OpenAI API request completed');

    const generatedChangelog = openaiData.choices[0].message.content.trim();
    console.log('Generated changelog:', generatedChangelog);

    const workflowUrl = `https://github.com/${repoFullName}/actions/workflows/${workflowName}?query=event:workflow_dispatch`;

    // Initialize Octokit
    const octokit = github.getOctokit(token);
    console.log('Octokit initialized');

    const repoOwner = repoFullName.split('/')[0];
    const repoName = repoFullName.split('/')[1];
    
    // Search for existing changelog comment
    const comments = await octokit.rest.issues.listComments({
      owner: repoOwner,
      repo: repoName,
      issue_number: prNumber,
    });

    const existingComment = comments.data.find(comment => 
      comment.body.includes('<!-- generated-changelog -->')
    );

    if (existingComment) {
      // Update existing comment
      await octokit.rest.issues.updateComment({
        owner: repoOwner,
        repo: repoName,
        comment_id: existingComment.id,
        body: createChangelogComment(generatedChangelog, workflowUrl)
      });
      core.info(`Updated existing changelog comment for PR #${prNumber}`);
    } else {
      // Create new comment if none exists
      await octokit.rest.issues.createComment({
        owner: repoOwner,
        repo: repoName,
        issue_number: prNumber,
        body: createChangelogComment(generatedChangelog, workflowUrl)
      });
      core.info(`Created new changelog comment for PR #${prNumber}`);
    }

    core.info(`Changelog operation completed for PR #${prNumber}`);
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();