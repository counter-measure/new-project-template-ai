# Quick Setup Guide

## 1. Get Your Linear API Key
- Go to https://linear.app/settings/api
- Create a new API key
- Copy the key

## 2. Set Up Environment
```bash
# Navigate to linear directory
cd linear

# Copy the environment template
cp env.example .env

# Edit .env and add your API key
# LINEAR_API_KEY=your_api_key_here
```

## 3. Run the Uploader
```bash
# Option 1: Use the shell script (recommended)
cd linear
./upload-tasks.sh

# Option 2: Run directly with npm
cd linear
npm run dev
```

## What the script does:
- ✅ Reads tasks from `../tasks.json`
- ✅ Maps project name from `../project_metadata.json`
- ✅ Creates Linear issues with proper priority/estimate mapping
- ✅ Adds epic names as labels
- ✅ Includes acceptance criteria and definition of done
- ✅ Updates existing issues instead of creating duplicates
- ✅ Creates projects and labels automatically

## Field Mappings:
- **Priority**: P0→High, P1→Medium, P2→Low, P3→No Priority
- **Estimate**: 1hr→XS, 0.5day→S, 1day→M, 2day→L, 3day→XL, 3-5day→XXL
- **Labels**: Epic names become labels
- **Description**: Task description + Acceptance Criteria + Definition of Done

## Troubleshooting:
- If team not found: Check `../project_metadata.json` teams or set `DEFAULT_TEAM` in `.env`
- If API key error: Make sure `.env` file exists with `LINEAR_API_KEY`
- If permission errors: Ensure API key has create/update permissions
