import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import AdminProjects from "./pages/admin/Projects";
import AdminBlog from "./pages/admin/Blog";
import AdminResume from "./pages/admin/Resume";
import AdminHome from "./pages/admin/Home";
import AdminContact from "./pages/admin/Contact";
import AdminProposals from "./pages/admin/Proposals";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Resume from "./pages/Resume";
import Portfolio from "./pages/Portfolio";
import Blog from "./pages/Blog";
import Proposal from "./pages/Proposal";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      
      {/* Admin Routes */}
      <ProtectedRoute path="/admin/dashboard" component={Dashboard} />
      <ProtectedRoute path="/admin" component={Dashboard} />
      <ProtectedRoute path="/admin/projects" component={AdminProjects} />
      <ProtectedRoute path="/admin/blog" component={AdminBlog} />
      <ProtectedRoute path="/admin/resume" component={AdminResume} />
      <ProtectedRoute path="/admin/home" component={AdminHome} />
      <ProtectedRoute path="/admin/contact" component={AdminContact} />
      <ProtectedRoute path="/admin/proposals" component={AdminProposals} />
      
      {/* Public Routes */}
      <Route path="/curriculo" component={Resume} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/blog" component={Blog} />
      <Route path="/proposta/:id" component={Proposal} />
      
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
