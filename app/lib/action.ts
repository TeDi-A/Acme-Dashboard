"use server";

import postgres from "postgres";
import { z } from "zod";
import {redirect} from "next/navigation";
import { revalidatePath } from "next/cache";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });
const FormSchema = z.object({
  id: z.string(),
  customerID: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["paid", "pending"]),
  date: z.string(),
});
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerID, amount, status } = CreateInvoice.parse({
    customerID: formData.get("customerID"),
    amount: parseFloat(formData.get("amount") as string), // Ensure amount is parsed as a number
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  await sql`
  INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerID}, ${amountInCents}, ${status}, ${date});
  `;

  
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
