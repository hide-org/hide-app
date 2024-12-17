import { useEffect, RefObject, useCallback } from 'react';

export const useAutoResize = (textAreaRef: RefObject<HTMLTextAreaElement>, value: string) => {
  const adjustHeight = useCallback(() => {
    const textArea = textAreaRef.current;
    if (!textArea) return;

    // Temporarily collapse the textarea to get the proper scrollHeight
    textArea.style.height = 'auto';

    // Calculate the new height
    const minHeight = 44;
    const contentHeight = textArea.scrollHeight;
    const newHeight = !value ? minHeight : Math.max(minHeight, contentHeight);

    // Only update if height changed
    if (textArea.style.height !== `${newHeight}px`) {
      textArea.style.height = `${newHeight}px`;
    }
  }, [value]);

  // Update height on value change
  useEffect(() => {
    // Use RAF to prevent resize loops
    requestAnimationFrame(adjustHeight);
  }, [value, adjustHeight]);

  // Initial setup and cleanup
  useEffect(() => {
    const textArea = textAreaRef.current;
    if (!textArea) return;

    // Initial resize
    adjustHeight();

    // Debounced resize handler
    let rafId: number;
    const debouncedResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(adjustHeight);
    };

    const resizeObserver = new ResizeObserver(debouncedResize);
    resizeObserver.observe(textArea);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [adjustHeight]);

  return adjustHeight;
};
