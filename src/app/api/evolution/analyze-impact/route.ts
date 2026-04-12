import { NextRequest, NextResponse } from 'next/server';

/**
 * DARLEK CANN — Impact Analysis Engine
 *
 * Pure static analysis. No external LLM dependency.
 * Detects structural changes between original and proposed code.
 */

interface AnalyzeImpactBody {
  originalCode: string;
  proposedCode: string;
  filePath: string;
  riskScore: number;
}

function detectStaticIssues(originalCode: string, proposedCode: string, filePath: string): Array<{ type: string; severity: 'high' | 'medium' | 'low'; message: string }> {
  const issues: Array<{ type: string; severity: 'high' | 'medium' | 'low'; message: string }> = [];

  // Check for removed exports
  const originalExports = [...originalCode.matchAll(/export\s+(?:default\s+)?(?:function|class|const|let|var|type|interface|enum)\s+(\w+)/g)].map(m => m[1]);
  const proposedExports = [...proposedCode.matchAll(/export\s+(?:default\s+)?(?:function|class|const|let|var|type|interface|enum)\s+(\w+)/g)].map(m => m[1]);
  const removedExports = originalExports.filter(e => !proposedExports.includes(e));
  if (removedExports.length > 0) {
    issues.push({ type: 'REMOVED_EXPORT', severity: 'high', message: `Export(s) removed: ${removedExports.join(', ')}. Other files may import these.` });
  }

  // Check for removed function/class definitions that are not exports
  const originalFuncs = [...originalCode.matchAll(/(?:function|class)\s+(\w+)/g)].map(m => m[1]);
  const proposedFuncs = [...proposedCode.matchAll(/(?:function|class)\s+(\w+)/g)].map(m => m[1]);
  const removedFuncs = originalFuncs.filter(f => !proposedFuncs.includes(f) && !removedExports.includes(f));
  if (removedFuncs.length > 0) {
    issues.push({ type: 'REMOVED_DEFINITION', severity: 'medium', message: `Function/class removed: ${removedFuncs.join(', ')}. May be referenced internally.` });
  }

  // Check for import changes
  const originalImports = [...originalCode.matchAll(/import\s+.*?from\s+['"](.+?)['"]/g)].map(m => m[1]);
  const proposedImports = [...proposedCode.matchAll(/import\s+.*?from\s+['"](.+?)['"]/g)].map(m => m[1]);
  const newImports = proposedImports.filter(i => !originalImports.includes(i));
  const removedImports = originalImports.filter(i => !proposedImports.includes(i));
  if (removedImports.length > 0) {
    issues.push({ type: 'REMOVED_IMPORT', severity: 'medium', message: `Import(s) removed: ${removedImports.join(', ')}. Code may use these modules.` });
  }
  if (newImports.length > 0) {
    issues.push({ type: 'NEW_IMPORT', severity: 'low', message: `New import(s): ${newImports.join(', ')}. Ensure these packages are available.` });
  }

  // Check for significant size changes (>50% increase or decrease)
  const sizeChange = (proposedCode.length - originalCode.length) / Math.max(1, originalCode.length);
  if (Math.abs(sizeChange) > 0.5) {
    const direction = sizeChange > 0 ? 'increased' : 'decreased';
    issues.push({ type: 'SIZE_CHANGE', severity: 'low', message: `File size ${direction} by ${Math.abs(Math.round(sizeChange * 100))}%. ${sizeChange < 0 ? 'May indicate removed functionality.' : 'May indicate added complexity.'}` });
  }

  // Check for TODO/FIXME/HACK comments
  const newTodos = [...proposedCode.matchAll(/\/\/\s*(TODO|FIXME|HACK|XXX|BUG)[^\n]*/gi)].map(m => m[0]);
  if (newTodos.length > 0) {
    issues.push({ type: 'NEW_TODO', severity: 'low', message: `${newTodos.length} TODO/FIXME comment(s) found in proposed code.` });
  }

  // Check for console.log statements (potential debug leftover)
  const newConsoleLogs = [...proposedCode.matchAll(/console\.(log|debug|info)\s*\(/g)].length;
  const origConsoleLogs = [...originalCode.matchAll(/console\.(log|debug|info)\s*\(/g)].length;
  if (newConsoleLogs > origConsoleLogs) {
    issues.push({ type: 'DEBUG_CODE', severity: 'low', message: `${newConsoleLogs - origConsoleLogs} new console.log/debug call(s) added. May be debug leftovers.` });
  }

  // Check for 'any' type usage increase (TypeScript)
  const newAny = [...proposedCode.matchAll(/:\s*any\b/g)].length;
  const origAny = [...originalCode.matchAll(/:\s*any\b/g)].length;
  if (newAny > origAny) {
    issues.push({ type: 'TYPE_SAFETY', severity: 'medium', message: `${newAny - origAny} new 'any' type usage(s). Type safety reduced.` });
  }

  // Check for try/catch removal
  const origTryCatch = [...originalCode.matchAll(/try\s*\{/g)].length;
  const propTryCatch = [...proposedCode.matchAll(/try\s*\{/g)].length;
  if (propTryCatch < origTryCatch) {
    issues.push({ type: 'ERROR_HANDLING', severity: 'high', message: `${origTryCatch - propTryCatch} try/catch block(s) removed. Error handling weakened.` });
  }

  // Check for default parameter removal
  const origDefaults = [...originalCode.matchAll(/=\s*[^,)]+\)/g)].length;
  const propDefaults = [...proposedCode.matchAll(/=\s*[^,)]+\)/g)].length;
  if (propDefaults < origDefaults - 2) {
    issues.push({ type: 'API_CHANGE', severity: 'medium', message: 'Default parameters may have been removed. Check function signatures.' });
  }

  // Check for async keyword changes
  const origAsync = [...originalCode.matchAll(/async\s+/g)].length;
  const propAsync = [...proposedCode.matchAll(/async\s+/g)].length;
  if (Math.abs(origAsync - propAsync) > 0) {
    issues.push({ type: 'ASYNC_CHANGE', severity: 'medium', message: `Async function count changed (${origAsync} → ${propAsync}). Verify call sites handle promises.` });
  }

  return issues;
}

function buildResponse(staticIssues: Array<{ type: string; severity: string; message: string }>) {
  const highCount = staticIssues.filter(i => i.severity === 'high').length;
  const mediumCount = staticIssues.filter(i => i.severity === 'medium').length;
  const lowCount = staticIssues.filter(i => i.severity === 'low').length;

  const analysisText = staticIssues.length > 0
    ? staticIssues.map(i => `[${i.severity.toUpperCase()}] ${i.message}`).join('\n')
    : 'No structural issues detected. Mutation appears safe from a static analysis perspective.';

  return NextResponse.json({
    success: true,
    staticIssues,
    llmAnalysis: analysisText,
    llmProvider: 'Static-Analysis',
    totalIssues: staticIssues.length,
    highSeverity: highCount,
    mediumSeverity: mediumCount,
    lowSeverity: lowCount,
    overallRisk: highCount > 0 ? 'HIGH' : mediumCount > 2 ? 'MEDIUM' : 'LOW',
    summary: `Static analysis: ${staticIssues.length} issues (${highCount} high, ${mediumCount} medium, ${lowCount} low). Pure deterministic analysis — no LLM dependency.`,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeImpactBody = await req.json();
    const { originalCode, proposedCode, filePath } = body;

    if (!originalCode || !proposedCode || !filePath) {
      return NextResponse.json({ error: 'originalCode, proposedCode, and filePath required.' }, { status: 400 });
    }

    // Full static analysis
    const staticIssues = detectStaticIssues(originalCode, proposedCode, filePath);

    return buildResponse(staticIssues);

  } catch (error) {
    console.error('Analyze impact error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
