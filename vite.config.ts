import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// Import but don't use for now to avoid React.Fragment errors
// import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Temporarily disabled to fix React.Fragment errors
    // mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
