"use client";

import {
  useImperativeHandle,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type Ref,
} from "react";
import { Btn } from "@/components/shared/Btn";
import { GameIcon } from "@/components/shared/GameIcon";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  ref?: Ref<ChatInputHandle>;
}

// Imperative handle exposed to parents that need to seed the field — e.g. the
// empty-state's starter prompts. Avoids lifting state up just for that.
export interface ChatInputHandle {
  setDraft: (text: string) => void;
}

// Chat input — matches the prototype's design: thin border, inset shadow for
// depth, no border-radius. Auto-grows up to a cap. Sits inside a chrome
// "bottom bar" supplied by the caller; no chrome of its own.
export function ChatInput({ onSend, disabled, ref }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    setDraft: (text: string) => {
      setValue(text);
      const el = textareaRef.current;
      if (el) {
        // Defer so the new value renders before we measure / focus.
        queueMicrotask(() => {
          el.focus();
          el.setSelectionRange(text.length, text.length);
          el.style.height = "auto";
          el.style.height = Math.min(el.scrollHeight, 110) + "px";
        });
      }
    },
  }));

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const onInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 110) + "px";
  };

  return (
    <form onSubmit={submit} className="flex items-end gap-2.5">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        onInput={onInput}
        rows={1}
        placeholder="Ask anything about this playthrough…"
        className="min-h-[38px] flex-1 resize-none overflow-hidden border border-gold-b2 bg-stone-s1 px-3.5 py-2 text-[14px] leading-snug text-text-t2 outline-none placeholder:text-text-dim focus:border-gold"
        style={{ boxShadow: "inset 0 2px 8px rgba(0,0,0,0.45)" }}
      />
      <Btn variant="metal" onClick={() => submit()} disabled={disabled}>
        <GameIcon name="broadsword" size={14} className="text-text-t2" />
        <span className="hidden sm:inline">Send</span>
      </Btn>
    </form>
  );
}
