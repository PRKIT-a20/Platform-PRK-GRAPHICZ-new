import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { Loader2, CheckCircle, XCircle, AlertTriangle, FileText, User, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface Request {
  id: string;
  user_id: number;
  title: string;
  description: string;
  status: 'pending_review' | 'approved' | 'rejected';
  created_at: string;
  product_type?: string;
  client_name?: string;
}

export const AdminRequests: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [approvalModal, setApprovalModal] = useState(false);
  const [rejectionModal, setRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [designerId, setDesignerId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await apiFetch<Request[]>('/api/requests');
      setRequests(res.data?.filter(r => ['pending_review', 'approved', 'rejected'].includes(r.status)) || []);
    } catch (err) {
      setError('Failed to load requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    try {
      // 1. Update Request Status
      await apiFetch(`/api/requests/${selectedRequest.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'approved' })
      });
      // 2. Create Project
      await apiFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: selectedRequest.title,
          description: projectDescription || selectedRequest.description,
          client_id: selectedRequest.user_id,
          designer_id: designerId ? Number(designerId) : null,
          status: 'briefing',
          deadline
        })
      });
      setApprovalModal(false);
      fetchRequests();
    } catch (err) {
      console.error('Failed to approve request:', err);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      await apiFetch(`/api/requests/${selectedRequest.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'rejected', rejection_reason: rejectionReason })
      });
      setRejectionModal(false);
      fetchRequests();
    } catch (err) {
      console.error('Failed to reject request:', err);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#006663]" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[2rem] border border-black/5 shadow-sm">
        <h2 className="text-xl font-bold mb-6">Request Approval Center</h2>
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="p-6 bg-black/[0.02] rounded-2xl flex items-center justify-between gap-4">
              <div>
                <h4 className="font-bold">{req.title}</h4>
                <p className="text-sm text-black/60">{req.client_name || 'Client'} - {format(new Date(req.created_at), 'MMM d, yyyy')}</p>
                <span className={`text-[10px] font-bold uppercase ${req.status === 'approved' ? 'text-green-600' : req.status === 'rejected' ? 'text-red-600' : 'text-orange-600'}`}>{req.status}</span>
              </div>
              <button onClick={() => setSelectedRequest(req)} className="p-2 bg-white rounded-lg shadow-sm border border-black/5">
                <ChevronRight size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedRequest && !approvalModal && !rejectionModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl">
            <h3 className="font-bold text-lg mb-4">{selectedRequest.title}</h3>
            <p className="text-sm text-black/60 mb-6">{selectedRequest.description}</p>
            <div className="flex gap-3">
              <button onClick={() => setApprovalModal(true)} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold">Approve</button>
              <button onClick={() => setRejectionModal(true)} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold">Reject</button>
              <button onClick={() => setSelectedRequest(null)} className="flex-1 py-3 bg-black/10 rounded-xl font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
