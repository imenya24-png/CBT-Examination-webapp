// vite.config.js
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
var vite_config_default = defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "index.html",
        exam: "exam.html",
        result: "result.html",
        "student-login": "student-login.html",
        "student-register": "student-register.html",
        "admin-login": "admin-login.html",
        "admin-dashboard": "admin-dashboard.html",
        "admin-students": "admin-students.html",
        "admin-questions": "admin-questions.html",
        "admin-results": "admin-results.html",
        "admin-sessions": "admin-sessions.html",
        "admin-violations": "admin-violations.html",
        "admin-settings": "admin-settings.html",
        "admin-logs": "admin-logs.html",
        "admin-attendance": "admin-attendance.html",
        "admin-attendance-report": "admin-attendance-report.html"
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBpbnB1dDoge1xuICAgICAgICBtYWluOiAnaW5kZXguaHRtbCcsXG4gICAgICAgIGV4YW06ICdleGFtLmh0bWwnLFxuICAgICAgICByZXN1bHQ6ICdyZXN1bHQuaHRtbCcsXG4gICAgICAgICdzdHVkZW50LWxvZ2luJzogJ3N0dWRlbnQtbG9naW4uaHRtbCcsXG4gICAgICAgICdzdHVkZW50LXJlZ2lzdGVyJzogJ3N0dWRlbnQtcmVnaXN0ZXIuaHRtbCcsXG4gICAgICAgICdhZG1pbi1sb2dpbic6ICdhZG1pbi1sb2dpbi5odG1sJyxcbiAgICAgICAgJ2FkbWluLWRhc2hib2FyZCc6ICdhZG1pbi1kYXNoYm9hcmQuaHRtbCcsXG4gICAgICAgICdhZG1pbi1zdHVkZW50cyc6ICdhZG1pbi1zdHVkZW50cy5odG1sJyxcbiAgICAgICAgJ2FkbWluLXF1ZXN0aW9ucyc6ICdhZG1pbi1xdWVzdGlvbnMuaHRtbCcsXG4gICAgICAgICdhZG1pbi1yZXN1bHRzJzogJ2FkbWluLXJlc3VsdHMuaHRtbCcsXG4gICAgICAgICdhZG1pbi1zZXNzaW9ucyc6ICdhZG1pbi1zZXNzaW9ucy5odG1sJyxcbiAgICAgICAgJ2FkbWluLXZpb2xhdGlvbnMnOiAnYWRtaW4tdmlvbGF0aW9ucy5odG1sJyxcbiAgICAgICAgJ2FkbWluLXNldHRpbmdzJzogJ2FkbWluLXNldHRpbmdzLmh0bWwnLFxuICAgICAgICAnYWRtaW4tbG9ncyc6ICdhZG1pbi1sb2dzLmh0bWwnLFxuICAgICAgICAnYWRtaW4tYXR0ZW5kYW5jZSc6ICdhZG1pbi1hdHRlbmRhbmNlLmh0bWwnLFxuICAgICAgICAnYWRtaW4tYXR0ZW5kYW5jZS1yZXBvcnQnOiAnYWRtaW4tYXR0ZW5kYW5jZS1yZXBvcnQuaHRtbCcsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFFdFAsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsT0FBTztBQUFBLFFBQ0wsTUFBTTtBQUFBLFFBQ04sTUFBTTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsaUJBQWlCO0FBQUEsUUFDakIsb0JBQW9CO0FBQUEsUUFDcEIsZUFBZTtBQUFBLFFBQ2YsbUJBQW1CO0FBQUEsUUFDbkIsa0JBQWtCO0FBQUEsUUFDbEIsbUJBQW1CO0FBQUEsUUFDbkIsaUJBQWlCO0FBQUEsUUFDakIsa0JBQWtCO0FBQUEsUUFDbEIsb0JBQW9CO0FBQUEsUUFDcEIsa0JBQWtCO0FBQUEsUUFDbEIsY0FBYztBQUFBLFFBQ2Qsb0JBQW9CO0FBQUEsUUFDcEIsMkJBQTJCO0FBQUEsTUFDN0I7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
