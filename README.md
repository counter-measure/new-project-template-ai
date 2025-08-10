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
Use the automated Linear uploader script to create Linear issues from your `tasks.json`:

1. **Set up the uploader** - Navigate to the `linear/` directory and configure your API key
2. **Run the script** - Execute `./upload-tasks.sh` from the project root
3. **Automatic mapping** - The script automatically:
   - Maps project name from `project_metadata.json`
   - Assigns to the first team in `project_metadata.json` or uses `DEFAULT_TEAM`
   - Creates issues with proper priority mapping:
     - P0 = High (2)
     - P1 = Medium (3)
     - P2 = Low (4)
     - P3 = No Priority (0)
   - Sets estimates based on effort:
     - 1 hr = XS (1)
     - 0.5 day = S (2)
     - 1 day = M (3)
     - 2 day = L (4)
     - 3 day = XL (5)
     - 3 to 5 day = XXL (6)
   - Creates labels from epic names
   - Includes acceptance criteria and definition of done

### Notion Integration
After all documents have been created and reviewed, use the automated Notion uploader script to create Notion pages from your project documentation:

1. **Get your Notion Parent Page ID**:
   - Navigate to the Notion page where you want to create your project
   - Copy the page URL from your browser
   - Extract the page ID from the URL:
     - **Standard Notion URLs**: `https://www.notion.so/workspace-name/Page-Title-24b24f9af453800fb948c7f39ca6f6ce`
     - **Page ID**: The last 32 characters after the final hyphen (`24b24f9af453800fb948c7f39ca6f6ce`)
     - **Shared URLs**: `https://www.notion.so/Page-Title-24b24f9af453800fb948c7f39ca6f6ce?v=...`
   - Update `project_metadata.json` with your `notion_parent_page_id`

2. **Set up the uploader**:
   - Navigate to the `notion/` directory
   - Copy `env.example` to `.env` and add your Notion integration token
   - Install dependencies: `npm install`

3. **Run the script** - Execute `./upload-notion.sh` from the project root

4. **Automatic page creation** - The script automatically:
   - Creates a main project page with the project title
   - Uploads all generated documentation (`prd.md`, `user_stories.md`, `tech_design.md`, etc.)
   - Organizes content with proper Notion formatting and structure
   - Creates a hierarchical page structure for easy navigation

## File Structure

- `overview.md` - Project concept and goals
- `main.md` - Main workflow instructions for AI
- `project_metadata.json` - Project configuration
- `prd.md` - Product Requirements Document (generated)
- `user_stories.md` - User Stories (generated)
- `tech_design.md` - Technical Design (generated)
- `tech_requirements.md` - Technical Requirements (generated)
- `ui_design.md` - UI Design (generated, if applicable)
- `tasks.json` - Prioritized task list (generated)
- `linear/` - Linear uploader script and configuration
- `notion/` - Notion uploader script and configuration

## Best Practices

1. **Start with a Clear Overview** - Write a comprehensive `overview.md` that clearly defines your project goals and approach
2. **Iterate on Documentation** - Review and refine each generated document before proceeding to the next
3. **Validate Tasks** - Ensure the generated tasks accurately reflect your project requirements
4. **Configure Linear Uploader** - Set up your Linear API key and team configuration before running the uploader
5. **Configure Notion Integration** - Set up your Notion integration token and parent page ID before uploading documentation
6. **Maintain Consistency** - Keep all documentation and tasks aligned with your project vision

## Getting Help

If you encounter issues or need assistance:
1. Review the generated documentation for completeness
2. Check that your Linear API key is properly configured in `.env`
3. Check that your Notion integration token is properly configured in `notion/.env`
4. Ensure your `project_metadata.json` contains accurate information, including the correct `notion_parent_page_id`
5. Verify that your `overview.md` provides sufficient context for AI generation
6. Check the `linear/README-linear-uploader.md` for detailed Linear uploader instructions
7. Verify that your Notion integration has access to the parent page specified in `project_metadata.json`

This template provides a comprehensive foundation for AI-assisted project development, from initial concept to detailed task management, Linear integration, and Notion documentation hosting.
