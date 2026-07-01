import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';
import Header from '../components/Header';
import { PageShell } from '../components/AdminUI';
import { BookOpen, Users, Save, CheckCircle, AlertCircle, RefreshCw, Award } from 'lucide-react';

const FacultyMarks = () => {
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
  
  const [assessmentType, setAssessmentType] = useState('Internal 1');
  const [maxMarks, setMaxMarks] = useState(40);
  const [marksData, setMarksData] = useState({}); // { studentId: { marks: 35, remarks: '' } }
  const [notification, setNotification] = useState('');
  const [saving, setSaving] = useState(false);

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

  // 2. Fetch Students and existing marks when Subject or Assessment Type changes
  useEffect(() => {
    if (!selectedSubject) return;

    const fetchMarksDetails = async () => {
      setLoading(true);
      try {
        // Fetch students enrolled
        const studentRes = await api.get(`/faculty/subjects/${selectedSubject}/students`);
        const fetchedStudents = studentRes.data.data || [];
        setStudents(fetchedStudents);

        // Fetch existing marks for this assessment
        const marksRes = await api.get('/faculty/marks', {
          params: { subjectId: selectedSubject, assessmentType }
        });
        const existingRecords = marksRes.data.data || [];

        // Map existing marks or fall back to empty
        const initialMarks = {};
        
        // Find if maxMarks was defined in any existing record to sync it
        if (existingRecords.length > 0) {
          setMaxMarks(existingRecords[0].maxMarks || 40);
        }

        fetchedStudents.forEach(s => {
          const match = existingRecords.find(r => r.student === s._id || r.student?._id === s._id);
          if (match) {
            initialMarks[s._id] = {
              marks: match.marksObtained !== undefined ? match.marksObtained : '',
              remarks: match.remarks || ''
            };
          } else {
            initialMarks[s._id] = { marks: '', remarks: '' };
          }
        });

        setMarksData(initialMarks);
      } catch (err) {
        console.error('Failed to fetch marks details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarksDetails();
  }, [selectedSubject, assessmentType]);

  const handleMarksChange = (studentId, value) => {
    // Prevent typing above max marks
    const numericVal = parseFloat(value);
    if (!isNaN(numericVal) && numericVal > maxMarks) {
      return; // Ignore values exceeding max marks
    }

    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marks: value
      }
    }));
  };

  const handleRemarksChange = (studentId, value) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: value
      }
    }));
  };

  const handleSaveMarks = async () => {
    // Validate values are below maxMarks
    for (const studentId of Object.keys(marksData)) {
      const marksVal = parseFloat(marksData[studentId].marks);
      if (!isNaN(marksVal) && marksVal > maxMarks) {
        return alert(`Marks obtained cannot exceed max marks of ${maxMarks}`);
      }
    }

    setSaving(true);
    try {
      const records = Object.keys(marksData)
        .filter(studentId => marksData[studentId].marks !== '')
        .map(studentId => ({
          studentId,
          marksObtained: Number(marksData[studentId].marks),
          remarks: marksData[studentId].remarks || ''
        }));

      if (records.length === 0) {
        setSaving(false);
        return alert('Please enter at least one marks record.');
      }

      const res = await api.post('/faculty/marks', {
        subjectId: selectedSubject,
        assessmentType,
        maxMarks: Number(maxMarks),
        records
      });

      if (res.data.success) {
        setNotification('Marks recorded successfully!');
        setTimeout(() => setNotification(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save marks.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900 pb-12">
      <Header title="Marks Entry Register" subtitle="Manage and record student evaluation marks" />

      {notification && (
        <div className="fixed top-20 right-6 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg font-bold z-50 flex items-center gap-2">
          <CheckCircle size={18} /> {notification}
        </div>
      )}

      <PageShell maxWidth="max-w-7xl">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Controls */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <label className="block text-xs font-semibold text-slate-500">
                <span>Select Subject</span>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="mt-1 bg-white border border-slate-250 text-slate-800 text-sm rounded-xl focus:ring-brand-500 block w-60 p-2.5 font-bold outline-none"
                >
                  <option value="">Select a Subject</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold text-slate-500">
                <span>Assessment Type</span>
                <select
                  value={assessmentType}
                  onChange={(e) => setAssessmentType(e.target.value)}
                  className="mt-1 bg-white border border-slate-250 text-slate-800 text-sm rounded-xl focus:ring-brand-500 block w-48 p-2.5 font-bold outline-none"
                >
                  {['Internal 1', 'Internal 2', 'Assignment', 'Practical', 'Viva', 'Mid Semester', 'End Semester'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold text-slate-500">
                <span>Max Marks Possible</span>
                <input
                  type="number"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(Number(e.target.value) || 0)}
                  className="mt-1 bg-white border border-slate-250 text-slate-800 text-sm rounded-xl focus:ring-brand-500 block w-24 p-2.5 font-bold outline-none"
                />
              </label>
            </div>

            <button
              onClick={handleSaveMarks}
              disabled={loading || saving || students.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-500/20 transition-all disabled:opacity-60 shrink-0"
            >
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              <span>Save Marks</span>
            </button>
          </div>

          {/* Table display */}
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
                    <th className="px-6 py-4">Marks Obtained</th>
                    <th className="px-6 py-4 w-1/3">Remarks / Feedback (Optional)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {students.map((student) => {
                    const studentMarks = marksData[student._id]?.marks || '';
                    return (
                      <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-500 text-xs font-bold">{student.rollNumber}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{student.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder={`/ ${maxMarks}`}
                              value={studentMarks}
                              onChange={(e) => handleMarksChange(student._id, e.target.value)}
                              className="bg-white border border-slate-250 rounded-xl px-4 py-2 text-sm focus:ring-brand-500 block w-28 font-bold outline-none"
                            />
                            <span className="text-xs text-slate-400 font-semibold">/ {maxMarks}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={marksData[student._id]?.remarks || ''}
                            onChange={(e) => handleRemarksChange(student._id, e.target.value)}
                            placeholder="e.g. Excellent presentation, Needs review"
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs w-full focus:outline-none focus:border-brand-500 font-medium"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageShell>
    </div>
  );
};

export default FacultyMarks;
