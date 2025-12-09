"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

function LoadingFallback() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)", 
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        width: "48px",
        height: "48px",
        border: "4px solid #2D3B5F",
        borderTopColor: "#0EA5E9",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }} />
    </div>
  )
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [orderDetails, setOrderDetails] = useState<{
    customerEmail?: string
    amountTotal?: number
    paymentStatus?: string
  } | null>(null)

  useEffect(() => {
    if (sessionId) {
      setOrderDetails({ paymentStatus: "paid" })
    }
  }, [sessionId])

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #0A0F2C 0%, #0B0E28 100%)", 
      color: "#FFFFFF", 
      fontFamily: "system-ui, -apple-system, sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px"
    }}>
      <div style={{
        maxWidth: "600px",
        width: "100%",
        textAlign: "center"
      }}>
        <div style={{
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #10F981 0%, #00FF66 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 32px",
          fontSize: "60px"
        }}>
          ✓
        </div>

        <h1 style={{ 
          fontSize: "36px", 
          fontWeight: "bold", 
          marginBottom: "16px" 
        }}>
          Order <span style={{ color: "#10F981" }}>Confirmed!</span>
        </h1>

        <p style={{ 
          fontSize: "18px", 
          color: "#94A3B8", 
          marginBottom: "32px",
          lineHeight: "1.6"
        }}>
          Thank you for your order! We&apos;ve received your payment and will begin processing your order immediately.
        </p>

        <div style={{
          backgroundColor: "#1A1F3A",
          borderRadius: "16px",
          padding: "32px",
          marginBottom: "32px",
          border: "1px solid #2D3B5F",
          textAlign: "left"
        }}>
          <h3 style={{ 
            fontSize: "14px", 
            fontWeight: "600", 
            textTransform: "uppercase", 
            letterSpacing: "1px",
            color: "#0EA5E9",
            marginBottom: "24px"
          }}>
            What&apos;s Next?
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "rgba(14, 165, 233, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0
              }}>
                📧
              </div>
              <div>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>Confirmation Email</div>
                <div style={{ fontSize: "14px", color: "#94A3B8" }}>
                  You&apos;ll receive an order confirmation email shortly with your receipt.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "rgba(14, 165, 233, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0
              }}>
                📦
              </div>
              <div>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>Order Processing</div>
                <div style={{ fontSize: "14px", color: "#94A3B8" }}>
                  Your order will be processed and shipped within 1-2 business days.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "rgba(14, 165, 233, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0
              }}>
                🚚
              </div>
              <div>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>Tracking Information</div>
                <div style={{ fontSize: "14px", color: "#94A3B8" }}>
                  Once shipped, you&apos;ll receive tracking information via email.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "rgba(14, 165, 233, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0
              }}>
                🔧
              </div>
              <div>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>Professional Services</div>
                <div style={{ fontSize: "14px", color: "#94A3B8" }}>
                  If you ordered installation or configuration services, our team will contact you to schedule.
                </div>
              </div>
            </div>
          </div>
        </div>

        {sessionId && (
          <div style={{
            backgroundColor: "#0A0F2C",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "32px",
            border: "1px solid #2D3B5F"
          }}>
            <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "4px" }}>
              Order Reference
            </div>
            <div style={{ fontSize: "14px", fontFamily: "monospace", color: "#94A3B8" }}>
              {sessionId}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link 
            href="/store"
            style={{
              padding: "14px 28px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              textDecoration: "none",
              background: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)",
              color: "#fff"
            }}
          >
            Continue Shopping
          </Link>
          <Link 
            href="/dashboard"
            style={{
              padding: "14px 28px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              textDecoration: "none",
              backgroundColor: "transparent",
              border: "1px solid #2D3B5F",
              color: "#94A3B8"
            }}
          >
            Go to Dashboard
          </Link>
        </div>

        <div style={{ marginTop: "48px", fontSize: "14px", color: "#64748B" }}>
          <p>Questions about your order?</p>
          <p style={{ color: "#0EA5E9" }}>support@skyyield.io</p>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  )
}