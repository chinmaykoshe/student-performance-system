import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../context/AuthContext';
import Header from '../components/Header';
import { PageShell } from '../components/AdminUI';
import { BookOpen, Users, CheckCircle, Edit3, Calendar, Save, AlertCircle } from 'lucide-react';

const FacultyDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({}); // { studentId: 'Present' }
  
  // Marks State
  const [assessmentType, setAssessmentType] = useState('Internal 1');
  const [maxMarks, setMaxMarks] = useState(40);
  const [marksData, setMarksData] = useState({}); // { studentId: { marks: 35, remarks: '' } }

  const [notification, setNotification] = useState('');

  // 1. Fetch Assigned Subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/faculty/my-subjects');
        setSubjects(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedSubject(res.data.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to fetch subjects:', err);
      }
      setLoading(false);
    };
    fetchSubjects();
  }, []);

  // 2. Fetch Students for Selected Subject
  useEffect(() => {
    if (!selectedSubject) return;
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/faculty/subjects/${selectedSubject}/students`);
        setStudents(res.data.data);
        
        // Initialize attendance and marks data shapes
        const initialAttendance = {};
        const initialMarks = {};
        res.data.data.forEach(s => {
          initialAttendance[s._id] = 'Present'; // Default to present
          initialMarks[s._id] = { marks: '', remarks: '' };
        });
        setAttendanceData(initialAttendance);
        setMarksData(initialMarks);
      } catch (err) {
        console.error('Failed to fetch students:', err);
      }
      setLoading(false);
    };
    fetchStudents();
  }, [selectedSubject]);

  // Handle Submissions
  const submitAttendance = async () => {
    try {
      const records = Object.keys(attendanceData).map(studentId => ({
        studentId,
        status: attendanceData[studentId],
        remarks: ''
      }));
      await api.post('/faculty/attendance', {
        subjectId: selectedSubject,
        date: attendanceDate,
        records
      });
      setNotification('Attendance saved successfully!');
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      alert('Error saving attendance');
    }
  };

  const submitMarks = async () => {
    try {
      const records = Object.keys(marksData)
        .filter(id => marksData[id].marks !== '')
        .map(studentId => ({
          studentId,
          marksObtained: Number(marksData[studentId].marks),
          remarks: marksData[studentId].remarks
        }));
        
      if (records.length === 0) return alert('No marks entered.');

      await api.post('/faculty/marks', {
        subjectId: selectedSubject,
        assessmentType,
        maxMarks: Number(maxMarks),
        records
      });
      setNotification('Marks saved successfully!');
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      alert('Error saving marks');
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {subjects.map(sub => (
        <div key={sub._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 mb-4">
            <BookOpen size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">{sub.name}</h3>
          <p className="text-sm text-slate-500 mb-4">{sub.code} • Sem {sub.semesterNumber}</p>
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
            <span className="text-slate-500 flex items-center gap-1"><Users size={14}/> {sub.course?.name || 'Assigned'}</span>
            <button 
              onClick={() => { setSelectedSubject(sub._id); setActiveTab('attendance'); }}
              className="text-brand-600 font-semibold hover:text-brand-700"
            >
              Manage &rarr;
            </button>
          </div>
        </div>
      ))}
      {subjects.length === 0 && (
        <div className="col-span-full p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
          <AlertCircle className="mx-auto text-slate-400 mb-2" size={32} />
          <p className="text-slate-500">No subjects assigned yet.</p>
        </div>
      )}
    </div>
  );

  const renderAttendance = () => (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-280px)]">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
            <select 
              className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-brand-500 focus:border-brand-500 block w-full p-2.5 font-medium"
              value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
            <input 
              type="date" 
              className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-brand-500 focus:border-brand-500 block w-full p-2.5 font-medium"
              value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)}
            />
          </div>
        </div>
        <button onClick={submitAttendance} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-brand-500/20 transition-all">
          <Save size={16} /> Save Attendance
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-0">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white shadow-sm z-10">
            <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <th className="px-6 py-4">Roll No</th>
              <th className="px-6 py-4">Student Name</th>
              <th className="px-6 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {students.map(student => (
              <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-slate-500">{student.rollNumber}</td>
                <td className="px-6 py-4 font-semibold text-slate-900">{student.name}</td>
                <td className="px-6 py-4 text-right">
                  <div className="inline-flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                    {['Present', 'Absent', 'Late', 'Excused'].map(status => (
                      <button
                        key={status}
                        onClick={() => setAttendanceData({...attendanceData, [student._id]: status})}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                          attendanceData[student._id] === status 
                            ? status === 'Present' ? 'bg-emerald-500 text-white shadow-sm'
                            : status === 'Absent' ? 'bg-rose-500 text-white shadow-sm'
                            : 'bg-slate-800 text-white shadow-sm'
                            : 'text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-400">No students enrolled in this subject.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMarks = () => (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-280px)]">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between shrink-0">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
            <select 
              className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-brand-500 focus:border-brand-500 block w-full p-2.5 font-medium"
              value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assessment</label>
            <select 
              className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-brand-500 focus:border-brand-500 block w-full p-2.5 font-medium"
              value={assessmentType} onChange={(e) => setAssessmentType(e.target.value)}
            >
              {['Internal 1', 'Internal 2', 'Assignment', 'Practical', 'Viva', 'Mid Semester', 'End Semester'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Max Marks</label>
            <input 
              type="number" 
              className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-brand-500 focus:border-brand-500 block w-24 p-2.5 font-medium"
              value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)}
            />
          </div>
        </div>
        <button onClick={submitMarks} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-brand-500/20 transition-all">
          <Save size={16} /> Save Marks
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-0">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white shadow-sm z-10">
            <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
              <th className="px-6 py-4">Roll No</th>
              <th className="px-6 py-4">Student Name</th>
              <th className="px-6 py-4">Marks Obtained</th>
              <th className="px-6 py-4 w-1/3">Remarks (Optional)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {students.map(student => (
              <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-slate-500">{student.rollNumber}</td>
                <td className="px-6 py-4 font-semibold text-slate-900">{student.name}</td>
                <td className="px-6 py-4">
                  <input 
                    type="number"
                    max={maxMarks}
                    min={0}
                    placeholder={`/ ${maxMarks}`}
                    value={marksData[student._id]?.marks || ''}
                    onChange={(e) => setMarksData({...marksData, [student._id]: {...marksData[student._id], marks: e.target.value}})}
                    className="bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block w-24 p-2 font-bold"
                  />
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="text"
                    placeholder="e.g. Good progress"
                    value={marksData[student._id]?.remarks || ''}
                    onChange={(e) => setMarksData({...marksData, [student._id]: {...marksData[student._id], remarks: e.target.value}})}
                    className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block w-full p-2"
                  />
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400">No students enrolled in this subject.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 text-slate-900">
      <Header title="Faculty Workspace" subtitle={`Welcome back, ${profile?.name || 'Professor'}`} />
      
      {notification && (
        <div className="fixed top-20 right-6 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg font-bold z-50 animate-fade-in flex items-center gap-2">
          <CheckCircle size={18} /> {notification}
        </div>
      )}

      <PageShell maxWidth="max-w-7xl" className="flex-1 flex flex-col overflow-hidden pb-6">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl w-fit space-x-1 border border-slate-200 mb-6 shrink-0">
          {[
            { id: 'overview', label: 'Overview', icon: <BookOpen size={16} /> },
            { id: 'attendance', label: 'Attendance Register', icon: <Calendar size={16} /> },
            { id: 'marks', label: 'Marks Entry', icon: <Edit3 size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0">
          {loading && activeTab === 'overview' ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'attendance' && renderAttendance()}
              {activeTab === 'marks' && renderMarks()}
            </>
          )}
        </div>
      </PageShell>
    </div>
  );
};

export default FacultyDashboard;
