'use client';

import React from 'react';
import {
  GitCompare, ShieldCheck, FileQuestion, Tag, HelpCircle,
  Scale, Split, GitMerge, Zap, X, Check, AlertCircle, Sparkles,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { ToolDefinition } from '@/types/research';
import type { ToolInvokeResult } from '@/services/research';
import { useResearchStore } from '@/stores/researchStore';
import styles from '../../app/(dashboard)/research/research.module.css';

// ─── Icon registry ────────────────────────────────────────────────────────────
const TOOL_ICON_MAP: Record<string, React.FC<LucideProps>> = {
  GitCompare, ShieldCheck, FileQuestion, Tag, HelpCircle,
  Scale, Split, GitMerge, Zap,
};

// ─── Loading shimmer ─────────────────────────────────────────────────────────
function ToolShimmer() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-5 w-20 bg-slate-100 rounded-full" />
        <div className="h-5 w-24 bg-slate-100 rounded-full" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 bg-slate-50 rounded-xl space-y-2">
          <div className="h-3.5 w-3/4 bg-slate-200 rounded-full" />
          <div className="h-3 w-1/2 bg-slate-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Per-tool live renderers ──────────────────────────────────────────────────
function RenderGap({ result }: { result: ToolInvokeResult['result'] }) {
  const gaps: { label: string; confidence: string; reason: string }[] = result.gaps ?? [];
  const confColor: Record<string, string> = {
    High: 'bg-sky-100 text-sky-700',
    Medium: 'bg-amber-100 text-amber-700',
    Low: 'bg-slate-100 text-slate-500',
  };
  return (
    <div className="space-y-3">
      {gaps.map((g, i) => (
        <div key={i} className="p-4 bg-white border border-sky-100 rounded-xl flex justify-between items-start shadow-sm gap-4">
          <div>
            <h5 className="font-bold text-slate-800 text-sm">{g.label}</h5>
            {g.reason && <p className="text-xs text-slate-500 mt-1">{g.reason}</p>}
          </div>
          <span className={`px-2 py-1 text-[10px] font-black uppercase rounded flex-shrink-0 ${confColor[g.confidence] ?? confColor.Low}`}>
            {g.confidence}
          </span>
        </div>
      ))}
    </div>
  );
}

function RenderComparator({ result }: { result: ToolInvokeResult['result'] }) {
  const { methods = [], parameters = [], matrix = {}, lead, contradiction, synthesis_insight } = result;
  return (
    <div className="space-y-6 text-slate-800">
      <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm bg-white">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Parameter</th>
              {methods.map((m: string) => (
                <th key={m} className={`px-5 py-4 ${m === lead ? 'bg-blue-50/50 border-x border-slate-200' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className={`font-extrabold ${m === lead ? 'text-blue-700' : 'text-slate-600'}`}>{m}</span>
                    {m === lead && (
                      <span className="px-1.5 py-0.5 bg-blue-600 text-[8px] text-white rounded-full uppercase font-black">Lead</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {parameters.map((p: string) => (
              <tr key={p} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-4 font-bold text-slate-700 text-xs">{p}</td>
                {methods.map((m: string) => (
                  <td key={m} className={`px-5 py-4 ${m === lead ? 'bg-blue-50/30 border-x border-slate-100 font-black text-blue-600' : 'text-slate-600'}`}>
                    {matrix[m]?.[p] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {contradiction && (
          <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl">
            <h6 className="text-[10px] font-black uppercase text-red-500 mb-2 tracking-widest flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3" /> Contradiction Found
            </h6>
            <p className="text-xs text-red-900 leading-relaxed">{contradiction}</p>
          </div>
        )}
        {synthesis_insight && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl shadow-sm shadow-blue-100/50">
            <h6 className="text-[10px] font-black uppercase text-blue-600 mb-2 tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Synthesis Insight
            </h6>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">{synthesis_insight}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function RenderAssumption({ result }: { result: ToolInvokeResult['result'] }) {
  const assumptions: { source: string; type: string; text: string }[] = result.assumptions ?? [];
  const typeStyles: Record<string, React.CSSProperties> = {
    Explicit: { background: '#e0f2fe', color: '#0369a1' },
    Implicit: { background: '#fef3c7', color: '#d97706' },
    Environment: { background: '#f0fdf4', color: '#15803d' },
  };
  return (
    <div className="space-y-4">
      {assumptions.map((a, i) => (
        <div key={i} className={styles.assumptionCard}>
          <div className={styles.assumptionHeader}>
            <span className="font-bold text-slate-700 text-sm">{a.source}</span>
            <span className={styles.assumptionType} style={typeStyles[a.type]}>{a.type}</span>
          </div>
          <p className={styles.assumptionText}>{a.text}</p>
        </div>
      ))}
    </div>
  );
}

function RenderStrength({ result }: { result: ToolInvokeResult['result'] }) {
  const items: { source: string; strengths: string[]; weaknesses: string[] }[] = result.items ?? [];
  return (
    <div className="space-y-6">
      {items.map((item, i) => (
        <div key={i}>
          <h5 className="font-bold text-slate-800 text-sm mb-3">{item.source}</h5>
          <div className="flex flex-wrap gap-2 mb-2">
            {item.strengths.map((s) => (
              <span key={s} className={styles.tagStrength}><Check className="w-3 h-3" /> {s}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {item.weaknesses.map((w) => (
              <span key={w} className={styles.tagWeakness}><X className="w-3 h-3" /> {w}</span>
            ))}
          </div>
          {i < items.length - 1 && <hr className="border-slate-100 mt-4" />}
        </div>
      ))}
    </div>
  );
}

function RenderQuestion({ result }: { result: ToolInvokeResult['result'] }) {
  const questions: string[] = result.questions ?? [];
  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={i} className={styles.questionCard}>
          <p className={styles.questionText}>
            <span className="font-black text-blue-600 mr-2">{i + 1}.</span>
            {q}
          </p>
        </div>
      ))}
    </div>
  );
}

function RenderArgument({ result }: { result: ToolInvokeResult['result'] }) {
  const args: { claim: string; support: string; evidence: string | null }[] = result.arguments ?? [];
  const supportColor: Record<string, { border: string; text: string }> = {
    Strong: { border: '#10b981', text: 'text-green-600' },
    Moderate: { border: '#f59e0b', text: 'text-amber-600' },
    Unsupported: { border: '#ef4444', text: 'text-red-500' },
  };
  return (
    <div className="space-y-4">
      {args.map((a, i) => {
        const style = supportColor[a.support] ?? supportColor.Unsupported;
        return (
          <div key={i} className={styles.argumentCard} style={{ borderLeftColor: style.border }}>
            <p className={styles.argumentClaim}>Claim: &ldquo;{a.claim}&rdquo;</p>
            <div className={styles.argumentStatus}>
              <span className={`${style.text} font-bold`}>{a.support}</span>
              {a.evidence && <span className="text-slate-500">{a.evidence}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RenderResolver({ result }: { result: ToolInvokeResult['result'] }) {
  const conflicts: {
    conflict_id: number;
    title: string;
    source_a: { name: string; claim: string };
    source_b: { name: string; claim: string };
    resolution: string;
  }[] = result.conflicts ?? [];
  return (
    <div className="space-y-4">
      {conflicts.map((c) => (
        <div key={c.conflict_id} className={styles.resolverCard}>
          <h5 className="text-sm font-bold text-slate-700 mb-2">Conflict #{c.conflict_id}: {c.title}</h5>
          <div className={styles.resolverSplit}>
            <div className={styles.resolverSide}>
              <strong className="block mb-1 text-slate-800">{c.source_a.name}</strong>
              {c.source_a.claim}
            </div>
            <div className={styles.resolverSide}>
              <strong className="block mb-1 text-slate-800">{c.source_b.name}</strong>
              {c.source_b.claim}
            </div>
          </div>
          {c.resolution && (
            <p className="mt-3 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              <strong className="text-slate-700">Resolution:</strong> {c.resolution}
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <button className="flex-1 py-2 text-xs font-bold bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition-colors">Favor A</button>
            <button className="flex-1 py-2 text-xs font-bold bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition-colors">Favor B</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function RenderCoherence({ result }: { result: ToolInvokeResult['result'] }) {
  const sections: { step: number; title: string; issue: string | null; transition_score: number }[] = result.sections ?? [];
  return (
    <div className={styles.flowMap}>
      {sections.map((s) => (
        <div key={s.step} className={styles.flowNode}>
          <div className={styles.flowDot}>{s.step}</div>
          <div className={styles.flowContent}>
            {s.title}
            {s.issue && <p className={styles.flowIssue}>⚠ {s.issue}</p>}
            {s.transition_score !== undefined && (
              <div className="mt-1">
                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${s.transition_score * 100}%`,
                      background: s.transition_score >= 0.7 ? '#10b981' : s.transition_score >= 0.5 ? '#f59e0b' : '#ef4444',
                    }}
                  />
                </div>
                <span className="text-[9px] text-slate-400 font-medium">
                  {Math.round(s.transition_score * 100)}% coherence
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RenderChallenger({ result }: { result: ToolInvokeResult['result'] }) {
  const {
    main_hypothesis,
    potential_contradiction,
    empirical_support_pct = 0,
    theoretical_risk_pct = 0,
    stress_test_details = [],
  } = result;
  const verdictColor: Record<string, string> = {
    Holds: 'text-green-600',
    Fails: 'text-red-500',
    Uncertain: 'text-amber-500',
  };
  return (
    <div className="space-y-4 text-sm">
      {main_hypothesis && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <h5 className="font-bold text-slate-700 mb-1 text-[10px] uppercase tracking-widest">Main Hypothesis</h5>
          <p className="text-slate-800 leading-relaxed">{main_hypothesis}</p>
        </div>
      )}
      {potential_contradiction && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
          <h5 className="font-bold text-red-900 mb-1">Potential Contradiction Found</h5>
          <p className="text-red-800 leading-relaxed">{potential_contradiction}</p>
        </div>
      )}
      <div className="space-y-2">
        <h5 className="font-bold text-slate-800">Stress Test Results:</h5>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div className="bg-orange-500 h-full" style={{ width: `${empirical_support_pct}%` }} />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
          <span>Empirical Support: {empirical_support_pct}%</span>
          <span>Theoretical Risk: {theoretical_risk_pct}%</span>
        </div>
      </div>
      {stress_test_details.length > 0 && (
        <div className="space-y-2">
          {stress_test_details.map((d: { aspect: string; verdict: string; reason: string }, i: number) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-xl">
              <span className={`font-bold text-xs flex-shrink-0 mt-0.5 ${verdictColor[d.verdict] ?? 'text-slate-500'}`}>
                {d.verdict}
              </span>
              <div>
                <p className="font-semibold text-slate-700 text-xs">{d.aspect}</p>
                {d.reason && <p className="text-xs text-slate-500 mt-0.5">{d.reason}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Live renderer dispatch map ───────────────────────────────────────────────
const LIVE_RENDERERS: Record<string, React.FC<{ result: ToolInvokeResult['result'] }>> = {
  gap:        RenderGap,
  comparator: RenderComparator,
  assumption: RenderAssumption,
  strength:   RenderStrength,
  question:   RenderQuestion,
  argument:   RenderArgument,
  resolver:   RenderResolver,
  coherence:  RenderCoherence,
  challenger: RenderChallenger,
};

// ─── Static preview content ───────────────────────────────────────────────────
const TOOL_CONTENT: Record<string, React.ReactNode> = {
  comparator: (
    <div className="space-y-6 text-slate-800">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Competitive Matrix</h5>
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button className="px-3 py-1 text-xs font-bold bg-white shadow-sm rounded-md text-slate-700">Table</button>
          <button className="px-3 py-1 text-xs font-bold text-slate-500">Diff</button>
        </div>
      </div>
      <div className="overflow-hidden border border-slate-200 rounded-2xl shadow-sm bg-white">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200">
              <th className="px-5 py-4 font-bold text-slate-500 uppercase text-[10px] tracking-wider">Parameter</th>
              <th className="px-5 py-4 bg-blue-50/50 border-x border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-blue-700">Transformer v2</span>
                  <span className="px-1.5 py-0.5 bg-blue-600 text-[8px] text-white rounded-full uppercase font-black">Lead</span>
                </div>
              </th>
              <th className="px-5 py-4 font-bold text-slate-600">Attention-X</th>
              <th className="px-5 py-4 font-bold text-slate-600">Baseline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="px-5 py-4 font-bold text-slate-700 text-xs">Complexity</td>
              <td className="px-5 py-4 bg-blue-50/30 border-x border-slate-100 font-black text-blue-600">O(n log n)</td>
              <td className="px-5 py-4 text-slate-500 italic">O(n²)</td>
              <td className="px-5 py-4 text-slate-500 italic">O(n²)</td>
            </tr>
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="px-5 py-4 font-bold text-slate-700 text-xs">Memory</td>
              <td className="px-5 py-4 bg-blue-50/30 border-x border-slate-100 font-black text-blue-600">Adaptive</td>
              <td className="px-5 py-4 text-slate-600 font-medium">Fixed 4GB</td>
              <td className="px-5 py-4 text-slate-500 italic">Variable</td>
            </tr>
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="px-5 py-4 font-bold text-slate-700 text-xs">Accuracy</td>
              <td className="px-5 py-4 bg-blue-50/30 border-x border-slate-100 font-black text-blue-600">94.2%</td>
              <td className="px-5 py-4 text-slate-600 font-medium">91.8%</td>
              <td className="px-5 py-4 text-slate-600 font-medium">88.5%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl">
          <h6 className="text-[10px] font-black uppercase text-red-500 mb-2 tracking-widest flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" /> Contradiction Found
          </h6>
          <p className="text-xs text-red-900 leading-relaxed">
            <strong>Vaswani (2017)</strong> claims global attention is strictly required, but{' '}
            <strong>Oord (2018)</strong> enables local approximations with comparable BLEU scores.
          </p>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl shadow-sm shadow-blue-100/50">
          <h6 className="text-[10px] font-black uppercase text-blue-600 mb-2 tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Synthesis Insight
          </h6>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            The Transformer v2 architecture achieves a 15% efficiency gain in latent mapping without depth sacrifice.
          </p>
        </div>
      </div>
    </div>
  ),
  gap: (
    <div className="space-y-4">
      {[
        { label: 'Sparse Attention in Low-Resource Domains', confidence: 'High' },
        { label: 'Cross-modal Bias in Latent Diffusion', confidence: 'Medium' },
        { label: 'Real-time Vector Quantization Efficiency', confidence: 'High' },
      ].map((gap, i) => (
        <div key={i} className="p-4 bg-white border border-sky-100 rounded-xl flex justify-between items-center shadow-sm">
          <div>
            <h5 className="font-bold text-slate-800 text-sm">{gap.label}</h5>
            <p className="text-xs text-slate-500">Identified from 4 conflicting conclusions</p>
          </div>
          <span className="px-2 py-1 bg-sky-100 text-sky-700 text-[10px] font-black uppercase rounded">
            {gap.confidence} confidence
          </span>
        </div>
      ))}
    </div>
  ),
  assumption: (
    <div className="space-y-4">
      <div className={styles.assumptionCard}>
        <div className={styles.assumptionHeader}>
          <span className="font-bold text-slate-700 text-sm">Vaswani et al. (2017)</span>
          <span className={styles.assumptionType}>Explicit</span>
        </div>
        <p className={styles.assumptionText}>Assumes availability of massive parallelized compute resources (TPU v2 pods).</p>
      </div>
      <div className={styles.assumptionCard}>
        <div className={styles.assumptionHeader}>
          <span className="font-bold text-slate-700 text-sm">Engunity Core (2025)</span>
          <span className={styles.assumptionType} style={{ background: '#fef3c7', color: '#d97706' }}>Implicit</span>
        </div>
        <p className={styles.assumptionText}>Relies on pre-cleaned, normalized vector datasets for latency comparisons.</p>
      </div>
      <div className={styles.assumptionCard}>
        <div className={styles.assumptionHeader}>
          <span className="font-bold text-slate-700 text-sm">Oord et al. (2018)</span>
          <span className={styles.assumptionType}>Environment</span>
        </div>
        <p className={styles.assumptionText}>Restricted to discrete latent spaces; continuous mappings are out of scope.</p>
      </div>
    </div>
  ),
  strength: (
    <div className="space-y-6">
      <div>
        <h5 className="font-bold text-slate-800 text-sm mb-3">Attention Is All You Need</h5>
        <div className="flex flex-wrap gap-2 mb-2">
          <span className={styles.tagStrength}><Check className="w-3 h-3" /> Global Context</span>
          <span className={styles.tagStrength}><Check className="w-3 h-3" /> Parallelization</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={styles.tagWeakness}><X className="w-3 h-3" /> Quadratic Memory</span>
          <span className={styles.tagWeakness}><X className="w-3 h-3" /> Positional Embedding Fragility</span>
        </div>
      </div>
      <hr className="border-slate-100" />
      <div>
        <h5 className="font-bold text-slate-800 text-sm mb-3">Latent Diffusion Models</h5>
        <div className="flex flex-wrap gap-2 mb-2">
          <span className={styles.tagStrength}><Check className="w-3 h-3" /> High-Res Synthesis</span>
          <span className={styles.tagStrength}><Check className="w-3 h-3" /> Parameter Efficiency</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={styles.tagWeakness}><X className="w-3 h-3" /> Inference Latency</span>
        </div>
      </div>
    </div>
  ),
  question: (
    <div className="space-y-4">
      <div className={styles.questionCard}>
        <p className={styles.questionText}>Why does <strong>Transformer v2</strong> outperform the baseline despite having lower parameter count in sparse scenarios?</p>
      </div>
      <div className={styles.questionCard}>
        <p className={styles.questionText}>What happens to the <strong>Vector Quantization</strong> accuracy if the latent space assumes a non-uniform distribution?</p>
      </div>
      <div className={styles.questionCard}>
        <p className={styles.questionText}>Can <strong>Attention-X</strong> sustain its memory efficiency when sequence length exceeds 16k tokens?</p>
      </div>
    </div>
  ),
  argument: (
    <div className="space-y-4">
      <div className={styles.argumentCard} style={{ borderLeftColor: '#ef4444' }}>
        <p className={styles.argumentClaim}>Claim: &ldquo;Latent Diffusion outperforms standard GANs in diversity.&rdquo;</p>
        <div className={styles.argumentStatus}>
          <span className="text-red-500 font-bold">Unsupported</span>
          <button className="text-blue-600 underline">Find Evidence</button>
        </div>
      </div>
      <div className={styles.argumentCard} style={{ borderLeftColor: '#10b981' }}>
        <p className={styles.argumentClaim}>Claim: &ldquo;Transformers scale quadratically with sequence length.&rdquo;</p>
        <div className={styles.argumentStatus}>
          <span className="text-green-600 font-bold">Strong Support</span>
          <span>Vaswani (2017)</span>
        </div>
      </div>
    </div>
  ),
  resolver: (
    <div>
      <div className={styles.resolverCard}>
        <h5 className="text-sm font-bold text-slate-700 mb-2">Conflict #1: Latent Space Nature</h5>
        <div className={styles.resolverSplit}>
          <div className={styles.resolverSide}><strong className="block mb-1 text-slate-800">Source A</strong>Discrete (Vector Quantized)</div>
          <div className={styles.resolverSide}><strong className="block mb-1 text-slate-800">Source B</strong>Continuous (Gaussian)</div>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 py-2 text-xs font-bold bg-white border border-slate-200 rounded text-slate-600">Favor A</button>
          <button className="flex-1 py-2 text-xs font-bold bg-white border border-slate-200 rounded text-slate-600">Favor B</button>
        </div>
      </div>
    </div>
  ),
  coherence: (
    <div className={styles.flowMap}>
      <div className={styles.flowNode}><div className={styles.flowDot}>1</div><div className={styles.flowContent}>introduction_claims.txt</div></div>
      <div className={styles.flowNode}><div className={styles.flowDot}>2</div><div className={styles.flowContent}>lit_review_transformers.txt<p className={styles.flowIssue}>⚠ Abrupt Transition</p></div></div>
      <div className={styles.flowNode}><div className={styles.flowDot}>3</div><div className={styles.flowContent}>methodology_setup.txt</div></div>
    </div>
  ),
  challenger: (
    <div className="space-y-4 text-sm">
      <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
        <h5 className="font-bold text-red-900 mb-1">Potential Contradiction Found</h5>
        <p className="text-red-800 leading-relaxed">
          Vaswani et al. (2017) suggests global attention is essential, but Oord et al. (2018) demonstrates local quantization can achieve similar results in discrete spaces.
        </p>
      </div>
      <div className="space-y-2">
        <h5 className="font-bold text-slate-800">Stress Test Results:</h5>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div className="bg-orange-500 h-full w-[65%]" />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
          <span>Empirical Support: 65%</span>
          <span>Theoretical Risk: 35%</span>
        </div>
      </div>
    </div>
  ),
};

// ─── Component ────────────────────────────────────────────────────────────────
interface ToolModalProps {
  toolDefinitions: Record<string, ToolDefinition>;
  /** Result from the backend AI tool invocation (null = use static preview) */
  toolResult?: ToolInvokeResult | null;
  /** Whether the tool API call is in flight */
  isToolLoading?: boolean;
  /** Callback to trigger the live AI analysis */
  onRun?: (toolKey: string) => void;
}

/**
 * ToolModal — full-screen overlay modal for analysis tool detail views.
 *
 * Reads `activeTool` and `setActiveTool` from the Zustand researchStore.
 * Prop-drilled state (toolKey, onClose) has been removed.
 *
 * CSS classes preserved for E2E selectors:
 *   shareOverlay, shareModal, shareHeader, closeBtn
 */
export default function ToolModal({
  toolDefinitions,
  toolResult = null,
  isToolLoading = false,
  onRun,
}: ToolModalProps) {
  const { activeTool, setActiveTool } = useResearchStore();

  if (!activeTool) return null;

  const tool = toolDefinitions[activeTool];
  if (!tool) return null;

  const Icon = TOOL_ICON_MAP[tool.iconName];

  let content: React.ReactNode;
  if (isToolLoading) {
    content = <ToolShimmer />;
  } else if (toolResult) {
    const LiveRenderer = LIVE_RENDERERS[activeTool];
    if (LiveRenderer) {
      content = (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded">Live AI Result</span>
            <span className="text-[10px] text-slate-400">
              {toolResult.generated_at ? new Date(toolResult.generated_at).toLocaleTimeString() : 'just now'}
            </span>
          </div>
          <LiveRenderer result={toolResult.result} />
        </div>
      );
    } else {
      content = (
        <div className="space-y-3 text-sm text-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded">Live AI Result</span>
            <span className="text-[10px] text-slate-400">
              {toolResult.generated_at ? new Date(toolResult.generated_at).toLocaleTimeString() : 'just now'}
            </span>
          </div>
          <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs leading-relaxed overflow-auto max-h-[320px] whitespace-pre-wrap">
            {JSON.stringify(toolResult.result, null, 2)}
          </pre>
        </div>
      );
    }
  } else {
    content = TOOL_CONTENT[activeTool] ?? (
      <p className="text-slate-500 text-sm">Content for this tool is coming soon.</p>
    );
  }

  return (
    <div className={styles.shareOverlay} onClick={() => setActiveTool(null)}>
      <div className={styles.shareModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.shareHeader} style={{ marginBottom: '1.5rem' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: tool.bg, color: tool.color }}>
              {Icon && <Icon className="w-6 h-6" />}
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">{tool.title}</h3>
          </div>
          <button className={styles.closeBtn} onClick={() => setActiveTool(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4">{content}</div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => onRun?.(activeTool)}
            disabled={isToolLoading}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isToolLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Analysing…
              </>
            ) : (
              'Run Detailed Analysis'
            )}
          </button>
          <button className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all">
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
