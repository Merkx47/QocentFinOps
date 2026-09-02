import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberField } from '@/components/number-field';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinOpsStore } from '@/lib/finops-store';
import { getProviderConfig } from '@/lib/provider-config';
import { useCustomerStore, type Customer } from '@/lib/customers';
import { useToast } from '@/hooks/use-toast';
import { IconPlus } from '@tabler/icons-react';
import { useState, type ReactNode } from 'react';

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'customer';
}

/** Onboard a customer. Shared by the customer directory and the TCO module. */
export function NewCustomerDialog({
  trigger,
  onCreated,
}: {
  trigger?: ReactNode;
  onCreated?: (customer: Customer) => void;
}) {
  const { selectedProvider } = useFinOpsStore();
  const { addCustomer } = useCustomerStore();
  const { toast } = useToast();
  const config = getProviderConfig(selectedProvider);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    industry: '',
    primaryRegion: config.regions[0],
    accountCount: 1,
    budget: 0,
    spendSharePercent: 10,
    contactName: '',
    contactEmail: '',
  });

  const reset = () =>
    setForm({
      name: '', industry: '', primaryRegion: config.regions[0], accountCount: 1,
      budget: 0, spendSharePercent: 10, contactName: '', contactEmail: '',
    });

  const submit = () => {
    const name = form.name.trim();
    if (!name) return;

    const customer: Customer = {
      id: `cust-${slug(name)}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      shortName: name,
      industry: form.industry.trim() || 'Not stated',
      primaryRegion: form.primaryRegion,
      accountCount: Math.max(0, Math.round(form.accountCount)),
      contactName: form.contactName.trim(),
      contactEmail: form.contactEmail.trim(),
      budget: Math.max(0, form.budget),
      efficiencyScore: 80,
      spendWeight: Math.min(1, Math.max(0.01, form.spendSharePercent / 100)),
      status: 'active',
      onboardedAt: new Date().toISOString().split('T')[0],
    };

    addCustomer(customer);
    setOpen(false);
    reset();
    onCreated?.(customer);
    toast({ title: 'Customer added', description: `${customer.name} is now available across the portal.` });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" data-testid="button-new-customer">
            <IconPlus className="h-4 w-4 mr-2" />
            New customer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a customer</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Customer name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Sterling Bank"
              className="h-9"
              data-testid="input-customer-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Industry</Label>
              <Input
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="Commercial Banking"
                className="h-9"
                data-testid="input-customer-industry"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Primary region</Label>
              <Select
                value={form.primaryRegion}
                onValueChange={(v) => setForm({ ...form, primaryRegion: v })}
              >
                <SelectTrigger className="h-9 text-sm" data-testid="select-customer-region">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {config.regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Linked accounts</Label>
              <NumberField
                value={form.accountCount}
                onChange={(accountCount) => setForm({ ...form, accountCount })}
                className="h-9 font-mono text-sm"
                data-testid="input-customer-accounts"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Budget (USD)</Label>
              <NumberField
                value={form.budget}
                onChange={(budget) => setForm({ ...form, budget })}
                blankWhenZero
                placeholder="0"
                className="h-9 font-mono text-sm"
                data-testid="input-customer-budget"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Share of spend %</Label>
              <NumberField
                value={form.spendSharePercent}
                onChange={(spendSharePercent) => setForm({ ...form, spendSharePercent })}
                className="h-9 font-mono text-sm"
                data-testid="input-customer-share"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Contact name</Label>
              <Input
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                className="h-9"
                data-testid="input-customer-contact"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Contact email</Label>
              <Input
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="h-9"
                data-testid="input-customer-email"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Share of spend sets how much of the portfolio's AWS cost this customer accounts for across the
            portal's cost views.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!form.name.trim()} data-testid="button-create-customer">
            Add customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
