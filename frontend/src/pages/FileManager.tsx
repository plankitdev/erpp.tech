import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fileManagerApi, type FMFolder, type FMFile, type FMBreadcrumb } from '../api/fileManager';
import { googleDriveApi } from '../api/googleDrive';
import { useAuthStore } from '../store/authStore';
import SearchInput from '../components/SearchInput';
import { FilePreviewModal, resolveFileUrl, isPreviewable, getFileIconComponent, getFileIconColor } from '../components/FilePreview';
import {
  FolderPlus, Upload, Trash2, Eye, Download, MoreVertical,
  FolderOpen, ChevronLeft, Home, Grid3X3, List, Search,
  File as FileIcon, CheckCircle2, Clock, Archive, Edit3,
  HardDrive, FolderInput, X, Check, Plus, Cloud, CloudOff,
  RefreshCw, Unplug, ExternalLink,
} from 'lucide-react';

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  draft: { label: 'مسودة', color: 'bg-amber-50 text-amber-700', icon: Clock },
  approved: { label: 'معتمد', color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  archived: { label: 'مؤرشف', color: 'bg-gray-100 text-gray-600', icon: Archive },
};

export default function FileManager() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isManager = user?.role === 'super_admin' || user?.role === 'manager';

  // State
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolder, setRenamingFolder] = useState<number | null>(null);
  const [renamingFile, setRenamingFile] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'folder' | 'file'; item: FMFolder | FMFile } | null>(null);
  const [previewFile, setPreviewFile] = useState<{ name: string; path: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['file-manager', currentFolderId],
    queryFn: () => fileManagerApi.index(currentFolderId).then(r => r.data.data),
  });

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['file-manager-search', searchQuery],
    queryFn: () => fileManagerApi.search(searchQuery).then(r => r.data.data),
    enabled: searchQuery.length >= 2,
  });

  const { data: stats } = useQuery({
    queryKey: ['file-manager-stats'],
    queryFn: () => fileManagerApi.stats().then(r => r.data.data),
  });

  // Google Drive
  const { data: driveStatus } = useQuery({
    queryKey: ['google-drive-status'],
    queryFn: () => googleDriveApi.status().then(r => r.data.data),
  });

  const driveAuthMut = useMutation({
    mutationFn: () => googleDriveApi.getAuthUrl().then(r => {
      window.open(r.data.data.url, '_blank', 'width=600,height=700');
    }),
  });

  const driveSyncMut = useMutation({
    mutationFn: () => googleDriveApi.sync(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['google-drive-status'] }),
  });

  const driveDisconnectMut = useMutation({
    mutationFn: () => googleDriveApi.disconnect(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['google-drive-status'] }),
  });

  const folders = data?.folders ?? [];
  const files = data?.files ?? [];
  const breadcrumbs: FMBreadcrumb[] = data?.breadcrumbs ?? [];

  // Mutations
  const createFolderMut = useMutation({
    mutationFn: (name: string) => fileManagerApi.createFolder({ name, parent_id: currentFolderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-manager'] });
      queryClient.invalidateQueries({ queryKey: ['file-manager-stats'] });
      setShowNewFolder(false);
      setNewFolderName('');
    },
  });

  const renameFolderMut = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => fileManagerApi.renameFolder(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-manager'] });
      setRenamingFolder(null);
    },
  });

  const deleteFolderMut = useMutation({
    mutationFn: (id: number) => fileManagerApi.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-manager'] });
      queryClient.invalidateQueries({ queryKey: ['file-manager-stats'] });
    },
  });

  const uploadMut = useMutation({
    mutationFn: (formData: FormData) => fileManagerApi.uploadFile(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-manager'] });
      queryClient.invalidateQueries({ queryKey: ['file-manager-stats'] });
    },
  });

  const renameFileMut = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => fileManagerApi.renameFile(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-manager'] });
      setRenamingFile(null);
    },
  });

  const deleteFileMut = useMutation({
    mutationFn: (id: number) => fileManagerApi.deleteFile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-manager'] });
      queryClient.invalidateQueries({ queryKey: ['file-manager-stats'] });
    },
  });

  const approveFileMut = useMutation({
    mutationFn: (id: number) => fileManagerApi.approveFile(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['file-manager'] }),
  });

  // Handlers
  const handleUpload = useCallback((fileList: FileList) => {
    Array.from(fileList).forEach(file => {
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolderId) formData.append('folder_id', String(currentFolderId));
      uploadMut.mutate(formData);
    });
  }, [currentFolderId, uploadMut]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files);
  }, [handleUpload]);

  const navigateFolder = (folderId: number | null) => {
    setCurrentFolderId(folderId);
    setSearchQuery('');
  };

  // Close context menu on click outside
  useEffect(() => {
    const handler = () => setContextMenu(null);
    if (contextMenu) document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [contextMenu]);

  // Listen for Drive auth callback
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'google-drive-connected') {
        queryClient.invalidateQueries({ queryKey: ['google-drive-status'] });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [queryClient]);

  // Build previewable files list for gallery
  const previewableFiles = files
    .filter(f => isPreviewable(f.name))
    .map(f => ({ name: f.name, path: f.file_path }));

  const isSearchMode = searchQuery.length >= 2;

  return (
    <div className="page-container" dir="rtl">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-blue-600" />
            مدير الملفات
          </h1>
          <p className="page-subtitle">
            {stats ? `${stats.total_files} ملف · ${stats.total_folders} مجلد · ${formatSize(stats.total_size)}` : 'جاري التحميل...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Drive Sync */}
          {isManager && (
            driveStatus?.connected ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => driveSyncMut.mutate()}
                  disabled={driveSyncMut.isPending}
                  className="btn-secondary flex items-center gap-1.5 text-sm text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                >
                  <RefreshCw className={`w-4 h-4 ${driveSyncMut.isPending ? 'animate-spin' : ''}`} />
                  {driveSyncMut.isPending ? 'جاري المزامنة...' : 'Drive Sync'}
                </button>
                <button
                  onClick={() => confirm('فصل جوجل درايف؟') && driveDisconnectMut.mutate()}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600"
                  title="فصل جوجل درايف"
                >
                  <Unplug className="w-4 h-4" />
                </button>
                {driveStatus.last_synced_at && (
                  <span className="text-[10px] text-gray-400 hidden md:block">آخر مزامنة: {driveStatus.last_synced_at}</span>
                )}
              </div>
            ) : (
              <button
                onClick={() => driveAuthMut.mutate()}
                disabled={driveAuthMut.isPending}
                className="btn-secondary flex items-center gap-1.5 text-sm"
              >
                <Cloud className="w-4 h-4" />
                ربط جوجل درايف
              </button>
            )
          )}
          <button
            onClick={() => setShowNewFolder(true)}
            className="btn-secondary flex items-center gap-1.5 text-sm"
          >
            <FolderPlus className="w-4 h-4" />
            مجلد جديد
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary flex items-center gap-1.5 text-sm"
          >
            <Upload className="w-4 h-4" />
            رفع ملف
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={e => e.target.files && handleUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-sm flex-1 min-w-0 overflow-x-auto">
            <button
              onClick={() => navigateFolder(null)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 whitespace-nowrap ${!currentFolderId ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
            >
              <Home className="w-4 h-4" />
              الرئيسية
            </button>
            {breadcrumbs.map((bc, i) => (
              <div key={bc.id} className="flex items-center gap-1">
                <ChevronLeft className="w-3 h-3 text-gray-400" />
                <button
                  onClick={() => navigateFolder(bc.id)}
                  className={`px-2 py-1 rounded-lg hover:bg-gray-100 whitespace-nowrap ${i === breadcrumbs.length - 1 ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                >
                  {bc.name}
                </button>
              </div>
            ))}
          </div>

          {/* Search */}
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="بحث..."
            className="w-56"
          />

          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* New Folder Inline */}
      {showNewFolder && (
        <div className="bg-white rounded-xl border-2 border-blue-200 p-3 mb-4 flex items-center gap-3">
          <FolderOpen className="w-8 h-8 text-blue-500" />
          <input
            type="text"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            placeholder="اسم المجلد الجديد..."
            className="input flex-1"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter' && newFolderName.trim()) createFolderMut.mutate(newFolderName.trim());
              if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName(''); }
            }}
          />
          <button
            onClick={() => newFolderName.trim() && createFolderMut.mutate(newFolderName.trim())}
            disabled={!newFolderName.trim() || createFolderMut.isPending}
            className="btn-primary text-sm px-4"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
            className="btn-secondary text-sm px-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Drop Zone / Content Area */}
      <div
        ref={dropRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-white rounded-xl shadow-sm border transition-colors min-h-[400px] ${isDragging ? 'border-blue-400 bg-blue-50/50 border-dashed border-2' : 'border-gray-100'}`}
      >
        {isDragging && (
          <div className="flex flex-col items-center justify-center py-20 pointer-events-none">
            <Upload className="w-16 h-16 text-blue-400 mb-3" />
            <p className="text-blue-600 font-medium text-lg">أفلت الملفات هنا لرفعها</p>
          </div>
        )}

        {!isDragging && isLoading && (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search Results */}
        {!isDragging && isSearchMode && (
          <div className="p-4">
            {isSearching ? (
              <div className="text-center py-10 text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                جاري البحث...
              </div>
            ) : searchResults ? (
              <div className="space-y-4">
                {searchResults.folders.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">المجلدات ({searchResults.folders.length})</h3>
                    <div className="space-y-1">
                      {searchResults.folders.map(f => (
                        <button
                          key={f.id}
                          onClick={() => { navigateFolder(f.id); setSearchQuery(''); }}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-right"
                        >
                          <FolderOpen className="w-8 h-8 text-amber-500" />
                          <div>
                            <p className="font-medium text-gray-800">{f.name}</p>
                            {f.parent_name && <p className="text-xs text-gray-400">في: {f.parent_name}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {searchResults.files.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">الملفات ({searchResults.files.length})</h3>
                    <div className="space-y-1">
                      {searchResults.files.map(f => {
                        const IconComp = getFileIconComponent(f.name);
                        const iconColor = getFileIconColor(f.name);
                        return (
                          <div
                            key={f.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColor}`}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 truncate">{f.name}</p>
                              <p className="text-xs text-gray-400">
                                {f.folder_name && `${f.folder_name} · `}
                                {formatSize(f.file_size)}
                              </p>
                            </div>
                            {isPreviewable(f.name) && (
                              <button
                                onClick={() => setPreviewFile({ name: f.name, path: f.file_path })}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            <a
                              href={resolveFileUrl(f.file_path)}
                              download
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {searchResults.folders.length === 0 && searchResults.files.length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    <Search className="w-10 h-10 mx-auto mb-2" />
                    <p>لا توجد نتائج</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Normal Content (folders + files) */}
        {!isDragging && !isLoading && !isSearchMode && (
          <div className="p-4">
            {/* Folders */}
            {folders.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">المجلدات</h3>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {folders.map(folder => (
                      <FolderCard
                        key={folder.id}
                        folder={folder}
                        isRenaming={renamingFolder === folder.id}
                        renameValue={renameValue}
                        onNavigate={() => navigateFolder(folder.id)}
                        onStartRename={() => { setRenamingFolder(folder.id); setRenameValue(folder.name); }}
                        onRename={(name) => renameFolderMut.mutate({ id: folder.id, name })}
                        onCancelRename={() => setRenamingFolder(null)}
                        onRenameChange={setRenameValue}
                        onDelete={() => {
                          if (confirm(`حذف المجلد "${folder.name}" وكل محتوياته؟`)) deleteFolderMut.mutate(folder.id);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({ x: e.clientX, y: e.clientY, type: 'folder', item: folder });
                        }}
                        isManager={isManager}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {folders.map(folder => (
                      <FolderRow
                        key={folder.id}
                        folder={folder}
                        isRenaming={renamingFolder === folder.id}
                        renameValue={renameValue}
                        onNavigate={() => navigateFolder(folder.id)}
                        onStartRename={() => { setRenamingFolder(folder.id); setRenameValue(folder.name); }}
                        onRename={(name) => renameFolderMut.mutate({ id: folder.id, name })}
                        onCancelRename={() => setRenamingFolder(null)}
                        onRenameChange={setRenameValue}
                        onDelete={() => {
                          if (confirm(`حذف المجلد "${folder.name}" وكل محتوياته؟`)) deleteFolderMut.mutate(folder.id);
                        }}
                        isManager={isManager}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Files */}
            {files.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">الملفات</h3>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {files.map(file => (
                      <FileCard
                        key={file.id}
                        file={file}
                        isRenaming={renamingFile === file.id}
                        renameValue={renameValue}
                        onPreview={() => isPreviewable(file.name) && setPreviewFile({ name: file.name, path: file.file_path })}
                        onStartRename={() => { setRenamingFile(file.id); setRenameValue(file.name); }}
                        onRename={name => renameFileMut.mutate({ id: file.id, name })}
                        onCancelRename={() => setRenamingFile(null)}
                        onRenameChange={setRenameValue}
                        onDelete={() => {
                          if (confirm(`حذف الملف "${file.name}"?`)) deleteFileMut.mutate(file.id);
                        }}
                        onApprove={() => approveFileMut.mutate(file.id)}
                        isManager={isManager}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {files.map(file => (
                      <FileRow
                        key={file.id}
                        file={file}
                        isRenaming={renamingFile === file.id}
                        renameValue={renameValue}
                        onPreview={() => isPreviewable(file.name) && setPreviewFile({ name: file.name, path: file.file_path })}
                        onStartRename={() => { setRenamingFile(file.id); setRenameValue(file.name); }}
                        onRename={name => renameFileMut.mutate({ id: file.id, name })}
                        onCancelRename={() => setRenamingFile(null)}
                        onRenameChange={setRenameValue}
                        onDelete={() => {
                          if (confirm(`حذف الملف "${file.name}"?`)) deleteFileMut.mutate(file.id);
                        }}
                        onApprove={() => approveFileMut.mutate(file.id)}
                        isManager={isManager}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {folders.length === 0 && files.length === 0 && (
              <div className="text-center py-20">
                <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">هذا المجلد فارغ</p>
                <p className="text-gray-400 text-sm mb-6">أنشئ مجلد جديد أو ارفع ملفات</p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => setShowNewFolder(true)} className="btn-secondary flex items-center gap-1.5 text-sm">
                    <FolderPlus className="w-4 h-4" />
                    مجلد جديد
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="btn-primary flex items-center gap-1.5 text-sm">
                    <Upload className="w-4 h-4" />
                    رفع ملف
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload progress */}
        {uploadMut.isPending && (
          <div className="fixed bottom-6 left-6 bg-white rounded-xl shadow-lg border p-4 flex items-center gap-3 z-50">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">جاري رفع الملفات...</span>
          </div>
        )}

        {/* Sync result */}
        {driveSyncMut.isSuccess && driveSyncMut.data && (
          <div className="fixed bottom-6 left-6 bg-emerald-50 rounded-xl shadow-lg border border-emerald-200 p-4 flex items-center gap-3 z-50">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-sm text-emerald-700">{driveSyncMut.data.data.message}</span>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-xl shadow-xl border z-50 py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.type === 'folder' && (
            <>
              <button
                onClick={() => { navigateFolder((contextMenu.item as FMFolder).id); setContextMenu(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-right"
              >
                <FolderOpen className="w-4 h-4 text-gray-400" />
                فتح
              </button>
              <button
                onClick={() => {
                  setRenamingFolder((contextMenu.item as FMFolder).id);
                  setRenameValue((contextMenu.item as FMFolder).name);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-right"
              >
                <Edit3 className="w-4 h-4 text-gray-400" />
                إعادة تسمية
              </button>
              {isManager && (
                <button
                  onClick={() => {
                    if (confirm(`حذف المجلد "${(contextMenu.item as FMFolder).name}" وكل محتوياته؟`))
                      deleteFolderMut.mutate((contextMenu.item as FMFolder).id);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-sm text-red-600 text-right"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </button>
              )}
            </>
          )}
          {contextMenu.type === 'file' && (
            <>
              {isPreviewable((contextMenu.item as FMFile).name) && (
                <button
                  onClick={() => {
                    const f = contextMenu.item as FMFile;
                    setPreviewFile({ name: f.name, path: f.file_path });
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-right"
                >
                  <Eye className="w-4 h-4 text-gray-400" />
                  معاينة
                </button>
              )}
              <a
                href={resolveFileUrl((contextMenu.item as FMFile).file_path)}
                download
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm"
                onClick={() => setContextMenu(null)}
              >
                <Download className="w-4 h-4 text-gray-400" />
                تحميل
              </a>
              <button
                onClick={() => {
                  setRenamingFile((contextMenu.item as FMFile).id);
                  setRenameValue((contextMenu.item as FMFile).name);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-right"
              >
                <Edit3 className="w-4 h-4 text-gray-400" />
                إعادة تسمية
              </button>
              {isManager && (contextMenu.item as FMFile).status === 'draft' && (
                <button
                  onClick={() => {
                    approveFileMut.mutate((contextMenu.item as FMFile).id);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-sm text-emerald-600 text-right"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  اعتماد
                </button>
              )}
              {isManager && (
                <button
                  onClick={() => {
                    if (confirm(`حذف الملف "${(contextMenu.item as FMFile).name}"?`))
                      deleteFileMut.mutate((contextMenu.item as FMFile).id);
                    setContextMenu(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-sm text-red-600 text-right"
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          files={previewableFiles}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}

// ========== Sub-components ==========

function FolderCard({ folder, isRenaming, renameValue, onNavigate, onStartRename, onRename, onCancelRename, onRenameChange, onDelete, onContextMenu, isManager }: {
  folder: FMFolder;
  isRenaming: boolean;
  renameValue: string;
  onNavigate: () => void;
  onStartRename: () => void;
  onRename: (name: string) => void;
  onCancelRename: () => void;
  onRenameChange: (v: string) => void;
  onDelete: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  isManager: boolean;
}) {
  return (
    <div
      onDoubleClick={onNavigate}
      onContextMenu={onContextMenu}
      className="group bg-gray-50 hover:bg-blue-50 rounded-xl p-3 cursor-pointer border border-transparent hover:border-blue-200 transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <FolderOpen className="w-10 h-10 text-amber-500" />
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
          <button onClick={(e) => { e.stopPropagation(); onStartRename(); }} className="p-1 rounded hover:bg-white/80">
            <Edit3 className="w-3.5 h-3.5 text-gray-500" />
          </button>
          {isManager && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded hover:bg-red-100">
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            </button>
          )}
        </div>
      </div>
      {isRenaming ? (
        <input
          value={renameValue}
          onChange={e => onRenameChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && renameValue.trim()) onRename(renameValue.trim());
            if (e.key === 'Escape') onCancelRename();
          }}
          onBlur={() => renameValue.trim() && onRename(renameValue.trim())}
          className="input text-sm w-full"
          autoFocus
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <p className="text-sm font-medium text-gray-700 truncate" title={folder.name}>{folder.name}</p>
      )}
      <p className="text-xs text-gray-400 mt-1">
        {folder.children_count > 0 && `${folder.children_count} مجلد`}
        {folder.children_count > 0 && folder.files_count > 0 && ' · '}
        {folder.files_count > 0 && `${folder.files_count} ملف`}
        {folder.children_count === 0 && folder.files_count === 0 && 'فارغ'}
      </p>
    </div>
  );
}

function FolderRow({ folder, isRenaming, renameValue, onNavigate, onStartRename, onRename, onCancelRename, onRenameChange, onDelete, isManager }: {
  folder: FMFolder;
  isRenaming: boolean;
  renameValue: string;
  onNavigate: () => void;
  onStartRename: () => void;
  onRename: (name: string) => void;
  onCancelRename: () => void;
  onRenameChange: (v: string) => void;
  onDelete: () => void;
  isManager: boolean;
}) {
  return (
    <div
      onDoubleClick={onNavigate}
      className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer"
    >
      <FolderOpen className="w-8 h-8 text-amber-500 shrink-0" />
      <div className="flex-1 min-w-0">
        {isRenaming ? (
          <input
            value={renameValue}
            onChange={e => onRenameChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && renameValue.trim()) onRename(renameValue.trim());
              if (e.key === 'Escape') onCancelRename();
            }}
            onBlur={() => renameValue.trim() && onRename(renameValue.trim())}
            className="input text-sm w-full"
            autoFocus
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <p className="font-medium text-gray-700 truncate">{folder.name}</p>
        )}
      </div>
      <span className="text-xs text-gray-400 whitespace-nowrap">
        {folder.files_count} ملف
      </span>
      <span className="text-xs text-gray-400 whitespace-nowrap">{folder.created_at && formatDate(folder.created_at)}</span>
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); onStartRename(); }} className="p-1.5 rounded-lg hover:bg-gray-200">
          <Edit3 className="w-4 h-4 text-gray-500" />
        </button>
        {isManager && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg hover:bg-red-100">
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
}

function FileCard({ file, isRenaming, renameValue, onPreview, onStartRename, onRename, onCancelRename, onRenameChange, onDelete, onApprove, isManager }: {
  file: FMFile;
  isRenaming: boolean;
  renameValue: string;
  onPreview: () => void;
  onStartRename: () => void;
  onRename: (name: string) => void;
  onCancelRename: () => void;
  onRenameChange: (v: string) => void;
  onDelete: () => void;
  onApprove: () => void;
  isManager: boolean;
}) {
  const IconComp = getFileIconComponent(file.name);
  const iconColor = getFileIconColor(file.name);
  const st = statusConfig[file.status] || statusConfig.draft;
  const StatusIcon = st.icon;
  const isImage = file.mime_type?.startsWith('image');

  return (
    <div
      className="group bg-gray-50 hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-200 transition-all overflow-hidden cursor-pointer"
      onContextMenu={e => e.preventDefault()}
    >
      {/* Thumbnail area */}
      <div
        className="relative h-28 flex items-center justify-center bg-gray-100"
        onClick={onPreview}
      >
        {isImage ? (
          <img
            src={resolveFileUrl(file.file_path)}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${iconColor}`}>
            <IconComp className="w-7 h-7" />
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2">
            {isPreviewable(file.name) && (
              <button className="p-2 bg-white rounded-full shadow hover:bg-gray-100">
                <Eye className="w-4 h-4 text-gray-700" />
              </button>
            )}
            <a href={resolveFileUrl(file.file_path)} download className="p-2 bg-white rounded-full shadow hover:bg-gray-100" onClick={e => e.stopPropagation()}>
              <Download className="w-4 h-4 text-gray-700" />
            </a>
          </div>
        </div>
        {/* Status badge */}
        <span className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${st.color}`}>
          <StatusIcon className="w-3 h-3" />
          {st.label}
        </span>
      </div>
      {/* Info */}
      <div className="p-2.5">
        {isRenaming ? (
          <input
            value={renameValue}
            onChange={e => onRenameChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && renameValue.trim()) onRename(renameValue.trim());
              if (e.key === 'Escape') onCancelRename();
            }}
            onBlur={() => renameValue.trim() && onRename(renameValue.trim())}
            className="input text-sm w-full"
            autoFocus
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <p className="text-sm font-medium text-gray-700 truncate" title={file.name}>{file.name}</p>
        )}
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-400">{formatSize(file.file_size)}</span>
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
            <button onClick={(e) => { e.stopPropagation(); onStartRename(); }} className="p-0.5 rounded hover:bg-white/80">
              <Edit3 className="w-3 h-3 text-gray-500" />
            </button>
            {isManager && file.status === 'draft' && (
              <button onClick={(e) => { e.stopPropagation(); onApprove(); }} className="p-0.5 rounded hover:bg-emerald-100">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              </button>
            )}
            {isManager && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-0.5 rounded hover:bg-red-100">
                <Trash2 className="w-3 h-3 text-red-500" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FileRow({ file, isRenaming, renameValue, onPreview, onStartRename, onRename, onCancelRename, onRenameChange, onDelete, onApprove, isManager }: {
  file: FMFile;
  isRenaming: boolean;
  renameValue: string;
  onPreview: () => void;
  onStartRename: () => void;
  onRename: (name: string) => void;
  onCancelRename: () => void;
  onRenameChange: (v: string) => void;
  onDelete: () => void;
  onApprove: () => void;
  isManager: boolean;
}) {
  const IconComp = getFileIconComponent(file.name);
  const iconColor = getFileIconColor(file.name);
  const st = statusConfig[file.status] || statusConfig.draft;
  const StatusIcon = st.icon;

  return (
    <div
      className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer"
      onClick={onPreview}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconColor}`}>
        <IconComp className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        {isRenaming ? (
          <input
            value={renameValue}
            onChange={e => onRenameChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && renameValue.trim()) onRename(renameValue.trim());
              if (e.key === 'Escape') onCancelRename();
            }}
            onBlur={() => renameValue.trim() && onRename(renameValue.trim())}
            className="input text-sm w-full"
            autoFocus
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <p className="font-medium text-gray-700 truncate">{file.name}</p>
        )}
      </div>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0 ${st.color}`}>
        <StatusIcon className="w-3 h-3" />
        {st.label}
      </span>
      <span className="text-xs text-gray-400 whitespace-nowrap">{formatSize(file.file_size)}</span>
      {file.uploaded_by && (
        <span className="text-xs text-gray-400 whitespace-nowrap hidden md:block">{file.uploaded_by.name}</span>
      )}
      <span className="text-xs text-gray-400 whitespace-nowrap hidden md:block">{file.created_at && formatDate(file.created_at)}</span>
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0">
        {isPreviewable(file.name) && (
          <button onClick={e => { e.stopPropagation(); onPreview(); }} className="p-1.5 rounded-lg hover:bg-blue-100">
            <Eye className="w-4 h-4 text-blue-500" />
          </button>
        )}
        <a href={resolveFileUrl(file.file_path)} download className="p-1.5 rounded-lg hover:bg-gray-200" onClick={e => e.stopPropagation()}>
          <Download className="w-4 h-4 text-gray-500" />
        </a>
        <button onClick={e => { e.stopPropagation(); onStartRename(); }} className="p-1.5 rounded-lg hover:bg-gray-200">
          <Edit3 className="w-4 h-4 text-gray-500" />
        </button>
        {isManager && file.status === 'draft' && (
          <button onClick={e => { e.stopPropagation(); onApprove(); }} className="p-1.5 rounded-lg hover:bg-emerald-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </button>
        )}
        {isManager && (
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg hover:bg-red-100">
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
}
