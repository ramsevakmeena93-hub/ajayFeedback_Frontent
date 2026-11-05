import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { ArrowLeft, ThumbsUp, AlertTriangle, FileText } from 'lucide-react';

export default function ReportDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/reports/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setReport(data))
      .catch(() => toast.error('Failed to load report'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-gray-400">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Loading report...
      </div>
    </div>
  );

  if (!report) return <div className="text-center mt-20 text-gray-500">Report not found</div>;

  const hasAppreciation = report.appreciation?.length > 0;
  const hasAttention = report.commentsNeedingAttention?.length > 0;
  const isEmpty = !hasAppreciation && !hasAttention;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Report Detail" />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-indigo-600 hover:underline text-sm">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <FileText className="text-indigo-600" size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800">
                {report.facultyName || 'Unknown Faculty'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {[report.subjectCode, report.programme, report.semester ? `Semester ${report.semester}` : '']
                  .filter(Boolean).join(' · ') || 'No subject details'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Analyzed: {report.analyzedAt ? new Date(report.analyzedAt).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Summary badges */}
          <div className="flex gap-3 mt-5 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-red-200 bg-red-50">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-sm font-semibold text-red-700">
                {report.appreciationCount || 0} Appreciation
              </span>
              <span className="text-xs text-red-400">(Red text)</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-yellow-200 bg-yellow-50">
              <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
              <span className="text-sm font-semibold text-yellow-700">
                {report.attentionCount || 0} Needs Attention
              </span>
              <span className="text-xs text-yellow-500">(Yellow text)</span>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {isEmpty && (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <div className="text-4xl mb-3">📄</div>
            <p className="text-gray-500 font-medium">No colored text found in this PDF</p>
            <p className="text-gray-400 text-sm mt-2">
              Make sure the PDF contains text written in <span className="text-red-500 font-medium">#FF0000 red</span> or <span className="text-yellow-500 font-medium">yellow</span> color.
            </p>
          </div>
        )}
        {/* Details sections removed */}

        {/* HOD Remarks */}
        {report.hodRemarks && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              HOD Remarks
            </h3>
            <p className="text-sm text-gray-600 italic bg-indigo-50 rounded-xl px-4 py-3 border border-indigo-100">
              {report.hodRemarks}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
