export default function Footer() {
  return (
    <footer className="">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PestEdge-FSL. All rights reserved. | Built with hybrid few-shot learning technology.
          </p>
        </div>
      </div>
    </footer>
  );
}
