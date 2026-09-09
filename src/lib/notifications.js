import { AlertTriangle, Clock, ShieldAlert, Check, UserPlus, Bell } from "lucide-react";

export const NOTIF_TYPES = [
  "PAYMENT_OVERDUE",
  "CLIP_STUCK_REVIEW",
  "GUARANTEE_APPROACHING",
  "CLIENT_APPROVAL",
  "NEW_LEAD",
];

export const TYPE_META = {
  PAYMENT_OVERDUE: { icon: AlertTriangle, color: "#FF453A", label: "Payment overdue" },
  CLIP_STUCK_REVIEW: { icon: Clock, color: "#FF9F0A", label: "Stuck in review" },
  GUARANTEE_APPROACHING: { icon: ShieldAlert, color: "#FF375F", label: "Guarantee" },
  CLIENT_APPROVAL: { icon: Check, color: "#30D158", label: "Client approval" },
  NEW_LEAD: { icon: UserPlus, color: "#0A84FF", label: "New lead" },
};

export function notifTypeMeta(type) {
  return TYPE_META[type] || { icon: Bell, color: "#8E8E93", label: type || "Info" };
}