import React from "react";
import { 
  Flame, 
  Home, 
  Hash, 
  Bell, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  LogOut, 
  Plus,
  Compass,
  Mail
} from "lucide-react";
import { User } from "../types";

interface SidebarProps {
  currentUser: User | null;
  activeTab: "home" | "explore" | "notifications" | "messages" | "profile" | "settings";
  onChangeTab: (tab: "home" | "explore" | "notifications" | "messages" | "profile" | "settings") => void;
  onLogout: () => void;
  onOpenSignIn: () => void;
  notificationCount: number;
  unreadMessagesCount: number;
  onTriggerQuickPost: () => void;
  hideMobileNav?: boolean;
}

export default function Sidebar({
  currentUser,
  activeTab,
  onChangeTab,
  onLogout,
  onOpenSignIn,
  notificationCount,
  unreadMessagesCount,
  onTriggerQuickPost,
  hideMobileNav = false,
}: SidebarProps) {
  
  const navItems = [
    { id: "home" as const, label: "Home", icon: Home },
    { id: "explore" as const, label: "Explore", icon: Compass },
    { id: "notifications" as const, label: "Notifications", icon: Bell, badge: notificationCount },
    ...(currentUser ? [
      { id: "messages" as const, label: "Messages", icon: Mail, badge: unreadMessagesCount },
      { id: "profile" as const, label: "Profile", icon: UserIcon }
    ] : []),
    { id: "settings" as const, label: "Settings", icon: SettingsIcon },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR PANEL (Large screens -> xl, l) */}
      <aside className="hidden sm:flex flex-col justify-between h-screen sticky top-0 w-16 xl:w-64 px-4 py-6 border-r border-white/10 bg-black text-white">
        <div className="space-y-8">
          {/* Logo Brand Title */}
          <div 
            onClick={() => onChangeTab("home")}
            className="flex items-center gap-3 px-1 cursor-pointer group"
          >
            <div className="w-10 h-10 bg-[#FF6B00] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(255,107,0,0.5)] shrink-0 transition-transform duration-200 group-hover:scale-105">
              <div className="w-5 h-5 border-[3px] border-black rounded-full"></div>
            </div>
            <span className="hidden xl:block font-display font-bold text-2xl tracking-tight uppercase text-white group-hover:text-[#FF6B00] transition-colors">
              Glaze
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-grow flex flex-col space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onChangeTab(item.id)}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl text-sm font-semibold transition-colors group relative ${
                    isActive 
                      ? "text-[#FF6B00] bg-white/5" 
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    <Icon className={`w-5.5 h-5.5 ${isActive ? "text-[#FF6B00]" : "text-white/70 group-hover:text-white"}`} />
                    {item.badge && item.badge > 0 ? (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#FF6B00] text-[9px] font-bold text-black leading-none shadow-[0_0_8px_rgba(255,107,0,0.5)]">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <span className="hidden xl:block">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* CREATE POST CALL-T0-ACTION (CTA) */}
          {currentUser && (
            <button
              onClick={onTriggerQuickPost}
              className="w-full flex items-center justify-center xl:gap-2 px-4 py-2.5 bg-[#FF6B00] text-black font-bold rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,107,0,0.3)] hover:shadow-[0_0_20px_rgba(255,107,0,0.5)]"
            >
              <Plus className="w-5 h-5 shrink-0" />
              <span className="hidden xl:block text-xs uppercase tracking-wider font-bold">Glaze</span>
            </button>
          )}
        </div>

        {/* FOOTER USER CARD */}
        <div className="pt-4 border-t border-white/10 space-y-4">
          {currentUser ? (
            <div className="flex flex-col xl:flex-row items-center justify-between gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
              <div 
                onClick={() => onChangeTab("profile")}
                className="flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-85 transition w-full xl:w-auto"
              >
                <img
                  src={currentUser.profilePic}
                  alt={currentUser.displayName}
                  className="w-8 h-8 rounded-full object-cover border border-white/10"
                  referrerPolicy="no-referrer"
                />
                <div className="hidden xl:block min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">
                    {currentUser.displayName}
                  </h4>
                  <p className="text-[10px] text-white/40 truncate">
                    @{currentUser.username}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Disconnect session"
                className="p-1.5 text-white/40 hover:text-[#FF6B00] transition rounded-full hover:bg-white/5 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenSignIn}
              className="w-full py-2.5 px-4 border border-[#FF6B00]/40 hover:border-[#FF6B00] text-xs font-bold text-white bg-black hover:bg-[#FF6B00]/10 rounded-full transition duration-200"
            >
              Sign In
            </button>
          )}

          {/* Trademark and details */}
          <div className="hidden xl:block px-2 text-[9px] text-white/20 tracking-widest uppercase text-center font-mono">
            Built by TREYTEK ©
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {!hideMobileNav && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-lg border-t border-white/10 flex justify-around items-center py-2.5 px-4 shadow-[0_-5px_25px_rgba(0,0,0,0.8)] pb-5">
          {(() => {
            if (currentUser) {
              //Symmetrical split: first 3 items (Home, Explore, Notifications), Plus button in center, last 3 items (Messages, Profile, Settings)
              const firstHalf = navItems.slice(0, 3);
              const secondHalf = navItems.slice(3);

              const renderItem = (item: typeof navItems[number]) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onChangeTab(item.id)}
                    className={`p-2.5 rounded-full relative transition duration-150 active:scale-90 ${
                      isActive ? "text-[#FF6B00]" : "text-white/40 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5.5 h-5.5" />
                    {item.badge && item.badge > 0 ? (
                      <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#FF6B00] text-[8px] font-bold text-black border border-black shadow-[0_0_6px_rgba(255,107,0,0.5)]">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              };

              return (
                <>
                  {firstHalf.map(renderItem)}
                  <button
                    onClick={onTriggerQuickPost}
                    className="flex items-center justify-center w-11 h-11 rounded-full bg-[#FF6B00] text-black shadow-[0_0_15px_rgba(255,107,0,0.4)] active:scale-90 transition-transform duration-150 shrink-0 mx-1 cursor-pointer"
                    title="Glaze something new"
                  >
                    <Plus className="w-6 h-6 stroke-[2.5]" />
                  </button>
                  {secondHalf.map(renderItem)}
                </>
              );
            } else {
              // Symmetrical navigation without the compose button
              return navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onChangeTab(item.id)}
                    className={`p-2.5 rounded-full relative transition duration-150 active:scale-90 ${
                      isActive ? "text-[#FF6B00]" : "text-white/40 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5.5 h-5.5" />
                    {item.badge && item.badge > 0 ? (
                      <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#FF6B00] text-[8px] font-bold text-black border border-black shadow-[0_0_6px_rgba(255,107,0,0.5)]">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              });
            }
          })()}
        </div>
      )}
    </>
  );
}
