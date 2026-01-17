-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "account_name" TEXT NOT NULL,
    "lead_first_name" TEXT,
    "lead_last_name" TEXT,
    "lead_job_title" TEXT,
    "account_domain" TEXT,
    "account_employee_range" TEXT,
    "account_industry" TEXT,
    "linkedin_url" TEXT,
    "batch_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ranking_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "total_leads" INTEGER NOT NULL DEFAULT 0,
    "processed_leads" INTEGER NOT NULL DEFAULT 0,
    "relevant_leads" INTEGER NOT NULL DEFAULT 0,
    "total_cost" REAL NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "prompt_id" TEXT,
    "persona_spec" TEXT,
    "error_message" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    CONSTRAINT "ranking_runs_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "prompts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lead_rankings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lead_id" TEXT NOT NULL,
    "ranking_run_id" TEXT NOT NULL,
    "is_relevant" BOOLEAN NOT NULL DEFAULT false,
    "relevance_score" INTEGER NOT NULL DEFAULT 0,
    "company_rank" INTEGER,
    "reasoning" TEXT,
    "department" TEXT,
    "seniority" TEXT,
    "buyer_type" TEXT,
    "company_size_category" TEXT,
    "positive_signals" TEXT,
    "negative_signals" TEXT,
    "ai_cost" REAL NOT NULL DEFAULT 0,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lead_rankings_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lead_rankings_ranking_run_id_fkey" FOREIGN KEY ("ranking_run_id") REFERENCES "ranking_runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prompts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "system_prompt" TEXT NOT NULL,
    "user_prompt_template" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "total_runs" INTEGER NOT NULL DEFAULT 0,
    "avg_accuracy" REAL,
    "avg_cost" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "prompt_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "prompt_a_id" TEXT NOT NULL,
    "prompt_b_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "prompt_a_accuracy" REAL,
    "prompt_b_accuracy" REAL,
    "prompt_a_cost" REAL,
    "prompt_b_cost" REAL,
    "winner" TEXT,
    "sample_size" INTEGER NOT NULL DEFAULT 50,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    CONSTRAINT "prompt_tests_prompt_a_id_fkey" FOREIGN KEY ("prompt_a_id") REFERENCES "prompts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "prompt_tests_prompt_b_id_fkey" FOREIGN KEY ("prompt_b_id") REFERENCES "prompts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "upload_batches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "file_name" TEXT NOT NULL,
    "total_rows" INTEGER NOT NULL,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "lead_rankings_lead_id_ranking_run_id_key" ON "lead_rankings"("lead_id", "ranking_run_id");
