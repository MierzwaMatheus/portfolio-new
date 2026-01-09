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
import AdminCreateUser from "./pages/admin/CreateUser";
import AdminPaymentLinks from "./pages/admin/PaymentLinks";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { I18nProvider } from "./i18n/context/I18nContext";
import Resume from "./pages/Resume";
import Portfolio from "./pages/Portfolio";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Proposal from "./pages/Proposal";
import ProposalAccept from "./pages/ProposalAccept";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Layout } from "./components/Layout";
import { PublicRoute } from "./components/PublicRoute";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path={"/"}>
          <PublicRoute>
            <Home />
          </PublicRoute>
        </Route>
        <Route path={"/login"} component={Login} />

      {/* Admin Routes */}
      <ProtectedRoute path="/admin/dashboard" component={Dashboard} allowedRoles={['root', 'admin']} />
      <ProtectedRoute path="/admin" component={Dashboard} allowedRoles={['root', 'admin']} />
      <ProtectedRoute path="/admin/projects" component={AdminProjects} allowedRoles={['root', 'admin']} />
      <ProtectedRoute path="/admin/blog" component={AdminBlog} allowedRoles={['root', 'admin']} />
      <ProtectedRoute path="/admin/resume" component={AdminResume} allowedRoles={['root', 'admin']} />
      <ProtectedRoute path="/admin/home" component={AdminHome} allowedRoles={['root', 'admin']} />
      <ProtectedRoute path="/admin/contact" component={AdminContact} allowedRoles={['root', 'admin']} />
      <ProtectedRoute path="/admin/proposals" component={AdminProposals} allowedRoles={['root', 'admin', 'proposal-editor']} />
      <ProtectedRoute path="/admin/payment-links" component={AdminPaymentLinks} allowedRoles={['root', 'admin']} />
      <ProtectedRoute path="/admin/users/new" component={AdminCreateUser} allowedRoles={['root']} />

      {/* Public Routes */}
      <Route path="/curriculo">
        <PublicRoute>
          <Resume />
        </PublicRoute>
      </Route>
      <Route path="/portfolio">
        <PublicRoute>
          <Portfolio />
        </PublicRoute>
      </Route>
      <Route path="/blog">
        <PublicRoute>
          <Blog />
        </PublicRoute>
      </Route>
      <Route path="/blog/:slug">
        <PublicRoute>
          <BlogPost />
        </PublicRoute>
      </Route>
      <Route path="/proposta/:id">
        <PublicRoute>
          <Proposal />
        </PublicRoute>
      </Route>
      <Route path="/proposta/:slug/aceitar">
        <PublicRoute>
          <ProposalAccept />
        </PublicRoute>
      </Route>

      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <I18nProvider>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <Router />
            <Analytics />
            <SpeedInsights />
          </TooltipProvider>
        </ThemeProvider>
        </I18nProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
