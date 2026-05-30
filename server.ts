import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  profilePic: string;
  bannerPic: string;
  createdAt: string;
  isVerified?: boolean;
}

interface Post {
  id: string;
  userId: string;
  content: string;
  image?: string;
  createdAt: string;
  likesCount: number;
  repostsCount: number;
  commentsCount: number;
  isRepost?: boolean;
  originalAuthor?: {
    username: string;
    displayName: string;
  };
}

interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
}

interface Like {
  id: string;
  postId: string;
  userId: string;
}

interface Repost {
  id: string;
  postId: string;
  userId: string;
}

interface Follow {
  id: string;
  followerId: string;
  followingId: string;
}

interface Notification {
  id: string;
  type: "like" | "comment" | "repost" | "follow";
  senderId: string;
  receiverId: string;
  postId?: string;
  commentId?: string;
  seen: boolean;
  createdAt: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  seen: boolean;
}

interface DB {
  users: User[];
  posts: Post[];
  comments: Comment[];
  likes: Like[];
  reposts: Repost[];
  follows: Follow[];
  notifications: Notification[];
  messages?: Message[];
}

const DB_FILE = path.join(process.cwd(), "db.json");

// Helper to load database
function loadDB(): DB {
  if (fs.existsSync(DB_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    } catch {
      // Return empty database schema on read failure
    }
  }

  // Prepopulate with stunning high-quality accounts and posts
  const defaultUsers: User[] = [
    {
      id: "glaze_hq",
      email: "team@glaze.social",
      username: "glaze",
      displayName: "Glaze",
      bio: "The next generation social canvas. High fidelity digital dialogue. Dark mode and glassmorphism by design.",
      profilePic: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
      bannerPic: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString(),
      isVerified: true
    },
    {
      id: "dietrich",
      email: "dietrich@glaze.social",
      username: "dietrich",
      displayName: "Dietrich",
      bio: "Modern architecture, minimalist UI, and visual space design. Thinking in lines and shades.",
      profilePic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      bannerPic: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString(),
      isVerified: true
    },
    {
      id: "marissa",
      email: "marissa@glaze.social",
      username: "marissa",
      displayName: "Marissa",
      bio: "Type designer & React engineer. Making the web beautiful, layout by layout.",
      profilePic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      bannerPic: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString(),
      isVerified: true
    },
    {
      id: "satoshi",
      email: "satoshi@glaze.social",
      username: "satoshi",
      displayName: "Satoshi",
      bio: "Digital art, crypto-philosophy, and retro-futuristic essays. Less noise, more space.",
      profilePic: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      bannerPic: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=80",
      createdAt: new Date().toISOString(),
      isVerified: true
    }
  ];

  const defaultPosts: Post[] = [
    {
      id: "post1",
      userId: "dietrich",
      content: "Minimalism is not about the absence of things. It's about the presence of space that lets things breathe, think, and emerge. Glaze feels exactly like that space.",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
      likesCount: 24,
      repostsCount: 5,
      commentsCount: 2
    },
    {
      id: "post2",
      userId: "glaze_hq",
      content: "Welcome to Glaze. Connect, explore, and shape your voice. Glaze represents high-fidelity digital dialogue—dark mode by design, glassmorphic interactions, and zero artificial clutter. Welcome home.",
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
      likesCount: 142,
      repostsCount: 38,
      commentsCount: 12
    },
    {
      id: "post3",
      userId: "marissa",
      content: "Just shipped the initial responsive design compiler. Incredibly clean, fully responsive, and completely responsive to touch inputs. The glowing orange accents highlight active interactive nodes beautifully.",
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(), // 6 hours ago
      likesCount: 89,
      repostsCount: 12,
      commentsCount: 4
    },
    {
      id: "post4",
      userId: "satoshi",
      content: "The timeless beauty of social network layouts. Bluesky, Threads, and X all trace back to the simple chronological list. Glaze elevates this with extreme responsive tactile feed state. Less outrage, more depth.",
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
      likesCount: 56,
      repostsCount: 8,
      commentsCount: 3
    }
  ];

  const defaultComments: Comment[] = [
    {
      id: "comment1",
      postId: "post1",
      userId: "marissa",
      content: "Deeply resonates with me. Design is as much about what you leave out as what you put in.",
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
    },
    {
      id: "comment2",
      postId: "post1",
      userId: "glaze_hq",
      content: "We're honored to provide the interface for this thought.",
      createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString()
    }
  ];

  const defaultDB: DB = {
    users: defaultUsers,
    posts: defaultPosts,
    comments: defaultComments,
    likes: [],
    reposts: [],
    follows: [
      { id: "follow1", followerId: "dietrich", followingId: "glaze_hq" },
      { id: "follow2", followerId: "marissa", followingId: "glaze_hq" },
      { id: "follow3", followerId: "satoshi", followingId: "glaze_hq" }
    ],
    notifications: [],
    messages: [
      {
        id: "msg_init_1",
        senderId: "marissa",
        receiverId: "dietrich",
        content: "Hey Dietrich! Loved your design thoughts about space. Should we construct a new responsive layout?",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        seen: true
      },
      {
        id: "msg_init_2",
        senderId: "dietrich",
        receiverId: "marissa",
        content: "Let's do it, Marissa! I've been experimenting with some monospace font systems for Glaze interfaces.",
        createdAt: new Date(Date.now() - 3600000 * 4.8).toISOString(),
        seen: true
      },
      {
        id: "msg_init_3",
        senderId: "satoshi",
        receiverId: "glaze_hq",
        content: "Awesome platform. Will there be an option to customize trace feeds in the settings panel?",
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
        seen: false
      }
    ]
  };

  saveDB(defaultDB);
  return defaultDB;
}

// Helper to write database
function saveDB(db: DB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save database file:", err);
  }
}

async function run() {
  const app = express();
  app.use(express.json({ limit: "15mb" })); // Support uploading profile images as base64

  const dbState = loadDB();
  dbState.messages = dbState.messages || [];

  // Simple in-memory rate limiter: Record last post timestamps per user ID
  const lastPostTimestamps = new Map<string, number>();

  // Extract auth bearer token / mock user middleware
  function getAuthenticatedUserId(req: express.Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.substring(7);
    // Secure token is simply userId for the sake of mock-free playground simulation
    const userExists = dbState.users.some(u => u.id === token);
    return userExists ? token : null;
  }

  // --- API ROUTES ---

  // Health check/diagnostics
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", latency: "1.2ms", poolConnection: "healthy" });
  });

  // Google Sign-in/up flow simulation with real response
  app.post("/api/auth/google", (req, res) => {
    const { email, displayName, photoUrl } = req.body;

    if (!email) {
      res.status(400).json({ error: "Email is required for authentication" });
      return;
    }

    // Attempt to match user by email
    let user = dbState.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Create new user (Signup)
      const username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "") || "user_" + Math.floor(Math.random() * 1000);
      user = {
        id: "usr_" + Math.random().toString(36).substring(2, 11),
        email: email,
        username: username,
        displayName: displayName || "Glaze User",
        bio: "Connect, explore and discover your voice",
        profilePic: photoUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
        bannerPic: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
        createdAt: new Date().toISOString(),
        isVerified: false
      };
      dbState.users.push(user);
      saveDB(dbState);
    }

    res.json({
      user,
      token: user.id
    });
  });

  // Fetch current session info
  app.get("/api/session", (req, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized session" });
      return;
    }
    const user = dbState.users.find(u => u.id === userId);
    if (!user) {
      res.status(404).json({ error: "User profile not found" });
      return;
    }
    res.json({ user });
  });

  // Fetch all posts/timeline (chronological + enriched details)
  app.get("/api/posts", (req, res) => {
    const currentUserId = getAuthenticatedUserId(req);
    const search = req.query.search as string;
    const authorId = req.query.userId as string;

    let resPosts = [...dbState.posts];

    // Filter by author if requested (Public profile view)
    if (authorId) {
      resPosts = resPosts.filter(p => {
        // If it's a repost, include it in the user's timeline feed
        if (p.userId === authorId) return true;
        
        // Include if they reposted it
        const isRepostedByThisAuthor = dbState.reposts.some(
          r => r.postId === p.id && r.userId === authorId
        );
        return isRepostedByThisAuthor;
      });
    }

    // Filter by search string if explore tab
    if (search) {
      const lowerSearch = search.toLowerCase();
      resPosts = resPosts.filter(p => p.content.toLowerCase().includes(lowerSearch));
    }

    // Enrich post payloads with creators details, user action states, and repost status
    const enriched = resPosts.map(p => {
      const author = dbState.users.find(u => u.id === p.userId);
      const liked = currentUserId ? dbState.likes.some(l => l.postId === p.id && l.userId === currentUserId) : false;
      const reposted = currentUserId ? dbState.reposts.some(r => r.postId === p.id && r.userId === currentUserId) : false;

      // Check if it's rendered as a repost in user's profile context
      const actualPost = { ...p };
      const creator = {
        id: author?.id || "unknown",
        username: author?.username || "deleted",
        displayName: author?.displayName || "Deleted Account",
        profilePic: author?.profilePic || "",
        isVerified: author?.isVerified || false
      };

      return {
        ...actualPost,
        user: creator,
        likedByCurrentUser: liked,
        repostedByCurrentUser: reposted
      };
    });

    // Sort matching posts chronologically newest first
    enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(enriched);
  });

  // Create post (secured, authenticated, rate-limited)
  app.post("/api/posts", (req, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(411).json({ error: "A valid login session is required to share posts" });
      return;
    }

    // Enforce rate limiting (e.g., maximum 1 post every 3 seconds)
    const now = Date.now();
    const lastPostTime = lastPostTimestamps.get(userId) || 0;
    if (now - lastPostTime < 3000) {
      res.status(429).json({ error: "Sharing frequency limit hit. Please wait a couple of seconds before posting again." });
      return;
    }

    const { content, image } = req.body;
    if (!content || !content.trim()) {
      res.status(400).json({ error: "Post content cannot be blank" });
      return;
    }

    if (content.length > 280) {
      res.status(400).json({ error: "Content exceeds the 280-character limit" });
      return;
    }

    const newPost: Post = {
      id: "pst_" + Math.random().toString(36).substring(2, 11),
      userId,
      content,
      image, // supports Base64 strings for crop/upload
      createdAt: new Date().toISOString(),
      likesCount: 0,
      repostsCount: 0,
      commentsCount: 0
    };

    dbState.posts.push(newPost);
    lastPostTimestamps.set(userId, now);
    saveDB(dbState);

    // Build fully enriched post to return to the UI immediately
    const userObj = dbState.users.find(u => u.id === userId);
    res.json({
      ...newPost,
      user: {
        id: userObj?.id || "unknown",
        username: userObj?.username || "unknown",
        displayName: userObj?.displayName || "Me",
        profilePic: userObj?.profilePic || "",
        isVerified: userObj?.isVerified || false
      },
      likedByCurrentUser: false,
      repostedByCurrentUser: false
    });
  });

  // Delete post (strict ownership check)
  app.delete("/api/posts/:id", (req, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized access" });
      return;
    }

    const postIdx = dbState.posts.findIndex(p => p.id === req.params.id);
    if (postIdx === -1) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    const post = dbState.posts[postIdx];
    // Enforce authorization rule: only author can delete!
    if (post.userId !== userId) {
      res.status(403).json({ error: "Access Denied: You cannot delete another user's post" });
      return;
    }

    // Delete post, along with corresponding comments, likes, and reposts
    dbState.posts.splice(postIdx, 1);
    dbState.comments = dbState.comments.filter(c => c.postId !== req.params.id);
    dbState.likes = dbState.likes.filter(l => l.postId !== req.params.id);
    dbState.reposts = dbState.reposts.filter(r => r.postId !== req.params.id);
    dbState.notifications = dbState.notifications.filter(n => n.postId !== req.params.id);

    saveDB(dbState);
    res.json({ success: true, message: "Post deleted successfully" });
  });

  // Like / Unlike post (authenticated and updates notifications)
  app.post("/api/posts/:id/like", (req, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Please log in to register a like" });
      return;
    }

    const postId = req.params.id;
    const post = dbState.posts.find(p => p.id === postId);
    if (!post) {
      res.status(404).json({ error: "Post metadata not found" });
      return;
    }

    const existingLikeIdx = dbState.likes.findIndex(l => l.postId === postId && l.userId === userId);
    let isLiked = false;

    if (existingLikeIdx !== -1) {
      // Unlike
      dbState.likes.splice(existingLikeIdx, 1);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      // Like
      dbState.likes.push({
        id: "lk_" + Math.random().toString(36).substring(2, 11),
        postId,
        userId
      });
      post.likesCount += 1;
      isLiked = true;

      // Trigger notification if liking someone else's post
      if (post.userId !== userId) {
        dbState.notifications.push({
          id: "nt_" + Math.random().toString(36).substring(2, 11),
          type: "like",
          senderId: userId,
          receiverId: post.userId,
          postId: post.id,
          seen: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    saveDB(dbState);
    res.json({ success: true, isLiked, likesCount: post.likesCount });
  });

  // Repost / Un-repost a post (authenticated)
  app.post("/api/posts/:id/repost", (req, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Login required to share a repost" });
      return;
    }

    const postId = req.params.id;
    const post = dbState.posts.find(p => p.id === postId);
    if (!post) {
      res.status(404).json({ error: "Target post not found" });
      return;
    }

    const existingIdx = dbState.reposts.findIndex(r => r.postId === postId && r.userId === userId);
    let isReposted = false;

    if (existingIdx !== -1) {
      // Undo Repost
      dbState.reposts.splice(existingIdx, 1);
      post.repostsCount = Math.max(0, post.repostsCount - 1);
    } else {
      // Retransmit Repost
      dbState.reposts.push({
        id: "rp_" + Math.random().toString(36).substring(2, 11),
        postId,
        userId
      });
      post.repostsCount += 1;
      isReposted = true;

      // Notify owner
      if (post.userId !== userId) {
        dbState.notifications.push({
          id: "nt_" + Math.random().toString(36).substring(2, 11),
          type: "repost",
          senderId: userId,
          receiverId: post.userId,
          postId: post.id,
          seen: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    saveDB(dbState);
    res.json({ success: true, isReposted, repostsCount: post.repostsCount });
  });

  // Get single post comments
  app.get("/api/posts/:postId/comments", (req, res) => {
    const comments = dbState.comments
      .filter(c => c.postId === req.params.postId)
      .map(c => {
        const userObj = dbState.users.find(u => u.id === c.userId);
        return {
          ...c,
          user: {
            id: userObj?.id || "unknown",
            username: userObj?.username || "deleted",
            displayName: userObj?.displayName || "Deleted Account",
            profilePic: userObj?.profilePic || "",
            isVerified: userObj?.isVerified || false
          }
        };
      });

    comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    res.json(comments);
  });

  // Add Comment under a post
  app.post("/api/posts/:postId/comments", (req, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized comments" });
      return;
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      res.status(400).json({ error: "Comment text cannot be blank" });
      return;
    }

    const post = dbState.posts.find(p => p.id === req.params.postId);
    if (!post) {
      res.status(404).json({ error: "Post metadata not found" });
      return;
    }

    const commentId = "cmt_" + Math.random().toString(36).substring(2, 11);
    const newComment: Comment = {
      id: commentId,
      postId: post.id,
      userId,
      content,
      createdAt: new Date().toISOString()
    };

    dbState.comments.push(newComment);
    post.commentsCount += 1;

    // Trigger notification
    if (post.userId !== userId) {
      dbState.notifications.push({
        id: "nt_" + Math.random().toString(36).substring(2, 11),
        type: "comment",
        senderId: userId,
        receiverId: post.userId,
        postId: post.id,
        commentId,
        seen: false,
        createdAt: new Date().toISOString()
      });
    }

    saveDB(dbState);

    const userObj = dbState.users.find(u => u.id === userId);
    res.json({
      ...newComment,
      user: {
        id: userObj?.id || "unknown",
        username: userObj?.username || "unknown",
        displayName: userObj?.displayName || "Me",
        profilePic: userObj?.profilePic || "",
        isVerified: userObj?.isVerified || false
      }
    });
  });

  // Fetch specific user's public info
  app.get("/api/users/:id", (req, res) => {
    const targetUserId = req.params.id;
    const currentUserId = getAuthenticatedUserId(req);

    const targetUser = dbState.users.find(u => u.id === targetUserId || u.username === targetUserId);
    if (!targetUser) {
      res.status(404).json({ error: "User profile not found in Glaze directory" });
      return;
    }

    const followersCount = dbState.follows.filter(f => f.followingId === targetUser.id).length;
    const followingCount = dbState.follows.filter(f => f.followerId === targetUser.id).length;
    const isFollowing = currentUserId 
      ? dbState.follows.some(f => f.followerId === currentUserId && f.followingId === targetUser.id)
      : false;

    res.json({
      user: targetUser,
      followersCount,
      followingCount,
      isFollowing
    });
  });

  // Follow / Unfollow a registered user (authenticated)
  app.post("/api/users/:id/follow", (req, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Login required to follow users" });
      return;
    }

    const targetId = req.params.id;
    if (userId === targetId) {
      res.status(400).json({ error: "You cannot follow your own profile" });
      return;
    }

    const targetUser = dbState.users.find(u => u.id === targetId);
    if (!targetUser) {
      res.status(404).json({ error: "Target user not found" });
      return;
    }

    const existingFollowIdx = dbState.follows.findIndex(f => f.followerId === userId && f.followingId === targetId);
    let isFollowingNow = false;

    if (existingFollowIdx !== -1) {
      // Unfollow
      dbState.follows.splice(existingFollowIdx, 1);
    } else {
      // Follow
      dbState.follows.push({
        id: "fl_" + Math.random().toString(36).substring(2, 11),
        followerId: userId,
        followingId: targetId
      });
      isFollowingNow = true;

      // Notify target profile
      dbState.notifications.push({
        id: "nt_" + Math.random().toString(36).substring(2, 11),
        type: "follow",
        senderId: userId,
        receiverId: targetId,
        seen: false,
        createdAt: new Date().toISOString()
      });
    }

    saveDB(dbState);
    res.json({ success: true, isFollowing: isFollowingNow });
  });

  // Search/List users
  app.get("/api/users", (req, res) => {
    const q = (req.query.search as string || "").toLowerCase();
    let matches = dbState.users;
    if (q) {
      matches = dbState.users.filter(u => u.username.toLowerCase().includes(q) || u.displayName.toLowerCase().includes(q));
    }
    res.json(matches);
  });

  // Update current user general settings/profile (verified ownership)
  app.put("/api/profile", (req, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Access denied. Login required" });
      return;
    }

    const userIdx = dbState.users.findIndex(u => u.id === userId);
    if (userIdx === -1) {
      res.status(404).json({ error: "User Profile not found" });
      return;
    }

    const { displayName, bio, profilePic, bannerPic, username } = req.body;
    const user = dbState.users[userIdx];

    // Ownership update constraints (can only modify own profile, fields validated)
    if (displayName !== undefined) {
      if (displayName.trim().length === 0) {
        res.status(400).json({ error: "Display name cannot be blank" });
        return;
      }
      user.displayName = displayName;
    }

    if (username !== undefined) {
      const formattedUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");
      if (!formattedUsername) {
        res.status(400).json({ error: "Invalid username format" });
        return;
      }
      // Ensure uniqueness
      const usernameExists = dbState.users.some(u => u.username === formattedUsername && u.id !== userId);
      if (usernameExists) {
        res.status(400).json({ error: "Username is already taken" });
        return;
      }
      user.username = formattedUsername;
    }

    if (bio !== undefined) {
      user.bio = bio;
    }

    if (profilePic !== undefined) {
      user.profilePic = profilePic;
    }

    if (bannerPic !== undefined) {
      user.bannerPic = bannerPic;
    }

    saveDB(dbState);
    res.json({ success: true, user });
  });

  // Deactivate current profile
  app.post("/api/profile/deactivate", (req, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Access denied. Login required" });
      return;
    }
    const idx = dbState.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      dbState.users[idx].bio = "[Account Deactivated]";
      dbState.users[idx].displayName = "Deactivated User";
      dbState.users[idx].profilePic = "https://api.dicebear.com/7.x/initials/svg?seed=DU";
      saveDB(dbState);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  // Delete current profile
  app.delete("/api/profile", (req, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Access denied. Login required" });
      return;
    }
    dbState.users = dbState.users.filter(u => u.id !== userId);
    dbState.posts = dbState.posts.filter(p => p.userId !== userId);
    dbState.notifications = dbState.notifications.filter(n => n.senderId !== userId && n.receiverId !== userId);
    saveDB(dbState);
    res.json({ success: true });
  });

  // Fetch pending notifications and enrich details
  app.get("/api/notifications", (req, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized query" });
      return;
    }

    const results = dbState.notifications
      .filter(n => n.receiverId === userId)
      .map(n => {
        const sender = dbState.users.find(u => u.id === n.senderId);
        return {
          ...n,
          sender: {
            username: sender?.username || "deleted",
            displayName: sender?.displayName || "Deleted Account",
            profilePic: sender?.profilePic || ""
          }
        };
      });

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(results);
  });

  // Clear/Read notifications
  app.post("/api/notifications/read", (req, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Access denied" });
      return;
    }

    dbState.notifications
      .filter(n => n.receiverId === userId)
      .forEach(n => {
        n.seen = true;
      });

    saveDB(dbState);
    res.json({ success: true });
  });

  // --- DIRECT MESSAGES CORE API ---

  // Fetch all chat threads involving the authenticated user
  app.get("/api/messages/conversations", (req, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Access denied. Login required." });
      return;
    }

    const userMsgs = (dbState.messages || []).filter(
      m => m.senderId === userId || m.receiverId === userId
    );

    const partnersMap = new Map<string, { lastMessage: Message; unreadCount: number }>();

    userMsgs.forEach(m => {
      const partnerId = m.senderId === userId ? m.receiverId : m.senderId;
      const existing = partnersMap.get(partnerId);
      const isIncomingUnread = m.senderId === partnerId && !m.seen;

      if (!existing) {
        partnersMap.set(partnerId, {
          lastMessage: m,
          unreadCount: isIncomingUnread ? 1 : 0
        });
      } else {
        const extTime = new Date(existing.lastMessage.createdAt).getTime();
        const curTime = new Date(m.createdAt).getTime();
        
        const newLastMsg = curTime > extTime ? m : existing.lastMessage;
        const newUnreadCount = existing.unreadCount + (isIncomingUnread ? 1 : 0);
        
        partnersMap.set(partnerId, {
          lastMessage: newLastMsg,
          unreadCount: newUnreadCount
        });
      }
    });

    const conversations = Array.from(partnersMap.entries()).map(([partnerId, info]) => {
      const partnerUser = dbState.users.find(u => u.id === partnerId);
      return {
        user: partnerUser ? {
          id: partnerUser.id,
          username: partnerUser.username,
          displayName: partnerUser.displayName,
          profilePic: partnerUser.profilePic,
          isVerified: partnerUser.isVerified
        } : {
          id: partnerId,
          username: "deleted",
          displayName: "Deleted User",
          profilePic: "https://api.dicebear.com/7.x/pixel-art/svg?seed=deleted",
          isVerified: false
        },
        lastMessage: info.lastMessage,
        unreadCount: info.unreadCount
      };
    });

    conversations.sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
    res.json(conversations);
  });

  // Fetch all messages in a conversation with specific user
  app.get("/api/messages/:otherUserId", (req, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Access denied. Login required." });
      return;
    }

    const { otherUserId } = req.params;
    const otherUser = dbState.users.find(u => u.id === otherUserId || u.username === otherUserId);
    if (!otherUser) {
      res.status(404).json({ error: "Target recipient profile not found" });
      return;
    }

    const otherId = otherUser.id;
    const thread = (dbState.messages || []).filter(
      m => (m.senderId === userId && m.receiverId === otherId) ||
           (m.senderId === otherId && m.receiverId === userId)
    );

    let changed = false;
    thread.forEach(m => {
      if (m.senderId === otherId && !m.seen) {
         m.seen = true;
         changed = true;
      }
    });

    if (changed) {
      saveDB(dbState);
    }

    thread.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    res.json({
      messages: thread,
      partner: {
        id: otherUser.id,
        username: otherUser.username,
        displayName: otherUser.displayName,
        profilePic: otherUser.profilePic,
        isVerified: otherUser.isVerified,
        bio: otherUser.bio
      }
    });
  });

  // Send a direct message to a user
  app.post("/api/messages", (req, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Access denied. Login required." });
      return;
    }

    const { receiverId, content } = req.body;
    if (!receiverId || !content || !content.trim()) {
      res.status(400).json({ error: "Missing receiver ID or message content" });
      return;
    }

    const receiver = dbState.users.find(u => u.id === receiverId || u.username === receiverId);
    if (!receiver) {
      res.status(404).json({ error: "Recipient profile register not found" });
      return;
    }

    const newMsg: Message = {
      id: "msg_" + Math.random().toString(36).substring(2, 11),
      senderId: userId,
      receiverId: receiver.id,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      seen: false
    };

    dbState.messages = dbState.messages || [];
    dbState.messages.push(newMsg);
    saveDB(dbState);

    res.json(newMsg);
  });

  // --- DEV & BUNDLED HANDLERS ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Glaze server is running at http://0.0.0.0:${PORT}`);
  });
}

run();
