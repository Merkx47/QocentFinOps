import { useState, useRef, useEffect } from 'react';
import { IconMessageChatbot, IconX, IconSend } from '@tabler/icons-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFinOpsStore } from '@/lib/finops-store';
import { getProviderConfig, type CloudProvider } from '@/lib/provider-config';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const suggestedQuestions = [
  'How can I reduce costs?',
  'What are savings plans?',
  'How does anomaly detection work?',
  'Tagging best practices',
];

function getAssistantResponse(question: string, provider: CloudProvider): string {
  const q = question.toLowerCase();
  const config = getProviderConfig(provider);
  const { shortName, terminology } = config;

  if (q.includes('cost') || q.includes('spend') || q.includes('optimize') || q.includes('reduce')) {
    const tips: Record<CloudProvider, string> = {
      aws: `Here are key cost optimization strategies for AWS:\n\n1. **Right-size EC2 instances** — Use AWS Compute Optimizer to identify underutilized instances and downsize them.\n2. **Purchase Savings Plans** — Commit to consistent usage for up to 72% savings on compute.\n3. **Use S3 Intelligent-Tiering** — Automatically moves data to the most cost-effective tier.\n4. **Enable AWS Cost Anomaly Detection** — Get alerts when spending deviates from expected patterns.\n5. **Clean up idle resources** — Terminate unused EC2 instances, delete unattached EBS volumes, and release unused Elastic IPs.\n\nVisit the Recommendations page in your dashboard for personalized suggestions.`,
      azure: `Here are key cost optimization strategies for Azure:\n\n1. **Right-size Virtual Machines** — Use Azure Advisor to find underutilized VMs and resize them.\n2. **Apply Azure Hybrid Benefit** — Use existing Windows Server or SQL Server licenses to save up to 40%.\n3. **Purchase Reserved Instances** — Commit to 1 or 3-year terms for up to 72% savings.\n4. **Use Azure Spot VMs** — Run interruptible workloads at up to 90% discount.\n5. **Move storage to Cool or Archive tiers** — Reduce blob storage costs for infrequently accessed data.\n\nCheck your Recommendations page for tailored optimization opportunities.`,
      gcp: `Here are key cost optimization strategies for GCP:\n\n1. **Right-size Compute Engine instances** — Use the Recommender API to identify oversized VMs.\n2. **Purchase Committed Use Discounts (CUDs)** — Save up to 57% with 1 or 3-year commitments.\n3. **Leverage Sustained Use Discounts** — Automatic discounts for running instances more than 25% of the month.\n4. **Use Preemptible/Spot VMs** — Run fault-tolerant workloads at 60-91% discount.\n5. **Optimize BigQuery** — Use flat-rate pricing for predictable workloads and partition tables to reduce scan costs.\n\nExplore your Recommendations page for project-specific savings.`,
      huawei: `Here are key cost optimization strategies for Huawei Cloud:\n\n1. **Right-size ECS instances** — Analyze CPU and memory utilization to downsize oversized instances.\n2. **Purchase Reserved Instances** — Commit to 1-year terms for up to 40% savings on compute.\n3. **Optimize OBS storage classes** — Move cold data to Standard-IA or Archive for significant savings.\n4. **Consolidate NAT Gateways** — Reduce redundant networking components in your VPCs.\n5. **Use BSS Cost Center** — Set budgets and alerts to prevent cost overruns across tenants.\n\nHead to the Recommendations page for tenant-specific optimization advice.`,
    };
    return tips[provider];
  }

  if (q.includes('budget')) {
    return `**Budgeting Best Practices for ${shortName}:**\n\n1. **Set granular budgets** — Create budgets per ${config.hierarchy.orgUnitLabel.toLowerCase()}, service, and environment to track spending at every level.\n2. **Configure alerts** — Set threshold alerts at 50%, 80%, and 100% of budget to catch overruns early.\n3. **Use forecasted budgets** — Enable forecast-based alerts to predict if you'll exceed your budget before it happens.\n4. **Review monthly** — Schedule monthly budget reviews to adjust allocations based on actual usage trends.\n5. **Tag-based budgets** — Use cost allocation tags to create budgets for specific teams, projects, or cost centers.\n\nVisit the Budgets page to create and manage your budgets. The Budget Gauge on the dashboard shows your current utilization at a glance.`;
  }

  if (q.includes('anomaly') || q.includes('alert') || q.includes('spike')) {
    return `**Anomaly Detection in ${shortName}:**\n\nOur anomaly detection system uses statistical analysis to identify unusual spending patterns across your ${config.hierarchy.orgUnitLabelPlural.toLowerCase()}.\n\n**How it works:**\n1. We establish a baseline of your normal spending patterns over the past 30 days.\n2. Daily costs are compared against expected ranges using standard deviation analysis.\n3. When spending deviates significantly (>2σ), an anomaly is flagged.\n\n**Severity Levels:**\n- 🔴 **Critical** — Deviation exceeds 300% of expected cost. Immediate action required.\n- 🟠 **High** — Deviation between 200-300%. Investigate within 24 hours.\n- 🟡 **Warning** — Deviation between 100-200%. Monitor closely.\n\n**Common causes:** Auto-scaling events, misconfigured resources, data transfer spikes, or new deployments.\n\nCheck the Anomalies page for current alerts and historical anomaly trends.`;
  }

  if (q.includes('tag') || q.includes('tagging') || q.includes('compliance') || q.includes('label')) {
    const tagTerms: Record<CloudProvider, string> = {
      aws: 'AWS uses Tags (key-value pairs) applied via the AWS Console, CLI, or CloudFormation. Use AWS Organizations Tag Policies to enforce standards.',
      azure: 'Azure uses Tags applied via the Azure Portal, CLI, or ARM templates. Use Azure Policy to enforce required tags across subscriptions.',
      gcp: 'GCP uses Labels (key-value pairs) applied via the Console, gcloud CLI, or Terraform. Use Organization Policies for governance.',
      huawei: 'Huawei Cloud uses Tags applied via the Console or API. Use Tag Management Service (TMS) to manage and enforce tagging policies.',
    };
    return `**Tagging Best Practices for ${shortName}:**\n\n${tagTerms[provider]}\n\n**Recommended Tag Schema:**\n- \`Environment\` — prod, staging, dev, test\n- \`CostCenter\` — Finance department code for chargeback\n- \`Project\` — Project or application name\n- \`Owner\` — Team or individual responsible\n- \`Compliance\` — Regulatory requirements (e.g., PCI, HIPAA)\n- \`AutoShutdown\` — Whether the resource can be stopped off-hours\n\n**Compliance Tips:**\n1. Enforce mandatory tags before resource creation.\n2. Run weekly compliance reports to find untagged resources.\n3. Aim for >95% tag compliance across all ${config.hierarchy.orgUnitLabelPlural.toLowerCase()}.\n\nVisit the Tagging page to review your compliance status.`;
  }

  if (q.includes('saving') || q.includes('reserved') || q.includes('commitment') || q.includes('cud') || q.includes(' ri') || q.includes('discount')) {
    const savingsInfo: Record<CloudProvider, string> = {
      aws: `**AWS Savings Plans & Reserved Instances:**\n\n**Savings Plans** are flexible pricing models offering up to 72% savings:\n- **Compute Savings Plans** — Apply to any EC2, Fargate, or Lambda usage regardless of region, instance family, or OS.\n- **EC2 Instance Savings Plans** — Higher discounts but locked to a specific instance family and region.\n- **SageMaker Savings Plans** — Up to 64% off ML inference costs.\n\n**Reserved Instances (RIs):**\n- 1-year or 3-year terms for EC2, RDS, ElastiCache, Redshift, and OpenSearch.\n- All Upfront offers the biggest discount.\n\n**Recommendation:** Start with Compute Savings Plans for flexibility, then layer RIs for predictable workloads. Check the Savings Plans page for current coverage and opportunities.`,
      azure: `**Azure Reserved Instances & Savings:**\n\n**Reserved Instances** offer up to 72% savings:\n- Available for VMs, SQL Database, Cosmos DB, App Service, and more.\n- Choose 1-year or 3-year terms.\n- Exchange and cancellation policies provide flexibility.\n\n**Azure Hybrid Benefit:**\n- Use existing Windows Server or SQL Server licenses for up to 40% savings.\n- Combinable with RIs for up to 80% total savings.\n\n**Azure Spot VMs:**\n- Up to 90% discount for interruptible workloads like batch processing and CI/CD.\n\n**Recommendation:** Use Azure Advisor to identify RI opportunities. Combine Hybrid Benefit + RIs for maximum savings. Visit the Savings Plans page for detailed analysis.`,
      gcp: `**GCP Committed Use Discounts (CUDs):**\n\n**Committed Use Discounts** offer up to 57% savings:\n- **Resource-based CUDs** — Commit to vCPUs and memory for Compute Engine.\n- **Spend-based CUDs** — Commit to minimum spending for services like Cloud SQL, Cloud Run.\n- 1-year (37% off) or 3-year (55% off) terms.\n\n**Sustained Use Discounts (SUDs):**\n- Automatic discounts up to 30% for running VMs more than 25% of the month.\n- No commitment required — applied automatically.\n\n**Preemptible/Spot VMs:**\n- 60-91% discount for fault-tolerant batch workloads.\n\n**Recommendation:** Layer CUDs on top of SUDs for maximum savings. Use the Savings Plans page to analyze your commitment coverage.`,
      huawei: `**Huawei Cloud Reserved Instances & Savings:**\n\n**Reserved Instances** offer up to 40% savings:\n- Available for ECS, RDS, GaussDB, and other core services.\n- Choose 1-year or 3-year terms with different payment options.\n- All Upfront provides the maximum discount.\n\n**Yearly/Monthly Subscriptions:**\n- Subscription-based pricing for predictable workloads.\n- Discounts increase with longer commitment periods.\n\n**Spot Instances:**\n- Bid on unused capacity for significant discounts on non-critical workloads.\n\n**Recommendation:** Start with Reserved Instances for your stable production workloads, then evaluate yearly subscriptions for long-running services. Visit the Savings Plans page for coverage analysis.`,
    };
    return savingsInfo[provider];
  }

  if (q.includes('waste') || q.includes('idle') || q.includes('unused') || q.includes('zombie')) {
    return `**Waste Detection & Elimination for ${shortName}:**\n\nWaste typically accounts for 25-35% of cloud spending. Here's how to identify and eliminate it:\n\n**Common Waste Sources:**\n1. **Idle ${terminology.computeUnit}s** — Instances with <5% CPU utilization for 7+ days.\n2. **Unattached storage** — ${terminology.storageUnit}s and volumes not connected to any active resource.\n3. **Oversized resources** — Instances provisioned much larger than needed.\n4. **Zombie resources** — Load balancers, IPs, and snapshots left behind after decommissioning.\n5. **Non-production running 24/7** — Dev/test environments that should be scheduled.\n\n**Quick Wins:**\n- Terminate truly idle resources immediately.\n- Schedule dev/test environments to run only during business hours (save 65%).\n- Delete snapshots older than 90 days.\n- Right-size based on actual utilization data.\n\nVisit the Waste Detection page for a prioritized list of waste in your environment.`;
  }

  if (q.includes('forecast') || q.includes('predict') || q.includes('projection')) {
    return `**Cost Forecasting for ${shortName}:**\n\nOur forecasting engine uses historical spending data to predict future costs:\n\n**Methodology:**\n1. **Trend Analysis** — Identifies upward/downward spending trends over the past 30-90 days.\n2. **Seasonality Detection** — Accounts for weekly patterns (e.g., lower weekend usage) and monthly cycles.\n3. **Growth Rate Modeling** — Projects costs based on resource growth and usage patterns.\n\n**Forecast Outputs:**\n- **7-day forecast** — Short-term prediction with high confidence.\n- **30-day forecast** — Monthly spending projection.\n- **90-day forecast** — Quarterly outlook for budget planning.\n\n**Using Forecasts Effectively:**\n- Compare forecasts against budgets to predict overruns.\n- Use forecasts to justify Reserved Instance purchases.\n- Track forecast accuracy over time to improve planning.\n\nVisit the Forecasting page for detailed projections across your ${config.hierarchy.orgUnitLabelPlural.toLowerCase()}.`;
  }

  if (q.includes('unit') || q.includes('economics') || q.includes('per user') || q.includes('per transaction') || q.includes('unit cost')) {
    return `**Unit Economics for ${shortName}:**\n\nUnit economics helps you understand the true cost of delivering your services:\n\n**Key Metrics:**\n- **Cost per User** — Total infrastructure cost divided by active users.\n- **Cost per Transaction** — Infrastructure cost per business transaction processed.\n- **Cost per API Call** — Average cost of serving each API request.\n- **Cost per GB Stored** — Storage cost efficiency metric.\n\n**Why It Matters:**\n1. **Margin Analysis** — Understand if your revenue per user exceeds your infrastructure cost per user.\n2. **Scaling Efficiency** — Track whether costs grow linearly or sub-linearly as you scale.\n3. **Service Comparison** — Compare unit economics across microservices to find inefficiencies.\n4. **Pricing Decisions** — Use unit costs to set or adjust product pricing.\n\n**Best Practices:**\n- Track unit costs weekly to spot regressions quickly.\n- Set targets for each metric and alert when exceeded.\n- Use tags to attribute costs to specific products or features.\n\nExplore the Unit Economics page for your current metrics.`;
  }

  if (q.includes('report') || q.includes('export') || q.includes('chargeback') || q.includes('showback')) {
    return `**Reporting & Chargeback for ${shortName}:**\n\nEffective reporting is the foundation of FinOps practice:\n\n**Report Types:**\n- **Executive Summary** — High-level KPIs, trends, and budget status for leadership.\n- **Service Breakdown** — Detailed cost analysis by ${shortName} service.\n- **${config.hierarchy.orgUnitLabel} Report** — Cost and efficiency metrics per ${config.hierarchy.orgUnitLabel.toLowerCase()}.\n- **Chargeback Report** — Allocate costs to business units based on tags and usage.\n- **Optimization Report** — Savings opportunities and implementation progress.\n\n**Chargeback vs Showback:**\n- **Chargeback** — Actually billing internal teams for their cloud usage.\n- **Showback** — Showing teams their costs without actual billing.\n- Start with showback to build awareness, then move to chargeback.\n\nVisit the Reports page to generate and schedule reports.`;
  }

  if (q.includes('resource') || q.includes('inventory') || q.includes('asset')) {
    return `**Resource Management for ${shortName}:**\n\nMaintaining visibility into your resource inventory is critical:\n\n**Key Capabilities:**\n1. **Resource Discovery** — Automatically inventory all ${shortName} resources across ${config.hierarchy.orgUnitLabelPlural.toLowerCase()} and regions.\n2. **Utilization Monitoring** — Track CPU, memory, network, and disk utilization via ${terminology.monitoring}.\n3. **Cost Attribution** — See the monthly cost of each individual resource.\n4. **Lifecycle Management** — Track resource age, identify long-running dev/test resources.\n\n**Best Practices:**\n- Review your resource inventory weekly for unauthorized or forgotten resources.\n- Set up alerts for resources with consistently low utilization.\n- Use the Resources page to filter, sort, and export your inventory.\n\nVisit the Resources page for your complete resource inventory.`;
  }

  if (q.includes('allocation') || q.includes('cost allocation') || q.includes('distribute')) {
    return `**Cost Allocation for ${shortName}:**\n\nProper cost allocation ensures accountability across your organization:\n\n**Allocation Methods:**\n1. **Tag-Based** — Allocate costs using resource tags (most precise).\n2. **${config.hierarchy.orgUnitLabel}-Based** — Allocate by ${config.hierarchy.orgUnitLabel.toLowerCase()} ownership.\n3. **Proportional** — Distribute shared costs based on usage ratios.\n4. **Fixed Split** — Divide shared infrastructure costs by agreed percentages.\n\n**Handling Shared Costs:**\n- Shared services (networking, monitoring, security) often need special allocation rules.\n- Use a combination of direct allocation (tagged resources) and proportional allocation (shared resources).\n\nVisit the Allocation page to configure and review your cost allocation rules.`;
  }

  if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('help')) {
    return `Hello! I'm the Qocent FinOps Assistant, here to help you optimize your ${shortName} cloud spending. 👋\n\nI can help with:\n- **Cost Optimization** — Tips to reduce your cloud bill\n- **Savings Plans** — Understanding ${terminology.savingsMechanism}\n- **Budgeting** — Setting up and managing budgets\n- **Anomaly Detection** — Understanding spending anomalies\n- **Tagging** — Best practices for resource tagging\n- **Waste Detection** — Finding and eliminating waste\n- **Forecasting** — Predicting future costs\n- **Unit Economics** — Understanding cost per user/transaction\n\nJust ask me anything about FinOps!`;
  }

  return `Great question! Here's a quick overview of what the Qocent FinOps platform offers for ${shortName}:\n\n**Dashboard** — Real-time KPIs, cost trends, and budget status at a glance.\n**Analytics** — Deep-dive into spending patterns by service, region, and ${config.hierarchy.orgUnitLabel.toLowerCase()}.\n**Recommendations** — AI-powered optimization suggestions from ${terminology.recommendationSource}.\n**Budgets** — Create and monitor budgets with threshold alerts.\n**Anomaly Detection** — Automatic detection of unusual spending patterns.\n**Waste Detection** — Identify idle, unused, and oversized resources.\n**Forecasting** — Predict future costs based on historical trends.\n**Tagging** — Monitor and enforce tagging compliance.\n**Unit Economics** — Track cost per user, transaction, and API call.\n\nTry asking me about any of these topics for detailed guidance! For example: "How can I reduce costs?" or "What are ${terminology.savingsMechanism}?"`;
}

export function FinOpsAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { selectedProvider } = useFinOpsStore();
  const config = getProviderConfig(selectedProvider);

  useEffect(() => {
    setMessages([]);
  }, [selectedProvider]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `Welcome to the Qocent FinOps Assistant! 👋\n\nI'm here to help you optimize your ${config.shortName} cloud costs. Ask me anything about cost optimization, budgeting, savings plans, anomaly detection, and more.\n\nHere are some questions to get started:`,
        },
      ]);
    }
  }, [isOpen, selectedProvider, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage: Message = { role: 'user', content: trimmed };
    const response = getAssistantResponse(trimmed, selectedProvider);
    const assistantMessage: Message = { role: 'assistant', content: response };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput('');
  };

  const handleChipClick = (question: string) => {
    const userMessage: Message = { role: 'user', content: question };
    const response = getAssistantResponse(question, selectedProvider);
    const assistantMessage: Message = { role: 'assistant', content: response };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-20 right-6 w-[400px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] flex flex-col overflow-hidden"
          >
            <div
              className="px-5 py-4 flex items-center justify-between shrink-0"
              style={{ background: config.colors.gradient }}
            >
              <div>
                <h3 className="text-white font-semibold text-base">Qocent FinOps Assistant</h3>
                <p className="text-white/80 text-xs mt-0.5">{config.name}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <IconX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-br-md'
                        : 'bg-slate-100 text-slate-800 rounded-bl-md'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {messages.length === 1 && messages[0].role === 'assistant' && (
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleChipClick(q)}
                      className="text-xs px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about FinOps..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-2.5 rounded-xl bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <IconSend size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <IconMessageChatbot size={26} />
      </motion.button>
    </>
  );
}