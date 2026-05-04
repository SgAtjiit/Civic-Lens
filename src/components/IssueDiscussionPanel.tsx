"use client";

import { Report, useReports } from "@/context/ReportContext";
import {
  ThumbsUp,
  MessageCircle,
  MapPin,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronDown,
  Reply,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import Link from "next/link";

interface IssueDiscussionPanelProps {
  selectedReport: Report | null;
}

const severityColors = {
  1: { bg: "bg-yellow-50", text: "text-yellow-700", badge: "bg-yellow-100" },
  2: { bg: "bg-yellow-50", text: "text-yellow-700", badge: "bg-yellow-100" },
  3: { bg: "bg-orange-50", text: "text-orange-700", badge: "bg-orange-100" },
  4: { bg: "bg-orange-50", text: "text-orange-700", badge: "bg-orange-100" },
  5: { bg: "bg-red-50", text: "text-red-700", badge: "bg-red-100" },
};

const severityLabels: Record<number, string> = {
  1: "Low",
  2: "Low",
  3: "Medium",
  4: "High",
  5: "Critical",
};

const statusColors = {
  Reported: "text-blue-700 bg-blue-50",
  "In Review": "text-purple-700 bg-purple-50",
  "In Progress": "text-amber-700 bg-amber-50",
  Resolved: "text-green-700 bg-green-50",
};

export default function IssueDiscussionPanel({
  selectedReport,
}: IssueDiscussionPanelProps) {
  const {
    addComment,
    addReply,
    isReportSupported,
    toggleReportSupport,
    isCommentUpvoted,
    toggleCommentUpvote,
  } = useReports();
  const [newComment, setNewComment] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "top" | "relevant">("latest");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyOpen, setReplyOpen] = useState<Set<string>>(new Set());
  const [carouselIndex, setCarouselIndex] = useState(0);

  if (!selectedReport) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white rounded-2xl p-6 border border-gray-200">
        <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-700 text-center font-semibold">No issues yet</p>
        <p className="text-gray-500 text-center text-sm mt-1">
          Report the first issue to start a community thread.
        </p>
        <Link
          href="/report"
          className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Report an Issue
        </Link>
      </div>
    );
  }

  const severity = severityLabels[selectedReport.severity] || "Unknown";
  const severityColor = severityColors[selectedReport.severity as keyof typeof severityColors] || severityColors[1];
  const status = selectedReport.status || "Reported";
  const comments = selectedReport.comments || [];

  const images = useMemo(() => {
    const raw = selectedReport.image;
    const list = Array.isArray(raw) ? raw : [raw];
    return list.filter(Boolean);
  }, [selectedReport.image]);

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === "latest") return b.timestamp - a.timestamp;
    if (sortBy === "top") return b.upvotes - a.upvotes;
    return b.timestamp - a.timestamp; // Default to latest for "relevant"
  });

  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment(selectedReport.id, {
        author: "Community Member",
        content: newComment,
        upvotes: 0,
      });
      setNewComment("");
    }
  };

  const handleToggleSupport = () => {
    toggleReportSupport(selectedReport.id);
  };

  const handleToggleCommentUpvote = (commentId: string) => {
    toggleCommentUpvote(selectedReport.id, commentId);
  };

  const handleToggleReplyOpen = (commentId: string) => {
    setReplyOpen((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handlePostReply = (commentId: string) => {
    const draft = (replyDrafts[commentId] || "").trim();
    if (!draft) return;

    addReply(selectedReport.id, commentId, {
      author: "Community Member",
      content: draft,
      upvotes: 0,
    });

    setReplyDrafts((prev) => ({ ...prev, [commentId]: "" }));
    setReplyOpen((prev) => {
      const next = new Set(prev);
      next.delete(commentId);
      return next;
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Issue Header */}
      <div className="shrink-0 p-4 sm:p-5 border-b border-gray-200 bg-gray-50">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 leading-tight">
              {selectedReport.issue_type}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {selectedReport.brief_description}
            </p>
          </div>
        </div>

        {/* Issue Metadata */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {/* Severity Badge */}
          <div className={`rounded-lg px-3 py-2 ${severityColor.badge}`}>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className={`w-3.5 h-3.5 ${severityColor.text}`} />
              <span className={`text-xs font-semibold ${severityColor.text}`}>
                {severity}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`rounded-lg px-3 py-2 ${statusColors[status as keyof typeof statusColors]}`}>
            <div className="flex items-center gap-1.5">
              {status === "Resolved" ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              <span className="text-xs font-semibold">{status}</span>
            </div>
          </div>
        </div>

        {/* Location and Date */}
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {selectedReport.location ||
                `${selectedReport.lat.toFixed(2)}, ${selectedReport.lng.toFixed(2)}`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDate(selectedReport.timestamp)}</span>
          </div>
        </div>
      </div>

      {/* Issue Images (Carousel) */}
      {images.length > 0 && (
        <div className="shrink-0 w-full relative bg-gray-100">
          <div className="w-full h-44 sm:h-52 relative">
            <Image
              src={images[Math.min(carouselIndex, images.length - 1)]}
              alt="Issue"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          {images.length > 1 && (
            <div className="absolute inset-x-0 bottom-2 flex items-center justify-between px-2">
              <button
                type="button"
                onClick={() => setCarouselIndex((i) => (i - 1 + images.length) % images.length)}
                className="px-3 py-1.5 bg-white/90 hover:bg-white text-gray-800 text-xs font-semibold rounded-full border border-gray-200 shadow-sm"
              >
                Prev
              </button>
              <div className="px-2 py-1 bg-black/40 text-white text-[11px] rounded-full">
                {carouselIndex + 1}/{images.length}
              </div>
              <button
                type="button"
                onClick={() => setCarouselIndex((i) => (i + 1) % images.length)}
                className="px-3 py-1.5 bg-white/90 hover:bg-white text-gray-800 text-xs font-semibold rounded-full border border-gray-200 shadow-sm"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Issue Stats */}
      <div className="shrink-0 px-4 sm:px-5 py-3 border-b border-gray-200 bg-white flex items-center gap-4 text-sm">
        <button
          onClick={handleToggleSupport}
          className={`flex items-center gap-1.5 transition ${
            isReportSupported(selectedReport.id) ? "text-blue-700" : "text-gray-600 hover:text-blue-600"
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span className="font-semibold">
            {selectedReport.upvotes || 0} Support
          </span>
        </button>
        <div className="flex items-center gap-1.5 text-gray-600">
          <MessageCircle className="w-4 h-4" />
          <span className="font-semibold">{comments.length} Comments</span>
        </div>
      </div>

      {/* Authority Response */}
      {selectedReport.authorityResponse && (
        <div className="shrink-0 mx-4 my-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-semibold text-blue-900 mb-1">
            Authority Response
          </p>
          <p className="text-sm text-blue-800">{selectedReport.authorityResponse}</p>
        </div>
      )}

      {/* Comments Section */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Sort Options */}
        <div className="shrink-0 px-4 sm:px-5 py-3 border-b border-gray-200 flex items-center gap-2 bg-white">
          <span className="text-xs font-medium text-gray-600">Sort by:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "latest" | "top" | "relevant")
              }
              className="appearance-none text-xs px-2 py-1 pr-6 rounded border border-gray-300 hover:border-gray-400 cursor-pointer bg-white text-gray-700"
            >
              <option value="latest">Latest</option>
              <option value="top">Top</option>
              <option value="relevant">Most Relevant</option>
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {sortedComments.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-6">
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            sortedComments.map((comment) => (
              <div
                key={comment.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">
                      {comment.author}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(comment.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleCommentUpvote(comment.id)}
                    className={`shrink-0 flex items-center gap-0.5 text-xs transition ${
                      isCommentUpvoted(selectedReport.id, comment.id)
                        ? "text-blue-700"
                        : "text-gray-500 hover:text-blue-600"
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{comment.upvotes}</span>
                  </button>
                </div>
                <p className="text-sm text-gray-800 mt-2">{comment.content}</p>

                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleToggleReplyOpen(comment.id)}
                    className="text-xs font-semibold text-gray-600 hover:text-blue-600 transition flex items-center gap-1"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    Reply
                  </button>
                  <span className="text-[11px] text-gray-500">
                    {(comment.replies || []).length} repl{(comment.replies || []).length === 1 ? "y" : "ies"}
                  </span>
                </div>

                {replyOpen.has(comment.id) && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={replyDrafts[comment.id] || ""}
                      onChange={(e) =>
                        setReplyDrafts((prev) => ({ ...prev, [comment.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handlePostReply(comment.id);
                      }}
                      placeholder="Write a reply…"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                    <button
                      type="button"
                      onClick={() => handlePostReply(comment.id)}
                      className="px-3 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                    >
                      Post
                    </button>
                  </div>
                )}

                {(comment.replies || []).length > 0 && (
                  <div className="mt-3 pl-3 border-l-2 border-gray-200 space-y-2">
                    {(comment.replies || []).map((reply) => (
                      <div key={reply.id} className="p-2 bg-white rounded-md border border-gray-200">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-gray-900">{reply.author}</p>
                            <p className="text-xs text-gray-500">{formatDate(reply.timestamp)}</p>
                          </div>
                          <button
                            onClick={() => handleToggleCommentUpvote(reply.id)}
                            className={`shrink-0 flex items-center gap-0.5 text-xs transition ${
                              isCommentUpvoted(selectedReport.id, reply.id)
                                ? "text-blue-700"
                                : "text-gray-500 hover:text-blue-600"
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>{reply.upvotes}</span>
                          </button>
                        </div>
                        <p className="text-sm text-gray-800 mt-1.5">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Comment Input */}
      <div className="shrink-0 p-4 sm:p-5 border-t border-gray-200 bg-gray-50 space-y-2">
        <label htmlFor="new-comment" className="text-xs font-semibold text-gray-700">
          Add Your Comment
        </label>
        <div className="flex gap-2">
          <input
            id="new-comment"
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleAddComment();
            }}
            placeholder="Share your thoughts..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-gray-400"
          />
          <button
            onClick={handleAddComment}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
