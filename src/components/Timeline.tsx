import React, { useState, useRef } from "react";
import { 
  Heart, 
  Repeat, 
  MessageSquare, 
  Share,
  Trash2, 
  Image as ImageIcon, 
  Send,
  CheckCircle2,
  Paperclip,
  X
} from "lucide-react";
import { Post, User } from "../types";

interface TimelineProps {
  currentUser: User | null;
  posts: Post[];
  isLoading: boolean;
  onPostCreated: (content: string, imageSrc?: string) => void;
  onPostLiked: (postId: string) => void;
  onPostReposted: (postId: string) => void;
  onPostDeleted: (postId: string) => void;
  onOpenComments: (post: Post) => void;
  onSelectUser: (userId: string) => void;
  activeFilter: "all" | "search";
  searchQuery: string;
}

export default function Timeline({
  currentUser,
  posts,
  isLoading,
  onPostCreated,
  onPostLiked,
  onPostReposted,
  onPostDeleted,
  onOpenComments,
  onSelectUser,
  activeFilter,
  searchQuery,
}: TimelineProps) {
  const [newPostText, setNewPostText] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const displayToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    onPostCreated(newPostText, attachedImage || undefined);
    setNewPostText("");
    setAttachedImage(null);
  };

  // Convert local file selected to base64 for offline-first zero dependency persistence
  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShareClick = (p: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    const mockShareUrl = `${window.location.origin}/post/${p.id}`;
    navigator.clipboard.writeText(mockShareUrl)
      .then(() => displayToast("Voice reference link copied to clipboard"));
  };

  return (
    <div className="flex-1 min-w-0 max-w-2xl bg-black min-h-screen text-white pb-20 sm:pb-6">
      
      {/* Dynamic Toast Panel */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 glass-panel border border-[#FF6B00]/30 bg-black/95 text-white text-xs font-mono px-5 py-3.5 rounded-full flex items-center justify-center shadow-lg shadow-[#FF6B00]/15">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FF6B00] mr-2.5 animate-ping"></span>
          {toastMessage}
        </div>
      )}

      {/* Sticky Header View Navigation Panel */}
      <header className="sticky top-0 z-30 flex items-center justify-between p-6 border-b border-white/10 bg-black/75 backdrop-blur-md">
        <div>
          <h2 className="font-display font-medium text-lg leading-tight text-white">
            {activeFilter === "search" ? "Search Universe" : "Timeline Feed"}
          </h2>
          <p className="text-[10px] text-white/40 font-mono tracking-wide">
            {activeFilter === "search" ? `Filtering: "${searchQuery}"` : "Chronological feed of latest voices"}
          </p>
        </div>
      </header>

      {/* NEW POST DRAFT EDITOR PANEL (Authenticated users only) */}
      {currentUser && activeFilter !== "search" && (
        <form onSubmit={handleTextSubmit} className="p-6 bg-white/5 rounded-3xl border border-white/10 m-4 sm:mx-6 sm:my-5 space-y-4 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
          <div className="flex gap-4">
            <img
              src={currentUser.profilePic}
              alt={currentUser.displayName}
              className="w-12 h-12 rounded-full object-cover border border-white/10 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <textarea
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                maxLength={280}
                placeholder="What is your voice today?"
                rows={3}
                className="w-full bg-transparent border-0 resize-none text-sm text-zinc-100 placeholder-white/40 focus:ring-0 focus:outline-none focus:border-0 pl-1"
              />

              {/* Picture attachments display */}
              {attachedImage && (
                <div className="relative mt-3 rounded-xl overflow-hidden max-h-60 border border-white/10 bg-black">
                  <img
                    src={attachedImage}
                    alt="Loaded attachment preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    className="absolute top-2 right-2 p-1.5 bg-black/75 border border-white/10 hover:bg-black rounded-full text-white transition duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10 pl-14 font-semibold">
            {/* Attachment Actions */}
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileAttach}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 transition rounded-full hover:bg-white/10 text-zinc-400 hover:text-[#FF6B00]"
                title="Attach high-res media content"
              >
                <ImageIcon className="w-5 h-5 text-[#FF6B00]" />
              </button>
            </div>

            {/* Submissions button + character count tracking */}
            <div className="flex items-center gap-4">
              <span className={`text-[10px] font-mono ${newPostText.length >= 260 ? "text-[#FF6B00] font-bold" : "text-white/40"}`}>
                {280 - newPostText.length}
              </span>
              <button
                type="submit"
                disabled={!newPostText.trim() && !attachedImage}
                className="px-6 py-2 bg-[#FF6B00] hover:bg-[#E05E00] text-black font-bold rounded-full transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,107,0,0.3)] hover:shadow-[0_0_18px_rgba(255,107,0,0.5)] cursor-pointer"
              >
                <span>Glaze</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* FEED CHRONOLOGICAL TIMELINE ITEMS SECTION */}
      {isLoading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-t-[#FF6B00] border-white/10 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-white/40 font-mono tracking-wider uppercase">Loading Social Stream</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-24 text-center px-6">
          <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-full border border-white/10 bg-zinc-950 mb-3 text-zinc-600">
            <ImageIcon className="w-5 h-5" />
          </div>
          <h3 className="font-display font-medium text-white text-base">Silent Horizon</h3>
          <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
            No matching voices identified on this timeline search branch. Share a thought to ignite the feed!
          </p>
        </div>
      ) : (
        <div className="p-4 sm:p-6 space-y-4">
          {posts.map((post) => (
            <article
              key={post.id}
              onClick={() => onOpenComments(post)}
              className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 hover:border-white/12 hover:bg-white/[0.035] transition duration-200 cursor-pointer space-y-4 relative group"
            >
              {/* Optional repost contextual banner label header */}
              {post.isRepost && (
                <div className="flex items-center gap-1.5 text-[10px] text-[#FF6B00] font-mono font-bold uppercase tracking-wider">
                  <Repeat className="w-3.5 h-3.5 text-[#FF6B00]" />
                  <span>Reposted by {post.originalAuthor?.displayName || "Member"}</span>
                </div>
              )}

              <div className="flex gap-4">
                <img
                  src={post.user?.profilePic || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150"}
                  alt={post.user?.displayName}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (post.user?.id) onSelectUser(post.user.id);
                  }}
                  className="w-12 h-12 rounded-full object-cover border border-white/10 flex-shrink-0 hover:scale-105 transition duration-200"
                  referrerPolicy="no-referrer"
                />

                <div className="min-w-0 flex-1">
                  
                  {/* Item metadata headers */}
                  <div className="flex items-center justify-between">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (post.user?.id) onSelectUser(post.user.id);
                      }}
                      className="flex items-center gap-1.5 min-w-0 flex-wrap hover:underline"
                    >
                      <span className="font-bold text-white text-sm truncate">
                        {post.user?.displayName}
                      </span>
                      {post.user?.isVerified && (
                        <CheckCircle2 className="w-4 h-4 text-[#FF6B00] fill-[#FF6B00]/15 shrink-0" />
                      )}
                      <span className="text-white/40 text-xs truncate">
                        @{post.user?.username}
                      </span>
                      <span className="text-white/20 text-xs shrink-0">•</span>
                      <span className="text-white/30 text-xs whitespace-nowrap shrink-0">
                        {new Date(post.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Delete block trigger (ONLY if authentic author matches post userId) */}
                    {currentUser && currentUser.id === post.userId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPostDeleted(post.id);
                        }}
                        className="p-1.5 rounded-full text-white/20 hover:text-red-500 hover:bg-red-500/10 transition shrink-0"
                        title="Delete voice payload"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Body Content */}
                  <p className="mt-2 text-white/95 text-sm whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>

                  {/* Body Content Image Render */}
                  {post.image && (
                    <div className="mt-3.5 rounded-2xl overflow-hidden border border-white/5 bg-zinc-950 align-middle">
                      <img
                        src={post.image}
                        alt="Shared payload image"
                        className="max-h-96 w-full object-cover hover:scale-[1.01] transition duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Interaction Controls Footer */}
                  <div className="flex justify-between items-center mt-5 text-white/30 max-w-sm pt-0.5">
                    {/* Commment Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenComments(post);
                      }}
                      className="flex items-center gap-2 hover:text-white transition duration-200"
                    >
                      <MessageSquare className="w-4.5 h-4.5" />
                      <span className="text-xs font-mono">{post.commentsCount}</span>
                    </button>

                    {/* Repost Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPostReposted(post.id);
                      }}
                      className={`flex items-center gap-2 transition duration-200 ${
                        post.repostedByCurrentUser 
                          ? "text-[#FF6B00]" 
                          : "hover:text-[#FF6B00]"
                      }`}
                    >
                      <Repeat className="w-4.5 h-4.5" />
                      <span className="text-xs font-mono">{post.repostsCount}</span>
                    </button>

                    {/* Like Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPostLiked(post.id);
                      }}
                      className={`flex items-center gap-2 transition duration-200 ${
                        post.likedByCurrentUser 
                          ? "text-[#FF6B00]" 
                          : "hover:text-red-400"
                      }`}
                    >
                      <Heart className={`w-4.5 h-4.5 ${post.likedByCurrentUser ? "fill-[#FF6B00] text-[#FF6B00]" : ""}`} />
                      <span className="text-xs font-mono">{post.likesCount}</span>
                    </button>

                    {/* Share Action Button */}
                    <button
                      onClick={(e) => handleShareClick(post, e)}
                      className="flex items-center gap-2 hover:text-[#FF6B00] transition duration-200"
                      title="Copy feed item path"
                    >
                      <Share className="w-4.5 h-4.5" />
                    </button>
                  </div>

                </div>
              </div>
            </article>
          ))}
        </div>
      )}

    </div>
  );
}
