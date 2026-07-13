import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  Folder, 
  File as FileIcon, 
  FolderPlus, 
  Plus, 
  Download, 
  Trash2, 
  ChevronRight, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  FolderOpen,
  Image as ImageIcon,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

interface BrandFolder {
  id: string;
  name: string;
  client_id: number;
  parent_id: string | null;
  created_at: string;
}

interface BrandFile {
  id: string;
  folder_id: string;
  file_name: string;
  file_url: string;
  file_size: string | null;
  visibility: string; // client, designer, internal
  version: number;
  created_at: string;
}

export const BrandVault: React.FC = () => {
  // Navigation & Folder Hierarchy
  const [folders, setFolders] = useState<BrandFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<BrandFolder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BrandFolder[]>([]);
  
  // Files
  const [files, setFiles] = useState<BrandFile[]>([]);
  
  // States
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals / Input triggers
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<BrandFolder[]>('/api/brand_folders');
      setFolders(res.data || []);
      
      const rootFolders = (res.data || []).filter(f => f.parent_id === null);
      if (rootFolders.length > 0 && !activeFolder) {
        handleNavigateToFolder(rootFolders[0], res.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch brand folders:', err);
      setError('Could not load brand folders.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async (folderId: string) => {
    try {
      setLoadingFiles(true);
      const res = await apiFetch<BrandFile[]>(`/api/brand_files?folder_id=${folderId}`);
      setFiles(res.data || []);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleNavigateToFolder = (folder: BrandFolder, allFolders: BrandFolder[] = folders) => {
    setActiveFolder(folder);
    fetchFiles(folder.id);

    const path: BrandFolder[] = [];
    let current: BrandFolder | undefined = folder;
    while (current) {
      path.unshift(current);
      const parentId = current.parent_id;
      current = parentId ? allFolders.find(f => f.id === parentId) : undefined;
    }
    setBreadcrumbs(path);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await apiFetch('/api/brand_folders', {
        method: 'POST',
        body: JSON.stringify({
          name: newFolderName.trim(),
          parent_id: activeFolder ? activeFolder.id : null
        })
      });

      setNewFolderName('');
      setShowNewFolderModal(false);
      await fetchFolders();
    } catch (err) {
      console.error('Could not create folder:', err);
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim() || !newFileUrl.trim() || !activeFolder) return;

    // Check if file exists to increment version
    const existingFile = files.find(f => f.file_name === newFileName.trim());
    const version = existingFile ? existingFile.version + 1 : 1;

    try {
      await apiFetch('/api/brand_files', {
        method: 'POST',
        body: JSON.stringify({
          folder_id: activeFolder.id,
          file_name: newFileName.trim(),
          file_url: newFileUrl.trim(),
          file_size: '1.2 MB', // Placeholder size
          visibility: 'client',
          version: version
        })
      });

      setNewFileName('');
      setNewFileUrl('');
      setShowUploadModal(false);
      await fetchFiles(activeFolder.id);
    } catch (err) {
      console.error('Could not upload file:', err);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await apiFetch(`/api/brand_files/${fileId}`, { method: 'DELETE' });
      if (activeFolder) {
        await fetchFiles(activeFolder.id);
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-[#006663]" size={40} />
      </div>
    );
  }

  const currentSubfolders = activeFolder 
    ? folders.filter(f => f.parent_id === activeFolder.id)
    : folders.filter(f => f.parent_id === null);

  const getFileIcon = (fileName: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'svg', 'gif'].includes(ext)) {
      return <ImageIcon className="text-purple-500" size={18} />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx'].includes(ext)) {
      return <FileText className="text-blue-500" size={18} />;
    }
    return <FileIcon className="text-gray-500" size={18} />;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black/40">
          <button 
            onClick={() => {
              setActiveFolder(null);
              setBreadcrumbs([]);
              setFiles([]);
            }}
            className="hover:text-black transition-all flex items-center gap-1"
          >
            Brand Vault
          </button>
          
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight size={14} className="text-black/20" />
              <button 
                onClick={() => handleNavigateToFolder(crumb)}
                className={`hover:text-black transition-all ${idx === breadcrumbs.length - 1 ? 'text-black font-extrabold' : ''}`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setShowNewFolderModal(true)}
            className="p-2 bg-black/5 hover:bg-black/10 rounded-lg text-black/60 hover:text-black flex items-center gap-1 text-xs font-bold transition-all"
          >
            <FolderPlus size={16} /> New Folder
          </button>
          {activeFolder && (
            <button 
              onClick={() => setShowUploadModal(true)}
              className="p-2 bg-[#006663] text-white rounded-lg text-xs font-bold hover:bg-opacity-90 flex items-center gap-1 transition-all shadow-md"
            >
              <Plus size={16} /> Add File
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm space-y-4 h-fit text-left">
          <h4 className="text-xs font-bold uppercase tracking-widest text-black/40 px-2">Folders</h4>
          <div className="space-y-1">
            {folders.filter(f => f.parent_id === null).map((folder) => {
              const isActive = activeFolder?.id === folder.id;
              return (
                <button
                  key={folder.id}
                  onClick={() => handleNavigateToFolder(folder)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                    isActive 
                      ? 'bg-[#006663]/5 text-[#006663] font-bold' 
                      : 'text-black/60 hover:bg-black/5 hover:text-black'
                  }`}
                >
                  <Folder size={18} className={isActive ? 'text-[#006663]' : 'text-black/40'} />
                  <span className="truncate">{folder.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-black/80 flex items-center gap-2">
              <FolderOpen size={20} className="text-[#006663]" />
              {activeFolder ? activeFolder.name : 'Select a folder'}
            </h3>
          </div>

          {!activeFolder ? (
            <div className="py-24 text-center">
              <Folder size={48} className="text-black/10 mx-auto mb-4" />
              <h4 className="font-bold text-lg text-black/60">No folder selected</h4>
            </div>
          ) : (
            <div className="space-y-6">
              {currentSubfolders.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-black/30 text-left">Subfolders</h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {currentSubfolders.map(sub => (
                      <div 
                        key={sub.id}
                        onClick={() => handleNavigateToFolder(sub)}
                        className="p-4 bg-black/5 hover:bg-[#006663]/5 hover:text-[#006663] rounded-2xl cursor-pointer border border-transparent hover:border-[#006663]/10 transition-all flex items-center gap-2.5 text-left"
                      >
                        <Folder size={16} className="text-black/40" />
                        <span className="text-xs font-bold truncate">{sub.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-black/30 text-left">Files</h5>
                {loadingFiles ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-[#006663]" />
                  </div>
                ) : files.length === 0 ? (
                  <div className="py-16 text-center border border-dashed border-black/10 rounded-2xl">
                    <FileIcon size={32} className="text-black/10 mx-auto mb-2" />
                    <p className="text-xs font-bold text-black/40">Folder is empty</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-black/5 text-[10px] font-bold uppercase tracking-widest text-black/30">
                          <th className="pb-3">Name</th>
                          <th className="pb-3">Version</th>
                          <th className="pb-3 hidden sm:table-cell">Size</th>
                          <th className="pb-3">Added</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {files.map((file) => (
                          <tr key={file.id} className="border-b border-black/5 hover:bg-black/[0.01] transition-all">
                            <td className="py-4 flex items-center gap-3">
                              {getFileIcon(file.file_name)}
                              <span className="text-xs font-bold text-black/80 truncate max-w-[180px] sm:max-w-xs">
                                {file.file_name}
                              </span>
                            </td>
                            <td className="py-4 text-xs font-semibold text-black/40">
                              v{file.version}
                            </td>
                            <td className="py-4 text-xs font-semibold text-black/40 hidden sm:table-cell">
                              {file.file_size || 'Unknown'}
                            </td>
                            <td className="py-4 text-xs font-semibold text-black/40">
                              {format(new Date(file.created_at), 'MMM d, yyyy')}
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <a 
                                  href={file.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-2 hover:bg-black/5 text-black/60 hover:text-black rounded-lg transition-all"
                                >
                                  <Download size={16} />
                                </a>
                                <button 
                                  onClick={() => handleDeleteFile(file.id)}
                                  className="p-2 hover:bg-red-50 text-black/30 hover:text-red-500 rounded-lg transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-black/10 shadow-2xl space-y-4 text-left">
            <h3 className="font-bold text-lg text-black/80">Create Folder</h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1.5">Folder Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Assets"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 rounded-xl outline-none font-semibold text-xs border border-transparent focus:bg-white focus:border-black/10 transition-all"
                />
              </div>
              <div className="flex gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setShowNewFolderModal(false)}
                  className="flex-1 py-3 bg-black/5 rounded-xl font-bold text-xs hover:bg-black/10 transition-all text-center"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-[#006663] text-white rounded-xl font-bold text-xs hover:bg-opacity-90 transition-all text-center shadow-md"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-black/10 shadow-2xl space-y-4 text-left">
            <h3 className="font-bold text-lg text-black/80">Upload File to {activeFolder?.name}</h3>
            <form onSubmit={handleUploadFile} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1.5">File Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. logo.svg"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 rounded-xl outline-none font-semibold text-xs border border-transparent focus:bg-white focus:border-black/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1.5">File URL</label>
                <input 
                  type="url" 
                  required
                  placeholder="https://..."
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-black/5 rounded-xl outline-none font-semibold text-xs border border-transparent focus:bg-white focus:border-black/10 transition-all"
                />
              </div>
              <div className="flex gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-3 bg-black/5 rounded-xl font-bold text-xs hover:bg-black/10 transition-all text-center"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-[#006663] text-white rounded-xl font-bold text-xs hover:bg-opacity-90 transition-all text-center shadow-md"
                >
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
