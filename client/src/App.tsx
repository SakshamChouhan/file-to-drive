import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import EditorPage from "@/pages/editor-page";
import { AuthProvider } from "@/contexts/auth-context";
import { EditorProvider } from "@/contexts/editor-context";
import { useAuth } from "@/hooks/use-auth";

function PrivateRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/editor/:id?">
        {params => <PrivateRoute component={EditorPage} id={params.id} />}
      </Route>
      <Route path="/dashboard">
        <PrivateRoute component={Dashboard} />
      </Route>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EditorProvider>
          <Router />
          <Toaster />
        </EditorProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
