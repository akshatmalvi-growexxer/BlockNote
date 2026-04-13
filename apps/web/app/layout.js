import "./globals.css";

export const metadata = {
  title: "BlockNote",
  description: "Browser-based block document editor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
