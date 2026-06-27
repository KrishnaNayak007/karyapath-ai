import React, { useState, useRef } from 'react';
import { createGoal, createGoalFromBrainDump, Goal, Subtask, ScheduledBlock } from '../services/api';
import { Target, Calendar, ArrowRight, Sparkles, AlertCircle, Brain, ListTodo, Mic, MicOff } from 'lucide-react';

interface CreateGoalProps {
  setCurrentPage: (page: string) => void;
  onGoalCreated: (goal: Goal, subtasks: Subtask[], blocks: ScheduledBlock[]) => void;
}

export default function CreateGoal({ setCurrentPage, onGoalCreated }: CreateGoalProps) {
  const [activeTab, setActiveTab] = useState<'dump' | 'manual'>('dump');
  
  // Chaos Brain-Dump Mode State
  const [brainDumpText, setBrainDumpText] = useState('');

  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Structured Form Mode States (Original)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('Medium');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Speech Recognition Trigger Handlers
  const handleToggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Try using Google Chrome or Safari.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      setError(null);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        // Append newly captured speech space-separated
        setBrainDumpText((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event);
        setError("Could not capture audio. Make sure microphone permissions are granted.");
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // If speech-to-text is still running, stop it first
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (activeTab === 'manual') {
      if (!title || !deadline || !priority) {
        setError('Title, deadline, and priority level are required.');
        return;
      }
    } else {
      if (!brainDumpText.trim()) {
        setError("Please dump what is on your mind or speak to Gemini.");
        return;
      }
    }

    setLoading(true);

    try {
      let response;
      if (activeTab === 'dump') {
        console.log('Sending raw chaotic brain dump to backend POST /goals/brain-dump...');
        response = await createGoalFromBrainDump(brainDumpText);
      } else {
        console.log('Sending structured goal payload to backend POST /goals...');
        response = await createGoal({
          title,
          description,
          deadline: new Date(deadline).toISOString(),
          priority,
        });
      }

      console.log('Goal created successfully:', response);
      onGoalCreated(response.goal, response.subtasks, response.scheduled_blocks);
      setCurrentPage('ai-breakdown');
    } catch (err: any) {
      console.error('Error creating goal:', err);
      setError(err.response?.data?.error || 'Failed to initialize goal. Make sure your backend server is online and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[#0B1120] text-slate-100 px-6 py-12 flex items-center justify-center relative overflow-hidden">
      {/* Glow accent */}
      <div className="absolute top-1/4 left-1/2 w-80 h-80 bg-[#7C3AED]/5 blur-[100px] rounded-full pointer-events-none -translate-x-1/2" />

      <div className="max-w-lg w-full bg-[#111827] border border-slate-800 rounded-2xl p-6 md:p-8 z-10 space-y-6">
        
        {/* Banner Headers */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Autonomous Architect</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Initialize Goal Trajectory</h2>
          <p className="text-xs text-slate-400 font-medium">
            Gemini will automatically partition your objective into timelines.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 bg-slate-950 border border-slate-800/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('dump');
              setError(null);
            }}
            className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dump'
                ? 'bg-[#1F2937] text-white border border-slate-700/50 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Chaos Brain-Dump</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              setError(null);
            }}
            className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-[#1F2937] text-white border border-slate-700/50 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Structured Form</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center space-x-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {activeTab === 'dump' ? (
            /* CHAOS BRAIN-DUMP INTAKE VIEW WITH MIC */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Vent your thoughts below
                </label>
                
                {/* Microphone Button */}
                <button
                  type="button"
                  onClick={handleToggleListening}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3 h-3 text-rose-400" />
                      <span>Stop Listening</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3 h-3 text-[#06B6D4]" />
                      <span>Speak to AI</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={brainDumpText}
                  onChange={(e) => setBrainDumpText(e.target.value)}
                  placeholder='e.g., "I need to study for my DSA exam which is next Friday, I&apos;m so stressed out."'
                  rows={5}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-[#06B6D4] rounded-xl p-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-colors resize-none leading-relaxed font-medium"
                />
                
                {/* Mini Pulsing Dot inside Text Area when listening */}
                {isListening && (
                  <span className="absolute bottom-3 right-3 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 leading-normal font-medium">
                Vent naturally without worry about dates or forms. Gemini autonomously resolves relative dates like &quot;next Friday&quot; or &quot;tomorrow&quot;, extracts objective scopes, and assigns priority based on stress metrics.
              </p>
            </div>
          ) : (
            /* ORIGINAL STRUCTURED FORM VIEW */
            <>
              {/* Goal Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Goal Title</label>
                <div className="relative">
                  <Target className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Integrate Stripe payment gateways"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#06B6D4] transition-colors"
                  />
                </div>
              </div>

              {/* Goal Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context, constraints, or sub-scopes to guide Gemini..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#06B6D4] transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Deadline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Target Deadline</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-[#06B6D4] transition-colors"
                    />
                  </div>
                </div>

                {/* Goal Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-[#06B6D4] transition-colors"
                  >
                    <option value="High">🔴 High Priority</option>
                    <option value="Medium">🟡 Medium Priority</option>
                    <option value="Low">🟢 Low Priority</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-sm font-extrabold text-white flex items-center justify-center space-x-2 shadow-lg shadow-[#7C3AED]/10 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Gemini partitioning goals...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <span>Generate Subtask Breakdown</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}