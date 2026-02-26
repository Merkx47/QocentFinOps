import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import Dashboard from "@/pages/dashboard";
import Analytics from "@/pages/analytics";
import Resources from "@/pages/resources";
import Recommendations from "@/pages/recommendations";
import Tenants from "@/pages/tenants";
import Budgets from "@/pages/budgets";
import Allocation from "@/pages/allocation";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Help from "@/pages/help";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/resources" component={Resources} />
      <Route path="/recommendations" component={Recommendations} />
      <Route path="/tenants" component={Tenants} />
      <Route path="/budgets" component={Budgets} />
      <Route path="/allocation" component={Allocation} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/help" component={Help} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 h-[calc(100vh-4rem)] overflow-hidden">
              <Router />
            </main>
          </div>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
