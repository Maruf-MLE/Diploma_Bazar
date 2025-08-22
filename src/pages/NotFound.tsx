import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">৪০৪</h1>
        <p className="text-xl text-gray-600 mb-4">দুঃখিত! এই পেজটি পাওয়া যায়নি</p>
        <p className="text-gray-500 mb-6">
          আপনি যে লিংকটি খুঁজছেন সেটি হয়তো সরানো হয়েছে বা আর নেই।
        </p>
        <div className="space-y-3">
          <a 
            href="/" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            হোম পেজে ফিরুন
          </a>
          <p className="text-sm text-gray-500">
            সাহায্য প্রয়োজন?{" "}
            <a href="https://www.facebook.com/diplomabazar/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              যোগাযোগ করুন
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
