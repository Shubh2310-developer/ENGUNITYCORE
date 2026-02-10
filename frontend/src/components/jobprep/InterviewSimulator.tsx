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
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [userResponse, setUserResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [simId, setSimId] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);

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
        simulation_type: placementMode ? 'Placement Evaluation' : 'Technical Interview',
        difficulty_level: difficulty,
        target_role_id: roleId,
        placement_mode: placementMode
      });
      setSimId(sim.id);

      const questionData = await fetchQuestion();
      setCurrentQuestion(questionData);
      setStep('active');
      setTimer(0);
    } catch (err) {
      console.error("Failed to start simulation", err);
    }
  };

  const fetchQuestion = async () => {
    return await jobPrepService.getSimulationQuestion(roleId, difficulty);
  };

  const handleSubmitResponse = async () => {
    if (!userResponse.trim() || !simId || !currentQuestion) return;

    setIsSubmitting(true);
    try {
      const evalData = await jobPrepService.evaluateSimulationResponse(simId, currentQuestion.question, userResponse);
      setEvaluation(evalData);
      setStep('evaluation');
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
            className={`${styles.activeSession} ${placementMode ? styles.placementModeActive : ''}`}
          >
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
                  {placementMode ? 'Final Evaluation' : 'Technical Interview'} • {difficulty}
                </div>
              </div>
            </div>

            <div className={styles.questionCard}>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Sparkles className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Interviewer Question:</h3>
                  <p className="text-slate-700 text-lg leading-relaxed italic">"{currentQuestion.question}"</p>
                </div>
              </div>
            </div>

            <div className="flex-1 mt-8 relative">
              <textarea
                className={styles.responseArea}
                placeholder="Type your response here... (Be as detailed as possible)"
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                   onClick={handleSubmitResponse}
                   disabled={isSubmitting || !userResponse.trim()}
                   className={styles.submitBtn}
                >
                  {isSubmitting ? <RefreshCcw className="animate-spin" size={18} /> : <Send size={18} />}
                  Submit Response
                </button>
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
