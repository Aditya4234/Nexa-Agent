"use client";

import { motion } from "framer-motion";
import {
  Hexagon,
  Sparkles,
  Atom,
  Rabbit,
  Network,
  Blocks,
  Plug,
  FileCode2,
  Braces,
} from "lucide-react";

const stack = [
  { name: "OpenAI", icon: Sparkles },
  { name: "Anthropic", icon: Atom },
  { name: "Gemini", icon: Hexagon },
  { name: "Ollama", icon: Rabbit },
  { name: "OpenRouter", icon: Network },
  { name: "MCP", icon: Blocks },
  { name: "REST APIs", icon: Plug },
  { name: "Python", icon: FileCode2 },
  { name: "JavaScript", icon: Braces },
];

export function TechStack() {
  return (
    <section className="border-y bg-muted/30 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-center text-sm font-medium text-muted-foreground">
          Works with your favorite AI stack
        </p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6"
        >
          {stack.map((item) => (
            <span
              key={item.name}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground/80 transition-colors hover:text-foreground"
            >
              <item.icon className="h-4 w-4 text-violet-500/70" />
              {item.name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}