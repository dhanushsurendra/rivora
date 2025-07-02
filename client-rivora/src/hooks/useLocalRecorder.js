import { useRef, useState, useEffect, useCallback } from "react";

// CLOUD_NAME and UPLOAD_PRESET are now used again for Cloudinary uploads
const CLOUD_NAME = "dntwulwaj"; // Replace with your Cloudinary Cloud Name
const UPLOAD_PRESET = "rivora_preset"; // Replace with your Cloudinary Upload Preset

const useLocalRecording = (sessionId, userRole) => {

  const mediaStreamRef = useRef(null); // Holds the MediaStream from getUserMedia
  const [isRecording, setIsRecording] = useState(false); // Public state for recording status
  const recordingActiveRef = useRef(false); // Internal mutable flag to control the chunk recording loop
  const chunkCounterRef = useRef(0); // To keep track of chunk numbers for logging and unique public_ids
  const [uploadedChunkUrls, setUploadedChunkUrls] = useState([]); // To store URLs of successfully uploaded chunks
  const currentRecorderRef = useRef(null); // To hold the currently active MediaRecorder instance
  const [isUploading, setIsUploading] = useState(false); // State to indicate if an upload is in progress
  const [uploadProgress, setUploadProgress] = useState(0); // NEW: State to store upload progress (0-100)

  // This function records a single chunk and then recursively calls itself
  // if the recordingActiveRef flag is still true.
  const recordChunk = useCallback(async () => {
    console.log(`[${userRole}] >> recordChunk triggered`);

    // Stop condition for the recursive loop
    if (!recordingActiveRef.current || !mediaStreamRef.current) {
      console.log(`[${userRole}] >> Recording stopped or stream unavailable, terminating loop.`);
      return;
    }

    const currentChunkNum = chunkCounterRef.current++; // Get current chunk number and increment for the next one

    let recorder;
    try {
      // Create a new MediaRecorder for each chunk
      recorder = new MediaRecorder(mediaStreamRef.current, {
        mimeType: "video/webm;codecs=vp8,opus", // You can experiment with other MIME types here
      });
      currentRecorderRef.current = recorder; // Store the new recorder instance
      console.log(`[${userRole}] 🎥 MediaRecorder created for chunk ${currentChunkNum} with MIME type: ${recorder.mimeType}`);
    } catch (error) {
      console.error(`[${userRole}] ❌ Failed to create MediaRecorder for chunk ${currentChunkNum}:`, error);
      // If MediaRecorder creation fails, stop the entire recording process
      recordingActiveRef.current = false;
      setIsRecording(false);
      // Stop the stream tracks as well if recording cannot proceed
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      currentRecorderRef.current = null; // Clear recorder ref on failure
      return;
    }

    const chunks = []; // Array to hold data for the current chunk

    // Event handler for when data is available from the recorder
    recorder.ondataavailable = (e) => {
      console.log(`[${userRole}] 📦 Data available for chunk ${currentChunkNum}, size: ${e.data.size} bytes`);
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    // Event handler for when the recorder stops
    recorder.onstop = async () => { // Made onstop async to handle fetch
      console.log(`[${userRole}] MediaRecorder stopped for chunk ${currentChunkNum}. State: ${recorder.state}`);
      const blob = new Blob(chunks, { type: recorder.mimeType }); // Create a Blob from collected chunks

      // Clear the currentRecorderRef once this recorder has stopped
      if (currentRecorderRef.current === recorder) {
        currentRecorderRef.current = null;
      }

      if (blob.size === 0) {
        console.warn(`[${userRole}] ⚠️ Chunk ${currentChunkNum} is empty, skipping upload.`);
        // Continue the loop even if this chunk is empty
        if (recordingActiveRef.current) {
          setTimeout(recordChunk, 100);
        } else {
          console.log(`[${userRole}] Recording loop explicitly ended by stopRecording call.`);
        }
        return;
      }

      // --- Cloudinary Upload Logic for each chunk ---
      setIsUploading(true); // Set uploading to true before starting the upload
      setUploadProgress(0); // Reset progress for the new chunk upload

      const formData = new FormData();
      formData.append("file", blob);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("resource_type", "video");

      // Generate a unique public_id for each chunk
      // Use sessionId, userRole, chunkNum, and Date.now() for robust uniqueness
      const publicId = `${sessionId}/${userRole}/chunk-${currentChunkNum}-${Date.now()}`;
      formData.append("public_id", publicId);

      // Create a new XMLHttpRequest to track progress, as fetch doesn't directly support it
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`);

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(percentComplete);
        }
      });

      xhr.onload = () => {
        setIsUploading(false); // Upload finished (success or failure)
        setUploadProgress(0); // Reset progress
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          console.log(`[${userRole}] ✅ Uploaded chunk ${currentChunkNum}: ${data.secure_url}`);
          setUploadedChunkUrls((prev) => [...prev, data.secure_url]); // Store the URL
        } else {
          const errorData = JSON.parse(xhr.responseText);
          console.error(
            `[${userRole}] ❌ Upload failed for chunk ${currentChunkNum} (Status: ${xhr.status}):`,
            errorData.error?.message || xhr.statusText,
            errorData
          );
        }
      };

      xhr.onerror = () => {
        setIsUploading(false); // Upload finished (error)
        setUploadProgress(0); // Reset progress
        console.error(`[${userRole}] ❌ Network error during upload for chunk ${currentChunkNum}.`);
      };

      xhr.send(formData); // Send the FormData

      // --- End Cloudinary Upload Logic ---

      // Continue the loop if the recording is still active
      if (recordingActiveRef.current) {
        setTimeout(recordChunk, 100); // Slight delay before starting the next chunk to avoid browser strain
      } else {
        console.log(`[${userRole}] Recording loop explicitly ended by stopRecording call.`);
      }
    };

    // Start recording the current chunk
    recorder.start();
    console.log(`[${userRole}] ⏺️ Recording chunk ${currentChunkNum}`);
    // Stop recording after 5 seconds
    setTimeout(() => {
      console.log(`[${userRole}] Attempting to stop recorder for chunk ${currentChunkNum}. Current state: ${recorder.state}`);
      if (recorder.state === "recording") { // Only stop if it's still actively recording
        recorder.stop();
      } else {
        console.warn(`[${userRole}] Recorder for chunk ${currentChunkNum} was not in 'recording' state, state was: ${recorder.state}`);
      }
    }, 5000); // Record for 5 seconds
  }, [sessionId, userRole]); // Dependencies: sessionId and userRole (for logging)

  // Function to initiate the recording process
  const startRecording = useCallback(async () => {
    if (isRecording) {
      console.warn(`[${userRole}] 🚫 Already recording, skipping start`);
      return;
    }

    try {
      // Request media access from the user
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log('[${userRole}] 🎤 Media stream started');
      setIsRecording(true); // Update public state
      recordingActiveRef.current = true; // Set internal flag to true to start the loop
      chunkCounterRef.current = 0; // Reset chunk counter for a new recording session
      setUploadedChunkUrls([]); // Clear previous URLs for a new recording session
      setIsUploading(false); // Ensure uploading state is false at the start of a new recording
      setUploadProgress(0); // Ensure progress is reset at the start of a new recording

      recordChunk(); // Start the first chunk recording
    } catch (error) {
      console.error('[${userRole}] ❌ Could not start media stream:', error);
      setIsRecording(false); // Reset public state on error
      recordingActiveRef.current = false; // Reset internal flag on error
      setIsUploading(false); // Reset uploading state on error
      setUploadProgress(0); // Reset progress on error
      // Stop tracks if getUserMedia failed
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    }
  }, [isRecording, recordChunk, userRole]); // Dependencies: isRecording to prevent re-entry, recordChunk to ensure it's the stable memoized version

  // Function to stop the recording process
  const stopRecording = useCallback(() => {
    if (!recordingActiveRef.current) { // Check internal ref for active recording
      console.warn('[${userRole}] ⚠️ No recording in progress to stop');
      return;
    }

    setIsRecording(false); // Update public state
    recordingActiveRef.current = false; // Set internal flag to false to stop the loop

    // Immediately stop the currently active MediaRecorder instance
    if (currentRecorderRef.current && currentRecorderRef.current.state === "recording") {
      console.log('[${userRole}] 🛑 Stopping current MediaRecorder instance immediately.');
      currentRecorderRef.current.stop();
      currentRecorderRef.current = null; // Clear the ref after stopping
    } else {
      console.log('[${userRole}] No active MediaRecorder instance to stop immediately.');
    }

    // Stop all tracks on the media stream to release camera/mic
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      console.log('[${userRole}] 🛑 Media stream tracks stopped.');
    }
    console.log('[${userRole}] 🛑 Recording stopped by user.');
  }, [userRole]);

  // Cleanup effect: Ensures media tracks are stopped and loop is terminated if component unmounts
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (currentRecorderRef.current && currentRecorderRef.current.state === "recording") {
        currentRecorderRef.current.stop(); // Stop if still recording on unmount
      }
      currentRecorderRef.current = null; // Clear ref on unmount
      recordingActiveRef.current = false; // Ensure the recording loop stops
      setIsRecording(false); // Ensure state is reset
      setIsUploading(false); // Ensure uploading state is reset on unmount
      setUploadProgress(0); // Ensure progress is reset on unmount
      console.log('[${userRole}] 🧹 Cleaned up recording resources on unmount.');
    };
  }, [userRole]); // Dependency: userRole for logging in cleanup

  return {
    startRecording,
    stopRecording,
    isRecording,
    isUploading, // Return the isUploading state
    uploadProgress, // NEW: Return the uploadProgress state
    uploadedChunkUrls,
  };
}

export default useLocalRecording;