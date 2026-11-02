import { useEffect, useState, useCallback } from 'react';

interface TvRemoteHandlers {
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeekForward?: () => void;
  onSeekBackward?: () => void;
  onSelectFocusedElement?: (elementId: string) => void;
}

export const useTvRemote = (
  focusableElements: string[],
  handlers: TvRemoteHandlers,
  isModalOpen: boolean = false
) => {
  // Start with -1 so no button has a stuck pink focus ring on load or on touch
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isRemoteActive, setIsRemoteActive] = useState<boolean>(false);

  // Clear focus ring on touch or mouse interaction
  useEffect(() => {
    const handlePointerDown = () => {
      setIsRemoteActive(false);
      setFocusedIndex(-1);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isModalOpen) return;

      const currentIdx = focusedIndex >= 0 ? focusedIndex : 1; // default to play button when arrow pressed
      const currentElement = focusableElements[currentIdx] || 'btn-play';

      switch (e.key) {
        case 'ArrowLeft':
        case 'MediaTrackPrevious':
        case 'MediaRewind':
          e.preventDefault();
          setIsRemoteActive(true);
          if (currentElement === 'seekbar' && handlers.onSeekBackward) {
            handlers.onSeekBackward();
          } else {
            handlers.onPrev();
          }
          break;

        case 'ArrowRight':
        case 'MediaTrackNext':
        case 'MediaFastForward':
          e.preventDefault();
          setIsRemoteActive(true);
          if (currentElement === 'seekbar' && handlers.onSeekForward) {
            handlers.onSeekForward();
          } else {
            handlers.onNext();
          }
          break;

        case 'Enter':
        case ' ': // Spacebar
        case 'Select':
        case 'NumpadEnter':
          e.preventDefault();
          if (isRemoteActive && focusedIndex >= 0 && handlers.onSelectFocusedElement) {
            handlers.onSelectFocusedElement(currentElement);
          } else {
            handlers.onPlayPause();
          }
          break;

        case 'MediaPlayPause':
        case 'MediaPlay':
        case 'MediaPause':
          e.preventDefault();
          handlers.onPlayPause();
          break;

        case 'ArrowUp':
          e.preventDefault();
          setIsRemoteActive(true);
          setFocusedIndex((prev) => (prev <= 0 ? focusableElements.length - 1 : prev - 1));
          break;

        case 'ArrowDown':
          e.preventDefault();
          setIsRemoteActive(true);
          setFocusedIndex((prev) => (prev < 0 || prev >= focusableElements.length - 1 ? 0 : prev + 1));
          break;

        default:
          break;
      }
    },
    [focusableElements, focusedIndex, handlers, isModalOpen, isRemoteActive]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    focusedElement: isRemoteActive && focusedIndex >= 0 ? focusableElements[focusedIndex] || '' : '',
    setFocusedElement: (id: string) => {
      const idx = focusableElements.indexOf(id);
      if (idx !== -1) {
        setFocusedIndex(idx);
        setIsRemoteActive(true);
      }
    },
  };
};
