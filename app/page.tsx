"use client";

import {
  ImageKitAbortError,
  ImageKitInvalidRequestError,
  ImageKitServerError,
  ImageKitUploadNetworkError,
  upload,
} from "@imagekit/next";
import { apiClient } from "@/lib/api-client";
import { IVideo } from "@/models/Video";
import { IKVideo } from "imagekitio-next";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IKUploadResponse } from "imagekitio-next/dist/types/components/IKUpload/props";
import toast from "react-hot-toast";

export default function Home() {
  const [videos, setVideos] = useState<IVideo[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<IKUploadResponse | null>(
    null
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: session } = useSession();

  const fetchVideos = async () => {
    try {
      const data = await apiClient.getVideos();
      console.log(data);
      setVideos(data);
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const abortController = new AbortController();

  const authenticator = async () => {
    try {
      // Perform the request to the upload authentication endpoint.
      const response = await fetch("/api/upload-auth");
      if (!response.ok) {
        // If the server response is not successful, extract the error text for debugging.
        const errorText = await response.text();
        throw new Error(
          `Request failed with status ${response.status}: ${errorText}`
        );
      }

      // Parse and destructure the response JSON for upload credentials.
      const data = await response.json();
      const { signature, expire, token, publicKey } = data;
      return { signature, expire, token, publicKey };
    } catch (error) {
      // Log the original error for debugging before rethrowing a new error.
      console.error("Authentication error:", error);
      throw new Error("Authentication request failed");
    }
  };

  const handleUpload = async (selectedFile: File) => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    // Retrieve authentication parameters for the upload.
    let authParams;
    try {
      authParams = await authenticator();
    } catch (authError) {
      console.error("Failed to authenticate for upload:", authError);
      return;
    }
    const { signature, expire, token, publicKey } = authParams;

    // Call the ImageKit SDK upload function with the required parameters and callbacks.
    try {
      const uploadResponse = (await upload({
        // Authentication parameters
        expire,
        token,
        signature,
        publicKey,
        file: selectedFile,
        fileName: selectedFile.name,
        onProgress: (event) => {
          setUploadProgress((event.loaded / event.total) * 100);
        },
        // Abort signal to allow cancellation of the upload if needed.
        abortSignal: abortController.signal,
      })) as IKUploadResponse;
      setUploadedVideo(uploadResponse);
      setUploadProgress(100);
      toast.success("Video uploaded successfully!");
      console.log("Upload Response:", uploadResponse);
    } catch (error) {
      // Handle specific error types provided by the ImageKit SDK.
      if (error instanceof ImageKitAbortError) {
        console.error("Upload aborted:", error.reason);
      } else if (error instanceof ImageKitInvalidRequestError) {
        console.error("Invalid request:", error.message);
      } else if (error instanceof ImageKitUploadNetworkError) {
        console.error("Network error:", error.message);
      } else if (error instanceof ImageKitServerError) {
        console.error("Server error:", error.message);
      } else {
        // Handle any other errors that may occur.
        console.error("Upload error:", error);
      }
    }
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    // Wait for the upload to complete before saving the video details
    if (!uploadedVideo) return;

    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          thumbnailUrl: uploadedVideo.thumbnailUrl,
          videoUrl: uploadedVideo.filePath,
        }),
      });

      if (response.ok) {
        toast.success("Video saved!");
        setShowModal(false);
        setUploadedVideo(null);
        setTitle("");
        setDescription("");
        fetchVideos();
      } else {
        toast.error("Failed to save video");
      }
    } catch (err) {
      toast.error("Error saving video");
      setShowModal(false);
    }
  };

  if (!session || !session.user) {
    return (
      <>
        <div className="min-h-[500px] flex flex-col items-center justify-center">
          <div className="text-center space-y-6 p-8 rounded-lg border border-gray-200 shadow-lg bg-white max-w-md w-full">
            <h1 className="text-3xl font-bold text-gray-900">Please Login</h1>
            <p className="text-gray-600">
              You need to be logged in to access ReelsVibe
            </p>
            <Link
              href="/sign-in"
              className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Sign In
            </Link>
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <section className="max-w-screen-xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-10 text-blue-700 drop-shadow">
          Trending Reels
        </h1>

        {/* File Upload Section */}
        <button
          onClick={() => setShowModal(true)}
          className="max-w-2xl my-8 mx-auto border bg-sky-500 w-full py-2 rounded"
        >
          Upload Video
        </button>

        {/* Modal for video details */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-100/10 flex items-center justify-center z-50">
            <form
              onSubmit={handleSaveVideo}
              className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md space-y-4 text-gray-600"
            >
              <h2 className="text-xl font-bold mb-2">Upload Video </h2>
              <div className="border rounded px-3 py-2">
                <input
                  type="file"
                  accept="video/*"
                  disabled={uploadProgress > 0 && uploadProgress < 100}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const selectedFile = e.target.files[0];
                      setUploadProgress(0);
                      setUploadedVideo(null);
                      handleUpload(selectedFile); // Pass the file directly
                    }
                  }}
                  className="w-full text-gray-600"
                />
                {/* Progress Bar */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
                {uploadProgress === 100 && (
                  <div className="text-green-600 text-sm mt-2">
                    Upload complete!
                  </div>
                )}
              </div>
              <input
                type="text"
                placeholder="Title"
                className="border rounded px-3 py-2 w-full text-gray-600"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <textarea
                placeholder="Description"
                className="border rounded px-3 py-2 w-full text-gray-600"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className={`bg-blue-600 text-white px-4 py-2 rounded ${
                    !uploadedVideo ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  disabled={!uploadedVideo}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="bg-gray-300 px-4 py-2 rounded"
                  onClick={() => {
                    setShowModal(false);
                    setUploadedVideo(null);
                    setUploadProgress(0);
                    setTitle("");
                    setDescription("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {videos.map((video) => (
              <div
                key={video._id?.toString()}
                className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col items-center p-4 hover:scale-105 transition"
              >
                <IKVideo
                  path={video.videoUrl}
                  transformation={[
                    {
                      height: video.transformation?.height,
                      width: video.transformation?.width,
                    },
                  ]}
                  urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
                  controls={video?.controls}
                  className="rounded-lg w-full h-64 object-cover mb-4"
                />
                <div className="w-full text-center">
                  <h2 className="font-semibold text-lg text-gray-800 mb-2">
                    {video.title || "Untitled Reel"}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {video.description || "No description"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 text-lg">
            No videos available
          </p>
        )}
      </section>
    </>
  );
}
