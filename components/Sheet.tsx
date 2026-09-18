"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { IconButton } from "@/components/IconButton";

let openDialogs = 0;
let savedOverflow = "";

interface Props {
  open: boolean;
  title: string;
  titleId: string;
  onClose: () => void;
  children: ReactNode;
  compact?: boolean;
}
export function Sheet({ open, title, titleId, onClose, children, compact = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog?.showModal();
    if (openDialogs === 0) savedOverflow = document.body.style.overflow;
    openDialogs += 1;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      openDialogs -= 1;
      if (openDialogs === 0) document.body.style.overflow = savedOverflow;
      if (previous instanceof HTMLElement && previous.isConnected) {
        const parentDialog = previous.closest("dialog");
        if (!parentDialog || parentDialog.open) previous.focus();
      }
    };
  }, [open]);
  return <dialog ref={ref} className={`sheet-dialog ${compact ? "compact-dialog" : ""}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    {open ? <motion.section className="sheet-surface" initial={reduced ? false : { y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", damping: 30, stiffness: 320 }}>
      <div className="sheet-handle" aria-hidden="true" />
      <header className="sheet-header"><h2 id={titleId}>{title}</h2><IconButton label="إغلاق" onClick={onClose}><X size={19} /></IconButton></header>
      {children}
    </motion.section> : null}
  </dialog>;
}
