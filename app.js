// ===== Storage =====
const STORAGE_KEY = "miejsca_z_martyna_v1";
const viewHome = document.getElementById("viewHome");
const homeMap = document.getElementById("homeMap");
const homeList = document.getElementById("homeList");
const homeAdd = document.getElementById("homeAdd");


function loadPlaces() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function savePlaces(places) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
}

// ===== UI refs =====

const viewMap = document.getElementById("viewMap");
const viewList = document.getElementById("viewList");
const viewAdd = document.getElementById("viewAdd");

const placesListEl = document.getElementById("placesList");
const emptyListEl = document.getElementById("emptyList");

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

const addForm = document.getElementById("addForm");
const formMsg = document.getElementById("formMsg");

const seedBtn = document.getElementById("seedBtn");
const clearBtn = document.getElementById("clearBtn");

const nameEl = document.getElementById("name");
const addressEl = document.getElementById("address");
const ratingEl = document.getElementById("rating");
const noteEl = document.getElementById("note");
const photoUrlEl = document.getElementById("photoUrl");
const photoFileEl = document.getElementById("photoFile");

// ===== App state =====
let places = loadPlaces();

// ===== Tabs =====
function setActiveTab(tab) {
  [viewHome, viewMap, viewList, viewAdd].forEach(v => v.classList.add("hidden"));

  if (tab === "home") {
    viewHome.classList.remove("hidden");
    return;
  }

  if (tab === "map") {
    viewMap.classList.remove("hidden");
    setTimeout(() => map?.invalidateSize(), 50);
    return;
  }

  if (tab === "list") {
    viewList.classList.remove("hidden");
    return;
  }

  if (tab === "add") {
    viewAdd.classList.remove("hidden");
    return;
  }
}

homeMap.addEventListener("click", () => setActiveTab("map"));
homeList.addEventListener("click", () => setActiveTab("list"));
homeAdd.addEventListener("click", () => setActiveTab("add"));


// ===== Map (Leaflet) =====
let map;
let markersLayer;

function initMap() {
  map = L.map("map", {
    center: [52.1, 19.4], // Polska
    zoom: 6
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);
  renderMarkers();
}

function renderMarkers() {
  if (!markersLayer) return;
  markersLayer.clearLayers();

  places.forEach(p => {
    if (typeof p.lat !== "number" || typeof p.lng !== "number") return;

    const popupHtml = `
      <div style="min-width:220px">
        <div style="font-weight:700; margin-bottom:6px;">${escapeHtml(p.name)}</div>
        <div style="font-size:12px; opacity:.85; margin-bottom:6px;">${escapeHtml(p.address)}</div>
        <div style="font-size:12px; margin-bottom:8px;">Ocena: <b>${p.rating}/10</b></div>
        ${p.note ? `<div style="font-size:12px; margin-bottom:8px;">${escapeHtml(p.note)}</div>` : ""}
        ${p.photo ? `<img src="${p.photo}" alt="" style="width:100%; border-radius:10px; border:1px solid rgba(0,0,0,.12); max-height:140px; object-fit:cover;" />` : ""}
      </div>
    `;

    const marker = L.marker([p.lat, p.lng]).bindPopup(popupHtml);
    marker.addTo(markersLayer);
  });
}

// ===== List rendering =====
function getFilteredSortedPlaces() {
  const q = (searchInput.value || "").trim().toLowerCase();

  let arr = places.filter(p => {
    const hay = `${p.name} ${p.address}`.toLowerCase();
    return hay.includes(q);
  });

  const sort = sortSelect.value;
  if (sort === "newest") arr.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));
  if (sort === "ratingDesc") arr.sort((a,b) => (b.rating - a.rating) || ((b.createdAt||0)-(a.createdAt||0)));
  if (sort === "ratingAsc") arr.sort((a,b) => (a.rating - b.rating) || ((b.createdAt||0)-(a.createdAt||0)));
  if (sort === "nameAsc") arr.sort((a,b) => a.name.localeCompare(b.name, "pl"));
  if (sort === "nameDesc") arr.sort((a,b) => b.name.localeCompare(a.name, "pl"));

  return arr;
}

function renderList() {
  const arr = getFilteredSortedPlaces();
  placesListEl.innerHTML = "";

  if (places.length === 0) {
    emptyListEl.classList.remove("hidden");
    return;
  }
  emptyListEl.classList.add("hidden");

  if (arr.length === 0) {
    placesListEl.innerHTML = `<div class="empty">Brak wyników dla wyszukiwania.</div>`;
    return;
  }

  arr.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="cardTop">
        <div>
          <p class="title">${escapeHtml(p.name)}</p>
          <div class="addr">${escapeHtml(p.address)}</div>
        </div>
        <div class="badge">${p.rating}/10</div>
      </div>
      ${p.note ? `<div class="note">${escapeHtml(p.note)}</div>` : ""}
      ${p.photo ? `<img class="photo" src="${p.photo}" alt="Zdjęcie miejsca" />` : ""}
      <div class="cardActions">
        <button class="btn small" data-action="fly" data-id="${p.id}">Pokaż na mapie</button>
        <button class="btn small danger" data-action="del" data-id="${p.id}">Usuń</button>
      </div>
    `;

    placesListEl.appendChild(card);
  });
}

placesListEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const id = btn.getAttribute("data-id");
  const action = btn.getAttribute("data-action");
  const p = places.find(x => x.id === id);
  if (!p) return;

  if (action === "fly") {
    setActiveTab("map");
    if (map && typeof p.lat === "number" && typeof p.lng === "number") {
      map.setView([p.lat, p.lng], 13);
    }
  }

  if (action === "del") {
    places = places.filter(x => x.id !== id);
    savePlaces(places);
    renderList();
    renderMarkers();
  }
});

searchInput.addEventListener("input", renderList);
sortSelect.addEventListener("change", renderList);

// ===== Add place =====
async function geocodeAddress(address) {
  // Nominatim (OpenStreetMap) - proste geokodowanie po adresie
  // Uwaga: usługa ma limity; do prywatnego projektu OK.
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=pl&limit=1`;
  const res = await fetch(url, {
    headers: { "Accept": "application/json" }
  });
  if (!res.ok) throw new Error("Błąd geokodowania.");
  const data = await res.json();
  if (!data || data.length === 0) return null;

  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon)
  };
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMsg.textContent = "Dodaję...";

  try {
    const name = nameEl.value.trim();
    const address = addressEl.value.trim();
    const rating = Number(ratingEl.value);
    const note = noteEl.value.trim();

    if (!name || !address) throw new Error("Uzupełnij nazwę i adres.");
    if (!Number.isFinite(rating) || rating < 1 || rating > 10) throw new Error("Ocena musi być w zakresie 1–10.");

    // zdjęcie: URL ma pierwszeństwo, inaczej plik
    let photo = photoUrlEl.value.trim();
    if (!photo && photoFileEl.files?.[0]) {
      photo = await fileToDataUrl(photoFileEl.files[0]); // zapisze się w localStorage jako base64
    }

    const coords = await geocodeAddress(address);
    if (!coords) throw new Error("Nie znalazłem tego adresu. Spróbuj doprecyzować (miasto, ulica, numer).");

    const newPlace = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name,
      address,
      rating,
      note: note || "",
      photo: photo || "",
      lat: coords.lat,
      lng: coords.lng,
      createdAt: Date.now()
    };

    places.unshift(newPlace);
    savePlaces(places);

    addForm.reset();
    formMsg.textContent = "Dodano ✅";

    renderList();
    renderMarkers();

    // przerzuć na mapę i pokaż pinezkę
    setActiveTab("map");
    map.setView([newPlace.lat, newPlace.lng], 13);

  } catch (err) {
    formMsg.textContent = err?.message || "Coś poszło nie tak.";
  }
});

// ===== Utilities =====
function escapeHtml(str) {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// ===== Seed & Clear =====
seedBtn.addEventListener("click", () => {
  const sample = [
    {
      id: "sample-1",
      name: "Kopiec Kościuszki",
      address: "al. Waszyngtona 1, Kraków",
      rating: 9,
      note: "Mega zachód słońca.",
      photo: "",
      lat: 50.0546,
      lng: 19.8936,
      createdAt: Date.now() - 100000
    },
    {
      id: "sample-2",
      name: "Morskie Oko",
      address: "Morskie Oko, Tatry",
      rating: 10,
      note: "Klasyk, ale warto!",
      photo: "",
      lat: 49.2017,
      lng: 20.0706,
      createdAt: Date.now() - 90000
    }
  ];

  // nie duplikuj próbek
  const existingIds = new Set(places.map(p => p.id));
  const merged = [...sample.filter(s => !existingIds.has(s.id)), ...places];

  places = merged;
  savePlaces(places);
  renderList();
  renderMarkers();
  setActiveTab("list");
});

clearBtn.addEventListener("click", () => {
  if (!confirm("Na pewno usunąć wszystkie miejsca?")) return;
  places = [];
  savePlaces(places);
  renderList();
  renderMarkers();
  formMsg.textContent = "Wyczyszczono.";
});

// ===== Init =====
initMap();
renderList();
setActiveTab("home");
