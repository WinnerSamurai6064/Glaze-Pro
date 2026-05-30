/**
 * Types declarations for Glaze
 */

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  profilePic: string; // Base64 or local URL
  bannerPic: string;  // Base64 or local URL
  createdAt: string;
  isVerified?: boolean;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  image?: string; // Optional attached image
  createdAt: string;
  likesCount: number;
  repostsCount: number;
  commentsCount: number;
  likedByCurrentUser?: boolean;
  repostedByCurrentUser?: boolean;
  // Included user details for easy rendering
  user?: {
    id: string;
    username: string;
    displayName: string;
    profilePic: string;
    isVerified?: boolean;
  };
  originalAuthor?: {
    username: string;
    displayName: string;
  };
  isRepost?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    displayName: string;
    profilePic: string;
    isVerified?: boolean;
  };
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'repost' | 'follow';
  senderId: string;
  receiverId: string;
  postId?: string;
  commentId?: string;
  seen: boolean;
  createdAt: string;
  sender?: {
    username: string;
    displayName: string;
    profilePic: string;
  };
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  seen: boolean;
  sender?: {
    id: string;
    username: string;
    displayName: string;
    profilePic: string;
  };
  receiver?: {
    id: string;
    username: string;
    displayName: string;
    profilePic: string;
  };
}

export interface Session {
  user: User;
  token: string;
}

export interface AppState {
  currentUser: User | null;
  posts: Post[];
  notifications: Notification[];
  activeTab: 'home' | 'explore' | 'notifications' | 'messages' | 'profile' | 'settings';
  activeProfileId: string | null; // ID of profile being viewed
  searchQuery: string;
}
