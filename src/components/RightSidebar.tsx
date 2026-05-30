import React, { useState, useEffect } from "react";
import { Search, Plus, Check, UserPlus, CheckCircle2 } from "lucide-react";
import { User } from "../types";

interface RightSidebarProps {
  currentUser: User | null;
  onSearchChange: (q: string) => void;
  onSelectUser: (userId: string) => void;
}

export default function RightSidebar({ currentUser, onSearchChange, onSelectUser }: RightSidebarProps) {
  const [searchVal, setSearchVal] = useState("");
  const [recommendations, setRecommendations] = useState<User[]>([]);
  const [followedIds, setFollowedIds] = useState<string[]>([]);

  // Load who-to-follow suggestions from database
  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data: User[]) => {
        // Exclude current logged in user
        const list = data.filter((u) => u.id !== currentUser?.id).slice(0, 3);
        setRecommendations(list);
      })
      .catch((err) => console.error("Failed to load recommendations", err));
  }, [currentUser]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchVal);
  };

  const handleQuickFollow = (targetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;

    fetch(`/api/users/${targetId}/follow`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentUser.id}`,
      },
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          if (followedIds.includes(targetId)) {
            setFollowedIds(prev => prev.filter(id => id !== targetId));
          } else {
            setFollowedIds(prev => [...prev, targetId]);
          }
        }
      })
      .catch((err) => console.error(err));
  };

  const trendTopics = [
    { category: "Trending in Design", topic: "OLED Minimalism", tweets: "14.2K whispers" },
    { category: "Trending in Development", topic: "React 19 Hooks", tweets: "28.5K whispers" },
    { category: "Trending in Layouts", topic: "Glassmorphic Glass", tweets: "8.9K whispers" },
    { category: "Trending in Typography", topic: "Space Grotesk", tweets: "5.4K whispers" },
  ];

  return (
    <aside className="hidden lg:block w-80 shrink-0 sticky top-0 h-screen overflow-y-auto px-6 py-6 space-y-6 text-white border-l border-white/10 bg-black">
      
      {/* 1. Global Search Box Widget */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-white/40">
          <Search className="w-4.5 h-4.5" />
        </span>
        <input
          type="text"
          value={searchVal}
          onChange={(e) => {
            setSearchVal(e.target.value);
            onSearchChange(e.target.value); // Instant search matching
          }}
          placeholder="Explore posts or profiles..."
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-full text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FF6B00] transition"
        />
      </form>

      {/* 2. Who to Follow Recommendations */}
      <div className="border border-white/5 bg-white/[0.02] rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-display font-semibold text-[11px] uppercase tracking-wider text-white/45">
            Who to Follow
          </h3>
        </div>

        <div className="divide-y divide-white/5">
          {recommendations.length === 0 ? (
            <p className="p-4 text-xs font-mono text-zinc-650 text-center">No other voices present.</p>
          ) : (
            recommendations.map((user) => {
              const following = followedIds.includes(user.id);
              return (
                <div
                  key={user.id}
                  onClick={() => onSelectUser(user.id)}
                  className="flex items-center justify-between p-3.5 hover:bg-white/5 transition duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={user.profilePic}
                      alt={user.displayName}
                      className="w-9 h-9 rounded-full object-cover border border-white/10 flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 font-semibold">
                        <span className="font-bold text-white text-xs truncate">
                          {user.displayName}
                        </span>
                        {user.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6B00] fill-[#FF6B00]/15" />
                        )}
                      </div>
                      <span className="text-white/40 text-[10px] truncate block">
                        @{user.username}
                      </span>
                    </div>
                  </div>

                  {currentUser && (
                    <button
                      onClick={(e) => handleQuickFollow(user.id, e)}
                      className={`p-1.5 rounded-full transition shrink-0 cursor-pointer ${
                        following
                          ? "bg-transparent text-[#FF6B00] border border-[#FF6B00]/30"
                          : "bg-white/10 hover:bg-[#FF6B00] text-zinc-300 hover:text-black hover:scale-105 active:scale-95"
                      }`}
                      title={following ? "Following" : "Follow"}
                    >
                      {following ? <Check className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Trends Widget */}
      <div className="border border-white/5 bg-white/[0.02] rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-display font-semibold text-[11px] uppercase tracking-wider text-white/45">
            Trends for You
          </h3>
        </div>

        <div className="divide-y divide-white/5">
          {trendTopics.map((trend, index) => (
            <div
              key={index}
              className="p-3.5 hover:bg-white/5 transition duration-200 cursor-pointer"
            >
              <div className="text-[10px] text-white/40 font-mono">{trend.category}</div>
              <div className="text-white text-xs font-semibold py-0.5">{trend.topic}</div>
              <div className="text-[10px] text-white/30 font-mono">{trend.tweets}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Branding TradeMark Footer Section */}
      <div className="px-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse"></span>
          <span className="text-[10px] text-white/40 font-mono tracking-wide">
            Glaze OLED Cluster Active
          </span>
        </div>
        <p className="text-[10px] text-white/30 font-sans tracking-wide leading-relaxed">
          Designed for pure high-contrast social experience. No noise, raw focus.
        </p>
        <p className="text-[11px] font-mono text-white/40 mt-4 pt-4 border-t border-white/5 font-semibold">
          Built by TREYTEK ©
        </p>
      </div>

    </aside>
  );
}
