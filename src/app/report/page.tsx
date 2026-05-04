"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, MapPin, Upload, Loader2, AlertCircle, CheckCircle2, ImagePlus } from "lucide-react";
import { useReports } from "@/context/ReportContext";
import Image from "next/image";

export default function ReportPage() {
  const router = useRouter();
  const { addReport } = useReports();
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPG, PNG)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setError(null);
        setLocating(false);
      },
      () => {
        setError("Unable to retrieve your location. Please check your permissions.");
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      setError("Please take or upload a photo of the issue");
      return;
    }
    if (!location) {
      setError("Please provide the location of the issue");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          lat: location.lat,
          lng: location.lng,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process the image");
      }

      const result = await response.json();

      addReport({
        image,
        lat: result.lat,
        lng: result.lng,
        issue_type: result.issue_type,
        severity: result.severity,
        brief_description: result.brief_description,
      });

      router.push("/");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gray-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pb-20 sm:pb-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-5 sm:p-6 text-white text-center">
          <h1 className="text-xl sm:text-2xl font-bold">Report an Issue</h1>
          <p className="text-blue-100 mt-1 text-xs sm:text-sm">Help improve your community</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* ===== Image Upload Area ===== */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo of the Issue
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden active:scale-[0.99] ${
                image
                  ? 'border-blue-500 h-48 sm:h-52'
                  : 'border-gray-300 hover:border-blue-400 bg-gray-50 h-40 sm:h-48'
              }`}
            >
              {image ? (
                <>
                  <Image src={image} alt="Preview" fill className="object-cover" unoptimized />
                  {/* Re-upload overlay */}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
                    <span className="text-white text-sm font-medium opacity-0 hover:opacity-100 transition-opacity bg-black/50 px-3 py-1.5 rounded-full">
                      Tap to change
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 p-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-50 rounded-full flex items-center justify-center">
                    <ImagePlus className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400" />
                  </div>
                  <span className="text-sm text-gray-600 font-medium text-center">
                    Tap to take a photo or upload
                  </span>
                  <span className="text-xs text-gray-400">JPG, PNG accepted</span>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
              capture="environment"
            />
          </div>

          {/* ===== Location Area ===== */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Location
            </label>
            <button
              type="button"
              onClick={getLocation}
              disabled={locating}
              className={`w-full flex items-center justify-center gap-2 p-3 sm:p-3.5 rounded-xl border transition-all active:scale-[0.98] min-h-[48px] ${
                location
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : locating
                  ? 'border-blue-300 bg-blue-50 text-blue-600'
                  : 'border-gray-300 hover:border-blue-400 bg-white text-gray-700'
              }`}
            >
              {location ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-sm sm:text-base">Location Acquired</span>
                </>
              ) : locating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium text-sm sm:text-base">Getting location...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium text-sm sm:text-base">Get My Current Location</span>
                </>
              )}
            </button>
            {location && (
              <p className="text-xs text-center text-gray-500 mt-2">
                📍 {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            )}
          </div>

          {/* ===== Error Message ===== */}
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs sm:text-sm flex items-start gap-2 animate-fade-in-up">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ===== Submit Button ===== */}
          <button
            type="submit"
            disabled={loading || !image || !location}
            className={`w-full py-3 sm:py-3.5 rounded-xl text-white font-bold text-base sm:text-lg flex items-center justify-center gap-2 transition-all min-h-[48px] ${
              loading || !image || !location
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-200'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                <span className="text-sm sm:text-base">AI is analyzing the road...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Submit Report</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
