"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import {
  Loader2,
  TestTube,
  Dna,
  Atom,
  Scissors,
  Download,
  Eye,
} from "lucide-react";

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

export default function EnhancedBioinformaticsApp() {
  const [sequence, setSequence] = useState("");
  const [analysisType, setAnalysisType] = useState<AnalysisType>("basic");
  const [sequenceType, setSequenceType] = useState("dna");
  const [selectedEnzymes, setSelectedEnzymes] = useState<string[]>([]);
  const [availableEnzymes, setAvailableEnzymes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("results");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch available enzymes on mount
  useEffect(() => {
    const fetchEnzymes = async () => {
      try {
        const response = await fetch("/api/enzymes");
        const data = await response.json();
        setAvailableEnzymes(data.availableEnzymes);
      } catch (error) {
        console.error("Failed to fetch enzymes:", error);
      }
    };
    fetchEnzymes();
  }, []);

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

  const analyzeSequence = async () => {
    const result = await getAnalysisData();
    return result;
  };

  const exportResults = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis_results_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <TestTube className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Advanced Bioinformatics Suite
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Comprehensive sequence analysis with Biopython backend
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              {/* Analysis Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Analysis Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "basic", label: "Basic Analysis", icon: Dna },
                    {
                      id: "restriction",
                      label: "Restriction Analysis",
                      icon: Scissors,
                    },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setAnalysisType(type.id as AnalysisType)}
                      className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                        analysisType === type.id
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <type.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sequence Input */}
              {analysisType === "basic" && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Single Sequence
                  </label>
                  <div className="relative">
                    <textarea
                      value={sequence}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        const seqType = sequenceType;
                        let filteredValue;

                        if (seqType === "dna") {
                          filteredValue = value.replace(/[^ATCG]/g, "");
                        } else if (seqType === "rna") {
                          filteredValue = value.replace(/[^AUCG]/g, "");
                        } else {
                          // Protein - allow standard amino acid codes
                          filteredValue = value.replace(
                            /[^ACDEFGHIKLMNPQRSTVWY]/g,
                            "",
                          );
                        }

                        setSequence(filteredValue);
                      }}
                      placeholder="Enter sequence (DNA: A,T,C,G | RNA: A,U,C,G | Protein: A,C,D,E,F,G,H,I,K,L,M,N,P,Q,R,S,T,V,W,Y)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={6}
                    />
                    {sequence && (
                      <button
                        onClick={() => setSequence("")}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Only A, T, C, G, U characters are allowed
                  </div>
                </div>
              )}

              {/* Restriction Analysis */}
              {analysisType === "restriction" && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DNA Sequence
                  </label>
                  <div className="relative mb-4">
                    <textarea
                      value={sequence}
                      onChange={(e) =>
                        setSequence(
                          e.target.value.toUpperCase().replace(/[^ATCG]/g, ""),
                        )
                      }
                      placeholder="Enter DNA sequence"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                  </div>

                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Restriction Enzymes
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {availableEnzymes?.slice(0, 20).map((enzyme) => (
                      <label
                        key={enzyme}
                        className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEnzymes.includes(enzyme)}
                          onChange={() => toggleEnzyme(enzyme)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>{enzyme}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Selected: {selectedEnzymes.length} enzymes
                  </div>
                </div>
              )}

              {/* Sequence Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sequence Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "dna",
                      label: "DNA",
                      icon: Dna,
                      color: "text-green-600",
                    },
                    {
                      id: "rna",
                      label: "RNA",
                      icon: Atom,
                      color: "text-red-600",
                    },
                    {
                      id: "protein",
                      label: "Protein",
                      icon: Atom,
                      color: "text-yellow-600",
                    },
                  ].map((type) => (
                    <label
                      key={type.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        value={type.id}
                        checked={sequenceType === type.id}
                        onChange={(e) => setSequenceType(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <type.icon className={`w-5 h-5 ${type.color}`} />
                      <span className="text-gray-700">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={clearAll}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const result = await getAnalysisData();
                      setData(result);
                    } catch (error) {
                      console.error("Analysis failed:", error);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    "Analyze"
                  )}
                </button>
                <button
                  onClick={exportResults}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  disabled={!data}
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 mb-6">
                {[
                  { id: "results", label: "Results", icon: Eye },
                  { id: "visualization", label: "Visualization", icon: Eye },
                  { id: "export", label: "Export", icon: Download },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Results Content */}
              <div className="space-y-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
                    <p className="text-gray-600">
                      Analyzing sequence with Biopython...
                    </p>
                  </div>
                ) : !data ? (
                  <div className="text-center py-12 text-gray-500">
                    <TestTube className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>Enter sequences and select analysis type to begin</p>
                  </div>
                ) : (
                  <>
                    {analysisType === "basic" && data && (
                      <BasicAnalysisResults
                        result={data as AnalysisResult}
                        sequenceType={sequenceType}
                      />
                    )}

                    {analysisType === "restriction" && data && (
                      <RestrictionResults result={data as RestrictionResult} />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Component for basic analysis results
function BasicAnalysisResults({
  result,
  sequenceType,
}: {
  result: AnalysisResult;
  sequenceType: string;
}) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-600">Length</div>
              <div className="text-3xl font-bold text-blue-900">
                {result?.length ?? 0}
              </div>
            </div>
            <div className="text-blue-400">
              <Dna className="w-8 h-8" />
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-600">nucleotides</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-600">
                GC Content
              </div>
              <div className="text-3xl font-bold text-green-900">
                {result?.gcContent ? result.gcContent.toFixed(2) : "0.00"}%
              </div>
            </div>
            <div className="text-green-400">
              <Atom className="w-8 h-8" />
            </div>
          </div>
          <div className="mt-2 text-xs text-green-600">base pairs</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-purple-600">
                Molecular Weight
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {result?.molecularWeight
                  ? result.molecularWeight.toLocaleString()
                  : "0"}
              </div>
            </div>
            <div className="text-purple-400">
              <Atom className="w-8 h-8" />
            </div>
          </div>
          <div className="mt-2 text-xs text-purple-600">Da</div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600">
                Sequence Validity
              </div>
              <div
                className={`text-2xl font-bold ${
                  result?.isValid ? "text-green-600" : "text-red-600"
                }`}
              >
                {result?.isValid ? "Valid" : "Invalid"}
              </div>
            </div>
            <div
              className={`text-4xl ${result?.isValid ? "text-green-400" : "text-red-400"}`}
            >
              {result?.isValid ? "✓" : "✗"}
            </div>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {result?.isValid === false &&
        result?.errors &&
        result.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="text-red-800 font-semibold text-lg">
                Validation Errors
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.errors.map((error, index) => (
                <div
                  key={index}
                  className="bg-white p-3 rounded-lg border border-red-100"
                >
                  <span className="text-red-700">
                    {error || "Unknown error"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Sequence Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Sequence */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900">
              Original Sequence
            </h3>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
            <div className="font-mono text-sm break-all leading-relaxed">
              {result?.sequence || "No sequence available"}
            </div>
          </div>
        </div>

        {/* Reverse Complement & Transcription */}
        {sequenceType === "dna" && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Reverse Complement
                </h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                <div className="font-mono text-sm break-all leading-relaxed">
                  {result?.reverseComplement || "N/A"}
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Transcription (RNA)
                </h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                <div className="font-mono text-sm break-all leading-relaxed">
                  {result?.transcription || "N/A"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Translation */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-900">
            Translation (Protein)
          </h3>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-dashed border-purple-200">
          <div className="font-mono text-lg font-semibold text-purple-900 text-center">
            {result?.translation || "No translation available"}
          </div>
          <div className="mt-2 text-sm text-purple-600 text-center">
            Amino acid sequence
          </div>
        </div>
      </div>

      {/* Open Reading Frames */}
      {result?.orfRegions && result.orfRegions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <h3 className="text-lg font-semibold text-gray-900">
              Open Reading Frames
            </h3>
            <div className="ml-auto text-sm text-gray-500">
              {result.orfRegions.length} ORFs found
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {result.orfRegions.map((orf, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xl font-bold text-orange-600">
                        ORF {index + 1}
                      </span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                        Frame{" "}
                        {orf?.frame > 0 ? `+${orf.frame}` : orf?.frame || "N/A"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {orf?.length || 0} base pairs
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      Start: {orf?.start ?? "N/A"}
                    </div>
                    <div className="text-sm text-gray-500">
                      End: {orf?.end ?? "N/A"}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-2">
                      DNA Sequence
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm">
                      {orf?.sequence || "N/A"}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-2">
                      Protein Sequence
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-3 rounded-lg font-mono text-sm font-semibold">
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

// Component for restriction analysis results
function RestrictionResults({ result }: { result: RestrictionResult }) {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-sm text-gray-600 mb-2">Original Sequence</div>
        <div className="font-mono text-sm break-all">
          {result?.sequence || "No sequence available"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {result?.analysisResults &&
        Object.keys(result.analysisResults).length > 0 ? (
          Object.entries(result.analysisResults).map(([enzyme, data]) => (
            <div key={enzyme} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-medium">{enzyme}</span>
                  {data?.recognitionSequence && (
                    <div className="text-xs text-gray-500 mt-1">
                      Recognition: {data.recognitionSequence}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Fragments</div>
                  <div className="font-bold">{data?.fragments ?? 0}</div>
                </div>
              </div>

              {data?.error ? (
                <div className="text-red-600 text-sm">{data.error}</div>
              ) : (
                <>
                  <div className="text-sm text-gray-600 mb-2">
                    Cutting Sites:
                  </div>
                  <div className="font-mono text-sm bg-gray-50 p-2 rounded">
                    {data?.cutting_sites && data.cutting_sites.length > 0
                      ? data.cutting_sites.join(", ")
                      : "No cutting sites found"}
                  </div>
                </>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            No restriction analysis data available
          </div>
        )}
      </div>
    </div>
  );
}
