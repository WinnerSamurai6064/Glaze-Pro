import React, { useState, useEffect } from "react";
import { X, MessageSquare, Send, CheckCircle2 } from "lucide-react";
import { Post, Comment, User } from "../types";

interface CommentsModalProps {
  post: Post;
  currentUser: User | null;
  onClose: () => void;
  onAddCommentCount: (postId: string) => void;
}

export default function CommentsModal({ post, currentUser, onClose, onAddCommentCount }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch comments on open
  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/posts/${post.id}/comments`)
      .then((res) => res.json())
      .then((data) => {
        setComments(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load comments", err);
        setIsLoading(false);
      });
  }, [post.id]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUser) return;

    setIsSubmitting(true);
    fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentUser.id}`,
      },
      body: JSON.stringify({ content: newCommentText }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Comment submission failed");
        return res.json();
      })
      .then((newComment) => {
        setComments((prev) => [...prev, newComment]);
        setNewCommentText("");
        onAddCommentCount(post.id);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-xl h-[85vh] flex flex-col border glass-panel rounded-3xl border-white/10 overflow-hidden bg-black">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.01]">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#FF6B00]" />
            <h3 className="font-display font-medium text-white">Post Thread</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Main Original Post Representation */}
          <div className="flex gap-4 pb-5 border-b border-white/5">
            <img
              src={post.user?.profilePic || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150"}
              alt={post.user?.displayName}
              className="w-11 h-11 rounded-full object-cover border border-white/10 flex-shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-white text-sm">
                  {post.user?.displayName}
                </span>
                {post.user?.isVerified && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6B00] fill-[#FF6B00]/15" />
                )}
                <span className="text-white/40 text-xs font-semibold">
                  @{post.user?.username}
                </span>
                <span className="text-white/20 text-xs">•</span>
                <span className="text-white/40 text-xs font-mono">
                  {new Date(post.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="mt-2 text-white/95 text-sm whitespace-pre-wrap leading-relaxed">
                {post.content}
              </p>
              {post.image && (
                <div className="mt-3.5 overflow-hidden rounded-2xl border border-white/5 bg-zinc-950">
                  <img
                    src={post.image}
                    alt="Post media payload"
                    className="max-h-60 w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4 pt-2">
            <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-widest px-1">
              Comments ({comments.length})
            </h4>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-t-[#FF6B00] border-white/10 rounded-full animate-spin"></div>
                <span className="text-xs text-[#FF6B00] font-mono">Retrieving stream...</span>
              </div>
            ) : comments.length === 0 ? (
              <div className="py-12 text-center text-white/30 text-xs font-mono">
                No replies yet. Be the first to add a thought.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 py-3.5 first:pt-0">
                    <img
                      src={comment.user?.profilePic || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150"}
                      alt={comment.user?.displayName}
                      className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-xs">
                          {comment.user?.displayName}
                        </span>
                        {comment.user?.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6B00] fill-[#FF6B00]/15" />
                        )}
                        <span className="text-white/40 text-[10px] font-semibold">
                          @{comment.user?.username}
                        </span>
                        <span className="text-white/20 text-[10px]">•</span>
                        <span className="text-white/40 text-[10px] font-mono">
                          {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-white/80 text-xs whitespace-pre-wrap leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input Footer Panel (Only visible if authentic current user is set) */}
        <div className="p-4 bg-white/[0.02] border-t border-white/5">
          {currentUser ? (
            <form onSubmit={handlePostComment} className="flex gap-3">
              <img
                src={currentUser.profilePic}
                alt={currentUser.displayName}
                className="w-8.5 h-8.5 rounded-full object-cover border border-white/10 flex-shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Post your reply..."
                  className="w-full bg-black border border-white/10 rounded-full px-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B00] pr-10"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newCommentText.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-[#FF6B00] hover:bg-[#FF6B00]/15 rounded-full transition disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-2 text-xs text-white/30 font-mono">
              Please sign in to react or join the social thread.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
