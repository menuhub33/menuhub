"use client";

import { useState } from "react";
import { ConfirmAction } from "@/components/common/confirm-action";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { formatDate } from "@/components/lib/format";
import { DnsInstructions } from "@/components/domains/dns-instructions";
import { DomainForm } from "@/components/domains/domain-form";
import { DomainStatus } from "@/components/domains/domain-status";
import { DomainVerification } from "@/components/domains/domain-verification";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { GlobeIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import type { CustomDomain } from "@/lib/types";

export function DomainList({
  domains,
  loading,
  error,
  onRetry,
  canAdd,
  canVerify,
  canRemove,
  addLoading,
  addError,
  verifyingId,
  cnameTarget,
  aRecord,
  onAdd,
  onVerify,
  onRemove,
}: {
  domains: CustomDomain[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  canAdd?: boolean;
  canVerify?: boolean;
  canRemove?: boolean;
  addLoading?: boolean;
  addError?: string | null;
  verifyingId?: string;
  cnameTarget?: string;
  aRecord?: string;
  onAdd?: (domain: string) => void | Promise<void>;
  onVerify?: (domain: CustomDomain) => void | Promise<void>;
  onRemove?: (domain: CustomDomain) => void | Promise<void>;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(domains[0]?.id ?? null);
  const selected = domains.find((item) => item.id === selectedId) ?? domains[0] ?? null;

  if (loading) return <LoadingState label="جارٍ تحميل النطاقات..." />;
  if (error) return <ErrorState description={error} onRetry={onRetry} />;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {domains.length === 0 ? "لا توجد نطاقات بعد" : `${domains.length} نطاق`}
        </p>
        {canAdd ? (
          <Button onClick={() => setAddOpen(true)}>
            <PlusIcon className="size-4" />
            إضافة نطاق
          </Button>
        ) : null}
      </div>
      {domains.length === 0 ? (
        <EmptyState
          title="لا يوجد نطاق مخصص"
          description="اربط نطاقك الخاص لعرض المنيو على عنوانك بدل النطاق الفرعي للمنصة."
          icon={<GlobeIcon className="size-7" />}
          action={
            canAdd ? (
              <Button onClick={() => setAddOpen(true)}>
                <PlusIcon className="size-4" />
                إضافة نطاق
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,18rem)_1fr]">
          <ul className="grid gap-2">
            {domains.map((item) => {
              const active = selected?.id === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={
                      active
                        ? "w-full rounded-2xl border border-teal-700 bg-teal-50 p-4 text-start"
                        : "w-full rounded-2xl border border-zinc-200 bg-white p-4 text-start hover:border-teal-200"
                    }
                  >
                    <p className="truncate font-medium text-zinc-900" dir="ltr">
                      {item.domain}
                    </p>
                    <div className="mt-2">
                      <DomainStatus status={item.status} />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          {selected ? (
            <div className="grid gap-4">
              <Card>
                <CardContent className="flex flex-wrap items-start justify-between gap-3 pt-5">
                  <div>
                    <p className="font-semibold text-zinc-900" dir="ltr">
                      {selected.domain}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">أُضيف في {formatDate(selected.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <DomainStatus status={selected.status} />
                    {canRemove && onRemove ? (
                      <ConfirmAction
                        title="حذف النطاق؟"
                        description={`سيتم إلغاء ربط ${selected.domain} ولن يعمل العنوان بعد الحذف.`}
                        confirmLabel="حذف النطاق"
                        onConfirm={() => onRemove(selected)}
                      >
                        {(open) => (
                          <Button variant="danger" size="sm" onClick={open}>
                            <TrashIcon className="size-4" />
                            حذف
                          </Button>
                        )}
                      </ConfirmAction>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
              <DomainVerification
                domain={selected}
                verifying={verifyingId === selected.id}
                onVerify={canVerify ? onVerify : undefined}
              />
              <DnsInstructions
                domain={selected.domain}
                verificationToken={selected.verification_token}
                cnameTarget={cnameTarget}
                aRecord={aRecord}
              />
            </div>
          ) : null}
        </div>
      )}
      <Dialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="إضافة نطاق مخصص"
        description="أدخل النطاق ثم اتبع تعليمات DNS للتحقق."
      >
        <DomainForm
          loading={addLoading}
          error={addError}
          onSubmit={async (domain) => {
            await onAdd?.(domain);
            setAddOpen(false);
          }}
        />
      </Dialog>
    </div>
  );
}
