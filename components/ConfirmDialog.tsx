import { ShieldQuestion } from "lucide-react";
import { Sheet } from "@/components/Sheet";

export interface Confirmation {
  title: string;
  message: string;
  action: string;
  onConfirm: () => void;
}
export function ConfirmDialog({ confirmation, onClose }: { confirmation: Confirmation | null; onClose: () => void }) {
  return <Sheet open={confirmation !== null} title={confirmation?.title ?? "تأكيد الإجراء"} titleId="confirm-title" onClose={onClose} compact>
    <div className="confirm-emblem"><ShieldQuestion size={28} /></div>
    <p className="sheet-description">{confirmation?.message}</p>
    <div className="sheet-actions">
      <button className="button button-danger" onClick={() => { confirmation?.onConfirm(); onClose(); }}>{confirmation?.action}</button>
      <button className="button button-secondary" onClick={onClose} autoFocus>تراجع</button>
    </div>
  </Sheet>;
}
