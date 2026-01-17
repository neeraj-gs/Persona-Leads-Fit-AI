# Throxy Persona Ranker - Complete Setup & Testing Guide

This guide provides step-by-step instructions to set up, run, and test all features of the Persona Ranker application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Running the Application](#running-the-application)
4. [Testing the Core Features](#testing-the-core-features)
5. [Testing Advanced Features](#testing-advanced-features)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **OpenAI API Key** - [Get one here](https://platform.openai.com/api-keys)

Verify your installation:
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

---

## Initial Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/neeraj-gs/Persona-Leads-Fit-AI.git
cd Persona-Leads-Fit-AI/persona-ranker
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="sk-your-actual-openai-api-key-here"
```

### Step 4: Initialize the Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init
```

### Step 5: Verify Setup

```bash
# Build the application to check for errors
npm run build
```

If the build succeeds, you're ready to run the application.

---

## Running the Application

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Mode

```bash
npm run build
npm start
```

---

## Testing the Core Features

### Feature 1: CSV Upload

1. Navigate to the **Upload** tab
2. You have two options:
   - **Drag and drop** a CSV file onto the upload area
   - **Click** to browse and select a CSV file

3. Use the provided `leads.csv` from the `/assets` folder, or create your own with these columns:
   ```csv
   accountName,leadFirstName,leadLastName,leadJobTitle,accountEmployeeRange,accountDomain,accountIndustry
   Acme Corp,John,Doe,VP of Sales,50-200,acme.com,Technology
   ```

4. **Expected Result**:
   - Preview shows the first few rows
   - Click "Upload X Leads" button
   - Success toast: "Successfully uploaded X leads"
   - Automatically switches to Ranking tab

### Feature 2: Run AI Ranking

1. Navigate to the **Ranking** tab
2. Select a prompt from the dropdown (default prompts are pre-loaded):
   - **Detailed Analysis** - Comprehensive analysis with detailed reasoning
   - **Concise Qualifier** - Quick yes/no qualification
   - **Cost Optimized** - Minimal tokens for cost efficiency

3. Optionally enter a custom name for the run
4. Click **Start Ranking**

5. **Expected Result**:
   - Progress indicator shows real-time updates
   - See "Processing X/Y leads" counter
   - Cost accumulates in real-time
   - Switches to Results tab when complete

### Feature 3: View Results

1. Navigate to the **Results** tab after ranking completes
2. View the statistics panel:
   - Total leads processed
   - Relevant leads identified
   - Total cost
   - Tokens used

3. View the results table:
   - Sortable by clicking column headers
   - Filter by company using the dropdown
   - Search by name

4. Click on any row to see detailed analysis:
   - Reasoning
   - Positive signals
   - Negative signals
   - Buyer type classification

### Feature 4: Export to CSV

1. In the **Ranking** tab, select a completed run
2. Click the **Export** dropdown
3. Choose:
   - **Export All** - Download all ranked leads
   - **Export Top 3 per Company** - Download only top 3 from each company

4. **Expected Result**: CSV file downloads with ranked leads

### Feature 5: Ranking History

1. In the **Ranking** tab, view the "Previous Runs" section
2. Click on any previous run to view its results
3. Delete runs by clicking the trash icon

---

## Testing Advanced Features

### Feature 6: A/B Prompt Testing

This feature allows you to compare different prompts against a ground truth evaluation set.

#### Step 1: Access A/B Testing

1. Navigate to the **Advanced** tab
2. Click on the **A/B Testing** sub-tab

#### Step 2: Create Test Prompts

1. In the **Prompt Library** tab (within A/B Testing), click **New Prompt**
2. Create at least 2 prompts with different strategies:

**Example Prompt 1 - Aggressive Qualifier**:
```
Name: Aggressive Qualifier
Description: Strict qualification criteria

System Prompt:
You are a lead qualification expert. Analyze the given contact and determine if they are relevant for a B2B sales tool.

Be STRICT in your qualification:
- Only mark as relevant if the title clearly indicates sales leadership
- Reject anyone not directly in sales
- Company size must be appropriate

Return JSON:
{
  "isRelevant": boolean,
  "relevanceScore": number (0-100),
  "reasoning": "brief explanation",
  "department": "sales|marketing|other",
  "seniority": "c_level|vp|director|manager|individual",
  "buyerType": "decision_maker|champion|influencer|not_relevant",
  "positiveSignals": ["array of positive indicators"],
  "negativeSignals": ["array of negative indicators"]
}
```

**Example Prompt 2 - Lenient Qualifier**:
```
Name: Lenient Qualifier
Description: More inclusive qualification criteria

System Prompt:
You are a lead qualification expert. Analyze the given contact and determine if they could be valuable for a B2B sales tool.

Be INCLUSIVE in your qualification:
- Consider adjacent roles (marketing, ops) that might influence sales
- Consider growth potential
- Give benefit of the doubt

Return JSON:
{
  "isRelevant": boolean,
  "relevanceScore": number (0-100),
  "reasoning": "brief explanation",
  "department": "sales|marketing|other",
  "seniority": "c_level|vp|director|manager|individual",
  "buyerType": "decision_maker|champion|influencer|not_relevant",
  "positiveSignals": ["array of positive indicators"],
  "negativeSignals": ["array of negative indicators"]
}
```

#### Step 3: Prepare Evaluation Data

Create or use the provided `eval_set.csv` with ground truth rankings:

```csv
name,company,title,employeeRange,rank
John Doe,Acme Corp,VP of Sales,50-200,1
Jane Smith,Acme Corp,Sales Manager,50-200,2
Bob Johnson,Acme Corp,HR Director,50-200,-
```

The `rank` column indicates:
- **1, 2, 3...** - Expected rank (1 is best)
- **-** - Not relevant (should be filtered out)

#### Step 4: Run A/B Test

1. Go to **Setup Test** tab
2. Click "Select Prompt A" and choose your first prompt
3. Click "Select Prompt B" and choose your second prompt
4. Upload your evaluation CSV
5. (Optional) Enter a test name
6. Click **Start A/B Test**

#### Step 5: View Results

1. Go to **Test History** tab
2. Click on a completed test to see:
   - Accuracy comparison
   - F1 scores
   - Cost comparison
   - Winner determination

### Feature 7: Multi-threading Visualization

This feature visualizes the recommended contact sequence within a company.

#### Step 1: Run a Ranking First

Complete a ranking run (Feature 2) so you have results to visualize.

#### Step 2: Access Visualization

1. Navigate to the **Advanced** tab
2. Click on the **Multi-threading** sub-tab

#### Step 3: Explore the Org Chart

1. Select a company from the dropdown
2. View the interactive org chart:
   - **Purple nodes** - Decision Makers
   - **Green nodes** - Champions
   - **Blue nodes** - Influencers
   - **Gray nodes** - Not Relevant

3. The **dashed green line** shows the recommended contact sequence

4. View the **Engagement Strategy** section below for:
   - Ordered list of recommended contacts
   - Buyer type and match percentage
   - AI reasoning for each contact

#### Step 4: Interactive Features

- **Zoom**: Scroll or pinch to zoom
- **Pan**: Click and drag to move
- **Fit View**: Use the controls in the bottom-left

---

## Complete Testing Workflow

Here's a recommended workflow to test all features:

### 1. Quick Test (5 minutes)

```bash
# Start the app
npm run dev

# In browser:
1. Upload leads.csv from /assets folder
2. Start ranking with default prompt
3. View results and export CSV
```

### 2. Full Feature Test (15 minutes)

```bash
# Start the app
npm run dev

# Test Core Features:
1. Upload leads (try drag-and-drop)
2. Run ranking with each of the 3 default prompts
3. Compare results across runs
4. Export top 3 per company

# Test Advanced Features:
5. Create 2 custom prompts with different strategies
6. Upload eval_set.csv and run A/B test
7. View A/B test results
8. View multi-threading visualization for each company
```

### 3. A/B Testing Deep Dive (20 minutes)

```bash
# In browser:
1. Go to Advanced > A/B Testing > Prompt Library
2. Create "Aggressive" prompt (strict criteria)
3. Create "Lenient" prompt (inclusive criteria)
4. Go to Setup Test
5. Select both prompts
6. Upload eval_set.csv
7. Run test
8. Analyze results:
   - Which prompt had higher accuracy?
   - Which was more cost-effective?
   - What was the F1 score difference?
```

---

## Troubleshooting

### Build Errors

**Error**: `prisma generate` fails
```bash
# Solution: Ensure you're using Prisma 5
npm install prisma@5 @prisma/client@5
npx prisma generate
```

**Error**: Database not found
```bash
# Solution: Run migrations
npx prisma migrate dev
```

### Runtime Errors

**Error**: OpenAI API key invalid
```bash
# Solution: Check .env file
# Ensure no quotes around the key if it starts with sk-
OPENAI_API_KEY=sk-your-key-here
```

**Error**: "Failed to fetch leads"
```bash
# Solution: Check database connection
npx prisma studio
# This opens a GUI to view your database
```

### Common Issues

**Issue**: Ranking takes too long
- This is normal for large datasets
- Each lead requires 2-3 API calls
- Consider using "Cost Optimized" prompt for testing

**Issue**: A/B test stuck on "running"
- Check browser console for errors
- Refresh the page and check Test History

**Issue**: Visualization shows empty chart
- Ensure you have completed a ranking run first
- Check that leads have company information

---

## API Documentation

### Leads API

```bash
# Upload leads
POST /api/leads
Content-Type: application/json
Body: { "leads": [...] }

# Get leads
GET /api/leads?page=1&pageSize=50

# Delete all leads
DELETE /api/leads
```

### Rankings API

```bash
# Start ranking
POST /api/rankings
Body: { "promptId": "optional", "name": "optional" }

# Get ranking results
GET /api/rankings/{runId}

# Stream progress (SSE)
GET /api/rankings/{runId}/stream

# Delete run
DELETE /api/rankings/{runId}
```

### A/B Tests API

```bash
# Start A/B test
POST /api/ab-tests
Body: {
  "promptAId": "...",
  "promptBId": "...",
  "evaluationData": [...],
  "name": "optional"
}

# Get test results
GET /api/ab-tests/{testId}
```

---

## Quick Reference

| Feature | Location | Status |
|---------|----------|--------|
| CSV Upload | Upload tab | ✅ Complete |
| AI Ranking | Ranking tab | ✅ Complete |
| Results Table | Results tab | ✅ Complete |
| Export CSV | Ranking tab | ✅ Complete |
| Real-time Progress | Ranking/Results | ✅ Complete |
| Cost Tracking | Statistics Panel | ✅ Complete |
| A/B Testing | Advanced > A/B Testing | ✅ Complete |
| Multi-threading | Advanced > Multi-threading | ✅ Complete |

---

## Need Help?

- Check the [README.md](./README.md) for architecture overview
- Review API routes in `src/app/api/`
- Check database schema in `prisma/schema.prisma`

---

*Generated for Throxy Technical Challenge*
