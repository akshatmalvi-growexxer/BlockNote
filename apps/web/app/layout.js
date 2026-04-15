import "./globals.css";
import ThemeToggle from "../components/ThemeToggle";

export const metadata = {
  title: "FluxNotes — Block-based notes, beautifully simple",
  description:
    "A focused, block-based workspace for fast notes and structured docs. Beautiful, blazing-fast, and built for clarity.",
  keywords: [
    "notes",
    "block editor",
    "productivity",
    "documents",
    "workspace",
    "FluxNotes",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
