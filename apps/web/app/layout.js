import "./globals.css";

export const metadata = {
  title: "FluxNotes",
  description: "Minimal block-based document editor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
