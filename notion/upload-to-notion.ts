import { Client } from '@notionhq/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

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



  private parseMarkdownToBlocks(markdown: string): any[] {
    const blocks: any[] = [];
    const lines = markdown.split('\n');
    let currentList: any[] = [];
    let inCodeBlock = false;
    let codeBlockContent = '';
    let codeBlockLanguage = '';
    let inTable = false;
    let tableRows: string[][] = [];
    let inBlockquote = false;
    let blockquoteContent = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Handle code blocks
      if (trimmedLine.startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          const codeContent = codeBlockContent.trim();
          // Split long code blocks into chunks of 2000 characters
          const codeChunks = this.chunkText(codeContent, 2000);
          
          for (const chunk of codeChunks) {
            blocks.push({
              object: 'block',
              type: 'code',
              code: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: chunk
                    }
                  }
                ],
                language: codeBlockLanguage || 'plain text'
              }
            });
          }
          
          inCodeBlock = false;
          codeBlockContent = '';
          codeBlockLanguage = '';
        } else {
          // Start of code block
          inCodeBlock = true;
          codeBlockLanguage = trimmedLine.slice(3).trim() || 'plain text';
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent += line + '\n';
        continue;
      }

      // Handle blockquotes
      if (trimmedLine.startsWith('>')) {
        if (!inBlockquote) {
          inBlockquote = true;
          blockquoteContent = '';
        }
        const text = trimmedLine.replace(/^>\s*/, '');
        blockquoteContent += text + '\n';
        continue;
      }

      // End blockquote if we were in one and this line doesn't start with >
      if (inBlockquote && !trimmedLine.startsWith('>')) {
        if (blockquoteContent.trim()) {
          const quoteContent = blockquoteContent.trim();
          const quoteChunks = this.chunkText(quoteContent, 2000);
          
          for (const chunk of quoteChunks) {
            blocks.push({
              object: 'block',
              type: 'quote',
              quote: {
                rich_text: this.parseInlineFormatting(chunk)
              }
            });
          }
        }
        inBlockquote = false;
        blockquoteContent = '';
      }

      // Handle tables
      if (trimmedLine.includes('|') && trimmedLine.trim().startsWith('|') && trimmedLine.trim().endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        
        // Parse table row
        const cells = trimmedLine.split('|').map(cell => cell.trim()).filter(cell => cell);
        tableRows.push(cells);
        
        // Check if next line is table separator (contains only |, -, and spaces)
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        if (nextLine.match(/^[\s|\-:]+$/)) {
          // Skip the separator line
          i++;
          continue;
        }
        
        // If next line is not a table row, process the table
        if (i + 1 >= lines.length || !lines[i + 1].includes('|') || !lines[i + 1].trim().startsWith('|')) {
          if (tableRows.length > 1) { // Need at least header and one data row
            // Create table in Notion
            const tableBlock = this.createTableBlock(tableRows);
            if (tableBlock) {
              blocks.push(tableBlock);
            }
          }
          inTable = false;
          tableRows = [];
        }
        continue;
      }

      // Handle headers
      if (trimmedLine.startsWith('#')) {
        const match = trimmedLine.match(/^#+/);
        if (match) {
          const level = match[0].length;
          const text = trimmedLine.replace(/^#+\s*/, '');
          
          if (text.trim()) {
            const headerType = level === 1 ? 'heading_1' : level === 2 ? 'heading_2' : 'heading_3';
            blocks.push({
              object: 'block',
              type: headerType,
              [headerType]: {
                rich_text: this.parseInlineFormatting(text)
              }
            });
          }
        }
        continue;
      }

      // Handle lists
      if (trimmedLine.match(/^[-*+]\s/)) {
        const text = trimmedLine.replace(/^[-*+]\s/, '');
        if (text.trim()) {
          currentList.push({
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: this.parseInlineFormatting(text)
            }
          });
        }
        continue;
      }

      // Handle numbered lists
      if (trimmedLine.match(/^\d+\.\s/)) {
        const text = trimmedLine.replace(/^\d+\.\s/, '');
        if (text.trim()) {
          currentList.push({
            object: 'block',
            type: 'numbered_list_item',
            numbered_list_item: {
              rich_text: this.parseInlineFormatting(text)
            }
          });
        }
        continue;
      }

      // Handle horizontal rules
      if (trimmedLine.match(/^[-*_]{3,}$/)) {
        blocks.push({
          object: 'block',
          type: 'divider',
          divider: {}
        });
        continue;
      }

      // Handle empty lines
      if (trimmedLine === '') {
        // If we have accumulated list items, add them to blocks
        if (currentList.length > 0) {
          blocks.push(...currentList);
          currentList = [];
        }
        continue;
      }

      // Handle regular paragraphs
      if (trimmedLine) {
        // If we have accumulated list items, add them to blocks first
        if (currentList.length > 0) {
          blocks.push(...currentList);
          currentList = [];
        }

        // Split long paragraphs into chunks
        const paragraphChunks = this.chunkText(trimmedLine, 2000);
        
        for (const chunk of paragraphChunks) {
          blocks.push({
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: this.parseInlineFormatting(chunk)
            }
          });
        }
      }
    }

    // Add any remaining list items
    if (currentList.length > 0) {
      blocks.push(...currentList);
    }

    // Handle final blockquote if still open
    if (inBlockquote && blockquoteContent.trim()) {
      const quoteContent = blockquoteContent.trim();
      const quoteChunks = this.chunkText(quoteContent, 2000);
      
      for (const chunk of quoteChunks) {
        blocks.push({
          object: 'block',
          type: 'quote',
          quote: {
            rich_text: this.parseInlineFormatting(chunk)
          }
        });
      }
    }

    return blocks;
  }

  private chunkText(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    let currentChunk = '';
    const words = text.split(' ');

    for (const word of words) {
      if ((currentChunk + ' ' + word).length <= maxLength) {
        currentChunk += (currentChunk ? ' ' : '') + word;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = word;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  private parseInlineFormatting(text: string): any[] {
    const richText: any[] = [];
    
    // Handle inline code
    if (text.includes('`')) {
      const parts = text.split('`');
      
      for (let j = 0; j < parts.length; j++) {
        if (j % 2 === 0) {
          // Regular text - handle other formatting
          if (parts[j]) {
            richText.push(...this.parseTextFormatting(parts[j]));
          }
        } else {
          // Inline code
          if (parts[j]) {
            richText.push({
              type: 'text',
              text: {
                content: parts[j]
              },
              annotations: {
                code: true
              }
            });
          }
        }
      }
    } else {
      // No inline code, just parse other formatting
      richText.push(...this.parseTextFormatting(text));
    }

    return richText;
  }

  private parseTextFormatting(text: string): any[] {
    const richText: any[] = [];
    let currentText = text;
    
    // Handle bold text (**text** or __text__)
    const boldRegex = /\*\*(.*?)\*\*|__(.*?)__/g;
    let boldMatch;
    let lastIndex = 0;
    
    while ((boldMatch = boldRegex.exec(text)) !== null) {
      // Add text before the bold part
      if (boldMatch.index > lastIndex) {
        const beforeText = text.substring(lastIndex, boldMatch.index);
        if (beforeText) {
          richText.push({
            type: 'text',
            text: { content: beforeText }
          });
        }
      }
      
      // Add bold text
      const boldContent = boldMatch[1] || boldMatch[2];
      richText.push({
        type: 'text',
        text: { content: boldContent },
        annotations: { bold: true }
      });
      
      lastIndex = boldMatch.index + boldMatch[0].length;
    }
    
    // Add remaining text after last match
    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        richText.push({
          type: 'text',
          text: { content: remainingText }
        });
      }
    }
    
    // If no formatting found, return simple text
    if (richText.length === 0) {
      richText.push({
        type: 'text',
        text: { content: text }
      });
    }
    
    return richText;
  }

  private createTableBlock(rows: string[][]): any {
    if (rows.length < 2) return null;
    
    // Create table with header and data rows
    const tableBlock: any = {
      object: 'block',
      type: 'table',
      table: {
        table_width: rows[0].length,
        has_column_header: true,
        has_row_header: false,
        children: []
      }
    };
    
    // Add rows to table
    for (const row of rows) {
      const tableRow = {
        object: 'block',
        type: 'table_row',
        table_row: {
          cells: row.map(cell => [{
            type: 'text',
            text: { content: cell.trim() }
          }])
        }
      };
      tableBlock.table.children.push(tableRow);
    }
    
    return tableBlock;
  }

  private async uploadDocument(docPath: string, projectPageId: string): Promise<void> {
    const fullPath = path.join(this.projectRoot, docPath);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`Document not found: ${docPath}`);
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const docName = path.basename(docPath, path.extname(docPath));
    
    console.log(`Uploading document: ${docName}`);

    try {
      // Extract the first level heading from the markdown content
      const title = this.extractFirstHeading(content) || docName;
      console.log(`Using title: "${title}"`);
      
      // Remove the first level heading from the content to avoid duplication
      const contentWithoutTitle = this.removeFirstHeading(content);
      
      // Parse markdown content into Notion blocks
      const blocks = this.parseMarkdownToBlocks(contentWithoutTitle);
      
      if (blocks.length === 0) {
        console.warn(`No content blocks generated for: ${docName}`);
        return;
      }

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
                  content: title
                }
              }
            ]
          }
        }
      });

      // Split blocks into chunks of 100 (Notion API limit)
      const blockChunks = this.chunkBlocks(blocks, 100);
      
      // Upload blocks in chunks
      for (const chunk of blockChunks) {
        await this.notion.blocks.children.append({
          block_id: response.id,
          children: chunk
        });
      }

      // Construct the URL from the page ID since response.url doesn't exist in newer API versions
      const pageUrl = `https://notion.so/${response.id.replace(/-/g, '')}`;
      console.log(`✓ Successfully uploaded: ${title} (${pageUrl})`);
    } catch (error) {
      console.error(`✗ Failed to upload ${docName}:`, error);
    }
  }

  private extractFirstHeading(markdown: string): string | null {
    const lines = markdown.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Look for first level heading (# heading)
      if (trimmedLine.startsWith('# ')) {
        const heading = trimmedLine.replace(/^#\s+/, '').trim();
        return heading || null;
      }
    }
    
    return null;
  }

  private removeFirstHeading(markdown: string): string {
    const lines = markdown.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      // Look for first level heading (# heading)
      if (trimmedLine.startsWith('# ')) {
        // Remove this line and return the rest
        lines.splice(i, 1);
        return lines.join('\n');
      }
    }
    
    // If no heading found, return original content
    return markdown;
  }

  private chunkBlocks(blocks: any[], maxBlocks: number): any[][] {
    const chunks: any[][] = [];
    for (let i = 0; i < blocks.length; i += maxBlocks) {
      chunks.push(blocks.slice(i, i + maxBlocks));
    }
    return chunks;
  }

  public async uploadAllDocuments(): Promise<void> {
    try {
      console.log('Starting Notion upload process...');
      console.log(`Project: ${this.projectMetadata.project_name}`);
      console.log(`Documents to upload: ${this.projectMetadata.notion_docs.join(', ')}`);

      // Verify the parent page exists
      try {
        await this.notion.pages.retrieve({ page_id: this.projectMetadata.notion_parent_page_id });
        console.log(`Using parent page ID: ${this.projectMetadata.notion_parent_page_id}`);
      } catch (error) {
        throw new Error(`Parent page ID ${this.projectMetadata.notion_parent_page_id} not found or inaccessible`);
      }

      for (const doc of this.projectMetadata.notion_docs) {
        await this.uploadDocument(doc, this.projectMetadata.notion_parent_page_id);
      }

      console.log('Upload process completed!');
    } catch (error) {
      console.error('Upload process failed:', error);
      process.exit(1);
    }
  }
}

async function main() {
  // Load environment variables from .env file in project root
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
  
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    console.error('NOTION_API_KEY not found in .env file');
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
