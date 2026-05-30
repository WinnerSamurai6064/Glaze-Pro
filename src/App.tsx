import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Flame, 
  Search, 
  Sparkles, 
  Heart, 
  Repeat, 
  CheckCircle2, 
  Settings as SettingsIcon,
  ShieldAlert,
  Inbox,
  UserCheck,
  LifeBuoy,
  AlertTriangle,
  LogOut,
  UserX,
  Trash2,
  HelpCircle,
  Mail
} from "lucide-react";
import { User, Post, Notification } from "./types";
import Sidebar from "./components/Sidebar";
import Timeline from "./components/Timeline";
import RightSidebar from "./components/RightSidebar";
import UserProfile from "./components/UserProfile";
import CommentsModal from "./components/CommentsModal";
import AuthModal from "./components/AuthModal";
import MessagesDashboard from "./components/MessagesDashboard";

const safeLocalStorageSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`Local storage write failed for key "${key}":`, err);
    // If the error is a QuotaExceededError, try making some space by deleting non-essential cached lists
    if (key !== "glaze_session_user") {
      try {
        localStorage.removeItem("glaze_timeline_cache");
        localStorage.removeItem("glaze_notifications_cache");
      } catch (innerErr) {
        console.error("Failed to clean up cache space", innerErr);
      }
    }
  }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>((() => {
    // Initial fetch from device cache if valid
    const cached = localStorage.getItem("glaze_session_user");
    return cached ? JSON.parse(cached) : null;
  })());

  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "explore" | "notifications" | "messages" | "profile" | "settings">("home");
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [activeMessagePartnerId, setActiveMessagePartnerId] = useState<string | null>(null);
  const [isMobileChatActive, setIsMobileChatActive] = useState(false);
  
  // Modals & UI States
  const [selectedPostForComments, setSelectedPostForComments] = useState<Post | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Settings States
  const [supportDesc, setSupportDesc] = useState("");
  const [isSupportSubmitting, setIsSupportSubmitting] = useState(false);
  const [reportDesc, setReportDesc] = useState("");
  const [reportCategory, setReportCategory] = useState("Bug Report");
  const [isReportSubmitting, setIsReportSubmitting] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Micro-Toasts
  const [appToast, setAppToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setAppToast(msg);
    setTimeout(() => setAppToast(null), 2500);
  };

  // 1. Session persistence loader on app mount
  useEffect(() => {
    if (currentUser) {
      safeLocalStorageSet("glaze_session_user", JSON.stringify(currentUser));
      // Sync notifications on mount
      fetchNotifications();
      fetchUnreadMessagesCount();

      // General badge telemetry updates every 10s
      const interval = setInterval(() => {
        fetchNotifications();
        fetchUnreadMessagesCount();
      }, 10000);
      return () => clearInterval(interval);
    } else {
      localStorage.removeItem("glaze_session_user");
    }
  }, [currentUser]);

  // 2. Fetch posts based on active Tab and queries
  useEffect(() => {
    fetchPosts();
  }, [activeTab, searchQuery, currentUser]);

  const fetchPosts = () => {
    setIsLoading(true);
    let url = "/api/posts";
    if (activeTab === "explore" && searchQuery) {
      url += `?search=${encodeURIComponent(searchQuery)}`;
    }
    
    fetch(url, {
      headers: currentUser ? { Authorization: `Bearer ${currentUser.id}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error("Synchronization offline");
        return res.json();
      })
      .then((data) => {
        setPosts(data);
        // Persist timelines locally to device cache to optimize lazy loads!
        safeLocalStorageSet("glaze_timeline_cache", JSON.stringify(data));
        setNetworkError(null);
      })
      .catch((err) => {
        console.error("Timeline retrieval sync failed, loading local device cache.", err);
        // Load fallback timeline cache from localStorage so users see content offline/sync-failing!
        const cachedPosts = localStorage.getItem("glaze_timeline_cache");
        if (cachedPosts) {
          setPosts(JSON.parse(cachedPosts));
        }
        setNetworkError("Intermittent connection. Displaying cached session timeline.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const fetchNotifications = () => {
    if (!currentUser) return;
    fetch("/api/notifications", {
      headers: { Authorization: `Bearer ${currentUser.id}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data);
        safeLocalStorageSet("glaze_notifications_cache", JSON.stringify(data));
      })
      .catch((err) => {
        console.error("Failed to load notifications", err);
        const cached = localStorage.getItem("glaze_notifications_cache");
        if (cached) setNotifications(JSON.parse(cached));
      });
  };

  const fetchUnreadMessagesCount = () => {
    if (!currentUser) return;
    fetch("/api/messages/conversations", {
      headers: { Authorization: `Bearer ${currentUser.id}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Offline fetch conversations");
        return res.json();
      })
      .then((data: any[]) => {
        const total = data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setUnreadMessagesCount(total);
      })
      .catch((err) => {
        console.error("Failed to load conversation unread count", err);
      });
  };

  // Auth Operations
  const handleGoogleLogin = (email: string, displayName: string) => {
    setIsLoading(true);
    fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, displayName }),
    })
      .then((res) => res.json())
      .then((data) => {
        setCurrentUser(data.user);
        setIsAuthModalOpen(false);
        triggerToast(`Welcome to Glaze, @${data.user.username}`);
      })
      .catch((err) => {
        console.error("Authentication failed", err);
        triggerToast("Google connection timed out.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setNotifications([]);
    setActiveTab("home");
    localStorage.removeItem("glaze_session_user");
    triggerToast("Session logged out securely");
  };

  const handleDeactivateProfile = () => {
    if (!currentUser) return;
    setIsLoading(true);
    fetch("/api/profile/deactivate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${currentUser.id}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Deactivation failed");
        return res.json();
      })
      .then(() => {
        triggerToast("Profile deactivated. Logging out...");
        handleLogout();
        setShowDeactivateConfirm(false);
      })
      .catch(err => {
        console.error(err);
        triggerToast("Deactivation failed. Try again.");
      })
      .finally(() => setIsLoading(false));
  };

  const handleDeleteProfile = () => {
    if (!currentUser) return;
    setIsLoading(true);
    fetch("/api/profile", {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${currentUser.id}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Deletion failed");
        return res.json();
      })
      .then(() => {
        triggerToast("Profile deleted permanently.");
        handleLogout();
        setShowDeleteConfirm(false);
      })
      .catch(err => {
        console.error(err);
        triggerToast("Deletion failed. Try again.");
      })
      .finally(() => setIsLoading(false));
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportDesc.trim()) return;
    setIsSupportSubmitting(true);
    setTimeout(() => {
      triggerToast("Support ticket created! We will email you.");
      setSupportDesc("");
      setIsSupportSubmitting(false);
    }, 1000);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDesc.trim()) return;
    setIsReportSubmitting(true);
    setTimeout(() => {
      triggerToast(`Report submitted successfully under ${reportCategory}`);
      setReportDesc("");
      setIsReportSubmitting(false);
    }, 1000);
  };

  // SOCIAL ACTIONS (Optimistic updates implementation!)
  const handlePostCreated = (content: string, imageSrc?: string) => {
    if (!currentUser) return;

    // Create optimistic mock post for instant responsiveness
    const optimisticPost: Post = {
      id: "opt_" + Math.random().toString(36).substring(2, 11),
      userId: currentUser.id,
      content,
      image: imageSrc,
      createdAt: new Date().toISOString(),
      likesCount: 0,
      repostsCount: 0,
      commentsCount: 0,
      likedByCurrentUser: false,
      repostedByCurrentUser: false,
      user: {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        profilePic: currentUser.profilePic,
        isVerified: currentUser.isVerified
      }
    };

    // Prepend instantly to current viewport
    setPosts((prev) => [optimisticPost, ...prev]);

    // Send final request in background
    fetch("/api/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentUser.id}`,
      },
      body: JSON.stringify({ content, image: imageSrc }),
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 429) {
            throw new Error("Rate limit exceeded. Post rejected.");
          }
          throw new Error("Failed to upload story");
        }
        return res.json();
      })
      .then((finalPost) => {
        // Swap out the optimistic post with the confirmed DB-registered post
        setPosts((prev) => prev.map((p) => (p.id === optimisticPost.id ? finalPost : p)));
        triggerToast("Voice has been spread!");
      })
      .catch((err) => {
        console.error("Failed to commit post background update, rolling back timeline.", err);
        // Rollback optimistic state changes!
        setPosts((prev) => prev.filter((p) => p.id !== optimisticPost.id));
        triggerToast(err instanceof Error ? err.message : "Network error. Failed to post.");
      });
  };

  // LIKES OPTIMISTIC PIPELINE
  const handlePostLiked = (postId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    // Capture previous state in case of rollback
    const originalPosts = [...posts];

    // Optimistically update counts and visual filled states instantly
    const postToUpdate = posts.find((p) => p.id === postId);
    if (!postToUpdate) return;

    const isCurrentLiked = !!postToUpdate.likedByCurrentUser;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            likedByCurrentUser: !isCurrentLiked,
            likesCount: isCurrentLiked ? Math.max(0, p.likesCount - 1) : p.likesCount + 1,
          };
        }
        return p;
      })
    );

    // Call background database persistence stream
    fetch(`/api/posts/${postId}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${currentUser.id}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Like sync failed");
        return res.json();
      })
      .then((data) => {
        // Confirm server sync counts are aligned
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                likedByCurrentUser: data.isLiked,
                likesCount: data.likesCount,
              };
            }
            return p;
          })
        );
      })
      .catch((err) => {
        console.error("Optimistic Liked syncer failed, restoring timeline grid.", err);
        // Recover original bounds
        setPosts(originalPosts);
        triggerToast("Connection lost. Like rolled back.");
      });
  };

  // REPOST OPTIMISTIC PIPELINE
  const handlePostReposted = (postId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const originalPosts = [...posts];
    const target = posts.find((p) => p.id === postId);
    if (!target) return;

    const isCurrentReposted = !!target.repostedByCurrentUser;

    // Apply immediate local modifications
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            repostedByCurrentUser: !isCurrentReposted,
            repostsCount: isCurrentReposted ? Math.max(0, p.repostsCount - 1) : p.repostsCount + 1,
          };
        }
        return p;
      })
    );

    // Push network commit
    fetch(`/api/posts/${postId}/repost`, {
      method: "POST",
      headers: { Authorization: `Bearer ${currentUser.id}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Repost sync failed");
        return res.json();
      })
      .then((data) => {
        // Confirm count sync with actual DB status
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                repostedByCurrentUser: data.isReposted,
                repostsCount: data.repostsCount,
              };
            }
            return p;
          })
        );
        triggerToast(data.isReposted ? "Reposted to your timeline" : "Repost removed");
      })
      .catch((err) => {
        console.error("Repost update failed", err);
        setPosts(originalPosts);
        triggerToast("Verification sync timed out.");
      });
  };

  // POST DELETIONS GATED PIPELINE (Authorized owners only)
  const handlePostDeleted = (postId: string) => {
    if (!currentUser) return;

    const originalPosts = [...posts];

    // Apply instant local UI deletion
    setPosts((prev) => prev.filter((p) => p.id !== postId));

    fetch(`/api/posts/${postId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${currentUser.id}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Deletion permission failure");
        triggerToast("Voice revoked permanently.");
      })
      .catch((err) => {
        console.error("Background deletion failure, syncing layout state.", err);
        setPosts(originalPosts);
        triggerToast("Access Denied: Revocation rejected.");
      });
  };

  // Navigation callbacks
  const handleSelectUser = (userId: string) => {
    setActiveProfileId(userId);
    setActiveTab("profile");
  };

  const handleMarkNotificationsRead = () => {
    if (!currentUser) return;
    // Mark seen locally first
    setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));

    fetch("/api/notifications/read", {
      method: "POST",
      headers: { Authorization: `Bearer ${currentUser.id}` },
    })
      .then((res) => res.json())
      .catch((err) => console.error("Notification sync failure", err));
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-[#FF6B00]/30 selection:text-white">
      
      {/* Dynamic Toast System */}
      {appToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 glass-panel border border-[#FF6B00]/30 bg-black/95 text-white text-xs font-mono px-5 py-3.5 rounded-full flex items-center justify-center shadow-lg shadow-[#FF6B00]/15">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#FF6B00] mr-2.5 animate-ping"></span>
          {appToast}
        </div>
      )}

      {/* Main Multi-Column Master Visual Architecture Grid */}
      <div className="max-w-7xl mx-auto flex">
        
        {/* Navigation Column (Responsive widths) */}
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab === "profile" && activeProfileId !== currentUser?.id ? "explore" : activeTab}
          onChangeTab={(tab) => {
            setActiveTab(tab);
            setIsMobileChatActive(false);
            if (tab === "profile") {
              if (currentUser) {
                setActiveProfileId(currentUser.id);
              } else {
                setIsAuthModalOpen(true);
              }
            } else if ((tab === "notifications" || tab === "messages") && !currentUser) {
              setIsAuthModalOpen(true);
            }
          }}
          onLogout={handleLogout}
          onOpenSignIn={() => setIsAuthModalOpen(true)}
          notificationCount={notifications.filter((n) => !n.seen).length}
          unreadMessagesCount={unreadMessagesCount}
          onTriggerQuickPost={() => {
            setActiveTab("home");
            triggerToast("Direct post focus active.");
          }}
          hideMobileNav={isMobileChatActive && activeTab === "messages"}
        />

        {/* Central Viewport Grid */}
        <main className="flex-1 min-h-screen border-r border-white/5 relative min-w-0">
          
          {/* Diagnostic Network Intermittent Caution Stripe */}
          {networkError && (
            <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-xs font-mono flex items-center gap-2 justify-center">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{networkError}</span>
            </div>
          )}

          {/* HOME TIMELINE VIEWPORT TAB */}
          {activeTab === "home" && (
            <Timeline
              currentUser={currentUser}
              posts={posts}
              isLoading={isLoading}
              onPostCreated={handlePostCreated}
              onPostLiked={handlePostLiked}
              onPostReposted={handlePostReposted}
              onPostDeleted={handlePostDeleted}
              onOpenComments={setSelectedPostForComments}
              onSelectUser={handleSelectUser}
              activeFilter="all"
              searchQuery=""
            />
          )}

          {/* EXPLORE / SEARCH VIEWPORT TAB */}
          {activeTab === "explore" && (
            <Timeline
              currentUser={currentUser}
              posts={posts}
              isLoading={isLoading}
              onPostCreated={handlePostCreated}
              onPostLiked={handlePostLiked}
              onPostReposted={handlePostReposted}
              onPostDeleted={handlePostDeleted}
              onOpenComments={setSelectedPostForComments}
              onSelectUser={handleSelectUser}
              activeFilter="search"
              searchQuery={searchQuery}
            />
          )}

          {/* NOTIFICATIONS FEED VIEWPORT TAB (Secured route) */}
          {activeTab === "notifications" && (
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <div>
                  <h2 className="font-display font-medium text-lg text-white">Alert Hub</h2>
                  <p className="text-[10px] text-zinc-500 font-mono">Whispers, echoes, and connections following your traces</p>
                </div>
                {notifications.some((n) => !n.seen) && (
                  <button
                    onClick={handleMarkNotificationsRead}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#FF6B00] border border-[#FF6B00]/30 hover:bg-[#FF6B00]/10 rounded-full transition font-mono cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Clear Alerts</span>
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="py-24 text-center text-zinc-600 text-xs font-mono space-y-2">
                  <Inbox className="w-8 h-8 mx-auto stroke-[1.5] opacity-50" />
                  <p>Silence reigns. No historic connection pointers trace here.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {notifications.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        if (alert.postId) {
                          const targetDoc = posts.find(p => p.id === alert.postId);
                          if (targetDoc) {
                            setSelectedPostForComments(targetDoc);
                          } else {
                            // Manual load if not in timelines
                            fetch(`/api/posts`)
                              .then(r => r.json())
                              .then(all => {
                                const matched = all.find((p: Post) => p.id === alert.postId);
                                if (matched) setSelectedPostForComments(matched);
                              });
                          }
                        }
                      }}
                      className={`p-4 rounded-xl border transition ${
                        alert.seen 
                          ? "bg-zinc-950/20 border-white/5 text-zinc-400" 
                          : "bg-[#FF6B00]/5 border-[#FF6B00]/20 text-white shadow-[0_0_15px_rgba(255,107,0,0.02)]"
                      } flex items-start gap-4 cursor-pointer hover:border-white/15`}
                    >
                      <img
                        src={alert.sender?.profilePic}
                        alt="Alert sender avatar"
                        className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-white text-xs">{alert.sender?.displayName}</span>
                          <span className="text-zinc-500 text-[10px]">@{alert.sender?.username}</span>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1 font-sans">
                          {alert.type === "like" && "liked your recent timeline voice element"}
                          {alert.type === "comment" && "placed a reply in your discussion thread"}
                          {alert.type === "repost" && "retransmitted your voice reference layout"}
                          {alert.type === "follow" && "started following your visual trace workspace"}
                        </p>
                        <span className="block mt-1.5 text-[9px] font-mono text-zinc-600">
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PUBLIC USER PROFILE VIEWPORT TAB */}
          {activeTab === "profile" && activeProfileId && (
            <UserProfile
              userId={activeProfileId}
              currentUser={currentUser}
              onPostLiked={handlePostLiked}
              onPostReposted={handlePostReposted}
              onPostDeleted={handlePostDeleted}
              onOpenComments={setSelectedPostForComments}
              onBackToTimeline={() => setActiveTab("home")}
              onUserProfileUpdated={(updatedUser) => {
                if (currentUser && currentUser.id === updatedUser.id) {
                  setCurrentUser(updatedUser);
                }
              }}
              onStartDirectMessage={(partnerId) => {
                setActiveMessagePartnerId(partnerId);
                setActiveTab("messages");
              }}
            />
          )}

          {/* SECURE DIRECT MESSAGES DASHBOARD VIEWPORT TAB */}
          {activeTab === "messages" && (
            <MessagesDashboard
              currentUser={currentUser}
              onSelectUser={(uid) => {
                setActiveProfileId(uid);
                setActiveTab("profile");
              }}
              onUpdateUnreadCount={fetchUnreadMessagesCount}
              initialPartnerId={activeMessagePartnerId}
              onClearedInitialPartner={() => setActiveMessagePartnerId(null)}
              onActivePartnerChange={(partnerId) => setIsMobileChatActive(partnerId !== null)}
            />
          )}

          {/* GENERAL ACCOUNT SETTINGS VIEWPORT TAB */}
          {activeTab === "settings" && (
            <div className="p-4 pr-4 pl-4 sm:p-6 space-y-6 pb-20">
              <div className="border-b border-white/10 pb-4">
                <h2 className="font-display font-medium text-lg text-white">Settings</h2>
                <p className="text-[10px] text-zinc-500 font-mono">Manage your account preferences, write reports, and access support services</p>
              </div>

              {/* Profile Overview Card */}
              <div className="border border-white/5 rounded-2xl bg-white/[0.02] overflow-hidden p-5">
                <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-white/45 mb-4 block">
                  Active Session Profile
                </h3>

                {currentUser ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={currentUser.profilePic}
                        alt={currentUser.displayName}
                        className="w-12 h-12 rounded-full object-cover border border-[#FF6B00]/20"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold">
                          <span className="font-bold text-white text-sm">{currentUser.displayName}</span>
                          {currentUser.isVerified && <CheckCircle2 className="w-4 h-4 text-[#FF6B00]" />}
                        </div>
                        <span className="text-white/40 text-xs font-mono block">@{currentUser.username}</span>
                        <span className="text-white/30 text-[10px] font-mono block">{currentUser.email}</span>
                      </div>
                    </div>
                    {/* Logout Button placed elegantly on the right/bottom */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-neutral-800 border border-white/10 hover:border-white/20 text-white rounded-xl text-xs font-semibold transition active:scale-95 font-mono cursor-pointer self-stretch sm:self-auto"
                    >
                      <LogOut className="w-4 h-4 text-white/60" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="py-2 text-left">
                    <p className="text-sm text-white/40 mb-3 font-mono">No login session active on this console.</p>
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="px-5 py-2 text-xs font-bold bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] rounded-xl hover:bg-[#FF6B00]/20 transition cursor-pointer"
                    >
                      Initialize Google Session
                    </button>
                  </div>
                )}
              </div>

              {/* Help & Support Card */}
              <div className="border border-white/5 rounded-2xl bg-white/[0.02] overflow-hidden p-5">
                <div className="flex items-center gap-2 mb-3">
                  <LifeBuoy className="w-4 h-4 text-[#FF6B00]" />
                  <h3 className="font-display font-semibold text-sm text-white">
                    Support Desk
                  </h3>
                </div>
                <p className="text-xs text-white/50 mb-4">
                  Need any help with your Glaze profile or having difficulty navigating conversations? Drop us a line.
                </p>

                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-white/40 uppercase mb-1.5">How can we assist you?</label>
                    <textarea
                      value={supportDesc}
                      onChange={(e) => setSupportDesc(e.target.value)}
                      placeholder="Explain your problem or question in detail..."
                      rows={3}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF6B00]/50 transition font-sans resize-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSupportSubmitting || !supportDesc.trim()}
                    className="w-full sm:w-auto px-5 py-2 text-xs font-semibold rounded-xl bg-white text-black hover:bg-[#FF6B00] hover:text-white transition duration-200 cursor-pointer disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black shrink-0 font-mono"
                  >
                    {isSupportSubmitting ? "Creating ticket..." : "Submit Support Ticket"}
                  </button>
                </form>
              </div>

              {/* Bug & Violations Report Card */}
              <div className="border border-white/5 rounded-2xl bg-white/[0.02] overflow-hidden p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <h3 className="font-display font-semibold text-sm text-white">
                    Report Issue or Violations
                  </h3>
                </div>
                <p className="text-xs text-white/50 mb-4">
                  Identify content or behavior violating platform rules? Or found a client bug? Submit a formal report.
                </p>

                <form onSubmit={handleReportSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-white/40 uppercase mb-1.5">Category</label>
                      <select
                        value={reportCategory}
                        onChange={(e) => setReportCategory(e.target.value)}
                        className="w-full bg-black px-3 py-2 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#FF6B00]/50 font-sans"
                      >
                        <option value="Bug Report">Technical Bug Report</option>
                        <option value="Inappropriate Conduct">Inappropriate Conduct</option>
                        <option value="Spam / Bot Behavior">Spam / Bot Behavior</option>
                        <option value="Rule Violating Content">Rule Violating Content</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-white/40 uppercase mb-1.5">Description</label>
                    <textarea
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                      placeholder="Provide IDs, links or descriptive text about the bug or behavior..."
                      rows={3}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF6B00]/50 transition font-sans resize-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isReportSubmitting || !reportDesc.trim()}
                    className="w-full sm:w-auto px-5 py-2 text-xs font-semibold rounded-xl bg-white text-black hover:bg-[#FF6B00] hover:text-white transition duration-200 cursor-pointer disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black shrink-0 font-mono"
                  >
                    {isReportSubmitting ? "Submitting report..." : "Submit Formal Report"}
                  </button>
                </form>
              </div>

              {/* Danger Zone Controls Card */}
              {currentUser && (
                <div className="border border-red-500/10 rounded-2xl bg-red-500/[0.01] overflow-hidden p-5 space-y-4">
                  <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-red-400 block">
                    Danger Zone
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Deactivate Profile Button */}
                    <button
                      onClick={() => setShowDeactivateConfirm(true)}
                      className="p-3 bg-orange-500/5 hover:bg-orange-500/15 border border-orange-500/10 hover:border-orange-500/20 text-orange-400 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-2 font-mono text-center"
                    >
                      <UserX className="w-5 h-5 text-orange-400/80" />
                      <span>Deactivate Profile</span>
                    </button>

                    {/* Delete Profile Button */}
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-3 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/20 text-red-400 rounded-xl text-xs font-semibold transition active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-2 font-mono text-center"
                    >
                      <Trash2 className="w-5 h-5 text-red-500/80" />
                      <span>Delete Profile</span>
                    </button>
                  </div>

                  {/* Inline warning modal state for Profile Deactivation */}
                  {showDeactivateConfirm && (
                    <div className="p-4 border border-orange-500/20 bg-orange-500/5 rounded-xl space-y-3 mt-4">
                      <div className="flex items-start gap-2.5">
                        <UserX className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-orange-400">Deactivate Profile?</h4>
                          <p className="text-[11px] text-white/60">
                            Deactivating your profile will clear your display name, bio, and profile picture, and log you out. You can sign in again later.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setShowDeactivateConfirm(false)}
                          className="px-3 py-1.5 text-[10px] uppercase font-mono text-white/60 hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeactivateProfile}
                          className="px-4 py-1.5 text-[10px] uppercase font-mono font-bold bg-orange-500 hover:bg-orange-600 text-black rounded-lg transition cursor-pointer"
                        >
                          Confirm Deactivation
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline warning modal state for Profile Delete */}
                  {showDeleteConfirm && (
                    <div className="p-4 border border-red-500/20 bg-red-500/5 rounded-xl space-y-3 mt-4">
                      <div className="flex items-start gap-2.5">
                        <Trash2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-red-400">Delete Profile Permanently?</h4>
                          <p className="text-[11px] text-white/60">
                            Warning: This action is completely irreversible. This deletes your user credentials, history, and clears all posts/notifications from the database stream.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-3 py-1.5 text-[10px] uppercase font-mono text-white/60 hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteProfile}
                          className="px-4 py-1.5 text-[10px] uppercase font-mono font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition cursor-pointer"
                        >
                          Confirm Permanent Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </main>

        {/* Explore recommendations sidebar list (Responsive -> hidden on mobile) */}
        <RightSidebar
          currentUser={currentUser}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (activeTab !== "explore") {
              setActiveTab("explore");
            }
          }}
          onSelectUser={handleSelectUser}
        />

      </div>

      {/* Discussion stream modals overlay */}
      {selectedPostForComments && (
        <CommentsModal
          post={selectedPostForComments}
          currentUser={currentUser}
          onClose={() => setSelectedPostForComments(null)}
          onAddCommentCount={(postId) => {
            // Optimistically update comment count in feed instantly!
            setPosts((prev) =>
              prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
            );
            // Sync specific details
            if (selectedPostForComments.id === postId) {
              setSelectedPostForComments((prev) =>
                prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null
              );
            }
          }}
        />
      )}

      {/* Auth simulator dialog overlays */}
      {isAuthModalOpen && (
        <AuthModal
          onLogin={handleGoogleLogin}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

    </div>
  );
}
