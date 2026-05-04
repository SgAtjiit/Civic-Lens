"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type IssueType = "Pothole" | "Broken Pavement" | "Waterlogging" | "Other" | string;
export type IssueStatus = "Reported" | "In Review" | "In Progress" | "Resolved";

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  upvotes: number;
  replies: Comment[];
}

export interface Report {
  id: string;
  image: string | string[]; // base64 or array (carousel)
  lat: number;
  lng: number;
  issue_type: IssueType;
  severity: number;
  brief_description: string;
  timestamp: number;
  location?: string;
  status?: IssueStatus;
  upvotes?: number;
  comments?: Comment[];
  authorityResponse?: string;
}

interface ReportContextType {
  reports: Report[];
  addReport: (report: Omit<Report, "id" | "timestamp">) => void;
  addComment: (reportId: string, comment: Omit<Comment, "id" | "timestamp" | "replies">) => void;
  addReply: (reportId: string, parentCommentId: string, reply: Omit<Comment, "id" | "timestamp" | "replies">) => void;

  isReportSupported: (reportId: string) => boolean;
  toggleReportSupport: (reportId: string) => void;

  isCommentUpvoted: (reportId: string, commentId: string) => boolean;
  toggleCommentUpvote: (reportId: string, commentId: string) => void;

  // Backwards-compatible helpers
  upvoteReport: (reportId: string) => void;
  upvoteComment: (reportId: string, commentId: string) => void;
  updateReportStatus: (reportId: string, status: IssueStatus) => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children }: { children: React.ReactNode }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [supportedReports, setSupportedReports] = useState<Set<string>>(new Set());
  const [supportedComments, setSupportedComments] = useState<Set<string>>(new Set());

  const REPORTS_KEY = "civiclens_reports";
  const SUPPORTED_REPORTS_KEY = "civiclens_supported_reports";
  const SUPPORTED_COMMENTS_KEY = "civiclens_supported_comments";

  const seedReports = (): Report[] => {
    const svgDataUri = (label: string, bg: string) => {
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg}" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#111827" stop-opacity="0.25"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="675" fill="url(#g)"/>
  <text x="60" y="120" font-family="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" font-size="64" fill="#ffffff" font-weight="700">CivicLens</text>
  <text x="60" y="210" font-family="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" font-size="42" fill="#ffffff" opacity="0.95">${label}</text>
  <text x="60" y="280" font-family="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial" font-size="26" fill="#ffffff" opacity="0.9">Sample report (local seed)</text>
</svg>`;
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    };

    const now = Date.now();
    return [
      {
        id: "seed-1",
        image: svgDataUri("Severe pothole cluster", "#ef4444"),
        lat: 28.5355,
        lng: 77.391,
        issue_type: "Potholes",
        severity: 5,
        brief_description:
          "Multiple deep potholes causing a major hazard for cars and two-wheelers.",
        timestamp: now - 2 * 60 * 60 * 1000,
        location: "Noida Sector 18",
        status: "In Review",
        upvotes: 12,
        authorityResponse:
          "Work order raised. Temporary patching scheduled within 48 hours.",
        comments: [
          {
            id: "seed-1-c1",
            author: "Resident",
            content:
              "Saw two bikes slip here last night. Please fix urgently.",
            timestamp: now - 90 * 60 * 1000,
            upvotes: 5,
            replies: [],
          },
        ],
      },
      {
        id: "seed-2",
        image: svgDataUri("Waterlogging after rain", "#3b82f6"),
        lat: 28.5707,
        lng: 77.321,
        issue_type: "Waterlogging",
        severity: 4,
        brief_description:
          "Standing water blocks half the lane and hides road damage.",
        timestamp: now - 8 * 60 * 60 * 1000,
        location: "Noida Sector 62",
        status: "Reported",
        upvotes: 7,
        comments: [],
      },
      {
        id: "seed-3",
        image: svgDataUri("Broken pavement edge", "#f97316"),
        lat: 28.5535,
        lng: 77.402,
        issue_type: "Broken Pavement",
        severity: 3,
        brief_description:
          "Sidewalk edge is broken; pedestrians are forced onto the road.",
        timestamp: now - 26 * 60 * 60 * 1000,
        location: "Noida Sector 15",
        status: "In Progress",
        upvotes: 3,
        comments: [],
      },
    ];
  };

  useEffect(() => {
    const saved = localStorage.getItem(REPORTS_KEY);
    const writeSeed = () => {
      const seeded = seedReports();
      localStorage.setItem(REPORTS_KEY, JSON.stringify(seeded));
      setReports(seeded);
    };

    if (!saved) {
      writeSeed();
      setIsLoaded(true);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setReports(parsed);
      } else {
        writeSeed();
      }
    } catch {
      console.error("Failed to parse reports from localStorage");
      writeSeed();
    }

    // Per-user support/upvote state
    try {
      const savedSupportedReports = JSON.parse(localStorage.getItem(SUPPORTED_REPORTS_KEY) || "[]");
      if (Array.isArray(savedSupportedReports)) setSupportedReports(new Set(savedSupportedReports));
    } catch {
      // ignore
    }

    try {
      const savedSupportedComments = JSON.parse(localStorage.getItem(SUPPORTED_COMMENTS_KEY) || "[]");
      if (Array.isArray(savedSupportedComments)) setSupportedComments(new Set(savedSupportedComments));
    } catch {
      // ignore
    }

    setIsLoaded(true);
  }, []);

  const persistReports = (updated: Report[]) => {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(updated));
  };

  const persistSupportedReports = (set: Set<string>) => {
    localStorage.setItem(SUPPORTED_REPORTS_KEY, JSON.stringify(Array.from(set)));
  };

  const persistSupportedComments = (set: Set<string>) => {
    localStorage.setItem(SUPPORTED_COMMENTS_KEY, JSON.stringify(Array.from(set)));
  };

  const addReport = (report: Omit<Report, "id" | "timestamp">) => {
    const newReport: Report = {
      ...report,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      status: "Reported",
      upvotes: 0,
      comments: [],
    };
    setReports((prev) => {
      const updated = [newReport, ...prev];
      persistReports(updated);
      return updated;
    });
  };

  const addComment = (reportId: string, comment: Omit<Comment, "id" | "timestamp" | "replies">) => {
    setReports((prev) => {
      const updated = prev.map((report) => {
        if (report.id === reportId) {
          const newComment: Comment = {
            ...comment,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            replies: [],
          };
          return {
            ...report,
            comments: [newComment, ...(report.comments || [])],
          };
        }
        return report;
      });
      persistReports(updated);
      return updated;
    });
  };

  const addReplyToTree = (nodes: Comment[], parentId: string, reply: Comment): Comment[] => {
    return nodes.map((node) => {
      if (node.id === parentId) {
        return {
          ...node,
          replies: [...(node.replies || []), reply],
        };
      }
      if (node.replies && node.replies.length > 0) {
        return {
          ...node,
          replies: addReplyToTree(node.replies, parentId, reply),
        };
      }
      return node;
    });
  };

  const addReply = (
    reportId: string,
    parentCommentId: string,
    reply: Omit<Comment, "id" | "timestamp" | "replies">
  ) => {
    setReports((prev) => {
      const updated = prev.map((report) => {
        if (report.id !== reportId) return report;

        const newReply: Comment = {
          ...reply,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          upvotes: reply.upvotes ?? 0,
          replies: [],
        };

        return {
          ...report,
          comments: addReplyToTree(report.comments || [], parentCommentId, newReply),
        };
      });

      persistReports(updated);
      return updated;
    });
  };

  const upvoteReport = (reportId: string) => {
    setReports((prev) => {
      const updated = prev.map((report) =>
        report.id === reportId
          ? { ...report, upvotes: (report.upvotes || 0) + 1 }
          : report
      );
      persistReports(updated);
      return updated;
    });
  };

  const upvoteComment = (reportId: string, commentId: string) => {
    setReports((prev) => {
      const updateTree = (nodes: Comment[]): Comment[] =>
        nodes.map((node) => {
          if (node.id === commentId) {
            return { ...node, upvotes: node.upvotes + 1 };
          }
          if (node.replies && node.replies.length > 0) {
            return { ...node, replies: updateTree(node.replies) };
          }
          return node;
        });

      const updated = prev.map((report) => {
        if (report.id === reportId) {
          return {
            ...report,
            comments: updateTree(report.comments || []),
          };
        }
        return report;
      });
      persistReports(updated);
      return updated;
    });
  };

  const isReportSupported = (reportId: string) => supportedReports.has(reportId);

  const toggleReportSupport = (reportId: string) => {
    const willSupport = !supportedReports.has(reportId);
    const nextSupportedReports = new Set(supportedReports);

    if (willSupport) nextSupportedReports.add(reportId);
    else nextSupportedReports.delete(reportId);

    setSupportedReports(nextSupportedReports);
    persistSupportedReports(nextSupportedReports);

    setReports((reportsPrev) => {
      const updated = reportsPrev.map((report) =>
        report.id === reportId
          ? {
              ...report,
              upvotes: Math.max(0, (report.upvotes || 0) + (willSupport ? 1 : -1)),
            }
          : report
      );
      persistReports(updated);
      return updated;
    });
  };

  const commentKey = (reportId: string, commentId: string) => `${reportId}:${commentId}`;
  const isCommentUpvoted = (reportId: string, commentId: string) => supportedComments.has(commentKey(reportId, commentId));

  const toggleCommentUpvote = (reportId: string, commentId: string) => {
    const key = commentKey(reportId, commentId);
    const willUpvote = !supportedComments.has(key);
    const nextSupportedComments = new Set(supportedComments);

    if (willUpvote) nextSupportedComments.add(key);
    else nextSupportedComments.delete(key);

    setSupportedComments(nextSupportedComments);
    persistSupportedComments(nextSupportedComments);

    setReports((reportsPrev) => {
      const updateTree = (nodes: Comment[]): Comment[] =>
        nodes.map((node) => {
          if (node.id === commentId) {
            return {
              ...node,
              upvotes: Math.max(0, node.upvotes + (willUpvote ? 1 : -1)),
            };
          }
          if (node.replies && node.replies.length > 0) {
            return { ...node, replies: updateTree(node.replies) };
          }
          return node;
        });

      const updated = reportsPrev.map((report) => {
        if (report.id !== reportId) return report;
        return {
          ...report,
          comments: updateTree(report.comments || []),
        };
      });
      persistReports(updated);
      return updated;
    });
  };

  const updateReportStatus = (reportId: string, status: IssueStatus) => {
    setReports((prev) => {
      const updated = prev.map((report) =>
        report.id === reportId ? { ...report, status } : report
      );
      persistReports(updated);
      return updated;
    });
  };

  if (!isLoaded) return null; // Avoid hydration mismatch on initial render

  return (
    <ReportContext.Provider
      value={{
        reports,
        addReport,
        addComment,
        addReply,
        isReportSupported,
        toggleReportSupport,
        isCommentUpvoted,
        toggleCommentUpvote,
        upvoteReport,
        upvoteComment,
        updateReportStatus,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error("useReports must be used within a ReportProvider");
  }
  return context;
}
