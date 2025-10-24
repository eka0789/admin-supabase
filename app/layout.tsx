import "./globals.css";

export const metadata = {
  title: "Admin Dashboard",
  description: "Admin panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
