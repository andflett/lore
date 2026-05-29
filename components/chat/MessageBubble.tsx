"use client";

import { motion } from "motion/react";
import type { SearchSource } from "@/lib/types";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";

interface Props {
  role: "user" | "assistant";
  content: string;
  sources?: SearchSource[];
}

export function MessageBubble({ role, content, sources }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      {role === "user" ? (
        <UserMessage content={content} />
      ) : (
        <AssistantMessage content={content} sources={sources} />
      )}
    </motion.div>
  );
}
