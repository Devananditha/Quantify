import { useEffect, useRef } from "react";
import styles from "./Modal.module.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLElement | null>(null);
  const lastFocusableRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // 1. Capture previously focused element
      previouslyFocusedElement.current = document.activeElement as HTMLElement;

      if (modalRef.current) {
        // Query focusable elements
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
          firstFocusableRef.current = focusableElements[0];
          lastFocusableRef.current = focusableElements[focusableElements.length - 1];
        }

        // 3. INITIAL FOCUS: Focus the modal wrapper to initiate focus trap
        modalRef.current.focus();
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        // 1. ESCAPE TO CLOSE
        if (e.key === "Escape") {
          onClose();
          return;
        }

        // 2. FOCUS TRAP
        if (e.key === "Tab") {
          const firstElement = firstFocusableRef.current;
          const lastElement = lastFocusableRef.current;

          if (!firstElement || !lastElement) return;

          if (e.shiftKey) {
            // Shift + Tab: if on the first element (or modal container), jump to last
            if (document.activeElement === firstElement || document.activeElement === modalRef.current) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            // Tab: if on the last element, jump to first
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      // Disable background scrolling
      document.body.style.overflow = "hidden";
      
      // Attach the keydown listener
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        // Clean up the event listener and restore focus
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "auto";
        if (previouslyFocusedElement.current) {
          previouslyFocusedElement.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onPointerDown={(e) => {
      // Close if clicking the backdrop directly
      if (e.target === e.currentTarget) onClose();
    }}>
      <div 
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        ref={modalRef}
      >
        <div className={styles.header}>
          <h2 id="modal-title" className={styles.title}>{title}</h2>
          <button 
            className={styles.closeBtn} 
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}
