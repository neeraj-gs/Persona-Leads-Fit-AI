'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
  Position,
  Handle,
  NodeProps,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Building2, Crown, Star, Target, Users, ChevronDown, ChevronUp } from 'lucide-react';

interface LeadRanking {
  id: string;
  leadId: string;
  isRelevant: boolean;
  relevanceScore: number;
  companyRank: number | null;
  reasoning: string | null;
  department: string | null;
  seniority: string | null;
  buyerType: string | null;
  companySizeCategory: string | null;
  positiveSignals: string | null;
  negativeSignals: string | null;
  aiCost: number;
  tokensUsed: number;
  lead: {
    id: string;
    accountName: string;
    leadFirstName: string | null;
    leadLastName: string | null;
    leadJobTitle: string | null;
    accountDomain: string | null;
    accountEmployeeRange: string | null;
    accountIndustry: string | null;
  };
}

interface OrgChartProps {
  results: LeadRanking[];
  runId?: string;
}

const nodeWidth = 220;
const nodeHeight = 100;

// Custom node component for leads
function LeadNode({ data }: NodeProps) {
  const getBuyerTypeColor = (buyerType: string | null) => {
    switch (buyerType) {
      case 'decision_maker':
        return 'bg-purple-100 border-purple-400 text-purple-700';
      case 'champion':
        return 'bg-green-100 border-green-400 text-green-700';
      case 'influencer':
        return 'bg-blue-100 border-blue-400 text-blue-700';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-600';
    }
  };

  const getBuyerTypeIcon = (buyerType: string | null) => {
    switch (buyerType) {
      case 'decision_maker':
        return <Crown className="h-4 w-4" />;
      case 'champion':
        return <Star className="h-4 w-4" />;
      case 'influencer':
        return <Target className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const ranking = data.lead as LeadRanking;
  const lead = ranking.lead;

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 shadow-sm ${getBuyerTypeColor(ranking.buyerType)} ${
        ranking.isRelevant ? '' : 'opacity-50'
      }`}
      style={{ minWidth: nodeWidth, maxWidth: nodeWidth }}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />

      <div className="flex items-start gap-2">
        <div className="mt-1">{getBuyerTypeIcon(ranking.buyerType)}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {lead.leadFirstName} {lead.leadLastName}
          </div>
          <div className="text-xs truncate opacity-80">{lead.leadJobTitle || 'No title'}</div>

          <div className="flex items-center gap-2 mt-2">
            {ranking.companyRank && (
              <Badge variant="secondary" className="text-xs">
                #{ranking.companyRank}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {ranking.relevanceScore}%
            </Badge>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400" />
    </div>
  );
}

// Custom node for company header
function CompanyNode({ data }: NodeProps) {
  return (
    <div
      className="px-6 py-4 rounded-lg border-2 bg-slate-100 border-slate-400 shadow-md"
      style={{ minWidth: nodeWidth * 1.5 }}
    >
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-slate-600" />
        <div>
          <div className="font-bold text-lg">{data.label as string}</div>
          <div className="text-sm text-muted-foreground">{data.subtitle as string}</div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
  );
}

const nodeTypes = {
  lead: LeadNode,
  company: CompanyNode,
};

export function OrgChart({ results, runId }: OrgChartProps) {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Get unique companies from results
  const companies = useMemo(() => {
    const uniqueCompanies = new Map<string, { name: string; employeeRange: string | null; leadCount: number }>();
    results.forEach(r => {
      const company = r.lead.accountName;
      if (!uniqueCompanies.has(company)) {
        uniqueCompanies.set(company, {
          name: company,
          employeeRange: r.lead.accountEmployeeRange,
          leadCount: 1,
        });
      } else {
        const existing = uniqueCompanies.get(company)!;
        existing.leadCount++;
      }
    });
    return Array.from(uniqueCompanies.values()).sort((a, b) => b.leadCount - a.leadCount);
  }, [results]);

  // Set default company
  useEffect(() => {
    if (companies.length > 0 && !selectedCompany) {
      setSelectedCompany(companies[0].name);
    }
  }, [companies, selectedCompany]);

  // Generate nodes and edges for selected company
  useEffect(() => {
    if (!selectedCompany) return;

    const companyLeads = results
      .filter(r => r.lead.accountName === selectedCompany)
      .sort((a, b) => {
        // Sort by relevance first, then by rank
        if (a.isRelevant !== b.isRelevant) return a.isRelevant ? -1 : 1;
        if (a.companyRank && b.companyRank) return a.companyRank - b.companyRank;
        return b.relevanceScore - a.relevanceScore;
      });

    const company = companies.find(c => c.name === selectedCompany);
    if (!company) return;

    // Create nodes
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Company node at top
    newNodes.push({
      id: 'company',
      type: 'company',
      position: { x: 300, y: 0 },
      data: {
        label: company.name,
        subtitle: `${company.employeeRange || 'Unknown size'} · ${company.leadCount} contacts`,
      },
    });

    // Group leads by buyer type for layout
    const decisionMakers = companyLeads.filter(l => l.buyerType === 'decision_maker' && l.isRelevant);
    const champions = companyLeads.filter(l => l.buyerType === 'champion' && l.isRelevant);
    const influencers = companyLeads.filter(l => l.buyerType === 'influencer' && l.isRelevant);
    const others = companyLeads.filter(l => !l.isRelevant || !['decision_maker', 'champion', 'influencer'].includes(l.buyerType || ''));

    let currentY = 150;
    const xSpacing = nodeWidth + 40;
    const ySpacing = nodeHeight + 40;

    // Helper to add a row of leads
    const addRow = (leads: LeadRanking[], yPos: number, label: string) => {
      if (leads.length === 0) return yPos;

      const startX = 300 - ((leads.length - 1) * xSpacing) / 2;

      leads.forEach((lead, idx) => {
        const nodeId = `lead-${lead.id}`;
        newNodes.push({
          id: nodeId,
          type: 'lead',
          position: { x: startX + idx * xSpacing, y: yPos },
          data: { lead },
        });

        // Connect to company
        newEdges.push({
          id: `edge-${nodeId}`,
          source: 'company',
          target: nodeId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: '#94a3b8', strokeWidth: 2 },
          animated: lead.companyRank === 1,
        });
      });

      return yPos + ySpacing;
    };

    // Add decision makers first (top row)
    currentY = addRow(decisionMakers, currentY, 'Decision Makers');

    // Add champions
    currentY = addRow(champions, currentY, 'Champions');

    // Add influencers
    currentY = addRow(influencers, currentY, 'Influencers');

    // Add others at bottom
    addRow(others, currentY, 'Others');

    // Add multi-threading path edges between relevant leads
    const relevantLeads = companyLeads.filter(l => l.isRelevant && l.companyRank);
    if (relevantLeads.length > 1) {
      const sortedByRank = [...relevantLeads].sort((a, b) => (a.companyRank || 0) - (b.companyRank || 0));

      for (let i = 0; i < sortedByRank.length - 1; i++) {
        newEdges.push({
          id: `path-${i}`,
          source: `lead-${sortedByRank[i].id}`,
          target: `lead-${sortedByRank[i + 1].id}`,
          type: 'smoothstep',
          style: { stroke: '#22c55e', strokeWidth: 3, strokeDasharray: '5,5' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' },
          label: `${i + 2}`,
          labelStyle: { fill: '#22c55e', fontWeight: 'bold' },
        });
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [selectedCompany, results, companies, setNodes, setEdges]);

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No ranking results available</p>
          <p className="text-sm mt-2">Run a ranking first to see the org chart visualization</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Company Selector */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Multi-threading Strategy</h3>
          <p className="text-sm text-muted-foreground">
            Visualize contact hierarchy and recommended engagement sequence
          </p>
        </div>
        <Select value={selectedCompany || ''} onValueChange={(value) => {
          setSelectedCompany(value);
          setShowAllContacts(false); // Reset expanded state when switching companies
        }}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a company" />
          </SelectTrigger>
          <SelectContent>
            {companies.map(company => (
              <SelectItem key={company.name} value={company.name}>
                {company.name} ({company.leadCount} contacts)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-100 border-2 border-purple-400"></div>
          <span>Decision Maker</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-400"></div>
          <span>Champion</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-400"></div>
          <span>Influencer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-300"></div>
          <span>Not Relevant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-green-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #22c55e 0, #22c55e 5px, transparent 5px, transparent 10px)' }}></div>
          <span>Recommended Path</span>
        </div>
      </div>

      {/* Flow Chart */}
      <Card>
        <CardContent className="p-0">
          <div style={{ height: 600 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              connectionLineType={ConnectionLineType.SmoothStep}
              defaultEdgeOptions={{
                type: 'smoothstep',
              }}
            >
              <Background />
              <Controls />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Summary */}
      {selectedCompany && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Engagement Strategy for {selectedCompany}</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const companyLeads = results
                .filter(r => r.lead.accountName === selectedCompany && r.isRelevant)
                .sort((a, b) => (a.companyRank || 99) - (b.companyRank || 99));

              if (companyLeads.length === 0) {
                return <p className="text-muted-foreground">No relevant contacts identified at this company.</p>;
              }

              const displayedContacts = showAllContacts ? companyLeads : companyLeads.slice(0, 5);
              const remainingCount = companyLeads.length - 5;

              return (
                <div className="space-y-4">
                  <ol className="list-decimal list-inside space-y-2">
                    {displayedContacts.map((ranking, idx) => (
                      <li key={ranking.id} className="text-sm">
                        <span className="font-medium">
                          {ranking.lead.leadFirstName} {ranking.lead.leadLastName}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          ({ranking.lead.leadJobTitle || 'No title'}) - {ranking.buyerType?.replace('_', ' ')} · {ranking.relevanceScore}% match
                        </span>
                        {ranking.reasoning && (
                          <p className="ml-6 text-xs text-muted-foreground mt-1">{ranking.reasoning}</p>
                        )}
                      </li>
                    ))}
                  </ol>

                  {companyLeads.length > 5 && (
                    <button
                      onClick={() => setShowAllContacts(!showAllContacts)}
                      className="text-sm text-primary hover:underline font-medium cursor-pointer flex items-center gap-1 transition-colors"
                    >
                      {showAllContacts ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          +{remainingCount} more contact{remainingCount > 1 ? 's' : ''}
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
