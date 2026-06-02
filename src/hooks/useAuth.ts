// Re-export from the AuthContext so the whole app shares a single
// onAuthStateChanged listener and one source of truth for auth state.
export { useAuth } from '@/context/AuthContext';
