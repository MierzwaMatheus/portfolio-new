import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
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
import AdminAbout from "./pages/admin/About";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { I18nProvider } from "./i18n/context/I18nContext";
import Resume from "./pages/Resume";
import Portfolio from "./pages/Portfolio";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Proposal from "./pages/Proposal";
import ProposalAccept from "./pages/ProposalAccept";
import About from "./pages/About";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Layout } from "./components/Layout";
import { PublicRoute } from "./components/PublicRoute";

function Router() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <Switch>
        <Route path="/admin/dashboard">
          <ProtectedRoute component={Dashboard} allowedRoles={['root', 'admin']} />
        </Route>
        <Route path="/admin">
          <ProtectedRoute component={Dashboard} allowedRoles={['root', 'admin']} />
        </Route>
        <Route path="/admin/projects">
          <ProtectedRoute component={AdminProjects} allowedRoles={['root', 'admin']} />
        </Route>
        <Route path="/admin/blog">
          <ProtectedRoute component={AdminBlog} allowedRoles={['root', 'admin']} />
        </Route>
        <Route path="/admin/resume">
          <ProtectedRoute component={AdminResume} allowedRoles={['root', 'admin']} />
        </Route>
        <Route path="/admin/home">
          <ProtectedRoute component={AdminHome} allowedRoles={['root', 'admin']} />
        </Route>
        <Route path="/admin/about">
          <ProtectedRoute component={AdminAbout} allowedRoles={['root', 'admin']} />
        </Route>
        <Route path="/admin/contact">
          <ProtectedRoute component={AdminContact} allowedRoles={['root', 'admin']} />
        </Route>
        <Route path="/admin/proposals">
          <ProtectedRoute component={AdminProposals} allowedRoles={['root', 'admin', 'proposal-editor']} />
        </Route>
        <Route path="/admin/payment-links">
          <ProtectedRoute component={AdminPaymentLinks} allowedRoles={['root', 'admin']} />
        </Route>
        <Route path="/admin/users/new">
          <ProtectedRoute component={AdminCreateUser} allowedRoles={['root']} />
        </Route>
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path={"/"}>
          <PublicRoute>
            <Home />
          </PublicRoute>
        </Route>
        <Route path={"/login"} component={Login} />
        <Route path="/sobre">
          <PublicRoute>
            <About />
          </PublicRoute>
        </Route>
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
