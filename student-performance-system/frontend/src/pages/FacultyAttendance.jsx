import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import Header from '../components/Header';
import { PageShell } from '../components/AdminUI';
import { BookOpen, Users, Calendar, Save, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const FacultyAttendance = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Get initial subjectId from URL query param if present
  const queryParams = new URLSearchParams(location.search);
  const initialSubjectId = queryParams.get('subjectId') || '';

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(initialSubjectId);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({}); // { studentId: 'Present' }
  const [remarksData, setRemarksData] = useState({}); // { studentId: 'Late traffic' }
  const [notification, setNotification] = useState('');
  const [fetchingDetails, setFetchingDetails] = useState(false);

  // 1. Fetch Assigned Subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/faculty/my-subjects');
        setSubjects(res.data.data);
        if (res.data.data.length > 0 && !selectedSubject) {
          setSelectedSubject(res.data.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
      }
    };
    fetchSubjects();
  }, []);

  // 2. Fetch Students and existing attendance when Subject or Date changes
  useEffect(() => {
    if (!selectedSubject) return;

    const fetchStudentData = async () => {
      setLoading(true);
      try {
        // Fetch students enrolled
        const studentRes = await api.get(`/faculty/subjects/${selectedSubject}/students`);
        const fetchedStudents = studentRes.data.data || [];
        setStudents(fetchedStudents);

        // Fetch existing attendance for this date
        const attendanceRes = await api.get('/faculty/attendance', {
          params: { subjectId: selectedSubject, date: attendanceDate }
        });
        const existingRecords = attendanceRes.data.data || [];

        // Map existing attendance or fall back to default 'Present'
        const initialAttendance = {};
        const initialRemarks = {};

        fetchedStudents.forEach(s => {
          const match = existingRecords.find(r => r.student === s._id || r.student?._id === s._id);
          if (match) {
            initialAttendance[s._id] = match.status;
            initialRemarks[s._id] = match.remarks || '';
          } else {
            initialAttendance[s._id] = 'Present';
            initialRemarks[s._id] = '';
          }
        });

        setAttendanceData(initialAttendance);
        setRemarksData(initialRemarks);
      } catch (err) {
        console.error('Failed to fetch attendance details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [selectedSubject, attendanceDate]);

  // Bulk Actions
  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach(s => {
      updated[s._id] = status;
    });
    setAttendanceData(updated);
  };

  const handleSaveAttendance = async () => {
    setFetchingDetails(true);
    try {
      const records = students.map(s => ({
        studentId: s._id,
        status: attendanceData[s._id] || 'Present',
        remarks: remarksData[s._id] || ''
      }));

      const res = await api.post('/faculty/attendance', {
        subjectId: selectedSubject,
        date: attendanceDate,
        records
      });

      if (res.data.success) {
        setNotification('Attendance recorded successfully!');
        setTimeout(() => setNotification(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save attendance.');
    } finally {
      setFetchingDetails(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900 pb-12">
      <Header title="Attendance Register" subtitle="Manage and record daily class attendance" />

      {notification && (
        <div className="fixed top-20 right-6 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg font-bold z-50 flex items-center gap-2">
          <CheckCircle size={18} /> {notification}
        </div>
      )}

      <PageShell maxWidth="max-w-7xl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Actions */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <label className="block text-xs font-semibold text-slate-500">
                <span>Select Subject</span>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="mt-1 bg-white border border-slate-250 text-slate-800 text-sm rounded-xl focus:ring-brand-500 block w-64 p-2.5 font-bold outline-none"
                >
                  <option value="">Select a Subject</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold text-slate-500">
                <span>Attendance Date</span>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="mt-1 bg-white border border-slate-250 text-slate-800 text-sm rounded-xl focus:ring-brand-500 block w-48 p-2.5 font-bold outline-none"
                />
              </label>
            </div>

            <button
              onClick={handleSaveAttendance}
              disabled={loading || fetchingDetails || students.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-500/20 transition-all disabled:opacity-60 shrink-0"
            >
              {fetchingDetails ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              <span>Save Attendance</span>
            </button>
          </div>

          {/* Bulk Quick Toggles */}
          {students.length > 0 && (
            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between gap-4">
              <span className="text-xs font-bold uppercase text-slate-400">Quick Actions</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMarkAll('Present')}
                  className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => handleMarkAll('Absent')}
                  className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-150 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors"
                >
                  Mark All Absent
                </button>
              </div>
            </div>
          )}

          {/* Students table */}
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <AlertCircle className="mx-auto mb-3" size={36} />
              <p className="font-semibold text-slate-500">No students found.</p>
              <p className="text-sm text-slate-400 mt-1">Please select an assigned subject or make sure students are enrolled.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">Roll Number</th>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Remarks (Optional)</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {students.map((student) => (
                    <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-slate-500 text-xs font-bold">{student.rollNumber}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{student.name}</span>
                          <span className="text-[10px] text-slate-400">{student.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={remarksData[student._id] || ''}
                          onChange={(e) => setRemarksData({...remarksData, [student._id]: e.target.value})}
                          placeholder="e.g. Medical leave, Late arrival"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none focus:border-brand-500 font-medium"
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex bg-slate-100/80 rounded-xl p-1 border border-slate-200">
                          {['Present', 'Absent', 'Late', 'Excused'].map((status) => {
                            const isSelected = attendanceData[student._id] === status;
                            return (
                              <button
                                key={status}
                                onClick={() => setAttendanceData({...attendanceData, [student._id]: status})}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  isSelected
                                    ? status === 'Present' ? 'bg-emerald-500 text-white shadow-sm'
                                    : status === 'Absent' ? 'bg-rose-500 text-white shadow-sm'
                                    : 'bg-slate-800 text-white shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageShell>
    </div>
  );
};

export default FacultyAttendance;
