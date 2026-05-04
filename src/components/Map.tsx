"use client";

import dynamic from "next/dynamic";
import { Report } from "@/context/ReportContext";

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div
      className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-gray-100 animate-pulse sm:rounded-2xl"
      style={{ position: "relative", width: "100%", height: "500px", minHeight: "500px" }}
    >
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <span className="text-gray-500 font-medium">Loading interactive map...</span>
    </div>
  ),
});

interface MapProps {
  onSelectReport?: (report: Report) => void;
  filteredReports?: Report[];
  selectedReportId?: string;
}

export default function Map({ onSelectReport, filteredReports, selectedReportId }: MapProps) {
  return (
    <div
      className="w-full"
      style={{ position: "relative", width: "100%", height: "500px", minHeight: "500px" }}
    >
      <MapComponent
        onSelectReport={onSelectReport}
        filteredReports={filteredReports}
        selectedReportId={selectedReportId}
      />
    </div>
  );
}
