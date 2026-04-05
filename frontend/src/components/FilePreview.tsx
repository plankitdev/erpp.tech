import { useState, useEffect, useCallback } from 'react';
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, FileText, File, Image as ImageIcon, Film, Music } from 'lucide-react';
import { fileManagerApi } from '../api/fileManager';

// ── Helpers ──────────────────────────────────────────────

function getExtension(name: string): string {
  if (!name) return '';
  return (name.split('.').pop() || '').toLowerCase();
}

function getFileCategory(name: string): 'image' | 'pdf' | 'video' | 'audio' | 'office' | 'other' {
  const ext = getExtension(name);
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(ext)) return 'audio';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'office';
  return 'other';
}

export function getFileIconComponent(name: string) {
  const cat = getFileCategory(name);
  if (cat === 'image') return ImageIcon;
  if (cat === 'pdf') return FileText;
  if (cat === 'video') return Film;
  if (cat === 'audio') return Music;
  return File;
}

export function getFileIconColor(name: string): string {
  const cat = getFileCategory(name);
  if (cat === 'image') return 'bg-blue-50 text-blue-600';
  if (cat === 'pdf') return 'bg-red-50 text-red-600';
  if (cat === 'video') return 'bg-purple-50 text-purple-600';
  if (cat === 'audio') return 'bg-amber-50 text-amber-600';
  if (cat === 'office') return 'bg-green-50 text-green-600';
  return 'bg-gray-50 text-gray-600';
}

/** Ensures URL has /storage/ prefix */
export function resolveFileUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/storage/')) return path;
  if (path.startsWith('storage/')) return `/${path}`;
  return `/storage/${path}`;
}

export function isPreviewable(name: string): boolean {
  const cat = getFileCategory(name);
  return cat !== 'other';
}

// ── File Thumbnail ──────────────────────────────────────

interface FileThumbnailProps {
  name: string;
  path: string;
  className?: string;
  onClick?: () => void;
}

export function FileThumbnail({ name, path, className = '', onClick }: FileThumbnailProps) {
  const cat = getFileCategory(name);
  const url = resolveFileUrl(path);
  const Icon = getFileIconComponent(name);
  const iconColor = getFileIconColor(name);

  if (cat === 'image') {
    return (
      <div
        className={`relative overflow-hidden bg-gray-100 flex items-center justify-center cursor-pointer group ${className}`}
        onClick={onClick}
      >
        <img src={url} alt={name} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${iconColor} ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
      onClick={onClick}
    >
      <Icon size={24} />
    </div>
  );
}

// ── Lightbox / Preview Modal ─────────────────────────────

interface PreviewFile {
  name: string;
  path: string;
  id?: number;
}

interface FilePreviewModalProps {
  file: PreviewFile;
  files?: PreviewFile[];
  onClose: () => void;
}

export function FilePreviewModal({ file, files = [], onClose }: FilePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (files.length === 0) return 0;
    return files.findIndex(f => f.path === file.path && f.name === file.name);
  });
  const [zoom, setZoom] = useState(1);

  const currentFile = files.length > 0 ? files[Math.max(0, currentIndex)] : file;
  if (!currentFile) { onClose(); return null; }
  const cat = getFileCategory(currentFile.name);
  const url = resolveFileUrl(currentFile.path);
  const hasMultiple = files.length > 1;

  // For video/audio with id: use authenticated stream URL (supports Range/seeking)
  // For video/audio without id: fallback to direct /storage/ URL
  const mediaUrl = (cat === 'video' || cat === 'audio') && currentFile.id
    ? fileManagerApi.getStreamUrl(currentFile.id)
    : url;

  const goNext = useCallback(() => {
    if (hasMultiple) {
      setCurrentIndex(i => (i + 1) % files.length);
      setZoom(1);
    }
  }, [hasMultiple, files.length]);

  const goPrev = useCallback(() => {
    if (hasMultiple) {
      setCurrentIndex(i => (i - 1 + files.length) % files.length);
      setZoom(1);
    }
  }, [hasMultiple, files.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goPrev();
      if (e.key === 'ArrowLeft') goNext();
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 4));
      if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.5));
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goNext, goPrev]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-3 z-10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <p className="text-white text-sm font-medium truncate max-w-xs">{currentFile.name}</p>
          {hasMultiple && (
            <span className="text-white/60 text-xs">{currentIndex + 1} / {files.length}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {cat === 'image' && (
            <>
              <button onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <ZoomOut size={18} />
              </button>
              <span className="text-white/50 text-xs min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setZoom(z => Math.min(z + 0.25, 4))}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <ZoomIn size={18} />
              </button>
              <button onClick={() => setZoom(1)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                <Maximize2 size={18} />
              </button>
            </>
          )}
          <a href={url} download={currentFile.name} target="_blank" rel="noreferrer"
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            onClick={e => e.stopPropagation()}>
            <Download size={18} />
          </a>
          <button onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Navigation arrows */}
      {hasMultiple && (
        <>
          <button onClick={e => { e.stopPropagation(); goNext(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <button onClick={e => { e.stopPropagation(); goPrev(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors">
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Content */}
      <div className="relative z-[1] max-w-[90vw] max-h-[85vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
        {cat === 'image' && (
          <img
            src={url}
            alt={currentFile.name}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
            draggable={false}
          />
        )}
        {cat === 'pdf' && (
          <iframe
            src={url}
            title={currentFile.name}
            className="w-[85vw] h-[85vh] rounded-lg bg-white shadow-2xl"
          />
        )}
        {cat === 'video' && (
          <video
            src={mediaUrl}
            controls
            className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl bg-black"
          >
            المتصفح لا يدعم تشغيل الفيديو
          </video>
        )}
        {cat === 'audio' && (
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center min-w-[320px]">
            <Music size={48} className="text-amber-500 mx-auto mb-4" />
            <p className="text-gray-800 font-medium mb-4">{currentFile.name}</p>
            <audio src={mediaUrl} controls className="w-full" />
          </div>
        )}
        {cat === 'office' && (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + url)}`}
            title={currentFile.name}
            className="w-[85vw] h-[85vh] rounded-lg bg-white shadow-2xl"
          />
        )}
        {cat === 'other' && (
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center min-w-[320px]">
            <File size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-800 font-medium mb-2">{currentFile.name}</p>
            <p className="text-gray-500 text-sm mb-4">لا يمكن معاينة هذا الملف</p>
            <a href={url} download={currentFile.name} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 btn-primary text-sm">
              <Download size={16} /> تحميل الملف
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inline Preview (small) ───────────────────────────────

interface InlinePreviewProps {
  name: string;
  path: string;
  className?: string;
}

export function InlinePreview({ name, path, className = '' }: InlinePreviewProps) {
  const [showModal, setShowModal] = useState(false);
  const cat = getFileCategory(name);
  const url = resolveFileUrl(path);

  return (
    <>
      {cat === 'image' ? (
        <div className={`relative rounded-lg overflow-hidden cursor-pointer group ${className}`} onClick={() => setShowModal(true)}>
          <img src={url} alt={name} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ZoomIn size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
        </div>
      ) : isPreviewable(name) ? (
        <button onClick={() => setShowModal(true)} className="text-primary-600 hover:underline text-xs inline-flex items-center gap-1">
          معاينة
        </button>
      ) : null}

      {showModal && (
        <FilePreviewModal file={{ name, path }} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
