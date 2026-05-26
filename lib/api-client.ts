// API client for secured endpoints
// SECURITY: Authentication is handled server-side via middleware.
// No API keys are exposed in client-side code.

export async function analyzeAudio(audioFile: Blob): Promise<any> {
  const formData = new FormData();
  formData.append('audio', audioFile);

  const response = await fetch('/api/analyze-audio', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze audio');
  }

  return response.json();
}

export async function analyzeVision(imageBase64: string): Promise<any> {
  const response = await fetch('/api/analyze-vision', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageBase64 }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze image');
  }

  return response.json();
}

export async function generateSession(
  theme: string,
  load: string,
  school: string,
  playerCount: number
): Promise<any> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ theme, load, school, playerCount }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate session');
  }

  return response.json();
}

export async function analyzeVideo(videoBase64: string): Promise<any> {
  const response = await fetch('/api/analyze-video', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ videoBase64 }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to analyze video');
  }

  return response.json();
}
