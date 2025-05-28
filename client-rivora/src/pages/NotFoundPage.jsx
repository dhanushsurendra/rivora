import NotFoundIcon from '../components/Icons/NotFoundIcon';

const NotFoundPage = () => {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white flex flex-col items-center justify-center p-6 font-inter">
      <style>
        {`
          /* Custom styling for the SVG to ensure it scales and looks good */
          .not-found-svg {
            max-width: 100%;
            height: auto;
            margin-bottom: 2.5rem; /* Equivalent to mb-10 */
          }

          /* Ensure native date/time pickers are dark mode friendly */
          input[type="date"]::-webkit-calendar-picker-indicator,
          input[type="time"]::-webkit-calendar-picker-indicator {
            filter: invert(1); /* Makes the icon white on dark background */
          }
          input[type="date"], input[type="time"], select {
            color-scheme: dark;
          }
        `}
      </style>
      <div className="text-center max-w-2xl">
        {/* Custom SVG Image - Designed to look like a simple diagram/illustration from draw.io */}
        <NotFoundIcon />
        <h1 className="text-6xl md:text-7xl font-bold text-[#8A65FD] mb-4">
          404
        </h1>
        <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
          Page Not Found
        </h2>
        <p className="text-lg text-gray-400 mb-8 leading-relaxed">
          Oops! It looks like the page you're looking for doesn't exist or has been moved.
          Don't worry, we'll help you get back on track.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={handleGoHome}
            className="px-8 py-3 bg-[#8A65FD] text-white font-normal rounded-lg shadow-md
                       hover:bg-[#724EE0] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#8A65FD] focus:ring-opacity-75 w-full sm:w-auto"
          >
            Go to Homepage
          </button>
          <button
            onClick={handleGoBack}
            className="px-8 py-3 border border-gray-600 text-gray-300 font-normal rounded-lg shadow-md
                       hover:bg-gray-700 hover:border-gray-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 w-full sm:w-auto"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
