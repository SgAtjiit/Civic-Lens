"use client";

import Map from "@/components/Map";
import IssueDiscussionPanel from "@/components/IssueDiscussionPanel";
import { useReports, Report } from "@/context/ReportContext";
import {
  AlertCircle,
  Camera,
  Clock,
  MapPin,
  ChevronUp,
  ChevronDown,
  FileWarning,
  CheckCircle2,
  BarChart3,
  Filter,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import ReportDetailModal from "@/components/ReportDetailModal";

export default function Home() {
  const { reports } = useReports();
  const [feedOpen, setFeedOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [detailModalReport, setDetailModalReport] = useState<Report | null>(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");

  // Computed stats
  const totalReports = reports.length;
  const criticalHazards = reports.filter((r) => r.severity >= 5).length;
  // Simulated resolved count (reports older than 48 hours are "resolved")
  const resolvedIssues = reports.filter(
    (r) => Date.now() - r.timestamp > 48 * 60 * 60 * 1000
  ).length;

  // Filtered reports
  const filteredReports = useMemo(() => {
    let filtered = [...reports];

    // Severity filter
    if (severityFilter === "critical") filtered = filtered.filter((r) => r.severity >= 5);
    else if (severityFilter === "high") filtered = filtered.filter((r) => r.severity >= 4);
    else if (severityFilter === "medium") filtered = filtered.filter((r) => r.severity >= 3 && r.severity < 5);
    else if (severityFilter === "low") filtered = filtered.filter((r) => r.severity < 3);

    // Time filter
    const now = Date.now();
    if (timeFilter === "24h") filtered = filtered.filter((r) => now - r.timestamp < 24 * 60 * 60 * 1000);
    else if (timeFilter === "7d") filtered = filtered.filter((r) => now - r.timestamp < 7 * 24 * 60 * 60 * 1000);
    else if (timeFilter === "30d") filtered = filtered.filter((r) => now - r.timestamp < 30 * 24 * 60 * 60 * 1000);

    return filtered;
  }, [reports, severityFilter, timeFilter]);

  const autoSelectedReport = useMemo(() => {
    const candidates = filteredReports.length > 0 ? filteredReports : reports;
    if (candidates.length === 0) return null;

    return [...candidates].sort((a, b) => {
      if (b.severity !== a.severity) return b.severity - a.severity;
      return b.timestamp - a.timestamp;
    })[0];
  }, [filteredReports, reports]);

  const activeReport = useMemo(() => {
    if (selectedReportId) {
      const selected = reports.find((report) => report.id === selectedReportId);
      if (selected) return selected;
    }

    return autoSelectedReport;
  }, [autoSelectedReport, reports, selectedReportId]);

  useEffect(() => {
    if (!autoSelectedReport) return;

    if (!selectedReportId) {
      setSelectedReportId(autoSelectedReport.id);
      return;
    }

    const stillExists = reports.some((r) => r.id === selectedReportId);
    if (!stillExists) {
      setSelectedReportId(autoSelectedReport.id);
      return;
    }

    if (filteredReports.length > 0) {
      const stillVisible = filteredReports.some((r) => r.id === selectedReportId);
      if (!stillVisible) setSelectedReportId(autoSelectedReport.id);
    }
  }, [autoSelectedReport, filteredReports, reports, selectedReportId]);

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)]">
      {/* ===== Left Panel: Stats + Map + Issue Discussion ===== */}
      <div className="w-full md:w-2/3 lg:w-[70%] flex flex-col h-[calc(100dvh-9.5rem)] sm:h-[calc(100dvh-9rem)] md:h-full shrink-0">

        {/* ===== Top Dashboard Bar ===== */}
        <div className="shrink-0 px-2 sm:px-4 pt-2 sm:pt-3 pb-2 sm:pb-3 bg-gray-50">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">

            {/* Stat Card: Total Reports */}
            <div className="flex items-center gap-2.5 bg-white rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-100 shadow-sm min-w-[130px] flex-1 sm:flex-none">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <BarChart3 className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium leading-tight">Total Reports</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{totalReports}</p>
              </div>
            </div>

            {/* Stat Card: Critical Hazards */}
            <div className="flex items-center gap-2.5 bg-white rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-100 shadow-sm min-w-[130px] flex-1 sm:flex-none">
              <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                <FileWarning className="w-4.5 h-4.5 text-red-500" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium leading-tight">Critical Hazards</p>
                <p className="text-lg sm:text-xl font-bold text-red-600 leading-tight">{criticalHazards}</p>
              </div>
            </div>

            {/* Stat Card: Resolved */}
            <div className="flex items-center gap-2.5 bg-white rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-100 shadow-sm min-w-[130px] flex-1 sm:flex-none">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4.5 h-4.5 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium leading-tight">Resolved</p>
                <p className="text-lg sm:text-xl font-bold text-green-600 leading-tight">{resolvedIssues}</p>
              </div>
            </div>

            {/* Spacer */}
            <div className="hidden lg:block flex-1" />

            {/* Filters */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-white border border-gray-200 rounded-lg pl-8 pr-8 py-2 text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer hover:border-gray-300 transition-colors"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical (5)</option>
                  <option value="high">High (4+)</option>
                  <option value="medium">Medium (3–4)</option>
                  <option value="low">Low (1–2)</option>
                </select>
              </div>

              <div className="relative flex-1 sm:flex-none">
                <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-white border border-gray-200 rounded-lg pl-8 pr-8 py-2 text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 cursor-pointer hover:border-gray-300 transition-colors"
                >
                  <option value="all">All Time</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Main Content: Map (Top) + Discussion Panel (Bottom) ===== */}
        <div className="flex-1 flex flex-col min-h-0 gap-2 sm:gap-3 p-2 sm:p-4">
          {/* Map Area */}
          <div className="flex-[0.55] min-h-[500px] relative z-0">
            <Map
              onSelectReport={(report) => setSelectedReportId(report.id)}
              filteredReports={filteredReports}
              selectedReportId={activeReport?.id}
            />
          </div>

          {/* Issue Discussion Panel */}
          <div className="flex-[0.45] min-h-0 relative z-0">
            <IssueDiscussionPanel selectedReport={activeReport} />
          </div>
        </div>
      </div>

      {/* ===== Mobile Feed Toggle Button ===== */}
      <button
        onClick={() => setFeedOpen(!feedOpen)}
        className="md:hidden flex items-center justify-center gap-2 py-2.5 bg-white border-t border-gray-200 text-sm font-medium text-gray-700 active:bg-gray-50 z-20"
      >
        {feedOpen ? (
          <>
            <ChevronDown className="w-4 h-4" />
            Hide Reports
          </>
        ) : (
          <>
            <ChevronUp className="w-4 h-4" />
            {filteredReports.length > 0 ? `View ${filteredReports.length} Report${filteredReports.length > 1 ? 's' : ''}` : 'Recent Reports'}
          </>
        )}
      </button>

      {/* ===== Right Sidebar: Feed ===== */}
      <div
        className={`
          w-full md:w-1/3 lg:w-[30%] bg-white border-l-0 md:border-l border-gray-200
          overflow-hidden flex flex-col z-10
          shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] md:shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]
          transition-all duration-300 ease-in-out
          ${feedOpen ? 'h-[55vh] pb-14' : 'h-0 md:h-full'}
          md:h-full
        `}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-white z-10 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Recent Reports
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {filteredReports.length === reports.length
              ? "Live updates from the community"
              : `Showing ${filteredReports.length} of ${reports.length} reports`
            }
          </p>
        </div>

        {/* Report List */}
        <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-3 sm:space-y-4">
          {filteredReports.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-blue-300" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                  {reports.length === 0 ? "No reports yet" : "No matching reports"}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {reports.length === 0
                    ? "Be the first to report an issue in your area."
                    : "Try adjusting your filters to see more reports."
                  }
                </p>
              </div>
              {reports.length === 0 && (
                <Link
                  href="/report"
                  className="mt-2 sm:mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors active:scale-95"
                >
                  Report Issue
                </Link>
              )}
            </div>
          ) : (
            filteredReports.map((report, index) => (
              <div
                key={report.id}
                onClick={() => setDetailModalReport(report)}
                className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group animate-fade-in-up cursor-pointer active:scale-[0.98]"
                style={{ animationDelay: `${index * 60}ms` }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDetailModalReport(report); }}
              >
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
                      report.severity >= 4 ? 'bg-red-100 text-red-700' :
                      report.severity >= 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      Severity {report.severity}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
                    {new Date(report.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-1.5 text-sm sm:text-base">
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{report.issue_type}</span>
                </h3>

                <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                  {report.brief_description}
                </p>

                <div className="relative w-full h-24 sm:h-32 rounded-lg overflow-hidden group-hover:opacity-95 transition-opacity">
                  <Image
                    src={Array.isArray(report.image) ? report.image[0] : report.image}
                    alt={report.issue_type}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />
                </div>

                <div className="mt-2 sm:mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500">
                    <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="truncate">{report.lat.toFixed(4)}, {report.lng.toFixed(4)}</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-blue-500 font-medium group-hover:text-blue-600 transition-colors">
                    View details →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== Report Detail Modal ===== */}
      {detailModalReport && (
        <ReportDetailModal
          report={detailModalReport}
          onClose={() => setDetailModalReport(null)}
        />
      )}
    </div>
  );
}
