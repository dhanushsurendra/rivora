const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4">
      <div className="bg-[#1F1F1F] p-8 rounded-lg shadow-xl w-full max-w-md">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;