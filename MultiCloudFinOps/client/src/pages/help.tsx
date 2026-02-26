import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  HelpCircle,
  Search,
  BookOpen,
  MessageCircle,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

const faqs = [
  {
    question: 'How do I connect my Huawei Cloud account?',
    answer: 'Navigate to Settings > API Keys and enter your Huawei Cloud Access Key (AK), Secret Key (SK), and Project ID. These credentials can be found in your Huawei Cloud IAM console.',
  },
  {
    question: 'How often is cost data updated?',
    answer: 'Cost data is synchronized daily from Huawei Cloud BSS APIs. Resource utilization metrics are updated hourly via Cloud Eye integration.',
  },
  {
    question: 'Can I set up budget alerts?',
    answer: 'Yes! Go to Budget Management to create budget thresholds. You can configure alerts at 50%, 80%, and 100% utilization levels with email notifications.',
  },
  {
    question: 'What currencies are supported?',
    answer: 'The dashboard supports USD, GBP, EUR, and JPY. You can change your preferred currency in Settings or use the currency switcher in the header.',
  },
  {
    question: 'How are optimization recommendations generated?',
    answer: 'Our AI-powered engine analyzes resource utilization patterns, billing data, and usage trends to identify rightsizing opportunities, idle resources, and reserved instance recommendations.',
  },
];

export default function Help() {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-[1200px] mx-auto" data-testid="help-page">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground">Help Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Find answers and get support
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for help..."
              className="pl-10"
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: BookOpen, title: 'Documentation', desc: 'Read the full docs' },
            { icon: MessageCircle, title: 'Live Chat', desc: 'Talk to our team' },
            { icon: Mail, title: 'Email Support', desc: 'support@huaweicloud.com' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm border-card-border hover-elevate cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="bg-card/50 backdrop-blur-sm border-card-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-muted-foreground mb-4">
            Can't find what you're looking for?
          </p>
          <Button>
            Contact Support
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </ScrollArea>
  );
}
