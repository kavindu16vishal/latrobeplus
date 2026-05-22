import React from 'react';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, Info, CheckCircle2, AlertCircle, Database } from 'lucide-react';

const REQUIRED_COLUMNS = [
  { col: 'student_id', example: 'STU0001', note: 'Must match an existing student account' },
  { col: 'subject_code', example: 'CSE1', note: 'e.g. CSE1, NET1, PRO1, DAT1, SWE1' },
  { col: 'assessment_type', example: 'Assignment', note: 'Assignment, Quiz, Exam, or Project' },
  { col: 'score', example: '72.5', note: 'Numeric 0–100' },
  { col: 'feedback_comment', example: 'Good effort on…', note: 'Optional — used by AI insights' },
];

const STEPS = [
  { step: '1', title: 'Prepare your Excel file', detail: 'Create an .xlsx file with the required columns listed below. Each row is one assessment result.' },
  { step: '2', title: 'Run the seed script', detail: 'From the backend directory run: npm run seed -- --file=<path-to-your-file.xlsx>' },
  { step: '3', title: 'Restart the server', detail: 'Stop and restart the backend server to allow the schema auto-migration to run.' },
  { step: '4', title: 'Verify data', detail: 'Log in as a student to confirm their WAM and subject scores appear on the dashboard.' },
];

const DataManagement: React.FC = () => (
  <div className="space-y-6 max-w-4xl mx-auto">

    {/* Header */}
    <div className="flex items-center gap-4">
      <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-2xl">
        <Database className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Management</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Upload and manage student assessment data via the backend seeder.</p>
      </div>
    </div>

    {/* Info banner */}
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5"
    >
      <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-blue-800 dark:text-blue-300 text-sm mb-1">About dataset uploads</p>
        <p className="text-blue-700 dark:text-blue-400 text-sm leading-relaxed">
          Student results are loaded via the backend seed script, not through the browser. This ensures data integrity and prevents accidental overwrites.
          Once seeded, all dashboards update automatically — no restart required for data changes.
        </p>
      </div>
    </motion.div>

    {/* How-to steps */}
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
      className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-5">
        <Upload className="h-5 w-5 text-indigo-500" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">How to upload a dataset</h3>
      </div>
      <div className="space-y-4">
        {STEPS.map(s => (
          <div key={s.step} className="flex items-start gap-4">
            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {s.step}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.title}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{s.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>

    {/* Required columns */}
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-5">
        <FileSpreadsheet className="h-5 w-5 text-green-500" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Required Excel columns</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="text-left py-2 pr-4 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Column</th>
              <th className="text-left py-2 pr-4 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Example</th>
              <th className="text-left py-2 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {REQUIRED_COLUMNS.map(r => (
              <tr key={r.col}>
                <td className="py-3 pr-4">
                  <code className="bg-gray-100 dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-xs font-mono">
                    {r.col}
                  </code>
                </td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-400 font-mono text-xs">{r.example}</td>
                <td className="py-3 text-gray-500 dark:text-gray-400">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>

    {/* Validation rules */}
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <p className="font-semibold text-green-800 dark:text-green-300 text-sm">The seeder will</p>
        </div>
        <ul className="space-y-1.5 text-sm text-green-700 dark:text-green-400">
          <li>• Skip rows with unrecognised student IDs</li>
          <li>• Create subject records if they don't exist</li>
          <li>• Update existing results (upsert behaviour)</li>
          <li>• Auto-generate AI recommendations after seeding</li>
        </ul>
      </div>
      <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          <p className="font-semibold text-orange-800 dark:text-orange-300 text-sm">Common errors</p>
        </div>
        <ul className="space-y-1.5 text-sm text-orange-700 dark:text-orange-400">
          <li>• Score outside 0–100 range → row skipped</li>
          <li>• Missing required columns → import aborted</li>
          <li>• Non-numeric score value → row skipped</li>
          <li>• student_id not in the users table → row skipped</li>
        </ul>
      </div>
    </motion.div>

  </div>
);

export default DataManagement;
