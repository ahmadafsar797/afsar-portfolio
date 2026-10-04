import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit,
  Save,
  Upload,
  Film,
  Video,
  MessageSquareQuote,
  Layers,
  Settings,
  User,
  Inbox,
  LogOut,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Shield,
  Eye,
  RefreshCw,
  Lock,
  Camera,
  Type,
  MousePointerClick,
  Tag,
  Compass,
  Heading,
  Sparkles,
  Download,
  FileUp,
  HelpCircle,
  UploadCloud,
} from 'lucide-react';
import { VideoFramePickerModal } from '../VideoFramePickerModal';
import { api } from '../../services/api';
import { FONT_FAMILIES, FONT_WEIGHT_OPTIONS, applyDynamicFonts } from '../../utils/fontLoader';
import {
  Reel,
  HorizontalVideo,
  Testimonial,
  Service,
  AboutData,
  SettingsData,
} from '../../types';
import { isYouTubeUrl, getYouTubeThumbnail } from '../../utils/videoUtils';

export interface ExtractedVideoFrame {
  id: number;
  time: number;
  label: string;
  dataUrl: string;
  blob: Blob;
}

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose, onDataChanged }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: 'admin', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'reels' | 'horizontal' | 'testimonials' | 'services' | 'about' | 'hero-bg' | 'settings'
  >('overview');

  // Hero Background Video
  const [heroVideoUploading, setHeroVideoUploading] = useState(false);

  // Loaded Data
  const [reels, setReels] = useState<Reel[]>([]);
  const [horizontalVideos, setHorizontalVideos] = useState<HorizontalVideo[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [about, setAbout] = useState<AboutData | null>(null);
  const [settings, setSettings] = useState<SettingsData>({});

  // Feedback notifications
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 6000);
  };

  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublishLive = async () => {
    setIsPublishing(true);
    try {
      const res = await api.publishLive();
      showNotice(res.message, 'success');
      onDataChanged();
    } catch (err: any) {
      showNotice(err.message || 'Failed to publish to live website', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  // Editing state trackers
  const [editingReel, setEditingReel] = useState<Partial<Reel> | null>(null);
  const [editingHorizontal, setEditingHorizontal] = useState<Partial<HorizontalVideo> | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);

  // Profile picture
  const [profilePicUploading, setProfilePicUploading] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);

  // Showreel frame picker modal
  const [showreelPickerOpen, setShowreelPickerOpen] = useState(false);

  // 5-Frame Candidate Thumbnail states for Reels & Horizontal Videos
  const [reelCandidateFrames, setReelCandidateFrames] = useState<ExtractedVideoFrame[]>([]);
  const [extractingReelFrames, setExtractingReelFrames] = useState<boolean>(false);
  const [selectedReelFrameId, setSelectedReelFrameId] = useState<number | null>(null);
  const [reelFramePickerOpen, setReelFramePickerOpen] = useState<boolean>(false);

  const [horizontalCandidateFrames, setHorizontalCandidateFrames] = useState<ExtractedVideoFrame[]>([]);
  const [extractingHorizontalFrames, setExtractingHorizontalFrames] = useState<boolean>(false);
  const [selectedHorizontalFrameId, setSelectedHorizontalFrameId] = useState<number | null>(null);
  const [horizontalFramePickerOpen, setHorizontalFramePickerOpen] = useState<boolean>(false);

  // Backup & Deployment Persistence States
  const [showDeployHelpModal, setShowDeployHelpModal] = useState<boolean>(false);

  const handleExportBackup = async () => {
    try {
      showNotice('Generating portfolio backup JSON...');
      const blob = await api.exportBackup();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `afsar_portfolio_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showNotice('Backup downloaded! Save this file to keep your content permanent.');
    } catch (e: any) {
      showNotice(e.message || 'Export failed', 'error');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showNotice('Restoring portfolio content from backup...');
      const text = await file.text();
      const json = JSON.parse(text);
      await api.importBackup(json);
      await loadAllAdminData();
      onDataChanged();
      showNotice('All content, reels, and settings restored successfully!');
    } catch (e: any) {
      showNotice(e.message || 'Failed to restore backup. Invalid JSON file.', 'error');
    } finally {
      e.target.value = '';
    }
  };

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showNotice('Please enter current and new password', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotice('New passwords do not match', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showNotice('New password must be at least 6 characters', 'error');
      return;
    }
    try {
      setPasswordLoading(true);
      await api.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      showNotice('Admin password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showNotice(err.message || 'Failed to change password. Check current password.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Check auth on open
  useEffect(() => {
    if (isOpen) {
      checkAuth();
    }
  }, [isOpen]);

  const checkAuth = async () => {
    const token = localStorage.getItem('cinema_admin_token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }
    try {
      await api.getMe();
      setIsAuthenticated(true);
      loadAllAdminData();
    } catch {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      await api.login(loginForm);
      setIsAuthenticated(true);
      loadAllAdminData();
      showNotice('Welcome back, Admin!');
    } catch (err: any) {
      setLoginError(err.message || 'Invalid username or password');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    onDataChanged();
  };

  const loadAllAdminData = async () => {
    try {
      const [r, h, t, s, a, set] = await Promise.all([
        api.getReels(),
        api.getHorizontalVideos(),
        api.getTestimonials(),
        api.getServices(),
        api.getAbout(),
        api.getSettings(),
      ]);
      setReels(r);
      setHorizontalVideos(h);
      setTestimonials(t);
      setServices(s);
      setAbout(a);
      setSettings(set);
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  // Helper file upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showNotice('Uploading media file...');
      const res = await api.uploadFile(file);
      callback(res.url);
      showNotice('Media uploaded successfully!');
    } catch (err: any) {
      showNotice(err.message || 'Failed to upload file', 'error');
    }
  };

  // Helper to extract 5 candidate frames across a video with true unzoomed aspect ratio
  const extractMultipleVideoFrames = (
    source: File | string,
    isVertical: boolean = true
  ): Promise<ExtractedVideoFrame[]> => {
    return new Promise((resolve) => {
      try {
        const isFile = typeof source !== 'string';
        const url = isFile ? URL.createObjectURL(source) : source;
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;
        video.src = url;

        let isFinished = false;
        const cleanup = () => {
          if (!isFinished) {
            isFinished = true;
            if (isFile) URL.revokeObjectURL(url);
          }
        };

        const timeout = setTimeout(() => {
          cleanup();
          resolve([]);
        }, 12000);

        video.addEventListener('loadedmetadata', async () => {
          const duration = video.duration;
          if (!duration || !isFinite(duration) || duration <= 0) {
            clearTimeout(timeout);
            cleanup();
            resolve([]);
            return;
          }

          // 5 distributed timestamps across video: 10%, 25%, 50%, 75%, 90%
          const percentages = [0.10, 0.25, 0.50, 0.75, 0.90];
          const timestamps = percentages.map((p) => {
            const t = duration * p;
            return Math.min(Math.max(0.1, t), Math.max(0.1, duration - 0.2));
          });

          const vW = video.videoWidth || (isVertical ? 540 : 960);
          const vH = video.videoHeight || (isVertical ? 960 : 540);
          const targetW = isVertical ? 540 : 960;
          const targetH = Math.round((targetW * vH) / vW);

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');

          const frames: ExtractedVideoFrame[] = [];

          for (let i = 0; i < timestamps.length; i++) {
            if (isFinished) break;
            const time = timestamps[i];
            const pct = Math.round(percentages[i] * 100);

            try {
              await new Promise<void>((resSeek) => {
                let seekTimer: any = null;
                const onSeeked = () => {
                  clearTimeout(seekTimer);
                  video.removeEventListener('seeked', onSeeked);
                  resSeek();
                };
                seekTimer = setTimeout(() => {
                  video.removeEventListener('seeked', onSeeked);
                  resSeek();
                }, 2000);
                video.addEventListener('seeked', onSeeked, { once: true });
                video.currentTime = time;
              });

              if (ctx) {
                ctx.drawImage(video, 0, 0, targetW, targetH);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

                await new Promise<void>((resBlob) => {
                  canvas.toBlob((blob) => {
                    if (blob) {
                      const minutes = Math.floor(time / 60);
                      const seconds = Math.floor(time % 60);
                      const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
                      frames.push({
                        id: i + 1,
                        time,
                        label: `${pct}% (${timeFormatted})`,
                        dataUrl,
                        blob,
                      });
                    }
                    resBlob();
                  }, 'image/jpeg', 0.85);
                });
              }
            } catch {
              // Continue to next frame
            }
          }

          clearTimeout(timeout);
          cleanup();
          resolve(frames);
        }, { once: true });

        video.addEventListener('error', () => {
          clearTimeout(timeout);
          cleanup();
          resolve([]);
        }, { once: true });

        video.load();
      } catch {
        resolve([]);
      }
    });
  };

  // ── Reel Frame Selection & Upload Handlers ──
  const handleSelectReelFrame = async (frame: ExtractedVideoFrame) => {
    try {
      setSelectedReelFrameId(frame.id);
      showNotice(`Applying frame at ${frame.label} as thumbnail...`);
      const safeName = (editingReel?.title || 'reel').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safeName}-${Date.now()}-cover.jpg`;
      const file = new File([frame.blob], filename, { type: 'image/jpeg' });
      const res = await api.uploadFile(file);
      setEditingReel((prev) => (prev ? { ...prev, thumbnail_url: res.url } : null));
      showNotice(`Thumbnail set to frame at ${frame.label}!`);
    } catch (err: any) {
      showNotice(err.message || 'Failed to apply thumbnail frame', 'error');
    }
  };

  const handleExtractFramesForCurrentReel = async () => {
    if (!editingReel?.video_url) return;
    try {
      setExtractingReelFrames(true);
      showNotice('Extracting 5 frames from reel video...');
      const frames = await extractMultipleVideoFrames(editingReel.video_url, true);
      setReelCandidateFrames(frames);
      setExtractingReelFrames(false);
      if (frames.length > 0) {
        showNotice('5 frames ready! Click any frame to set as thumbnail.');
      } else {
        showNotice('Could not extract frames from this video URL', 'error');
      }
    } catch (err: any) {
      setExtractingReelFrames(false);
      showNotice(err.message || 'Failed to extract frames', 'error');
    }
  };

  const handleReelVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showNotice('Uploading reel video...');
      const videoRes = await api.uploadFile(file);
      setEditingReel((prev) => (prev ? { ...prev, video_url: videoRes.url } : null));

      setExtractingReelFrames(true);
      showNotice('Extracting 5 candidate thumbnail frames from video...');
      const frames = await extractMultipleVideoFrames(file, true);
      setReelCandidateFrames(frames);
      setExtractingReelFrames(false);

      if (frames.length > 0) {
        const defaultFrame = frames[0];
        setSelectedReelFrameId(defaultFrame.id);
        const safeName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        const thumbFile = new File([defaultFrame.blob], `${safeName}-cover.jpg`, { type: 'image/jpeg' });
        const thumbRes = await api.uploadFile(thumbFile);
        setEditingReel((prev) => (prev ? { ...prev, thumbnail_url: thumbRes.url } : null));
        showNotice('Video uploaded & 5 thumbnail frames ready! Click any frame to choose.');
      } else {
        showNotice('Video uploaded successfully!');
      }
    } catch (err: any) {
      setExtractingReelFrames(false);
      showNotice(err.message || 'Failed to upload video', 'error');
    }
  };

  // ── Horizontal Video Frame Selection & Upload Handlers ──
  const handleSelectHorizontalFrame = async (frame: ExtractedVideoFrame) => {
    try {
      setSelectedHorizontalFrameId(frame.id);
      showNotice(`Applying frame at ${frame.label} as thumbnail...`);
      const safeName = (editingHorizontal?.title || 'film').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safeName}-${Date.now()}-cover.jpg`;
      const file = new File([frame.blob], filename, { type: 'image/jpeg' });
      const res = await api.uploadFile(file);
      setEditingHorizontal((prev) => (prev ? { ...prev, thumbnail_url: res.url } : null));
      showNotice(`Thumbnail set to frame at ${frame.label}!`);
    } catch (err: any) {
      showNotice(err.message || 'Failed to apply thumbnail frame', 'error');
    }
  };

  const handleExtractFramesForCurrentHorizontal = async () => {
    if (!editingHorizontal?.video_url) return;
    try {
      setExtractingHorizontalFrames(true);
      showNotice('Extracting 5 frames from film video...');
      const frames = await extractMultipleVideoFrames(editingHorizontal.video_url, false);
      setHorizontalCandidateFrames(frames);
      setExtractingHorizontalFrames(false);
      if (frames.length > 0) {
        showNotice('5 frames ready! Click any frame to set as thumbnail.');
      } else {
        showNotice('Could not extract frames from this video URL', 'error');
      }
    } catch (err: any) {
      setExtractingHorizontalFrames(false);
      showNotice(err.message || 'Failed to extract frames', 'error');
    }
  };

  const handleHorizontalVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showNotice('Uploading film video...');
      const videoRes = await api.uploadFile(file);
      setEditingHorizontal((prev) => (prev ? { ...prev, video_url: videoRes.url } : null));

      setExtractingHorizontalFrames(true);
      showNotice('Extracting 5 candidate thumbnail frames from video...');
      const frames = await extractMultipleVideoFrames(file, false);
      setHorizontalCandidateFrames(frames);
      setExtractingHorizontalFrames(false);

      if (frames.length > 0) {
        const defaultFrame = frames[0];
        setSelectedHorizontalFrameId(defaultFrame.id);
        const safeName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
        const thumbFile = new File([defaultFrame.blob], `${safeName}-cover.jpg`, { type: 'image/jpeg' });
        const thumbRes = await api.uploadFile(thumbFile);
        setEditingHorizontal((prev) => (prev ? { ...prev, thumbnail_url: thumbRes.url } : null));
        showNotice('Video uploaded & 5 thumbnail frames ready! Click any frame to choose.');
      } else {
        showNotice('Video uploaded successfully!');
      }
    } catch (err: any) {
      setExtractingHorizontalFrames(false);
      showNotice(err.message || 'Failed to upload video', 'error');
    }
  };

  const closeReelModal = () => {
    setEditingReel(null);
    setReelCandidateFrames([]);
    setSelectedReelFrameId(null);
  };

  const closeHorizontalModal = () => {
    setEditingHorizontal(null);
    setHorizontalCandidateFrames([]);
    setSelectedHorizontalFrameId(null);
  };

  const handleProfilePicUpload = async (file: File) => {
    setProfilePicUploading(true);
    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setProfilePicPreview(localPreview);
    try {
      const res = await api.uploadProfilePicture(file);
      setSettings((prev) => ({ ...prev, profile_picture_url: res.url }));
      showNotice('Profile picture updated! Reload the page to see it in the navbar.');
    } catch (err: any) {
      setProfilePicPreview(null);
      showNotice(err.message || 'Failed to upload profile picture', 'error');
    } finally {
      setProfilePicUploading(false);
    }
  };

  const handleRemoveProfilePic = async () => {
    try {
      await api.removeProfilePicture();
      setSettings((prev) => ({ ...prev, profile_picture_url: undefined }));
      setProfilePicPreview(null);
      showNotice('Profile picture removed.');
    } catch (err: any) {
      showNotice(err.message || 'Failed to remove profile picture', 'error');
    }
  };

  const handleHeroVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExts = ['mp4', 'webm', 'mov', 'm4v'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !validExts.includes(ext)) {
      showNotice('Please upload a video file (.mp4, .webm, or .mov)', 'error');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      showNotice('Video file exceeds 100MB limit', 'error');
      return;
    }

    try {
      setHeroVideoUploading(true);
      showNotice('Uploading background video to server...', 'info');
      const res = await api.uploadFile(file);
      const updated = {
        ...settings,
        hero_bg_video_url: res.url,
        hero_bg_video_enabled: '1',
      };
      setSettings(updated);
      await api.updateSettings(updated);
      showNotice('Landing page background video uploaded and activated!');
      onDataChanged();
    } catch (err: any) {
      showNotice(err.message || 'Failed to upload video', 'error');
    } finally {
      setHeroVideoUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveHeroVideo = async () => {
    if (!confirm('Remove the background video from the landing page?')) return;
    try {
      const updated = {
        ...settings,
        hero_bg_video_url: '',
        hero_bg_video_enabled: '0',
      };
      setSettings(updated);
      await api.updateSettings(updated);
      showNotice('Background video removed. Restored editorial background.');
      onDataChanged();
    } catch (err: any) {
      showNotice(err.message || 'Error removing video', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div data-font-ignore="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[90vh] bg-[#0c0c12] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Top Title Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0e0e16]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C65D45]/20 border border-[#C65D45]/40 flex items-center justify-center text-[#C65D45]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-pogonia text-2xl font-normal text-white">
                Studio Portfolio Manager
              </h2>
              <p className="text-[10px] font-montserrat uppercase tracking-wider text-white/50">
                Afsar Ahmad Post-Production CMS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {notice && (
              <span
                className={`text-xs px-3 py-1 rounded-full animate-in fade-in duration-300 font-montserrat ${
                  notice.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                {notice.text}
              </span>
            )}

            {isAuthenticated && (
              <>
                <button
                  onClick={handlePublishLive}
                  disabled={isPublishing}
                  className={`p-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-lg font-montserrat uppercase font-bold cursor-pointer ${
                    isPublishing
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-wait'
                      : 'bg-gradient-to-r from-[#C65D45] to-[#E2725B] hover:brightness-110 text-white border border-[#E2725B]/40 active:scale-95 shadow-[0_0_15px_rgba(198,93,69,0.35)]'
                  }`}
                  title="Permanently commits all uploaded videos, thumbnails, and changes to Git and deploys to Render."
                >
                  <UploadCloud className={`w-4 h-4 ${isPublishing ? 'animate-bounce' : ''}`} />
                  <span className="inline font-montserrat text-[11px] uppercase font-bold tracking-wider">
                    {isPublishing ? 'Publishing...' : '🚀 Push to Live Site'}
                  </span>
                </button>

                <button
                  onClick={handleExportBackup}
                  className="p-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs flex items-center gap-1.5 transition-colors border border-white/10"
                  title="Download a complete JSON backup file of all reels, videos, testimonials, and settings."
                >
                  <Download className="w-3.5 h-3.5 text-[#C65D45]" />
                  <span className="hidden sm:inline font-montserrat text-[11px] uppercase font-semibold">
                    Backup JSON
                  </span>
                </button>

                <label
                  className="p-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs flex items-center gap-1.5 transition-colors border border-white/10 cursor-pointer"
                  title="Restore all reels, videos, and settings from a downloaded backup JSON file."
                >
                  <FileUp className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline font-montserrat text-[11px] uppercase font-semibold">
                    Restore JSON
                  </span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleImportBackup}
                  />
                </label>

                <button
                  onClick={() => setShowDeployHelpModal(true)}
                  className="p-2 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs flex items-center gap-1 transition-colors border border-amber-500/20"
                  title="Why do changes reset after deployment? Click to learn how to keep changes permanent."
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-montserrat text-[11px] uppercase font-medium">Why Reset?</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-red-400 text-xs flex items-center gap-1.5 transition-colors border border-white/10"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline font-montserrat text-[11px] uppercase">Logout</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Cloud vs Localhost Notice Bar */}
        {!isLocalhost && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Live Cloud Notice:</strong> Video files uploaded directly on Render reset when deploying. To upload videos permanently, run <strong>Run Portfolio Admin.bat</strong> on your laptop!
              </span>
            </div>
          </div>
        )}

        {/* Unauthenticated View: Secure Login Form */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md p-8 rounded-3xl bg-[#12121a] border border-white/10 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#C65D45]/10 border border-[#C65D45]/30 flex items-center justify-center mx-auto mb-3 text-[#C65D45]">
                  <Film className="w-6 h-6" />
                </div>
                <h3 className="font-pogonia text-3xl font-normal text-white">
                  Editor Portal Authentication
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Enter your credentials to manage showreels, case studies, and inquiries.
                </p>
              </div>

              {loginError && (
                <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-montserrat uppercase tracking-wider text-white/60 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#C65D45]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-montserrat uppercase tracking-wider text-white/60 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter admin password..."
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#C65D45]"
                  />
                  <span className="text-[10px] text-white/40 block mt-1">
                    Default: <code className="text-[#C65D45]">editor2026!</code>
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 rounded-full text-xs font-montserrat uppercase tracking-widest font-semibold text-white bg-[#C65D45] hover:bg-[#ff3333] transition-all duration-300 mt-2 disabled:opacity-50"
                >
                  {loginLoading ? 'Authenticating...' : 'Sign In To Studio Dashboard'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard Body */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-full md:w-60 border-b md:border-b-0 md:border-r border-white/10 bg-[#0a0a0f] p-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-montserrat uppercase tracking-wider transition-all text-left whitespace-nowrap ${
                  activeTab === 'overview' ? 'bg-[#C65D45] text-[#2B170F] font-bold font-medium shadow-md' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('reels')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-montserrat uppercase tracking-wider transition-all text-left whitespace-nowrap ${
                  activeTab === 'reels' ? 'bg-[#C65D45] text-[#2B170F] font-bold font-medium shadow-md' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Film className="w-4 h-4" />
                  <span>9:16 Reels</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 font-montserrat">
                  {reels.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('horizontal')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-montserrat uppercase tracking-wider transition-all text-left whitespace-nowrap ${
                  activeTab === 'horizontal' ? 'bg-[#C65D45] text-[#2B170F] font-bold font-medium shadow-md' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Video className="w-4 h-4" />
                  <span>16:9 Horizontal</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 font-montserrat">
                  {horizontalVideos.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('testimonials')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-montserrat uppercase tracking-wider transition-all text-left whitespace-nowrap ${
                  activeTab === 'testimonials' ? 'bg-[#C65D45] text-[#2B170F] font-bold font-medium shadow-md' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MessageSquareQuote className="w-4 h-4" />
                  <span>Testimonials</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 font-montserrat">
                  {testimonials.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('services')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-montserrat uppercase tracking-wider transition-all text-left whitespace-nowrap ${
                  activeTab === 'services' ? 'bg-[#C65D45] text-[#2B170F] font-bold font-medium shadow-md' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4" />
                  <span>Services</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 font-montserrat">
                  {services.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('about')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-montserrat uppercase tracking-wider transition-all text-left whitespace-nowrap ${
                  activeTab === 'about' ? 'bg-[#C65D45] text-[#2B170F] font-bold font-medium shadow-md' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>About & Bio</span>
              </button>

              <button
                onClick={() => setActiveTab('hero-bg')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-montserrat uppercase tracking-wider transition-all text-left whitespace-nowrap ${
                  activeTab === 'hero-bg' ? 'bg-[#C65D45] text-[#2B170F] font-bold font-medium shadow-md' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Film className="w-4 h-4" />
                  <span>Landing Video BG</span>
                </div>
                {settings?.hero_bg_video_url && settings?.hero_bg_video_enabled !== '0' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-montserrat uppercase tracking-wider transition-all text-left whitespace-nowrap ${
                  activeTab === 'settings' ? 'bg-[#C65D45] text-[#2B170F] font-bold font-medium shadow-md' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Site Settings</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#0c0c12]">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="font-pogonia text-3xl font-normal text-white mb-1">
                      Portfolio Performance & Operations
                    </h3>
                    <p className="text-xs text-white/50">
                      Live content stats stored directly in the local SQLite engine.
                    </p>
                  </div>

                  {/* Summary metric cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                      <span className="text-xs text-white/50 font-montserrat uppercase">9:16 Reels</span>
                      <div className="font-pogonia text-4xl text-white font-semibold mt-1">
                        {reels.length}
                      </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                      <span className="text-xs text-white/50 font-montserrat uppercase">16:9 Films</span>
                      <div className="font-pogonia text-4xl text-white font-semibold mt-1">
                        {horizontalVideos.length}
                      </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                      <span className="text-xs text-white/50 font-montserrat uppercase">Testimonials</span>
                      <div className="font-pogonia text-4xl text-white font-semibold mt-1">
                        {testimonials.length}
                      </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                      <span className="text-xs text-white/50 font-montserrat uppercase">Services</span>
                      <div className="font-pogonia text-4xl text-[#C65D45] font-semibold mt-1">
                        {services.length}
                      </div>
                    </div>
                  </div>

                  {/* Permanent Deployment Center Card */}
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1C120C] to-[#120B07] border border-[#C65D45]/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-[#C65D45] text-xs font-bold uppercase tracking-wider">
                          <Sparkles className="w-4 h-4" />
                          <span>1-Click Permanent Deployment Center</span>
                        </div>
                        <h4 className="font-pogonia text-xl text-white mt-1">
                          {isLocalhost ? '💻 Master Workstation (Localhost Mode)' : '☁️ Live Cloud Demo Mode'}
                        </h4>
                        <p className="text-xs text-white/60 mt-1 max-w-xl">
                          {isLocalhost
                            ? 'Every video, thumbnail, and title you add here is saved to your laptop hard drive. Click below to automatically commit and push to live Render with 1 click!'
                            : 'Uploads made directly here will reset when deploying. To keep new videos permanently, launch Run Portfolio Admin.bat on your laptop.'}
                        </p>
                      </div>

                      <button
                        onClick={handlePublishLive}
                        disabled={isPublishing}
                        className={`px-6 py-3.5 rounded-2xl text-xs font-montserrat uppercase font-bold tracking-wider transition-all duration-300 flex items-center gap-2.5 shadow-xl cursor-pointer shrink-0 ${
                          isPublishing
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-wait'
                            : 'bg-gradient-to-r from-[#C65D45] to-[#E2725B] hover:brightness-110 text-white shadow-[0_0_20px_rgba(198,93,69,0.4)] active:scale-95'
                        }`}
                      >
                        <UploadCloud className={`w-4 h-4 ${isPublishing ? 'animate-bounce' : ''}`} />
                        <span>{isPublishing ? 'Publishing Updates...' : '🚀 Push to Live Website'}</span>
                      </button>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-4 text-[11px] text-white/50">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Permanent Seed Tracking</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Automatic Git Commit</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Zero Data Loss on Render</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: REELS (9:16) */}
              {activeTab === 'reels' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-pogonia text-3xl font-normal text-white">
                        Manage 9:16 Vertical Reels
                      </h3>
                      <p className="text-xs text-white/50">
                        Add, replace video files, update metrics, or delete short-form content.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingReel({
                          title: '',
                          category: 'Instagram Reels',
                          client: '',
                          video_url: '',
                          thumbnail_url: '',
                          views_count: '1.2M Views',
                          duration: '0:30',
                          is_featured: 1,
                        });
                        setReelCandidateFrames([]);
                        setSelectedReelFrameId(null);
                      }}
                      className="px-4 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Upload New Reel</span>
                    </button>
                  </div>

                  {/* Reel Edit Modal Form */}
                  {editingReel && (
                    <div className="p-6 rounded-2xl bg-[#14141f] border border-[#C65D45]/50 shadow-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <h4 className="font-pogonia text-xl text-white">
                          {editingReel.id ? 'Edit Reel' : 'Add New Reel'}
                        </h4>
                        <button onClick={closeReelModal} className="text-white/50 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Title *
                          </label>
                          <input
                            type="text"
                            value={editingReel.title || ''}
                            onChange={(e) => setEditingReel({ ...editingReel, title: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                            placeholder="e.g. Kinetic Product Drop"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Category *
                          </label>
                          <select
                            value={editingReel.category || 'Instagram Reels'}
                            onChange={(e) => setEditingReel({ ...editingReel, category: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          >
                            <option value="Instagram Reels">Instagram Reels</option>
                            <option value="Social Media Ads">Social Media Ads</option>
                            <option value="Talking Head Edits">Talking Head Edits</option>
                            <option value="Product Reels">Product Reels</option>
                            <option value="Cinematic Social Content">Cinematic Social Content</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Views Count Metric
                          </label>
                          <input
                            type="text"
                            value={editingReel.views_count || ''}
                            onChange={(e) => setEditingReel({ ...editingReel, views_count: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                            placeholder="e.g. 2.4M Views"
                          />
                        </div>

                        {/* Video URL & File Upload */}
                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Video URL (YouTube link, Shorts, or MP4) *
                          </label>
                          <input
                            type="text"
                            value={editingReel.video_url || ''}
                            onChange={(e) => setEditingReel({ ...editingReel, video_url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white mb-2"
                            placeholder="https://youtube.com/watch?v=... or https://youtu.be/... or .mp4"
                          />
                          {isYouTubeUrl(editingReel.video_url) && (
                            <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-[#C65D45]/15 border border-[#C65D45]/30 text-xs text-[#C65D45]">
                              <CheckCircle className="w-4 h-4 shrink-0" />
                              <span>YouTube video detected! Thumbnail will auto-generate if left empty.</span>
                            </div>
                          )}
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15">
                            <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
                            <span>Upload Video File (MP4)</span>
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={handleReelVideoUpload}
                            />
                          </label>
                        </div>

                        {/* Thumbnail URL & File Upload */}
                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Poster Thumbnail URL (Optional — auto-generated from video/YouTube)
                          </label>
                          <input
                            type="text"
                            value={editingReel.thumbnail_url || ''}
                            onChange={(e) => setEditingReel({ ...editingReel, thumbnail_url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white mb-2"
                            placeholder="Leave empty for auto thumbnail, or paste image URL"
                          />
                          {isYouTubeUrl(editingReel.video_url) && !editingReel.thumbnail_url && (
                            <div className="flex items-center gap-2 mb-2">
                              <img
                                src={getYouTubeThumbnail(editingReel.video_url) || ''}
                                alt="Auto YouTube Thumbnail Preview"
                                className="w-16 h-10 object-cover rounded border border-white/20"
                              />
                              <span className="text-[11px] text-white/60">Auto-generated YouTube thumbnail</span>
                            </div>
                          )}
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15">
                            <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
                            <span>Upload Custom Thumbnail</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload(e, (url) => setEditingReel({ ...editingReel, thumbnail_url: url }))
                              }
                            />
                          </label>
                        </div>
                      </div>

                      {/* 5-Candidate Thumbnail Frame Selector for Reels */}
                      {editingReel.video_url && !isYouTubeUrl(editingReel.video_url) && (
                        <div className="p-4 rounded-xl bg-black/40 border border-[#C65D45]/30 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Camera className="w-4 h-4 text-[#C65D45]" />
                              <span className="text-xs font-montserrat uppercase font-semibold text-white tracking-wider">
                                Choose Thumbnail from 5 Video Frames (9:16)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={extractingReelFrames}
                                onClick={handleExtractFramesForCurrentReel}
                                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] text-white/80 flex items-center gap-1.5 border border-white/10 transition-colors"
                              >
                                <RefreshCw className={`w-3 h-3 ${extractingReelFrames ? 'animate-spin' : ''}`} />
                                <span>{reelCandidateFrames.length > 0 ? 'Re-extract 5 Frames' : 'Extract 5 Frames'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setReelFramePickerOpen(true)}
                                className="px-2.5 py-1 rounded bg-[#C65D45]/20 hover:bg-[#C65D45]/30 text-[11px] text-[#C65D45] flex items-center gap-1.5 border border-[#C65D45]/40 transition-colors"
                              >
                                <Film className="w-3 h-3" />
                                <span>Scrub Timeline</span>
                              </button>
                            </div>
                          </div>

                          {extractingReelFrames ? (
                            <div className="flex items-center justify-center py-6 gap-2 text-xs text-white/60">
                              <RefreshCw className="w-4 h-4 animate-spin text-[#C65D45]" />
                              <span>Extracting 5 candidate frames across the video...</span>
                            </div>
                          ) : reelCandidateFrames.length > 0 ? (
                            <>
                              <div className="grid grid-cols-5 gap-2.5">
                                {reelCandidateFrames.map((frame) => {
                                  const isSelected = selectedReelFrameId === frame.id;
                                  return (
                                    <button
                                      key={frame.id}
                                      type="button"
                                      onClick={() => handleSelectReelFrame(frame)}
                                      className={`group relative aspect-[9/16] rounded-lg overflow-hidden cursor-pointer border-2 transition-all text-left ${
                                        isSelected
                                          ? 'border-[#C65D45] shadow-lg shadow-[#C65D45]/20 ring-2 ring-[#C65D45]/50 scale-[1.03]'
                                          : 'border-white/10 hover:border-white/40 hover:scale-[1.01]'
                                      }`}
                                    >
                                      <img
                                        src={frame.dataUrl}
                                        alt={`Reel frame at ${frame.label}`}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between text-[10px]">
                                        <span className="font-mono text-white/90 bg-black/60 px-1 py-0.5 rounded text-[10px]">
                                          {frame.label}
                                        </span>
                                        {isSelected && (
                                          <span className="text-[#C65D45] font-semibold text-[9px] bg-black/80 px-1 py-0.5 rounded border border-[#C65D45]/40">
                                            Selected
                                          </span>
                                        )}
                                      </div>
                                      {isSelected && (
                                        <div className="absolute top-1.5 right-1.5 bg-[#C65D45] text-white rounded-full p-0.5 shadow-md">
                                          <CheckCircle className="w-3.5 h-3.5" />
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="text-[11px] text-white/50">
                                Select any frame above to set as the reel cover. Unzoomed, native 9:16 vertical proportion.
                              </p>
                            </>
                          ) : (
                            <p className="text-[11px] text-white/40 italic">
                              Click "Extract 5 Frames" above to automatically pull 5 scene snapshots from this video.
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                        <button
                          onClick={closeReelModal}
                          className="px-4 py-2 rounded-full text-xs text-white/70 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!editingReel.title || !editingReel.video_url) {
                              showNotice('Title and video URL are required', 'error');
                              return;
                            }
                            try {
                              if (editingReel.id) {
                                await api.updateReel(editingReel.id, editingReel);
                                showNotice('Reel updated successfully!');
                              } else {
                                await api.createReel(editingReel);
                                showNotice('New reel created successfully!');
                              }
                              closeReelModal();
                              loadAllAdminData();
                              onDataChanged();
                            } catch (err: any) {
                              showNotice(err.message || 'Error saving reel', 'error');
                            }
                          }}
                          className="px-5 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold"
                        >
                          Save Reel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reels Table */}
                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0e0e15]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 border-b border-white/10 text-white/50 uppercase font-montserrat">
                        <tr>
                          <th className="p-3">Preview</th>
                          <th className="p-3">Title</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Views</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {reels.map((r) => (
                          <tr key={r.id} className="hover:bg-white/[0.02]">
                            <td className="p-3">
                              <img
                                src={r.thumbnail_url || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=100&q=80'}
                                alt={r.title}
                                className="w-10 h-16 object-cover rounded-lg border border-white/10"
                              />
                            </td>
                            <td className="p-3 font-medium text-white max-w-[200px] truncate">{r.title}</td>
                            <td className="p-3 text-[#C65D45]">{r.category}</td>
                            <td className="p-3 text-white/50">{r.views_count}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingReel(r);
                                    setReelCandidateFrames([]);
                                    setSelectedReelFrameId(null);
                                  }}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white"
                                  title="Edit"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm(`Delete reel "${r.title}"?`)) {
                                      await api.deleteReel(r.id);
                                      showNotice('Reel deleted');
                                      loadAllAdminData();
                                      onDataChanged();
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: HORIZONTAL VIDEOS (16:9) */}
              {activeTab === 'horizontal' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-pogonia text-3xl font-normal text-white">
                        Manage 16:9 Horizontal Videos
                      </h3>
                      <p className="text-xs text-white/50">
                        Commercials, YouTube long-form, brand films, and documentary edits.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingHorizontal({
                          title: '',
                          category: 'Commercials',
                          client: '',
                          video_url: '',
                          thumbnail_url: '',
                          description: '',
                          duration: '02:30',
                          year: '2026',
                          is_featured: 1,
                        });
                        setHorizontalCandidateFrames([]);
                        setSelectedHorizontalFrameId(null);
                      }}
                      className="px-4 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Upload New Film</span>
                    </button>
                  </div>

                  {editingHorizontal && (
                    <div className="p-6 rounded-2xl bg-[#14141f] border border-[#C65D45]/50 shadow-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <h4 className="font-pogonia text-xl text-white">
                          {editingHorizontal.id ? 'Edit Horizontal Film' : 'Add New Horizontal Film'}
                        </h4>
                        <button onClick={closeHorizontalModal} className="text-white/50 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Title *
                          </label>
                          <input
                            type="text"
                            value={editingHorizontal.title || ''}
                            onChange={(e) => setEditingHorizontal({ ...editingHorizontal, title: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Category *
                          </label>
                          <select
                            value={editingHorizontal.category || 'Commercials'}
                            onChange={(e) => setEditingHorizontal({ ...editingHorizontal, category: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          >
                            <option value="Commercials">Commercials</option>
                            <option value="Brand films">Brand films</option>
                            <option value="YouTube videos">YouTube videos</option>
                            <option value="Corporate videos">Corporate videos</option>
                            <option value="Cinematic projects">Cinematic projects</option>
                            <option value="Long-form content">Long-form content</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                              Duration
                            </label>
                            <input
                              type="text"
                              value={editingHorizontal.duration || ''}
                              onChange={(e) => setEditingHorizontal({ ...editingHorizontal, duration: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                              placeholder="03:45"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                              Year
                            </label>
                            <input
                              type="text"
                              value={editingHorizontal.year || ''}
                              onChange={(e) => setEditingHorizontal({ ...editingHorizontal, year: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                              placeholder="2026"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Video URL (YouTube link or MP4) *
                          </label>
                          <input
                            type="text"
                            value={editingHorizontal.video_url || ''}
                            onChange={(e) => setEditingHorizontal({ ...editingHorizontal, video_url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white mb-2"
                            placeholder="https://youtube.com/watch?v=... or https://youtu.be/... or .mp4"
                          />
                          {isYouTubeUrl(editingHorizontal.video_url) && (
                            <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-[#C65D45]/15 border border-[#C65D45]/30 text-xs text-[#C65D45]">
                              <CheckCircle className="w-4 h-4 shrink-0" />
                              <span>YouTube video detected! Thumbnail will auto-generate if left empty.</span>
                            </div>
                          )}
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15">
                            <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
                            <span>Upload Video File</span>
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={handleHorizontalVideoUpload}
                            />
                          </label>
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Thumbnail URL (Optional — auto-generated from YouTube if empty)
                          </label>
                          <input
                            type="text"
                            value={editingHorizontal.thumbnail_url || ''}
                            onChange={(e) => setEditingHorizontal({ ...editingHorizontal, thumbnail_url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white mb-2"
                            placeholder="Leave empty for auto thumbnail, or paste image URL"
                          />
                          {isYouTubeUrl(editingHorizontal.video_url) && !editingHorizontal.thumbnail_url && (
                            <div className="flex items-center gap-2 mb-2">
                              <img
                                src={getYouTubeThumbnail(editingHorizontal.video_url) || ''}
                                alt="Auto YouTube Thumbnail Preview"
                                className="w-16 h-10 object-cover rounded border border-white/20"
                              />
                              <span className="text-[11px] text-white/60">Auto-generated YouTube thumbnail</span>
                            </div>
                          )}
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15">
                            <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
                            <span>Upload Thumbnail</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload(e, (url) =>
                                  setEditingHorizontal({ ...editingHorizontal, thumbnail_url: url })
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Editorial Description / Story Synopsis
                        </label>
                        <textarea
                          rows={2}
                          value={editingHorizontal.description || ''}
                          onChange={(e) => setEditingHorizontal({ ...editingHorizontal, description: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>

                      {/* 5-Candidate Thumbnail Frame Selector for Horizontal Videos */}
                      {editingHorizontal.video_url && !isYouTubeUrl(editingHorizontal.video_url) && (
                        <div className="p-4 rounded-xl bg-black/40 border border-[#C65D45]/30 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Camera className="w-4 h-4 text-[#C65D45]" />
                              <span className="text-xs font-montserrat uppercase font-semibold text-white tracking-wider">
                                Choose Thumbnail from 5 Video Frames (16:9)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={extractingHorizontalFrames}
                                onClick={handleExtractFramesForCurrentHorizontal}
                                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] text-white/80 flex items-center gap-1.5 border border-white/10 transition-colors"
                              >
                                <RefreshCw className={`w-3 h-3 ${extractingHorizontalFrames ? 'animate-spin' : ''}`} />
                                <span>{horizontalCandidateFrames.length > 0 ? 'Re-extract 5 Frames' : 'Extract 5 Frames'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setHorizontalFramePickerOpen(true)}
                                className="px-2.5 py-1 rounded bg-[#C65D45]/20 hover:bg-[#C65D45]/30 text-[11px] text-[#C65D45] flex items-center gap-1.5 border border-[#C65D45]/40 transition-colors"
                              >
                                <Film className="w-3 h-3" />
                                <span>Scrub Timeline</span>
                              </button>
                            </div>
                          </div>

                          {extractingHorizontalFrames ? (
                            <div className="flex items-center justify-center py-6 gap-2 text-xs text-white/60">
                              <RefreshCw className="w-4 h-4 animate-spin text-[#C65D45]" />
                              <span>Extracting 5 candidate frames across the video...</span>
                            </div>
                          ) : horizontalCandidateFrames.length > 0 ? (
                            <>
                              <div className="grid grid-cols-5 gap-2.5">
                                {horizontalCandidateFrames.map((frame) => {
                                  const isSelected = selectedHorizontalFrameId === frame.id;
                                  return (
                                    <button
                                      key={frame.id}
                                      type="button"
                                      onClick={() => handleSelectHorizontalFrame(frame)}
                                      className={`group relative aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all text-left ${
                                        isSelected
                                          ? 'border-[#C65D45] shadow-lg shadow-[#C65D45]/20 ring-2 ring-[#C65D45]/50 scale-[1.03]'
                                          : 'border-white/10 hover:border-white/40 hover:scale-[1.01]'
                                      }`}
                                    >
                                      <img
                                        src={frame.dataUrl}
                                        alt={`Film frame at ${frame.label}`}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-x-0 bottom-0 p-1 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between text-[10px]">
                                        <span className="font-mono text-white/90 bg-black/60 px-1 py-0.5 rounded text-[10px]">
                                          {frame.label}
                                        </span>
                                        {isSelected && (
                                          <span className="text-[#C65D45] font-semibold text-[9px] bg-black/80 px-1 py-0.5 rounded border border-[#C65D45]/40">
                                            Selected
                                          </span>
                                        )}
                                      </div>
                                      {isSelected && (
                                        <div className="absolute top-1.5 right-1.5 bg-[#C65D45] text-white rounded-full p-0.5 shadow-md">
                                          <CheckCircle className="w-3.5 h-3.5" />
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="text-[11px] text-white/50">
                                Select any frame above to set as the film cover. Unzoomed, native 16:9 widescreen proportion.
                              </p>
                            </>
                          ) : (
                            <p className="text-[11px] text-white/40 italic">
                              Click "Extract 5 Frames" above to automatically pull 5 scene snapshots from this video.
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                        <button
                          onClick={closeHorizontalModal}
                          className="px-4 py-2 rounded-full text-xs text-white/70 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!editingHorizontal.title || !editingHorizontal.video_url) {
                              showNotice('Title and video URL are required', 'error');
                              return;
                            }
                            try {
                              if (editingHorizontal.id) {
                                await api.updateHorizontalVideo(editingHorizontal.id, editingHorizontal);
                                showNotice('Horizontal film updated!');
                              } else {
                                await api.createHorizontalVideo(editingHorizontal);
                                showNotice('New horizontal film created!');
                              }
                              closeHorizontalModal();
                              loadAllAdminData();
                              onDataChanged();
                            } catch (err: any) {
                              showNotice(err.message || 'Error saving video', 'error');
                            }
                          }}
                          className="px-5 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold"
                        >
                          Save Film
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Horizontal Videos Table */}
                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0e0e15]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 border-b border-white/10 text-white/50 uppercase font-montserrat">
                        <tr>
                          <th className="p-3">Thumbnail</th>
                          <th className="p-3">Title</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Duration</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {horizontalVideos.map((v) => (
                          <tr key={v.id} className="hover:bg-white/[0.02]">
                            <td className="p-3">
                              <img
                                src={v.thumbnail_url || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=150&q=80'}
                                alt={v.title}
                                className="w-20 h-12 object-cover rounded-lg border border-white/10"
                              />
                            </td>
                            <td className="p-3 font-medium text-white">{v.title}</td>
                            <td className="p-3 text-[#C65D45]">{v.category}</td>
                            <td className="p-3 text-white/50">{v.duration}</td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingHorizontal(v);
                                    setHorizontalCandidateFrames([]);
                                    setSelectedHorizontalFrameId(null);
                                  }}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm(`Delete video "${v.title}"?`)) {
                                      await api.deleteHorizontalVideo(v.id);
                                      showNotice('Horizontal video deleted');
                                      loadAllAdminData();
                                      onDataChanged();
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: TESTIMONIALS (9:16) */}
              {activeTab === 'testimonials' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-pogonia text-3xl font-normal text-white">
                        Manage Client Video Testimonials
                      </h3>
                      <p className="text-xs text-white/50">
                        Upload 9:16 video feedback, edit quotes, names, and client titles.
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setEditingTestimonial({
                          client_name: '',
                          client_title: 'Marketing Director',
                          company: '',
                          avatar_url: '',
                          video_url: '',
                          thumbnail_url: '',
                          quote: '',
                          rating: 5,
                        })
                      }
                      className="px-4 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Testimonial</span>
                    </button>
                  </div>

                  {editingTestimonial && (
                    <div className="p-6 rounded-2xl bg-[#14141f] border border-[#C65D45]/50 shadow-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <h4 className="font-pogonia text-xl text-white">
                          {editingTestimonial.id ? 'Edit Testimonial' : 'Add New Client Video Testimonial'}
                        </h4>
                        <button onClick={() => setEditingTestimonial(null)} className="text-white/50 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Client Name *
                          </label>
                          <input
                            type="text"
                            value={editingTestimonial.client_name || ''}
                            onChange={(e) => setEditingTestimonial({ ...editingTestimonial, client_name: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Company / Brand *
                          </label>
                          <input
                            type="text"
                            value={editingTestimonial.company || ''}
                            onChange={(e) => setEditingTestimonial({ ...editingTestimonial, company: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Client Role / Title
                          </label>
                          <input
                            type="text"
                            value={editingTestimonial.client_title || ''}
                            onChange={(e) => setEditingTestimonial({ ...editingTestimonial, client_title: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Avatar Photo URL
                          </label>
                          <input
                            type="text"
                            value={editingTestimonial.avatar_url || ''}
                            onChange={(e) => setEditingTestimonial({ ...editingTestimonial, avatar_url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            9:16 Video URL *
                          </label>
                          <input
                            type="text"
                            value={editingTestimonial.video_url || ''}
                            onChange={(e) => setEditingTestimonial({ ...editingTestimonial, video_url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white mb-2"
                          />
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15">
                            <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
                            <span>Upload Testimonial Video</span>
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload(e, (url) =>
                                  setEditingTestimonial({ ...editingTestimonial, video_url: url })
                                )
                              }
                            />
                          </label>
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Thumbnail Poster URL
                          </label>
                          <input
                            type="text"
                            value={editingTestimonial.thumbnail_url || ''}
                            onChange={(e) => setEditingTestimonial({ ...editingTestimonial, thumbnail_url: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white mb-2"
                          />
                          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15">
                            <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
                            <span>Upload Thumbnail</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload(e, (url) =>
                                  setEditingTestimonial({ ...editingTestimonial, thumbnail_url: url })
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Written Review Quote
                        </label>
                        <textarea
                          rows={2}
                          value={editingTestimonial.quote || ''}
                          onChange={(e) => setEditingTestimonial({ ...editingTestimonial, quote: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                        <button
                          onClick={() => setEditingTestimonial(null)}
                          className="px-4 py-2 rounded-full text-xs text-white/70 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!editingTestimonial.client_name || !editingTestimonial.video_url) {
                              showNotice('Client name and video URL are required', 'error');
                              return;
                            }
                            try {
                              if (editingTestimonial.id) {
                                await api.updateTestimonial(editingTestimonial.id, editingTestimonial);
                                showNotice('Testimonial updated!');
                              } else {
                                await api.createTestimonial(editingTestimonial);
                                showNotice('New testimonial created!');
                              }
                              setEditingTestimonial(null);
                              loadAllAdminData();
                              onDataChanged();
                            } catch (err: any) {
                              showNotice(err.message || 'Error saving testimonial', 'error');
                            }
                          }}
                          className="px-5 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold"
                        >
                          Save Testimonial
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Testimonials List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {testimonials.map((t) => (
                      <div
                        key={t.id}
                        className="p-4 rounded-2xl bg-[#0e0e15] border border-white/10 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={t.thumbnail_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80'}
                            alt={t.client_name}
                            className="w-12 h-16 object-cover rounded-lg border border-white/10"
                          />
                          <div>
                            <div className="font-semibold text-white">{t.client_name}</div>
                            <div className="text-xs text-[#C65D45]">{t.company}</div>
                            <div className="text-[11px] text-white/50 line-clamp-1 italic mt-1">"{t.quote}"</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingTestimonial(t)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Delete testimonial from "${t.client_name}"?`)) {
                                await api.deleteTestimonial(t.id);
                                showNotice('Testimonial deleted');
                                loadAllAdminData();
                                onDataChanged();
                              }
                            }}
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: SERVICES */}
              {activeTab === 'services' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-pogonia text-3xl font-normal text-white">
                        Manage Offered Services
                      </h3>
                      <p className="text-xs text-white/50">
                        Edit service descriptions, turnaround times, and deliverables.
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        setEditingService({
                          title: '',
                          slug: '',
                          icon_name: 'Film',
                          short_description: '',
                          deliverables: '',
                          turnaround: '2-3 Days',
                        })
                      }
                      className="px-4 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Service</span>
                    </button>
                  </div>

                  {editingService && (
                    <div className="p-6 rounded-2xl bg-[#14141f] border border-[#C65D45]/50 shadow-2xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <h4 className="font-pogonia text-xl text-white">
                          {editingService.id ? 'Edit Service' : 'Add New Service'}
                        </h4>
                        <button onClick={() => setEditingService(null)} className="text-white/50 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Service Title *
                          </label>
                          <input
                            type="text"
                            value={editingService.title || ''}
                            onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Icon
                          </label>
                          <select
                            value={editingService.icon_name || 'Film'}
                            onChange={(e) => setEditingService({ ...editingService, icon_name: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          >
                            <option value="Smartphone">Smartphone (Reels)</option>
                            <option value="Youtube">Youtube</option>
                            <option value="Flame">Flame (Ads)</option>
                            <option value="Film">Film (Commercials)</option>
                            <option value="Package">Package (Product)</option>
                            <option value="Sparkles">Sparkles (Motion Graphics)</option>
                            <option value="Palette">Palette (Color Grading)</option>
                            <option value="Volume2">Volume2 (Sound Design)</option>
                            <option value="Briefcase">Briefcase (Corporate)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Typical Turnaround
                          </label>
                          <input
                            type="text"
                            value={editingService.turnaround || ''}
                            onChange={(e) => setEditingService({ ...editingService, turnaround: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                            placeholder="24-48 Hours"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Deliverables Summary
                          </label>
                          <input
                            type="text"
                            value={editingService.deliverables || ''}
                            onChange={(e) => setEditingService({ ...editingService, deliverables: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Short Description
                        </label>
                        <textarea
                          rows={2}
                          value={editingService.short_description || ''}
                          onChange={(e) => setEditingService({ ...editingService, short_description: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                        <button
                          onClick={() => setEditingService(null)}
                          className="px-4 py-2 rounded-full text-xs text-white/70 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            if (!editingService.title) return;
                            try {
                              if (editingService.id) {
                                await api.updateService(editingService.id, editingService);
                                showNotice('Service updated!');
                              } else {
                                await api.createService(editingService);
                                showNotice('New service created!');
                              }
                              setEditingService(null);
                              loadAllAdminData();
                              onDataChanged();
                            } catch (err: any) {
                              showNotice(err.message || 'Error saving service', 'error');
                            }
                          }}
                          className="px-5 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold"
                        >
                          Save Service
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((s) => (
                      <div
                        key={s.id}
                        className="p-4 rounded-2xl bg-[#0e0e15] border border-white/10 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="font-pogonia text-2xl text-white">{s.title}</div>
                          <div className="text-xs text-[#C65D45] font-montserrat mt-0.5">{s.turnaround}</div>
                          <div className="text-xs text-white/50 line-clamp-1 mt-1">{s.short_description}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingService(s)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Delete service "${s.title}"?`)) {
                                await api.deleteService(s.id);
                                showNotice('Service deleted');
                                loadAllAdminData();
                                onDataChanged();
                              }
                            }}
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: ABOUT */}
              {activeTab === 'about' && about && (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <h3 className="font-pogonia text-3xl font-normal text-white">
                      Edit About & Career Statement
                    </h3>
                    <p className="text-xs text-white/50">
                      Update your creative philosophy, stats counter, and portrait.
                    </p>
                  </div>

                  <div className="space-y-4 p-6 rounded-2xl bg-[#101018] border border-white/10">
                    <div>
                      <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                        Core Headline / Philosophy
                      </label>
                      <input
                        type="text"
                        value={about.headline || ''}
                        onChange={(e) => setAbout({ ...about, headline: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                        Professional Bio
                      </label>
                      <textarea
                        rows={3}
                        value={about.bio || ''}
                        onChange={(e) => setAbout({ ...about, bio: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                        Creative Philosophy
                      </label>
                      <textarea
                        rows={2}
                        value={about.philosophy || ''}
                        onChange={(e) => setAbout({ ...about, philosophy: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Years Exp
                        </label>
                        <input
                          type="text"
                          value={about.years_experience || ''}
                          onChange={(e) => setAbout({ ...about, years_experience: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Views Generated
                        </label>
                        <input
                          type="text"
                          value={about.views_generated || ''}
                          onChange={(e) => setAbout({ ...about, views_generated: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Projects
                        </label>
                        <input
                          type="text"
                          value={about.projects_delivered || ''}
                          onChange={(e) => setAbout({ ...about, projects_delivered: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Client Rate
                        </label>
                        <input
                          type="text"
                          value={about.client_satisfaction || ''}
                          onChange={(e) => setAbout({ ...about, client_satisfaction: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                        Portrait Image URL
                      </label>
                      <input
                        type="text"
                        value={about.avatar_url || ''}
                        onChange={(e) => setAbout({ ...about, avatar_url: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white mb-2"
                      />
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15">
                        <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
                        <span>Upload New Portrait Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleFileUpload(e, (url) => setAbout({ ...about, avatar_url: url }))
                          }
                        />
                      </label>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={async () => {
                          try {
                            await api.updateAbout(about);
                            showNotice('About details saved successfully!');
                            onDataChanged();
                          } catch (err: any) {
                            showNotice(err.message || 'Error saving about data', 'error');
                          }
                        }}
                        className="px-6 py-2.5 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold"
                      >
                        Save About Information
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7: LANDING PAGE BACKGROUND VIDEO STUDIO */}
              {activeTab === 'hero-bg' && (
                <div className="space-y-6 max-w-4xl">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-pogonia text-3xl font-normal text-white">
                          Landing Page Background Video
                        </h3>
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            settings.hero_bg_video_url && settings.hero_bg_video_enabled !== '0'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/10 text-white/50'
                          }`}
                        >
                          {settings.hero_bg_video_url && settings.hero_bg_video_enabled !== '0'
                            ? '● Active On Landing Page'
                            : '○ Standby / Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 mt-1">
                        Upload or link a video that loops seamlessly in the background across the entire landing page hero screen.
                      </p>
                    </div>

                    {settings.hero_bg_video_url && (
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={async () => {
                            const newEnabled = settings.hero_bg_video_enabled === '0' ? '1' : '0';
                            const updated = { ...settings, hero_bg_video_enabled: newEnabled };
                            setSettings(updated);
                            await api.updateSettings(updated);
                            showNotice(
                              newEnabled === '1'
                                ? 'Background video enabled on landing page!'
                                : 'Background video paused.'
                            );
                            onDataChanged();
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                            settings.hero_bg_video_enabled !== '0'
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                              : 'bg-white/5 border-white/15 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          {settings.hero_bg_video_enabled !== '0' ? '● Video Visible' : '○ Video Paused'}
                        </button>

                        <button
                          type="button"
                          onClick={handleRemoveHeroVideo}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 1. UPLOAD & SOURCE CARD */}
                  <div className="p-6 rounded-2xl bg-[#101018] border border-white/10 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-[#C65D45]" />
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                          1. Video File Source
                        </h4>
                      </div>
                      <span className="text-[11px] text-white/40">MP4, WebM, MOV · Max 100MB</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                      {/* Direct File Upload Drop Area */}
                      <label
                        className={`relative rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                          heroVideoUploading
                            ? 'border-white/20 bg-white/[0.02] opacity-60 pointer-events-none'
                            : 'border-[#C65D45]/40 hover:border-[#C65D45] bg-[#C65D45]/5 hover:bg-[#C65D45]/10'
                        }`}
                      >
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,video/*"
                          className="hidden"
                          disabled={heroVideoUploading}
                          onChange={handleHeroVideoUpload}
                        />
                        <div className="w-12 h-12 rounded-2xl bg-[#C65D45]/20 border border-[#C65D45]/40 flex items-center justify-center text-[#C65D45] mb-3">
                          {heroVideoUploading ? (
                            <RefreshCw className="w-6 h-6 animate-spin" />
                          ) : (
                            <Upload className="w-6 h-6" />
                          )}
                        </div>
                        <span className="text-sm font-bold text-white mb-1">
                          {heroVideoUploading ? 'Uploading Video to Server...' : 'Upload Video File'}
                        </span>
                        <p className="text-xs text-white/50 max-w-xs">
                          Click to browse and upload your showreel or cinematic background loop
                        </p>
                      </label>

                      {/* Direct URL Input */}
                      <div className="p-5 rounded-2xl bg-black/40 border border-white/5 flex flex-col justify-between space-y-3">
                        <div>
                          <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                            Or Paste Video URL
                          </label>
                          <input
                            type="text"
                            placeholder="https://.../video.mp4 or /uploads/..."
                            value={settings.hero_bg_video_url || ''}
                            onChange={(e) => {
                              setSettings({
                                ...settings,
                                hero_bg_video_url: e.target.value,
                                hero_bg_video_enabled: e.target.value ? '1' : '0',
                              });
                            }}
                            className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/15 text-sm text-white focus:border-[#C65D45] outline-none"
                          />
                          <p className="text-[11px] text-white/40 mt-1.5">
                            Direct MP4/WebM URL. Works with local uploads or external cloud video hosts.
                          </p>
                        </div>

                        {/* Quick Presets */}
                        <div>
                          <span className="block text-[10px] text-white/40 uppercase font-mono mb-1.5">
                            Quick Sample Loops:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSettings({
                                  ...settings,
                                  hero_bg_video_url:
                                    'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4',
                                  hero_bg_video_enabled: '1',
                                  hero_bg_video_overlay: 'warm',
                                });
                                showNotice('Sample Sunset Aerial loop loaded!');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/70 hover:text-white transition-all cursor-pointer"
                            >
                              Sunset Aerial
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSettings({
                                  ...settings,
                                  hero_bg_video_url:
                                    'https://assets.mixkit.co/videos/preview/mixkit-vertical-video-of-a-dj-controlling-the-mixer-board-43187-large.mp4',
                                  hero_bg_video_enabled: '1',
                                  hero_bg_video_overlay: 'dark',
                                });
                                showNotice('Sample Kinetic Studio loop loaded!');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/70 hover:text-white transition-all cursor-pointer"
                            >
                              Kinetic Studio
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. CINEMATIC OVERLAY & CONTRAST TUNING */}
                  <div className="p-6 rounded-2xl bg-[#101018] border border-white/10 space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#ffba3b]" />
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                          2. Visual Overlay & Readability Controls
                        </h4>
                      </div>
                      <span className="text-[11px] text-white/40">Keep headline & avatar crystal clear</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Control A: Overlay Style */}
                      <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                        <label className="block text-xs font-montserrat uppercase font-bold text-white">
                          Overlay Tint Style
                        </label>
                        <select
                          value={settings.hero_bg_video_overlay || 'warm'}
                          onChange={(e) => setSettings({ ...settings, hero_bg_video_overlay: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-lg bg-[#181822] border border-white/15 text-xs text-white cursor-pointer focus:border-[#C65D45] outline-none"
                        >
                          <option value="warm">🍂 Warm Editorial (Matches Portfolio)</option>
                          <option value="dark">🎬 Cinematic Dark (Film Noir Mode)</option>
                          <option value="none">⚡ Pure / No Tint (Raw Video)</option>
                        </select>
                        <p className="text-[10px] text-white/40">
                          Warm preserves paper aesthetic; Dark gives high cinematic contrast.
                        </p>
                      </div>

                      {/* Control B: Video Opacity */}
                      <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-montserrat uppercase font-bold text-white">
                            Video Opacity
                          </label>
                          <span className="text-xs font-mono text-[#C65D45]">
                            {settings.hero_bg_video_opacity ?? '75'}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          step="5"
                          value={settings.hero_bg_video_opacity ?? '75'}
                          onChange={(e) => setSettings({ ...settings, hero_bg_video_opacity: e.target.value })}
                          className="w-full accent-[#C65D45] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-white/30 font-mono">
                          <span>Subtle (20%)</span>
                          <span>Full (100%)</span>
                        </div>
                      </div>

                      {/* Control C: Overlay Tint Strength */}
                      <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-montserrat uppercase font-bold text-white">
                            Overlay Tint Strength
                          </label>
                          <span className="text-xs font-mono text-[#C65D45]">
                            {settings.hero_bg_video_overlay_opacity ?? '65'}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={settings.hero_bg_video_overlay_opacity ?? '65'}
                          onChange={(e) =>
                            setSettings({ ...settings, hero_bg_video_overlay_opacity: e.target.value })
                          }
                          className="w-full accent-[#C65D45] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-white/30 font-mono">
                          <span>Clear (0%)</span>
                          <span>Solid (100%)</span>
                        </div>
                      </div>

                      {/* Control D: Video Blur */}
                      <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-montserrat uppercase font-bold text-white">
                            Cinematic Blur
                          </label>
                          <span className="text-xs font-mono text-[#C65D45]">
                            {settings.hero_bg_video_blur ?? '0'}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="1"
                          value={settings.hero_bg_video_blur ?? '0'}
                          onChange={(e) => setSettings({ ...settings, hero_bg_video_blur: e.target.value })}
                          className="w-full accent-[#C65D45] cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-white/30 font-mono">
                          <span>Crisp (0px)</span>
                          <span>Ambient (10px)</span>
                        </div>
                      </div>
                    </div>

                    {/* Headline Text Tone Switch */}
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Headline & Text Theme Color
                        </span>
                        <span className="text-[11px] text-white/50">
                          Choose whether headline & subtitle use dark charcoal or light white contrast
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, hero_text_theme: 'dark' })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                            settings.hero_text_theme === 'dark' ||
                            (!settings.hero_text_theme && settings.hero_bg_video_overlay !== 'dark')
                              ? 'bg-[#2B170F] border-[#C65D45] text-white font-bold shadow-md'
                              : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          Dark Charcoal (Default)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, hero_text_theme: 'light' })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                            settings.hero_text_theme === 'light' ||
                            (!settings.hero_text_theme && settings.hero_bg_video_overlay === 'dark')
                              ? 'bg-white border-[#C65D45] text-[#2B170F] font-bold shadow-md'
                              : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                          }`}
                        >
                          Luminous White (For Dark Videos)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. LIVE INTERACTIVE HERO PREVIEW */}
                  <div className="p-6 rounded-2xl bg-[#101018] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                          3. Real-Time Landing Page Mockup Preview
                        </h4>
                      </div>
                      <span className="text-[11px] text-white/40">
                        Exact live rendering with your video & overlays
                      </span>
                    </div>

                    {/* Miniature Scaled Hero Preview Container */}
                    <div
                      className={`relative w-full rounded-2xl overflow-hidden border border-white/15 p-6 sm:p-8 min-h-[360px] flex items-center transition-colors duration-500 ${
                        settings.hero_text_theme === 'light' ||
                        (settings.hero_bg_video_overlay === 'dark' && settings.hero_text_theme !== 'dark')
                          ? 'bg-[#0E0907]'
                          : 'bg-[#F8F1E7]'
                      }`}
                    >
                      {/* Preview Background Video */}
                      {settings.hero_bg_video_url && settings.hero_bg_video_enabled !== '0' ? (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                          <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            key={settings.hero_bg_video_url}
                            className="w-full h-full object-cover transition-opacity duration-300"
                            style={{
                              opacity: (Number(settings.hero_bg_video_opacity ?? '75')) / 100,
                              filter:
                                Number(settings.hero_bg_video_blur ?? '0') > 0
                                  ? `blur(${settings.hero_bg_video_blur}px)`
                                  : undefined,
                              transform:
                                Number(settings.hero_bg_video_blur ?? '0') > 0
                                  ? 'scale(1.05)'
                                  : undefined,
                            }}
                            src={settings.hero_bg_video_url}
                          />

                          {/* Preview Overlay */}
                          {settings.hero_bg_video_overlay === 'dark' ? (
                            <div
                              className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/80 to-black/60 pointer-events-none"
                              style={{
                                opacity: (Number(settings.hero_bg_video_overlay_opacity ?? '65')) / 100,
                              }}
                            />
                          ) : settings.hero_bg_video_overlay === 'none' ? null : (
                            <div
                              className="absolute inset-0 bg-gradient-to-r from-[#F8F1E7]/95 via-[#F8F1E7]/80 to-[#F8F1E7]/60 pointer-events-none"
                              style={{
                                opacity: (Number(settings.hero_bg_video_overlay_opacity ?? '65')) / 100,
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-xs uppercase font-mono tracking-widest text-black/30 font-bold">
                            Standard Editorial Paper Background (No Video Active)
                          </span>
                        </div>
                      )}

                      {/* Foreground Preview Content */}
                      <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="max-w-md space-y-3">
                          <div className="inline-block px-3 py-1 rounded border border-[#C65D45] bg-[#FFF9F2] text-[#2B170F] text-[10px] font-bold uppercase tracking-wider">
                            Hello There!
                          </div>

                          <div
                            className={`font-pogonia text-2xl sm:text-3xl font-bold leading-tight ${
                              settings.hero_text_theme === 'light' ||
                              (settings.hero_bg_video_overlay === 'dark' &&
                                settings.hero_text_theme !== 'dark')
                                ? 'text-[#FFF9F2]'
                                : 'text-[#2B170F]'
                            }`}
                          >
                            I'm <span className="text-[#C65D45] underline">Afsar Ahmad,</span>
                            <br />
                            Video Editor Based in Mumbai.
                          </div>

                          <p
                            className={`text-xs line-clamp-2 leading-relaxed ${
                              settings.hero_text_theme === 'light' ||
                              (settings.hero_bg_video_overlay === 'dark' &&
                                settings.hero_text_theme !== 'dark')
                                ? 'text-white/80'
                                : 'text-[#756A62]'
                            }`}
                          >
                            Creative Video Editor specializing in high-retention short-form reels,
                            cinematic commercial brand films, and engaging long-form YouTube content.
                          </p>

                          <div className="flex items-center gap-2 pt-1">
                            <span className="px-4 py-2 rounded-full text-[11px] font-bold uppercase text-white bg-gradient-to-r from-[#C65D45] to-[#E2725B] shadow-md">
                              Explore Portfolio
                            </span>
                            <span className="px-4 py-2 rounded-full text-[11px] font-bold uppercase text-white bg-[#140A06] border border-white/20">
                              Hire Me
                            </span>
                          </div>
                        </div>

                        {/* Character preview circle */}
                        <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-[#C65D45] to-[#ffba3b] p-1 shadow-2xl shrink-0 overflow-hidden relative">
                          <img
                            src="/images/hero-character.png"
                            alt="Character"
                            className="w-full h-full object-contain filter drop-shadow"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. SAVE BUTTON */}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-white/50">
                      Changes publish instantly to your live landing page upon clicking save.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await api.updateSettings(settings);
                          showNotice('Landing page background video settings saved and published!');
                          onDataChanged();
                        } catch (err: any) {
                          showNotice(err.message || 'Error saving settings', 'error');
                        }
                      }}
                      className="px-6 py-2.5 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] hover:bg-[#D76E56] font-semibold transition-all shadow-lg hover:shadow-xl cursor-pointer"
                    >
                      Save Landing Video Settings
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 8: SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-3xl">
                  <div>
                    <h3 className="font-pogonia text-3xl font-normal text-white">
                      Studio Settings & Social Links
                    </h3>
                    <p className="text-xs text-white/50">
                      Update contact channels, hero headline, showreel video URL, and availability.
                    </p>
                  </div>

                  {/* ── PROFILE PICTURE ────────────────────────────────── */}
                  <div className="p-6 rounded-2xl bg-[#101018] border border-white/10 space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Profile Picture</h4>
                      <p className="text-xs text-white/40 mt-0.5">Shown as your avatar in the navbar. Replaces the "A" letter.</p>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Preview circle */}
                      <div className="w-20 h-20 rounded-full bg-[#C65D45] flex items-center justify-center shrink-0 overflow-hidden shadow-lg border-2 border-white/10">
                        {(profilePicPreview || settings.profile_picture_url) ? (
                          <img
                            src={profilePicPreview || settings.profile_picture_url}
                            alt="Profile Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-pogonia text-3xl font-bold text-[#2B170F]">A</span>
                        )}
                      </div>

                      {/* Upload & Remove */}
                      <div className="space-y-2 flex-1">
                        <label
                          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all text-sm font-medium
                            ${profilePicUploading
                              ? 'bg-white/5 border-white/10 text-white/30 pointer-events-none'
                              : 'bg-[#C65D45]/15 border-[#C65D45]/40 text-[#C65D45] hover:bg-[#C65D45]/25'
                            }`}
                        >
                          <Upload className="w-4 h-4" />
                          {profilePicUploading ? 'Uploading...' : 'Upload Photo'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={profilePicUploading}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleProfilePicUpload(file);
                              e.target.value = '';
                            }}
                          />
                        </label>

                        {(profilePicPreview || settings.profile_picture_url) && (
                          <div>
                            <button
                              onClick={handleRemoveProfilePic}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove Picture
                            </button>
                          </div>
                        )}

                        <p className="text-[11px] text-white/30">JPG, PNG, WebP · Max 5MB · Square crop recommended</p>
                      </div>
                    </div>
                  </div>
                  {/* ─────────────────────────────────────────────────────── */}

                  {/* ── LANDING PAGE BACKGROUND VIDEO SHORTCUT CARD ── */}
                  <div className="p-6 rounded-2xl bg-[#101018] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-[#C65D45]/15 border border-[#C65D45]/30 flex items-center justify-center text-[#C65D45] shrink-0">
                        <Film className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                            Landing Page Background Video
                          </h4>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              settings.hero_bg_video_url && settings.hero_bg_video_enabled !== '0'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-white/10 text-white/50'
                            }`}
                          >
                            {settings.hero_bg_video_url && settings.hero_bg_video_enabled !== '0'
                              ? 'Active'
                              : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">
                          Upload showreel videos, calibrate cinematic dark/warm tints, and preview live.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab('hero-bg')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider bg-[#C65D45]/20 hover:bg-[#C65D45] text-[#C65D45] hover:text-white border border-[#C65D45]/40 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
                    >
                      Open Video BG Studio →
                    </button>
                  </div>
                  {/* ─────────────────────────────────────────────────────── */}

                  {/* ── CHANGE ADMIN PASSWORD ─────────────────────────── */}
                  <form onSubmit={handleChangePassword} className="p-6 rounded-2xl bg-[#101018] border border-white/10 space-y-4">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#C65D45]" />
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Change Admin Password</h4>
                    </div>
                    <p className="text-xs text-white/50">
                      Update the password you use to log into this admin dashboard.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          placeholder="Current password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white focus:border-[#C65D45] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          placeholder="At least 6 characters"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white focus:border-[#C65D45] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          placeholder="Re-enter new password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white focus:border-[#C65D45] outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={passwordLoading}
                        className="px-5 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] hover:bg-[#D76E56] font-semibold disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{passwordLoading ? 'Updating Password...' : 'Update Password'}</span>
                      </button>
                    </div>
                  </form>
                  {/* ─────────────────────────────────────────────────────── */}

                  {/* ─── COMPREHENSIVE TYPOGRAPHY & FONT STUDIO ─────────── */}
                  <div className="space-y-6 p-6 sm:p-7 rounded-2xl bg-[#101018] border border-white/10">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#C65D45]/15 border border-[#C65D45]/30 flex items-center justify-center text-[#C65D45] shrink-0">
                          <Type className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">
                              Typography & Font Studio
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C65D45]/20 text-[#C65D45] font-semibold uppercase tracking-wider">
                              Granular Controls
                            </span>
                          </div>
                          <p className="text-xs text-white/50 mt-0.5">
                            Set global fonts or override specific titles, buttons, CTA, badges, navigation, and body text.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...settings,
                              heading_font: 'Pogonia',
                              heading_font_weight: '700',
                              body_font: 'Montserrat',
                              body_font_weight: '400',
                              hero_title_font: '',
                              hero_title_font_weight: '',
                              section_title_font: '',
                              section_title_font_weight: '',
                              cta_font: '',
                              cta_font_weight: '',
                              badge_font: '',
                              badge_font_weight: '',
                              nav_font: '',
                              nav_font_weight: '',
                            };
                            setSettings(updated);
                            applyDynamicFonts(updated);
                            showNotice('Reset all fonts and weights to default (Pogonia Bold & Montserrat Regular)');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/70 hover:text-[#C65D45] transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reset All to Defaults</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Broadcast Toolbar */}
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-white/70">
                        <Sparkles className="w-4 h-4 text-[#C65D45]" />
                        <span className="font-semibold text-white">Quick Actions:</span>
                        <span className="text-white/40 hidden sm:inline">Apply unified font style across all elements</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const font = settings.heading_font || 'Pogonia';
                            const weight = settings.heading_font_weight || '700';
                            const updated = {
                              ...settings,
                              body_font: font,
                              body_font_weight: weight,
                              hero_title_font: font,
                              hero_title_font_weight: weight,
                              section_title_font: font,
                              section_title_font_weight: weight,
                              cta_font: font,
                              cta_font_weight: weight,
                              badge_font: font,
                              badge_font_weight: weight,
                              nav_font: font,
                              nav_font_weight: weight,
                            };
                            setSettings(updated);
                            applyDynamicFonts(updated);
                            showNotice(`Applied "${font} (${weight})" to EVERY element on website!`);
                          }}
                          className="px-3 py-1 rounded-lg bg-white/5 hover:bg-[#C65D45]/20 hover:border-[#C65D45]/40 border border-white/10 text-[11px] text-white/80 hover:text-white transition-all cursor-pointer"
                        >
                          Apply Heading Font Everywhere
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const font = settings.body_font || 'Montserrat';
                            const weight = settings.body_font_weight || '400';
                            const updated = {
                              ...settings,
                              heading_font: font,
                              heading_font_weight: weight,
                              hero_title_font: font,
                              hero_title_font_weight: weight,
                              section_title_font: font,
                              section_title_font_weight: weight,
                              cta_font: font,
                              cta_font_weight: weight,
                              badge_font: font,
                              badge_font_weight: weight,
                              nav_font: font,
                              nav_font_weight: weight,
                            };
                            setSettings(updated);
                            applyDynamicFonts(updated);
                            showNotice(`Applied "${font} (${weight})" to EVERY element on website!`);
                          }}
                          className="px-3 py-1 rounded-lg bg-white/5 hover:bg-[#C65D45]/20 hover:border-[#C65D45]/40 border border-white/10 text-[11px] text-white/80 hover:text-white transition-all cursor-pointer"
                        >
                          Apply Body Font Everywhere
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...settings,
                              hero_title_font: '',
                              hero_title_font_weight: '',
                              section_title_font: '',
                              section_title_font_weight: '',
                              cta_font: '',
                              cta_font_weight: '',
                              badge_font: '',
                              badge_font_weight: '',
                              nav_font: '',
                              nav_font_weight: '',
                            };
                            setSettings(updated);
                            applyDynamicFonts(updated);
                            showNotice('Cleared all specific overrides. All elements now inherit global fonts & weights.');
                          }}
                          className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-white/50 hover:text-white transition-all cursor-pointer"
                        >
                          Clear Specific Overrides
                        </button>
                      </div>
                    </div>

                    {/* SECTION 1: GLOBAL BASE FONTS */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#C65D45]" />
                        <h5 className="text-xs font-montserrat uppercase font-bold tracking-wider text-white">
                          Part 1: Global Base Fonts & Weights (Defaults)
                        </h5>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Global Headings */}
                        <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Heading className="w-4 h-4 text-[#C65D45]" />
                              <div>
                                <span className="text-xs font-montserrat uppercase font-bold text-white block">
                                  Global Headings Font
                                </span>
                                <span className="text-[10px] text-white/40 block">Default for all H1, H2, H3</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-[#C65D45] font-mono px-2 py-0.5 rounded bg-[#C65D45]/10 border border-[#C65D45]/20">
                                {settings.heading_font || 'Pogonia'}
                              </span>
                              <span className="text-[10px] text-white/70 font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                                {settings.heading_font_weight || '700'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] text-white/50 mb-1 font-mono uppercase">Font Family:</label>
                              <select
                                value={settings.heading_font || 'Pogonia'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = { ...settings, heading_font: val };
                                  setSettings(updated);
                                  applyDynamicFonts(updated);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#181822] border border-white/15 text-xs text-white cursor-pointer focus:border-[#C65D45] outline-none"
                              >
                                {FONT_FAMILIES.map((cat) => (
                                  <optgroup key={cat.family} label={`── ${cat.family} ──`}>
                                    {cat.fonts.map((f) => (
                                      <option key={f.name} value={f.name}>
                                        {f.label}
                                      </option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-white/50 mb-1 font-mono uppercase">Font Weight:</label>
                              <select
                                value={settings.heading_font_weight || '700'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = { ...settings, heading_font_weight: val };
                                  setSettings(updated);
                                  applyDynamicFonts(updated);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#181822] border border-white/15 text-xs text-white cursor-pointer focus:border-[#C65D45] outline-none"
                              >
                                {FONT_WEIGHT_OPTIONS.map((w) => (
                                  <option key={w.value} value={w.value}>
                                    {w.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-white/50 mb-1 font-mono uppercase">Or Custom Font:</label>
                              <input
                                type="text"
                                value={settings.heading_font || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = { ...settings, heading_font: val };
                                  setSettings(updated);
                                  applyDynamicFonts(updated);
                                }}
                                placeholder="e.g. Syne, Cinzel..."
                                className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-white/15 text-xs text-white focus:border-[#C65D45] outline-none"
                              />
                            </div>
                          </div>

                          <div
                            className="pt-2 border-t border-white/5 text-lg text-white truncate"
                            style={{
                              fontFamily: `'${settings.heading_font || 'Pogonia'}', 'Pogonia', serif`,
                              fontWeight: Number(settings.heading_font_weight) || 700,
                            }}
                          >
                            Cinematic Storytelling & Visual Pace
                          </div>
                        </div>

                        {/* 2. Global Body */}
                        <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Type className="w-4 h-4 text-[#C65D45]" />
                              <div>
                                <span className="text-xs font-montserrat uppercase font-bold text-white block">
                                  Global Body & Text Font
                                </span>
                                <span className="text-[10px] text-white/40 block">Default for paragraphs & descriptions</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-[#C65D45] font-mono px-2 py-0.5 rounded bg-[#C65D45]/10 border border-[#C65D45]/20">
                                {settings.body_font || 'Montserrat'}
                              </span>
                              <span className="text-[10px] text-white/70 font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                                {settings.body_font_weight || '400'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] text-white/50 mb-1 font-mono uppercase">Font Family:</label>
                              <select
                                value={settings.body_font || 'Montserrat'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = { ...settings, body_font: val };
                                  setSettings(updated);
                                  applyDynamicFonts(updated);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#181822] border border-white/15 text-xs text-white cursor-pointer focus:border-[#C65D45] outline-none"
                              >
                                {FONT_FAMILIES.map((cat) => (
                                  <optgroup key={cat.family} label={`── ${cat.family} ──`}>
                                    {cat.fonts.map((f) => (
                                      <option key={f.name} value={f.name}>
                                        {f.label}
                                      </option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-white/50 mb-1 font-mono uppercase">Font Weight:</label>
                              <select
                                value={settings.body_font_weight || '400'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = { ...settings, body_font_weight: val };
                                  setSettings(updated);
                                  applyDynamicFonts(updated);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#181822] border border-white/15 text-xs text-white cursor-pointer focus:border-[#C65D45] outline-none"
                              >
                                {FONT_WEIGHT_OPTIONS.map((w) => (
                                  <option key={w.value} value={w.value}>
                                    {w.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-white/50 mb-1 font-mono uppercase">Or Custom Font:</label>
                              <input
                                type="text"
                                value={settings.body_font || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const updated = { ...settings, body_font: val };
                                  setSettings(updated);
                                  applyDynamicFonts(updated);
                                }}
                                placeholder="e.g. Inter, Poppins..."
                                className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-white/15 text-xs text-white focus:border-[#C65D45] outline-none"
                              />
                            </div>
                          </div>

                          <div
                            className="pt-2 border-t border-white/5 text-xs text-white/70 line-clamp-1"
                            style={{
                              fontFamily: `'${settings.body_font || 'Montserrat'}', 'Montserrat', sans-serif`,
                              fontWeight: Number(settings.body_font_weight) || 400,
                            }}
                          >
                            Pacing, rhythm, and color science that elevate raw footage into a compelling narrative world.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: SPECIFIC ELEMENT TARGETS */}
                    <div className="space-y-3 pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#ffba3b]" />
                          <h5 className="text-xs font-montserrat uppercase font-bold tracking-wider text-white">
                            Part 2: Specific Element Overrides (Fonts & Weights)
                          </h5>
                        </div>
                        <span className="text-[11px] text-white/40">
                          Leave on "Inherit" to use global default
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* 🎯 Target 1: Hero Main Headline */}
                        <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5 text-[#ffba3b]" />
                              <div>
                                <span className="text-xs font-montserrat uppercase font-bold text-white block">
                                  Hero Main Headline
                                </span>
                                <span className="text-[10px] text-white/40 block">Big headline in top banner</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-white/60 font-mono px-1.5 py-0.5 rounded bg-white/5">
                                {settings.hero_title_font || 'Inherit'}
                              </span>
                              {settings.hero_title_font_weight && (
                                <span className="text-[10px] text-[#ffba3b] font-mono px-1.5 py-0.5 rounded bg-white/5">
                                  {settings.hero_title_font_weight}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-white/50 mb-1 font-mono uppercase">Font Family:</label>
                              <select
                                value={settings.hero_title_font || 'inherit'}
                                onChange={(e) => {
                                  const val = e.target.value === 'inherit' ? '' : e.target.value;
                                  const updated = { ...settings, hero_title_font: val };
                                  setSettings(updated);
                                  applyDynamicFonts(updated);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#181822] border border-white/15 text-xs text-white cursor-pointer focus:border-[#C65D45] outline-none"
                              >
                                <option value="inherit">↳ Inherit ({settings.heading_font || 'Pogonia'})</option>
                                {FONT_FAMILIES.map((cat) => (
                                  <optgroup key={cat.family} label={`── ${cat.family} ──`}>
                                    {cat.fonts.map((f) => (
                                      <option key={f.name} value={f.name}>{f.name}</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-white/50 mb-1 font-mono uppercase">Font Weight:</label>
                              <select
                                value={settings.hero_title_font_weight || 'inherit'}
                                onChange={(e) => {
                                  const val = e.target.value === 'inherit' ? '' : e.target.value;
                                  const updated = { ...settings, hero_title_font_weight: val };
                                  setSettings(updated);
                                  applyDynamicFonts(updated);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#181822] border border-white/15 text-xs text-white cursor-pointer focus:border-[#C65D45] outline-none"
                              >
                                <option value="inherit">↳ Inherit ({settings.heading_font_weight || '700'})</option>
                                {FONT_WEIGHT_OPTIONS.map((w) => (
                                  <option key={w.value} value={w.value}>{w.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <input
                            type="text"
                            value={settings.hero_title_font || ''}
                            onChange={(e) => {
                              const updated = { ...settings, hero_title_font: e.target.value };
                              setSettings(updated);
                              applyDynamicFonts(updated);
                            }}
                            placeholder="Or type custom font..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-white/15 text-xs text-white focus:border-[#C65D45] outline-none"
                          />

                          <div
                            className="text-base text-white truncate"
                            style={{
                              fontFamily: `'${settings.hero_title_font || settings.heading_font || 'Pogonia'}', serif`,
                              fontWeight: Number(settings.hero_title_font_weight || settings.heading_font_weight) || 700,
                            }}
                          >
                            I'm Afsar Ahmad, Video Editor.
                          </div>
                        </div>

                        {/* 🎯 Target 2: Section Titles */}
                        <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Heading className="w-3.5 h-3.5 text-[#ffba3b]" />
                              <div>
                                <span className="text-xs font-montserrat uppercase font-bold text-white block">
                                  Section Titles
                                </span>
                                <span className="text-[10px] text-white/40 block">H2 headings across all sections</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-white/60 font-mono px-1.5 py-0.5 rounded bg-white/5">
                                {settings.section_title_font || 'Inherit'}
                              </span>
                              {settings.section_title_font_weight && (
                                <span className="text-[10px] text-[#ffba3b] font-mono px-1.5 py-0.5 rounded bg-white/5">
                                  {settings.section_title_font_weight}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-white/50 mb-1 font-mono uppercase">Font Family:</label>
                              <select
                                value={settings.section_title_font || 'inherit'}
                                onChange={(e) => {
                                  const val = e.target.value === 'inherit' ? '' : e.target.value;
                                  const updated = { ...settings, section_title_font: val };
                                  setSettings(updated);
                                  applyDynamicFonts(updated);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#181822] border border-white/15 text-xs text-white cursor-pointer focus:border-[#C65D45] outline-none"
                              >
                                <option value="inherit">↳ Inherit ({settings.heading_font || 'Pogonia'})</option>
                                {FONT_FAMILIES.map((cat) => (
                                  <optgroup key={cat.family} label={`── ${cat.family} ──`}>
                                    {cat.fonts.map((f) => (
                                      <option key={f.name} value={f.name}>{f.name}</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-white/50 mb-1 font-mono uppercase">Font Weight:</label>
                              <select
                                value={settings.section_title_font_weight || 'inherit'}
                                onChange={(e) => {
                                  const val = e.target.value === 'inherit' ? '' : e.target.value;
                                  const updated = { ...settings, section_title_font_weight: val };
                                  setSettings(updated);
                                  applyDynamicFonts(updated);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#181822] border border-white/15 text-xs text-white cursor-pointer focus:border-[#C65D45] outline-none"
                              >
                                <option value="inherit">↳ Inherit ({settings.heading_font_weight || '700'})</option>
                                {FONT_WEIGHT_OPTIONS.map((w) => (
                                  <option key={w.value} value={w.value}>{w.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <input
                            type="text"
                            value={settings.section_title_font || ''}
                            onChange={(e) => {
                              const updated = { ...settings, section_title_font: e.target.value };
                              setSettings(updated);
                              applyDynamicFonts(updated);
                            }}
                            placeholder="Or type custom font..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-white/15 text-xs text-white focus:border-[#C65D45] outline-none"
                          />

                          <div
                            className="text-base text-white truncate"
                            style={{
                              fontFamily: `'${settings.section_title_font || settings.heading_font || 'Pogonia'}', serif`,
                              fontWeight: Number(settings.section_title_font_weight || settings.heading_font_weight) || 700,
                            }}
                          >
                            Master Showreel • Services
                          </div>
                        </div>

                        {/* 🎯 Target 3: CTAs & Buttons */}
                        <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MousePointerClick className="w-3.5 h-3.5 text-[#ffba3b]" />
                              <div>
                                <span className="text-xs font-montserrat uppercase font-bold text-white block">
                                  Buttons & CTAs
                                </span>
                                <span className="text-[10px] text-white/40 block">Explore, Hire Me, WhatsApp, etc.</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-white/60 font-mono px-1.5 py-0.5 rounded bg-white/5">
                                {settings.cta_font || 'Inherit'}
                              </span>
                              {settings.cta_font_weight && (
                                <span className="text-[10px] text-[#ffba3b] font-mono px-1.5 py-0.5 rounded bg-white/5">
                                  {settings.cta_font_weight}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-white/50 mb-1 font-mono uppercase">Font Family:</label>
                              <select
                                value={settings.cta_font || 'inherit'}
                                onChange={(e) => {
                                  const val = e.target.value === 'inherit' ? '' : e.target.value;
                                  const updated = { ...settings, cta_font: val };
                                  setSettings(updated);
                                  applyDynamicFonts(updated);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#181822] border border-white/15 text-xs text-white cursor-pointer focus:border-[#C65D45] outline-none"
                              >
                                <option value="inherit">↳ Inherit ({settings.body_font || 'Montserrat'})</option>
                                {FONT_FAMILIES.map((cat) => (
                                  <optgroup key={cat.family} label={`── ${cat.family} ──`}>
                                    {cat.fonts.map((f) => (
                                      <option key={f.name} value={f.name}>{f.name}</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-white/50 mb-1 font-mono uppercase">Font Weight:</label>
                              <select
                                value={settings.cta_font_weight || 'inherit'}
                                onChange={(e) => {
                                  const val = e.target.value === 'inherit' ? '' : e.target.value;
                                  const updated = { ...settings, cta_font_weight: val };
                                  setSettings(updated);
                                  applyDynamicFonts(updated);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#181822] border border-white/15 text-xs text-white cursor-pointer focus:border-[#C65D45] outline-none"
                              >
                                <option value="inherit">↳ Inherit ({settings.body_font_weight || '700'})</option>
                                {FONT_WEIGHT_OPTIONS.map((w) => (
                                  <option key={w.value} value={w.value}>{w.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <input
                            type="text"
                            value={settings.cta_font || ''}
                            onChange={(e) => {
                              const updated = { ...settings, cta_font: e.target.value };
                              setSettings(updated);
                              applyDynamicFonts(updated);
                            }}
                            placeholder="Or type custom font..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-white/15 text-xs text-white focus:border-[#C65D45] outline-none"
                          />

                          <div className="flex items-center gap-2">
                            <span
                              className="px-3 py-1 rounded-full text-xs uppercase text-white bg-[#C65D45]"
                              style={{
                                fontFamily: `'${settings.cta_font || settings.body_font || 'Montserrat'}', sans-serif`,
                                fontWeight: Number(settings.cta_font_weight || settings.body_font_weight) || 700,
                              }}
                            >
                              Explore Portfolio
                            </span>
                            <span
                              className="px-3 py-1 rounded-full text-xs uppercase text-white bg-black border border-white/20"
                              style={{
                                fontFamily: `'${settings.cta_font || settings.body_font || 'Montserrat'}', sans-serif`,
                                fontWeight: Number(settings.cta_font_weight || settings.body_font_weight) || 700,
                              }}
                            >
                              Hire Me
                            </span>
                          </div>
                        </div>

                        {/* 🎯 Target 4: Badges & Tags */}
                        <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Tag className="w-3.5 h-3.5 text-[#ffba3b]" />
                              <div>
                                <span className="text-xs font-montserrat uppercase font-bold text-white block">
                                  Badges & Tags
                                </span>
                                <span className="text-[10px] text-white/40 block">Category pills, counters, labels</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-white/60 font-mono px-1.5 py-0.5 rounded bg-white/5">
                                {settings.badge_font || 'Inherit'}
                              </span>
                              {settings.badge_font_weight && (
                                <span className="text-[10px] text-[#ffba3b] font-mono px-1.5 py-0.5 rounded bg-white/5">
                                  {settings.badge_font_weight}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-white/50 mb-1 font-mono uppercase">Font Family:</label>
                              <select
                                value={settings.badge_font || 'inherit'}
                                onChange={(e) => {
                                  const val = e.target.value === 'inherit' ? '' : e.target.value;
                                  const updated = { ...settings, badge_font: val };
                                  setSettings(updated);
                                  applyDynamicFonts(updated);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#181822] border border-white/15 text-xs text-white cursor-pointer focus:border-[#C65D45] outline-none"
                              >
                                <option value="inherit">↳ Inherit ({settings.body_font || 'Montserrat'})</option>
                                {FONT_FAMILIES.map((cat) => (
                                  <optgroup key={cat.family} label={`── ${cat.family} ──`}>
                                    {cat.fonts.map((f) => (
                                      <option key={f.name} value={f.name}>{f.name}</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-white/50 mb-1 font-mono uppercase">Font Weight:</label>
                              <select
                                value={settings.badge_font_weight || 'inherit'}
                                onChange={(e) => {
                                  const val = e.target.value === 'inherit' ? '' : e.target.value;
                                  const updated = { ...settings, badge_font_weight: val };
                                  setSettings(updated);
                                  applyDynamicFonts(updated);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#181822] border border-white/15 text-xs text-white cursor-pointer focus:border-[#C65D45] outline-none"
                              >
                                <option value="inherit">↳ Inherit ({settings.body_font_weight || '600'})</option>
                                {FONT_WEIGHT_OPTIONS.map((w) => (
                                  <option key={w.value} value={w.value}>{w.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <input
                            type="text"
                            value={settings.badge_font || ''}
                            onChange={(e) => {
                              const updated = { ...settings, badge_font: e.target.value };
                              setSettings(updated);
                              applyDynamicFonts(updated);
                            }}
                            placeholder="Or type custom font..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-white/15 text-xs text-white focus:border-[#C65D45] outline-none"
                          />

                          <div className="flex items-center gap-2">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider text-[#C65D45] bg-[#C65D45]/15 border border-[#C65D45]/30"
                              style={{
                                fontFamily: `'${settings.badge_font || settings.body_font || 'Montserrat'}', sans-serif`,
                                fontWeight: Number(settings.badge_font_weight || settings.body_font_weight) || 600,
                              }}
                            >
                              Cinematic 16:9
                            </span>
                            <span
                              className="text-[11px] uppercase text-white/70"
                              style={{
                                fontFamily: `'${settings.badge_font || settings.body_font || 'Montserrat'}', sans-serif`,
                                fontWeight: Number(settings.badge_font_weight || settings.body_font_weight) || 600,
                              }}
                            >
                              2.4M Views
                            </span>
                          </div>
                        </div>

                        {/* 🎯 Target 5: Navigation & Brand Logo */}
                        <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Compass className="w-3.5 h-3.5 text-[#ffba3b]" />
                              <div>
                                <span className="text-xs font-montserrat uppercase font-bold text-white block">
                                  Navbar & Brand
                                </span>
                                <span className="text-[10px] text-white/40 block">Logo text and menu navigation</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-white/60 font-mono px-1.5 py-0.5 rounded bg-white/5">
                                {settings.nav_font || 'Inherit'}
                              </span>
                              {settings.nav_font_weight && (
                                <span className="text-[10px] text-[#ffba3b] font-mono px-1.5 py-0.5 rounded bg-white/5">
                                  {settings.nav_font_weight}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-white/50 mb-1 font-mono uppercase">Font Family:</label>
                              <select
                                value={settings.nav_font || 'inherit'}
                                onChange={(e) => {
                                  const val = e.target.value === 'inherit' ? '' : e.target.value;
                                  const updated = { ...settings, nav_font: val };
                                  setSettings(updated);
                                  applyDynamicFonts(updated);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#181822] border border-white/15 text-xs text-white cursor-pointer focus:border-[#C65D45] outline-none"
                              >
                                <option value="inherit">↳ Inherit ({settings.body_font || 'Montserrat'})</option>
                                {FONT_FAMILIES.map((cat) => (
                                  <optgroup key={cat.family} label={`── ${cat.family} ──`}>
                                    {cat.fonts.map((f) => (
                                      <option key={f.name} value={f.name}>{f.name}</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-white/50 mb-1 font-mono uppercase">Font Weight:</label>
                              <select
                                value={settings.nav_font_weight || 'inherit'}
                                onChange={(e) => {
                                  const val = e.target.value === 'inherit' ? '' : e.target.value;
                                  const updated = { ...settings, nav_font_weight: val };
                                  setSettings(updated);
                                  applyDynamicFonts(updated);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-[#181822] border border-white/15 text-xs text-white cursor-pointer focus:border-[#C65D45] outline-none"
                              >
                                <option value="inherit">↳ Inherit ({settings.body_font_weight || '600'})</option>
                                {FONT_WEIGHT_OPTIONS.map((w) => (
                                  <option key={w.value} value={w.value}>{w.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <input
                            type="text"
                            value={settings.nav_font || ''}
                            onChange={(e) => {
                              const updated = { ...settings, nav_font: e.target.value };
                              setSettings(updated);
                              applyDynamicFonts(updated);
                            }}
                            placeholder="Or type custom font..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-black border border-white/15 text-xs text-white focus:border-[#C65D45] outline-none"
                          />

                          <div
                            className="text-sm text-white tracking-wide truncate"
                            style={{
                              fontFamily: `'${settings.nav_font || settings.body_font || 'Montserrat'}', sans-serif`,
                              fontWeight: Number(settings.nav_font_weight || settings.body_font_weight) || 600,
                            }}
                          >
                            Afsar Ahmad • Showreel • Reels • Contact
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* FULL LIVE TYPOGRAPHY SHOWCASE PLAYGROUND */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-black/75 border border-white/15 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs font-mono uppercase tracking-wider text-white font-bold">
                            Live Interactive Composition Showcase
                          </span>
                        </div>
                        <span className="text-[11px] text-white/40">
                          Updates instantly as you adjust any font or weight
                        </span>
                      </div>

                      {/* Mockup component rendered with the exact chosen font stack */}
                      <div className="space-y-3 p-4 rounded-xl bg-[#111118] border border-white/10">
                        {/* Mock Navbar */}
                        <div className="flex items-center justify-between text-xs pb-3 border-b border-white/5">
                          <span
                            className="text-white text-sm"
                            style={{
                              fontFamily: `'${settings.nav_font || settings.body_font || 'Montserrat'}', sans-serif`,
                              fontWeight: Number(settings.nav_font_weight || settings.body_font_weight) || 700,
                            }}
                          >
                            AFSAR AHMAD
                          </span>
                          <div
                            className="flex items-center gap-4 text-white/70"
                            style={{
                              fontFamily: `'${settings.nav_font || settings.body_font || 'Montserrat'}', sans-serif`,
                              fontWeight: Number(settings.nav_font_weight || settings.body_font_weight) || 500,
                            }}
                          >
                            <span>Showreel</span>
                            <span>Reels</span>
                            <span>Services</span>
                            <span>Contact</span>
                          </div>
                        </div>

                        {/* Mock Category Badge */}
                        <div>
                          <span
                            className="inline-block px-3 py-1 rounded-full text-xs uppercase tracking-wider text-[#C65D45] bg-[#C65D45]/15 border border-[#C65D45]/30"
                            style={{
                              fontFamily: `'${settings.badge_font || settings.body_font || 'Montserrat'}', sans-serif`,
                              fontWeight: Number(settings.badge_font_weight || settings.body_font_weight) || 600,
                            }}
                          >
                            Direct Collaboration • Fast Response
                          </span>
                        </div>

                        {/* Mock Hero Headline */}
                        <div
                          className="text-2xl sm:text-3xl lg:text-4xl text-white leading-tight"
                          style={{
                            fontFamily: `'${settings.hero_title_font || settings.heading_font || 'Pogonia'}', serif`,
                            fontWeight: Number(settings.hero_title_font_weight || settings.heading_font_weight) || 700,
                          }}
                        >
                          I'm Afsar Ahmad, Video Editor & Motion Designer.
                        </div>

                        {/* Mock Section Title */}
                        <div
                          className="text-xl sm:text-2xl text-[#C65D45]"
                          style={{
                            fontFamily: `'${settings.section_title_font || settings.heading_font || 'Pogonia'}', serif`,
                            fontWeight: Number(settings.section_title_font_weight || settings.heading_font_weight) || 700,
                          }}
                        >
                          Horizontal & Long-Form Work
                        </div>

                        {/* Mock Body Paragraph */}
                        <p
                          className="text-xs sm:text-sm text-white/75 leading-relaxed max-w-xl"
                          style={{
                            fontFamily: `'${settings.body_font || 'Montserrat'}', sans-serif`,
                            fontWeight: Number(settings.body_font_weight) || 400,
                          }}
                        >
                          Commercial campaigns, YouTube documentaries, and narrative brand films calibrated for widescreen visual storytelling and sustained audience immersion.
                        </p>

                        {/* Mock CTA Buttons */}
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="button"
                            className="px-5 py-2.5 rounded-full text-xs uppercase tracking-wide text-white bg-[#C65D45]"
                            style={{
                              fontFamily: `'${settings.cta_font || settings.body_font || 'Montserrat'}', sans-serif`,
                              fontWeight: Number(settings.cta_font_weight || '700') || 700,
                            }}
                          >
                            Explore Portfolio
                          </button>
                          <button
                            type="button"
                            className="px-5 py-2.5 rounded-full text-xs uppercase tracking-wide text-white bg-black border border-white/20"
                            style={{
                              fontFamily: `'${settings.cta_font || settings.body_font || 'Montserrat'}', sans-serif`,
                              fontWeight: Number(settings.cta_font_weight || '700') || 700,
                            }}
                          >
                            Hire Me
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Save Action */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-xs text-white/50">
                        Changes preview immediately on the page. Click Save to persist all font & weight settings.
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await api.updateSettings(settings);
                            showNotice('All typography and font weight settings saved successfully!');
                            onDataChanged();
                          } catch (err: any) {
                            showNotice(err.message || 'Error saving typography', 'error');
                          }
                        }}
                        className="px-6 py-2.5 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] hover:bg-[#D76E56] font-semibold transition-all shadow-lg hover:shadow-xl cursor-pointer self-start sm:self-auto"
                      >
                        Save Typography Settings
                      </button>
                    </div>
                  </div>
                  {/* ─────────────────────────────────────────────────────── */}

                  <div className="space-y-4 p-6 rounded-2xl bg-[#101018] border border-white/10">
                    <div>
                      <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                        Hero Headline
                      </label>
                      <input
                        type="text"
                        value={settings.hero_headline || ''}
                        onChange={(e) => setSettings({ ...settings, hero_headline: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                        Hero Subtitle
                      </label>
                      <textarea
                        rows={2}
                        value={settings.hero_subtitle || ''}
                        onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                        Live Availability Badge Text
                      </label>
                      <input
                        type="text"
                        value={settings.availability || ''}
                        onChange={(e) => setSettings({ ...settings, availability: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        placeholder="Available for Select Projects (Q1/Q2 2026)"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                        Featured Master Showreel Video URL (YouTube link or MP4)
                      </label>
                      <input
                        type="text"
                        value={settings.featured_showreel_url || ''}
                        onChange={(e) => setSettings({ ...settings, featured_showreel_url: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white mb-2"
                        placeholder="https://youtube.com/watch?v=... or https://youtu.be/... or .mp4"
                      />
                      {isYouTubeUrl(settings.featured_showreel_url) && (
                        <div className="flex items-center gap-3 mb-2 p-2 rounded-lg bg-[#C65D45]/15 border border-[#C65D45]/30">
                          <img
                            src={getYouTubeThumbnail(settings.featured_showreel_url) || ''}
                            alt="YouTube Showreel Thumbnail"
                            className="w-16 h-10 object-cover rounded border border-white/20 shrink-0"
                          />
                          <div className="text-xs text-[#C65D45]">
                            <span className="font-bold">YouTube Showreel Connected!</span>
                            <p className="text-[11px] text-white/60">Plays in fullscreen theater mode on click.</p>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15">
                          <Upload className="w-3.5 h-3.5 text-[#C65D45]" />
                          <span>Upload Showreel Video</span>
                          <input
                            type="file"
                            accept="video/*"
                            className="hidden"
                            onChange={(e) =>
                              handleFileUpload(e, (url) =>
                                setSettings({ ...settings, featured_showreel_url: url })
                              )
                            }
                          />
                        </label>

                        {/* Button to Choose Thumbnail from Video Frames */}
                        {settings.featured_showreel_url && (
                          <button
                            type="button"
                            onClick={() => setShowreelPickerOpen(true)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#C65D45]/20 hover:bg-[#C65D45]/30 text-xs font-bold text-[#C65D45] cursor-pointer border border-[#C65D45]/40 transition-colors"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Choose Thumbnail from Video Frames</span>
                          </button>
                        )}
                      </div>

                      {/* Poster Thumbnail URL input & Preview */}
                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Showreel Poster / Thumbnail URL (Auto from video frames or custom URL)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={settings.featured_showreel_poster || ''}
                            onChange={(e) => setSettings({ ...settings, featured_showreel_poster: e.target.value })}
                            className="flex-1 px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                            placeholder="Auto-generated from video or paste image URL"
                          />
                          {settings.featured_showreel_poster && (
                            <img
                              src={settings.featured_showreel_poster}
                              alt="Showreel Poster Preview"
                              className="w-14 h-9 object-cover rounded border border-white/20 shrink-0"
                            />
                          )}
                          <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs cursor-pointer border border-white/15 shrink-0">
                            <Upload className="w-3 h-3 text-[#C65D45]" />
                            <span>Upload Image</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleFileUpload(e, (url) =>
                                  setSettings({ ...settings, featured_showreel_poster: url })
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Contact Email
                        </label>
                        <input
                          type="email"
                          value={settings.contact_email || ''}
                          onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          WhatsApp Number
                        </label>
                        <input
                          type="text"
                          value={settings.whatsapp_number || ''}
                          onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                          placeholder="+15553829014"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          Instagram URL
                        </label>
                        <input
                          type="text"
                          value={settings.instagram_url || ''}
                          onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-montserrat uppercase text-white/60 mb-1">
                          LinkedIn URL
                        </label>
                        <input
                          type="text"
                          value={settings.linkedin_url || ''}
                          onChange={(e) => setSettings({ ...settings, linkedin_url: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg bg-black border border-white/15 text-sm text-white"
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={async () => {
                          try {
                            await api.updateSettings(settings);
                            showNotice('Settings updated successfully!');
                            onDataChanged();
                          } catch (err: any) {
                            showNotice(err.message || 'Error updating settings', 'error');
                          }
                        }}
                        className="px-6 py-2.5 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold"
                      >
                        Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Showreel Frame Picker Modal */}
      {settings.featured_showreel_url && (
        <VideoFramePickerModal
          isOpen={showreelPickerOpen}
          onClose={() => setShowreelPickerOpen(false)}
          videoUrl={settings.featured_showreel_url}
          currentPoster={settings.featured_showreel_poster}
          onSavePoster={async (url) => {
            setSettings((prev) => ({ ...prev, featured_showreel_poster: url }));
            try {
              await api.updateSettings({ ...settings, featured_showreel_poster: url });
              showNotice('Showreel thumbnail updated and saved successfully!');
              onDataChanged();
            } catch {
              showNotice('Thumbnail frame selected! Click "Save Settings" below to persist.');
            }
          }}
          title="Master Showreel"
        />
      )}

      {/* Reel Frame Picker Modal (9:16) */}
      {editingReel?.video_url && (
        <VideoFramePickerModal
          isOpen={reelFramePickerOpen}
          onClose={() => setReelFramePickerOpen(false)}
          videoUrl={editingReel.video_url}
          currentPoster={editingReel.thumbnail_url}
          aspectRatio="9:16"
          onSavePoster={(url) => {
            setEditingReel((prev) => (prev ? { ...prev, thumbnail_url: url } : null));
            showNotice('Reel thumbnail updated from scrubber!');
          }}
          title={editingReel.title ? `Reel: ${editingReel.title}` : 'Reel Frame Picker'}
        />
      )}

      {/* Horizontal Video Frame Picker Modal (16:9) */}
      {editingHorizontal?.video_url && (
        <VideoFramePickerModal
          isOpen={horizontalFramePickerOpen}
          onClose={() => setHorizontalFramePickerOpen(false)}
          videoUrl={editingHorizontal.video_url}
          currentPoster={editingHorizontal.thumbnail_url}
          aspectRatio="16:9"
          onSavePoster={(url) => {
            setEditingHorizontal((prev) => (prev ? { ...prev, thumbnail_url: url } : null));
            showNotice('Film thumbnail updated from scrubber!');
          }}
          title={editingHorizontal.title ? `Film: ${editingHorizontal.title}` : 'Film Frame Picker'}
        />
      )}

      {/* Deployment & Permanent Sync Guide Modal */}
      {showDeployHelpModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-xl bg-[#14141f] border border-amber-500/40 rounded-2xl p-6 text-white shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-pogonia text-xl text-white">Why Do Changes Reset on Deploy?</h3>
                  <p className="text-[11px] text-white/50">Understanding Render Cloud Hosting & Git Persistence</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeployHelpModal(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-white/80 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
                <p className="font-semibold mb-1">⚠️ Render Ephemeral Disk Rule:</p>
                <p className="text-[11px] text-amber-200/80">
                  Render free tier servers rebuild from scratch directly from your <strong>GitHub repository</strong> every time you deploy or restart. Render <strong>cannot push files back to GitHub</strong> automatically.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-semibold text-white text-[13px] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#C65D45] text-white inline-flex items-center justify-center text-[11px]">1</span>
                  Best Method: Edit Locally & Push to GitHub (Recommended)
                </h4>
                <p className="text-white/60 text-[11px]">
                  When you make changes on your laptop (localhost):
                </p>
                <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px] text-white/70">
                  <li>Click <strong>Permanent Sync</strong> in the admin header (saves to <code className="text-[#C65D45]">data/default_content.json</code>).</li>
                  <li>In your VS Code terminal, run:
                    <pre className="mt-1 p-2 rounded bg-black/60 border border-white/10 font-mono text-[10px] text-emerald-400">
git add .
git commit -m "Update portfolio content"
git push
                    </pre>
                  </li>
                  <li>Render will automatically deploy and keep your changes 100% permanent forever!</li>
                </ol>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <h4 className="font-semibold text-white text-[13px] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500 text-white inline-flex items-center justify-center text-[11px]">2</span>
                  Made Changes on the Live Deployed Website? Use JSON Backup!
                </h4>
                <p className="text-white/60 text-[11px]">
                  If you edited reels or titles directly on your live website:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-white/70">
                  <li>Click <strong>Backup JSON</strong> in the top header to download your content file.</li>
                  <li>If you ever redeploy and data resets, simply click <strong>Restore JSON</strong> and select your file — all reels, titles, and settings restore in 1 second!</li>
                  <li>You can also replace <code className="text-blue-300">data/default_content.json</code> in your local folder with this file and git push.</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowDeployHelpModal(false)}
                className="px-5 py-2 rounded-full text-xs font-montserrat uppercase tracking-wider text-white bg-[#C65D45] font-semibold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
