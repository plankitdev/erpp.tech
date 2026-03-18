import { useState, useEffect } from 'react';
import api from '../api/axios';
import type { MediaFile } from '../types';
import { formatDate } from '../utils';
import SearchInput from '../components/SearchInput';
import {
  Image, FileText, File, Download, Eye, Filter,
  FolderOpen, HardDrive,
} from 'lucide-react';

const typeFilters = [
  { key: 'all', label: 'الكل', icon: HardDrive },
  { key: 'image', label: 'صور', icon: Image },
  { key: 'pdf', label: 'PDF', icon: FileText },
  { key: 'document', label: 'مستندات', icon: File },
];

const sourceFilters = [
  { key: 'all', label: 'الكل' },
  { key: 'projects', label: 'المشاريع' },
  { key: 'employees', label: 'الموظفين' },
];

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith('image')) return Image;
  if (mimeType.includes('pdf')) return FileText;
  return File;
}

function isImageType(mimeType: string | null) {
  return mimeType?.startsWith('image') || false;
}

export default function MediaLibrary() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (typeFilter !== 'all') params.type = typeFilter;
    if (sourceFilter !== 'all') params.source = sourceFilter;
    if (searchQuery.trim()) params.search = searchQuery;

    setLoading(true);
    api.get('/media', { params })
      .then(res => {
        setFiles(res.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [typeFilter, sourceFilter, searchQuery]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">مكتبة الملفات</h1>
          <p className="page-subtitle">{files.length} ملف</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="بحث في الملفات..."
            className="flex-1 min-w-[200px]"
          />
          <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl">
            {typeFilters.map(f => (
              <button key={f.key} onClick={() => setTypeFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  typeFilter === f.key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                <f.icon size={12} />
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl">
            {sourceFilters.map(f => (
              <button key={f.key} onClick={() => setSourceFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  sourceFilter === f.key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Files */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
          <FolderOpen size={48} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">لا توجد ملفات</p>
          <p className="text-gray-400 text-sm mt-1">ارفع ملفات من المشاريع أو الموظفين</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {files.map((file, idx) => {
            const FileIcon = getFileIcon(file.mime_type);
            const isImage = isImageType(file.mime_type);

            return (
              <div key={`${file.source}-${file.id}`}
                className={`animate-fade-in-up stagger-${Math.min(idx + 1, 8)} bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 group`}>
                {/* Preview */}
                <div className="h-32 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                  {isImage && file.path ? (
                    <img src={file.path} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <FileIcon size={40} className="text-gray-300" />
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {file.path && (
                      <a href={file.path} target="_blank" rel="noreferrer"
                        className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-gray-700 hover:bg-white transition-colors">
                        <Download size={16} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-800 truncate" title={file.name}>{file.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-400">
                      {file.source === 'project' ? 'مشروع' : 'موظف'}
                    </span>
                    <span className="text-[10px] text-gray-400">{formatDate(file.created_at)}</span>
                  </div>
                  {file.size && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
