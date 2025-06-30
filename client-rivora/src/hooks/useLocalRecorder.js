import { useState, useRef } from 'react'
import { ref, uploadBytes } from 'firebase/storage'
import { storage } from '../firebase'

export const useLocalRecorder = (sessionId, userName) => {
  const [isRecording, setIsRecording] = useState(false)
  const recordedRef = useRef(null)

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })

    recordedRef.current = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus',
    })

    recordedRef.current.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        const chunkRef = ref(
          storage,
          `recordings/${sessionId}/${userName}/chunk-${Date.now()}.webm`
        )
        try {
          await uploadBytes(chunkRef, event.data)
          console.log('Uploaded a chunk')
        } catch (err) {
          console.error('Upload failed:', err)
        }
      }
    }

    recordedRef.current.onstart = () => setIsRecording(true)
    recordedRef.current.onstop = () => setIsRecording(false)

    recordedRef.current.start(5000) // Upload every 5 seconds
  }

  const stopRecording = () => {
    if (recordedRef.current?.state === 'recording') {
      recordedRef.current.stop()
    }
  }

  return { startRecording, stopRecording, isRecording }
}
