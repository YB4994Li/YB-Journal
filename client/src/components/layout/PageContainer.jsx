export default function PageContainer({ children, className = '' }) {
  return <div className={`mx-auto w-full max-w-[1700px] px-4 py-6 sm:px-5 lg:px-8 ${className}`}>{children}</div>;
}
