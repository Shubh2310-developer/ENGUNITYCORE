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
    <div className="h-full flex flex-col bg-[#F8FAFC] text-[#1E293B] text-sm shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.02)]">
      <div className="px-3 py-2 border-b border-[#CBD5E1] flex items-center justify-end gap-2 bg-[#F1F5F9]">
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="bg-white border border-[#CBD5E1] rounded text-[10px] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/10 font-bold uppercase transition-all"
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="go">Go</option>
        </select>
        <button
          onClick={runTests}
          disabled={isRunning}
          className={`p-1.5 bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-md transition-all shadow-sm active:scale-95 disabled:opacity-40 ${isRunning ? 'animate-pulse' : ''}`}
          title="Run Tests"
        >
          <Play className="w-3 h-3 fill-current" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        {results ? (
          <div className="p-4 space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold uppercase tracking-tight">
              <div className="p-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] shadow-sm">
                <div className="text-[#64748B] mb-1">Total</div>
                <div className="font-mono text-base text-[#0F172A]">{results.total}</div>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 shadow-sm">
                <div className="text-emerald-600 mb-1">Passed</div>
                <div className="font-mono text-base text-emerald-700">{results.passed}</div>
              </div>
              <div className="p-2 bg-red-50 rounded-lg border border-red-100 shadow-sm">
                <div className="text-red-600 mb-1">Failed</div>
                <div className="font-mono text-base text-red-700">{results.failed}</div>
              </div>
              <div className="p-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] shadow-sm">
                <div className="text-[#64748B] mb-1">Time</div>
                <div className="font-mono text-base text-[#0F172A]">{results.duration.toFixed(1)}s</div>
              </div>
            </div>

            {/* Test List */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Test Results</div>
              {results.results.length === 0 && (
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] text-center py-6 opacity-50 bg-[#F8FAFC] rounded-lg border border-dashed border-[#E2E8F0]">No results parsed</div>
              )}
              <div className="space-y-1">
                {results.results.map((test, i) => (
                  <div key={i} className="border border-[#E2E8F0] rounded-lg overflow-hidden shadow-sm hover:border-[#CBD5E1] transition-colors">
                    <div className="flex items-center gap-2 p-2 bg-[#F8FAFC] text-[11px]">
                      {test.status === 'passed' && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                      {test.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                      {test.status === 'skipped' && <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                      <span className="flex-1 font-mono font-bold text-[#1E293B] truncate">{test.name}</span>
                      <span className="flex items-center gap-1 text-[#94A3B8] font-bold">
                        <Clock className="w-3 h-3" />
                        {test.duration.toFixed(3)}s
                      </span>
                    </div>
                    {test.message && (
                      <div className="p-3 bg-white border-t border-[#E2E8F0] text-[11px] font-mono text-red-600 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                        {test.message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Output Log */}
            {results.output && (
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Full Console Output</div>
                <pre className="p-3 bg-[#0F172A] rounded-lg text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-lg border border-white/5">
                  {results.output}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-[#94A3B8] p-8 text-center bg-[#F8FAFC]/50">
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4 border border-[#E2E8F0] shadow-sm">
              <Beaker className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-60">Ready to test</p>
            <p className="text-[10px] mt-2 leading-relaxed px-4">Select your project language and click run to execute the test suite.</p>
          </div>
        )}
      </div>
    </div>
  );
};
