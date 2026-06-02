import { useEffect, useRef } from 'react';

export function useScrollToBottom<T>(dependency: T) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [dependency]);

  return ref;
}