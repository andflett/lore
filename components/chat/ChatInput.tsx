"use client";

import {
  useImperativeHandle,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type Ref,
} from "react";
import { GameIcon } from "@/components/shared/GameIcon";
import { ModelSwitcher } from "./ModelSwitcher";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  ref?: Ref<ChatInputHandle>;
  // "hero" = large centred variant used by the empty state.
  size?: "default" | "hero";
  // When supplied, an inline model switcher is shown in the footer.
  modelId?: string;
  onModelChange?: (id: string) => void;
}

// Imperative handle exposed to parents that need to seed the field — e.g. the
// empty-state's starter prompts. Avoids lifting state up just for that.
export interface ChatInputHandle {
  setDraft: (text: string) => void;
}

// Chat input — matches the prototype's design: thin border, inset shadow for
// depth, no border-radius. Auto-grows up to a cap. Sits inside a chrome
// "bottom bar" supplied by the caller; no chrome of its own.
export function ChatInput({
  onSend,
  disabled,
  ref,
  size = "default",
  modelId,
  onModelChange,
}: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hero = size === "hero";
  const maxH = hero ? 200 : 110;

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
          el.style.height = Math.min(el.scrollHeight, maxH) + "px";
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
    el.style.height = Math.min(el.scrollHeight, maxH) + "px";
  };

  const empty = value.trim().length === 0;
  const canSend = !disabled && !empty;

  return (
    <form
      onSubmit={submit}
      className={`flex flex-col border border-gold-b2 bg-stone-s1 focus-within:border-gold ${
        hero ? "px-4 pt-3 pb-2" : "px-3 pt-2 pb-1.5"
      }`}
      style={{ boxShadow: "inset 0 2px 8px rgba(0,0,0,0.45)" }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        onInput={onInput}
        rows={hero ? 2 : 1}
        placeholder={
          hero
            ? "What do you want to know?"
            : "Ask a follow-up…"
        }
        className={`w-full resize-none overflow-y-auto border-0 bg-transparent p-0 leading-relaxed text-text-t2 outline-none placeholder:text-text-dim ${
          hero
            ? "min-h-[56px] text-[17px]"
            : "min-h-[28px] text-[16px] sm:text-[15px]"
        }`}
      />
      <div className="flex items-center justify-between gap-2 pt-1.5">
        {modelId && onModelChange ? (
          <ModelSwitcher value={modelId} onChange={onModelChange} />
        ) : (
          <span />
        )}
        <button
          type="submit"
          onClick={() => submit()}
          disabled={!canSend}
          aria-label="Send"
          className={`flex h-9 w-9 items-center justify-center border transition-colors ${
            canSend
              ? "border-gold bg-gold-b1 text-text-t3 hover:bg-gold-b2"
              : "cursor-not-allowed border-gold-b1 bg-stone-s1 text-text-dim"
          }`}
        >
          <GameIcon name="broadsword" size={14} />
        </button>
      </div>
    </form>
  );
}
