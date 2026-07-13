import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  Briefcase, 
  User, 
  Calendar, 
  Clock, 
  MessageSquare, 
  CheckSquare, 
  ChevronRight, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  Send,
  CheckCircle2,
  ListTodo
} from 'lucide-react';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string; // briefing, design, review, completed, archived
  designer_id: number | null;
  client_id: number;
  deadline: string | null;
  created_at: string;
}

interface ProjectTask {
  id: string;
  title: string;
  description: string | null;
  status: string; // todo, in_progress, completed
  created_at: string;
}

interface Conversation {
  id: string;
  project_id: string | null;
  title: string | null;
  partner_id: number;
  client_id: number;
}

interface Message {
  id: string;
  sender_id: number;
  message_text: string;
  created_at: string;
}

export const ClientProjectsPanel: React.FC = () => {
  const { user } = useAuth();
  
  // Lists
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Workspace Active State
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);

  // Chat/Messaging States
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch<Project[]>('/api/projects');
      setProjects(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch projects:', err);
      setError('Could not load projects list.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWorkspace = async (project: Project) => {
    setSelectedProject(project);
    setLoadingWorkspace(true);
    setConversation(null);
    setMessages([]);
    
    try {
      // 1. Fetch tasks for this project
      const tasksRes = await apiFetch<ProjectTask[]>(`/api/project_tasks?project_id=${project.id}`);
      setTasks(tasksRes.data || []);

      // 2. Load or create chat conversation
      setLoadingChat(true);
      const conversationsRes = await apiFetch<Conversation[]>('/api/conversations');
      const existingConv = (conversationsRes.data || []).find(c => c.project_id === project.id);

      if (existingConv) {
        setConversation(existingConv);
        await fetchMessages(existingConv.id);
      } else {
        // Conversation doesn't exist, wait until they click "Initeer chat" or do it on load
        setConversation(null);
      }
    } catch (err) {
      console.error('Error fetching project workspace data:', err);
    } finally {
      setLoadingWorkspace(false);
      setLoadingChat(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const msgsRes = await apiFetch<Message[]>(`/api/messages?conversation_id=${convId}`);
      // Backend returns messages descending (most recent first), we reverse them for standard bottom-to-top reading
      setMessages((msgsRes.data || []).reverse());
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
    }
  };

  const handleStartConversation = async () => {
    if (!selectedProject) return;
    
    // Choose partner (assigned designer, or fallback to an arbitrary partner ID like 1 which is normally admin)
    const partnerId = selectedProject.designer_id || 1; 

    try {
      setLoadingChat(true);
      const res = await apiFetch<Conversation>('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({
          project_id: selectedProject.id,
          title: selectedProject.name,
          partner_id: partnerId
        })
      });

      if (res.data) {
        // Drizzle insert returns an array
        const newConv = Array.isArray(res.data) ? res.data[0] : res.data;
        setConversation(newConv);
        await fetchMessages(newConv.id);
      }
    } catch (err) {
      console.error('Could not initiate project conversation:', err);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation) return;

    try {
      setSendingMessage(true);
      const res = await apiFetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          conversation_id: conversation.id,
          message_text: newMessage.trim()
        })
      });

      setNewMessage('');
      await fetchMessages(conversation.id);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-brand-primary" size={40} />
      </div>
    );
  }

  if (selectedProject) {
    // Project Workspace Screen
    return (
      <div className="space-y-8 animate-fade-in">
        {/* Back Button & Header */}
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <button 
            onClick={() => setSelectedProject(null)}
            className="flex items-center gap-2 px-4 py-2 hover:bg-black/5 rounded-xl font-bold text-sm text-black/60 transition-all"
          >
            <ArrowLeft size={16} /> Terug naar Projecten
          </button>
          
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${
            selectedProject.status === 'completed' 
              ? 'bg-green-100 text-green-700 border-green-200' 
              : 'bg-blue-100 text-blue-700 border-blue-200'
          }`}>
            {selectedProject.status}
          </span>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Details & Checklist */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm space-y-4">
              <h2 className="text-2xl font-bold text-black/80">{selectedProject.name}</h2>
              {selectedProject.description && (
                <p className="text-sm text-black/60 leading-relaxed font-medium">{selectedProject.description}</p>
              )}
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-black/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center text-black/40">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">Designer</p>
                    <p className="text-xs font-bold text-black/70 mt-0.5">
                      {selectedProject.designer_id ? `Designer #${selectedProject.designer_id}` : 'In afwachting van toewijzing'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center text-black/40">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">Deadline</p>
                    <p className="text-xs font-bold text-black/70 mt-0.5">
                      {selectedProject.deadline ? format(new Date(selectedProject.deadline), 'MMM d, yyyy') : 'Niet ingesteld'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Tasks checklist */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-black/80 flex items-center gap-2">
                <CheckSquare size={20} className="text-[#006663]" />
                Project Checklist ({tasks.filter(t => t.status === 'completed').length}/{tasks.length})
              </h3>
              {loadingWorkspace ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin text-[#006663]" />
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-4 bg-[#f8f9fa] rounded-2xl border border-black/5"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 
                          size={18} 
                          className={task.status === 'completed' ? 'text-green-500' : 'text-black/20'} 
                        />
                        <span className={`text-sm font-semibold ${task.status === 'completed' ? 'line-through text-black/40' : 'text-black/80'}`}>
                          {task.title}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        task.status === 'completed' 
                          ? 'bg-green-100 text-green-700' 
                          : task.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <div className="py-8 text-center text-black/30 font-semibold text-sm">
                      Nog geen openstaande taken voor dit project.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Chat Room */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm flex flex-col h-[520px] relative">
            <h3 className="text-xl font-bold text-black/80 flex items-center gap-2 mb-4">
              <MessageSquare size={20} className="text-[#006663]" />
              Project Overleg
            </h3>

            {loadingChat ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="animate-spin text-[#006663]" />
              </div>
            ) : !conversation ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <MessageSquare size={36} className="text-black/10 mb-3" />
                <p className="text-sm font-bold text-black/60">Geen actieve chatgroep</p>
                <p className="text-xs text-black/40 mt-1 max-w-[200px]">
                  Start een directe overleg chat met uw ontwerper voor dit project.
                </p>
                <button 
                  onClick={handleStartConversation}
                  className="mt-4 px-5 py-2.5 bg-[#006663] text-white rounded-xl text-xs font-bold hover:bg-opacity-90 transition-all shadow-md"
                >
                  Start Overleg
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                {/* Messages Panel */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin scrollbar-thumb-gray-200">
                  {messages.map((msg) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div 
                        key={msg.id}
                        className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div className={`p-4 rounded-2xl text-xs font-semibold ${
                          isMe 
                            ? 'bg-[#006663] text-white rounded-tr-none' 
                            : 'bg-black/5 text-black/80 rounded-tl-none'
                        }`}>
                          {msg.message_text}
                        </div>
                        <span className="text-[9px] text-black/30 mt-1">
                          {format(new Date(msg.created_at), 'h:mm a')}
                        </span>
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <div className="text-center text-black/30 text-xs py-8 font-semibold">
                      Stuur een bericht om het overleg te starten.
                    </div>
                  )}
                </div>

                {/* Send Inputs */}
                <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-black/5 pt-3">
                  <input 
                    type="text" 
                    placeholder="Type uw bericht..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-4 py-3 bg-black/5 border border-transparent rounded-xl outline-none text-xs font-semibold focus:bg-white focus:border-black/10 transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={sendingMessage || !newMessage.trim()}
                    className="w-10 h-10 bg-[#006663] text-white hover:bg-opacity-90 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                  >
                    {sendingMessage ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-black/80">Uw Actieve Projecten</h3>
      </div>

      {projects.length === 0 ? (
        <div className="p-12 bg-white rounded-[2.5rem] border border-black/5 shadow-sm text-center">
          <Briefcase size={36} className="text-black/10 mx-auto mb-3" />
          <h4 className="font-bold text-lg text-black/60">Geen actieve projecten</h4>
          <p className="text-sm text-black/40 mt-1 max-w-sm mx-auto">
            Zodra uw ingediende design aanvragen zijn goedgekeurd door de admin, worden ze hier als actieve projecten weergegeven.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div 
              key={project.id}
              onClick={() => handleOpenWorkspace(project)}
              className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between min-h-[180px] text-left"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${
                    project.status === 'completed' 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : 'bg-blue-100 text-blue-700 border-blue-200'
                  }`}>
                    {project.status}
                  </span>
                  <ChevronRight size={16} className="text-black/20" />
                </div>
                <h4 className="font-bold text-base text-black/80 line-clamp-1">{project.name}</h4>
                {project.description && (
                  <p className="text-xs text-black/40 line-clamp-2 mt-1.5 font-medium">{project.description}</p>
                )}
              </div>

              <div className="border-t border-black/5 pt-4 mt-4 flex items-center justify-between text-black/50 text-[10px] font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <User size={12} /> {project.designer_id ? `Designer #${project.designer_id}` : 'Unassigned'}
                </span>
                {project.deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {format(new Date(project.deadline), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
