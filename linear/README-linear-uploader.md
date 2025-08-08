# Linear Task Uploader

This TypeScript script uploads tasks from `tasks.json` to Linear as issues. It can create new issues or update existing ones.

## Setup

1. **Install dependencies:**
   ```bash
   cd linear
   npm install
   ```

2. **Set up environment variables:**
   - Copy `env.example` to `.env`
   - Add your Linear API key to `.env`:
     ```
     LINEAR_API_KEY=your_linear_api_key_here
     DEFAULT_TEAM=Product
     ```

3. **Get your Linear API key:**
   - Go to https://linear.app/settings/api
   - Create a new API key
   - Copy the key to your `.env` file

## Usage

### First time upload (creates new issues):
```bash
cd linear
npm run dev
```

### Update existing issues:
```bash
cd linear
npm run dev
```
The script will automatically detect existing issues by title and update them instead of creating duplicates.

## How it works

The script maps your task data to Linear issues as follows:

### Field Mapping:
- **Project**: Uses `project_name` from `project_metadata.json`
- **Team**: Uses first team from `project_metadata.json` or `DEFAULT_TEAM` env var
- **Title**: Direct mapping from task title
- **Labels**: Epic names become labels (e.g., "Core Bot Infrastructure")
- **Description**: Task description + Acceptance Criteria + Definition of Done
- **Priority**: 
  - P0 → High (2)
  - P1 → Medium (3) 
  - P2 → Low (4)
  - P3 → No Priority (0)
- **Estimate**:
  - 1 hr → XS (1)
  - 0.5 day → S (2)
  - 1 day → M (3)
  - 2 day → L (4)
  - 3 day → XL (5)
  - 3-5 day → XXL (6)

### Features:
- ✅ Creates projects automatically if they don't exist
- ✅ Creates labels automatically for epics
- ✅ Updates existing issues instead of creating duplicates
- ✅ Handles errors gracefully
- ✅ Provides detailed logging

## File Structure

```
├── linear/
│   ├── src/
│   │   └── upload-tasks.ts    # Main script
│   ├── package.json           # Dependencies
│   ├── tsconfig.json          # TypeScript config
│   ├── env.example           # Environment template
│   ├── upload-tasks.sh       # Easy run script
│   └── README-linear-uploader.md
├── tasks.json                 # Your task data
└── project_metadata.json      # Project configuration
```

## Troubleshooting

### Common Issues:

1. **"Team not found" error:**
   - Check that the team name in `project_metadata.json` exists in Linear
   - Or set `DEFAULT_TEAM` in your `.env` file

2. **"LINEAR_API_KEY required" error:**
   - Make sure you've created a `.env` file with your API key

3. **Permission errors:**
   - Ensure your Linear API key has permission to create issues, projects, and labels

4. **Build errors:**
   - Run `npm install` to install dependencies
   - Make sure TypeScript is installed globally or run `npx tsc` to compile

## Development

To modify the script:
1. Edit `linear/src/upload-tasks.ts`
2. Run `npm run dev` to test changes
3. Run `npm run build` to compile for production

## Notes

- The script is idempotent - you can run it multiple times safely
- Existing issues are detected by title matching
- All epics become labels automatically
- The script creates projects and labels as needed
