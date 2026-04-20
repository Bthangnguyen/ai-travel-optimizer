/**
 * generate-voiceover.ts
 * 
 * Calls ElevenLabs TTS API to generate voiceover audio for the script video.
 * Run with: node generate-voiceover.ts
 */

const fs = require('fs');
const path = require('path');

const API_KEY = process.env.ELEVENLABS_API_KEY;
// "Adam" - a deep, narrative male voice perfect for motivational content
const VOICE_ID = 'pNInz6obpgDQGcFmaJgB';

const SCRIPT_TEXT = `You are watching this because you want to change.
You might be holding a self-help book right now. You might have just saved dozens of videos on how to build discipline, how to plan your life, or how to wake up at 5 AM.
And you think that if you just watch one more video, read one more book, everything will finally click into place.
Wrong.
I spent 10,000 hours, more than 6 years of my life, digging through almost everything in the so-called self-improvement industry.`;

async function generateVoiceover() {
  console.log('🎙️  Generating voiceover with ElevenLabs...');
  console.log(`   Voice ID: ${VOICE_ID}`);
  console.log(`   Text length: ${SCRIPT_TEXT.length} characters`);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: SCRIPT_TEXT,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ ElevenLabs API error (${response.status}):`, errorText);
    process.exit(1);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  const outputPath = path.join(__dirname, 'public', 'voiceover.mp3');
  fs.writeFileSync(outputPath, audioBuffer);

  console.log(`✅ Voiceover saved to: ${outputPath}`);
  console.log(`   File size: ${(audioBuffer.length / 1024).toFixed(1)} KB`);
}

generateVoiceover().catch((err) => {
  console.error('❌ Failed to generate voiceover:', err);
  process.exit(1);
});
