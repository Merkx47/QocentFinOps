import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  IconChartBar,
  IconFileDescription,
  IconDownload,
  IconCalendarEvent,
  IconClock,
  IconPlus,
  IconLoader2,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFinOpsStore } from '@/lib/finops-store';
import { useToast } from '@/hooks/use-toast';
import { getProviderConfig } from '@/lib/provider-config';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { downloadCsv } from '@/lib/csv-utils';

interface Report {
  id: string;
  name: string;
  type: string;
  schedule: string;
  lastRun: string;
  status: string;
}

function useReports(): Report[] {
  const { selectedProvider } = useFinOpsStore();
  const config = getProviderConfig(selectedProvider);
  return [
    { id: '1', name: `Monthly ${config.shortName} Cost Summary`, type: 'Cost Analysis', schedule: 'Monthly', lastRun: '2024-01-01', status: 'Completed' },
    { id: '2', name: 'Resource Utilization Report', type: 'Utilization', schedule: 'Weekly', lastRun: '2024-01-03', status: 'Completed' },
    { id: '3', name: 'Optimization Opportunities', type: 'Recommendations', schedule: 'Daily', lastRun: '2024-01-05', status: 'Completed' },
    { id: '4', name: `${config.hierarchy.orgUnitLabel} Cost Breakdown`, type: 'Cost Allocation', schedule: 'Monthly', lastRun: '2024-01-01', status: 'Completed' },
    { id: '5', name: 'Budget vs Actual', type: 'Budget', schedule: 'Weekly', lastRun: '2024-01-04', status: 'Completed' },
  ];
}

const REPORT_TYPES = ['Cost Analysis', 'Utilization', 'Recommendations', 'Budget', 'Cost Allocation'] as const;
const SCHEDULE_OPTIONS = ['Daily', 'Weekly', 'Monthly'] as const;

export default function Reports() {
  const standardReports = useReports();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [customReports, setCustomReports] = useState<Report[]>([]);
  const [form, setForm] = useState({ name: '', type: '', schedule: '' });
  const [runningReportId, setRunningReportId] = useState<string | null>(null);

  const allReports = [...standardReports, ...customReports];

  function handleCreateReport() {
    if (!form.name || !form.type || !form.schedule) {
      toast({ title: 'Validation Error', description: 'Please fill in all fields.' });
      return;
    }
    const newReport: Report = {
      id: `custom-${Date.now()}`,
      name: form.name,
      type: form.type,
      schedule: form.schedule,
      lastRun: 'Never',
      status: 'Pending',
    };
    setCustomReports(prev => [...prev, newReport]);
    setForm({ name: '', type: '', schedule: '' });
    setDialogOpen(false);
    toast({ title: 'Report Created', description: `"${newReport.name}" has been added to your scheduled reports.` });
  }

  function handleDownload(report: Report) {
    const headers = ['Name', 'Type', 'Schedule', 'Last Run', 'Status'];
    const rows = [[report.name, report.type, report.schedule, report.lastRun, report.status]];
    downloadCsv(`${report.name.replace(/\s+/g, '_')}.csv`, headers, rows);
    toast({ title: 'Download Started', description: `"${report.name}" has been downloaded as CSV.` });
  }

  function handleRunNow(report: Report) {
    setRunningReportId(report.id);
    setTimeout(() => {
      setRunningReportId(null);
      const now = new Date().toLocaleString();
      toast({ title: 'Report Complete', description: `"${report.name}" finished at ${now}.` });
    }, 1500);
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1920px] mx-auto" data-testid="reports-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generate and schedule cost reports
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setDialogOpen(true)}>
            <IconPlus className="h-4 w-4 mr-2" />
            Create Report
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <IconChartBar className="h-5 w-5 text-primary" />
                Scheduled Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allReports.map((report, index) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 * index }}
                    className="p-4 rounded-lg border border-border bg-background/50 hover-elevate"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <IconFileDescription className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{report.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="secondary" className="text-xs">{report.type}</Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <IconCalendarEvent className="h-3 w-3" />
                              <span>{report.schedule}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <IconClock className="h-3 w-3" />
                              <span>Last: {report.lastRun}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleDownload(report)}>
                          <IconDownload className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={runningReportId === report.id}
                          onClick={() => handleRunNow(report)}
                        >
                          {runningReportId === report.id ? (
                            <>
                              <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                              Running...
                            </>
                          ) : (
                            'Run Now'
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Create Report Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="report-name">Report Name</Label>
              <Input
                id="report-name"
                placeholder="Enter report name"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={form.type} onValueChange={value => setForm(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Schedule</Label>
              <Select value={form.schedule} onValueChange={value => setForm(prev => ({ ...prev, schedule: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateReport}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}
