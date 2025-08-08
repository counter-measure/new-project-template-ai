import { LinearClient } from '@linear/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from parent directory
dotenv.config({ path: path.join(process.cwd(), '..', '.env') });

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  effort: string;
  dependencies: string[];
  acceptanceCriteria: string[];
  definitionOfDone: string[];
}

interface Epic {
  epic: string;
  tasks: Task[];
}

interface TasksData {
  project: string;
  version: string;
  lastUpdated: string;
  description: string;
  epics: Epic[];
}

interface ProjectMetadata {
  project_name: string;
  teams: string[];
}

interface LinearIssue {
  id?: string;
  title: string;
  description: string;
  priority: number;
  estimate?: number;
  labels: string[];
  teamId: string;
  projectId?: string;
}

class LinearTaskUploader {
  private client: LinearClient;
  private teams: Map<string, string> = new Map();
  private projects: Map<string, string> = new Map();
  private labels: Map<string, string> = new Map();
  private existingIssues: Map<string, string> = new Map();

  constructor() {
    const apiKey = process.env.LINEAR_API_KEY;
    if (!apiKey) {
      throw new Error('LINEAR_API_KEY environment variable is required');
    }
    this.client = new LinearClient({ apiKey });
  }

  private async initialize() {
    console.log('Initializing Linear client...');
    
    try {
      // Load teams
      const teams = await this.client.teams();
      for (const team of teams.nodes) {
        this.teams.set(team.name, team.id);
      }

      // Load projects (simplified query)
      const projects = await this.client.projects();
      for (const project of projects.nodes) {
        this.projects.set(project.name, project.id);
      }

      // Load existing labels
      const labels = await this.client.issueLabels();
      for (const label of labels.nodes) {
        this.labels.set(label.name, label.id);
      }

      console.log(`Loaded ${this.teams.size} teams, ${this.projects.size} projects, ${this.labels.size} labels`);
    } catch (error) {
      console.error('Error during initialization:', error);
      throw error;
    }
  }

  private getPriorityMapping(priority: string): number {
    const mapping: { [key: string]: number } = {
      'P0': 2, // High
      'P1': 3, // Medium
      'P2': 4, // Low
      'P3': 0  // No Priority
    };
    return mapping[priority] || 0;
  }

  private getEstimateMapping(effort: string): number | undefined {
    // Parse effort string like "2 days", "1 hr", "3 to 5 day"
    const effortLower = effort.toLowerCase();
    
    if (effortLower.includes('hr')) {
      return 1; // XS
    } else if (effortLower.includes('0.5 day')) {
      return 2; // S
    } else if (effortLower.includes('1 day')) {
      return 3; // M
    } else if (effortLower.includes('2 day')) {
      return 4; // L
    } else if (effortLower.includes('3 day')) {
      return 5; // XL
    } else if (effortLower.includes('3 to 5 day') || effortLower.includes('4 day') || effortLower.includes('5 day')) {
      return 6; // XXL
    }
    
    return undefined;
  }

  private async createLabelIfNotExists(labelName: string): Promise<string> {
    if (this.labels.has(labelName)) {
      return this.labels.get(labelName)!;
    }

    console.log(`Creating label: ${labelName}`);
    const label = await this.client.createIssueLabel({
      name: labelName,
      color: '#000000' // Default color, can be customized
    });
    
    const labelData = await label.issueLabel;
    if (!labelData) {
      throw new Error(`Failed to create label: ${labelName}`);
    }
    
    this.labels.set(labelName, labelData.id);
    return labelData.id;
  }

  private async findOrCreateProject(projectName: string, teamId: string): Promise<string> {
    if (this.projects.has(projectName)) {
      return this.projects.get(projectName)!;
    }

    console.log(`Creating project: ${projectName}`);
    const project = await this.client.createProject({
      name: projectName,
      teamIds: [teamId]
    });
    
    const projectData = await project.project;
    if (!projectData) {
      throw new Error(`Failed to create project: ${projectName}`);
    }
    
    this.projects.set(projectName, projectData.id);
    return projectData.id;
  }

  private async findExistingIssue(title: string, teamId: string): Promise<string | null> {
    const issues = await this.client.issues({
      filter: {
        title: { contains: title },
        team: { id: { eq: teamId } }
      }
    });
    
    return issues.nodes.length > 0 ? issues.nodes[0].id : null;
  }

  private formatDescription(task: Task): string {
    let description = task.description + '\n\n';
    
    if (task.acceptanceCriteria.length > 0) {
      description += '**Acceptance Criteria:**\n';
      task.acceptanceCriteria.forEach(criteria => {
        description += `- ${criteria}\n`;
      });
      description += '\n';
    }
    
    if (task.definitionOfDone.length > 0) {
      description += '**Definition of Done:**\n';
      task.definitionOfDone.forEach(done => {
        description += `- ${done}\n`;
      });
    }
    
    return description;
  }

  private async createLinearIssue(task: Task, epic: string, teamId: string, projectId: string): Promise<void> {
    const linearIssue: LinearIssue = {
      title: task.title,
      description: this.formatDescription(task),
      priority: this.getPriorityMapping(task.priority),
      estimate: this.getEstimateMapping(task.effort),
      labels: [epic],
      teamId: teamId,
      projectId: projectId
    };

    // Check if issue already exists
    const existingIssueId = await this.findExistingIssue(task.title, teamId);
    
    if (existingIssueId) {
      console.log(`Updating existing issue: ${task.title}`);
      await this.client.updateIssue(existingIssueId, {
        title: linearIssue.title,
        description: linearIssue.description,
        priority: linearIssue.priority,
        estimate: linearIssue.estimate,
        projectId: linearIssue.projectId
      });
      
      // Update labels
      const labelIds = await Promise.all(
        linearIssue.labels.map(label => this.createLabelIfNotExists(label))
      );
      await this.client.updateIssue(existingIssueId, {
        labelIds: labelIds
      });
    } else {
      console.log(`Creating new issue: ${task.title}`);
      const labelIds = await Promise.all(
        linearIssue.labels.map(label => this.createLabelIfNotExists(label))
      );
      
      await this.client.createIssue({
        title: linearIssue.title,
        description: linearIssue.description,
        priority: linearIssue.priority,
        estimate: linearIssue.estimate,
        teamId: linearIssue.teamId,
        projectId: linearIssue.projectId,
        labelIds: labelIds
      });
    }
  }

  public async uploadTasks(tasksData: TasksData, projectMetadata: ProjectMetadata): Promise<void> {
    await this.initialize();

    // Find team
    const teamName = projectMetadata.teams[0] || process.env.DEFAULT_TEAM || 'Product';
    const teamId = this.teams.get(teamName);
    
    if (!teamId) {
      throw new Error(`Team "${teamName}" not found in Linear. Available teams: ${Array.from(this.teams.keys()).join(', ')}`);
    }

    // Find or create project
    const projectId = await this.findOrCreateProject(projectMetadata.project_name, teamId);

    console.log(`Uploading tasks to team: ${teamName}, project: ${projectMetadata.project_name}`);

    // Process each epic and its tasks
    for (const epicData of tasksData.epics) {
      console.log(`\nProcessing epic: ${epicData.epic}`);
      
      for (const task of epicData.tasks) {
        try {
          await this.createLinearIssue(task, epicData.epic, teamId, projectId);
        } catch (error) {
          console.error(`Error processing task ${task.id}: ${error}`);
        }
      }
    }

    console.log('\nTask upload completed!');
  }
}

async function main() {
  try {
    // Read tasks.json from parent directory
    const tasksPath = path.join(process.cwd(), '..', 'tasks.json');
    const tasksData: TasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));

    // Read project_metadata.json from parent directory
    const metadataPath = path.join(process.cwd(), '..', 'project_metadata.json');
    const projectMetadata: ProjectMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

    const uploader = new LinearTaskUploader();
    await uploader.uploadTasks(tasksData, projectMetadata);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
