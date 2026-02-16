'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Code2,
  MessageSquare,
  Play,
  CheckCircle,
  RefreshCcw,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  Clock,
  AlertCircle
} from 'lucide-react';
import styles from './jobprep-components.module.css';
import { useJobPrepStore } from '@/stores/jobPrepStore';

interface Challenge {
  id: string;
  title: string;
  type: 'concept' | 'technical' | 'explain';
  difficulty: string;
  time: string;
  category: string;
}

const challenges: Challenge[] = [
  { id: '1', title: "Model Performance Investigation", type: 'concept', difficulty: "Advanced", time: "15 min", category: "ML Theory" },
  { id: '2', title: "Recommendation System Debug", type: 'technical', difficulty: "Expert", time: "45 min", category: "System Design" },
  { id: '3', title: "Explain Gradient Descent to a CEO", type: 'explain', difficulty: "Intermediate", time: "10 min", category: "Communication" }
];

export const PracticeArena = () => {
  const { evaluatePractice } = useJobPrepStore();
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [userText, setUserText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Timer state
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isPressureMode, setIsPressureMode] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeChallenge && timeLeft !== null && timeLeft > 0 && !feedback) {
      timer = setInterval(() => {
        setTimeLeft(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0 && !feedback) {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [activeChallenge, timeLeft, feedback]);

  const handleStart = (challenge: Challenge) => {
    setActiveChallenge({ ...challenge, difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1) });
    setUserText('');
    setFeedback(null);

    if (isPressureMode) {
      // Extract minutes from "X min" string
      const mins = parseInt(challenge.time.split(' ')[0]);
      setTimeLeft(mins * 60);
    } else {
      setTimeLeft(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!activeChallenge || !userText.trim()) return;

    setIsEvaluating(true);
    try {
      const result = await evaluatePractice(
        activeChallenge.title,
        userText,
        activeChallenge.type,
        difficulty
      );
      setFeedback(result);
    } catch (err) {
      console.error("Evaluation failed", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  if (activeChallenge) {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={styles.setupCard}
      >
        <button onClick={() => setActiveChallenge(null)} className="flex items-center gap-2 text-slate-500 mb-6 hover:text-slate-900 transition-colors bg-transparent border-none cursor-pointer p-0 font-semibold">
          <ArrowLeft size={16} /> Back to Library
        </button>

        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-50 rounded-xl">
               {activeChallenge.type === 'concept' ? <Zap className="text-blue-600" /> : activeChallenge.type === 'technical' ? <Code2 className="text-blue-600" /> : <MessageSquare className="text-blue-600" />}
             </div>
             <div>
               <h3 className="text-xl font-bold text-slate-900">{activeChallenge.title}</h3>
               <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{activeChallenge.category} • {activeChallenge.difficulty}</span>
             </div>
           </div>

           {timeLeft !== null && (
             <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
               <Clock size={18} />
               {formatTime(timeLeft)}
             </div>
           )}
        </div>

        <div className="space-y-6">
           <p className="text-slate-700 leading-relaxed font-medium">
             Challenge: Provide a concise and accurate explanation or solution for this scenario.
           </p>
           <textarea
             className={styles.responseArea}
             rows={8}
             placeholder="Your answer..."
             value={userText}
             onChange={(e) => setUserText(e.target.value)}
             disabled={isEvaluating || !!feedback}
           />

           {timeLeft === 0 && !feedback && (
             <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
               <AlertCircle size={20} />
               <p className="text-sm font-bold">Time's up! Autosubmitting your response...</p>
             </div>
           )}

           {feedback ? (
             <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2 text-blue-700 font-bold">
                   <Sparkles size={18} /> AI Evaluation
                 </div>
                 <div className="px-3 py-1 bg-white rounded-full text-blue-600 font-bold text-sm border border-blue-100">
                   Score: {feedback.score}/100
                 </div>
               </div>
               <p className="text-slate-700 text-sm leading-relaxed mb-4">{feedback.feedback}</p>

               {feedback.suggestions && feedback.suggestions.length > 0 && (
                 <div className="space-y-2">
                   <h4 className="text-xs font-bold text-blue-800 uppercase tracking-widest">Suggestions:</h4>
                   <ul className="space-y-1">
                     {feedback.suggestions.map((s: string, i: number) => (
                       <li key={i} className="text-xs text-blue-700 flex items-start gap-2">
                         <ChevronRight size={12} className="mt-0.5 flex-shrink-0" />
                         {s}
                       </li>
                     ))}
                   </ul>
                 </div>
               )}

               <button
                 onClick={() => setActiveChallenge(null)}
                 className="mt-6 w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
               >
                 Done
               </button>
             </div>
           ) : (
             <button
                onClick={handleSubmit}
                disabled={isEvaluating || !userText.trim()}
                className={styles.btnPrimaryLarge}
             >
               {isEvaluating ? <RefreshCcw className="animate-spin" /> : <CheckCircle />}
               {isEvaluating ? 'Evaluating...' : 'Submit for AI Evaluation'}
             </button>
           )}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h3 className="font-bold text-lg text-slate-900">Adaptive Practice Mode</h3>
          <p className="text-sm text-slate-500">AI scales difficulty based on your recent performance.</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 pr-6 border-r border-slate-200">
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Pressure Mode</div>
              <div className="text-xs font-bold text-slate-600">{isPressureMode ? 'Timed' : 'Relaxed'}</div>
            </div>
            <button
              onClick={() => setIsPressureMode(!isPressureMode)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isPressureMode ? 'bg-red-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPressureMode ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setDifficulty(lvl)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  difficulty === lvl
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {lvl.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Concept Stress Tests", icon: Zap, color: "blue", desc: "Deep challenges focusing on 'Why' over 'How'." },
          { title: "Technical Problems", icon: Code2, color: "blue", desc: "Multi-step problems mirroring real-world ambiguity." },
          { title: "Explain-Why Drills", icon: MessageSquare, color: "green", desc: "Train your ability to articulate complex trade-offs." }
        ].map((mode) => (
          <div key={mode.title} className={`${styles.practiceCard}`}>
            <div className="p-3 bg-slate-50 rounded-xl w-fit mb-4">
              <mode.icon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-900">{mode.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{mode.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <h3 className="font-bold text-lg mb-6 text-slate-900">Available Challenges</h3>
        <div className="space-y-4">
          {challenges.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
              <div>
                <h4 className="font-bold text-slate-900">{c.title}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{c.category}</span>
                  <span className="text-xs text-slate-400 font-medium">{c.time}</span>
                </div>
              </div>
              <button onClick={() => handleStart(c)} className="p-2 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 rounded-lg transition-all border-none bg-transparent cursor-pointer">
                <Play size={20} fill="currentColor" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
