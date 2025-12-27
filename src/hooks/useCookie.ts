import { useState, useCallback } from "react";
import Cookies from "js-cookie";

const defaultOptions: Cookies.CookieAttributes = {
  expires: 30,
  secure: true,
};

export default function useCookie<T>(
  keyName: string,
  defaultValue?: T,
  options: Cookies.CookieAttributes = defaultOptions,
) {
  const [storedValue, setStoredValue] = useState<T | undefined>(() => {
    try {
      const item = Cookies.get(keyName);
      if (item) {
        return JSON.parse(item) as T;
      }
      if (defaultValue !== undefined) {
        Cookies.set(keyName, JSON.stringify(defaultValue), options);
        return defaultValue;
      }
      return undefined;
    } catch (_) {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (newValue: T) => {
      try {
        if (newValue === undefined) {
          Cookies.remove(keyName);
        } else {
          Cookies.set(keyName, JSON.stringify(newValue), options);
        }
        setStoredValue(newValue);
      } catch (error) {
        console.error(error);
      }
    },
    [keyName, options],
  );

  return [storedValue, setValue] as const;
}
