import React, { useState, useEffect, useRef } from "react";
import { 
  Mail, 
  Send, 
  Search, 
  CheckCircle2, 
  ArrowLeft, 
  PlusCircle, 
  UserPlus, 
  MessageSquare,
  Sparkles,
  Inbox,
  AlertCircle
} from "lucide-react";
import { User, DirectMessage } from "../types";
import { motion } from "motion/react";

interface Conversation {
  user: {
    id: string;
    username: string;
    displayName: string;
    profilePic: string;
    isVerified?: boolean;
  };
  lastMessage: {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    createdAt: string;
    seen: boolean;
  };
  unreadCount: number;
}

interface MessagesDashboardProps {
  currentUser: User | null;
  onSelectUser: (userId: string) => void;
  onUpdateUnreadCount: () => void;
  initialPartnerId: string | null;
  onClearedInitialPartner: () => void;
  onActivePartnerChange?: (partnerId: string | null) => void;
}

export default function MessagesDashboard({
  currentUser,
  onSelectUser,
  onUpdateUnreadCount,
  initialPartnerId,
  onClearedInitialPartner,
  onActivePartnerChange
}: MessagesDashboardProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);

  useEffect(() => {
    if (onActivePartnerChange) {
      onActivePartnerChange(activePartnerId);
    }
  }, [activePartnerId, onActivePartnerChange]);
  const [selectedPartnerUser, setSelectedPartnerUser] = useState<any | null>(null);
  const [activeMessages, setActiveMessages] = useState<DirectMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState("");
  
  // Loading & error trackers
  const [isConversationsLoading, setIsConversationsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // New Chat Creator Modal state
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [directoryUsers, setDirectoryUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserListLoading, setIsUserListLoading] = useState(false);

  // Auto-scroll anchor ref
  const threadEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch conversation threads involving the user
  const fetchConversations = (silent = false) => {
    if (!currentUser) return;
    if (!silent) setIsConversationsLoading(true);

    fetch("/api/messages/conversations", {
      headers: { Authorization: `Bearer ${currentUser.id}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Offline conversations query sync");
        return res.json();
      })
      .then((data) => {
        setConversations(data);
        onUpdateUnreadCount();
      })
      .catch((err) => console.error("Conversations load failed", err))
      .finally(() => {
        if (!silent) setIsConversationsLoading(false);
      });
  };

  // 2. Fetch messages in active thread
  const fetchActiveThread = (partnerId: string, silent = false) => {
    if (!currentUser) return;
    if (!silent) setIsMessagesLoading(true);

    fetch(`/api/messages/${partnerId}`, {
      headers: { Authorization: `Bearer ${currentUser.id}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Offline thread query sync");
        return res.json();
      })
      .then((data) => {
        setActiveMessages(data.messages);
        setSelectedPartnerUser(data.partner);
        
        // If the server marked received messages of this partner as seen, update main bubble counts!
        if (!silent) {
          fetchConversations(true);
        }
      })
      .catch((err) => console.error("Thread load failed", err))
      .finally(() => {
        if (!silent) setIsMessagesLoading(false);
      });
  };

  // 3. Mount polling system and load initial lists
  useEffect(() => {
    fetchConversations();
  }, [currentUser]);

  // Handle immediate navigation if triggered from a "Message" CTA on profile page
  useEffect(() => {
    if (initialPartnerId && currentUser) {
      setActivePartnerId(initialPartnerId);
      fetchActiveThread(initialPartnerId);
      onClearedInitialPartner(); // Clear trigger in state so it doesn't repeatedly override
    }
  }, [initialPartnerId, currentUser]);

  // Set background polling to refresh DM lines (every 3.5s for snappy simulation!)
  useEffect(() => {
    if (!currentUser) return;
    
    const interval = setInterval(() => {
      fetchConversations(true);
      if (activePartnerId) {
        fetchActiveThread(activePartnerId, true);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [activePartnerId, currentUser]);

  // 4. Auto-scroll to latest message
  useEffect(() => {
    if (threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeMessages]);

  // 5. Build dynamic user pool list for new chats
  const handleOpenNewChat = () => {
    setIsNewChatModalOpen(true);
    setIsUserListLoading(true);
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        // Exclude current authorized user count from lookup directory
        const filtered = data.filter((u: User) => u.id !== currentUser?.id);
        setDirectoryUsers(filtered);
      })
      .catch((err) => console.error("Database connection registry search hit error", err))
      .finally(() => setIsUserListLoading(false));
  };

  // 6. Action: start DM with user
  const handleSelectPartnerFromDirectory = (partner: User) => {
    setIsNewChatModalOpen(false);
    setActivePartnerId(partner.id);
    setSelectedPartnerUser(partner);
    setActiveMessages([]); // Reset and download
    fetchActiveThread(partner.id);
  };

  // 7. Action: Send Direct Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activePartnerId || !newMessageText.trim()) return;

    const queryText = newMessageText.trim();
    setNewMessageText("");
    setIsSending(true);

    // Dynamic Optimistic message update for industry grade look/feel
    const optimisticMsg: DirectMessage = {
      id: "opt_msg_" + Math.random().toString(36).substring(2, 11),
      senderId: currentUser.id,
      receiverId: activePartnerId,
      content: queryText,
      createdAt: new Date().toISOString(),
      seen: false
    };

    setActiveMessages((prev) => [...prev, optimisticMsg]);

    fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentUser.id}`
      },
      body: JSON.stringify({
        receiverId: activePartnerId,
        content: queryText
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not deliver message packet");
        return res.json();
      })
      .then((confirmedMsg) => {
        // Replace optimistic rendering with official database-allocated message
        setActiveMessages((prev) => 
          prev.map((m) => m.id === optimisticMsg.id ? confirmedMsg : m)
        );
        fetchConversations(true);
      })
      .catch((err) => {
        console.error("Optimistic rollback triggered", err);
        setActiveMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      })
      .finally(() => {
        setIsSending(false);
      });
  };

  // Directory search filter
  const filteredUsers = directoryUsers.filter((user) => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(110vh-90px)] sm:h-[100vh] bg-black text-white overflow-hidden">
      
      {/* LEFT COLUMN: ACTIVE THREADS NAVIGATION (Visible on Desktop / hidden when chat is focused on mobile) */}
      <div className={`w-full md:w-80 border-r border-white/5 flex flex-col h-full bg-black shrink-0 ${activePartnerId ? "hidden md:flex" : "flex"}`}>
        
        {/* Nav Header Area */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="font-display font-medium text-lg text-white">Direct Messages</h2>
            <p className="text-[10px] text-white/40 font-mono">Military-grade secure connection</p>
          </div>
          <button 
            onClick={handleOpenNewChat}
            className="p-2 bg-white/5 border border-white/10 hover:border-[#FF6B00]/40 hover:bg-white/10 text-[#FF6B00] rounded-xl transition cursor-pointer"
            title="Start new thread"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Conversations Thread Feed List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isConversationsLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <div className="w-6 h-6 border-2 border-t-[#FF6B00] border-white/10 rounded-full animate-spin"></div>
              <span className="text-xs text-white/30 font-mono">Decrypting nodes...</span>
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-20 text-center text-white/30 text-xs font-mono px-4 space-y-4">
              <Inbox className="w-8 h-8 mx-auto stroke-[1.5] text-white/20 animate-pulse" />
              <p>No secure dialogues initialized. Speak with anyone securely across the nodes.</p>
              <button
                onClick={handleOpenNewChat}
                className="mx-auto px-4 py-2 bg-[#FF6B00] hover:bg-[#E05E00] text-black font-bold text-[10px] uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                Inaugurate Chat
              </button>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = activePartnerId === conv.user.id;
              const isLastMsgSeen = conv.lastMessage.seen || conv.lastMessage.senderId === currentUser?.id;
              return (
                <div
                  key={conv.user.id}
                  onClick={() => {
                    setActivePartnerId(conv.user.id);
                    fetchActiveThread(conv.user.id);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition cursor-pointer group select-none ${
                    isSelected 
                      ? "bg-[#FF6B00]/5 border-[#FF6B00]/20 text-white" 
                      : "bg-white/[0.015] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={conv.user.profilePic}
                      alt={conv.user.displayName}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#FF6B00] text-[9px] font-bold text-black border border-black shadow-[0_0_8px_rgba(255,107,0,0.5)]">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-bold text-xs text-white truncate group-hover:text-[#FF6B00] transition">
                          {conv.user.displayName}
                        </span>
                        {conv.user.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6B00] fill-[#FF6B00]/15 shrink-0" />
                        )}
                      </div>
                      <span className="text-[9px] font-mono text-white/30 shrink-0">
                        {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${!isLastMsgSeen ? "text-white font-semibold" : "text-white/45"}`}>
                      {conv.lastMessage.senderId === currentUser?.id ? "You: " : ""}
                      {conv.lastMessage.content}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: ACTIVE THREAD CHAT FEED VIEWPORT */}
      <div className={`flex-1 flex flex-col h-full bg-black relative ${!activePartnerId ? "hidden md:flex" : "flex"}`}>
        
        {activePartnerId && selectedPartnerUser ? (
          <>
            {/* Chat Thread Header Panel */}
            <div className="p-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back to chat list button on mobile */}
                <button
                  onClick={() => setActivePartnerId(null)}
                  className="p-1.5 hover:bg-white/10 text-white/60 hover:text-white rounded-full md:hidden shrink-0 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                {/* User Info with Profile visit redirection */}
                <div 
                  onClick={() => onSelectUser(selectedPartnerUser.id)}
                  className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-85 group"
                >
                  <img
                    src={selectedPartnerUser.profilePic}
                    alt={selectedPartnerUser.displayName}
                    className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold text-sm text-white group-hover:text-[#FF6B00] transition truncate leading-none">
                        {selectedPartnerUser.displayName}
                      </h3>
                      {selectedPartnerUser.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6B00] fill-[#FF6B00]/15 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-white/40 truncate block mt-0.5">
                      @{selectedPartnerUser.username}
                    </span>
                  </div>
                </div>
              </div>

              {/* View Profile direct tab shortcut */}
              <button
                onClick={() => onSelectUser(selectedPartnerUser.id)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-white/10 hover:border-[#FF6B00]/40 rounded-xl bg-white/[0.02] text-xs text-white/70 hover:text-white transition cursor-pointer"
              >
                <span>View Workspace</span>
              </button>
            </div>

            {/* Chat Messages Log Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              
              {/* Partner description prompt banner */}
              <div className="py-6 border-b border-white/5 text-center px-4 max-w-sm mx-auto flex flex-col items-center">
                <img
                  src={selectedPartnerUser.profilePic}
                  alt={selectedPartnerUser.displayName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#FF6B00]/20 mb-3"
                  referrerPolicy="no-referrer"
                />
                <h4 className="font-bold text-sm text-white flex items-center gap-1">
                  {selectedPartnerUser.displayName}
                  {selectedPartnerUser.isVerified && (
                    <CheckCircle2 className="w-4 h-4 text-[#FF6B00] fill-[#FF6B00]/15" />
                  )}
                </h4>
                <p className="text-white/40 text-xs mt-1">@{selectedPartnerUser.username}</p>
                {selectedPartnerUser.bio && (
                  <p className="text-[11px] text-white/50 mt-2 italic leading-relaxed line-clamp-2">
                    "{selectedPartnerUser.bio}"
                  </p>
                )}
                <span className="text-[9px] text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono font-bold mt-3">
                  Decrypted Channel
                </span>
              </div>

              {isMessagesLoading && activeMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <div className="w-6 h-6 border-2 border-t-[#FF6B00] border-white/10 rounded-full animate-spin"></div>
                  <span className="text-xs text-white/30 font-mono">Loading telemetry...</span>
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isOwn = msg.senderId === currentUser?.id;
                  const isOptimistic = msg.id.startsWith("opt_msg_");
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"} items-end gap-2`}
                    >
                      {!isOwn && (
                        <img
                          src={selectedPartnerUser.profilePic}
                          alt="Sender avatar"
                          className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0 mb-0.5"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      
                      <div className="flex flex-col max-w-[70%]">
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                            isOwn
                              ? "bg-[#FF6B00] text-black font-semibold rounded-br-none shadow-[0_4px_12px_rgba(255,107,0,0.15)]"
                              : "bg-white/[0.04] border border-white/5 text-white/95 rounded-bl-none"
                          } ${isOptimistic ? "opacity-60" : ""}`}
                        >
                          {msg.content}
                        </div>
                        <span className={`text-[9px] font-mono text-white/30 mt-1 pl-1 ${isOwn ? "text-right" : "text-left"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isOwn && (
                            <span className="ml-1.5 text-white/20">
                              {isOptimistic ? "Sending..." : "Delivered"}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              
              <div ref={threadEndRef} />
            </div>

            {/* MESSAGE ENTRY FOOTER CONTAINER */}
            <div className="p-4 bg-white/[0.01] border-t border-white/5">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  placeholder={`Write secure message to @${selectedPartnerUser.username}...`}
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-1 bg-black border border-white/10 rounded-full px-5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF6B00] transition"
                />
                <button
                  type="submit"
                  disabled={!newMessageText.trim() || isSending}
                  className="p-3 bg-[#FF6B00] hover:bg-[#E05E00] disabled:opacity-40 disabled:hover:bg-[#FF6B00] text-black rounded-full transition cursor-pointer shadow-[0_0_12px_rgba(255,107,0,0.25)] flex items-center justify-center shrink-0 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Landing viewport when no dialogue thread is open */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-[#FF6B00]/5 border border-[#FF6B00]/20 text-[#FF6B00] shadow-[0_0_24px_rgba(255,107,0,0.1)]">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-base">Symmetric Chat Gateway</h3>
              <p className="text-xs text-white/40 max-w-xs mt-1.5 mx-auto leading-relaxed font-mono">
                Select an existing partner connection from the list or inspect the registered nodes directory to trigger a secure chat.
              </p>
            </div>
            <button
              onClick={handleOpenNewChat}
              className="px-6 py-2.5 bg-[#FF6B00] hover:bg-[#E05E00] text-black font-bold text-xs uppercase tracking-wider rounded-2xl transition-transform hover:scale-105 cursor-pointer shadow-[0_0_15px_rgba(255,107,0,0.3)] animate-pulse"
            >
              Start Conversation Thread
            </button>
          </div>
        )}
      </div>

      {/* NEW CHAT USER DIRECTORY SEARCH MODAL PANEL */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm border glass-panel rounded-3xl border-white/10 bg-black shadow-[0_24px_50px_-12px_rgba(0,0,0,0.9)] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-white/5 bg-white/[0.01]">
              <h3 className="font-display font-bold text-base text-white">Initialize Dialogue</h3>
              <p className="text-[10px] text-white/40 font-mono">Select a profile key to handshake</p>
            </div>

            {/* Directory search input */}
            <div className="p-3 border-b border-white/5 bg-black">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/30">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Query names or username tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#FF6B00] transition"
                />
              </div>
            </div>

            {/* Users list log height */}
            <div className="max-h-60 overflow-y-auto p-2 space-y-1 bg-black">
              {isUserListLoading ? (
                <div className="py-8 text-center text-white/40 text-xs font-mono">
                  Accessing directories...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-8 text-center text-white/30 text-xs font-mono px-4">
                  No corresponding workspace profiles resolved.
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleSelectPartnerFromDirectory(user)}
                    className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-white/[0.03] border border-transparent hover:border-white/5 cursor-pointer transition select-none group"
                  >
                    <img
                      src={user.profilePic}
                      alt={user.displayName}
                      className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-xs text-white truncate group-hover:text-[#FF6B00] transition">
                          {user.displayName}
                        </span>
                        {user.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6B00] fill-[#FF6B00]/15 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-white/40 block">@{user.username}</span>
                    </div>
                    <UserPlus className="w-4 h-4 text-[#FF6B00]/60 group-hover:text-[#FF6B00] shrink-0 transition" />
                  </div>
                ))
              )}
            </div>

            {/* Modal actions close row */}
            <div className="p-3 bg-white/[0.01] border-t border-white/5 text-right">
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white/60 hover:text-white hover:underline cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
