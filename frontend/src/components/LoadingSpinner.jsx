const LoadingSpinner = ({ label = "Processing..." }) => {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      <span>{label}</span>
    </div>
  );
};

export default LoadingSpinner;
