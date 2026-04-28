"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export interface AnalysisData {
  fileInfo?: {
    name?: string;
    size?: string;
    rows?: number;
    columns?: number;
    uploadDate?: string;
  };
  dataSummary?: Record<string, any>;
  columnMetadata?: unknown[];
  dataPreview?: unknown;
  chartsData?: unknown;
  correlationData?: Record<string, any>;
  queryHistory?: unknown[];
  aiInsights?: unknown[];
  customCharts?: Array<Record<string, any>>;
  predictionResults?: unknown[];
}

function ExportPreviewContent() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // 1. Try to load from URL params (Base64 encoded data)
    const encodedData = searchParams.get('data');
    if (encodedData) {
      try {
        const decodedString = atob(encodedData);
        setAnalysisData(JSON.parse(decodedString));
        return;
      } catch (e) {
        console.error('Failed to parse URL data parameter', e);
      }
    }

    // 2. Try to load from sessionId if provided
    const sessionId = searchParams.get('sessionId');
    if (sessionId) {
      // In a real implementation we would fetch the session data here
      // For now, we fallback to localStorage
      console.log('Session ID provided:', sessionId);
    }

    // 3. Fallback to localStorage
    try {
      const storedData = localStorage.getItem('analysisData');
      if (storedData) {
        setAnalysisData(JSON.parse(storedData));
        return;
      }
    } catch (e) {
      console.error('Failed to parse localStorage data', e);
    }

    // No data found anywhere
    console.warn('No analysis data found for export');
  }, [searchParams]);

  if (!analysisData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <div className="p-8 bg-white rounded-xl shadow-sm text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">No Data Available</h2>
          <p className="text-slate-600 mb-6">Could not find analysis data to export. Please return to the dashboard and try again.</p>
          <button 
            onClick={() => router.push('/analytics')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      const { generateProfessionalPDF } = await import('./professional-pdf');
      await generateProfessionalPDF(analysisData, setIsGenerating);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Export Preview</h1>
        <button 
          onClick={() => router.push('/analytics')}
          className="px-4 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
        >
          Cancel
        </button>
      </div>
      
      <div className="bg-white p-12 shadow-sm rounded-xl flex flex-col items-center">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Ready to Export PDF</h2>
        <p className="text-slate-600 mb-8 text-center max-w-lg">
          Your analytics report is ready to be compiled into a professional PDF document. Generating the PDF locally in your browser may take a few moments depending on the amount of data.
        </p>
        <button 
          onClick={handleExport}
          disabled={isGenerating}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:bg-blue-400"
        >
          {isGenerating ? 'Generating PDF...' : 'Download Professional PDF'}
        </button>
      </div>
    </div>
  );
}

export default function ExportPreviewPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading preview...</div>}>
      <ExportPreviewContent />
    </Suspense>
  );
}
