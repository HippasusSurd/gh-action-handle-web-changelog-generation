import path from 'path'
import dotenv from 'dotenv'
import * as core from '@actions/core'
import * as github from '@actions/github'
import fetch from 'node-fetch'
import OpenAI from 'openai'
import { createPrompt } from './createPrompt'
import { createChangelogComment } from './createChangelogComment'

dotenv.config({ path: path.join(__dirname, '.env') })

// Debug environment variables
console.log('Current directory:', __dirname)
console.log('Environment variables loaded:', {
  GITHUB_TOKEN: process.env.GITHUB_TOKEN ? '***' : undefined,
  JIRA_BASE_URL: process.env.ATLASSIAN_BASE_URL,
  JIRA_USER: process.env.ATLASSIAN_EMAIL,
  JIRA_API_TOKEN: process.env.ATLASSIAN_SECRET ? '***' : undefined,
  OPENAI_API_KEY: process.env.OPENAI_SECRET ? '***' : undefined
})

interface JiraResponse {
  fields: {
    description?: string
  }
}

async function run(): Promise<void> {
  try {
    // Use GitHub Actions inputs with fallback to environment variables
    const token = core.getInput('pr-bot-token') || process.env.PR_BOT_TOKEN || ''
    const jiraBaseUrl = (core.getInput('atlassian-base-url') || process.env.ATLASSIAN_BASE_URL || '').replace(/\/$/, '')
    const jiraUser = core.getInput('atlassian-email') || process.env.ATLASSIAN_EMAIL || ''
    const jiraApiToken = core.getInput('atlassian-secret') || process.env.ATLASSIAN_SECRET || ''
    const openaiApiKey = core.getInput('openai-secret') || process.env.OPENAI_SECRET || ''

    const context = github.context
    const prDescription = context.payload.pull_request?.body || ''
    const prNumber = context.payload.pull_request?.number ?? 0
    const repoFullName = context.payload.repository?.full_name || ''
    const runId = context.runId
    const workflowUrl = `https://github.com/${repoFullName}/actions/runs/${runId}`

    // Extract Jira ticket key from PR description
    const ticketKeyMatch = prDescription.match(/\[(\w+-\d+)\]:/)
    if (!ticketKeyMatch) {
      core.setFailed('No Jira ticket key found.')
      return
    }
    const ticketKey = ticketKeyMatch[1]

    // Fetch Jira ticket details
    const jiraApiUrl = `${jiraBaseUrl}/rest/api/2/issue/${ticketKey}`
    console.log('Fetching Jira ticket from:', jiraApiUrl)
    
    const jiraResponse = await fetch(jiraApiUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${jiraUser}:${jiraApiToken}`).toString('base64'),
        'Accept': 'application/json'
      }
    })
    
    const jiraData = await jiraResponse.json() as JiraResponse
    
    if (!jiraResponse.ok) {
      throw new Error(`Jira API error: ${jiraResponse.status} - ${JSON.stringify(jiraData)}`)
    }
    
    if (!jiraData.fields) {
      throw new Error('Unexpected Jira API response format - missing fields property')
    }
    
    const jiraDescription = jiraData.fields.description || ""

    // Compose prompt for LLM
    const prompt = createPrompt(prDescription, jiraDescription)

    const openAiClient = new OpenAI({
      apiKey: openaiApiKey,
    })

    const openaiData = await openAiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })

    if (!openaiData?.choices?.[0]?.message?.content) {
      throw new Error(`Unexpected OpenAI API response format: ${JSON.stringify(openaiData)}`)
    }

    console.log('OpenAI API request completed')

    const generatedChangelog = openaiData.choices[0].message.content.trim()
    console.log('Generated changelog:', generatedChangelog)

    // Initialize Octokit
    const octokit = github.getOctokit(token)
    console.log('Octokit initialized')

    const [repoOwner, repoName] = repoFullName.split('/')
    
    // Search for existing changelog comment
    const comments = await octokit.rest.issues.listComments({
      owner: repoOwner,
      repo: repoName,
      issue_number: prNumber,
    })

    const existingComment = comments.data.find(comment => 
      comment.body?.includes('<!-- automated-changelog -->')
    )

    if (existingComment) {
      // Update existing comment
      await octokit.rest.issues.updateComment({
        owner: repoOwner,
        repo: repoName,
        comment_id: existingComment.id,
        body: createChangelogComment(generatedChangelog, workflowUrl)
      })
      core.info(`Updated existing changelog comment for PR #${prNumber}`)
    } else {
      // Create new comment if none exists
      await octokit.rest.issues.createComment({
        owner: repoOwner,
        repo: repoName,
        issue_number: prNumber,
        body: createChangelogComment(generatedChangelog, workflowUrl)
      })
      core.info(`Created new changelog comment for PR #${prNumber}`)
    }

    core.info(`Changelog operation completed for PR #${prNumber}`)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Action failed: ${error.message}`)
    } else {
      core.setFailed('Action failed with unknown error')
    }
  }
}

run()