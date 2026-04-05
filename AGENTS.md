# Agent Guidelines and Considerations

When addressing any task, you must first thoroughly research how similar problems have been resolved in other components across the codebase. For instance, always check existing implementations like `SourceViewer.tsx` and `NotesCard.tsx` before attempting to resolve a related issue in a component like `SourcesCard.tsx`.

It is absolutely crucial that all network handling is performed exclusively using the custom `useFetch` hook located at `@/hooks/useFetch.ts`. Under no circumstances should you manually use the native `fetch()` API; its manual use is strictly prohibited.

The `useFetch` hook returns an object containing `data`, `loading`, `error`, and a `refetch` function, and it takes an `endpoint`, `options`, and an `immediate` boolean flag. The `endpoint` represents the API path (like `notebooks/${notebookId}/sources`), and the hook automatically manages the base URL. The `options` object allows you to specify the request `method`, `data` for the body, and callbacks like `onSuccess` or `onError`. By default, the `immediate` flag is true, meaning the request executes as soon as the component mounts. If set to false, the request is not executed upon mounting, and you must use the returned `refetch` function to trigger it on demand.

A correct pattern for a mutation involves setting `immediate` to false and attaching the `refetch` function to an event handler, such as a button click, while utilizing the `loading` state to disable the interaction. Since `useFetch` already includes essential state handling for loading, error, and data, you must not duplicate these states in your components.

When configuring dynamic endpoints with `immediate: false` for mutations or on-demand fetches, you must provide the full endpoint path directly using template literals. You should not use ternary operators to handle empty IDs or conditionally build the endpoint string. The hook is reactive, and its `refetch` function will consistently use the latest values from its dependencies, making such ternary checks redundant and discouraged.

```tsx
// ✅ Do this
const { refetch: fetchItem } = useFetch(`/items/${item?.id}`, { method: 'GET' }, false);

// ❌ Don't do this (redundant ternary)
const { refetch: fetchItem } = useFetch(item?.id ? `/items/${item.id}` : "", { ... }, false);
```

Regarding the user interface, you must strictly use the UI components available in the `@/components/ui/` directory, such as `Button`, `IconButton`, `Tooltip`, `Spinner`, `Modal`, or `Checkbox`. Similarly, only use icons sourced from `@/components/icons/`. You are not allowed to create raw HTML elements with hardcoded styles if a suitable UI component already exists to fulfill the requirement.

When combining Tailwind CSS conditional classes, you must use the `cn()` utility from `@/lib/utils`. Specifically, you should use the object syntax to conditionally apply classes rather than relying on logical AND operators or ternary operators directly within the class string.

```tsx
// Do this
<div
  className={cn("base-class", {
    "conditional-class": condition,
    "another-class": !condition,
  })}
/>
```

During the task resolution process, begin by carefully reading the request to determine exactly which component requires modification. Always prioritize the use of existing hooks and components instead of reinventing the wheel.

After making the changes, run the command `npm run check` to verify that the changes are correct.
