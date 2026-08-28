"use client";

import { useState } from "react";
import { cn } from "@/components/lib/cn";
import { Input } from "@/components/ui/input";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";

export function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  autoComplete = "current-password",
  invalid,
}: {
  id: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  invalid?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        invalid={invalid}
        className="pe-11"
        onChange={(event) => onChange(event.target.value)}
        required
      />
      <button
        type="button"
        className={cn(
          "absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        )}
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
      >
        {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
      </button>
    </div>
  );
}
