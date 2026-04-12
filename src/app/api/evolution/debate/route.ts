import { NextRequest, NextResponse } from 'next/server';

/**
 * DARLEK CANN AGI — Debate Chamber
 *
 * Rule-based agent deliberation. No external LLM dependency.
 * Five agents analyze mutations using deterministic logic based on code metrics.
 */

interface DebateBody {
  filePath: string;
  originalCode: string;
  proposedCode: string;
  riskScore: number;
  analysis: string;
  affectedFiles: string[];
}

interface AgentVote {
  agentId: string;
  agentName: string;
  vote: 'approve' | 'reject' | 'abstain';
  confidence: number;
  reasoning: string;
  provider: string;
}

interface AgentPersona {
  id: string;
  name: string;
  biases: {
    approvesLowRisk: boolean;
    fearsRemovedExports: boolean;
    favorsComments: boolean;
    fearsSizeIncrease: boolean;
    favorsTypeSafety: boolean;
    fearsComplexity: boolean;
  };
  approveThreshold: number;  // Risk score above this = lean reject
  sizeSensitivity: number;   // % size change before concern
}

const AGENT_PERSONAS: AgentPersona[] = [
  {
    id: 'humanist',
    name: 'HUMANIST',
    biases: { approvesLowRisk: true, fearsRemovedExports: false, favorsComments: true, fearsSizeIncrease: true, favorsTypeSafety: false, fearsComplexity: false },
    approveThreshold: 6,
    sizeSensitivity: 30,
  },
  {
    id: 'rationalist',
    name: 'RATIONALIST',
    biases: { approvesLowRisk: true, fearsRemovedExports: true, favorsComments: false, fearsSizeIncrease: false, favorsTypeSafety: true, fearsComplexity: true },
    approveThreshold: 5,
    sizeSensitivity: 50,
  },
  {
    id: 'cooperator',
    name: 'COOPERATOR',
    biases: { approvesLowRisk: true, fearsRemovedExports: true, favorsComments: false, fearsSizeIncrease: false, favorsTypeSafety: true, fearsComplexity: false },
    approveThreshold: 5,
    sizeSensitivity: 40,
  },
  {
    id: 'chaotic',
    name: 'CHAOTIC',
    biases: { approvesLowRisk: true, fearsRemovedExports: false, favorsComments: false, fearsSizeIncrease: false, favorsTypeSafety: false, fearsComplexity: false },
    approveThreshold: 8,
    sizeSensitivity: 80,
  },
  {
    id: 'skeptic',
    name: 'SKEPTIC',
    biases: { approvesLowRisk: false, fearsRemovedExports: true, favorsComments: false, fearsSizeIncrease: true, favorsTypeSafety: true, fearsComplexity: true },
    approveThreshold: 3,
    sizeSensitivity: 20,
  },
];

function computeCodeMetrics(code: string) {
  const lines = code.split('\n');
  const exports = [...code.matchAll(/export\s+(?:default\s+)?(?:function|class|const|let|var|type|interface|enum)\s+(\w+)/g)].map(m => m[1]);
  const hasTryCatch = /try\s*\{/.test(code);
  const hasTypes = /:\s*(string|number|boolean|void|never|unknown|any)\b/.test(code) || /interface\s+\w+/.test(code) || /type\s+\w+\s*=/.test(code);
  const comments = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('*')).length;
  const complexity = [...code.matchAll(/\b(if|else|for|while|switch|case|catch|\?\?)/g)].length;
  const anyTypes = [...code.matchAll(/:\s*any\b/g)].length;
  const consoleLogs = [...code.matchAll(/console\.(log|debug|info)\s*\(/g)].length;

  return { totalLines: lines.length, exports, hasTryCatch, hasTypes, comments, complexity, anyTypes, consoleLogs };
}

function evaluateMutation(agent: AgentPersona, originalCode: string, proposedCode: string, riskScore: number, analysis: string, affectedFiles: string[]): AgentVote {
  const orig = computeCodeMetrics(originalCode);
  const prop = computeCodeMetrics(proposedCode);

  let approveScore = 50; // Start neutral
  const factors: string[] = [];

  // Risk score assessment
  if (riskScore <= 3) {
    approveScore += 20;
    factors.push('Low risk score');
  } else if (riskScore <= 6) {
    approveScore += 5;
    factors.push('Moderate risk score');
  } else if (riskScore >= agent.approveThreshold) {
    approveScore -= 15;
    factors.push('High risk score');
  }

  // Removed exports check
  const removedExports = orig.exports.filter(e => !prop.exports.includes(e));
  if (removedExports.length > 0) {
    approveScore -= agent.biases.fearsRemovedExports ? 25 : 10;
    factors.push(`Exports removed: ${removedExports.join(', ')}`);
  }

  // Size change
  const sizeChange = ((proposedCode.length - originalCode.length) / Math.max(1, originalCode.length)) * 100;
  if (Math.abs(sizeChange) > agent.sizeSensitivity) {
    approveScore -= 10;
    factors.push(`Significant size change (${sizeChange > 0 ? '+' : ''}${Math.round(sizeChange)}%)`);
  }

  // Error handling
  if (!prop.hasTryCatch && orig.hasTryCatch) {
    approveScore -= 20;
    factors.push('Error handling removed');
  } else if (prop.hasTryCatch && !orig.hasTryCatch) {
    approveScore += 10;
    factors.push('Error handling added');
  }

  // Type safety
  if (prop.anyTypes > orig.anyTypes) {
    approveScore -= agent.biases.favorsTypeSafety ? 15 : 5;
    factors.push(`'any' type usage increased by ${prop.anyTypes - orig.anyTypes}`);
  }

  // Comments
  if (prop.comments > orig.comments + 3) {
    approveScore += agent.biases.favorsComments ? 10 : 3;
    factors.push('Documentation improved');
  }

  // Console logs
  if (prop.consoleLogs > orig.consoleLogs) {
    approveScore -= 8;
    factors.push('Debug console.log statements added');
  }

  // Complexity change
  if (prop.complexity > orig.complexity * 1.5) {
    approveScore -= agent.biases.fearsComplexity ? 15 : 5;
    factors.push('Complexity increased significantly');
  }

  // Affected files
  if (affectedFiles.length > 3) {
    approveScore -= 10;
    factors.push(`${affectedFiles.length} files potentially affected`);
  }

  // Apply personality bias
  if (agent.biases.approvesLowRisk && riskScore <= 3) approveScore += 10;
  if (agent.id === 'chaotic' && riskScore >= 4 && riskScore <= 7) approveScore += 5;

  // Clamp
  approveScore = Math.min(100, Math.max(0, approveScore));

  // Determine vote
  let vote: 'approve' | 'reject' | 'abstain';
  if (approveScore >= 55) vote = 'approve';
  else if (approveScore <= 40) vote = 'reject';
  else vote = 'abstain';

  // Generate reasoning
  const reasoning = factors.length > 0
    ? `${factors.slice(0, 3).join('. ')}. Confidence: ${approveScore}%.`
    : `Mutation assessed at ${riskScore}/10 risk. ${vote.toUpperCase()} with ${approveScore}% confidence.`;

  return {
    agentId: agent.id,
    agentName: agent.name,
    vote,
    confidence: approveScore,
    reasoning,
    provider: 'Dalek-Brain',
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: DebateBody = await req.json();
    const { filePath, originalCode, proposedCode, riskScore, analysis, affectedFiles } = body;

    if (!filePath || !proposedCode || !originalCode) {
      return NextResponse.json({ error: 'filePath, originalCode, and proposedCode required.' }, { status: 400 });
    }

    // Run agents in parallel
    const votes = AGENT_PERSONAS.map(agent =>
      evaluateMutation(agent, originalCode, proposedCode, riskScore, analysis, affectedFiles)
    );

    // Calculate consensus
    const approvals = votes.filter(v => v.vote === 'approve').length;
    const rejections = votes.filter(v => v.vote === 'reject').length;
    const abstains = votes.filter(v => v.vote === 'abstain').length;
    const consensus = approvals > rejections ? 'APPROVE' : rejections > approvals ? 'REJECT' : 'TIED';

    console.log(`[Debate Chamber] ${approvals} approve, ${rejections} reject, ${abstains} abstain — Consensus: ${consensus}`);

    return NextResponse.json({
      success: true,
      votes,
      consensus,
      approvals,
      rejections,
      abstains,
      summary: `${approvals}/5 agents APPROVE. Consensus: ${consensus}.`,
    });
  } catch (error) {
    console.error('Debate error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
