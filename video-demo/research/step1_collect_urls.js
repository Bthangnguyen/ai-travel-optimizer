/**
 * step1_collect_urls.js
 * 
 * Thu thập tất cả video URL từ kênh The Dark Needle bằng YouTube Data API v3.
 * Output: research/video_urls.json
 * 
 * Cách chạy: node research/step1_collect_urls.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ── Cấu hình ────────────────────────────────────────────────────────────────
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyBXJyOJeQ13cycPi_PHV-gVc1Gza5GITBs';
const CHANNEL_HANDLE = '@TheDarkNeedle';
const OUTPUT_PATH = path.join(__dirname, 'video_urls.json');
const MAX_RESULTS = 50; // YouTube API trả tối đa 50/lần

// ── Helper: HTTPS GET trả về Promise ─────────────────────────────────────────
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ── Bước 1: Lấy Channel ID từ handle ────────────────────────────────────────
async function getChannelId() {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${CHANNEL_HANDLE}&key=${YOUTUBE_API_KEY}`;
  const data = await httpGet(url);
  if (!data.items || data.items.length === 0) {
    // Fallback: thử search
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=The+Dark+Needle&type=channel&key=${YOUTUBE_API_KEY}`;
    const searchData = await httpGet(searchUrl);
    if (searchData.items && searchData.items.length > 0) {
      return searchData.items[0].snippet.channelId;
    }
    throw new Error('Khong tim thay kenh. Kiem tra API key va handle.');
  }
  return data.items[0].id;
}

// ── Bước 2: Lấy uploads playlist ID ─────────────────────────────────────────
async function getUploadsPlaylistId(channelId) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
  const data = await httpGet(url);
  return data.items[0].contentDetails.relatedPlaylists.uploads;
}

// ── Bước 3: Lấy tất cả video từ playlist (phân trang) ───────────────────────
async function getAllVideos(playlistId) {
  const videos = [];
  let nextPageToken = '';
  let page = 0;

  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${MAX_RESULTS}&pageToken=${nextPageToken}&key=${YOUTUBE_API_KEY}`;
    const data = await httpGet(url);
    
    for (const item of data.items) {
      videos.push({
        videoId: item.snippet.resourceId.videoId,
        url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails?.high?.url || '',
      });
    }

    nextPageToken = data.nextPageToken || '';
    page++;
    console.log(`  Trang ${page}: lay duoc ${data.items.length} video (tong: ${videos.length})`);
  } while (nextPageToken);

  return videos;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== STEP 1: Thu thap Video URLs tu The Dark Needle ===\n');

  if (YOUTUBE_API_KEY === 'YOUR_YOUTUBE_DATA_API_KEY') {
    console.log('HUONG DAN:');
    console.log('1. Vao https://console.cloud.google.com/apis/credentials');
    console.log('2. Tao API Key moi');
    console.log('3. Bat YouTube Data API v3');
    console.log('4. Dat bien moi truong: set YOUTUBE_API_KEY=your_key');
    console.log('5. Chay lai: node research/step1_collect_urls.js\n');
    
    // Fallback: tạo file mẫu với các URL đã biết
    console.log('=> Tam thoi tao file mau voi cac URL da biet...\n');
    const sampleVideos = [
      { videoId: 'q4HvaDyzxZI', url: 'https://www.youtube.com/watch?v=q4HvaDyzxZI', title: 'The Hidden Female Test No Man Talks About' },
      { videoId: 'xxjKhBD5N6I', url: 'https://www.youtube.com/watch?v=xxjKhBD5N6I', title: 'How to Reset Attraction After Messing Up' },
    ];
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(sampleVideos, null, 2));
    console.log(`Da luu ${sampleVideos.length} video mau vao ${OUTPUT_PATH}`);
    console.log('Ban can them URL thu cong hoac cau hinh API key de lay tu dong.');
    return;
  }

  try {
    console.log('1. Tim kenh...');
    const channelId = await getChannelId();
    console.log(`   Channel ID: ${channelId}`);

    console.log('2. Tim playlist uploads...');
    const playlistId = await getUploadsPlaylistId(channelId);
    console.log(`   Playlist ID: ${playlistId}`);

    console.log('3. Lay tat ca video...');
    const videos = await getAllVideos(playlistId);
    
    // Sắp xếp theo ngày mới nhất
    videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(videos, null, 2));
    console.log(`\n=== HOAN THANH: ${videos.length} video da luu vao ${OUTPUT_PATH} ===`);
  } catch (err) {
    console.error('LOI:', err.message);
  }
}

main();
