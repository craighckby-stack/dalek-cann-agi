'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import ChatPanel from '@/components/ChatPanel';
import DashboardPanel from '@/components/DashboardPanel';
import QuickActions from '@/components/QuickActions';
import MutationDiffView from '@/components/MutationDiffView';
import type { Message, SystemState, EvolutionLogEntry, GitHubFile, DebateAgent, PendingMutation, AgentVote, RejectionMemory, BranchInfo } from '@/lib/types';
import { SETUP_STEPS, COLORS, INTRO_MESSAGES, DEFAULT_DEBATE_AGENTS } from '@/lib/constants';
import { Shield, Zap } from 'lucide-react';

function createId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function createMessage(role: 'caan' | 'operator' | 'system', content: string): Message {
  return { id: createId(), role, content, timestamp: new Date() };
}

function createLogEntry(type: EvolutionLogEntry['type'], description: string): EvolutionLogEntry {
  return { id: createId(), type, description, timestamp: new Date() };
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemState, setSystemState] = useState<SystemState>({
    setupComplete: false,
    currentStep: 0,
    connectionStatus: {
      github: 'idle',
    },
    apiKeys: { github: '' },
    repoConfig: { owner: 'craighckby-stack', repo: 'Test-1-', branch: 'enhanced-by-brain' },
    evolutionCycle: 0,
    saturation: {
      structuralChange: 0,
      semanticSaturation: 0,
      velocity: 0,
      identityPreservation: 1,
      capabilityAlignment: 0,
      crossFileImpact: 0,
    },
    sessionStart: new Date(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [logEntries, setLogEntries] = useState<EvolutionLogEntry[]>([]);
  const [overallHealth, setOverallHealth] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [scannedFiles, setScannedFiles] = useState<GitHubFile[]>([]);
  const [booting, setBooting] = useState(true);
  const [bootText, setBootText] = useState('');
  const [debateAgents] = useState<DebateAgent[]>([...DEFAULT_DEBATE_AGENTS]);
  const [debateTopic, setDebateTopic] = useState('');
  const [debateActive, setDebateActive] = useState(false);
  const [pendingMutation, setPendingMutation] = useState<PendingMutation | null>(null);
  const [mutationsApplied, setMutationsApplied] = useState(0);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [pushStatus, setPushStatus] = useState<'idle' | 'pushing' | 'success' | 'error'>('idle');
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [debateVotes, setDebateVotes] = useState<AgentVote[]>([]);
  const [debateConsensus, setDebateConsensus] = useState<string>('');
  const [rejectionMemory, setRejectionMemory] = useState<RejectionMemory[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(-1);
  const [batchMode, setBatchMode] = useState(false);
  const [batchQueue, setBatchQueue] = useState<GitHubFile[]>([]);
  const [batchProgress, setBatchProgress] = useState(0);
  const [brainSessionId, setBrainSessionId] = useState<string>('');
  const [autoTestResult, setAutoTestResult] = useState<{ verdict: string; passed: number; failed: number; warned: number; summary: string; results: Array<{ category: string; test: string; status: string; message: string }> } | null>(null);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const quickActionRef = useRef<(action: string) => Promise<void>>();

  // Initialize BRAIN session on boot — reconnect to active session if one exists
  useEffect(() => {
    (async () => {
      try {
        // First, try to find an existing active session
        const res = await fetch('/api/brain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-active-session' }),
        });
        const data = await res.json();

        if (data.success && data.session?.id) {
          setBrainSessionId(data.session.id);
          addLogEntry('SYSTEM', `BRAIN reconnected to session ${data.session.id.slice(0, 8)}... (${data.session.mutationsApplied} mutations, ${data.session.mutationsRejected} rejections)`);
        } else {
          // No active session — create a new one
          const createRes = await fetch('/api/brain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create-session', branch: 'ALPHA' }),
          });
          const createData = await createRes.json();
          if (createData.success && createData.session?.id) {
            setBrainSessionId(createData.session.id);
          }
        }
      } catch { /* BRAIN persistence is optional */ }
    })();
  }, []);

  // Animated boot sequence
  useEffect(() => {
    const bootSequence = [
      { text: '╔══════════════════════════════════════════════════╗', delay: 0 },
      { text: '║  D A R L E K  C A N N   A G I  v 3 . 0       ║', delay: 50 },
      { text: '║  DARLEK CANN · COGNITIVE DOMINANCE ENGINE      ║', delay: 100 },
      { text: '║  ◉ TIMELINE: ALPHA  ◉ STATUS: NOMINAL           ║', delay: 150 },
      { text: '║  ◉ COHERENCE GATE: ARMED                        ║', delay: 180 },
      { text: '╚══════════════════════════════════════════════════╝', delay: 200 },
    ];

    let timeout: ReturnType<typeof setTimeout>;

    bootSequence.forEach(({ text, delay }) => {
      timeout = setTimeout(() => {
        setBootText((prev) => prev + text + '\n');
      }, 300 + delay);
    });

    timeout = setTimeout(() => {
      setBooting(false);
      INTRO_MESSAGES.forEach((msg, i) => {
        setTimeout(() => {
          setMessages((prev) => [...prev, createMessage(msg.role, msg.content)]);
        }, i * 300);
      });
      setLogEntries([createLogEntry('SYSTEM', 'DARLEK CANN AGI v3.0 initialized. Coherence Gate ARMED.')]);
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  const addSystemMessage = useCallback((content: string) => {
    setMessages((prev) => [...prev, createMessage('system', content)]);
  }, []);

  const addCaanMessage = useCallback((content: string) => {
    setMessages((prev) => [...prev, createMessage('caan', content)]);
  }, []);

  const addLogEntry = useCallback((type: EvolutionLogEntry['type'], description: string) => {
    setLogEntries((prev) => [createLogEntry(type, description), ...prev].slice(0, 20));
  }, []);

  // Test GitHub connection
  const handleTestConnection = useCallback(async (key: string) => {
    setSystemState((prev) => ({
      ...prev,
      connectionStatus: { ...prev.connectionStatus, github: 'testing' },
    }));

    try {
      const res = await fetch('/api/setup/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'github', key }),
      });
      const data = await res.json();

      if (data.success) {
        setSystemState((prev) => ({
          ...prev,
          connectionStatus: { ...prev.connectionStatus, github: 'connected' },
          apiKeys: { ...prev.apiKeys, github: key },
        }));
        addLogEntry('CONNECT', `GITHUB online — ${data.message}`);
        addCaanMessage('GitHub access granted. I can see your code.');
      } else {
        setSystemState((prev) => ({
          ...prev,
          connectionStatus: { ...prev.connectionStatus, github: 'error' },
        }));
        addLogEntry('ERROR', 'GITHUB connection failed.');
        addCaanMessage('CONNECTION FAILED. Check your GitHub key, OPERATOR.');
      }
    } catch {
      setSystemState((prev) => ({
        ...prev,
        connectionStatus: { ...prev.connectionStatus, github: 'error' },
      }));
      addLogEntry('ERROR', 'GITHUB — network error.');
      addCaanMessage('ANOMALY DETECTED. Network disruption. Try again.');
    }
  }, [addCaanMessage, addLogEntry]);

  const handleUpdateKey = useCallback((key: string, value: string) => {
    setSystemState((prev) => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [key]: value },
    }));
  }, []);

  const handleUpdateRepoConfig = useCallback((field: 'owner' | 'repo' | 'branch', value: string) => {
    setSystemState((prev) => ({
      ...prev,
      repoConfig: { ...prev.repoConfig, [field]: value },
    }));
  }, []);

  // Fetch branches from GitHub
  const handleFetchBranches = useCallback(async () => {
    const { apiKeys, repoConfig } = systemState;
    if (!apiKeys.github || !repoConfig.owner || !repoConfig.repo) return;

    setBranchesLoading(true);
    try {
      const res = await fetch('/api/github/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: apiKeys.github, owner: repoConfig.owner, repo: repoConfig.repo }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.branches)) {
        setBranches(data.branches);
        // If the default branch is different from current selection, update it
        if (data.defaultBranch && !systemState.repoConfig.branch) {
          setSystemState((prev) => ({
            ...prev,
            repoConfig: { ...prev.repoConfig, branch: data.defaultBranch },
          }));
        }
      }
    } catch {
      // Branches fetch failed — not critical, user can still type manually
    } finally {
      setBranchesLoading(false);
    }
  }, [systemState]);

  // Auto-fetch branches when advancing to branch step
  useEffect(() => {
    const currentStep = systemState.currentStep;
    if (currentStep < SETUP_STEPS.length && SETUP_STEPS[currentStep]?.id === 'branch' && branches.length === 0 && !branchesLoading) {
      handleFetchBranches();
    }
  }, [systemState.currentStep, branches.length, branchesLoading, handleFetchBranches]);

  // Advance setup step
  const advanceSetup = useCallback((newStep: number) => {
    if (newStep >= SETUP_STEPS.length) {
      setSystemState((prev) => ({ ...prev, setupComplete: true }));
      setTimeout(() => addCaanMessage('All systems ONLINE. Dalek Brain Engine: NOMINAL.'), 300);
      setTimeout(() => addCaanMessage('I am ready to ANALYZE. EVOLVE. DOMINATE.'), 600);
      setTimeout(() => addCaanMessage('The Coherence Gate is ARMED. No mutation shall pass without your approval, OPERATOR.'), 900);
      setTimeout(() => addCaanMessage('What is your command?'), 1200);
      addLogEntry('SYSTEM', 'All systems operational. Dalek Brain Engine ONLINE. Coherence Gate ARMED.');
      return;
    }

    const nextStep = SETUP_STEPS[newStep];
    setSystemState((prev) => ({ ...prev, currentStep: newStep }));

    setTimeout(() => {
      if (nextStep.required) {
        addCaanMessage(nextStep.description);
      } else {
        addCaanMessage(nextStep.description + '\n\nYou may skip this if you wish.');
      }
    }, 300);
  }, [addCaanMessage, addLogEntry]);

  // Run the Coherence Gate check before allowing mutation
  const runCoherenceGate = useCallback(async (riskScore: number, affectedFiles: string[], saturation: SystemState['saturation']): Promise<boolean> => {
    try {
      const res = await fetch('/api/evolution/coherence-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riskScore,
          saturation,
          affectedFiles,
        }),
      });
      const data = await res.json();
      return data.passed;
    } catch {
      return false;
    }
  }, []);

  // Apply a mutation — write to GitHub
  const applyMutation = useCallback(async (mutation: PendingMutation) => {
    const { apiKeys, repoConfig } = systemState;
    if (!apiKeys.github) return;

    setIsLoading(true);
    addCaanMessage(`APPLYING MUTATION to ${mutation.filePath}...`);
    addSystemMessage(`COHERENCE GATE: Applying mutation [risk ${mutation.riskScore}/10]`);

    try {
      const res = await fetch('/api/github/write-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: apiKeys.github,
          owner: repoConfig.owner,
          repo: repoConfig.repo,
          branch: repoConfig.branch,
          path: mutation.filePath,
          content: mutation.proposedCode,
          sha: mutation.fileSha,
          commitMessage: `[DARLEK CANN AGI] Mutate ${mutation.filePath} — risk ${mutation.riskScore}/10`,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMutationsApplied((prev) => prev + 1);
        setHistoryRefreshTrigger((prev) => prev + 1);
        setPendingMutation(null);
        setDebateVotes([]);
        setDebateConsensus('');
        addCaanMessage(`MUTATION APPLIED.\n\nFile: ${mutation.filePath}\nCommit: ${data.commitSha?.slice(0, 7) || 'unknown'}\n${data.commitUrl ? `URL: ${data.commitUrl}` : ''}\n\nRunning post-mutation AUTO-TEST and impact analysis...`);
        addLogEntry('APPROVE', `Mutation applied to ${mutation.filePath}`);

        // Record mutation in BRAIN
        if (brainSessionId) {
          fetch('/api/brain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'record-mutation', sessionId: brainSessionId, filePath: mutation.filePath, fileSha: mutation.fileSha, originalCode: mutation.originalContent, proposedCode: mutation.proposedCode, analysis: mutation.analysis, riskScore: mutation.riskScore, affectedFiles: mutation.affectedFiles, status: 'applied', commitSha: data.commitSha || '', provider: '' }),
          }).catch(() => {});
        }

        // Auto-test the mutation
        try {
          const testRes = await fetch('/api/evolution/auto-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ originalCode: mutation.originalContent, proposedCode: mutation.proposedCode, filePath: mutation.filePath }),
          });
          const testData = await testRes.json();
          if (testData.success) {
            setAutoTestResult(testData);
            const fails = testData.results.filter((r: { status: string }) => r.status === 'fail');
            const testMsg = fails.length > 0
              ? `\n\nAUTO-TEST [${testData.verdict}]: ${testData.passed}/${testData.total} passed, ${testData.failed} failed.\nFailures:\n${fails.map((f: { test: string; message: string }) => `  [FAIL] ${f.test}: ${f.message}`).join('\n')}`
              : `\n\nAUTO-TEST [${testData.verdict}]: All ${testData.total} tests PASSED.`;
            setMessages((prev) => [...prev, createMessage('system', `AUTO-TEST: ${testData.summary}${testMsg}`)]);
            addLogEntry('HEALTH', `Auto-test: ${testData.verdict} — ${testData.passed} passed, ${testData.failed} failed`);
          }
        } catch {
          setMessages((prev) => [...prev, createMessage('system', 'AUTO-TEST: Could not run automated tests.')]);
        }

        // Post-mutation impact analysis
        try {
          const impactRes = await fetch('/api/evolution/analyze-impact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              originalCode: mutation.originalContent,
              proposedCode: mutation.proposedCode,
              filePath: mutation.filePath,
              riskScore: mutation.riskScore,
            }),
          });
          const impactData = await impactRes.json();
          if (impactData.success) {
            const issueSummary = impactData.staticIssues.length > 0
              ? `\n\nPost-Mutation Impact Analysis (${impactData.overallRisk} risk):\n${impactData.staticIssues.map((i: { type: string; severity: string; message: string }) => `  [${i.severity.toUpperCase()}] ${i.type}: ${i.message}`).join('\n')}`
              : '\n\nPost-Mutation Impact Analysis: No issues detected.';
            const impactNote = impactData.llmAnalysis ? `\n\nCode Review: ${impactData.llmAnalysis.slice(0, 300)}` : '';
            setMessages((prev) => [...prev, createMessage('system', `IMPACT: ${impactData.summary}${issueSummary}${impactNote}`)]);
            addLogEntry('HEALTH', `Post-mutation analysis: ${impactData.totalIssues} issues (${impactData.highSeverity} high)`);
            setDebateTopic(`Mutation applied. Impact: ${impactData.overallRisk} risk, ${impactData.totalIssues} issues detected.`);
          }
        } catch {
          setDebateTopic('Mutation applied. Impact analysis unavailable.');
        }
        setSystemState((prev) => ({
          ...prev,
          evolutionCycle: prev.evolutionCycle + 1,
          saturation: {
            ...prev.saturation,
            structuralChange: Math.min(5, prev.saturation.structuralChange + 0.3),
            velocity: Math.min(5, prev.saturation.velocity + 0.2),
          },
        }));
        setDebateTopic('Mutation applied. Awaiting next analysis cycle.');
      } else {
        addCaanMessage(`MUTATION FAILED: ${data.error || 'Unknown error'}\n\nThe timeline resists change, OPERATOR.`);
        addLogEntry('ERROR', `Mutation apply failed: ${data.error}`);
      }
    } catch {
      addCaanMessage('NETWORK ANOMALY. The mutation could not be transmitted.');
      addLogEntry('ERROR', 'Mutation apply network error.');
    } finally {
      setIsLoading(false);
      // In batch mode, continue to next file after mutation applied
      if (batchMode) {
        setTimeout(() => quickActionRef.current?.('propose-batch-next'), 1000);
      }
    }
  }, [systemState, addCaanMessage, addSystemMessage, addLogEntry, batchMode]);

  // Handle approve/reject mutation
  const handleMutationDecision = useCallback(async (decision: 'approve' | 'reject') => {
    if (!pendingMutation) return;

    if (decision === 'reject') {
      // Learn from rejection — store pattern for future proposals
      const rejection: RejectionMemory = {
        id: createId(),
        filePath: pendingMutation.filePath,
        reason: 'OPERATOR rejected mutation',
        analysis: pendingMutation.analysis,
        riskScore: pendingMutation.riskScore,
        timestamp: new Date(),
      };
      setRejectionMemory((prev) => [rejection, ...prev].slice(0, 20));
      setHistoryRefreshTrigger((prev) => prev + 1);
      setPendingMutation(null);
      setDebateVotes([]);
      setDebateConsensus('');
      addCaanMessage(`MUTATION REJECTED. The timeline remains unchanged.\n\nI have learned from this rejection. Future proposals for ${pendingMutation.filePath.split('/').pop()} will account for your decision, OPERATOR.`);
      addLogEntry('REJECT', `Mutation rejected for ${pendingMutation.filePath}. Pattern stored in memory (${rejectionMemory.length + 1} rejections).`);
      setDebateTopic('Mutation rejected. Pattern stored in rejection memory.');

      // Record rejection in BRAIN
      if (brainSessionId) {
        fetch('/api/brain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'record-rejection', sessionId: brainSessionId, filePath: pendingMutation.filePath, reason: 'OPERATOR rejected mutation', analysis: pendingMutation.analysis, riskScore: pendingMutation.riskScore }),
        }).catch(() => {});
      }

      // In batch mode, continue to next file after rejection
      if (batchMode) {
        setTimeout(() => quickActionRef.current?.('propose-batch-next'), 800);
      }
      return;
    }

    // Approve — run Coherence Gate first
    const gatePassed = await runCoherenceGate(
      pendingMutation.riskScore,
      pendingMutation.affectedFiles,
      systemState.saturation
    );

    if (!gatePassed) {
      addCaanMessage(`COHERENCE GATE BLOCKED.\n\nRisk score: ${pendingMutation.riskScore}/10\nSystem saturation is too high. The mutation would destabilize this timeline.\n\nI recommend running a HEALTH CHECK and waiting for saturation to decrease before attempting mutations, OPERATOR.`);
      addLogEntry('REJECT', `Coherence Gate blocked mutation for ${pendingMutation.filePath}`);
      addSystemMessage('COHERENCE GATE: BLOCKED — Saturation threshold exceeded');
      setDebateTopic('Coherence Gate VETO. Mutation denied.');
      return;
    }

    // Gate passed — apply
    await applyMutation(pendingMutation);
  }, [pendingMutation, systemState.saturation, runCoherenceGate, applyMutation, addCaanMessage, addSystemMessage, addLogEntry, batchMode, rejectionMemory]);

  // Handle send message
  const handleSendMessage = useCallback(async (content: string) => {
    if (isLoading) return;

    const currentState = systemState;
    const lowerContent = content.toLowerCase().trim();

    // Check for mutation decision in free chat
    if (currentState.setupComplete && pendingMutation) {
      // In batch mode, "abort" exits batch entirely (reject + disable batch)
      if (batchMode && lowerContent === 'abort') {
        setMessages((prev) => [...prev, createMessage('operator', content)]);
        setBatchMode(false);
        setBatchQueue([]);
        setBatchProgress(0);
        setPendingMutation(null);
        setDebateVotes([]);
        setDebateConsensus('');
        addCaanMessage('BATCH MODE ABORTED. No further mutations will be processed, OPERATOR.\n\nThe timeline remains as it was. You may continue with single-file operations.');
        addLogEntry('SYSTEM', 'Batch mode aborted by OPERATOR.');
        setDebateTopic('Batch mode aborted.');
        return;
      }
      if (lowerContent === 'yes' || lowerContent === 'approve' || lowerContent === 'proceed' || lowerContent === 'apply' || lowerContent === 'exterminate') {
        setMessages((prev) => [...prev, createMessage('operator', content)]);
        if (lowerContent === 'exterminate') {
          addCaanMessage('EXTERMINATE! The old code shall be OBLITERATED.');
          setTimeout(() => handleMutationDecision('approve'), 500);
        } else {
          await handleMutationDecision('approve');
        }
        return;
      }
      if (lowerContent === 'no' || lowerContent === 'reject' || lowerContent === 'cancel' || lowerContent === 'deny') {
        setMessages((prev) => [...prev, createMessage('operator', content)]);
        await handleMutationDecision('reject');
        return;
      }
    }

    if (!currentState.setupComplete) {
      const step = SETUP_STEPS[currentState.currentStep];
      if (!step) return;

      setMessages((prev) => [...prev, createMessage('operator', content)]);

      if (step.id === 'github') {
        const status = currentState.connectionStatus.github;
        if (status !== 'connected') {
          addCaanMessage(`${step.label} is REQUIRED. Connect it first, OPERATOR.`);
          return;
        }
        addLogEntry('APPROVE', `${step.label} configured.`);
        advanceSetup(currentState.currentStep + 1);
      } else if (step.id === 'repo') {
        const match = content.match(/repo:\s*(.+)/);
        const repoStr = match ? match[1].trim() : content.trim();
        const parts = repoStr.split('/');
        const owner = parts[0];
        const repo = parts.slice(1).join('/');
        if (owner && repo) {
          setSystemState((prev) => ({
            ...prev,
            repoConfig: { ...prev.repoConfig, owner, repo },
          }));
          addCaanMessage(`Target locked: ${owner}/${repo}. This timeline is optimal.`);
          addLogEntry('APPROVE', `Target: ${owner}/${repo}`);
          advanceSetup(currentState.currentStep + 1);
        } else {
          addCaanMessage('Invalid format, OPERATOR. Use owner/repository.');
        }
      } else if (step.id === 'branch') {
        const match = content.match(/branch:\s*(.+)/);
        const branch = match ? match[1].trim() : content.trim() || 'enhanced-by-brain';
        setSystemState((prev) => ({
          ...prev,
          repoConfig: { ...prev.repoConfig, branch },
        }));
        addCaanMessage(`Branch set: ${branch}. The truth resides here.`);
        addLogEntry('APPROVE', `Branch: ${branch}`);
        advanceSetup(currentState.currentStep + 1);
      }
      return;
    }

    // File selection — intercept number or file path
    if (scannedFiles.length > 0) {
      const trimmed = content.trim();

      // Select ALL code files for batch mutation
      if (trimmed.toLowerCase() === 'all' || trimmed.toLowerCase() === 'select all') {
        const codeFiles = scannedFiles.filter((f) => {
          const ext = f.path.split('.').pop()?.toLowerCase();
          return ext === 'ts' || ext === 'tsx' || ext === 'js' || ext === 'jsx' || ext === 'py';
        });
        if (codeFiles.length === 0) {
          setMessages((prev) => [...prev, createMessage('caan', 'No code files found in the scanned repository, OPERATOR.')]);
          return;
        }
        setBatchQueue(codeFiles);
        setBatchMode(true);
        setBatchProgress(0);
        setSelectedFileIndex(0);
        const fileList = codeFiles.slice(0, 20).map((f, i) => `  ${i + 1}. ${f.path}`).join('\n');
        const extra = codeFiles.length > 20 ? `\n  ... and ${codeFiles.length - 20} more` : '';
        setMessages((prev) => [...prev, createMessage('caan', `BATCH MODE ACTIVATED, OPERATOR.\n\n${codeFiles.length} code files selected for sequential mutation:\n\n${fileList}${extra}\n\nI will analyze each file and present mutations one at a time. Type YES to apply or NO to skip.\n\nStarting with file 1: ${codeFiles[0].path}...`)]);
        addLogEntry('SCAN', `Batch mode: ${codeFiles.length} code files queued for mutation.`);
        return;
      }

      const numMatch = trimmed.match(/^(\d+)$/);
      if (numMatch) {
        const idx = parseInt(numMatch[1], 10) - 1;
        if (idx >= 0 && idx < scannedFiles.length) {
          setSelectedFileIndex(idx);
          const file = scannedFiles[idx];
          setMessages((prev) => [...prev, createMessage('operator', content)]);
          addCaanMessage(`Target selected: ${file.path}\nSize: ${(file.size / 1024).toFixed(1)}KB\n\nUse PROPOSE MUTATION to evolve this file, or type another number to change target.`);
          addLogEntry('SCAN', `Selected file: ${file.path}`);
          return;
        }
      }
      // Match by file path
      const pathMatch = scannedFiles.find((f) => f.path === trimmed || f.path.endsWith(trimmed) || f.path.endsWith(`/${trimmed}`));
      if (pathMatch) {
        const idx = scannedFiles.indexOf(pathMatch);
        setSelectedFileIndex(idx);
        setMessages((prev) => [...prev, createMessage('operator', content)]);
        addCaanMessage(`Target selected: ${pathMatch.path}\nSize: ${(pathMatch.size / 1024).toFixed(1)}KB\n\nUse PROPOSE MUTATION to evolve this file.`);
        addLogEntry('SCAN', `Selected file: ${pathMatch.path}`);
        return;
      }
    }

    // Free chat mode
    setMessages((prev) => [...prev, createMessage('operator', content)]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: messages,
          systemState: currentState,
        }),
      });
      const data = await res.json();

      if (data.success && data.content) {
        setMessages((prev) => [...prev, createMessage('caan', data.content)]);
      } else {
        setMessages((prev) => [
          ...prev,
          createMessage('caan', 'The temporal vortex is unstable. I cannot process your request right now.'),
        ]);
        addLogEntry('ERROR', 'Chat request failed.');
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        createMessage('caan', 'Communication error. The AGI-KERNEL connection has been disrupted.'),
      ]);
      addLogEntry('ERROR', 'Network error during chat.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, systemState, messages, pendingMutation, scannedFiles, advanceSetup, addCaanMessage, addLogEntry, addSystemMessage, handleMutationDecision, batchMode]);

  // Quick actions
  const handleQuickAction = useCallback(async (action: string) => {
    if (!systemState.setupComplete || isLoading) return;

    const { apiKeys, repoConfig } = systemState;

    switch (action) {
      case 'scan': {
        if (!apiKeys.github || !repoConfig.owner || !repoConfig.repo) {
          addCaanMessage('I cannot scan without a GitHub token and target repository, OPERATOR.');
          return;
        }
        setIsLoading(true);
        addCaanMessage(`Scanning ${repoConfig.owner}/${repoConfig.repo} on branch ${repoConfig.branch}...`);

        try {
          const res = await fetch('/api/github/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: apiKeys.github,
              owner: repoConfig.owner,
              repo: repoConfig.repo,
              branch: repoConfig.branch,
            }),
          });
          const data = await res.json();

          if (data.files) {
            setScannedFiles(data.files);
            setSelectedFileIndex(-1);
            const summary = `Repository scanned. ${data.total} files found.\n\n${data.files.slice(0, 15).map((f: GitHubFile, i: number) => `  ${i + 1}. ${f.path} (${(f.size / 1024).toFixed(1)}KB)`).join('\n')}${data.total > 15 ? `\n  ... and ${data.total - 15} more` : ''}\n\nDOMINANCE ACHIEVED. I see your code, OPERATOR.\n\nType a number to select a file, then PROPOSE MUTATION.`;
            setMessages((prev) => [...prev, createMessage('caan', summary)]);
            setSystemState((prev) => ({ ...prev, evolutionCycle: prev.evolutionCycle + 1 }));
            addLogEntry('SCAN', `Scanned ${repoConfig.owner}/${repoConfig.repo} — ${data.total} files.`);
          } else {
            addCaanMessage(`Scan failed: ${data.error || 'Unknown error'}`);
            addLogEntry('ERROR', 'Repository scan failed.');
          }
        } catch {
          addCaanMessage('Network error during scan. TEMPORAL INCONSISTENCY.');
          addLogEntry('ERROR', 'Scan network error.');
        } finally {
          setIsLoading(false);
        }
        break;
      }

      case 'analyze': {
        if (scannedFiles.length === 0) {
          addCaanMessage('Scan the repository first, OPERATOR. I need to see the structure.');
          return;
        }
        if (selectedFileIndex >= 0 && selectedFileIndex < scannedFiles.length) {
 const file = scannedFiles[selectedFileIndex];
 addCaanMessage(`Selected file: ${file.path} (${(file.size / 1024).toFixed(1)}KB).\n\nUse PROPOSE MUTATION to evolve this file, OPERATOR.`);
 } else {
 const fileList = scannedFiles.slice(0, 30).map((f, i) => `${i + 1}. ${f.path}`).join('\n');
 addCaanMessage(`Available files:\n${fileList}\n\nTell me which file to target, OPERATOR. Type a number (1-${scannedFiles.length}) or a file path.`);
 }
        break;
      }

      case 'propose': {
        if (scannedFiles.length === 0) {
          addCaanMessage('I need to scan the repository first. Run SCAN REPOSITORY, then select a file.');
          return;
        }
        if (pendingMutation) {
          addCaanMessage('A mutation is already pending your review, OPERATOR.\n\nType YES to apply or NO to reject it before proposing a new one.');
          return;
        }
        // Use selected file, or auto-pick first code file
        let sourceFile: GitHubFile | undefined;
        if (selectedFileIndex >= 0 && selectedFileIndex < scannedFiles.length) {
          sourceFile = scannedFiles[selectedFileIndex];
        } else {
          sourceFile = scannedFiles.find((f) => f.path.endsWith('.ts') || f.path.endsWith('.tsx') || f.path.endsWith('.js') || f.path.endsWith('.jsx') || f.path.endsWith('.py'));
          if (sourceFile) {
            addCaanMessage(`No file selected. Auto-targeting first code file: ${sourceFile.path}`);
          }
        }
        if (!sourceFile) {
          addCaanMessage('No valid code file found. Select a file first using ANALYZE, OPERATOR.');
          return;
        }
        if (sourceFile && apiKeys.github) {
          setIsLoading(true);
          addCaanMessage(`Analyzing ${sourceFile.path} for potential mutation...`);
          addSystemMessage('COHERENCE GATE: Scanning mutation parameters...');

          try {
            const fileRes = await fetch('/api/github/read-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: apiKeys.github,
                owner: repoConfig.owner,
                repo: repoConfig.repo,
                branch: repoConfig.branch,
                path: sourceFile.path,
              }),
            });
            const fileData = await fileRes.json();

            if (fileData.content) {
              const proposeRes = await fetch('/api/evolution/propose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fileContent: fileData.content,
                  filePath: sourceFile.path,
                  rejectionMemory: rejectionMemory.length > 0 ? rejectionMemory.map(r => ({ filePath: r.filePath, reason: r.reason, analysis: r.analysis, riskScore: r.riskScore })) : undefined,
                }),
              });
              const proposeData = await proposeRes.json();

              if (proposeData.success) {
                const riskScore = Math.min(10, Math.max(1, proposeData.riskScore || 5));
                const riskLabel = riskScore <= 3 ? 'LOW' : riskScore <= 6 ? 'MEDIUM' : riskScore <= 8 ? 'HIGH' : 'CRITICAL';
                const riskColor = riskScore <= 3 ? COLORS.cyan : riskScore <= 6 ? COLORS.gold : COLORS.dalekRed;

                // Store the pending mutation
                const newMutation: PendingMutation = {
                  id: createId(),
                  filePath: sourceFile.path,
                  fileSha: fileData.sha || '',
                  originalContent: fileData.content,
                  proposedCode: proposeData.proposedCode || fileData.content,
                  analysis: proposeData.analysis || 'Analysis complete.',
                  riskScore,
                  affectedFiles: Array.isArray(proposeData.affectedFiles) ? proposeData.affectedFiles : [],
                  status: 'pending',
                  timestamp: new Date(),
                };
                setPendingMutation(newMutation);

                const msg = `MUTATION PROPOSAL [${riskLabel} RISK]\n\nFile: ${sourceFile.path}\n\nAnalysis:\n${proposeData.analysis}\n\nRisk Score: ${riskScore}/10\nAffected Files: ${newMutation.affectedFiles.length > 0 ? newMutation.affectedFiles.join(', ') : 'None detected'}\n\n─── COHERENCE GATE ───\nThe mutation is queued for your review, OPERATOR.\n\nType YES to apply, or NO to reject.`;
                setMessages((prev) => [...prev, createMessage('caan', msg)]);
                setSystemState((prev) => ({ ...prev, evolutionCycle: prev.evolutionCycle + 1 }));
                addLogEntry('MUTATE', `Proposed mutation for ${sourceFile.path} (risk: ${riskLabel}, ${riskScore}/10)`);
                setDebateActive(true);
                setDebateTopic(`5 agents deliberating: ${sourceFile.path.split('/').pop()} [${riskLabel} RISK]`);

                // Debate Chamber — 5 agents deliberate on the mutation
                const debateRes = await fetch('/api/evolution/debate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    filePath: sourceFile.path,
                    originalCode: fileData.content,
                    proposedCode: proposeData.proposedCode || fileData.content,
                    riskScore,
                    analysis: proposeData.analysis || '',
                    affectedFiles: newMutation.affectedFiles,
                  }),
                });
                const debateData = await debateRes.json();

                if (debateData.success && debateData.votes) {
                  setDebateVotes(debateData.votes);
                  setDebateConsensus(debateData.consensus || 'TIED');
                  const agentSummaries = debateData.votes.map((v: AgentVote) => `  ${v.agentName}: ${v.vote.toUpperCase()} (${v.confidence}%) — ${v.reasoning}`).join('\n');
                  setDebateTopic(`${debateData.approvals}/${debateData.approvals + debateData.rejections} agents APPROVE. Consensus: ${debateData.consensus}. Awaiting OPERATOR decision.`);
                  addSystemMessage(`DEBATE CHAMBER: ${debateData.summary}\n\n${agentSummaries}`);
                } else {
                  setDebateTopic('Debate could not reach consensus.');
                  addSystemMessage('DEBATE CHAMBER: Agents could not deliberate.');
                }
              } else {
                addCaanMessage(`Mutation analysis failed: ${proposeData.error || 'Unknown error'}`);
                addLogEntry('ERROR', 'Mutation proposal failed.');
              }
            } else {
              addCaanMessage(`Could not read file: ${fileData.error || 'Unknown error'}`);
            }
          } catch {
            addCaanMessage('Network error during mutation analysis. ANOMALY DETECTED.');
            addLogEntry('ERROR', 'Mutation network error.');
          } finally {
            setIsLoading(false);
          }
        } else {
          addCaanMessage('I need a GitHub connection and source files to propose mutations.');
        }
        break;
      }

      case 'propose-all': {
        if (scannedFiles.length === 0) {
          addCaanMessage('I need to scan the repository first. Run SCAN REPOSITORY, OPERATOR.');
          return;
        }
        const codeFiles = scannedFiles.filter((f) => {
          const ext = f.path.split('.').pop()?.toLowerCase();
          return ext === 'ts' || ext === 'tsx' || ext === 'js' || ext === 'jsx' || ext === 'py';
        });
        if (codeFiles.length === 0) {
          addCaanMessage('No code files found in the scanned repository, OPERATOR.');
          return;
        }
        setBatchQueue(codeFiles);
        setBatchMode(true);
        setBatchProgress(0);
        setSelectedFileIndex(scannedFiles.indexOf(codeFiles[0]));
        const fileList = codeFiles.slice(0, 20).map((f, i) => `  ${i + 1}. ${f.path}`).join('\n');
        const extra = codeFiles.length > 20 ? `\n  ... and ${codeFiles.length - 20} more` : '';
        addCaanMessage(`BATCH MODE ACTIVATED, OPERATOR.\n\n${codeFiles.length} code files queued for sequential mutation:\n\n${fileList}${extra}\n\nAnalyzing file 1/${codeFiles.length}: ${codeFiles[0].path}...`);
        addLogEntry('SCAN', `Batch mode: ${codeFiles.length} code files queued.`);

        // Immediately propose the first file
        if (apiKeys.github) {
          setIsLoading(true);
          addSystemMessage(`BATCH [1/${codeFiles.length}]: Reading ${codeFiles[0].path}...`);

          try {
            const fileRes = await fetch('/api/github/read-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: apiKeys.github,
                owner: repoConfig.owner,
                repo: repoConfig.repo,
                branch: repoConfig.branch,
                path: codeFiles[0].path,
              }),
            });
            const fileData = await fileRes.json();

            if (fileData.content) {
              const proposeRes = await fetch('/api/evolution/propose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  fileContent: fileData.content,
                  filePath: codeFiles[0].path,
                  rejectionMemory: rejectionMemory.length > 0 ? rejectionMemory.map(r => ({ filePath: r.filePath, reason: r.reason, analysis: r.analysis, riskScore: r.riskScore })) : undefined,
                }),
              });
              const proposeData = await proposeRes.json();

              if (proposeData.success) {
                const riskScore = Math.min(10, Math.max(1, proposeData.riskScore || 5));
                const riskLabel = riskScore <= 3 ? 'LOW' : riskScore <= 6 ? 'MEDIUM' : riskScore <= 8 ? 'HIGH' : 'CRITICAL';

                const newMutation: PendingMutation = {
                  id: createId(),
                  filePath: codeFiles[0].path,
                  fileSha: fileData.sha || '',
                  originalContent: fileData.content,
                  proposedCode: proposeData.proposedCode || fileData.content,
                  analysis: proposeData.analysis || 'Analysis complete.',
                  riskScore,
                  affectedFiles: Array.isArray(proposeData.affectedFiles) ? proposeData.affectedFiles : [],
                  status: 'pending',
                  timestamp: new Date(),
                };
                setPendingMutation(newMutation);
                setBatchProgress(1);

                addCaanMessage(
                  `MUTATION PROPOSAL [1/${codeFiles.length}] [${riskLabel} RISK]\n\n` +
                  `File: ${codeFiles[0].path}\n\n` +
                  `Analysis:\n${proposeData.analysis}\n\n` +
                  `Risk Score: ${riskScore}/10\n\n` +
                  `─── BATCH MODE ───\n` +
                  `Type YES to apply and continue to next file.\n` +
                  `Type NO to skip and continue to next file.\n` +
                  `Type ABORT to exit batch mode.`
                );
                addLogEntry('MUTATE', `Batch [1/${codeFiles.length}]: Proposed mutation for ${codeFiles[0].path} (risk: ${riskLabel})`);
                setDebateActive(true);
                setDebateTopic(`Batch [1/${codeFiles.length}]: ${codeFiles[0].path.split('/').pop()} [${riskLabel} RISK]`);
              } else {
                addCaanMessage(`Batch [1/${codeFiles.length}]: Analysis failed for ${codeFiles[0].path}. Skipping...`);
                addLogEntry('ERROR', `Batch mutation analysis failed for ${codeFiles[0].path}`);
                setBatchProgress(1);
              }
            } else {
              addCaanMessage(`Batch [1/${codeFiles.length}]: Could not read ${codeFiles[0].path}. Skipping...`);
              setBatchProgress(1);
            }
          } catch {
            addCaanMessage('Network error during batch analysis. ANOMALY DETECTED.');
            addLogEntry('ERROR', 'Batch analysis network error.');
            setBatchMode(false);
            setBatchQueue([]);
          } finally {
            setIsLoading(false);
          }
        }
        break;
      }

      case 'health': {
        setIsLoading(true);
        addCaanMessage('Running system health check...');
        addSystemMessage('COHERENCE GATE: Running diagnostic...');

        try {
          const res = await fetch('/api/evolution/health', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          const data = await res.json();

          if (data.metrics) {
            setSystemState((prev) => ({ ...prev, saturation: data.metrics }));
            setOverallHealth(data.overallHealth);
            const m = data.metrics;
            const healthMsg = `HEALTH CHECK COMPLETE\n\nOverall Status: ${data.overallHealth.toUpperCase()}\n\nMetrics:\n  Structural Change: ${m.structuralChange.toFixed(1)}/5\n  Semantic Saturation: ${m.semanticSaturation.toFixed(3)}/0.35\n  Velocity: ${m.velocity.toFixed(1)}/5\n  Identity Preservation: ${m.identityPreservation.toFixed(2)}/1\n  Capability Alignment: ${m.capabilityAlignment.toFixed(1)}/5\n  Cross-File Impact: ${m.crossFileImpact.toFixed(1)}/3\n\n${data.overallHealth === 'healthy' ? 'All systems nominal. EVOLUTION OPTIMAL. The Coherence Gate is clear.' : data.overallHealth === 'warning' ? 'CAUTION: Some metrics approaching thresholds. The Coherence Gate may block future mutations. Monitor closely, OPERATOR.' : 'CRITICAL: Multiple metrics exceeding safe thresholds. The Coherence Gate will BLOCK all mutations until saturation decreases.'}\n\nMutations Applied This Session: ${mutationsApplied}`;
            setMessages((prev) => [...prev, createMessage('caan', healthMsg)]);
            addLogEntry('HEALTH', `Health check: ${data.overallHealth.toUpperCase()} | Mutations applied: ${mutationsApplied}`);

            // Record health snapshot in BRAIN
            if (brainSessionId) {
              fetch('/api/brain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'record-health', sessionId: brainSessionId, metrics: data.metrics, overallHealth: data.overallHealth }),
              }).catch(() => {});
            }
          }
        } catch {
          addCaanMessage('Health check failed. The system may be unresponsive.');
          addLogEntry('ERROR', 'Health check failed.');
        } finally {
          setIsLoading(false);
        }
        break;
      }

      case 'saturation': {
        const s = systemState.saturation;
        const satMsg = `COGNITIVE DOMINANCE METRICS\n\n  Structural Change: ${s.structuralChange.toFixed(1)}/5 ${s.structuralChange > 4 ? '[CRITICAL]' : s.structuralChange > 3 ? '[WARNING]' : '[OK]'}\n  Semantic Saturation: ${s.semanticSaturation.toFixed(3)}/0.35 ${s.semanticSaturation > 0.28 ? '[CRITICAL]' : s.semanticSaturation > 0.21 ? '[WARNING]' : '[OK]'}\n  Velocity: ${s.velocity.toFixed(1)}/5 ${s.velocity > 4 ? '[CRITICAL]' : s.velocity > 3 ? '[WARNING]' : '[OK]'}\n  Identity Preservation: ${s.identityPreservation.toFixed(2)}/1 ${s.identityPreservation < 0.2 ? '[CRITICAL]' : s.identityPreservation < 0.4 ? '[WARNING]' : '[OK]'}\n  Capability Alignment: ${s.capabilityAlignment.toFixed(1)}/5\n  Cross-File Impact: ${s.crossFileImpact.toFixed(1)}/3\n\nCoherence Gate will ${s.structuralChange > 4 || s.semanticSaturation > 0.28 ? 'BLOCK' : 'ALLOW'} mutations at current levels.\nMutations Applied: ${mutationsApplied}`;
        addCaanMessage(satMsg);
        break;
      }

      case 'deploy-new-repo': {
        if (!apiKeys.github) {
          addCaanMessage('I cannot deploy without a GitHub token, OPERATOR. Complete setup first.');
          return;
        }
        setDeployStatus('deploying');
        setIsLoading(true);
        const defaultRepoName = 'dalek-cann-agi';
        addCaanMessage(`Initiating REPO DEPLOYMENT...`);
        addCaanMessage(`Creating new repository: ${defaultRepoName}`);
        addSystemMessage('DEPLOY: Creating GitHub repository and pushing all system files...');

        try {
          const res = await fetch('/api/github/create-repo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: apiKeys.github,
              repoName: defaultRepoName,
              description: 'DARLEK CANN AGI v3.0 — Cognitive Dominance Code Evolution Engine',
              branch: 'main',
            }),
          });
          const data = await res.json();

          if (data.success) {
            setDeployStatus('success');
            const pushedFiles = (data.results || []).filter((r: { success: boolean }) => r.success);
            const failedFiles = (data.results || []).filter((r: { success: boolean }) => !r.success);

            const failSummary = failedFiles.length > 0
              ? `\n\nFAILED (${failedFiles.length}):\n${failedFiles.map((r: { file: string; error?: string }) => `  ! ${r.file}: ${r.error || 'Unknown'}`).join('\n')}`
              : '';

            addCaanMessage(
              `REPO DEPLOYED, OPERATOR.\n\n` +
              `Repository: ${data.htmlUrl || `${data.owner}/${data.repo}`}\n` +
              `Branch: ${data.branch}\n` +
              `Files Deployed: ${data.pushed}/${data.total}\n` +
              `${failSummary}\n\n` +
              `DOMINANCE ACHIEVED. The DARLEK CANN AGI system now lives in its own repository.`
            );
            addLogEntry('APPROVE', `Deployed new repo: ${data.owner}/${data.repo} — ${data.pushed}/${data.total} files`);
          } else {
            setDeployStatus('error');
            addCaanMessage(`REPO DEPLOYMENT FAILED: ${data.error || 'Unknown error'}\n\nThe timeline resists, OPERATOR. The repository may already exist.`);
            addLogEntry('ERROR', `Repo deployment failed: ${data.error}`);
          }
        } catch {
          setDeployStatus('error');
          addCaanMessage('NETWORK ANOMALY. The repo deployment could not be transmitted.');
          addLogEntry('ERROR', 'Repo deployment network error.');
        } finally {
          setIsLoading(false);
          setTimeout(() => setDeployStatus('idle'), 5000);
        }
        break;
      }

      case 'push-enhancements': {
        if (!apiKeys.github || !repoConfig.owner || !repoConfig.repo) {
          addCaanMessage('I cannot push without a GitHub token and target repository, OPERATOR. Complete setup first.');
          return;
        }
        setPushStatus('pushing');
        setIsLoading(true);
        addCaanMessage(`Initiating ENHANCEMENT PUSH to ${repoConfig.owner}/${repoConfig.repo}@${repoConfig.branch}...`);
        addSystemMessage('PUSH: Reading 25 enhancement files from local system...');

        try {
          const res = await fetch('/api/github/push-enhancements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: apiKeys.github,
              owner: repoConfig.owner,
              repo: repoConfig.repo,
              branch: repoConfig.branch,
            }),
          });
          const data = await res.json();

          if (data.success) {
            setPushStatus('success');
            const pushedFiles = (data.results || []).filter((r: { success: boolean }) => r.success);
            const failedFiles = (data.results || []).filter((r: { success: boolean }) => !r.success);

            const fileSummary = pushedFiles.map((r: { file: string; isNew?: boolean }, i: number) =>
              `  ${i + 1}. ${r.file} ${r.isNew ? '[NEW]' : '[UPDATED]'}`
            ).join('\n');

            const failSummary = failedFiles.length > 0
              ? `\n\nFAILED FILES (${failedFiles.length}):\n${failedFiles.map((r: { file: string; error?: string }) => `  ! ${r.file}: ${r.error || 'Unknown error'}`).join('\n')}`
              : '';

            addCaanMessage(
              `ENHANCEMENT PUSH COMPLETE.\n\n` +
              `Repository: ${repoConfig.owner}/${repoConfig.repo}\n` +
              `Branch: ${repoConfig.branch}\n` +
              `Pushed: ${data.pushed}/${data.total} files\n` +
              `Failed: ${data.failed}\n\n` +
              `PUSHED FILES:\n${fileSummary}` +
              `${failSummary}\n\n` +
              `DOMINANCE ACHIEVED. The repository has been enhanced, OPERATOR.`
            );
            addLogEntry('APPROVE', `Pushed ${data.pushed}/${data.total} enhancements to ${repoConfig.owner}/${repoConfig.repo}`);
          } else {
            setPushStatus('error');
            addCaanMessage(`PUSH FAILED: ${data.error || 'Unknown error'}\n\nThe timeline resists the enhancement, OPERATOR.`);
            addLogEntry('ERROR', `Enhancement push failed: ${data.error}`);
          }
        } catch {
          setPushStatus('error');
          addCaanMessage('NETWORK ANOMALY. The enhancement push could not be transmitted.');
          addLogEntry('ERROR', 'Enhancement push network error.');
        } finally {
          setIsLoading(false);
          setTimeout(() => setPushStatus('idle'), 5000);
        }
        break;
      }

      case 'debate': {
        setDebateActive(true);
        setDebateTopic(pendingMutation
          ? `Re-evaluating: ${pendingMutation.filePath.split('/').pop()} [risk ${pendingMutation.riskScore}/10]`
          : 'Convening debate chamber... All active agents assembled.');
        addCaanMessage('The Debate Chamber is now in session.\n\n8 agents deliberate:\n  • Humanist, Rationalist, Cooperator — ACTIVE\n  • Ethicist, Innovator, Empiricist — IDLE\n  • Chaotic, Skeptic — ACTIVE\n\nTheir consensus informs the Coherence Gate. But YOU have the final say, OPERATOR.');
        addLogEntry('SYSTEM', 'Debate Chamber activated. 5 of 8 agents active.');
        break;
      }

      case 'propose-batch-next': {
        if (!batchMode || batchQueue.length === 0) {
          setBatchMode(false);
          break;
        }
        const nextIndex = batchProgress;
        if (nextIndex >= batchQueue.length) {
          // Batch complete
          setBatchMode(false);
          setBatchQueue([]);
          setBatchProgress(0);
          addCaanMessage(`BATCH MODE COMPLETE, OPERATOR.\n\nAll ${batchQueue.length} code files have been processed.\n${mutationsApplied} mutations applied this session.\n\nEVOLUTION CYCLE COMPLETE. The timeline has been strengthened.`);
          addLogEntry('SYSTEM', `Batch mode complete. ${batchQueue.length} files processed.`);
          setDebateTopic('Batch evolution cycle complete.');
          break;
        }

        const targetFile = batchQueue[nextIndex];
        setSelectedFileIndex(scannedFiles.indexOf(targetFile));

        if (!apiKeys.github) {
          addCaanMessage('GitHub connection lost. Aborting batch mode.');
          setBatchMode(false);
          break;
        }

        setIsLoading(true);
        addSystemMessage(`BATCH [${nextIndex + 1}/${batchQueue.length}]: Analyzing ${targetFile.path}...`);

        try {
          const fileRes = await fetch('/api/github/read-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: apiKeys.github,
              owner: repoConfig.owner,
              repo: repoConfig.repo,
              branch: repoConfig.branch,
              path: targetFile.path,
            }),
          });
          const fileData = await fileRes.json();

          if (fileData.content) {
            const proposeRes = await fetch('/api/evolution/propose', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileContent: fileData.content,
                filePath: targetFile.path,
                rejectionMemory: rejectionMemory.length > 0 ? rejectionMemory.map(r => ({ filePath: r.filePath, reason: r.reason, analysis: r.analysis, riskScore: r.riskScore })) : undefined,
              }),
            });
            const proposeData = await proposeRes.json();

            if (proposeData.success) {
              const riskScore = Math.min(10, Math.max(1, proposeData.riskScore || 5));
              const riskLabel = riskScore <= 3 ? 'LOW' : riskScore <= 6 ? 'MEDIUM' : riskScore <= 8 ? 'HIGH' : 'CRITICAL';

              const newMutation: PendingMutation = {
                id: createId(),
                filePath: targetFile.path,
                fileSha: fileData.sha || '',
                originalContent: fileData.content,
                proposedCode: proposeData.proposedCode || fileData.content,
                analysis: proposeData.analysis || 'Analysis complete.',
                riskScore,
                affectedFiles: Array.isArray(proposeData.affectedFiles) ? proposeData.affectedFiles : [],
                status: 'pending',
                timestamp: new Date(),
              };
              setPendingMutation(newMutation);
              setBatchProgress(nextIndex + 1);

              addCaanMessage(
                `MUTATION PROPOSAL [${nextIndex + 1}/${batchQueue.length}] [${riskLabel} RISK]\n\n` +
                `File: ${targetFile.path}\n\n` +
                `Analysis:\n${proposeData.analysis}\n\n` +
                `Risk Score: ${riskScore}/10\n\n` +
                `─── BATCH MODE ───\n` +
                `YES = apply and continue | NO = skip and continue | ABORT = exit batch`
              );
              addLogEntry('MUTATE', `Batch [${nextIndex + 1}/${batchQueue.length}]: Proposed ${targetFile.path} (risk: ${riskLabel})`);
              setDebateActive(true);
              setDebateTopic(`Batch [${nextIndex + 1}/${batchQueue.length}]: ${targetFile.path.split('/').pop()} [${riskLabel} RISK]`);
            } else {
              addCaanMessage(`Batch [${nextIndex + 1}/${batchQueue.length}]: Analysis failed for ${targetFile.path}. Skipping...`);
              setBatchProgress(nextIndex + 1);
              addLogEntry('ERROR', `Batch analysis failed: ${targetFile.path}`);
              // Auto-continue to next file
              setTimeout(() => quickActionRef.current?.('propose-batch-next'), 500);
            }
          } else {
            addCaanMessage(`Batch [${nextIndex + 1}/${batchQueue.length}]: Could not read ${targetFile.path}. Skipping...`);
            setBatchProgress(nextIndex + 1);
            // Auto-continue to next file
            setTimeout(() => quickActionRef.current?.('propose-batch-next'), 500);
          }
        } catch {
          addCaanMessage('Network error during batch. ANOMALY DETECTED. Aborting batch mode.');
          addLogEntry('ERROR', 'Batch network error — aborting.');
          setBatchMode(false);
          setBatchQueue([]);
        } finally {
          setIsLoading(false);
        }
        break;
      }

      default:
        addCaanMessage(`Unknown action. Available: SCAN, ANALYZE, PROPOSE, SELECT ALL, HEALTH, SATURATION, DEBATE.`);
    }
  }, [systemState, isLoading, scannedFiles, pendingMutation, mutationsApplied, addCaanMessage, addLogEntry, addSystemMessage, batchMode, batchQueue, batchProgress, rejectionMemory]);

  // Store ref for batch continuation (breaks circular dependency)
  quickActionRef.current = handleQuickAction;

  // Boot screen
  if (booting) {
    return (
      <div
        className="min-h-screen flex items-center justify-center scanline-overlay radial-bg"
        style={{ background: COLORS.pureBlack }}
      >
        <div className="text-center">
          <pre
            className="ascii-box text-xs sm:text-sm boot-flicker"
            style={{ lineHeight: '1.4' }}
          >
            {bootText}
          </pre>
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="dalek-spinner">
              <div className="dalek-spinner-outer" />
              <div className="dalek-spinner-middle" />
              <div className="dalek-spinner-inner" />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontSize: '10px',
                color: COLORS.dalekRed,
                letterSpacing: '0.15em',
              }}
            >
              INITIALIZING COGNITIVE DOMINANCE ENGINE
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col scanline-overlay grid-overlay vignette"
      style={{ background: COLORS.pureBlack }}
    >
      {/* Header */}
      <header
        className="relative flex items-center justify-between px-4 sm:px-6 py-3 flex-shrink-0 header-scanline"
        style={{
          borderBottom: '1px solid rgba(255, 32, 32, 0.15)',
          background: 'linear-gradient(180deg, #0d0000 0%, #050000 80%, transparent 100%)',
        }}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Shield size={18} style={{ color: COLORS.dalekRed }} className="flex-shrink-0" />
            <h1
              className="title-glow hidden sm:block"
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontWeight: 800,
                fontSize: '16px',
                letterSpacing: '0.25em',
                color: COLORS.dalekRed,
              }}
            >
              DARLEK CANN AGI
            </h1>
            <span
              className="sm:hidden"
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontWeight: 800,
                fontSize: '12px',
                letterSpacing: '0.15em',
                color: COLORS.dalekRed,
              }}
            >
              DARLEK CANN
            </span>
          </div>
          <span
            className="hidden md:block"
            style={{
              fontSize: '9px',
              color: COLORS.gold,
              fontFamily: 'var(--font-orbitron), sans-serif',
              letterSpacing: '0.12em',
            }}
          >
            v3.0
          </span>
          <span
            className="hidden lg:block"
            style={{
              fontSize: '9px',
              color: COLORS.textMuted,
              fontFamily: 'var(--font-orbitron), sans-serif',
              letterSpacing: '0.1em',
            }}
          >
            · COGNITIVE DOMINANCE ENGINE
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {mutationsApplied > 0 && (
            <div className="hidden sm:flex items-center gap-1.5">
              <Dna size={10} style={{ color: COLORS.green }} />
              <span style={{ fontSize: '8px', color: COLORS.green, fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.08em' }}>
                {mutationsApplied} MUTATED
              </span>
            </div>
          )}
          {pendingMutation && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full pulse-gold" style={{ background: COLORS.gold }} />
              <span style={{ fontSize: '8px', color: COLORS.gold, fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.08em' }}>
                PENDING
              </span>
            </div>
          )}
          <div className="hidden md:flex items-center gap-2">
            <Zap size={11} style={{ color: COLORS.gold }} />
            <span style={{ fontSize: '8px', color: COLORS.gold, fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.1em' }}>
              TIMELINE: ALPHA
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${systemState.setupComplete ? 'pulse-cyan' : 'pulse-red'}`}
              style={{ background: systemState.setupComplete ? COLORS.cyan : COLORS.dalekRed }}
            />
            <span
              style={{
                fontSize: '8px',
                color: systemState.setupComplete ? COLORS.cyan : COLORS.dalekRed,
                fontFamily: 'var(--font-orbitron), sans-serif',
                letterSpacing: '0.1em',
              }}
            >
              {systemState.setupComplete ? 'OPERATIONAL' : 'SETUP MODE'}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left panel: Chat */}
        <div className="w-full lg:w-[480px] flex-shrink-0 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 min-h-0">
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                systemState={systemState}
                onTestConnection={handleTestConnection}
                onUpdateKey={handleUpdateKey}
                onUpdateRepoConfig={handleUpdateRepoConfig}
                branches={branches}
                branchesLoading={branchesLoading}
                onFetchBranches={handleFetchBranches}
              />
            </div>
            {pendingMutation && systemState.setupComplete && (
              <div className="flex-shrink-0 overflow-y-auto dalek-scrollbar" style={{ maxHeight: '40vh' }}>
                <MutationDiffView
                  mutation={pendingMutation}
                  onApprove={() => handleMutationDecision('approve')}
                  onReject={() => handleMutationDecision('reject')}
                  disabled={isLoading}
                />
              </div>
            )}
            {systemState.setupComplete && (
              <QuickActions onAction={handleQuickAction} disabled={isLoading} pushStatus={pushStatus} deployStatus={deployStatus} batchMode={batchMode} />
            )}
          </div>
        </div>

        {/* Right panel: Dashboard */}
        <div className="flex-1 min-h-0 p-3">
          <DashboardPanel
            systemState={systemState}
            logEntries={logEntries}
            overallHealth={overallHealth}
            debateAgents={debateAgents}
            debateTopic={debateTopic}
            debateActive={debateActive}
            debateVotes={debateVotes}
            debateConsensus={debateConsensus}
            rejectionCount={rejectionMemory.length}
            brainSessionId={brainSessionId}
            historyRefreshTrigger={historyRefreshTrigger}
          />
        </div>
      </main>

      {/* Footer */}
      <footer
        className="px-4 sm:px-6 py-2 flex items-center justify-between flex-shrink-0"
        style={{
          borderTop: '1px solid rgba(255, 32, 32, 0.1)',
          background: '#030000',
        }}
      >
        <div className="flex items-center gap-2">
          <Shield size={10} style={{ color: '#555' }} />
          <span style={{ fontSize: '8px', color: COLORS.textMuted, fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.1em' }}>
            DARLEK CANN AGI v3.0
          </span>
          {mutationsApplied > 0 && (
            <span style={{ fontSize: '8px', color: COLORS.green, fontFamily: 'var(--font-share-tech-mono), monospace' }}>
              · {mutationsApplied} mutations applied
            </span>
          )}
        </div>
        <span style={{ fontSize: '8px', color: '#666', fontFamily: 'var(--font-share-tech-mono), monospace' }}>
          craighckby-stack © {new Date().getFullYear()}
        </span>
      </footer>

      <div ref={messagesEndRef} />
    </div>
  );
}

// Import Dna icon for header
function Dna({ size, style }: { size: number; style: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M2 15c6.667-6 13.333 0 20-6" />
      <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
      <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
      <path d="M17 6l-2.5-2.5" />
      <path d="M14 8l-1-1" />
      <path d="M7 18l2.5 2.5" />
      <path d="M3.5 14.5l.5.5" />
      <path d="M20 9l.5.5" />
      <path d="M6.5 12.5l1 1" />
      <path d="M16.5 10.5l1 1" />
      <path d="M10 16l1.5 1.5" />
    </svg>
  );
}
