# New Project Template AI

This repository provides a structured template for creating new projects with AI assistance. It includes prompts and workflows to generate comprehensive project documentation, task management, and Linear integration.

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd new-project-template-ai
```

### 2. Rename the Project
Change the repository name and update any references to match your new project name.

### 3. Update Project Metadata
Edit the `project_metadata.json` file with your project details:
- Project title
- Teams that will implement the project
- Any other relevant metadata

### 4. Define Your Project Concept
Write your project concept and goals in `overview.md`. This file serves as the foundation for all subsequent documentation generation.

Example structure:
```markdown
# Goal
Brief description of what you want to achieve

# Proposed Solution
Detailed explanation of your approach

## User Flow
Step-by-step user journey

## Technical Approach
Implementation details and algorithms
```

### 5. Generate Project Documentation
Use Cursor or Claude Code to execute the workflow defined in `main.md`. This will:

1. **Generate Product Requirements Document (PRD)** - `prd.md`
2. **Create User Stories** - `user_stories.md`
3. **Develop Technical Design** - `tech_design.md`
4. **Define Technical Requirements** - `tech_requirements.md`
5. **Create UI Design** (if applicable) - `ui_design.md`
6. **Generate Prioritized Task List** - `tasks.json`

## Workflow Details

### Documentation Generation Process
The AI will follow this sequence for each document:
1. Read `overview.md` and all other markdown files
2. Create the specified document
3. Critique the document and suggest improvements
4. Make the suggested updates
5. Allow for user review and changes

### Task Management
The system generates a `tasks.json` file with the following structure:
```json
{
    "project": "Project name",
    "version": "1.0",
    "lastUpdated": "2025-01-27",
    "description": "Prioritized tasks derived from prd.md for project_name",
    "epics": [
        {
            "epic": "epic name",
            "tasks": [
                {
                    "id": "task id",
                    "title": "title",
                    "description": "Task description",
                    "priority": "P0 to P3",
                    "effort": "N days",
                    "dependencies": ["task id"],
                    "acceptanceCriteria": [
                        "criteria 1",
                        "criteria 2"
                    ],
                    "definitionOfDone": [
                        "definition 1",
                        "definition 2"
                    ]
                }
            ]
        }
    ]
}
```

### Linear Integration
Use the `linear-tasks-prompt.md` file to create Linear issues from your `tasks.json`:

1. **Connect to Linear MCP** - Use the Linear MCP to interact with your Linear workspace
2. **Get Project ID** - Retrieve the Linear Project ID for your project
3. **Assign to Engineering Team** - All issues will be assigned to the "Engineering" team
4. **Create Issues** - Generate Linear issues for each task in `tasks.json`
5. **Set Priorities** - Map task priorities:
   - P0 = High (2)
   - P1 = Medium (3)
   - P2 = Low (4)
   - P3 = No Priority (0)
6. **Set Estimates** - Map effort to estimates:
   - 1 hr = XS (1)
   - 0.5 day = S (2)
   - 1 day = M (3)
   - 2 day = L (4)
   - 3 day = XL (5)
   - 3 to 5 day = XXL (6)
   - >5 day = XXXL (7)

## File Structure

- `overview.md` - Project concept and goals
- `main.md` - Main workflow instructions for AI
- `linear-tasks-prompt.md` - Linear integration instructions
- `project_metadata.json` - Project configuration
- `prd.md` - Product Requirements Document (generated)
- `user_stories.md` - User Stories (generated)
- `tech_design.md` - Technical Design (generated)
- `tech_requirements.md` - Technical Requirements (generated)
- `ui_design.md` - UI Design (generated, if applicable)
- `tasks.json` - Prioritized task list (generated)

## Best Practices

1. **Start with a Clear Overview** - Write a comprehensive `overview.md` that clearly defines your project goals and approach
2. **Iterate on Documentation** - Review and refine each generated document before proceeding to the next
3. **Validate Tasks** - Ensure the generated tasks accurately reflect your project requirements
4. **Customize Linear Setup** - Adjust team assignments and project settings in Linear as needed
5. **Maintain Consistency** - Keep all documentation and tasks aligned with your project vision

## Getting Help

If you encounter issues or need assistance:
1. Review the generated documentation for completeness
2. Check that all Linear integrations are properly configured
3. Ensure your `project_metadata.json` contains accurate information
4. Verify that your `overview.md` provides sufficient context for AI generation

This template provides a comprehensive foundation for AI-assisted project development, from initial concept to detailed task management and Linear integration.
