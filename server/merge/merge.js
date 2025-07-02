require('dotenv').config() // Load environment variables from .env file
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Session = require('./models/session') // Adjust path as needed

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Configuration for retry mechanism
const MAX_RETRIES = 10
const RETRY_DELAY_MS = 5000 // 5 seconds

/**
 * Utility function to introduce a delay.
 * @param {number} ms - The delay in milliseconds.
 * @returns {Promise<void>} A promise that resolves after the specified delay.
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Check if a resource exists in Cloudinary and optionally get its duration.
 * Includes retry logic for eventual consistency.
 * @param {string} publicId - The public ID to check
 * @param {string} resourceType - The resource type ('video', 'image', etc.)
 * @returns {Promise<{exists: boolean, duration?: number}>} Object with existence status and duration if found.
 */
async function getResourceDetailsWithRetry(publicId, resourceType = 'video') {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const resource = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      })
      return { exists: true, duration: resource.duration }
    } catch (error) {
      if (error.http_code === 404) {
        console.warn(
          `[Resource Check] Resource ${publicId} not found (attempt ${
            i + 1
          }/${MAX_RETRIES}). Retrying...`
        )
        await delay(RETRY_DELAY_MS)
      } else {
        console.error(
          `[Resource Check] Error fetching resource ${publicId} (attempt ${
            i + 1
          }/${MAX_RETRIES}):`,
          error.message || error
        )
        throw error // Re-throw for other errors
      }
    }
  }
  return { exists: false } // Resource not found after all retries
}

/**
 * Utility to get sorted chunks from Cloudinary for a given path
 * @param {string} sessionId - The ID of the session.
 * @param {string} role - The role (e.g., 'host', 'guest').
 * @returns {Promise<string[]>} An array of sorted public_ids of the chunks.
 */
async function getSortedChunks(sessionId, role) {
  const folderPrefix = `recordings/${sessionId}/${role}/chunk-`
  console.log(
    `[Cloudinary API] Attempting to fetch resources with prefix: ${folderPrefix}`
  )

  try {
    const resources = await cloudinary.api.resources({
      type: 'upload',
      prefix: folderPrefix,
      resource_type: 'video',
      max_results: 500,
    })

    if (
      !resources ||
      !resources.resources ||
      resources.resources.length === 0
    ) {
      console.warn(
        `[Cloudinary API] No resources found for prefix: ${folderPrefix}. Returning empty array.`
      )
      return []
    }

    console.log(
      `[Cloudinary API] Found ${resources.resources.length} resources for prefix: ${folderPrefix}.`
    )
    console.log(
      '[Cloudinary API] Raw resources found:',
      resources.resources.map((r) => r.public_id)
    )

    const sortedPublicIds = resources.resources
      .sort((a, b) => {
        const getSortKey = (s) => {
          const parts = s.public_id.split('/')
          const chunkFileName = parts[parts.length - 1]

          if (!chunkFileName) {
            console.warn(
              `[WARNING] Empty chunk filename for public_id: ${s.public_id}`
            )
            return 0
          }
          const chunkParts = chunkFileName.split('-')

          if (chunkParts.length < 3) {
            console.warn(
              `[WARNING] Unexpected chunk filename format: ${chunkFileName} for public_id: ${s.public_id}`
            )
            return 0
          }

          const chunkIndex = parseInt(chunkParts[1]) || 0
          const timestamp = parseInt(chunkParts[2]) || 0
          return chunkIndex * 1000000000000 + timestamp
        }
        return getSortKey(a) - getSortKey(b)
      })
      .map((res) => res.public_id)

    console.log('[Cloudinary API] Sorted chunk public IDs:', sortedPublicIds)
    return sortedPublicIds
  } catch (error) {
    console.error(
      `[Cloudinary API] Error fetching chunks for ${folderPrefix}:`,
      error.message || error
    )
    throw error
  }
}

/**
 * Concatenates chunks into one video using Cloudinary's explicit method with splice transformations.
 * This function also includes eager transformations to ensure output is in MP4 (H.264/AAC).
 * @param {string} sessionId - The ID of the session.
 * @param {string} role - The role (e.g., 'host', 'guest').
 * @returns {Promise<string>} The secure URL of the concatenated video.
 */
async function concatenateChunks(sessionId, role) {
  const finalPublicId = `recordings/${sessionId}/${role}/${role}-final`
  const chunkPublicIds = await getSortedChunks(sessionId, role)
  if (chunkPublicIds.length < 2)
    throw new Error('Need at least 2 chunks to concatenate')

  console.log(`[${role}] ✅ Chunks to concatenate:`, chunkPublicIds)

  // Ensure all chunks exist
  for (const chunkId of chunkPublicIds) {
    const exists = (await getResourceDetailsWithRetry(chunkId)).exists
    if (!exists) throw new Error(`[${role}] ❌ Missing chunk: ${chunkId}`)
    console.log(`[${role}] ✅ Chunk exists: ${chunkId}`)
  }

  const cloudName = cloudinary.config().cloud_name

  const [baseChunk, ...restChunks] = chunkPublicIds

  // Build transformation segments
  const spliceSegments = restChunks.map((chunk) => {
    const overlay = `l_video:${chunk.replace(/\//g, ':')}`
    return `fl_splice,${overlay}`
  })

  const transformations = [
    ...spliceSegments,
    'ac_aac,c_limit,h_480,q_auto,vc_h264,w_640',
  ]

  const transformationPath = transformations.join('/')

  const encodedBase = baseChunk + '.mp4' // force format
  const transformationUrl = `https://res.cloudinary.com/${cloudName}/video/upload/${transformationPath}/${encodedBase}`

  console.log(
    `[${role}] ⏳ Uploading combined video from: ${transformationUrl}`
  )

  // Upload the combined video from URL
  try {
    const result = await cloudinary.uploader.upload(transformationUrl, {
      public_id: finalPublicId,
      resource_type: 'video',
      overwrite: true,
      invalidate: true,
    })

    const finalUrl = result.secure_url
    console.log(`[${role}] ✅ Final concatenated video uploaded: ${finalUrl}`)
    return finalUrl
  } catch (error) {
    console.error(`[${role}] ❌ Upload failed: ${error.message}`)
    if (error.http_code)
      console.error(`Cloudinary API HTTP Code: ${error.http_code}`)
    throw error
  }
}

/**
 * Merges host + guest videos side-by-side
 * @param {string} sessionId - The ID of the session.
 * @returns {Promise<string>} The secure URL of the merged video.
 */
async function downloadVideo(url, outputPath) {
  const writer = fs.createWriteStream(outputPath);
  const response = await axios.get(url, { responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function mergeVideosFFmpeg(hostPath, guestPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(hostPath)
      .input(guestPath)
      .complexFilter([
        // Scale and crop host video
        '[0:v]scale=w=640:h=720:force_original_aspect_ratio=increase,crop=w=640:h=720[left_padded]',
        // Scale and crop guest video
        '[1:v]scale=w=640:h=720:force_original_aspect_ratio=increase,crop=w=640:h=720[right_padded]',
        // Stack both side by side
        '[left_padded][right_padded]hstack=inputs=2,format=yuv420p[outv]'
      ])
      .outputOptions([
        '-map', '[outv]',     // Final video output from filter
        '-map', '0:a?',       // Optional audio from host (if it exists)
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-crf', '23',
        '-preset', 'veryfast',
        '-shortest',
        '-movflags', '+faststart',
        '-s', '1280x720',
        '-y' // Overwrite if exists
      ])
      .output(outputPath)
      .on('end', () => {
        console.log('✅ Video merging finished successfully with audio!');
        resolve();
      })
      .on('error', (err) => {
        console.error('❌ Error during video merging:', err.message);
        reject(err);
      })
      .run();
  });
}

async function mergeFinalVideos(sessionId) {
  const hostPublicId = `recordings/${sessionId}/host/host-final`;
  const guestPublicId = `recordings/${sessionId}/guest/guest-final`;
  const mergedPublicId = `recordings/${sessionId}/merged/final-merged-video`;

  console.log(`[MERGE] Preparing to merge host & guest...`);

  const hostDetails = await getResourceDetailsWithRetry(hostPublicId);
  const guestDetails = await getResourceDetailsWithRetry(guestPublicId);

  if (!hostDetails.exists) throw new Error(`Host video not found: ${hostPublicId}`);
  if (!guestDetails.exists) throw new Error(`Guest video not found: ${guestPublicId}`);

  const hostUrl = cloudinary.url(hostPublicId, { resource_type: 'video', secure: true });
  const guestUrl = cloudinary.url(guestPublicId, { resource_type: 'video', secure: true });

  const hostPath = path.join(__dirname, 'host.mp4');
  const guestPath = path.join(__dirname, 'guest.mp4');
  const mergedPath = path.join(__dirname, 'merged.mp4');

  // Step 1: Download both videos
  console.log(`[MERGE] Downloading host video...`);
  await downloadVideo(hostUrl, hostPath);
  console.log(`[MERGE] Downloading guest video...`);
  await downloadVideo(guestUrl, guestPath);

  // Step 2: Merge with FFmpeg
  console.log(`[MERGE] Merging videos side by side...`);
  await mergeVideosFFmpeg(hostPath, guestPath, mergedPath);

  // Step 3: Upload to Cloudinary
  console.log(`[MERGE] Uploading merged video to Cloudinary...`);
  const upload = await cloudinary.uploader.upload(mergedPath, {
    resource_type: 'video',
    public_id: mergedPublicId,
    overwrite: true,
    invalidate: true
  });

  // Step 4: Cleanup
  fs.unlinkSync(hostPath);
  fs.unlinkSync(guestPath);
  fs.unlinkSync(mergedPath);

  const mergedUrl = upload.secure_url;

  console.log(`[MERGE] ✅ Host: ${hostUrl}`);
  console.log(`[MERGE] ✅ Guest: ${guestUrl}`);
  console.log(`[MERGE] ✅ Merged: ${mergedUrl}`);

  return mergedUrl;
}

async function deleteAllChunks(sessionId) {
  const roles = ['host', 'guest'];

  for (const role of roles) {
    const prefix = `recordings/${sessionId}/${role}/chunk-`;
    console.log(`[CLEANUP] 🔍 Looking for chunks to delete in: ${prefix}`);

    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix,
        resource_type: 'video',
        max_results: 500,
      });

      const publicIds = result.resources.map((res) => res.public_id);

      if (publicIds.length === 0) {
        console.log(`[CLEANUP] ✅ No chunks found for ${role}. Skipping...`);
        continue;
      }

      console.log(`[CLEANUP] 🧹 Deleting ${publicIds.length} chunks for ${role}...`);
      await cloudinary.api.delete_resources(publicIds, {
        resource_type: 'video',
      });

      console.log(`[CLEANUP] ✅ Deleted ${publicIds.length} chunks for ${role}.`);
    } catch (err) {
      console.error(`[CLEANUP] ❌ Error deleting chunks for ${role}:`, err.message);
    }
  }
}

async function processSession(sessionId) {
  try {
    console.log(`--- 🔄 Starting session processing for: ${sessionId} ---`)

    console.log(`[PIPELINE] Step 1: Concatenating host chunks using Cloudinary...`)
    const hostUrl = await concatenateChunks(sessionId, 'host')
    console.log(`[PIPELINE] Host concatenation completed: ${hostUrl}`)

    console.log(`[PIPELINE] Step 2: Concatenating guest chunks using Cloudinary...`)
    const guestUrl = await concatenateChunks(sessionId, 'guest')
    console.log(`[PIPELINE] Guest concatenation completed: ${guestUrl}`)

    console.log(`[PIPELINE] Waiting ${RETRY_DELAY_MS / 1000} seconds before merging...`)
    await delay(RETRY_DELAY_MS)

    console.log(`[PIPELINE] Step 3: Merging final videos...`)
    const mergedUrl = await mergeFinalVideos(sessionId)
    console.log(`🎉 Pipeline completed successfully. Final merged URL: ${mergedUrl}`)

    console.log(`[PIPELINE] Step 4: Updating DB with video URLs...`)
    await Session.findByIdAndUpdate(sessionId, {
      $set: {
        'mergedVideo.host': hostUrl,
        'mergedVideo.guest': guestUrl,
        'mergedVideo.finalMerged': mergedUrl,
      }
    })

    console.log(`[PIPELINE] ✅ Session updated with merged video URLs.`)

    console.log(`[PIPELINE] Step 5: Deleting all chunks...`)
    await deleteAllChunks(sessionId)

    return mergedUrl
  } catch (err) {
    console.error(`❌ Processing failed for session ${sessionId}:`, err.message)
    if (err.http_code) {
      console.error(`Cloudinary API HTTP Code: ${err.http_code}`)
    }
    throw err
  }
}

module.exports = {
  processSession
};