"use client";

import { Report } from "@/context/ReportContext";
import {
  X,
  MapPin,
  AlertTriangle,
  Calendar,
  Gauge,
  FileText,
  Navigation,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useCallback } from "react";

interface ReportDetailModalProps {
  report: Report;
  onClose: () => void;
}

// Severity label + color mapping
function getSeverityInfo(severity: number) {
  if (severity >= 5) return { label: "Critical Hazard", color: "bg-red-500", textColor: "text-red-700", bgLight: "bg-red-50", barColor: "bg-red-500" };
  if (severity >= 4) return { label: "Severe", color: "bg-red-400", textColor: "text-red-600", bgLight: "bg-red-50", barColor: "bg-red-400" };
  if (severity >= 3) return { label: "Moderate", color: "bg-orange-400", textColor: "text-orange-700", bgLight: "bg-orange-50", barColor: "bg-orange-400" };
  if (severity >= 2) return { label: "Minor", color: "bg-yellow-400", textColor: "text-yellow-700", bgLight: "bg-yellow-50", barColor: "bg-yellow-400" };
  return { label: "Low", color: "bg-yellow-300", textColor: "text-yellow-700", bgLight: "bg-yellow-50", barColor: "bg-yellow-300" };
}

export default function ReportDetailModal({ report, onClose }: ReportDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const severityInfo = getSeverityInfo(report.severity);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scrolling while modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose]
  );

  const reportDate = new Date(report.timestamp);
  const formattedDate = reportDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = reportDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Static map image from OpenStreetMap
  const mapImageUrl = `https://staticmap.omnimap.io/?center=${report.lat},${report.lng}&zoom=15&size=600x250&markers=${report.lat},${report.lng}&style=osm-bright`;

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-modal-overlay"
    >
      <div className="bg-white w-full max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92dvh] sm:max-h-[85dvh] flex flex-col animate-modal-slide-up overflow-hidden">
        {/* ===== Header with Image ===== */}
        <div className="relative shrink-0">
          {/* Report Image */}
          <div className="relative w-full h-52 sm:h-60">
            <Image
              src={Array.isArray(report.image) ? report.image[0] : report.image}
              alt={report.issue_type}
              fill
              className="object-cover"
              unoptimized
            />
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Severity Badge (overlaid on image) */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className={`${severityInfo.color} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md`}>
              Severity {report.severity}/5 — {severityInfo.label}
            </span>
          </div>

          {/* Issue Type (overlaid on image) */}
          <div className="absolute bottom-3 right-3">
            <span className="bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
              {report.issue_type}
            </span>
          </div>
        </div>

        {/* ===== Scrollable Content ===== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">

          {/* Severity Progress Bar */}
          <div className={`${severityInfo.bgLight} rounded-xl p-3.5`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Gauge className={`w-4 h-4 ${severityInfo.textColor}`} />
                <span className={`text-sm font-semibold ${severityInfo.textColor}`}>Severity Assessment</span>
              </div>
              <span className={`text-lg font-bold ${severityInfo.textColor}`}>{report.severity}/5</span>
            </div>
            <div className="w-full bg-white/80 rounded-full h-2.5 overflow-hidden">
              <div
                className={`${severityInfo.barColor} h-full rounded-full transition-all duration-500`}
                style={{ width: `${(report.severity / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* AI Analysis */}
          <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">AI Analysis</span>
              <span className="ml-auto text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Gemini Vision</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {report.brief_description}
            </p>
          </div>

          {/* Location Mini-Map */}
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="relative w-full h-36 sm:h-44 bg-gray-100">
              {/* Use an iframe with OpenStreetMap embed as fallback for a simple mini-map */}
              <iframe
                title="Report Location"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${report.lng - 0.005},${report.lat - 0.003},${report.lng + 0.005},${report.lat + 0.003}&layer=mapnik&marker=${report.lat},${report.lng}`}
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
            <div className="bg-white px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  {report.lat.toFixed(6)}, {report.lng.toFixed(6)}
                </span>
              </div>
              <a
                href={`https://www.google.com/maps?q=${report.lat},${report.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Navigation className="w-3 h-3" />
                Navigate
              </a>
            </div>
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] sm:text-xs text-gray-500 font-medium">Reported On</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{formattedDate}</p>
              <p className="text-xs text-gray-500">{formattedTime}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[10px] sm:text-xs text-gray-500 font-medium">Issue Type</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{report.issue_type}</p>
              <p className="text-xs text-gray-500">Road Infrastructure</p>
            </div>
          </div>

          {/* Report ID */}
          <div className="text-center pt-1 pb-2">
            <span className="text-[10px] text-gray-400 font-mono">
              Report ID: {report.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
