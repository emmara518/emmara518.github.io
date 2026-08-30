"use client";

/**
 * Root-level error boundary. Replaces the root layout when an error
 * escapes the root layout itself. Must include its own <html> and
 * <body> tags because the root layout is unavailable here.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Tahoma, sans-serif',
          background: "#F4F5F2",
          color: "#18201F",
        }}
      >
        <main
          style={{
            maxWidth: "32rem",
            width: "100%",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.5rem" }}>
            تعذّر تحميل المنصة
          </h1>
          <p
            style={{
              color: "#53605E",
              lineHeight: 1.7,
              margin: "0 0 1.5rem",
            }}
          >
            حدث خطأ غير متوقع على مستوى المنصة. حاول إعادة التحميل، أو ارجع لاحقًا.
          </p>
          {error?.digest ? (
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                color: "#858F8D",
                margin: "0 0 1rem",
                direction: "ltr",
              }}
            >
              digest: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "0.75rem",
              border: "1px solid #287F83",
              background: "transparent",
              color: "#287F83",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            إعادة المحاولة
          </button>
        </main>
      </body>
    </html>
  );
}
