export function youtubeId(url=''){for(const p of [/youtu\.be\/([^?&/]+)/,/youtube\.com\/watch\?v=([^?&/]+)/,/youtube\.com\/embed\/([^?&/]+)/,/youtube\.com\/shorts\/([^?&/]+)/]){const m=String(url).match(p);if(m)return m[1]}return ''}
export function youtubeThumbnail(url=''){const id=youtubeId(url);return id?`https://img.youtube.com/vi/${id}/hqdefault.jpg`:''}
