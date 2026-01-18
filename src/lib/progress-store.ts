/**
 * In-memory progress store for tracking long-running operations
 * In production, this would use Redis or a database
 */

export interface ProgressData {
  status: 'pending' | 'running' | 'completed' | 'failed';
  current: number;
  total: number;
  phase: string;
  details?: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  result?: unknown;
}

// Store progress data in memory
const progressStore = new Map<string, ProgressData>();

export function setProgress(id: string, data: Partial<ProgressData>) {
  const existing = progressStore.get(id) || {
    status: 'pending',
    current: 0,
    total: 0,
    phase: 'Starting...',
    startedAt: new Date(),
  };

  progressStore.set(id, { ...existing, ...data });
}

export function getProgress(id: string): ProgressData | null {
  return progressStore.get(id) || null;
}

export function deleteProgress(id: string) {
  progressStore.delete(id);
}

export function createProgress(id: string, total: number, phase: string): ProgressData {
  const data: ProgressData = {
    status: 'running',
    current: 0,
    total,
    phase,
    startedAt: new Date(),
  };
  progressStore.set(id, data);
  return data;
}

export function updateProgress(id: string, current: number, phase?: string, details?: string) {
  const existing = progressStore.get(id);
  if (existing) {
    existing.current = current;
    if (phase) existing.phase = phase;
    if (details) existing.details = details;
  }
}

export function completeProgress(id: string, result?: unknown) {
  const existing = progressStore.get(id);
  if (existing) {
    existing.status = 'completed';
    existing.completedAt = new Date();
    existing.result = result;
  }
}

export function failProgress(id: string, error: string) {
  const existing = progressStore.get(id);
  if (existing) {
    existing.status = 'failed';
    existing.error = error;
    existing.completedAt = new Date();
  }
}
