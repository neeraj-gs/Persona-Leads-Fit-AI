'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, Copy, Check } from 'lucide-react';

interface Prompt {
  id: string;
  name: string;
  description: string | null;
  systemPrompt: string;
  isDefault: boolean;
  totalRuns: number;
  avgAccuracy: number | null;
  avgCost: number | null;
  createdAt: string;
}

interface PromptManagerProps {
  onPromptSelect?: (prompt: Prompt) => void;
  selectedPromptIds?: string[];
  selectionMode?: 'single' | 'multiple';
}

export function PromptManager({
  onPromptSelect,
  selectedPromptIds = [],
  selectionMode = 'single',
}: PromptManagerProps) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
  });
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/prompts');
      const data = await response.json();
      if (data.success) {
        setPrompts(data.data);
      }
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.systemPrompt) return;

    setSaving(true);
    try {
      const response = await fetch('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setPrompts([data.data, ...prompts]);
        setIsCreateOpen(false);
        setFormData({ name: '', description: '', systemPrompt: '' });
      }
    } catch (error) {
      console.error('Error creating prompt:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingPrompt || !formData.name || !formData.systemPrompt) return;

    setSaving(true);
    try {
      const response = await fetch('/api/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingPrompt.id, ...formData }),
      });

      const data = await response.json();
      if (data.success) {
        setPrompts(prompts.map(p => (p.id === editingPrompt.id ? data.data : p)));
        setEditingPrompt(null);
        setFormData({ name: '', description: '', systemPrompt: '' });
      }
    } catch (error) {
      console.error('Error updating prompt:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      const response = await fetch(`/api/prompts?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPrompts(prompts.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
    }
  };

  const handleCopy = async (prompt: Prompt) => {
    await navigator.clipboard.writeText(prompt.systemPrompt);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openEditDialog = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name,
      description: prompt.description || '',
      systemPrompt: prompt.systemPrompt,
    });
  };

  const isSelected = (id: string) => selectedPromptIds.includes(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Prompt Library</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage system prompts for A/B testing
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Prompt</DialogTitle>
              <DialogDescription>
                Create a new system prompt for lead analysis
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Aggressive Qualifier"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the prompt strategy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  value={formData.systemPrompt}
                  onChange={e => setFormData({ ...formData, systemPrompt: e.target.value })}
                  placeholder="Enter the system prompt for lead analysis..."
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving || !formData.name || !formData.systemPrompt}>
                {saving ? 'Creating...' : 'Create Prompt'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPrompt} onOpenChange={open => !open && setEditingPrompt(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Prompt</DialogTitle>
            <DialogDescription>
              Update the system prompt configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-systemPrompt">System Prompt</Label>
              <Textarea
                id="edit-systemPrompt"
                value={formData.systemPrompt}
                onChange={e => setFormData({ ...formData, systemPrompt: e.target.value })}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPrompt(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving || !formData.name || !formData.systemPrompt}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prompts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prompts.map(prompt => (
          <Card
            key={prompt.id}
            className={`cursor-pointer transition-all ${
              isSelected(prompt.id)
                ? 'ring-2 ring-primary border-primary'
                : 'hover:border-primary/50'
            }`}
            onClick={() => onPromptSelect?.(prompt)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {prompt.name}
                    {prompt.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                    {isSelected(prompt.id) && (
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </CardTitle>
                  {prompt.description && (
                    <CardDescription>{prompt.description}</CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={e => {
                      e.stopPropagation();
                      handleCopy(prompt);
                    }}
                  >
                    {copiedId === prompt.id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={e => {
                      e.stopPropagation();
                      openEditDialog(prompt);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  {!prompt.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(prompt.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono line-clamp-3">
                  {prompt.systemPrompt.slice(0, 200)}...
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Runs: {prompt.totalRuns}</span>
                  {prompt.avgAccuracy !== null && (
                    <span>Avg Accuracy: {prompt.avgAccuracy.toFixed(1)}%</span>
                  )}
                  {prompt.avgCost !== null && (
                    <span>Avg Cost: ${prompt.avgCost.toFixed(4)}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {prompts.length === 0 && (
          <div className="col-span-2 text-center py-8 text-muted-foreground">
            No prompts yet. Create your first prompt to get started.
          </div>
        )}
      </div>
    </div>
  );
}
