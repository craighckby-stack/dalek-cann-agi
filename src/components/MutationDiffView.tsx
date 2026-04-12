'use client';

import { useState } from 'react';
import type { PendingMutation } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import { FileCode, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle, Zap } from 'lucide-react';

interface MutationDiffViewProps {
  mutation: PendingMutation;
  onApprove: () => void;
  onReject: () => void;
  disabled: boolean;
  autoApprove?: boolean;
  onToggleAutoApprove?: () => void;
  batchMode?: boolean;
}

export default function MutationDiffView({ mutation, onApprove, onReject, disabled, autoApprove, onToggleAutoApprove, batchMode }: MutationDiffViewProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [showProposed, setShowProposed] = useState(false);

  const riskLabel = mutation.riskScore <= 3 ? 'LOW' : mutation.riskScore <= 6 ? 'MEDIUM' : mutation.riskScore <= 8 ? 'HIGH' : 'CRITICAL';
  const riskColor = mutation.riskScore <= 3 ? COLORS.cyan : mutation.riskScore <= 6 ? COLORS.gold : mutation.riskScore <= 8 ? COLORS.dalekRed : '#ff0040';

  const truncate = (code: string, maxLines: number = 20) => {
    const lines = code.split('\n');
    if (lines.length <= maxLines) return code;
    return lines.slice(0, maxLines).join('\n') + `\n\n... (${lines.length - maxLines} more lines)`;
  };

  const originalSize = (mutation.originalContent.length / 1024).toFixed(1);
  const proposedSize = (mutation.proposedCode.length / 1024).toFixed(1);
  const sizeDiff = mutation.originalContent.length > 0
    ? ((mutation.proposedCode.length - mutation.originalContent.length) / mutation.originalContent.length * 100).toFixed(0)
    : '0';
  const sizeDiffSign = mutation.proposedCode.length > mutation.originalContent.length ? '+' : '';

  return (
    <div
      className="space-y-3 p-4 mx-3 mb-3 rounded-lg"
      style={{
        background: 'linear-gradient(135deg, rgba(185, 28, 28, 0.05) 0%, rgba(212, 160, 23, 0.03) 100%)',
        border: `1px solid ${riskColor}25`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} style={{ color: riskColor }} />
          <span
            style={{
              fontFamily: 'var(--font-orbitron), sans-serif',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: riskColor,
            }}
          >
            MUTATION PROPOSAL [{riskLabel}]
          </span>
        </div>
        <span
          style={{
            fontSize: '8px',
            color: COLORS.textMuted,
            fontFamily: 'var(--font-share-tech-mono), monospace',
          }}
        >
          Risk: {mutation.riskScore}/10
        </span>
      </div>

      {/* File info */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-sm" style={{ background: '#161616' }}>
        <FileCode size={11} style={{ color: COLORS.gold }} />
        <span style={{ fontSize: '10px', color: COLORS.gold, fontFamily: 'var(--font-share-tech-mono), monospace' }}>
          {mutation.filePath}
        </span>
        <span className="ml-auto" style={{ fontSize: '9px', color: COLORS.textMuted }}>
          {originalSize}KB → {proposedSize}KB ({sizeDiffSign}{sizeDiff}%)
        </span>
      </div>

      {/* Analysis */}
      <div className="px-3 py-2 rounded-sm" style={{ background: '#060606' }}>
        <span
          style={{
            display: 'block',
            fontSize: '8px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-orbitron), sans-serif',
            color: COLORS.textMuted,
            marginBottom: '6px',
          }}
        >
          ANALYSIS
        </span>
        <p style={{ fontSize: '11px', color: COLORS.textDim, lineHeight: 1.5, fontFamily: 'var(--font-share-tech-mono), monospace' }}>
          {mutation.analysis}
        </p>
      </div>

      {/* Affected files */}
      {mutation.affectedFiles.length > 0 && (
        <div className="px-3 py-2 rounded-sm" style={{ background: '#060606' }}>
          <span
            style={{
              display: 'block',
              fontSize: '8px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              fontFamily: 'var(--font-orbitron), sans-serif',
              color: COLORS.gold,
              marginBottom: '4px',
            }}
          >
            AFFECTED FILES ({mutation.affectedFiles.length})
          </span>
          {mutation.affectedFiles.map((f) => (
            <div key={f} style={{ fontSize: '10px', color: COLORS.textDim, fontFamily: 'var(--font-share-tech-mono), monospace' }}>
              • {f}
            </div>
          ))}
        </div>
      )}

      {/* Original code toggle */}
      <div>
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-sm"
          style={{
            background: '#161616',
            border: '1px solid rgba(255, 32, 32, 0.08)',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '9px', color: COLORS.dalekRed, fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.08em' }}>
            ORIGINAL CODE
          </span>
          {showOriginal ? <ChevronUp size={12} style={{ color: COLORS.textMuted }} /> : <ChevronDown size={12} style={{ color: COLORS.textMuted }} />}
        </button>
        {showOriginal && (
          <pre
            className="px-3 py-2 mt-1 rounded-sm overflow-x-auto dalek-scrollbar"
            style={{
              fontSize: '10px',
              color: COLORS.textDim,
              background: '#111111',
              fontFamily: 'var(--font-share-tech-mono), monospace',
              lineHeight: 1.4,
              maxHeight: '300px',
              overflow: 'auto',
              border: '1px solid rgba(255, 32, 32, 0.06)',
            }}
          >
            {truncate(mutation.originalContent, 50)}
          </pre>
        )}
      </div>

      {/* Proposed code toggle */}
      <div>
        <button
          onClick={() => setShowProposed(!showProposed)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-sm"
          style={{
            background: '#161616',
            border: '1px solid rgba(0, 255, 204, 0.08)',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '9px', color: COLORS.cyan, fontFamily: 'var(--font-orbitron), sans-serif', letterSpacing: '0.08em' }}>
            PROPOSED CODE
          </span>
          {showProposed ? <ChevronUp size={12} style={{ color: COLORS.textMuted }} /> : <ChevronDown size={12} style={{ color: COLORS.textMuted }} />}
        </button>
        {showProposed && (
          <pre
            className="px-3 py-2 mt-1 rounded-sm overflow-x-auto dalek-scrollbar"
            style={{
              fontSize: '10px',
              color: '#e0e0e0',
              background: '#111111',
              fontFamily: 'var(--font-share-tech-mono), monospace',
              lineHeight: 1.4,
              maxHeight: '300px',
              overflow: 'auto',
              border: '1px solid rgba(0, 255, 204, 0.06)',
            }}
          >
            {truncate(mutation.proposedCode, 50)}
          </pre>
        )}
      </div>

      {/* Auto-approve checkbox — only visible in batch mode */}
      {batchMode && onToggleAutoApprove && (
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-sm"
          style={{
            background: autoApprove ? 'rgba(0, 255, 204, 0.06)' : 'rgba(20, 10, 10, 0.8)',
            border: `1px solid ${autoApprove ? 'rgba(0, 255, 204, 0.25)' : 'rgba(255, 102, 0, 0.15)'}`,
          }}
        >
          <button
            onClick={onToggleAutoApprove}
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '3px',
              background: autoApprove ? COLORS.cyan : 'transparent',
              border: `2px solid ${autoApprove ? COLORS.cyan : COLORS.textMuted}`,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {autoApprove && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Zap size={12} style={{ color: autoApprove ? COLORS.cyan : '#ff6600' }} />
            <span
              style={{
                fontFamily: 'var(--font-orbitron), sans-serif',
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: autoApprove ? COLORS.cyan : '#ff6600',
              }}
            >
              AUTO APPROVE ALL
            </span>
          </div>
          {autoApprove && (
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: COLORS.cyan }}
            />
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onReject}
          disabled={disabled || (batchMode && autoApprove)}
          className="dalek-btn dalek-btn-red flex-1 px-4 py-2.5 text-xs flex items-center justify-center gap-2"
          style={{
            opacity: batchMode && autoApprove ? 0.3 : 1,
          }}
        >
          <XCircle size={13} />
          {batchMode && autoApprove ? 'AUTO' : 'REJECT'}
        </button>
        <button
          onClick={onApprove}
          disabled={disabled || (batchMode && autoApprove)}
          className="dalek-btn dalek-btn-green flex-1 px-4 py-2.5 text-xs flex items-center justify-center gap-2"
          style={{
            opacity: batchMode && autoApprove ? 0.3 : 1,
          }}
        >
          <CheckCircle size={13} />
          {batchMode && autoApprove ? 'AUTO' : 'APPROVE'}
        </button>
      </div>
    </div>
  );
}
