import React, { useState } from 'react';
import { useCodeStore } from '@/stores/codeStore';
import { Beaker, Play, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number;
  message?: string;
  traceback?: string;
}

interface TestSuiteResult {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
  output: string;
}

export const TestRunner = () => {
  const { files } = useCodeStore();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestSuiteResult | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('python');

  const runTests = async () => {
    setIsRunning(true);
    try {
      // In a real app, projectId would come from context
      const projectId = 'default-project';

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/testing/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          language: selectedLanguage
        })
      });

      if (!response.ok) {
        throw new Error('Test run failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Test execution error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-void-950 text-starlight-400 text-sm">
      <div className="p-3 font-semibold text-xs uppercase tracking-wider border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Beaker className="w-4 h-4" />
          Test Runner
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-void-900 border border-white/10 rounded text-xs px-2 py-1 focus:outline-none"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="go">Go</option>
          </select>
          <button
            onClick={runTests}
            disabled={isRunning}
            className={`p-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded transition-colors disabled:opacity-50 ${isRunning ? 'animate-pulse' : ''}`}
            title="Run Tests"
          >
            <Play className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {results ? (
          <div className="p-4 space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-void-900 rounded border border-white/5">
                <div className="text-starlight-400/60 mb-1">Total</div>
                <div className="font-mono text-lg text-starlight-100">{results.total}</div>
              </div>
              <div className="p-2 bg-green-500/10 rounded border border-green-500/20">
                <div className="text-green-400/60 mb-1">Passed</div>
                <div className="font-mono text-lg text-green-400">{results.passed}</div>
              </div>
              <div className="p-2 bg-red-500/10 rounded border border-red-500/20">
                <div className="text-red-400/60 mb-1">Failed</div>
                <div className="font-mono text-lg text-red-400">{results.failed}</div>
              </div>
              <div className="p-2 bg-void-900 rounded border border-white/5">
                <div className="text-starlight-400/60 mb-1">Duration</div>
                <div className="font-mono text-lg text-starlight-100">{results.duration.toFixed(2)}s</div>
              </div>
            </div>

            {/* Test List */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-starlight-400/60">Test Results</div>
              {results.results.length === 0 && (
                <div className="text-xs italic text-starlight-400/40 text-center py-4">No individual test results parsed</div>
              )}
              {results.results.map((test, i) => (
                <div key={i} className="border border-white/5 rounded overflow-hidden">
                  <div className="flex items-center gap-2 p-2 bg-void-900 text-xs">
                    {test.status === 'passed' && <CheckCircle className="w-3 h-3 text-green-500" />}
                    {test.status === 'failed' && <XCircle className="w-3 h-3 text-red-500" />}
                    {test.status === 'skipped' && <AlertCircle className="w-3 h-3 text-yellow-500" />}
                    <span className="flex-1 font-mono text-starlight-200 truncate">{test.name}</span>
                    <span className="flex items-center gap-1 text-starlight-400/50">
                      <Clock className="w-3 h-3" />
                      {test.duration.toFixed(3)}s
                    </span>
                  </div>
                  {test.message && (
                    <div className="p-2 bg-void-950 border-t border-white/5 text-xs font-mono text-red-400 whitespace-pre-wrap overflow-x-auto">
                      {test.message}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Output Log */}
            {results.output && (
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-starlight-400/60">Console Output</div>
                <pre className="p-3 bg-void-900 rounded text-[10px] font-mono text-starlight-300 overflow-x-auto whitespace-pre-wrap">
                  {results.output}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-starlight-400/40 p-4 text-center">
            <Beaker className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-xs">Run tests to see results here</p>
          </div>
        )}
      </div>
    </div>
  );
};
