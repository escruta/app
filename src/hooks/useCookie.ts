import { useState, useCallback } from "react";
import {
  readStoredValue,
  writeStoredValue,
  clearStoredValue,
  type PersistedOptions,
} from "@/lib/storage";

interface UseCookieResult<T> {
  value: T;
  setValue: (newValue: T | undefined) => void;
}

export function useCookie<T>(
  keyName: string,
  defaultValue: T,
  options?: PersistedOptions,
): UseCookieResult<T>;
export function useCookie<T>(
  keyName: string,
  defaultValue?: T,
  options?: PersistedOptions,
): UseCookieResult<T | undefined>;
export function useCookie<T>(
  keyName: string,
  defaultValue?: T,
  options?: PersistedOptions,
): UseCookieResult<T | undefined> {
  const [storedValue, setStoredValue] = useState<T | undefined>(() => {
    try {
      const item = readStoredValue(keyName);
      if (item) {
        return JSON.parse(item) as T;
      }
      if (defaultValue !== undefined) {
        writeStoredValue(keyName, JSON.stringify(defaultValue), options);
        return defaultValue;
      }
      return undefined;
    } catch (error) {
      console.error(error);
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (newValue: T | undefined) => {
      try {
        if (newValue === undefined) {
          clearStoredValue(keyName);
        } else {
          writeStoredValue(keyName, JSON.stringify(newValue), options);
        }
        setStoredValue(newValue);
      } catch (error) {
        console.error(error);
      }
    },
    [keyName, options],
  );

  return { value: storedValue, setValue };
}
