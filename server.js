const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'yt.html'));
});

// Download route
app.post('/downloads', (req, res) => {
  const { url, quality, type } = req.body;

  if (!url || !quality) {
    return res.status(400).json({ success: false, message: 'Missing URL or quality' });
  }

  const isAudioOnly = type === 'audio';

  const timestamp = Date.now();
  const filename = isAudioOnly
    ? `audio_${timestamp}.mp3`
    : `video_${timestamp}.mp4`;

  const downloadsDir = path.join(__dirname, 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
  }

  const outputPath = path.join(downloadsDir, filename);
  const resolution = quality.replace('p', '');

  const cmd = isAudioOnly
    ? `yt-dlp -f bestaudio --extract-audio --audio-format mp3 -o "${outputPath}" "${url}"`
    : `yt-dlp -f "bestvideo[height<=${resolution}]+bestaudio" --merge-output-format mp4 -o "${outputPath}" "${url}"`;

  console.log(`🔧 Running yt-dlp command:\n${cmd}`);

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ yt-dlp error:", stderr);
      return res.status(500).json({ success: false, message: "Download failed" });
    }
    console.log("✅ Download complete:", filename);
    res.json({ success: true, filename });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
