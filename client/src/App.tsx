import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useFinOpsStore } from "@/lib/finops-store";
import ProviderSelect from "@/pages/provider-select";
import Login from "@/pages/login";
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
import Anomalies from "@/pages/anomalies";
import SavingsPlans from "@/pages/savings-plans";
import Forecasting from "@/pages/forecasting";
import Tagging from "@/pages/tagging";
import UnitEconomics from "@/pages/unit-economics";
import Waste from "@/pages/waste";
import NotFound from "@/pages/not-found";
import { FinOpsAssistant } from "@/components/finops-assistant";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 h-[calc(100vh-4rem)] overflow-hidden">
          {children}
        </main>
      </div>
      <FinOpsAssistant />
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useFinOpsStore();
  const [location] = useLocation();

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

function DashboardRouter() {
  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/resources" component={Resources} />
      <Route path="/recommendations" component={Recommendations} />
      <Route path="/tenants" component={Tenants} />
      <Route path="/budgets" component={Budgets} />
      <Route path="/allocation" component={Allocation} />
      <Route path="/reports" component={Reports} />
      <Route path="/settings" component={Settings} />
      <Route path="/help" component={Help} />
      <Route path="/anomalies" component={Anomalies} />
      <Route path="/savings-plans" component={SavingsPlans} />
      <Route path="/forecasting" component={Forecasting} />
      <Route path="/tagging" component={Tagging} />
      <Route path="/unit-economics" component={UnitEconomics} />
      <Route path="/waste" component={Waste} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/" component={ProviderSelect} />
          <Route path="/login">
            <Login />
          </Route>
          <Route>
            <AuthGuard>
              <DashboardLayout>
                <DashboardRouter />
              </DashboardLayout>
            </AuthGuard>
          </Route>
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;