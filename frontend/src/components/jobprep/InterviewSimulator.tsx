'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic2,
  Send,
  Play,
  Square,
  RefreshCcw,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  X,
  ChevronRight,
  Sparkles,
  Timer
} from 'lucide-react';
import styles from './jobprep-components.module.css';
import { jobPrepService } from '@/services/jobprep';

interface Question {
  question: string;
  question_type: string;
  difficulty: string;
  expected_concepts: string[];
  hints: string[];
}

interface Round {
  type: 'recruiter' | 'technical' | 'system_design' | 'behavioral';
  label: string;
  status: 'pending' | 'active' | 'completed';
  score?: number;
}

interface Evaluation {
  score: number;
  technical_accuracy: number;
  communication_clarity: number;
  feedback: string;
  suggestions: string[];
}

interface InterviewSimulatorProps {
  roleId: string;
  onComplete: () => void;
  placementMode?: boolean;
}

export const InterviewSimulator: React.FC<InterviewSimulatorProps> = ({ roleId, onComplete, placementMode = false }) => {
  const [step, setStep] = useState<'setup' | 'active' | 'evaluation'>('setup');
  const [difficulty, setDifficulty] = useState('mid-level');
  const [companyStyle, setCompanyStyle] = useState('General');
  const [persona, setPersona] = useState('Professional');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [simId, setSimId] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);

  // Multi-round state
  const [rounds, setRounds] = useState<Round[]>([
    { type: 'recruiter', label: 'Recruiter Screen', status: 'pending' },
    { type: 'technical', label: 'Technical Assessment', status: 'pending' },
    { type: 'system_design', label: 'System Design', status: 'pending' },
    { type: 'behavioral', label: 'Cultural Fit', status: 'pending' }
  ]);
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'active') {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const startSimulation = async () => {
    try {
      const sim = await jobPrepService.startSimulation({
        simulation_type: placementMode ? 'Placement Evaluation' : 'Multi-round Interview',
        difficulty_level: difficulty,
        company_style: companyStyle,
        persona_style: persona,
        target_role_id: roleId,
        placement_mode: placementMode,
        interview_rounds: rounds
      });
      setSimId(sim.id);

      const updatedRounds = [...rounds];
      updatedRounds[0].status = 'active';
      setRounds(updatedRounds);

      const questionData = await fetchQuestion(sim.id, updatedRounds[0].type);
      setCurrentQuestion(questionData);
      setStep('active');
      setTimer(0);
    } catch (err) {
      console.error("Failed to start simulation", err);
    }
  };

  const fetchQuestion = async (id: string, roundType?: string) => {
    // In a real implementation, the backend would use roundType to tailor the question
    void id;
    void roundType;
    return await jobPrepService.getSimulationQuestion(roleId, difficulty);
  };

  const handleSubmitResponse = async () => {
    if (!userResponse.trim() || !simId || !currentQuestion) return;

    setIsSubmitting(true);
    try {
      const evalData = await jobPrepService.evaluateSimulationResponse(simId, currentQuestion.question, userResponse);

      const updatedRounds = [...rounds];
      updatedRounds[currentRoundIdx].status = 'completed';
      updatedRounds[currentRoundIdx].score = evalData.score;

      if (currentRoundIdx < rounds.length - 1) {
        // Move to next round
        const nextIdx = currentRoundIdx + 1;
        updatedRounds[nextIdx].status = 'active';
        setCurrentRoundIdx(nextIdx);
        setRounds(updatedRounds);
        setUserResponse('');
        const nextQuestion = await fetchQuestion(simId, updatedRounds[nextIdx].type);
        setCurrentQuestion(nextQuestion);
        setTimer(0);
      } else {
        // Final evaluation
        setRounds(updatedRounds);
        setEvaluation(evalData);
        setStep('evaluation');
      }
    } catch (err) {
      console.error("Failed to evaluate response", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.simulatorContainer}>
      <AnimatePresence mode="wait">
        {step === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={styles.setupCard}
          >
            <div className={styles.iconBox}>
              <Mic2 className="text-blue-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-4">Interview Setup</h2>
            <p className="text-slate-600 mb-8">Choose your difficulty and focus area to begin a realistic AI-powered interview session.</p>

            <div className="space-y-4 mb-8">
              <label className="block text-sm font-bold text-slate-700">Experience Level</label>
              <div className="grid grid-cols-3 gap-2">
                {['entry', 'mid-level', 'senior'].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setDifficulty(lvl)}
                    className={`${styles.selectBtn} ${difficulty === lvl ? styles.active : ''}`}
                  >
                    {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <label className="block text-sm font-bold text-slate-700">Interview Style</label>
              <div className="grid grid-cols-2 gap-2">
                {['General', 'FAANG', 'Startup', 'Research'].map(style => (
                  <button
                    key={style}
                    onClick={() => setCompanyStyle(style)}
                    className={`${styles.selectBtn} ${companyStyle === style ? styles.active : ''}`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <label className="block text-sm font-bold text-slate-700">Interviewer Persona</label>
              <div className="grid grid-cols-2 gap-2">
                {['Professional', 'Friendly', 'Tough', 'Technical Lead'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPersona(p)}
                    className={`${styles.selectBtn} ${persona === p ? styles.active : ''}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={startSimulation} className={styles.btnPrimaryLarge}>
              Launch Simulator
            </button>
          </motion.div>
        )}

        {step === 'active' && currentQuestion && (
          <motion.div
            key="active"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${styles.activeSession} ${placementMode ? styles.placementModeActive : ''} flex flex-col md:flex-row gap-8`}
          >
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${placementMode ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                  <Timer size={14} />
                  {formatTime(timer)}
                </div>
                <div className="flex items-center gap-2">
                  {placementMode && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-red-600 uppercase tracking-tighter animate-pulse">
                      <ShieldAlert size={12} /> Placement Mode Strict
                    </span>
                  )}
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Round {currentRoundIdx + 1}/{rounds.length}: {rounds[currentRoundIdx].label}
                  </div>
                </div>
              </div>

              <div className={styles.questionCard}>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Sparkles className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{persona} Interviewer:</h3>
                    <p className="text-slate-700 text-lg leading-relaxed italic">"{currentQuestion.question}"</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 mt-8 relative flex flex-col">
                <textarea
                  className={`${styles.responseArea} flex-1`}
                  placeholder="Type your response here... (Be as detailed as possible)"
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                />
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleSubmitResponse}
                    disabled={isSubmitting || !userResponse.trim()}
                    className={styles.submitBtn}
                  >
                    {isSubmitting ? <RefreshCcw className="animate-spin" size={18} /> : <Send size={18} />}
                    {currentRoundIdx < rounds.length - 1 ? 'Submit & Next Round' : 'Submit Final Response'}
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full md:w-64 space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Interview Progress</h4>
              <div className="space-y-2">
                {rounds.map((r, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      r.status === 'active' ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' :
                      r.status === 'completed' ? 'bg-slate-50 border-slate-100 opacity-60' :
                      'bg-white border-slate-100 opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {r.status === 'completed' ? <CheckCircle className="text-green-500" size={14} /> :
                       r.status === 'active' ? <div className="w-3.5 h-3.5 rounded-full bg-blue-500 animate-pulse" /> :
                       <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200" />}
                      <span className={`text-xs font-bold ${r.status === 'active' ? 'text-blue-700' : 'text-slate-600'}`}>{r.label}</span>
                    </div>
                    {r.score !== undefined && <span className="text-[10px] font-black text-blue-600">{r.score}%</span>}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 'evaluation' && evaluation && (
          <motion.div
            key="evaluation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={styles.evaluationCard}
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Performance Report</h2>
                <p className="text-slate-500">AI-driven analysis of your technical response.</p>
              </div>
              <div className={styles.scoreCircle}>
                <span className="text-3xl font-black text-blue-600">{evaluation.score}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Score</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Technical Accuracy</div>
                <div className="text-lg font-bold text-slate-900">{evaluation.technical_accuracy}%</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Communication</div>
                <div className="text-lg font-bold text-slate-900">{evaluation.communication_clarity}%</div>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="font-bold text-slate-900 mb-2">Interviewer Feedback:</h4>
              <p className="text-slate-700 bg-blue-50 p-4 rounded-xl border border-blue-100 leading-relaxed">
                {evaluation.feedback}
              </p>
            </div>

            <div className="mb-8">
              <h4 className="font-bold text-slate-900 mb-3">Key Suggestions:</h4>
              <ul className="space-y-2">
                {evaluation.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                    <CheckCircle className="text-green-500 mt-0.5" size={14} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <button onClick={onComplete} className={styles.btnPrimaryLarge}>
              Back to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
