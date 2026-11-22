import React from 'react';
import { BarChart3, Sparkles, Clock, Layers, Users, Award } from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';

export default function TeacherReports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assessment Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical student scores, submission timestamps, and question-level performance
          </p>
        </div>

        <Badge variant="blue" size="sm" icon={Sparkles}>
          Phase 4 Preview
        </Badge>
      </div>

      <Card className="border-slate-200 text-center py-16 px-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-sm border border-blue-100">
          <BarChart3 className="w-8 h-8" />
        </div>

        <h2 className="text-lg font-bold text-slate-900 mb-2">Reports Unlocking Soon</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
          Comprehensive gradebooks, question difficulty indices, and exportable CSV analytics will be
          populated as students attend and submit scheduled assessments in Phase 4.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <Users className="w-5 h-5 text-blue-600 mb-2" />
            <h4 className="text-xs font-bold text-slate-900">Student Rosters</h4>
            <p className="text-[11px] text-slate-500 mt-1">Track individual participant attendance and completion times.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <Award className="w-5 h-5 text-emerald-600 mb-2" />
            <h4 className="text-xs font-bold text-slate-900">Score Distributions</h4>
            <p className="text-[11px] text-slate-500 mt-1">Pass/fail ratios, bell curves, and standard deviations.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <Layers className="w-5 h-5 text-indigo-600 mb-2" />
            <h4 className="text-xs font-bold text-slate-900">Item Analysis</h4>
            <p className="text-[11px] text-slate-500 mt-1">Discrimination index and question accuracy breakdown.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
