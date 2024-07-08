export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <h2>
        hera
      </h2>
      {children}
    </div>
    
  );
}