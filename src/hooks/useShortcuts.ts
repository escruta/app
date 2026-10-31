import { useCallback, useEffect, useRef } from "react";
import {
  matchesShortcut,
  isTypingSensitiveShortcut,
  type ShortcutId,
  type ShortcutKeyEvent,
} from "@/lib/shortcuts";

export interface ShortcutKeyboardEvent extends ShortcutKeyEvent {
  defaultPrevented: boolean;
  target: EventTarget | null;
  currentTarget: EventTarget | null;
  preventDefault: () => void;
  stopPropagation: () => void;
}

export interface ShortcutBinding {
  id: ShortcutId;
  handler: (event: ShortcutKeyboardEvent) => void;
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  allowWhenTyping?: boolean;
  allowDefaultPrevented?: boolean;
}

export interface UseShortcutsOptions {
  global?: boolean;
  enabled?: boolean;
  skipIfDefaultPrevented?: boolean;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  const tagName = target.tagName;
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

function runBindings(
  event: ShortcutKeyboardEvent,
  bindings: readonly ShortcutBinding[],
  options: UseShortcutsOptions,
  isGlobal: boolean,
): boolean {
  if (options.enabled === false) return false;
  if (isGlobal && options.skipIfDefaultPrevented !== false && event.defaultPrevented) {
    return false;
  }

  const targetIsEditable = isGlobal && isEditableTarget(event.target);

  for (const binding of bindings) {
    if (binding.enabled === false) continue;
    if (isGlobal && event.defaultPrevented && !binding.allowDefaultPrevented) continue;
    if (targetIsEditable && !binding.allowWhenTyping && isTypingSensitiveShortcut(binding.id)) {
      continue;
    }
    if (!matchesShortcut(binding.id, event)) continue;

    if (binding.preventDefault !== false) event.preventDefault();
    if (binding.stopPropagation) event.stopPropagation();
    binding.handler(event);
    return true;
  }

  return false;
}

export function useShortcuts(
  bindings: readonly ShortcutBinding[],
  options: UseShortcutsOptions = {},
): (event: ShortcutKeyboardEvent) => boolean {
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const run = useCallback(
    (event: ShortcutKeyboardEvent, isGlobal: boolean) =>
      runBindings(event, bindingsRef.current, optionsRef.current, isGlobal),
    [],
  );

  const isActive =
    options.enabled !== false && bindings.some((binding) => binding.enabled !== false);

  useEffect(() => {
    if (!options.global || !isActive) return;

    const listener = (event: KeyboardEvent) => {
      run(event, true);
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [options.global, isActive, run]);

  return useCallback((event: ShortcutKeyboardEvent) => run(event, false), [run]);
}

export function useShortcut(
  id: ShortcutId,
  handler: ShortcutBinding["handler"],
  options: UseShortcutsOptions & Omit<ShortcutBinding, "id" | "handler"> = {},
) {
  const { global, enabled, skipIfDefaultPrevented, ...bindingOptions } = options;

  return useShortcuts([{ id, handler, ...bindingOptions }], {
    global,
    enabled,
    skipIfDefaultPrevented,
  });
}
