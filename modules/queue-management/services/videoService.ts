export async function generateHospitalIntroVideo(customPrompt?: string): Promise<string | null> {
  const session = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const response = await fetch('/api/v1/ai/hospital-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token || ''}` },
    body: JSON.stringify({ prompt: customPrompt || '' })
  });
  if (!response.ok) throw new Error('Video generation failed');
  return URL.createObjectURL(await response.blob());
}
