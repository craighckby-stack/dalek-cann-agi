import { NextRequest, NextResponse } from 'next/server';
import type { ProposeBody } from '@/lib/types';

/**
 * DARLEK CANN — Mutation Proposal Engine
 *
 * Rule-based code analysis. No external LLM dependency.
 * Analyzes code structure, detects patterns, and proposes improvements.
 */

interface CodeMetrics {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  functions: number;
  classes: number;
  exports: number;
  imports: number;
  avgFunctionLength: number;
  hasErrorHandling: boolean;
  hasTypes: boolean;
  complexity: number;
}

function analyzeCode(code: string, filePath: string): CodeMetrics {
  const lines = code.split('\n');
  const totalLines = lines.length;
  const blankLines = lines.filter(l => l.trim() === '').length;
  const commentLines = lines.filter(l => l.trim().startsWith('//') || l.trim().startsWith('*') || l.trim().startsWith('/*') || l.trim().startsWith('#')).length;
  const codeLines = totalLines - blankLines - commentLines;

  const functions = [...code.matchAll(/(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?function)/g)].length;
  const classes = [...code.matchAll(/class\s+\w+/g)].length;
  const exports = [...code.matchAll(/export\s+(?:default\s+)?(?:function|class|const|let|var|type|interface|enum)/g)].length;
  const imports = [...code.matchAll(/import\s+/g)].length;
  const hasTypes = /\b(type|interface|enum|:)\s*\w/.test(code);
  const hasErrorHandling = /try\s*\{/.test(code) || /catch\s*\(/.test(code) || /\.catch\s*\(/.test(code);

  // Simple complexity estimation
  const branching = [...code.matchAll(/\b(if|else|for|while|switch|case|catch|\?\?|\?\.|\?[^.])/g)].length;
  const complexity = Math.min(10, Math.max(1, Math.round(branching / Math.max(1, functions) * 2 + (hasErrorHandling ? 0 : 1))));

  // Average function length
  const funcBlocks = code.split(/(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|(?:function\s*\w*\s*\([^)]*\))))/);
  const funcLengths = funcBlocks.map(b => b.split('\n').length).filter(l => l > 2 && l < 200);
  const avgFunctionLength = funcLengths.length > 0 ? Math.round(funcLengths.reduce((a, b) => a + b, 0) / funcLengths.length) : 0;

  return { totalLines, codeLines, commentLines, blankLines, functions, classes, exports, imports, hasErrorHandling, hasTypes, complexity, avgFunctionLength };
}

function detectIssues(metrics: CodeMetrics, filePath: string): Array<{ issue: string; severity: 'low' | 'medium' | 'high' }> {
  const issues: Array<{ issue: string; severity: 'low' | 'medium' | 'high' }> = [];

  if (metrics.avgFunctionLength > 40) {
    issues.push({ issue: `Average function length is ${metrics.avgFunctionLength} lines. Consider breaking large functions into smaller, focused units.`, severity: 'medium' });
  } else if (metrics.avgFunctionLength > 25) {
    issues.push({ issue: `Average function length is ${metrics.avgFunctionLength} lines. Some functions may benefit from being split.`, severity: 'low' });
  }

  if (!metrics.hasErrorHandling) {
    issues.push({ issue: 'No error handling detected. Add try/catch blocks or .catch() handlers for robustness.', severity: 'high' });
  }

  if (metrics.complexity > 7) {
    issues.push({ issue: `Cyclomatic complexity estimated at ${metrics.complexity}/10. Consider simplifying control flow.`, severity: 'medium' });
  }

  if (metrics.commentLines / Math.max(1, metrics.totalLines) < 0.03) {
    issues.push({ issue: 'Very few comments. Add documentation for complex logic and public APIs.', severity: 'low' });
  }

  if (metrics.totalLines > 300) {
    issues.push({ issue: `File is ${metrics.totalLines} lines. Consider splitting into smaller modules.`, severity: 'medium' });
  }

  if (metrics.imports > 15) {
    issues.push({ issue: `${metrics.imports} imports detected. High coupling — consider reducing dependencies.`, severity: 'low' });
  }

  if (!metrics.hasTypes && /\.(ts|tsx)$/.test(filePath)) {
    issues.push({ issue: 'TypeScript file lacks type annotations. Add proper types for better safety.', severity: 'medium' });
  }

  return issues;
}

function proposeImprovements(code: string, metrics: CodeMetrics, issues: Array<{ issue: string; severity: string }>, filePath: string): string {
  const improvements: string[] = [];

  // Add error handling if missing
  if (!metrics.hasErrorHandling && (metrics.functions > 0 || metrics.classes > 0)) {
    improvements.push('Add comprehensive error handling with try/catch blocks');
  }

  if (metrics.avgFunctionLength > 30) {
    improvements.push('Refactor large functions into smaller, single-purpose helpers');
  }

  if (metrics.complexity > 6) {
    improvements.push('Simplify control flow — reduce nested conditionals');
  }

  if (metrics.commentLines < 3) {
    improvements.push('Add JSDoc comments to public functions and complex logic');
  }

  if (metrics.totalLines > 300) {
    improvements.push('Consider splitting this file into focused modules');
  }

  if (!metrics.hasTypes && /\.(ts|tsx)$/.test(filePath)) {
    improvements.push('Strengthen TypeScript typing — replace implicit any with explicit types');
  }

  if (improvements.length === 0) {
    improvements.push('Code structure appears clean. Consider adding unit tests if not present.');
  }

  return improvements.join('. ') + '.';
}

function calculateRiskScore(metrics: CodeMetrics, issues: Array<{ issue: string; severity: string }>, filePath: string): number {
  let risk = 1;

  // Larger files = more risk to modify
  if (metrics.totalLines > 500) risk += 2;
  else if (metrics.totalLines > 200) risk += 1;

  // More exports = wider impact
  if (metrics.exports > 5) risk += 2;
  else if (metrics.exports > 2) risk += 1;

  // More imports = more dependencies
  if (metrics.imports > 10) risk += 1;

  // High complexity = more fragile
  if (metrics.complexity > 7) risk += 2;
  else if (metrics.complexity > 4) risk += 1;

  // Missing error handling = risky to modify
  if (!metrics.hasErrorHandling) risk += 1;

  return Math.min(10, Math.max(1, risk));
}

function detectAffectedFiles(code: string, imports: string[], filePath: string): string[] {
  const affected: string[] = [];

  // Map imports to potential file paths
  for (const imp of imports.slice(0, 10)) {
    if (imp.startsWith('.') || imp.startsWith('@/')) {
      const cleaned = imp.replace(/['"]/g, '');
      const tsPath = cleaned.replace(/\.(ts|tsx|js|jsx)$/, '');
      if (!affected.includes(tsPath)) affected.push(tsPath);
    }
  }

  return affected.slice(0, 5);
}

export async function POST(req: NextRequest) {
  try {
    const body: ProposeBody = await req.json();
    const { fileContent, filePath, rejectionMemory } = body;

    if (!fileContent || !filePath) {
      return NextResponse.json({ error: 'File content and path are required.' }, { status: 400 });
    }

    // Analyze code structure
    const metrics = analyzeCode(fileContent, filePath);
    const issues = detectIssues(metrics, filePath);
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    const lowIssues = issues.filter(i => i.severity === 'low').length;

    // Build analysis
    const analysis = buildAnalysis(filePath, metrics, issues, rejectionMemory);
    const improvements = proposeImprovements(fileContent, metrics, issues, filePath);
    const riskScore = calculateRiskScore(metrics, issues, filePath);

    // Detect affected files from imports
    const importPaths = [...fileContent.matchAll(/import\s+.*?from\s+['"](.+?)['"]/g)].map(m => m[1]);
    const affectedFiles = detectAffectedFiles(fileContent, importPaths, filePath);

    console.log(`[Propose] Analysis complete: ${metrics.totalLines} lines, ${metrics.functions} functions, risk ${riskScore}/10`);

    return NextResponse.json({
      analysis,
      proposedCode: fileContent, // Rule-based engine doesn't rewrite — analysis only
      riskScore,
      affectedFiles,
      success: true,
      provider: 'Dalek-Brain',
      metrics: {
        totalLines: metrics.totalLines,
        functions: metrics.functions,
        classes: metrics.classes,
        complexity: metrics.complexity,
        avgFunctionLength: metrics.avgFunctionLength,
        hasErrorHandling: metrics.hasErrorHandling,
        hasTypes: metrics.hasTypes,
      },
    });
  } catch (error) {
    console.error('Propose mutation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { analysis: '', proposedCode: '', riskScore: 0, affectedFiles: [], success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

function buildAnalysis(filePath: string, metrics: CodeMetrics, issues: Array<{ issue: string; severity: string }>, rejectionMemory?: Array<{ filePath: string; reason: string; analysis: string; riskScore: number }>): string {
  const parts: string[] = [];

  parts.push(`FILE: ${filePath}`);
  parts.push(`Structure: ${metrics.totalLines} lines (${metrics.codeLines} code, ${metrics.commentLines} comments, ${metrics.blankLines} blank)`);
  parts.push(`Composition: ${metrics.functions} functions, ${metrics.classes} classes, ${metrics.exports} exports, ${metrics.imports} imports`);
  parts.push(`Complexity: ${metrics.complexity}/10 | Avg function length: ${metrics.avgFunctionLength} lines`);
  parts.push(`Error handling: ${metrics.hasErrorHandling ? 'DETECTED' : 'MISSING'} | Type safety: ${metrics.hasTypes ? 'DETECTED' : 'WEAK'}`);

  if (issues.length > 0) {
    parts.push(`\nISSUES DETECTED (${issues.length}):`);
    issues.forEach((iss, i) => {
      parts.push(`  ${i + 1}. [${iss.severity.toUpperCase()}] ${iss.issue}`);
    });
  } else {
    parts.push('\nNo significant issues detected.');
  }

  if (rejectionMemory && rejectionMemory.length > 0) {
    parts.push(`\nREJECTION MEMORY: ${rejectionMemory.length} previous rejection(s) on record. Approaching conservatively.`);
  }

  return parts.join('\n');
}
