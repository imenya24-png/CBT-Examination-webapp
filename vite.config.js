import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        exam: 'exam.html',
        result: 'result.html',
        'student-login': 'student-login.html',
        'student-register': 'student-register.html',
        'admin-login': 'admin-login.html',
        'admin-dashboard': 'admin-dashboard.html',
        'admin-students': 'admin-students.html',
        'admin-questions': 'admin-questions.html',
        'admin-results': 'admin-results.html',
        'admin-sessions': 'admin-sessions.html',
        'admin-violations': 'admin-violations.html',
        'admin-settings': 'admin-settings.html',
        'admin-logs': 'admin-logs.html',
        'admin-attendance': 'admin-attendance.html',
        'admin-attendance-report': 'admin-attendance-report.html',
      },
    },
  },
});
