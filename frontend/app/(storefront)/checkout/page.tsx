"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCartStore, selectCartSubtotal } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { createOrder, COD_FEE, FREE_DELIVERY_THRESHOLD, SHIPPING_FEE } from "@/lib/api/orders";
import { sendOtp, verifyOtp } from "@/lib/api/otp";
import { formatPrice } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";

const addressSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  phone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  line1: z.string().min(3, "Enter your house / street / area"),
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2, "Enter your state"),
});

type AddressForm = z.infer<typeof addressSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore(selectCartSubtotal);
  const clearCart = useCartStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PHONEPE");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpId, setOtpId] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [placing, setPlacing] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AddressForm>({ resolver: zodResolver(addressSchema) });

  const shippingFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : SHIPPING_FEE;
  const codFee = paymentMethod === "COD" ? COD_FEE : 0;
  const total = subtotal + shippingFee + codFee;

  async function handleSendOtp() {
    const phone = watch("phone");
    if (!/^\d{10}$/.test(phone ?? "")) {
      toast.error("Enter your 10-digit phone number above first");
      return;
    }
    setSendingOtp(true);
    const res = await sendOtp(phone);
    setSendingOtp(false);
    if (!res.success) {
      toast.error(res.error.message);
      return;
    }
    setOtpId(res.data.otpId);
    setOtpSent(true);
    toast.success("OTP sent to your number");
  }

  async function handleVerifyOtp() {
    const code = otpDigits.join("");
    if (code.length !== 6) {
      toast.error("Enter all 6 digits");
      return;
    }
    const res = await verifyOtp(otpId, code);
    if (!res.success) {
      toast.error(res.error.message);
      return;
    }
    setOtpVerified(true);
    toast.success("Phone verified");
  }

  async function onSubmit(values: AddressForm) {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (paymentMethod === "COD" && !otpVerified) {
      toast.error("Verify your phone number to place a COD order");
      return;
    }
    setPlacing(true);
    const res = await createOrder({
      items,
      paymentMethod,
      userId: user?.id ?? null,
      contactName: values.fullName,
      ...(paymentMethod === "COD" ? { otpId } : {}),
      addressSnapshot: {
        label: null,
        line1: values.line1,
        line2: null,
        city: values.city,
        state: values.state,
        pincode: values.pincode,
        phone: values.phone,
      },
    });
    if (!res.success) {
      setPlacing(false);
      toast.error(res.error.message);
      return;
    }
    clearCart();
    // PhonePe: hand off to the hosted payment page (the backend redirect brings
    // the browser back to confirmation, carrying a guest token when needed).
    if (res.data.phonepeRedirectUrl) {
      window.location.href = res.data.phonepeRedirectUrl;
      return;
    }
    // COD (or mock): go straight to confirmation. Guests carry their token so
    // the confirmation page can fetch the order without a JWT.
    const token = !user && res.data.guestAccessToken ? `?token=${encodeURIComponent(res.data.guestAccessToken)}` : "";
    router.push(`/order-confirmation/${res.data.id}${token}`);
  }

  return (
    <>
      <Header variant="minimal" rightSlot={<span className="text-[13px] font-bold text-muted-light">Secure Checkout 🔒</span>} />
      <main className="flex-1">
        <div className="mx-auto max-w-[900px] px-4 pt-5 pb-14 sm:px-8 sm:pt-8">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-start gap-7">
            <div className="min-w-[280px] flex-1 basis-[380px] flex-[2] flex flex-col gap-5">
              <div className="rounded-[18px] border border-border-pink-light bg-white p-5">
                <h2 className="mb-3.5 text-base font-bold">Delivery Address</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Input placeholder="Full name" {...register("fullName")} error={errors.fullName?.message} />
                  </div>
                  <Input placeholder="Phone number" {...register("phone")} error={errors.phone?.message} />
                  <Input placeholder="Pincode" {...register("pincode")} error={errors.pincode?.message} />
                  <div className="col-span-2">
                    <Input placeholder="House / Street / Area" {...register("line1")} error={errors.line1?.message} />
                  </div>
                  <Input placeholder="City" {...register("city")} error={errors.city?.message} />
                  <Input placeholder="State" {...register("state")} error={errors.state?.message} />
                </div>
              </div>

              <div className="rounded-[18px] border border-border-pink-light bg-white p-5">
                <h2 className="mb-3.5 text-base font-bold">Payment Method</h2>
                <div className="mb-4 flex gap-3">
                  {(["PHONEPE", "COD"] as const).map((method) => {
                    const on = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(method);
                          setOtpSent(false);
                          setOtpVerified(false);
                        }}
                        className={`flex flex-1 items-center gap-2.5 rounded-2xl border-[1.5px] p-3.5 text-left ${
                          on ? "border-rose bg-surface-pink-light" : "border-border-secondary bg-white"
                        }`}
                      >
                        <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-[#5f259f] text-sm font-extrabold text-white">
                          {method === "PHONEPE" ? "P" : "₹"}
                        </div>
                        <div>
                          <div className="text-[13.5px] font-bold">{method === "PHONEPE" ? "PhonePe / UPI" : "Cash on Delivery"}</div>
                          <div className="text-[11.5px] text-muted-light">
                            {method === "PHONEPE" ? "Pay instantly via UPI" : "Pay when it arrives"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {paymentMethod === "COD" && (
                  <div className="rounded-2xl bg-input-fill p-4">
                    <div className="mb-2.5 text-[13.5px] font-bold">Verify your phone number</div>
                    {!otpSent ? (
                      <>
                        <p className="mb-2.5 text-[12.5px] text-muted">We&rsquo;ll text an OTP to confirm your COD order.</p>
                        <Button type="button" variant="primary" className="px-5.5 py-2.5 text-[13.5px]" onClick={handleSendOtp} disabled={sendingOtp}>
                          {sendingOtp ? "Sending…" : "Send OTP"}
                        </Button>
                      </>
                    ) : otpVerified ? (
                      <p className="text-[13px] font-bold text-success-text">✓ Phone number verified</p>
                    ) : (
                      <>
                        <p className="mb-2.5 text-[12.5px] text-muted">Enter the 6-digit code sent to your number.</p>
                        <div className="mb-3 flex gap-2">
                          {otpDigits.map((d, i) => (
                            <input
                              key={i}
                              value={d}
                              onChange={(e) => {
                                const next = [...otpDigits];
                                next[i] = e.target.value.replace(/\D/g, "").slice(0, 1);
                                setOtpDigits(next);
                              }}
                              maxLength={1}
                              className="h-12 w-full rounded-[10px] border-[1.5px] border-border-pink text-center text-lg font-bold outline-none"
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-3.5">
                          <button type="button" onClick={handleVerifyOtp} className="rounded-full bg-rose px-5 py-2 text-[13px] font-bold text-white">
                            Verify
                          </button>
                          <button type="button" onClick={handleSendOtp} className="text-[12.5px] font-bold text-rose">
                            Resend code
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky top-24 min-w-[260px] flex-1 basis-[280px] rounded-[18px] border border-border-pink-light bg-white p-5">
              <h2 className="mb-3.5 text-base font-bold">Order Summary</h2>
              <div className="mb-2 flex justify-between text-[13.5px] text-muted">
                <span>{items.length} item{items.length === 1 ? "" : "s"}</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="mb-2 flex justify-between text-[13.5px] text-muted">
                <span>Delivery</span>
                <span className={shippingFee === 0 ? "font-bold text-success-text" : ""}>
                  {shippingFee === 0 ? "Free" : formatPrice(shippingFee)}
                </span>
              </div>
              {codFee > 0 && (
                <div className="mb-2 flex justify-between text-[13.5px] text-muted">
                  <span>COD handling fee</span>
                  <span>{formatPrice(codFee)}</span>
                </div>
              )}
              <div className="my-3 h-px bg-border-pink-light" />
              <div className="mb-4.5 flex justify-between text-base font-extrabold">
                <span>Total</span>
                <span className="text-rose">{formatPrice(total)}</span>
              </div>
              <Button type="submit" variant="primary" className="w-full" disabled={placing}>
                {placing ? "Placing Order…" : "Place Order"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
