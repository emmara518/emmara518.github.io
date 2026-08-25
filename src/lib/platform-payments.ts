/**
 * Platform payment channels — shown to students in the wallet section.
 * ⚠️ OWNER: replace the account values below with the real platform numbers.
 */

export type PaymentChannel = {
  id: string;
  label: string;
  account: string;
  owner: string;
  hint?: string;
};

export const PAYMENT_CHANNELS: PaymentChannel[] = [
  { id: "instapay", label: "إنستاباي (InstaPay)", account: "010XXXXXXXX", owner: "دروس ماث", hint: "تحويل فوري من أي تطبيق بنكي" },
  { id: "vodafone_cash", label: "فودافون كاش", account: "010XXXXXXXX", owner: "دروس ماث" },
  { id: "etisalat_cash", label: "اتصالات كاش", account: "011XXXXXXXX", owner: "دروس ماث" },
  { id: "orange_cash", label: "أورنج كاش", account: "012XXXXXXXX", owner: "دروس ماث" },
];

export const PAYMENT_METHOD_IDS = PAYMENT_CHANNELS.map((c) => c.id);

export function channelLabel(id: string): string {
  return PAYMENT_CHANNELS.find((c) => c.id === id)?.label ?? id;
}
