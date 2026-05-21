export default function CadastroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-sans bg-black text-white antialiased min-h-screen">
      {children}
    </div>
  );
}
