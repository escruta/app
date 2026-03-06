## General Rules

- Research how the same problem has been resolved in other components (e.g., check `SourceViewer.tsx` and `NotesCard.tsx` before resolving the problem in `SourcesCard.tsx`)

- All network handling MUST be done using the custom hook `useFetch` located in `@/hooks/useFetch.ts`
- **MANUAL USE OF `fetch()` IS STRICTLY PROHIBITED.**

## Understanding the `useFetch`

```tsx
const { data, loading, error, refetch } = useFetch(endpoint, options, immediate);
```

- **`endpoint`**: The API path (e.g., `notebooks/${notebookId}/sources`). The hook already handles base url
- **`options`**: Request options (`method`, `data` for the body, `onSuccess`, `onError`)
- **`immediate`**: If `true` (default): The request is made as soon as the component is mounted. If `false`: The request **is NOT** executed upon mounting. The hook returns the `refetch` function so you can execute it on demand

**Correct example of a mutation:**

```tsx
const { loading: isDeleting, refetch: deleteSomething } = useFetch(
  `path/${id}`,
  {
    method: "DELETE",
    onSuccess: () => onDeletedAction(),
  },
  false,
);

<Button onClick={() => deleteSomething()} disabled={isDeleting} />;
```

- The `useFetch` already includes essential state handling (`loading`, `error`, `data`) - Do not duplicate them

### `useFetch` Best Practices

- **Dynamic Endpoints**: When using `useFetch` with `immediate: false` for mutations or on-demand fetches, provide the full endpoint path directly using template literals. Do not use ternary operators to handle "empty" IDs; the hook is reactive and its `refetch` function will always use the latest values from its dependencies.

```tsx
// ✅ Do this
const { refetch: fetchItem } = useFetch(`/items/${item?.id}`, { method: 'GET' }, false);

// ❌ Don't do this (redundant ternary)
const { refetch: fetchItem } = useFetch(item?.id ? `/items/${item.id}` : "", { ... }, false);
```

## UI and Reusable Components

- Use only the ui components found in `@/components/ui/` (e.g., `Button`, `IconButton`, `Tooltip`, `Spinner`, `Modal`, `Checkbox`)
- Use only the icons from `@/components/icons/`
- Don't create raw HTML with hardcoded styles if a UI component already exists that does the job
- Use `cn()` from `@/lib/utils` to combine Tailwind conditional classes

```tsx
// Don't do this
<div className={cn("base-class", condition && "conditional-class")} />

// Don't do this
<div className={cn("base-class", condition ? "conditional-class" : "another-class")} />

// Do this
<div className={cn("base-class", {
  "conditional-class": condition,
})} />

// Do this
<div className={cn("base-class", {
  "conditional-class": condition,
  "another-class": !condition,
})} />
```

## Task Resolution Process

- Read the request and determine which component needs to be changed
- Use existing hooks and components - Don't reinvent the wheel
- **NEVER RUN `npm run build` OR ANY COMPILATION COMMAND UNDER ANY CIRCUMSTANCES**
- To test the application, you can **ONLY** run `npm run lint` and `npm run format`
- To fix linting and formatting errors, you can only run `npm run lint:fix` and `npm run format:fix`
