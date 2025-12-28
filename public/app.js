let page = 0;
let loading = false;
const feed = document.getElementById("feed");

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    const video = e.target.querySelector("video");
    if (!video) return;
    e.isIntersecting ? video.play() : video.pause();
  });
}, { threshold: 0.6 });

async function loadVideos() {
  if (loading) return;
  loading = true;

  const res = await fetch(`/api?action=videos&page=${page}`);
  const list = await res.json();
  if (!list.length) return;

  list.forEach(v => {
    const div = document.createElement("div");
    div.className = "video-item";

    if (v.type === "iframe") {
      div.innerHTML = `<iframe src="${v.url}" loading="lazy" allowfullscreen></iframe>`;
    } else {
      div.innerHTML = `<video src="${v.url}" muted playsinline loop preload="metadata"></video>`;
    }

    feed.appendChild(div);
    if (div.querySelector("video")) observer.observe(div);
  });

  page++;
  loading = false;
}

feed.addEventListener("scroll", () => {
  if (feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 200) {
    loadVideos();
  }
});

loadVideos();