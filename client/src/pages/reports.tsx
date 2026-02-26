import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3,
  FileText,
  Download,
  Calendar,
  Clock,
  Plus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

const mockReports = [
  { id: '1', name: 'Monthly Cost Summary', type: 'Cost Analysis', schedule: 'Monthly', lastRun: '2024-01-01' },
  { id: '2', name: 'Resource Utilization Report', type: 'Utilization', schedule: 'Weekly', lastRun: '2024-01-03' },
  { id: '3', name: 'Optimization Opportunities', type: 'Recommendations', schedule: 'Daily', lastRun: '2024-01-05' },
  { id: '4', name: 'Tenant Cost Breakdown', type: 'Cost Allocation', schedule: 'Monthly', lastRun: '2024-01-01' },
  { id: '5', name: 'Budget vs Actual', type: 'Budget', schedule: 'Weekly', lastRun: '2024-01-04' },
];

export default function Reports() {
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
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
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
                <BarChart3 className="h-5 w-5 text-primary" />
                Scheduled Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockReports.map((report, index) => (
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
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{report.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="secondary" className="text-xs">{report.type}</Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{report.schedule}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>Last: {report.lastRun}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="ghost" size="sm">
                          Run Now
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
    </ScrollArea>
  );
}
