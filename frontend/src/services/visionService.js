// Same backend as the AI recommendation feature.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3001'

const MAX_PHOTO_SIDE = 1280

// Resize the photo in the browser before
// uploading it. Drawing to a canvas also
// applies the phone's rotation and drops
// the photo's metadata (like location).
export async function prepareRoomPhoto(file) {
  const bitmap = await createImageBitmap(
    file,
    { imageOrientation: 'from-image' }
  )

  const scale = Math.min(
    1,
    MAX_PHOTO_SIDE /
      Math.max(bitmap.width, bitmap.height)
  )

  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  canvas
    .getContext('2d')
    .drawImage(bitmap, 0, 0, width, height)

  bitmap.close?.()

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.85),
    width,
    height,
  }
}

// Detect items in the room photo and find
// visually similar products for each one.
//
// Never throws: if the vision service is
// unavailable, visionUsed is false and the
// page falls back to regular recommendations.
export async function shopRoom(dataUrl) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/vision/shop-room`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: dataUrl,
        }),
      }
    )

    if (response.status === 429) {
      return {
        items: [],
        room_matches: [],
        visionUsed: false,
        reason: 'busy',
      }
    }

    if (!response.ok) {
      throw new Error(
        `Shop this room failed: ${response.status}`
      )
    }

    const data = await response.json()

    return {
      items: data.items || [],
      room_matches: data.room_matches || [],
      width: data.width,
      height: data.height,
      visionUsed: Boolean(data.visionUsed),
    }
  } catch (error) {
    console.error(
      'Vision service unavailable:',
      error
    )

    return {
      items: [],
      room_matches: [],
      visionUsed: false,
    }
  }
}
