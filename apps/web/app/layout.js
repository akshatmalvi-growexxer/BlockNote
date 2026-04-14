import "./globals.css";
import ThemeToggle from "../components/ThemeToggle";

export const metadata = {
  title: "FluxNotes",
  description: "Minimal block-based document editor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
