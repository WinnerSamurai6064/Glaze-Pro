import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  MapPin, 
  Link as LinkIcon, 
  Calendar, 
  CheckCircle2, 
  X,
  Edit2,
  Check,
  UserPlus,
  UserMinus,
  Mail
} from "lucide-react";
import { User, Post } from "../types";
import ImageCropper from "./ImageCropper";

interface UserProfileProps {
  userId: string;
  currentUser: User | null;
  onPostLiked: (postId: string) => void;
  onPostReposted: (postId: string) => void;
  onPostDeleted: (postId: string) => void;
  onOpenComments: (post: Post) => void;
  onBackToTimeline: () => void;
  onUserProfileUpdated: (updatedUser: User) => void;
  onStartDirectMessage?: (userId: string) => void;
}

export default function UserProfile({
  userId,
  currentUser,
  onPostLiked,
  onPostReposted,
  onPostDeleted,
  onOpenComments,
  onBackToTimeline,
  onUserProfileUpdated,
  onStartDirectMessage,
}: UserProfileProps) {
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit fields
  const [isEditing, setIsEditing] = useState(false);
  const [editedDisplayName, setEditedDisplayName] = useState("");
  const [editedUsername, setEditedUsername] = useState("");
  const [editedBio, setEditedBio] = useState("");
  const [editError, setEditError] = useState("");

  // Crop attachments
  const [selectedCropImage, setSelectedCropImage] = useState<string | null>(null);
  const profileFileInputRef = useRef<HTMLInputElement | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadProfileAndPosts();
  }, [userId, currentUser]);

  const loadProfileAndPosts = () => {
    setIsLoading(true);
    // 1. Fetch profile user metadata
    fetch(`/api/users/${userId}`, {
      headers: currentUser ? { Authorization: `Bearer ${currentUser.id}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load account");
        return res.json();
      })
      .then((data) => {
        setProfileUser(data.user);
        setFollowersCount(data.followersCount);
        setFollowingCount(data.followingCount);
        setIsFollowing(data.isFollowing);

        // Prepopulate edit fields
        setEditedDisplayName(data.user.displayName);
        setEditedUsername(data.user.username);
        setEditedBio(data.user.bio);
        
        // 2. Fetch specific chronological posts by this user
        const url = `/api/posts?userId=${data.user.id}`;
        return fetch(url, {
          headers: currentUser ? { Authorization: `Bearer ${currentUser.id}` } : {},
        });
      })
      .then((res) => res?.json())
      .then((postsData) => {
        if (postsData) {
          setUserPosts(postsData);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  };

  const handleFollowAction = () => {
    if (!currentUser || !profileUser) return;

    fetch(`/api/users/${profileUser.id}/follow`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentUser.id}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIsFollowing(data.isFollowing);
          setFollowersCount((prev) => (data.isFollowing ? prev + 1 : Math.max(0, prev - 1)));
        }
      })
      .catch((err) => console.error(err));
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profileUser) return;

    setEditError("");
    fetch(`/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentUser.id}`,
      },
      body: JSON.stringify({
        displayName: editedDisplayName,
        bio: editedBio,
        username: editedUsername,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((json) => {
            throw new Error(json.error || "Profile edit error");
          });
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setProfileUser(data.user);
          setIsEditing(false);
          onUserProfileUpdated(data.user);
        }
      })
      .catch((err) => {
        setEditError(err instanceof Error ? err.message : "Profile update failed code 0x1A");
      });
  };

  // Image Upload handler
  const handleProfilePicSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedCropImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerPicSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!currentUser) return;
      const reader = new FileReader();
      reader.onload = () => {
        const bannerUrl = reader.result as string;
        
        // Push raw banner base64 direct to database
        fetch(`/api/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentUser.id}`,
          },
          body: JSON.stringify({ bannerPic: bannerUrl }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setProfileUser(data.user);
              onUserProfileUpdated(data.user);
            }
          })
          .catch((err) => console.error(err));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCroppedPhoto = (croppedBase64: string) => {
    if (!currentUser) return;

    fetch(`/api/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentUser.id}`,
      },
      body: JSON.stringify({ profilePic: croppedBase64 }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfileUser(data.user);
          onUserProfileUpdated(data.user);
          setSelectedCropImage(null);
        }
      })
      .catch((err) => console.error(err));
  };

  const isOwnAccount = currentUser && profileUser && currentUser.id === profileUser.id;

  if (isLoading && !profileUser) {
    return (
      <div className="flex-1 max-w-2xl border-r border-white/10 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-t-[#FF6B00] border-white/10 rounded-full animate-spin mx-auto"></div>
          <span className="text-xs text-[#FF6B00] font-mono">Resolving profile space...</span>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex-1 max-w-2xl border-r border-white/10 min-h-screen p-8 text-center space-y-4 bg-black">
        <h3 className="font-display font-medium text-white text-lg">Account Void</h3>
        <p className="text-sm text-white/40 max-w-sm mx-auto">The requested social workspace does not reside in the current Glaze nodes.</p>
        <button onClick={onBackToTimeline} className="text-[#FF6B00] text-xs hover:underline uppercase font-mono tracking-wider cursor-pointer">Return to timeline</button>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 max-w-2xl bg-black min-h-screen text-white pb-20 sm:pb-6 relative border-r border-white/10">
      
      {/* 1. STICKY GLASS HEADER PANEL */}
      <header className="sticky top-0 z-30 flex items-center gap-4 p-4 border-b border-white/10 bg-black/75 backdrop-blur-md">
        <button
          onClick={onBackToTimeline}
          className="p-2 transition rounded-full hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-1.5 font-bold">
            <h2 className="font-display font-bold text-base text-white">
              {profileUser.displayName}
            </h2>
            {profileUser.isVerified && (
              <CheckCircle2 className="w-4.5 h-4.5 text-[#FF6B00] fill-[#FF6B00]/15" />
            )}
          </div>
          <p className="text-[10px] text-white/40 font-mono">
            {userPosts.length} post{userPosts.length !== 1 && "s"} on trace
          </p>
        </div>
      </header>

      {/* 2. BRAND COVER BANNER */}
      <div className="relative h-44 sm:h-52 w-full bg-zinc-950 border-b border-white/5 overflow-hidden">
        <img
          src={profileUser.bannerPic}
          alt="User banner cover"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {isOwnAccount && (
          <div className="absolute top-4 right-4">
            <input
              ref={bannerFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerPicSelect}
              className="hidden"
            />
            <button
              onClick={() => bannerFileInputRef.current?.click()}
              className="p-2 bg-black/70 border border-white/20 rounded-full hover:bg-black text-white backdrop-blur-sm transition duration-200 shadow-md"
              title="Change cover background"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 3. PROFILE HEADER CAROUSEL DETAILS */}
      <div className="px-4 py-3 relative">
        
        {/* Rounded interactive Avatar */}
        <div className="absolute -top-16 left-4 relative group">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-black overflow-hidden bg-black relative shrink-0">
            <img
              src={profileUser.profilePic}
              alt={profileUser.displayName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {isOwnAccount && (
              <div 
                onClick={() => profileFileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200 cursor-pointer"
              >
                <Camera className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
          <input
            ref={profileFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePicSelect}
            className="hidden"
          />
        </div>

        {/* Edit / Follow CTA Placement */}
        <div className="flex justify-end gap-3 -mt-6 sm:-mt-10 min-h-[44px]">
          {isOwnAccount ? (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 border border-white/15 hover:border-[#FF6B00] text-xs font-semibold text-white bg-black hover:bg-white/5 rounded-full transition duration-300 cursor-pointer"
            >
              {isEditing ? "Cancel" : "Configure Workspace"}
            </button>
          ) : (
            currentUser && (
              <div className="flex items-center gap-2">
                {onStartDirectMessage && (
                  <button
                    onClick={() => onStartDirectMessage(profileUser.id)}
                    className="p-2 border border-white/15 hover:border-[#FF6B00] hover:bg-white/5 text-white hover:text-[#FF6B00] rounded-full transition cursor-pointer flex items-center justify-center h-8 w-8 shrink-0"
                    title="Secure Message"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleFollowAction}
                  className={`px-5 py-2 text-xs font-semibold rounded-full transition duration-300 flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 h-8 ${
                    isFollowing
                      ? "border border-red-500/30 text-red-400 hover:bg-red-500/10"
                      : "bg-white text-black hover:bg-[#FF6B00] hover:text-white"
                  }`}
                >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>Unfollow</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Follow</span>
                  </>
                )}
              </button>
              </div>
            )
          )}
        </div>

        {/* Edit fields form panel wrapper */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="mt-6 space-y-4 border border-white/10 p-5 rounded-3xl bg-white/[0.02]">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-display">Configure Identity</h4>
            
            {editError && <div className="text-xs font-medium text-red-400">{editError}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/45 font-semibold mb-1 font-mono">Display Name</label>
                <input
                  type="text"
                  value={editedDisplayName}
                  onChange={(e) => setEditedDisplayName(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-black border border-white/10 rounded-lg text-white font-medium focus:outline-none focus:border-[#FF6B00]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#FF6B00] font-semibold mb-1 font-mono">Username</label>
                <input
                  type="text"
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-black border border-white/10 rounded-lg text-white font-mono focus:outline-none focus:border-[#FF6B00]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/45 font-semibold mb-1 font-mono">Bio section</label>
              <textarea
                value={editedBio}
                onChange={(e) => setEditedBio(e.target.value)}
                rows={2}
                className="w-full text-xs px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF6B00] resize-none"
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 text-xs text-white/40 hover:text-white cursor-pointer hover:underline"
              >
                Discard
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-[#FF6B00] hover:bg-[#E05E00] rounded-full text-black transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(255,107,0,0.3)]"
              >
                Apply Updates
              </button>
            </div>
          </form>
        ) : (
          /* Profile Details Content Box */
          <div className="space-y-3.5 mt-3">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xl font-bold text-white font-display">
                  {profileUser.displayName}
                </h3>
                {profileUser.isVerified && (
                  <CheckCircle2 className="w-5 h-5 text-[#FF6B00] fill-[#FF6B00]/15 animate-none" />
                )}
              </div>
              <p className="text-xs text-white/40 font-mono">@{profileUser.username}</p>
            </div>

            {/* Account Bio */}
            <p className="text-sm text-zinc-300 leading-relaxed max-w-lg">
              {profileUser.bio}
            </p>

            {/* Profile Statistics block */}
            <div className="flex gap-5 text-xs font-semibold">
              <div className="flex items-center gap-1">
                <span className="text-white">{followingCount}</span>
                <span className="text-zinc-500 font-mono">Following</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-white">{followersCount}</span>
                <span className="text-zinc-500 font-mono">Followers</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. CHRONOLOGICAL SOCIAL ENTRIES TIMELINE FEED */}
      <div className="border-t border-white/10 mt-4">
        <div className="p-6 border-b border-white/10 bg-white/[0.01]">
          <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-widest font-mono">
            Personal Trace Feed ({userPosts.length})
          </h4>
        </div>

        {userPosts.length === 0 ? (
          <div className="p-16 text-center text-white/30 text-xs font-mono">
            Silent workspace. No entries on timeline history yet.
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-4">
            {userPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => onOpenComments(post)}
                className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 hover:border-white/12 hover:bg-white/[0.035] transition duration-200 cursor-pointer flex gap-4"
              >
                <img
                  src={profileUser.profilePic}
                  alt={profileUser.displayName}
                  className="w-12 h-12 rounded-full object-cover border border-white/10 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <span className="font-bold text-white text-sm truncate">
                        {profileUser.displayName}
                      </span>
                      {profileUser.isVerified && (
                        <CheckCircle2 className="w-4 h-4 text-[#FF6B00] fill-[#FF6B00]/15 shrink-0" />
                      )}
                      <span className="text-white/40 text-xs truncate">
                        @{profileUser.username}
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-white/95 text-sm whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>

                  {post.image && (
                    <div className="mt-3.5 rounded-2xl overflow-hidden border border-white/5 bg-zinc-950">
                      <img
                        src={post.image}
                        alt="Profile post payload"
                        className="max-h-80 w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Optional cropping window loader overlay overlay */}
      {selectedCropImage && (
        <ImageCropper
          imageSrc={selectedCropImage}
          onCrop={handleCroppedPhoto}
          onClose={() => setSelectedCropImage(null)}
        />
      )}

    </div>
  );
}
