import { Client } from '@notionhq/client';
import * as fs from 'fs';
import * as path from 'path';

interface ProjectMetadata {
  project_name: string;
  teams: string[];
  notion_parent_page_id: string;
  notion_docs: string[];
}

interface NotionPage {
  id: string;
  title: string;
  url: string;
}

class NotionUploader {
  private notion: Client;
  private projectMetadata: ProjectMetadata;
  private projectRoot: string;

  constructor(apiKey: string, projectRoot: string) {
    this.notion = new Client({ auth: apiKey });
    this.projectRoot = projectRoot;
    this.projectMetadata = this.loadProjectMetadata();
  }

  private loadProjectMetadata(): ProjectMetadata {
    const metadataPath = path.join(this.projectRoot, 'project_metadata.json');
    const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
    return JSON.parse(metadataContent);
  }

  private async findOrCreateProjectPage(): Promise<string> {
    const projectName = this.projectMetadata.project_name;
    
    // Verify the parent page exists
    try {
      await this.notion.pages.retrieve({ page_id: this.projectMetadata.notion_parent_page_id });
      console.log(`Using specified parent page ID: ${this.projectMetadata.notion_parent_page_id}`);
    } catch (error) {
      throw new Error(`Parent page ID ${this.projectMetadata.notion_parent_page_id} not found or inaccessible`);
    }
    
    // Search for existing project page under the specified parent
    const searchResponse = await this.notion.search({
      query: projectName,
      filter: {
        property: 'object',
        value: 'page'
      }
    });

    // If project page exists, return its ID
    for (const page of searchResponse.results) {
      if (page.object === 'page' && 'properties' in page) {
        const titleProperty = page.properties.title || page.properties.Name;
        if (titleProperty && 'title' in titleProperty) {
          const title = titleProperty.title[0]?.plain_text;
          if (title === projectName) {
            console.log(`Found existing project page: ${projectName}`);
            return page.id;
          }
        }
      }
    }

    // Create new project page under the specified parent
    console.log(`Creating new project page: ${projectName} under specified parent`);
    const response = await this.notion.pages.create({
      parent: {
        type: 'page_id',
        page_id: this.projectMetadata.notion_parent_page_id
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: projectName
              }
            }
          ]
        }
      }
    });

    return response.id;
  }

  private async getProjectsDatabaseId(): Promise<string> {
    // Search for projects database
    const searchResponse = await this.notion.search({
      query: 'Projects',
      filter: {
        property: 'object',
        value: 'database'
      }
    });

    if (searchResponse.results.length > 0) {
      return searchResponse.results[0].id;
    }

    // If no projects database found, create one
    console.log('Creating new projects database');
    const response = await this.notion.databases.create({
      parent: {
        type: 'page_id',
        page_id: await this.getRootPageId()
      },
      title: [
        {
          text: {
            content: 'Projects'
          }
        }
      ],
      properties: {
        title: {
          title: {}
        },
        'Project Name': {
          title: {}
        },
        'Created Date': {
          date: {}
        }
      }
    });

    return response.id;
  }

  private async getRootPageId(): Promise<string> {
    // Get the first page from the user's workspace
    const searchResponse = await this.notion.search({
      filter: {
        property: 'object',
        value: 'page'
      },
      page_size: 1
    });

    if (searchResponse.results.length > 0) {
      return searchResponse.results[0].id;
    }

    throw new Error('No pages found in workspace');
  }

  private async uploadDocument(docPath: string, projectPageId: string): Promise<void> {
    const fullPath = path.join(this.projectRoot, 'notion', docPath);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`Document not found: ${docPath}`);
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const docName = path.basename(docPath, path.extname(docPath));
    
    console.log(`Uploading document: ${docName}`);

    try {
      // Create a new page for the document under the project page
      const response = await this.notion.pages.create({
        parent: {
          type: 'page_id',
          page_id: projectPageId
        },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: docName
                }
              }
            ]
          }
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: content
                  }
                }
              ]
            }
          }
        ]
      });

      console.log(`✓ Successfully uploaded: ${docName} (${response.url})`);
    } catch (error) {
      console.error(`✗ Failed to upload ${docName}:`, error);
    }
  }

  public async uploadAllDocuments(): Promise<void> {
    try {
      console.log('Starting Notion upload process...');
      console.log(`Project: ${this.projectMetadata.project_name}`);
      console.log(`Documents to upload: ${this.projectMetadata.notion_docs.join(', ')}`);

      const projectPageId = await this.findOrCreateProjectPage();
      console.log(`Project page ID: ${projectPageId}`);

      for (const doc of this.projectMetadata.notion_docs) {
        await this.uploadDocument(doc, projectPageId);
      }

      console.log('Upload process completed!');
    } catch (error) {
      console.error('Upload process failed:', error);
      process.exit(1);
    }
  }
}

async function main() {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    console.error('NOTION_API_KEY environment variable is required');
    process.exit(1);
  }

  const projectRoot = process.cwd();
  const uploader = new NotionUploader(apiKey, projectRoot);
  await uploader.uploadAllDocuments();
}

if (require.main === module) {
  main().catch(console.error);
}

export { NotionUploader };
