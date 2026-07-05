import React from 'react';
import Header from '../components/Header';
import { PageShell } from '../components/AdminUI';
import AssessmentCreator from '../components/AssessmentCreator';

const FacultyCreateAssessment = () => {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 text-slate-900">
      <Header title="Create Assessment" />
      <PageShell maxWidth="max-w-7xl">
        <AssessmentCreator />
      </PageShell>
    </div>
  );
};

export default FacultyCreateAssessment;
