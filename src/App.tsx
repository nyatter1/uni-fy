import { useState, useEffect, FormEvent, ChangeEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Infinity, 
  Layers, 
  Play, 
  MessageSquare, 
  User as UserIcon, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Repeat, 
  Heart, 
  Share2, 
  Bookmark, 
  MessageCircle, 
  Music, 
  Paperclip, 
  Mic, 
  Phone, 
  Video, 
  MoreVertical, 
  CheckCheck, 
  Square,
  Link as LinkIcon,
  Volume2,
  Mail,
  Lock,
  LogOut,
  Loader2,
  ChevronLeft,
  MapPin,
  Globe,
  Twitter,
  Instagram,
  X,
  Trash2,
  Smile,
  Users,
  Zap,
  Bell,
  VolumeX,
  ShieldCheck,
  Award,
  Sparkles,
  Info,
  Gift,
  Star
} from 'lucide-react';
import { supabase } from './supabase';
import { CustomizationOptions, DEFAULT_CUSTOMIZATION, getGlobalStyles, getProfileStyles, getUsernameStyles, getMessageStyles } from './types/customization';
import { CustomizationStudio } from './components/CustomizationStudio';
import { SupabaseStatus } from './components/SupabaseStatus';
import { User as SupabaseUser } from '@supabase/supabase-js';

type View = 'vibe' | 'chat' | 'link' | 'stream';

const isUserOnline = (status: any) => {
  if (!status || status.status === 'offline') return false;
  if (!status.lastSeen) return false;
  
  const lastSeenDate = new Date(status.lastSeen);
  const now = new Date();
  const diffInMinutes = (now.getTime() - lastSeenDate.getTime()) / 60000;
  
  return diffInMinutes < 7; // Online if heartbeat was in last 7 minutes (lenient for 5min interval)
};

interface GlobalMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorPfp: string;
  content: string;
  timestamp: any;
  isAnnouncement?: boolean;
  authorCustomization?: CustomizationOptions;
}

interface UserStatus {
  userId: string;
  status: 'online' | 'offline';
  lastSeen: any;
  username?: string;
  pfp?: string;
}

interface SavedGlobalMessage {
  id: string;
  messageId: string;
  userId: string;
  timestamp: any;
  originalMessage: GlobalMessage;
}

interface UserProfile {
  id: string;
  email: string;
  username: string;
  handle: string;
  bio: string;
  pfp: string;
  banner: string;
  linkNumber: string;
  location: string;
  website: string;
  interests: string[];
  socials: {
    twitter: string;
    instagram: string;
  };
  showSocials: boolean;
  accentColor: string;
  setupComplete: boolean;
  followersCount: number;
  followingCount: number;
  customization?: CustomizationOptions;
  moderationStatus?: 'none' | 'banned' | 'kicked' | 'muted';
  moderationReason?: string;
  moderationExpiresAt?: any;
}

const renderContentWithHashtags = (content: string) => {
  const parts = content.split(/(#\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('#')) {
      return (
        <span key={i} className="text-[var(--accent)] font-bold hover:underline cursor-pointer">
          {part}
        </span>
      );
    }
    return part;
  });
};

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorPfp: string;
  authorCustomization?: CustomizationOptions;
  content: string;
  imageUrl?: string;
  timestamp: any;
  upvotes: string[];
  reposts: string[];
  commentCount: number;
  isRepost?: boolean;
  originalAuthorId?: string;
  originalPostId?: string;
}

interface Story {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorPfp: string;
  authorCustomization?: CustomizationOptions;
  imageUrl: string;
  timestamp: any;
  expiresAt: any;
  privacy: 'public' | 'followers' | 'mutuals';
  likes: string[];
  viewers: string[];
}

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorPfp: string;
  authorCustomization?: CustomizationOptions;
  text: string;
  timestamp: any;
}

interface Follow {
  followerId: string;
  followingId: string;
  timestamp: any;
}

interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  type: 'view' | 'message' | 'follow' | 'comment';
  postId?: string;
  read: boolean;
  timestamp: any;
}

interface Message {
  id: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  timestamp: any;
  readBy: string[];
}

interface Chat {
  id: string;
  participants: string[];
  status: 'pending' | 'active';
  lastMessage?: string;
  lastTimestamp?: any;
  initiatorId: string;
  otherUser?: UserProfile; // Joined data
}

function AuthView({ onAuthSuccess }: { onAuthSuccess: (user: SupabaseUser) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes('@')) {
      setError('Please enter a valid email address. You can choose a username after signing up.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }
    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (authError) throw authError;
        if (data.user) onAuthSuccess(data.user);
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });
        if (authError) throw authError;
        if (data.user) onAuthSuccess(data.user);
      }
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('rate limit')) {
        setError('Too many attempts. Please wait a few minutes before trying again.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#09090b] text-white flex items-center justify-center font-sans overflow-y-auto custom-scrollbar relative p-4 sm:p-0">
      <div className="ambient-glow opacity-20" style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)' }} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-panel p-6 sm:p-10 rounded-3xl sm:rounded-[40px] z-10 border-white/5 shadow-2xl my-8 sm:my-0"
      >
        <div className="text-center mb-6 sm:mb-10">
          <div className="flex justify-center mb-4">
            <Infinity size={32} className="text-white sm:w-12 sm:h-12" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-2">Unify</h1>
          <p className="text-zinc-500 text-xs sm:text-sm">The ultimate unified social hub.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="email" 
                required
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-white/30 transition-all font-medium"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 outline-none focus:border-white/30 transition-all font-medium"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 rounded-[24px] font-black uppercase tracking-widest text-xs bg-white text-black hover:bg-zinc-200 transition-all disabled:opacity-30 shadow-xl flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-bold text-zinc-500 hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ProfileModal({ profile, onClose, isFollowing, onToggleFollow, currentUserId, posts, userStatuses }: { profile: UserProfile, onClose: () => void, isFollowing: boolean, onToggleFollow: (id: string) => void, currentUserId?: string, posts: Post[], userStatuses: Record<string, UserStatus> }) {
  const custom = profile.customization;
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      style={getGlobalStyles(custom)}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-[#09090b] rounded-3xl sm:rounded-[32px] overflow-hidden border border-white/10 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
        style={getProfileStyles(custom)}
      >
        <div className="overflow-y-auto flex-1 custom-scrollbar pb-6" style={custom?.subBannerBg ? { backgroundColor: custom.subBannerBg } : {}}>
          {/* Banner */}
          <div className="h-24 sm:h-32 bg-zinc-800 relative shrink-0">
            <img src={profile.banner} alt="Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <button 
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
            >
              <X size={16} className="sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Profile Info */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-8 relative">
            <div 
              className="absolute -top-10 sm:-top-12 left-4 sm:left-6 w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[#09090b] bg-zinc-800 overflow-hidden shadow-xl"
              style={{ borderRadius: custom?.profileBorderRadius ? `${custom.profileBorderRadius}px` : '9999px' }}
            >
              <img src={profile.pfp} alt="PFP" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>

            <div className="pt-12 sm:pt-14">
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tighter flex items-center gap-2" style={getUsernameStyles(custom)}>
                    {profile.username}
                    {(profile.email === 'dev@gmail.com' || custom?.nitroBadge) && (
                      <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full ${custom?.nitroBadge ? 'bg-indigo-500' : 'bg-blue-500'} flex items-center justify-center text-white`} title={custom?.nitroBadge ? "Nitro Supporter" : "Verified Developer"}>
                        {custom?.nitroBadge ? <Zap size={10} className="fill-white sm:w-3 sm:h-3" /> : <CheckCheck size={10} className="sm:w-3 sm:h-3" />}
                      </div>
                    )}
                  </h2>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] sm:text-xs text-zinc-500 font-medium">@{profile.handle}</p>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                      <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isUserOnline((userStatuses as Record<string, UserStatus>)[profile.id] || { status: 'offline' }) ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
                      <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-zinc-500">
                        {isUserOnline((userStatuses as Record<string, UserStatus>)[profile.id] || { status: 'offline' }) ? 'online' : 'offline'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="bg-white/5 px-3 py-1 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    #{profile.linkNumber}
                  </div>
                  {currentUserId && currentUserId !== profile.id && (
                    <button 
                      onClick={() => onToggleFollow(profile.id)}
                      className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${isFollowing ? 'bg-white/10 text-white border border-white/10' : 'bg-white text-black hover:bg-zinc-200'}`}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-6 mb-6">
                <div className="flex flex-col">
                  <span className="text-lg font-black">{profile.followersCount || 0}</span>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Followers</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-black">{profile.followingCount || 0}</span>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Following</span>
                </div>
              </div>

              <p className="text-zinc-300 text-sm leading-relaxed mb-6" style={getMessageStyles(custom)}>
                {profile.bio || "No bio yet."}
              </p>

              <div className="space-y-3 mb-6">
                {profile.location && (
                  <div className="flex items-center gap-3 text-zinc-500 text-sm">
                    <MapPin size={16} />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-3 text-zinc-500 text-sm">
                    <Globe size={16} />
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-white hover:underline">
                      {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {profile.interests.map(interest => (
                  <span key={interest} className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-zinc-400 border border-white/5">
                    {interest}
                  </span>
                ))}
              </div>

              {profile.showSocials && (profile.socials.twitter || profile.socials.instagram) && (
                <div className="flex gap-4 mb-8">
                  {profile.socials.twitter && (
                    <a href={`https://twitter.com/${profile.socials.twitter}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-white/5 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors border border-white/10">
                      <Twitter size={18} />
                      <span className="text-xs font-bold">Twitter</span>
                    </a>
                  )}
                  {profile.socials.instagram && (
                    <a href={`https://instagram.com/${profile.socials.instagram}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-white/5 rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-colors border border-white/10">
                      <Instagram size={18} />
                      <span className="text-xs font-bold">Instagram</span>
                    </a>
                  )}
                </div>
              )}

              {/* User's Posts */}
              <div className="space-y-4">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">Recent Vibes</div>
                {posts.length > 0 ? (
                  posts.map(post => (
                    <div key={post.id} className="p-4 bg-white/5 rounded-2xl border border-white/5" style={getMessageStyles(custom)}>
                      <p className="text-sm font-medium mb-3">{renderContentWithHashtags(post.content)}</p>
                      {post.imageUrl && (
                        <img src={post.imageUrl} alt="Post" className="w-full h-auto rounded-xl mb-3" referrerPolicy="no-referrer" />
                      )}
                      <div className="flex gap-4 text-zinc-500">
                        <div className="flex items-center gap-1 text-[10px] font-bold">
                          <ArrowUp size={14} />
                          <span>{post.upvotes.length}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold">
                          <Repeat size={14} />
                          <span>{post.reposts.length}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold">
                          <MessageCircle size={14} />
                          <span>{post.commentCount}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-zinc-600 text-xs font-bold uppercase tracking-widest">
                    No vibes yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StoryViewer({ stories, onClose }: { stories: Story[], onClose: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const story = stories[currentIndex];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        onClose();
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentIndex, stories.length, onClose]);

  if (!story) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex items-center justify-center"
    >
      <div className="w-full max-w-md h-full relative overflow-hidden">
        <img src={story.imageUrl} alt="Story" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        
        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
          {stories.map((_, i) => (
            <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: i === currentIndex ? '100%' : i < currentIndex ? '100%' : '0%' }}
                transition={{ duration: i === currentIndex ? 5 : 0, ease: "linear" }}
                className="h-full bg-white"
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
              <img src={story.authorPfp} alt="Author" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">{story.authorName}</div>
              <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest">@{story.authorHandle}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <div className="absolute inset-0 flex">
          <div className="flex-1 cursor-pointer" onClick={() => currentIndex > 0 && setCurrentIndex(prev => prev - 1)} />
          <div className="flex-1 cursor-pointer" onClick={() => currentIndex < stories.length - 1 ? setCurrentIndex(prev => prev + 1) : onClose()} />
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [activeView, setActiveView] = useState<View>('vibe');
  const [ambientColor, setAmbientColor] = useState('rgba(255,255,255,0.05)');
  const [mobileChatActive, setMobileChatActive] = useState(false);
  // Messaging State
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchId, setSearchId] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const [viewingProfilePosts, setViewingProfilePosts] = useState<Post[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Social State
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [storyImage, setStoryImage] = useState<string | null>(null);
  const [storyPrivacy, setStoryPrivacy] = useState<'public' | 'followers' | 'mutuals'>('public');
  const [activeStories, setActiveStories] = useState<Story[] | null>(null);
  const [activePostForComments, setActivePostForComments] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [globalMessages, setGlobalMessages] = useState<GlobalMessage[]>([]);
  const [savedMessages, setSavedMessages] = useState<SavedGlobalMessage[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userStatuses, setUserStatuses] = useState<Record<string, UserStatus>>({});
  const [onlineUsers, setOnlineUsers] = useState<UserProfile[]>([]);
  const [globalChatInput, setGlobalChatInput] = useState('');

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const parent = messagesEndRef.current.parentElement;
      if (parent) {
        parent.scrollTo({ top: parent.scrollHeight, behavior: 'smooth' });
      }
    }
  };

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const renderRichText = (text: string) => {
    if (!text) return null;
    const words = text.split(' ');
    return words.map((word, i) => {
      if (word.match(/^https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp)(\?.*)?$/i)) {
        return <img key={i} src={word} alt="embed" className="max-w-full h-auto rounded-lg mt-2 max-h-48 object-cover block" />;
      }
      if (word.startsWith('**') && word.endsWith('**')) {
        return <strong key={i} className="font-bold">{word.slice(2, -2)} </strong>;
      }
      if (word.startsWith('*') && word.endsWith('*')) {
        return <em key={i} className="italic">{word.slice(1, -1)} </em>;
      }
      if (word.startsWith('@')) {
        return <span key={i} className="text-blue-400 font-bold">{word} </span>;
      }
      return word + ' ';
    });
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    if (!viewingProfile) {
      setViewingProfilePosts([]);
      return;
    }
    
    const channel = supabase
      .channel(`profile-posts-${viewingProfile.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts',
        filter: `authorId=eq.${viewingProfile.id}`
      }, () => {
        fetchProfilePosts();
      })
      .subscribe();

    const fetchProfilePosts = async () => {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('authorId', viewingProfile.id)
        .order('timestamp', { ascending: false });
      if (data) setViewingProfilePosts(data as Post[]);
    };

    fetchProfilePosts();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [viewingProfile]);
  
  // Auth & Profile State
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    email: '',
    username: '',
    handle: '',
    bio: '',
    pfp: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    banner: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800',
    linkNumber: '',
    location: '',
    website: '',
    interests: [],
    socials: { twitter: '', instagram: '' },
    showSocials: true,
    accentColor: '#ffffff',
    setupComplete: false,
    followersCount: 0,
    followingCount: 0,
    customization: DEFAULT_CUSTOMIZATION
  });
  const [numberOptions, setNumberOptions] = useState<string[]>([]);

  useEffect(() => {
    if (setupStep === 3 && numberOptions.length === 0) {
      const options = Array.from({ length: 4 }, () => Math.floor(1000 + Math.random() * 9000).toString());
      setNumberOptions(options);
    }
  }, [setupStep, numberOptions.length]);

  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeChat && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [activeChat]);

  // Read Receipts
  useEffect(() => {
    if (!activeChat || !user) return;
    
    messages.forEach(async (msg) => {
      if (!msg.readBy.includes(user.id)) {
        try {
          await supabase.from('messages').update({
            readBy: [...msg.readBy, user.id]
          }).eq('id', msg.id);
        } catch (e) {
          console.error("Error marking as read:", e);
        }
      }
    });
  }, [messages, activeChat, user]);

  const availableInterests = ['Gaming', 'Music', 'Tech', 'Art', 'Fashion', 'Crypto', 'Fitness', 'Travel', 'Food', 'Movies'];

  // Helper: File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, type: 'pfp' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setProfile(prev => ({ ...prev, [type]: base64 }));
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  // Auth Listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        if (data && !error) {
          setProfile(data);
          setIsSetupComplete(data.setupComplete);
        } else {
          setIsSetupComplete(false);
        }
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Social Listeners
  useEffect(() => {
    if (!user || !isSetupComplete) return;

    // Fetch Posts
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
      if (data && !error) setPosts(data);
    };
    fetchPosts();

    const postsSubscription = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    // Fetch Stories
    const fetchStories = async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .gt('expiresAt', new Date().toISOString())
        .order('expiresAt', { ascending: true });
      if (data && !error) setStories(data);
    };
    fetchStories();

    const storiesSubscription = supabase
      .channel('public:stories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, () => {
        fetchStories();
      })
      .subscribe();

    // Fetch Following
    const fetchFollowing = async () => {
      const { data, error } = await supabase
        .from('follows')
        .select('followingId')
        .eq('followerId', user.id);
      if (data && !error) setFollowing(data.map((f: any) => f.followingId));
    };
    fetchFollowing();

    const followingSubscription = supabase
      .channel('public:follows')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows', filter: `followerId=eq.${user.id}` }, () => {
        fetchFollowing();
      })
      .subscribe();

    // Fetch Notifications
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipientId', user.id)
        .order('timestamp', { ascending: false })
        .limit(20);
      if (data && !error) setNotifications(data);
    };
    fetchNotifications();

    const notificationsSubscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `recipientId=eq.${user.id}` }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      postsSubscription.unsubscribe();
      storiesSubscription.unsubscribe();
      followingSubscription.unsubscribe();
      notificationsSubscription.unsubscribe();
    };
  }, [user, isSetupComplete]);

  const fetchAndShowProfile = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single();
      if (data && !error) {
        setViewingProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !postContent.trim()) return;
    setIsPosting(true);
    try {
      const newPost = {
        authorId: user.id,
        authorName: profile.username,
        authorHandle: profile.handle,
        authorPfp: profile.pfp,
        authorCustomization: profile.customization || DEFAULT_CUSTOMIZATION,
        content: postContent,
        imageUrl: postImage,
        timestamp: new Date().toISOString(),
        upvotes: [],
        reposts: [],
        commentCount: 0
      };
      await supabase.from('posts').insert([newPost]);
      setPostContent('');
      setPostImage(null);
    } catch (err) {
      console.error("Error creating post:", err);
    } finally {
      setIsPosting(false);
    }
  };

  const handlePostStory = async () => {
    if (!user || !storyImage) return;
    setIsPosting(true);
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      const newStory = {
        authorId: user.id,
        authorName: profile.username,
        authorHandle: profile.handle,
        authorPfp: profile.pfp,
        authorCustomization: profile.customization || DEFAULT_CUSTOMIZATION,
        imageUrl: storyImage,
        timestamp: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        privacy: storyPrivacy,
        likes: [],
        viewers: []
      };
      await supabase.from('stories').insert([newStory]);
      setIsStoryModalOpen(false);
      setStoryImage(null);
    } catch (err) {
      console.error("Error posting story:", err);
    } finally {
      setIsPosting(false);
    }
  };

  const toggleUpvote = async (postId: string, upvotes: string[]) => {
    if (!user) return;
    const isUpvoted = upvotes.includes(user.id);
    const newUpvotes = isUpvoted 
      ? upvotes.filter(id => id !== user.id)
      : [...upvotes, user.id];
    
    await supabase.from('posts').update({ upvotes: newUpvotes }).eq('id', postId);
  };

  const handleRepost = async (post: Post) => {
    if (!user) return;
    try {
      const repostData = {
        authorId: user.id,
        authorName: profile.username,
        authorHandle: profile.handle,
        authorPfp: profile.pfp,
        content: post.content,
        imageUrl: post.imageUrl,
        timestamp: new Date().toISOString(),
        upvotes: [],
        reposts: [],
        commentCount: 0,
        isRepost: true,
        originalAuthorId: post.authorId,
        originalPostId: post.id
      };
      await supabase.from('posts').insert([repostData]);
      
      const newReposts = [...(post.reposts || []), user.id];
      await supabase.from('posts').update({ reposts: newReposts }).eq('id', post.id);
    } catch (err) {
      console.error("Error reposting:", err);
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await supabase.from('posts').delete().eq('id', postId);
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const addComment = async (postId: string) => {
    if (!user || !commentText.trim()) return;
    setIsPostingComment(true);
    try {
      const commentData = {
        postId: postId,
        authorId: user.id,
        authorName: profile.username,
        authorHandle: profile.handle,
        authorPfp: profile.pfp,
        authorCustomization: profile.customization || DEFAULT_CUSTOMIZATION,
        text: commentText,
        timestamp: new Date().toISOString()
      };
      await supabase.from('comments').insert([commentData]);
      
      const { data: postData } = await supabase.from('posts').select('commentCount').eq('id', postId).single();
      const newCommentCount = (postData?.commentCount || 0) + 1;
      await supabase.from('posts').update({ commentCount: newCommentCount }).eq('id', postId);
      
      setCommentText('');
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setIsPostingComment(false);
    }
  };

  useEffect(() => {
    if (!activePostForComments) {
      setComments([]);
      return;
    }

    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('postId', activePostForComments.id)
        .order('timestamp', { ascending: false });
      if (data && !error) setComments(data);
    };
    fetchComments();

    const commentsSubscription = supabase
      .channel(`public:comments:post:${activePostForComments.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `postId=eq.${activePostForComments.id}` }, () => {
        fetchComments();
      })
      .subscribe();

    return () => {
      commentsSubscription.unsubscribe();
    };
  }, [activePostForComments]);

  const lastPresenceUpdate = useRef<number>(0);

  useEffect(() => {
    if (!user) return;

    const setOnline = async (force = false) => {
      const now = Date.now();
      // Only update if forced, or if 4.5 minutes have passed since last update
      if (!force && now - lastPresenceUpdate.current < 270000) return;

      const statusData: any = {
        userId: user.id,
        status: 'online',
        lastSeen: new Date().toISOString(),
      };

      if (profile.username) statusData.username = profile.username;
      if (profile.pfp) statusData.pfp = profile.pfp;

      try {
        await supabase.from('status').upsert(statusData);
        lastPresenceUpdate.current = now;
      } catch (err) {
        console.error("Error updating presence:", err);
      }
    };

    const setOffline = async () => {
      try {
        await supabase.from('status').upsert({
          userId: user.id,
          status: 'offline',
          lastSeen: new Date().toISOString()
        });
        lastPresenceUpdate.current = 0;
      } catch (err) {
        console.error("Error setting offline:", err);
      }
    };

    setOnline(true);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setOnline(true);
      }
    };

    const handleBeforeUnload = () => {
      setOffline();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setOnline();
      }
    }, 300000); // 5 minutes heartbeat

    return () => {
      setOffline();
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(interval);
    };
  }, [user, profile.username, profile.pfp]);

  useEffect(() => {
    if (!user) return;

    const fetchGlobalChat = async () => {
      const { data, error } = await supabase
        .from('global_chat')
        .select('*')
        .order('timestamp', { ascending: true });
      if (data && !error) {
        setGlobalMessages(data);
        setTimeout(scrollToBottom, 100);
      }
    };
    fetchGlobalChat();

    const globalChatSubscription = supabase
      .channel('public:global_chat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_chat' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const lastMsg = payload.new as GlobalMessage;
          if (lastMsg.authorId !== user.id) {
            playNotificationSound();
          }
        }
        fetchGlobalChat();
      })
      .subscribe();

    const fetchSavedMessages = async () => {
      const { data, error } = await supabase
        .from('saved_messages')
        .select('*')
        .eq('userId', user.id)
        .order('timestamp', { ascending: true });
      if (data && !error) setSavedMessages(data);
    };
    fetchSavedMessages();

    const savedMessagesSubscription = supabase
      .channel(`public:saved_messages:user:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saved_messages', filter: `userId=eq.${user.id}` }, () => {
        fetchSavedMessages();
      })
      .subscribe();

    const fetchStatuses = async () => {
      const { data, error } = await supabase
        .from('status')
        .select('*');
      if (data && !error) {
        const statuses: Record<string, UserStatus> = {};
        data.forEach(d => {
          statuses[d.userId] = d;
        });
        setUserStatuses(statuses);
      }
    };
    fetchStatuses();

    const statusSubscription = supabase
      .channel('public:status')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'status' }, () => {
        fetchStatuses();
      })
      .subscribe();

    return () => {
      globalChatSubscription.unsubscribe();
      savedMessagesSubscription.unsubscribe();
      statusSubscription.unsubscribe();
    };
  }, [user]);

  const getOnlineCount = () => {
    return (Object.values(userStatuses) as UserStatus[]).filter(isUserOnline).length;
  };

  const sendGlobalMessage = async (content: string) => {
    if (!user || !content.trim()) return;
    try {
      const isAnnouncement = user.email === 'dev@gmail.com' || user.email === 'haydensixseven@gmail.com';
      await supabase.from('global_chat').insert([{
        authorId: user.id,
        authorName: profile.username || 'Player',
        authorHandle: profile.handle || user.id.substring(0, 5),
        authorPfp: profile.pfp || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
        authorCustomization: profile.customization || DEFAULT_CUSTOMIZATION,
        content: content.trim(),
        timestamp: new Date().toISOString(),
        isAnnouncement
      }]);
      setGlobalChatInput('');
    } catch (err) {
      console.error("Error sending global message:", err);
    }
  };

  const clearGlobalChat = async () => {
    if (!user || user.email !== 'dev@gmail.com') return;
    if (!window.confirm("Are you sure you want to permanently delete all messages in the global chat?")) return;
    
    try {
      await supabase.from('global_chat').delete().neq('id', '0'); // Delete all
      alert(`Successfully cleared global chat.`);
    } catch (err) {
      console.error("Error clearing chat:", err);
      alert("Failed to clear chat. Check console for details.");
    }
  };

  const toggleSaveGlobalMessage = async (message: GlobalMessage) => {
    if (!user) return;
    const existing = savedMessages.find(sm => sm.messageId === message.id);
    try {
      if (existing) {
        await supabase.from('saved_messages').delete().eq('id', existing.id);
      } else {
        await supabase.from('saved_messages').insert([{
          messageId: message.id,
          userId: user.id,
          timestamp: new Date().toISOString(),
          originalMessage: message
        }]);
      }
    } catch (err) {
      console.error("Error toggling save message:", err);
    }
  };

  const toggleFollow = async (targetUserId: string) => {
    if (!user) return;
    const isFollowing = following.includes(targetUserId);
    
    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('followerId', user.id)
        .eq('followingId', targetUserId);
      
      const { data: userData } = await supabase.from('users').select('followingCount').eq('id', user.id).single();
      const { data: targetData } = await supabase.from('users').select('followersCount').eq('id', targetUserId).single();
      
      await supabase.from('users').update({ followingCount: Math.max(0, (userData?.followingCount || 0) - 1) }).eq('id', user.id);
      await supabase.from('users').update({ followersCount: Math.max(0, (targetData?.followersCount || 0) - 1) }).eq('id', targetUserId);
    } else {
      await supabase.from('follows').insert([{
        followerId: user.id,
        followingId: targetUserId,
        timestamp: new Date().toISOString()
      }]);
      
      const { data: userData } = await supabase.from('users').select('followingCount').eq('id', user.id).single();
      const { data: targetData } = await supabase.from('users').select('followersCount').eq('id', targetUserId).single();

      await supabase.from('users').update({ followingCount: (userData?.followingCount || 0) + 1 }).eq('id', user.id);
      await supabase.from('users').update({ followersCount: (targetData?.followersCount || 0) + 1 }).eq('id', targetUserId);
    }
  };
  useEffect(() => {
    if (!user || !isSetupComplete) return;

    const fetchChats = async () => {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .contains('participants', [user.id]);
      
      if (data && !error) {
        const chatList: Chat[] = [];
        for (const chatData of data) {
          const otherUserId = chatData.participants.find((id: string) => id !== user.id);
          if (otherUserId) {
            const { data: userData } = await supabase.from('users').select('*').eq('id', otherUserId).single();
            if (userData) {
              chatList.push({
                ...chatData,
                otherUser: userData
              });
            }
          }
        }
        setChats(chatList.sort((a, b) => new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()));
      }
    };
    fetchChats();

    const chatsSubscription = supabase
      .channel(`public:chats:user:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats', filter: `participants=cs.{${user.id}}` }, () => {
        fetchChats();
      })
      .subscribe();

    return () => {
      chatsSubscription.unsubscribe();
    };
  }, [user, isSetupComplete]);

  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chatId', activeChat.id)
        .order('timestamp', { ascending: true });
      
      if (data && !error) {
        setMessages(data);
        
        // Mark as read
        if (data.length > 0) {
          const lastMsg = data[data.length - 1];
          if (lastMsg.senderId !== user?.id && !lastMsg.readBy?.includes(user?.id || '')) {
            await supabase.from('messages').update({
              readBy: [...(lastMsg.readBy || []), user?.id]
            }).eq('id', lastMsg.id);
          }
        }
      }
    };
    fetchMessages();

    const messagesSubscription = supabase
      .channel(`public:messages:chat:${activeChat.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `chatId=eq.${activeChat.id}` }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [activeChat, user]);

  const startChat = async (targetId: string) => {
    if (!user) return;
    setIsSearching(true);
    setSearchError('');
    try {
      const { data: targetUsers, error } = await supabase
        .from('users')
        .select('*')
        .eq('linkNumber', targetId.replace('#', ''));
      
      if (!targetUsers || targetUsers.length === 0) {
        setSearchError('User not found');
        return;
      }

      const targetUser = targetUsers[0];
      if (targetUser.id === user.id) {
        setSearchError("You can't message yourself");
        return;
      }

      const existingChat = chats.find(c => c.participants.includes(targetUser.id));
      if (existingChat) {
        setActiveChat(existingChat);
        setSearchId('');
        return;
      }

      const chatData = {
        participants: [user.id, targetUser.id],
        status: 'pending',
        initiatorId: user.id,
        lastTimestamp: new Date().toISOString()
      };
      const { data: newChat, error: chatError } = await supabase.from('chats').insert([chatData]).select().single();
      if (newChat && !chatError) {
        setActiveChat({ ...newChat, otherUser: targetUser } as Chat);
        setSearchId('');
      }
    } catch (err) {
      console.error(err);
      setSearchError('Error starting chat');
    } finally {
      setIsSearching(false);
    }
  };

  const sendMessage = async (text?: string, imageUrl?: string) => {
    if (!activeChat || !user || (!text && !imageUrl)) return;
    
    try {
      const msgData: any = {
        chatId: activeChat.id,
        senderId: user.id,
        timestamp: new Date().toISOString(),
        readBy: [user.id]
      };

      if (text) msgData.text = text;
      if (imageUrl) msgData.imageUrl = imageUrl;

      await supabase.from('messages').insert([msgData]);
      await supabase.from('chats').update({
        lastMessage: text ? text : 'Sent a Link Snap',
        lastTimestamp: new Date().toISOString()
      }).eq('id', activeChat.id);
      
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error("Error sending message:", err);
      if (err instanceof Error && err.message.includes('too large')) {
        alert("Image is too large. Please try a smaller image.");
      }
    }
  };

  const acceptRequest = async (chatId: string) => {
    await supabase.from('chats').update({ status: 'active' }).eq('id', chatId);
    if (activeChat?.id === chatId) {
      setActiveChat(prev => prev ? { ...prev, status: 'active' } : null);
    }
  };

  // Theme Detection
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    
    document.documentElement.classList.toggle('dark', darkModeMediaQuery.matches);
    darkModeMediaQuery.addEventListener('change', handleThemeChange);
    
    return () => darkModeMediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  useEffect(() => {
    if (!isSetupComplete) return;
    
    switch (activeView) {
      case 'vibe':
        setAmbientColor(`${profile.accentColor}0D`); // Very low opacity
        document.documentElement.style.setProperty('--accent', profile.accentColor);
        break;
      case 'stream':
        setAmbientColor('rgba(255,0,80,0.1)');
        document.documentElement.style.setProperty('--accent', '#ff0050');
        break;
      case 'link':
        setAmbientColor('rgba(37,211,102,0.1)');
        document.documentElement.style.setProperty('--accent', '#25D366');
        break;
    }
  }, [activeView, isSetupComplete, profile.accentColor]);

  const handleSaveProfile = async () => {
    if (!user || isSavingProfile) return;
    setIsSavingProfile(true);
    try {
      const finalProfile = { ...profile, setupComplete: true, id: user.id, email: user.email };
      if (!finalProfile.linkNumber || finalProfile.linkNumber === '#') {
        finalProfile.linkNumber = Math.floor(1000 + Math.random() * 9000).toString();
      }
      await supabase.from('users').upsert([finalProfile]);
      setProfile(finalProfile);
      setIsSetupComplete(true);
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (user) {
        await supabase.from('status').upsert([{
          userId: user.id,
          status: 'offline',
          lastSeen: new Date().toISOString()
        }]);
      }
      await supabase.auth.signOut();
      setIsSetupComplete(false);
      setSetupStep(1);
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full bg-[#09090b] text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={48} />
      </div>
    );
  }

  if (!user) {
    return <AuthView onAuthSuccess={(u) => setUser(u)} />;
  }

  if (!isSetupComplete) {
    return (
      <div className="h-[100dvh] w-full bg-[#09090b] text-white flex items-center justify-center font-sans overflow-y-auto custom-scrollbar relative p-4 sm:p-0">
        <div className="ambient-glow opacity-30" style={{ background: `radial-gradient(circle, ${profile.accentColor} 0%, transparent 70%)` }} />
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={setupStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-xl glass-panel p-6 sm:p-10 rounded-3xl sm:rounded-[40px] z-10 border-white/5 shadow-2xl my-8 sm:my-0"
          >
            <div className="flex justify-between items-center mb-6 sm:mb-10">
              <div className="flex gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar pb-2">
                {[1, 2, 3, 4, 5, 6].map(s => (
                  <div 
                    key={s} 
                    className={`h-1 sm:h-1.5 w-6 sm:w-10 rounded-full shrink-0 transition-all duration-700 ${s <= setupStep ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white/5'}`} 
                  />
                ))}
              </div>
              <span className="text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Phase {setupStep}</span>
            </div>

            {setupStep === 1 && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl font-black tracking-tighter mb-2">Identity</h1>
                  <p className="text-zinc-500 text-sm">How should the world see you on Unify?</p>
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Username</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Alex Rivers"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-white/30 transition-all font-medium"
                      value={profile.username}
                      onChange={e => setProfile({...profile, username: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Handle</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">@</span>
                      <input 
                        type="text" 
                        placeholder="alex_rivers"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-5 py-4 outline-none focus:border-white/30 transition-all font-medium"
                        value={profile.handle}
                        onChange={e => setProfile({...profile, handle: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Bio</label>
                    <textarea 
                      placeholder="Tell us your vibe..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-white/30 transition-all h-28 resize-none font-medium"
                      value={profile.bio}
                      onChange={e => setProfile({...profile, bio: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}

            {setupStep === 2 && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl font-black tracking-tighter mb-2">Visuals</h1>
                  <p className="text-zinc-500 text-sm">Set your profile picture and banner.</p>
                </div>
                <div className="space-y-8">
                  <div className="relative h-40 w-full rounded-3xl overflow-hidden bg-zinc-900 border border-white/5 group">
                    <img src={profile.banner} alt="Banner" className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <label className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/20 transition-all cursor-pointer">
                        Update Banner
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 px-4">
                    <div className="relative w-28 h-28 rounded-full overflow-hidden border-[6px] border-[#09090b] bg-zinc-800 -mt-16 z-20 shadow-2xl">
                      <img src={profile.pfp} alt="PFP" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors cursor-pointer">
                      Change Avatar
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'pfp')} />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Location</label>
                      <input 
                        type="text" 
                        placeholder="London, UK"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-white/30 transition-all font-medium"
                        value={profile.location}
                        onChange={e => setProfile({...profile, location: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Website</label>
                      <input 
                        type="text" 
                        placeholder="unify.me/alex"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-white/30 transition-all font-medium"
                        value={profile.website}
                        onChange={e => setProfile({...profile, website: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {setupStep === 3 && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl font-black tracking-tighter mb-2">Link ID</h1>
                  <p className="text-zinc-500 text-sm">Choose your unique Unify ID for messaging.</p>
                </div>
                <div className="space-y-4">
                  {numberOptions.map((num) => (
                    <button 
                      key={num}
                      onClick={() => setProfile({...profile, linkNumber: num})}
                      className={`w-full p-8 rounded-3xl border transition-all flex justify-between items-center group relative overflow-hidden ${profile.linkNumber === num ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                    >
                      <div className="flex flex-col items-start relative z-10">
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${profile.linkNumber === num ? 'text-black/40' : 'text-zinc-500'}`}>Unify ID</span>
                        <span className="text-3xl font-black tracking-tighter">#{num}</span>
                      </div>
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center relative z-10 ${profile.linkNumber === num ? 'border-black' : 'border-white/10'}`}>
                        {profile.linkNumber === num && <motion.div layoutId="check" className="w-4 h-4 bg-black rounded-full" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {setupStep === 4 && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl font-black tracking-tighter mb-2">Interests</h1>
                  <p className="text-zinc-500 text-sm">Select what you're into to personalize your Vibe.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {availableInterests.map(interest => (
                    <button
                      key={interest}
                      onClick={() => {
                        const newInterests = profile.interests.includes(interest)
                          ? profile.interests.filter(i => i !== interest)
                          : [...profile.interests, interest];
                        setProfile({...profile, interests: newInterests});
                      }}
                      className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all border ${profile.interests.includes(interest) ? 'bg-white text-black border-white shadow-xl' : 'bg-white/5 border-white/10 hover:border-white/20 text-zinc-400'}`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {setupStep === 5 && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl font-black tracking-tighter mb-2">Socials & Theme</h1>
                  <p className="text-zinc-500 text-sm">Connect your world and pick your accent.</p>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Twitter / X</label>
                      <input 
                        type="text" 
                        placeholder="@username"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-white/30 transition-all font-medium"
                        value={profile.socials.twitter}
                        onChange={e => setProfile({...profile, socials: {...profile.socials, twitter: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Instagram</label>
                      <input 
                        type="text" 
                        placeholder="@username"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-white/30 transition-all font-medium"
                        value={profile.socials.instagram}
                        onChange={e => setProfile({...profile, socials: {...profile.socials, instagram: e.target.value}})}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Accent Color</label>
                    <div className="flex gap-4">
                      {['#ffffff', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'].map(color => (
                        <button
                          key={color}
                          onClick={() => setProfile({...profile, accentColor: color})}
                          className={`w-12 h-12 rounded-2xl border-4 transition-all ${profile.accentColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                    <div className="text-left space-y-1">
                      <div className="text-xs font-black uppercase tracking-widest">Show Socials</div>
                      <div className="text-[10px] text-zinc-500 font-medium">Display social links on your profile</div>
                    </div>
                    <button 
                      onClick={() => setProfile({...profile, showSocials: !profile.showSocials})}
                      className={`w-14 h-7 rounded-full transition-all relative ${profile.showSocials ? 'bg-white' : 'bg-zinc-800'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full transition-all ${profile.showSocials ? 'right-1 bg-black' : 'left-1 bg-zinc-600'}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {setupStep === 6 && (
              <div className="space-y-8 text-center">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-[6px] border-white/10 mb-6 shadow-2xl">
                      <img src={profile.pfp} alt="PFP" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-white text-black text-[10px] font-black px-3 py-1 rounded-full shadow-xl">
                      #{profile.linkNumber}
                    </div>
                  </div>
                  <h1 className="text-4xl font-black tracking-tighter">{profile.username}</h1>
                  <p className="text-zinc-500 font-bold">@{profile.handle}</p>
                </div>
                
                <div className="flex justify-center gap-2">
                  {profile.interests.map(i => (
                    <span key={i} className="text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full text-zinc-400 border border-white/5">{i}</span>
                  ))}
                </div>

                <div className="glass-panel p-6 rounded-3xl text-left space-y-4 border-white/5">
                  <p className="text-sm font-medium leading-relaxed italic opacity-80">"{profile.bio || 'No bio yet...'}"</p>
                  <div className="flex gap-4 pt-4 border-t border-white/5">
                    {profile.location && <span className="text-[10px] font-bold text-zinc-500">📍 {profile.location}</span>}
                    {profile.website && <span className="text-[10px] font-bold text-zinc-500">🔗 {profile.website}</span>}
                  </div>
                </div>
                <p className="text-zinc-500 text-xs font-medium">Your Unify profile is ready. Step into the future.</p>
              </div>
            )}

            <div className="mt-12 flex gap-4">
              {setupStep > 1 && (
                <button 
                  onClick={() => setSetupStep(setupStep - 1)}
                  className="flex-1 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                >
                  Back
                </button>
              )}
              <button 
                onClick={() => {
                  if (setupStep < 6) {
                    setSetupStep(setupStep + 1);
                  } else {
                    handleSaveProfile();
                  }
                }}
                disabled={(setupStep === 1 && (!profile.username || !profile.handle)) || isSavingProfile}
                className="flex-[2] py-5 rounded-[24px] font-black uppercase tracking-widest text-xs bg-white text-black hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-xl flex items-center justify-center gap-2"
              >
                {isSavingProfile ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  setupStep === 6 ? 'Launch Unify' : 'Next Phase'
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full bg-[#09090b] text-white overflow-hidden font-sans relative" style={getGlobalStyles(profile.customization)}>
      {profile.customization?.customCss && (
        <style dangerouslySetInnerHTML={{ __html: profile.customization.customCss }} />
      )}
      <AnimatePresence>
        {viewingProfile && (
          <ProfileModal 
            profile={viewingProfile} 
            onClose={() => setViewingProfile(null)}
            isFollowing={following.includes(viewingProfile.id)}
            onToggleFollow={toggleFollow}
            currentUserId={user?.id}
            posts={viewingProfilePosts}
            userStatuses={userStatuses}
          />
        )}
      </AnimatePresence>
      {/* Ambient Glow */}
      <div 
        className="ambient-glow" 
        style={{ background: `radial-gradient(circle, ${ambientColor} 0%, transparent 60%)` }}
      />

      {/* Notification Modal */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed left-20 top-8 w-80 bg-[#09090b] border border-white/10 rounded-3xl shadow-2xl z-[100] p-6 max-h-[80vh] overflow-y-auto"
          >
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-6">Notifications</h3>
            {notifications.length > 0 ? (
              notifications.map(n => (
                <div key={n.id} className={`p-4 rounded-2xl mb-3 ${n.read ? 'bg-white/5' : 'bg-white/10'}`}>
                  <p className="text-sm text-white font-medium mb-1">
                    {n.type === 'view' && 'Someone viewed your profile'}
                    {n.type === 'message' && 'New message'}
                    {n.type === 'follow' && 'New follower'}
                    {n.type === 'comment' && 'New comment'}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{n.timestamp?.toDate().toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-600 text-center py-8">No notifications.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop) */}
      <nav className="hidden md:flex w-20 bg-black/50 backdrop-blur-xl border-r border-white/10 flex-col items-center py-8 z-50">
        <div className="mb-12 text-white">
          <Infinity size={32} />
        </div>
        
        <div className="flex flex-col gap-6">
          <button 
            onClick={() => setShowChangelog(true)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${showChangelog ? 'bg-white/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'text-zinc-500 hover:text-blue-400'}`}
            title="Update Log"
          >
            <Gift size={24} className="animate-pulse" />
          </button>
          <button 
            onClick={() => setActiveView('vibe')}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${activeView === 'vibe' ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'text-zinc-500 hover:text-white'}`}
            title="Vibe (Social)"
          >
            <Layers size={24} />
          </button>
          <button 
            onClick={() => setActiveView('chat')}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${activeView === 'chat' ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'text-zinc-500 hover:text-white'}`}
            title="Chat (Global)"
          >
            <Globe size={24} />
          </button>
          <button 
            onClick={() => setActiveView('link')}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${activeView === 'link' ? 'bg-white/10 text-[#25D366] shadow-[0_0_15px_rgba(37,211,102,0.1)]' : 'text-zinc-500 hover:text-white'}`}
            title="Link (Messages)"
          >
            <MessageSquare size={24} />
          </button>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${showNotifications ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}
            title="Notifications"
          >
            <div className="relative">
              <Bell size={24} />
              {notifications.filter(n => !n.read).length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              )}
            </div>
          </button>
        </div>
        
        <div className="mt-auto flex flex-col gap-6 items-center">
          <button 
            onClick={handleLogout}
            className="w-12 h-12 rounded-xl flex items-center justify-center text-zinc-500 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <LogOut size={24} />
          </button>
          <button 
            onClick={() => setIsEditingProfile(true)}
            className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-white/20 overflow-hidden hover:border-white transition-all"
            title="Edit Profile"
          >
            <img src={profile.pfp} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </button>
        </div>
      </nav>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-2xl border-t border-white/10 flex justify-around items-center z-[60] px-6">
        <button 
          onClick={() => setShowChangelog(true)}
          className={`flex flex-col items-center gap-1 ${showChangelog ? 'text-blue-400' : 'text-zinc-500'}`}
        >
          <Gift size={24} className="animate-pulse" />
        </button>
        <button 
          onClick={() => setActiveView('vibe')}
          className={`flex flex-col items-center gap-1 ${activeView === 'vibe' ? 'text-white' : 'text-zinc-500'}`}
        >
          <Layers size={24} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Vibe</span>
        </button>
        <button 
          onClick={() => setActiveView('chat')}
          className={`flex flex-col items-center gap-1 ${activeView === 'chat' ? 'text-white' : 'text-zinc-500'}`}
        >
          <Globe size={24} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Chat</span>
        </button>
        <button 
          onClick={() => setActiveView('link')}
          className={`flex flex-col items-center gap-1 ${activeView === 'link' ? 'text-[#25D366]' : 'text-zinc-500'}`}
        >
          <MessageSquare size={24} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Link</span>
        </button>
        <button 
          onClick={() => setIsEditingProfile(true)}
          className="w-8 h-8 rounded-full border border-white/20 overflow-hidden"
        >
          <img src={profile.pfp} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </button>
      </nav>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditingProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl glass-panel p-10 rounded-[40px] border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black tracking-tighter">Edit Profile</h2>
                <button onClick={() => setIsEditingProfile(false)} className="text-zinc-500 hover:text-white font-bold">Close</button>
              </div>

              <div className="space-y-8">
                <div className="relative h-48 w-full rounded-3xl overflow-hidden bg-zinc-900 border border-white/5 group">
                  <img src={profile.banner} alt="Banner" className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <label className="bg-white/10 backdrop-blur-xl px-4 py-2 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/20 transition-all cursor-pointer">
                      Update Banner
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'banner')} />
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-8 px-4">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-[6px] border-[#09090b] bg-zinc-800 -mt-20 z-20 shadow-2xl">
                    <img src={profile.pfp} alt="PFP" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors cursor-pointer">
                    Change Avatar
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'pfp')} />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Twitter / X</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-white/30 transition-all font-medium"
                      value={profile.socials.twitter}
                      onChange={e => setProfile({...profile, socials: {...profile.socials, twitter: e.target.value}})}
                      placeholder="@username"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Instagram</label>
                    <input 
                      type="text" 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-white/30 transition-all font-medium"
                      value={profile.socials.instagram}
                      onChange={e => setProfile({...profile, socials: {...profile.socials, instagram: e.target.value}})}
                      placeholder="@username"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <div className="text-xs font-black uppercase tracking-widest">Nitro Studio</div>
                    <div className="text-[10px] text-zinc-500 font-medium">Customise your profile fonts, colors, and effects</div>
                  </div>
                  <button 
                    onClick={() => setIsCustomizing(true)}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20"
                  >
                    Open Studio
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <div className="text-xs font-black uppercase tracking-widest">Show Socials</div>
                    <div className="text-[10px] text-zinc-500 font-medium">Display social links on your profile</div>
                  </div>
                  <button 
                    onClick={() => setProfile({...profile, showSocials: !profile.showSocials})}
                    className={`w-12 h-6 rounded-full transition-all relative ${profile.showSocials ? 'bg-white' : 'bg-zinc-800'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${profile.showSocials ? 'right-1 bg-black' : 'left-1 bg-zinc-600'}`} />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Bio</label>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-white/30 transition-all h-28 resize-none font-medium"
                    value={profile.bio}
                    onChange={e => setProfile({...profile, bio: e.target.value})}
                  />
                </div>

                <button 
                  onClick={async () => {
                    await handleSaveProfile();
                    setIsEditingProfile(false);
                  }}
                  className="w-full py-5 rounded-[24px] font-black uppercase tracking-widest text-xs bg-white text-black hover:bg-zinc-200 transition-all shadow-xl"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Moderation Overlay */}
      {profile.moderationStatus && profile.moderationStatus !== 'none' && (
        <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-8 text-center">
          <div className="text-6xl mb-6">🚫</div>
          <h1 className="text-4xl font-black tracking-tighter mb-4 uppercase">{profile.moderationStatus}</h1>
          <p className="text-zinc-500 mb-8 max-w-md">{profile.moderationReason || 'You have been moderated.'}</p>
          {profile.moderationExpiresAt && (
            <p className="text-zinc-700 text-xs font-bold uppercase tracking-widest">Expires: {new Date(profile.moderationExpiresAt.toDate()).toLocaleString()}</p>
          )}
        </div>
      )}

      {/* Main Content */}
      {showChangelog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto custom-scrollbar relative"
          >
            <button onClick={() => setShowChangelog(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white">
              <X size={24} />
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <Sparkles size={32} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-3xl font-black tracking-tighter text-white">The Biggest Update Ever</h2>
                <p className="text-blue-400 font-bold uppercase tracking-widest text-xs mt-1">Version 2.0 is here!</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  <Globe size={20} className="text-green-400" /> Global Chat Overhaul
                </h3>
                <ul className="space-y-3 text-sm text-zinc-300">
                  <li className="flex items-start gap-2"><span className="text-green-400 font-bold">1.</span> <strong>Rich Text Formatting:</strong> You can now use **bold** and *italic* text in global chat!</li>
                  <li className="flex items-start gap-2"><span className="text-green-400 font-bold">2.</span> <strong>Image & GIF Auto-Embedding:</strong> Paste any image URL (ending in .png, .jpg, .gif) and it will automatically render in the chat!</li>
                  <li className="flex items-start gap-2"><span className="text-green-400 font-bold">3.</span> <strong>Mentions System:</strong> Click on anyone's name in chat to quickly @mention them.</li>
                  <li className="flex items-start gap-2"><span className="text-green-400 font-bold">4.</span> <strong>Emoji Quick Bar:</strong> A new row of quick emojis above the chat input to react faster than ever.</li>
                  <li className="flex items-start gap-2"><span className="text-green-400 font-bold">5.</span> <strong>Sound Effects:</strong> Hear a satisfying 'pop' when new messages arrive (toggleable via the bell icon).</li>
                  <li className="flex items-start gap-2"><span className="text-green-400 font-bold">6.</span> <strong>Smart Timestamps:</strong> Messages now show "Today at 5:00 PM" for better readability.</li>
                </ul>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  <Users size={20} className="text-purple-400" /> Community & Profiles
                </h3>
                <ul className="space-y-3 text-sm text-zinc-300">
                  <li className="flex items-start gap-2"><span className="text-purple-400 font-bold">7.</span> <strong>User Badges:</strong> Special badges for Developers (⚡), VIPs (⭐), and Admins (🛡️) now appear next to names.</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 font-bold">8.</span> <strong>Online Users Sidebar:</strong> See exactly who is online right now in the Global Chat view.</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 font-bold">9.</span> <strong>Custom Chat Colors:</strong> Your profile's accent color now styles your name in the global chat.</li>
                  <li className="flex items-start gap-2"><span className="text-purple-400 font-bold">10.</span> <strong>Developer Tools:</strong> Admins now have a dedicated "Clear Chat" button to keep things tidy.</li>
                </ul>
              </div>
            </div>

            <button 
              onClick={() => setShowChangelog(false)}
              className="w-full mt-8 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all"
            >
              Awesome, let's go!
            </button>
          </motion.div>
        </div>
      )}

      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          {activeView === 'vibe' && (
            <motion.div 
              key="vibe"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex"
            >
              <div className="flex-1 overflow-y-auto px-[5%] py-8 max-w-4xl mx-auto scrollbar-hide">
                {/* Stories */}
                <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                  <div 
                    className="story-circle bg-zinc-800 flex items-center justify-center cursor-pointer hover:bg-zinc-700 transition-colors"
                    onClick={() => setIsStoryModalOpen(true)}
                  >
                    <div className="story-inner flex items-center justify-center">
                      <Plus size={20} className="text-zinc-500" />
                    </div>
                  </div>
                  {/* Group stories by user for the feed */}
                  {(Array.from(new Set(stories.map(s => s.authorId))) as string[]).map(authorId => {
                    const userStories = stories.filter(s => s.authorId === authorId);
                    const firstStory = userStories[0];
                    return (
                      <div 
                        key={authorId} 
                        className="story-circle cursor-pointer"
                        onClick={() => setActiveStories(userStories)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          fetchAndShowProfile(authorId);
                        }}
                      >
                        <div className="story-inner border-2 border-[#ff0050] p-0.5">
                          <img src={firstStory.authorPfp} alt="Story" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Create Post */}
                <div className="glass-panel rounded-[32px] mb-8 border-white/10 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Left: Image Upload/Preview */}
                    <div className="w-full md:w-1/3 bg-black/20 p-6 border-b md:border-b-0 md:border-r border-white/10 flex flex-col items-center justify-center min-h-[200px]">
                      {postImage ? (
                        <div className="relative w-full h-full rounded-2xl overflow-hidden group">
                          <img src={postImage} alt="Upload" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          <button 
                            onClick={() => setPostImage(null)}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => document.getElementById('post-image-upload')?.click()}
                          className="w-full h-full flex flex-col items-center justify-center gap-3 text-zinc-500 hover:text-white transition-colors py-8"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                            <Plus size={24} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">Add Image</span>
                        </button>
                      )}
                      <input 
                        id="post-image-upload"
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const base64 = await fileToBase64(file);
                            setPostImage(base64);
                          }
                        }} 
                      />
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                          <img src={profile.pfp} alt="You" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1">
                          <textarea 
                            placeholder="What's vibing?"
                            className="w-full bg-transparent border-none outline-none resize-none text-lg font-medium placeholder:text-zinc-600 h-32"
                            value={postContent}
                            onChange={e => setPostContent(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                        <div className="flex gap-2">
                          <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                            <Smile size={20} />
                          </button>
                        </div>
                        <button 
                          onClick={handleCreatePost}
                          disabled={isPosting || (!postContent.trim() && !postImage)}
                          className="px-8 py-3 rounded-full bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-all shadow-lg disabled:opacity-30"
                        >
                          {isPosting ? 'Posting...' : 'Post Vibe'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feed */}
                <div className="space-y-6">
                  {posts.map(post => (
                    <div key={post.id} className="glass-panel rounded-[24px] p-6 border-white/10 hover:border-white/20 transition-all">
                      {post.isRepost && (
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 px-1">
                          <Repeat size={12} />
                          <span>Reposted by {post.authorName}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => fetchAndShowProfile(post.authorId)}>
                          <div className="w-11 h-11 rounded-full bg-zinc-800 overflow-hidden">
                            <img src={post.authorPfp} alt="Author" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <div className="font-bold" style={getUsernameStyles(post.authorCustomization)}>{post.authorName}</div>
                            <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">@{post.authorHandle}</div>
                          </div>
                        </div>
                        <div className="text-[10px] text-zinc-600 font-bold">
                          {post.timestamp?.toDate().toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-lg leading-relaxed mb-4 font-medium" style={getMessageStyles(post.authorCustomization)}>
                        {renderContentWithHashtags(post.content)}
                      </div>
                      {post.imageUrl && (
                        <div className="w-full rounded-2xl overflow-hidden mb-4 border border-white/5">
                          <img src={post.imageUrl} alt="Post" className="w-full h-auto object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-4 border-t border-white/5 text-zinc-500">
                        <div className="flex gap-6 items-center">
                          <div 
                            className={`flex items-center gap-2 cursor-pointer transition-colors ${post.upvotes.includes(user?.id || '') ? 'text-orange-500' : 'hover:text-orange-500'}`}
                            onClick={() => toggleUpvote(post.id, post.upvotes)}
                          >
                            <ArrowUp size={20} />
                            <span className="font-black text-sm">{post.upvotes.length}</span>
                          </div>
                          <div 
                            className={`flex items-center gap-2 cursor-pointer transition-colors ${post.reposts.includes(user?.id || '') ? 'text-green-500' : 'hover:text-green-500'}`}
                            onClick={() => handleRepost(post)}
                          >
                            <Repeat size={20} />
                            <span className="font-black text-sm">{post.reposts.length}</span>
                          </div>
                          <div 
                            className="flex items-center gap-2 hover:text-blue-500 cursor-pointer transition-colors"
                            onClick={() => setActivePostForComments(post)}
                          >
                            <MessageCircle size={20} />
                            <span className="font-black text-sm">{post.commentCount}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {post.authorId === user?.id && (
                            <Trash2 
                              size={18} 
                              className="cursor-pointer hover:text-red-500 transition-colors" 
                              onClick={() => deletePost(post.id)}
                            />
                          )}
                          <Share2 size={20} className="cursor-pointer hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel */}
              <aside className="w-80 bg-black/20 border-l border-white/10 p-8 hidden xl:block">
                <div className="glass-panel rounded-3xl p-6 mb-6 border-white/5">
                  <div className="text-[10px] font-black text-zinc-500 mb-6 uppercase tracking-[0.2em]">Trending Vibes</div>
                  <div className="space-y-6">
                    <div>
                      <div className="text-[10px] text-zinc-500 font-bold mb-1">1 • Community</div>
                      <div className="font-black text-sm tracking-tight">#UnifyLaunch</div>
                      <div className="text-[10px] text-zinc-600 font-bold mt-1">50.2K Vibes</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 font-bold mb-1">2 • Tech</div>
                      <div className="font-black text-sm tracking-tight">The Future of Apps</div>
                      <div className="text-[10px] text-zinc-600 font-bold mt-1">Up +120% in v/tech</div>
                    </div>
                  </div>
                </div>
              </aside>
            </motion.div>
          )}

          {activeView === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="h-full flex w-full bg-black/40 backdrop-blur-md"
            >
              {/* Global Chat Area */}
              <div className="flex-1 flex flex-col h-full border-r border-white/10 relative">
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                  <div>
                    <h2 className="text-2xl font-black tracking-tighter flex items-center gap-4">
                      Global Chat
                      {user?.email === 'dev@gmail.com' && (
                        <button 
                          onClick={clearGlobalChat}
                          className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/40 px-3 py-1 rounded-full border border-red-500/30 transition-colors"
                        >
                          Clear Chat
                        </button>
                      )}
                    </h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Connect with everyone in the Unify universe</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-zinc-400 hover:text-white transition-colors">
                      {soundEnabled ? <Bell size={16} /> : <VolumeX size={16} />}
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        {getOnlineCount()} Online
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {[...globalMessages, ...savedMessages.map(sm => sm.originalMessage)]
                    .filter((msg, index, self) => 
                      self.findIndex(m => m.id === msg.id) === index
                    )
                    .filter(msg => {
                      const isSaved = savedMessages.some(sm => sm.messageId === msg.id);
                      if (isSaved) return true;
                      const fiveHoursAgo = Date.now() - (5 * 60 * 60 * 1000);
                      return msg.timestamp?.toDate().getTime() > fiveHoursAgo;
                    })
                    .sort((a, b) => a.timestamp?.toDate().getTime() - b.timestamp?.toDate().getTime())
                    .map(msg => {
                      const isSaved = savedMessages.some(sm => sm.messageId === msg.id);
                      const isMe = msg.authorId === user?.id;
                      const isAdminMsg = msg.isAnnouncement;
                      const isDev = msg.authorId === 'dev@gmail.com' || msg.authorName === 'dev';
                      const isVIP = msg.authorId === 'haydensixseven@gmail.com';

                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`flex gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden shrink-0 cursor-pointer" onClick={() => fetchAndShowProfile(msg.authorId)}>
                              <img src={msg.authorPfp} alt="PFP" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className={`flex items-center gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <span 
                                  className="text-[10px] font-black uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-white transition-colors flex items-center gap-1" 
                                  style={getUsernameStyles(msg.authorCustomization)}
                                  onClick={() => setGlobalChatInput(prev => `${prev} @${msg.authorHandle || msg.authorName} `)}
                                >
                                  {msg.authorName || msg.authorHandle || 'Player'} 
                                  {isAdminMsg && <ShieldCheck size={12} className="text-orange-500 ml-1" />}
                                  {isDev && <Zap size={12} className="text-yellow-400 ml-1" />}
                                  {isVIP && <Star size={12} className="text-purple-400 ml-1" />}
                                </span>
                                <span className="text-[8px] text-zinc-600 font-bold">
                                  {formatTimestamp(msg.timestamp)}
                                </span>
                              </div>
                              <div 
                                onClick={() => toggleSaveGlobalMessage(msg)}
                                style={getMessageStyles(msg.authorCustomization)}
                                className={`px-4 py-2 rounded-2xl text-sm font-medium cursor-pointer transition-all relative group ${
                                  isAdminMsg 
                                    ? 'bg-orange-500/20 border border-orange-500/30 text-orange-100' 
                                    : isMe 
                                      ? 'bg-white text-black' 
                                      : 'bg-zinc-800 text-white'
                                } ${isSaved ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black' : ''}`}
                              >
                                {renderRichText(msg.content)}
                                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Bookmark size={12} className={isSaved ? 'text-blue-500 fill-blue-500' : 'text-zinc-400'} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  }
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-6 bg-black/40 border-t border-white/10">
                  <div className="flex gap-2 mb-3">
                    {['👍', '❤️', '😂', '🔥', '👀', '✨', '🚀'].map(emoji => (
                      <button 
                        key={emoji}
                        onClick={() => setGlobalChatInput(prev => prev + emoji)}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-sm transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="flex-1 relative">
                      <input 
                        type="text"
                        placeholder={user?.email === 'dev@gmail.com' ? "Post an announcement..." : "Type a message... (Markdown supported: **bold**, *italic*, image URLs)"}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-white/30 transition-all font-medium pr-20"
                        value={globalChatInput}
                        onChange={e => setGlobalChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendGlobalMessage(globalChatInput)}
                      />
                      <button 
                        onClick={() => sendGlobalMessage(globalChatInput)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-all"
                      >
                        <ArrowUp size={20} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.2em] mt-3 text-center">
                    Messages clear every 5 hours. Click a message to save it for yourself.
                  </p>
                </div>
              </div>

              {/* Online Players Sidebar */}
              <div className="w-80 bg-black/20 p-6 hidden lg:flex flex-col">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 mb-6 flex items-center gap-2">
                  <Users size={14} /> Players Status
                </h3>
                <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1">
                  {(Object.entries(userStatuses) as [string, UserStatus][])
                    .sort((a, b) => (isUserOnline(a[1]) ? -1 : 1))
                    .map(([uid, status]) => {
                      const online = isUserOnline(status);
                      return (
                        <div key={uid} className={`flex items-center justify-between group cursor-pointer transition-all ${!online ? 'opacity-50 grayscale' : ''}`} onClick={() => fetchAndShowProfile(uid)}>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-white/10">
                                {status.pfp ? (
                                  <img src={status.pfp} alt="PFP" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-[10px] font-black">
                                    {uid.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black ${online ? 'bg-green-500' : 'bg-zinc-600'}`} />
                            </div>
                            <div>
                              <div className="text-xs font-bold group-hover:text-white transition-colors flex items-center gap-1">
                                {status.username || `Player ${uid.substring(0, 5)}`}
                                {status.username === 'dev' && <Zap size={10} className="text-yellow-400" />}
                                {uid === 'haydensixseven@gmail.com' && <Star size={10} className="text-purple-400" />}
                              </div>
                              <div className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">{online ? 'online' : 'offline'}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'link' && (
            <motion.div 
              key="link"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex w-full"
            >
              {/* Chat Sidebar */}
              <div className={`w-full md:w-[350px] border-r border-white/10 bg-black/30 p-5 flex flex-col ${mobileChatActive ? 'hidden md:flex' : 'flex'}`}>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-2xl font-extrabold">Link</h2>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Enter Link ID..."
                      className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:border-white/30 w-32 md:w-40"
                      value={searchId}
                      onChange={e => setSearchId(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && startChat(searchId)}
                    />
                    {isSearching && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-zinc-500" size={12} />}
                  </div>
                </div>
                
                {searchError && <p className="text-red-500 text-[10px] font-bold mb-4">{searchError}</p>}

                <div className="flex-1 overflow-y-auto space-y-4 pb-20 md:pb-0">
                  {/* Requests Section */}
                  {chats.filter(c => c.status === 'pending' && c.initiatorId !== user?.id).length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3 px-3">Requests</h3>
                      {chats.filter(c => c.status === 'pending' && c.initiatorId !== user?.id).map(chat => (
                        <div 
                          key={chat.id}
                          onClick={() => {
                            setActiveChat(chat);
                            setMobileChatActive(true);
                          }}
                          className={`flex gap-4 items-center p-3 rounded-xl cursor-pointer transition-all ${activeChat?.id === chat.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                        >
                          <div className="w-11 h-11 rounded-full bg-zinc-700 overflow-hidden border-2 border-[#FFFC00]">
                            <img src={chat.otherUser?.pfp} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold">{chat.otherUser?.username}</div>
                            <div className="text-[10px] text-zinc-500">Wants to Link</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Active Chats */}
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3 px-3">Messages</h3>
                    {chats.filter(c => c.status === 'active' || (c.status === 'pending' && c.initiatorId === user?.id)).map(chat => (
                      <div 
                        key={chat.id}
                        onClick={() => {
                          setActiveChat(chat);
                          setMobileChatActive(true);
                        }}
                        className={`flex gap-4 items-center p-3 rounded-xl cursor-pointer transition-all ${activeChat?.id === chat.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                      >
                        <div className="w-11 h-11 rounded-full bg-zinc-700 overflow-hidden">
                          <img src={chat.otherUser?.pfp} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{chat.otherUser?.username}</div>
                          <div className="text-xs text-zinc-500 truncate max-w-[180px]">
                            {chat.lastMessage || 'Start a conversation'}
                          </div>
                        </div>
                        {chat.status === 'pending' && <span className="text-[8px] font-black uppercase bg-zinc-800 px-2 py-1 rounded text-zinc-500">Sent</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat Window */}
              <div className={`flex-1 flex flex-col bg-[#09090b] relative ${!mobileChatActive ? 'hidden md:flex' : 'flex'}`}>
                {activeChat ? (
                  <>
                    <div className="p-5 border-b border-white/10 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setMobileChatActive(false)} className="md:hidden text-zinc-500 hover:text-white">
                          <ChevronLeft size={24} />
                        </button>
                        <div 
                          className="w-11 h-11 rounded-full bg-zinc-700 overflow-hidden cursor-pointer"
                          onClick={() => setViewingProfile(activeChat.otherUser || null)}
                        >
                          <img src={activeChat.otherUser?.pfp} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{activeChat.otherUser?.username}</h3>
                          <div className="text-xs text-[#25D366]">Online • #{activeChat.otherUser?.linkNumber}</div>
                        </div>
                      </div>
                      <div className="flex gap-3 md:gap-5 text-zinc-500 items-center">
                        <MoreVertical size={20} className="cursor-pointer hover:text-white" onClick={() => alert("More options coming soon!")} />
                      </div>
                    </div>
                    
                    <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto pb-28">
                      {activeChat.status === 'pending' && activeChat.initiatorId !== user?.id && (
                        <div className="flex flex-col items-center justify-center p-10 text-center space-y-5">
                          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                            <LinkIcon size={32} className="text-white" />
                          </div>
                          <div>
                            <h4 className="text-xl font-black tracking-tighter">Link Request</h4>
                            <p className="text-zinc-500 text-sm">Accept to start messaging {activeChat.otherUser?.username}.</p>
                          </div>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => acceptRequest(activeChat.id)}
                              className="px-8 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest"
                            >
                              Accept
                            </button>
                            <button className="px-8 py-3 bg-white/5 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10">
                              Decline
                            </button>
                          </div>
                        </div>
                      )}

                      {messages.map((msg) => (
                        <div 
                          key={msg.id}
                          className={`max-w-[60%] ${msg.senderId === user?.id ? 'self-end' : 'self-start'}`}
                        >
                          {msg.text && (
                            <div className={`p-3 px-4 rounded-[20px] ${msg.senderId === user?.id ? 'bg-white text-black rounded-br-sm' : 'bg-white/10 text-white rounded-bl-sm'}`}>
                              {msg.text}
                            </div>
                          )}
                          {msg.imageUrl && (
                            <div className="mt-2 bg-zinc-800 rounded-2xl overflow-hidden border border-white/10 group relative">
                              <img src={msg.imageUrl} alt="Snap" className="w-full h-64 object-cover" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[10px] font-black uppercase tracking-widest bg-white text-black px-3 py-1 rounded-full">Link Snap</span>
                              </div>
                            </div>
                          )}
                          <div className="mt-1 flex items-center gap-1 justify-end">
                            <span className="text-[8px] text-zinc-500 uppercase tracking-widest">
                              {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </span>
                            {msg.senderId === user?.id && (
                              <CheckCheck size={10} className={msg.readBy?.length > 1 ? 'text-[#25D366]' : 'text-zinc-500'} />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chat Input */}
                    {(activeChat.status === 'active' || activeChat.initiatorId === user?.id) && (
                      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#09090b] to-transparent z-20">
                        <div className="glass-panel rounded-[24px] p-2 flex items-center gap-2 border-white/10">
                          <label className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors cursor-pointer">
                            <Paperclip size={20} />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const base64 = await fileToBase64(file);
                                  sendMessage(undefined, base64);
                                }
                              }} 
                            />
                          </label>
                          <input 
                            type="text" 
                            ref={chatInputRef}
                            placeholder="Send a message..."
                            className="flex-1 bg-transparent outline-none px-4 font-medium"
                            inputMode="text"
                            enterKeyHint="send"
                            onKeyDown={e => {
                              if (e.key === 'Enter' && e.currentTarget.value) {
                                sendMessage(e.currentTarget.value);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                          <div className="flex gap-1 pr-2">
                            <button className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                              <Mic size={20} />
                            </button>
                            <button className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-lg">
                              <ArrowUp size={20} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                      <MessageSquare size={48} className="text-zinc-500" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter mb-2">Your Links</h3>
                    <p className="text-zinc-500 text-sm max-w-xs">Select a chat or enter a Link ID to start a conversation.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comment Modal */}
        <AnimatePresence>
          {activePostForComments && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-2xl glass-panel rounded-[32px] overflow-hidden border-white/10 flex flex-col max-h-[85vh]"
              >
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                  <h3 className="text-xl font-black tracking-tighter">Comments</h3>
                  <button onClick={() => setActivePostForComments(null)} className="text-zinc-500 hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {/* Original Post Preview */}
                  <div className="pb-6 border-b border-white/5 opacity-60">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={activePostForComments.authorPfp} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                      <div className="text-xs font-bold">{activePostForComments.authorName}</div>
                    </div>
                    <div className="text-sm">{activePostForComments.content}</div>
                  </div>

                  {/* Comments List */}
                  {comments.length === 0 ? (
                    <div className="py-10 text-center text-zinc-600 text-sm font-bold uppercase tracking-widest">No comments yet</div>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="flex gap-4">
                        <img src={comment.authorPfp} className="w-10 h-10 rounded-full shrink-0" referrerPolicy="no-referrer" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm" style={getUsernameStyles(comment.authorCustomization)}>{comment.authorName}</span>
                            <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">@{comment.authorHandle}</span>
                          </div>
                          <div className="text-sm leading-relaxed" style={getMessageStyles(comment.authorCustomization)}>{comment.text}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-6 bg-zinc-900/80 border-t border-white/5">
                  <div className="flex gap-4">
                    <img src={profile.pfp} className="w-10 h-10 rounded-full shrink-0" referrerPolicy="no-referrer" />
                    <div className="flex-1 relative">
                      <textarea 
                        placeholder="Add a comment..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 outline-none focus:border-white/30 transition-all text-sm resize-none h-20"
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                      />
                      <button 
                        onClick={() => addComment(activePostForComments.id)}
                        disabled={!commentText.trim() || isPostingComment}
                        className="absolute bottom-3 right-3 px-4 py-2 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-30"
                      >
                        {isPostingComment ? '...' : 'Post'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Story Creation Modal */}
        <AnimatePresence>
          {isStoryModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-4xl glass-panel rounded-[32px] overflow-hidden border-white/10 flex flex-col md:flex-row max-h-[90vh]"
              >
                {/* Left: Image Preview */}
                <div className="flex-1 bg-black/40 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-white/10 overflow-hidden">
                  <div 
                    className="w-full h-full max-h-[60vh] md:max-h-full rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all overflow-hidden relative group"
                    onClick={() => document.getElementById('story-upload')?.click()}
                  >
                    {storyImage ? (
                      <>
                        <img src={storyImage} alt="Story" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-white text-black px-4 py-2 rounded-full">Change Image</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                          <Plus size={32} className="text-zinc-500" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Upload Story Image</span>
                      </>
                    )}
                    <input 
                      id="story-upload"
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const base64 = await fileToBase64(file);
                          setStoryImage(base64);
                        }
                      }} 
                    />
                  </div>
                </div>

                {/* Right: Settings */}
                <div className="w-full md:w-80 p-8 flex flex-col justify-between bg-zinc-900/50">
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-black tracking-tighter">Post a Story</h3>
                      <button onClick={() => setIsStoryModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={24} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Who can see this?</label>
                      <div className="grid grid-cols-1 gap-2">
                        {(['public', 'followers', 'mutuals'] as const).map(p => (
                          <button
                            key={p}
                            onClick={() => setStoryPrivacy(p)}
                            className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-between px-5 ${storyPrivacy === p ? 'bg-white text-black border-white' : 'bg-white/5 text-zinc-500 border-white/10 hover:border-white/20'}`}
                          >
                            {p}
                            {storyPrivacy === p && <div className="w-2 h-2 rounded-full bg-black" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handlePostStory}
                    disabled={isPosting || !storyImage}
                    className="w-full py-5 rounded-[24px] font-black uppercase tracking-widest text-xs bg-white text-black hover:bg-zinc-200 transition-all shadow-xl disabled:opacity-30 mt-8"
                  >
                    {isPosting ? 'Posting...' : 'Share Story'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Story Viewer */}
        <AnimatePresence>
          {activeStories && (
            <StoryViewer 
              stories={activeStories} 
              onClose={() => setActiveStories(null)} 
            />
          )}
        </AnimatePresence>
      </main>

      {/* Customization Studio */}
      <AnimatePresence>
        {isCustomizing && (
          <CustomizationStudio 
            id={user?.id || ''}
            customization={profile.customization || DEFAULT_CUSTOMIZATION}
            onClose={() => setIsCustomizing(false)}
            onUpdate={(newCustom) => setProfile(prev => ({ ...prev, customization: newCustom }))}
          />
        )}
      </AnimatePresence>

      <SupabaseStatus />
    </div>
  );
}
