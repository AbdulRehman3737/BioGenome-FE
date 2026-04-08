"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dna,
  Scissors,
  Download,
  Trash2,
  Play,
  CheckCircle,
  AlertCircle,
  Copy,
  FileJson,
  Activity,
  Microscope,
  TestTube2,
  ChevronRight,
  Sparkles,
  Zap,
  FlaskConical,
  Menu,
  X,
} from "lucide-react";

// Types
type AnalysisResult = {
  reverse_complement: string;
  sequence: string;
  length: number;
  gcContent: number;
  molecularWeight: number;
  reverseComplement?: string;
  transcription?: string;
  translation?: string;
  orfRegions?: Array<{
    start: number;
    end: number;
    length: number;
    sequence: string;
    translation: string;
    frame: number;
  }>;
  isValid: boolean;
  errors?: string[];
};

type RestrictionResult = {
  sequence: string;
  analysisResults: Record<
    string,
    {
      cutting_sites: number[];
      fragments: number;
      recognitionSequence?: string;
      error?: string;
    }
  >;
  totalEnzymes: number;
};

type AnalysisType = "basic" | "restriction";
type SequenceType = "dna" | "rna" | "protein";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

// Utility Components
const ToastContainer = ({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: number) => void;
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl backdrop-blur-xl border animate-slide-up min-w-[300px] ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-100"
              : toast.type === "error"
                ? "bg-red-950/90 border-red-500/30 text-red-100"
                : "bg-slate-900/90 border-slate-500/30 text-slate-100"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          ) : toast.type === "error" ? (
            <AlertCircle className="w-5 h-5 text-red-400" />
          ) : (
            <Sparkles className="w-5 h-5 text-blue-400" />
          )}
          <span className="text-sm font-medium flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  sublabel,
  variant = "blue",
  delay = 0,
}: {
  icon: any;
  label: string;
  value: string | number;
  sublabel?: string;
  variant?: "blue" | "green" | "purple" | "orange";
  delay?: number;
}) => {
  return (
    <div
      className={`stat-card stat-${variant} animate-slide-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="p-2.5 rounded-xl bg-white/5">
          <Icon className="w-5 h-5 text-white/70" />
        </div>
        {sublabel && (
          <span className="text-xs text-white/30 font-mono uppercase tracking-wider">
            {sublabel}
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-sm text-white/50 font-medium mb-1">{label}</div>
        <div className="text-3xl font-bold text-white tracking-tight">
          {value}
        </div>
      </div>
    </div>
  );
};

const SequenceSection = ({
  title,
  sequence,
  icon: Icon,
  color = "cyan",
  onCopy,
}: {
  title: string;
  sequence: string;
  icon: any;
  color?: "cyan" | "green" | "purple" | "orange";
  onCopy?: () => void;
}) => {
  const colorClasses = {
    cyan: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30",
    green: "from-emerald-500/20 to-green-500/20 border-emerald-500/30",
    purple: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
    orange: "from-orange-500/20 to-red-500/20 border-orange-500/30",
  };

  const textColors = {
    cyan: "text-cyan-300",
    green: "text-emerald-300",
    purple: "text-purple-300",
    orange: "text-orange-300",
  };

  return (
    <div className={`glass-card p-5 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white/5`}>
            <Icon className={`w-4 h-4 ${textColors[color]}`} />
          </div>
          <h4 className="text-sm font-semibold text-white/80">{title}</h4>
        </div>
        {onCopy && (
          <button
            onClick={onCopy}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
            title="Copy sequence"
          >
            <Copy className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="sequence-display text-xs leading-relaxed max-h-32 overflow-y-auto">
        {sequence || "N/A"}
      </div>
    </div>
  );
};

// Main Component
export default function BioGenomeAnalytics() {
  const [sequence, setSequence] = useState("");
  const [analysisType, setAnalysisType] = useState<AnalysisType>("basic");
  const [sequenceType, setSequenceType] = useState<SequenceType>("dna");
  const [selectedEnzymes, setSelectedEnzymes] = useState<string[]>([]);
  const [availableEnzymes, setAvailableEnzymes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("results");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Toast management
  const addToast = useCallback(
    (message: string, type: Toast["type"] = "info") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    [],
  );

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast(`${label} copied to clipboard`, "success");
    } catch {
      addToast("Failed to copy to clipboard", "error");
    }
  };

  // Fetch enzymes on mount
  useEffect(() => {
    const fetchEnzymes = async () => {
      try {
        const response = await fetch("/api/enzymes");
        const data = await response.json();
        setAvailableEnzymes(data.availableEnzymes || []);
      } catch {
        addToast("Failed to load enzyme list", "error");
      }
    };
    fetchEnzymes();
  }, [addToast]);

  const toggleEnzyme = (enzyme: string) => {
    setSelectedEnzymes((prev) =>
      prev.includes(enzyme)
        ? prev.filter((e) => e !== enzyme)
        : [...prev, enzyme],
    );
  };

  const clearAll = () => {
    setSequence("");
    setSelectedEnzymes([]);
    setData(null);
    addToast("All data cleared", "info");
  };

  const getAnalysisData = async () => {
    if (analysisType === "basic") {
      if (!sequence) return null;
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequence, type: sequenceType }),
      });
      return response.json();
    } else if (analysisType === "restriction") {
      if (!sequence) return null;
      const response = await fetch("/api/analyze/restriction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequence, enzymes: selectedEnzymes }),
      });
      return response.json();
    }
    return null;
  };

  const handleAnalyze = async () => {
    if (!sequence || sequence.length < 3) {
      addToast("Please enter a valid sequence (minimum 3 characters)", "error");
      return;
    }

    if (analysisType === "restriction" && selectedEnzymes.length === 0) {
      addToast("Please select at least one restriction enzyme", "error");
      return;
    }

    setIsLoading(true);
    try {
      const result = await getAnalysisData();
      if (result) {
        setData(result);
        setActiveTab("results");
        addToast("Analysis completed successfully", "success");
      }
    } catch {
      addToast("Analysis failed. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const exportResults = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `biogenome_analysis_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast("Results exported successfully", "success");
  };

  const filterSequence = (value: string, type: SequenceType) => {
    const upperValue = value.toUpperCase();
    switch (type) {
      case "dna":
        return upperValue.replace(/[^ATCG]/g, "");
      case "rna":
        return upperValue.replace(/[^AUCG]/g, "");
      case "protein":
        return upperValue.replace(/[^ACDEFGHIKLMNPQRSTVWY]/g, "");
      default:
        return upperValue;
    }
  };

  return (
    <div className="min-h-screen">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Navigation */}
      <nav className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <Dna className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">BioGenome</h1>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">
                  Analytics
                </p>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-white/60">System Online</span>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <a
                  href="https://github.com/AbdulRehman3737"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-white/40 hover:text-white transition-colors"
                  title="GitHub"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
                <a
                  href="https://www.upwork.com/freelancers/~013eb66e648776c44d"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-white/40 hover:text-white transition-colors"
                  title="Upwork"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M4.76 8.8H2.44v6.4h2.32c.96 0 1.52-.24 1.96-.68.44-.44.68-1.12.68-1.96v-1.12c0-.84-.24-1.52-.68-1.96-.44-.44-1-.68-1.96-.68zM21.64 8.8h-2.32v6.4h2.32c.96 0 1.52-.24 1.96-.68.44-.44.68-1.12.68-1.96v-1.12c0-.84-.24-1.52-.68-1.96-.44-.44-1-.68-1.96-.68zM12 8.8c-1.76 0-3.2 1.44-3.2 3.2s1.44 3.2 3.2 3.2 3.2-1.44 3.2-3.2-1.44-3.2-3.2-3.2z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-white/60 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-slate-950/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-3">
              <a
                href="https://github.com/AbdulRehman3737"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-white/60 hover:text-white py-2"
              >
                GitHub
              </a>
              <a
                href="https://www.upwork.com/freelancers/~013eb66e648776c44d"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-white/60 hover:text-white py-2"
              >
                Upwork Profile
              </a>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span className="text-sm text-indigo-300 font-medium">
              Powered by Biopython
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Advanced <span className="gradient-text">Sequence Analysis</span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
            Professional-grade bioinformatics platform for comprehensive DNA,
            RNA, and protein sequence analysis. Perform restriction mapping, ORF
            detection, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            <div className="glass-card p-6 sticky top-24">
              {/* Analysis Type Selection */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 block">
                  Analysis Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAnalysisType("basic")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 ${
                      analysisType === "basic"
                        ? "bg-indigo-500/20 border-indigo-500/50 text-white"
                        : "bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <TestTube2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Basic</span>
                  </button>
                  <button
                    onClick={() => setAnalysisType("restriction")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 ${
                      analysisType === "restriction"
                        ? "bg-indigo-500/20 border-indigo-500/50 text-white"
                        : "bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <Scissors className="w-5 h-5" />
                    <span className="text-sm font-medium">Restriction</span>
                  </button>
                </div>
              </div>

              {/* Sequence Type Selection */}
              {analysisType === "basic" && (
                <div className="mb-6">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 block">
                    Sequence Type
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: "dna", label: "DNA", color: "text-emerald-400" },
                      { id: "rna", label: "RNA", color: "text-rose-400" },
                      {
                        id: "protein",
                        label: "Protein",
                        color: "text-amber-400",
                      },
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => {
                          setSequenceType(type.id as SequenceType);
                          setSequence(
                            filterSequence(sequence, type.id as SequenceType),
                          );
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
                          sequenceType === type.id
                            ? "bg-white/10 border-white/20 text-white"
                            : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                        }`}
                      >
                        <span className="text-sm font-medium">
                          {type.label}
                        </span>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            sequenceType === type.id
                              ? "bg-current"
                              : "bg-white/20"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sequence Input */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 block">
                  {analysisType === "basic" ? "Input Sequence" : "DNA Sequence"}
                </label>
                <div className="relative">
                  <textarea
                    value={sequence}
                    onChange={(e) =>
                      setSequence(
                        filterSequence(
                          e.target.value,
                          analysisType === "restriction" ? "dna" : sequenceType,
                        ),
                      )
                    }
                    placeholder={
                      analysisType === "restriction"
                        ? "Enter DNA sequence (A, T, C, G)..."
                        : `Enter ${sequenceType.toUpperCase()} sequence...`
                    }
                    className="input-field resize-none font-mono text-sm"
                    rows={analysisType === "restriction" ? 4 : 6}
                  />
                  {sequence && (
                    <button
                      onClick={() => setSequence("")}
                      className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-white/30">
                  <span>{sequence.length} characters</span>
                  <span>
                    {analysisType === "restriction"
                      ? "DNA only"
                      : sequenceType === "dna"
                        ? "A, T, C, G"
                        : sequenceType === "rna"
                          ? "A, U, C, G"
                          : "20 amino acids"}
                  </span>
                </div>
              </div>

              {/* Restriction Enzymes */}
              {analysisType === "restriction" && (
                <div className="mb-6">
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 block">
                    Restriction Enzymes
                  </label>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {availableEnzymes?.map((enzyme) => (
                      <div
                        key={enzyme}
                        onClick={() => toggleEnzyme(enzyme)}
                        className={`enzyme-checkbox ${
                          selectedEnzymes.includes(enzyme) ? "selected" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedEnzymes.includes(enzyme)}
                          onChange={() => {}}
                          className="pointer-events-none"
                        />
                        <span className="text-sm text-white/70 font-mono">
                          {enzyme}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-white/40">
                      {availableEnzymes?.length || 0} available
                    </span>
                    <span className="text-xs text-indigo-400 font-medium">
                      {selectedEnzymes.length} selected
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || !sequence}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="spinner" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Run Analysis</span>
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={clearAll}
                    className="btn-secondary flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear</span>
                  </button>
                  <button
                    onClick={exportResults}
                    disabled={!data}
                    className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="glass-card min-h-[600px]">
              {/* Tab Navigation */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-1">
                  {[
                    { id: "results", label: "Results", icon: Activity },
                    { id: "export", label: "Export", icon: FileJson },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
                    >
                      <tab.icon className="w-4 h-4 inline mr-2" />
                      {tab.label}
                    </button>
                  ))}
                </div>
                {data && (
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    Analysis complete
                  </div>
                )}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-24">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-2 border-white/10" />
                      <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-transparent border-t-indigo-500 animate-spin" />
                    </div>
                    <p className="mt-6 text-white/60 font-medium">
                      Analyzing sequence...
                    </p>
                    <p className="mt-2 text-sm text-white/30">
                      Processing with Biopython backend
                    </p>
                  </div>
                ) : !data ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="empty-state-icon">
                      <FlaskConical className="w-8 h-8 text-white/30" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Ready to Analyze
                    </h3>
                    <p className="text-white/40 max-w-md">
                      Enter your sequence in the input panel and select an
                      analysis type to begin. Results will appear here.
                    </p>
                  </div>
                ) : (
                  <>
                    {activeTab === "results" && (
                      <div className="space-y-6 animate-fade-in">
                        {analysisType === "basic" && data && (
                          <BasicAnalysisResults
                            result={data as AnalysisResult}
                            sequenceType={sequenceType}
                            copyToClipboard={copyToClipboard}
                          />
                        )}
                        {analysisType === "restriction" && data && (
                          <RestrictionResults
                            result={data as RestrictionResult}
                            copyToClipboard={copyToClipboard}
                          />
                        )}
                      </div>
                    )}

                    {activeTab === "export" && data && (
                      <div className="space-y-6 animate-fade-in">
                        <div className="glass-card p-6">
                          <h3 className="text-lg font-semibold text-white mb-4">
                            Export Analysis Results
                          </h3>
                          <p className="text-white/50 text-sm mb-6">
                            Download your analysis results in JSON format for
                            further processing or record-keeping.
                          </p>
                          <button
                            onClick={exportResults}
                            className="btn-primary flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download JSON</span>
                          </button>
                        </div>

                        <div className="glass-card p-6">
                          <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">
                            Raw Data Preview
                          </h4>
                          <pre className="bg-black/30 rounded-xl p-4 overflow-x-auto text-xs font-mono text-white/60 max-h-96 overflow-y-auto">
                            {JSON.stringify(data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                <Dna className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-white/40">
                BioGenome Analytics © {new Date().getFullYear()}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <a
                href="https://github.com/AbdulRehman3737"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
              <a
                href="https://www.upwork.com/freelancers/~013eb66e648776c44d"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M4.76 8.8H2.44v6.4h2.32c.96 0 1.52-.24 1.96-.68.44-.44.68-1.12.68-1.96v-1.12c0-.84-.24-1.52-.68-1.96-.44-.44-1-.68-1.96-.68zM21.64 8.8h-2.32v6.4h2.32c.96 0 1.52-.24 1.96-.68.44-.44.68-1.12.68-1.96v-1.12c0-.84-.24-1.52-.68-1.96-.44-.44-1-.68-1.96-.68zM12 8.8c-1.76 0-3.2 1.44-3.2 3.2s1.44 3.2 3.2 3.2 3.2-1.44 3.2-3.2-1.44-3.2-3.2-3.2z" />
                </svg>
                Upwork
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Basic Analysis Results Component
function BasicAnalysisResults({
  result,
  sequenceType,
  copyToClipboard,
}: {
  result: AnalysisResult;
  sequenceType: SequenceType;
  copyToClipboard: (text: string, label: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Dna}
          label="Sequence Length"
          value={result?.length ?? 0}
          sublabel="bases"
          variant="blue"
          delay={0}
        />
        <StatCard
          icon={Activity}
          label="GC Content"
          value={`${result?.gcContent ? result.gcContent.toFixed(2) : "0.00"}%`}
          sublabel="stability"
          variant="green"
          delay={100}
        />
        <StatCard
          icon={Microscope}
          label="Molecular Weight"
          value={
            result?.molecularWeight
              ? result.molecularWeight.toLocaleString()
              : "0"
          }
          sublabel="Daltons"
          variant="purple"
          delay={200}
        />
        <StatCard
          icon={CheckCircle}
          label="Validity"
          value={result?.isValid ? "Valid" : "Invalid"}
          sublabel="status"
          variant={result?.isValid ? "green" : "orange"}
          delay={300}
        />
      </div>

      {/* Validation Errors */}
      {result?.isValid === false &&
        result?.errors &&
        result.errors.length > 0 && (
          <div className="glass-card border-red-500/30 bg-red-500/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold text-red-300">
                Validation Errors
              </h3>
            </div>
            <div className="space-y-2">
              {result.errors.map((error, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm text-red-300/80"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Sequence Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SequenceSection
          title="Original Sequence"
          sequence={result?.sequence || ""}
          icon={Dna}
          color="cyan"
          onCopy={() =>
            copyToClipboard(result?.sequence || "", "Original sequence")
          }
        />

        {sequenceType === "dna" && result?.reverseComplement && (
          <SequenceSection
            title="Reverse Complement"
            sequence={result.reverseComplement}
            icon={Dna}
            color="green"
            onCopy={() =>
              copyToClipboard(result.reverseComplement, "Reverse complement")
            }
          />
        )}

        {sequenceType === "dna" && result?.transcription && (
          <SequenceSection
            title="Transcription (RNA)"
            sequence={result.transcription}
            icon={Activity}
            color="purple"
            onCopy={() =>
              copyToClipboard(result.transcription, "Transcription")
            }
          />
        )}
      </div>

      {/* Translation */}
      {result?.translation && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Microscope className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Translation (Protein)
                </h4>
                <p className="text-xs text-white/40">Amino acid sequence</p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(result.translation, "Translation")}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <div className="sequence-display text-base font-semibold text-center py-6 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 border-purple-500/30">
            {result.translation}
          </div>
        </div>
      )}

      {/* Open Reading Frames */}
      {result?.orfRegions && result.orfRegions.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Sparkles className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">
                  Open Reading Frames
                </h4>
                <p className="text-xs text-white/40">
                  {result.orfRegions.length} ORFs detected
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {result.orfRegions.map((orf, index) => (
              <div key={index} className="glass-card p-5 glass-card-hover">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-orange-400">
                        ORF {index + 1}
                      </span>
                      <span className="badge badge-orange">
                        Frame{" "}
                        {orf?.frame > 0 ? `+${orf.frame}` : orf?.frame || "N/A"}
                      </span>
                    </div>
                    <div className="text-xs text-white/40">
                      {orf?.length || 0} bp
                    </div>
                  </div>
                  <div className="text-right text-xs text-white/40">
                    <div>Start: {orf?.start ?? "N/A"}</div>
                    <div>End: {orf?.end ?? "N/A"}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">
                      DNA Sequence
                    </div>
                    <div className="sequence-display text-xs py-2">
                      {orf?.sequence || "N/A"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1.5">
                      Protein Translation
                    </div>
                    <div className="sequence-display text-xs py-2 bg-orange-500/10 border-orange-500/30 text-orange-300">
                      {orf?.translation || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Restriction Analysis Results Component
function RestrictionResults({
  result,
  copyToClipboard,
}: {
  result: RestrictionResult;
  copyToClipboard: (text: string, label: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Original Sequence */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-white">Input Sequence</h4>
          <button
            onClick={() => copyToClipboard(result?.sequence || "", "Sequence")}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <div className="sequence-display text-xs max-h-24 overflow-y-auto">
          {result?.sequence || "N/A"}
        </div>
      </div>

      {/* Enzyme Results */}
      {result?.analysisResults &&
      Object.keys(result.analysisResults).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(result.analysisResults).map(
            ([enzyme, data]: [string, any]) => (
              <div key={enzyme} className="glass-card p-5 glass-card-hover">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-white">
                        {enzyme}
                      </span>
                      {data?.recognitionSequence && (
                        <span className="badge badge-blue">
                          {data.recognitionSequence}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/40 mt-1">
                      Restriction Enzyme
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {data?.fragments ?? 0}
                    </div>
                    <div className="text-xs text-white/40">Fragments</div>
                  </div>
                </div>

                {data?.error ? (
                  <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>{data.error}</span>
                  </div>
                ) : (
                  <div>
                    <div className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
                      Cutting Sites ({data?.cutting_sites?.length || 0})
                    </div>
                    <div className="sequence-display text-xs py-2 bg-white/5">
                      {data?.cutting_sites && data.cutting_sites.length > 0
                        ? data.cutting_sites.join(", ")
                        : "No cutting sites found"}
                    </div>
                  </div>
                )}
              </div>
            ),
          )}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <Scissors className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Results</h3>
          <p className="text-white/40 text-sm">
            No restriction enzyme analysis data available.
          </p>
        </div>
      )}
    </div>
  );
}
