"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { text, uuid } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";

const STATUSES = ["confermato", "pronto", "ritirato"];

// Cambia lo stato di un ordine. Il database controlla che sia un ordine della propria gastronomia.
export async function setOrderStatus(formData: FormData): Promise<void> {
  await requireProfile(["cucina", "admin"]);
  const orderId = uuid(formData, "order_id");
  const status = text(formData, "status");
  if (!orderId || !STATUSES.includes(status)) return;

  const supabase = await createClient();
  await supabase.rpc("set_order_status", { p_order: orderId, p_status: status });
  revalidatePath("/cucina");
}
