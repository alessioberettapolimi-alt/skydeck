import { getClosestFilteredAircraft } from '@shared/geo';
import { DEFAULT_CONFIG } from '@shared/config';

const HOME_LAT = DEFAULT_CONFIG.centerLat; //45.718685; 
const HOME_LON = DEFAULT_CONFIG.centerLon; //9.203072;

const MAX_DISTANCE_MILES = 15;
const MIN_ALTITUDE_FT = 3000;
const MAX_ALTITUDE_FT = 40000;

let lastSnapshot: any = null;
let lastLogoUrl = '';
let lastLogoElement: HTMLImageElement | HTMLSpanElement | null = null;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderValue(value: string, previousValue?: string, options: { frameAll?: boolean; fixedLength?: number } = {}): string {
  const chars = Array.from(value);
  const previousChars = Array.from(previousValue ?? '');
  const fixedLength = options.fixedLength ?? 13;
  const max = Math.max(chars.length, previousChars.length, fixedLength);

  return Array.from({ length: max }, (_, index) => {
    const char = chars[index] ?? '';
    const prevChar = previousChars[index] ?? '';
    const isChanged = char !== prevChar;
    const shouldFrame = options.frameAll || isChanged;

    if (!shouldFrame) {
      return char === ' ' || char === '' ? '&nbsp;' : escapeHtml(char);
    }

    const safeChar = char === ' ' || char === '' ? '&nbsp;' : escapeHtml(char);
    const classes = ['flip-char'];
    if (!isChanged) {
      classes.push('flip-char-static');
    }

    return `<span class="${classes.join(' ')}" data-text="${safeChar === '&nbsp;' ? ' ' : safeChar}" style="--delay:${index * 14}ms">${safeChar}</span>`;
  }).join('');
}

function updateUI(aircraftList: any[]) {
  const container = document.getElementById('content');
  if (!container) return;

  const closestVolo = getClosestFilteredAircraft(
    aircraftList,
    HOME_LAT,
    HOME_LON,
    MAX_DISTANCE_MILES,
    MIN_ALTITUDE_FT,
    MAX_ALTITUDE_FT
  );

  if (!closestVolo) {
    const altitudeLabel = `FL${Math.round(MIN_ALTITUDE_FT / 1000)}-FL${Math.round(MAX_ALTITUDE_FT / 1000)} `;
    const rangeLabel = `${MAX_DISTANCE_MILES} mi`;

    container.innerHTML = `
      <article class="airport-panel empty-state-panel">
        <div class="empty-state-grid">
          <img class="empty-state-image" src="/pics/homer.png" alt="Home" />
          <div class="empty-state-copy">
            <div class="empty-state-kicker">Closest aircraft</div>
            <div class="empty-state-title">No aircraft in range</div>
            <div class="empty-state-subtitle">${rangeLabel} • ${altitudeLabel}</div>
          </div>
        </div>
      </article>
    `;
    return;
  }

  const haTratta = closestVolo.origin && closestVolo.destination;
  const rottaString = haTratta ? `${closestVolo.origin} ➔ ${closestVolo.destination}` : 'N/A';
  const callsign = closestVolo.flight ? closestVolo.flight.trim() : '';

  const icaoCompagnia = callsign.substring(0, 3).toLowerCase();
  const logoUrl = callsign.length >= 3 ? `/logos/${icaoCompagnia}.png` : '';

  const airlineLine = `${closestVolo.airline || 'N/A'} • ${(closestVolo as any).typeName || (closestVolo as any).typeCode || 'N/A'}`;
  const nextSnapshot = {
    callsign: callsign || 'N/A',
    airlineLine,
    route: rottaString,
    distance: `${closestVolo.distanceMiles.toFixed(1)} mi`,
    altitude: `${closestVolo.altBaro.toLocaleString()} ft`,
    gs: closestVolo.gs ? `${Math.round(closestVolo.gs)} kts` : 'N/A',
    heading: closestVolo.track ? `${Math.round(closestVolo.track)}°` : 'N/A',
  };

  // 1. Generiamo la struttura base senza tag img o stringhe rotte nell'innerHTML
  container.innerHTML = `
    <article class="airport-panel">
      <div class="panel-top">
        <div class="title-block">
          <span class="callsign">${renderValue(nextSnapshot.callsign, lastSnapshot?.callsign, { frameAll: true, fixedLength: 8 })}</span>
          <span class="subline">${renderValue(airlineLine, lastSnapshot?.airlineLine, { frameAll: true, fixedLength: 13 })}</span>
        </div>
        <div class="logo-box" id="logo-target"></div>
      </div>

      <div class="route-chip">ROUTE ${renderValue(nextSnapshot.route, lastSnapshot?.route, { frameAll: true, fixedLength: 13 })}</div>

      <div class="panel-grid">
        <div class="metric-card">
          <div class="metric-label">Distance (3D)</div>
          <div class="metric-value">${renderValue(nextSnapshot.distance, lastSnapshot?.distance, { frameAll: true, fixedLength: 13 })}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Altitude</div>
          <div class="metric-value">${renderValue(nextSnapshot.altitude, lastSnapshot?.altitude, { frameAll: true, fixedLength: 13 })}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Ground Speed</div>
          <div class="metric-value">${renderValue(nextSnapshot.gs, lastSnapshot?.gs, { frameAll: true, fixedLength: 13 })}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Heading</div>
          <div class="metric-value">${renderValue(nextSnapshot.heading, lastSnapshot?.heading, { frameAll: true, fixedLength: 13 })}</div>
        </div>
      </div>
    </article>
  `;

// 2. Iniettiamo l'immagine in modo sicuro manipolando il DOM direttamente
 // 2. Elaboriamo l'immagine in memoria per evitare il flickering
  const logoTarget = document.getElementById('logo-target');
  const fallbackCode = callsign.length >= 3 ? callsign.substring(0, 3).toUpperCase() : 'N/A';

  if (logoTarget) {
    if (!logoUrl) {
      const fallback = document.createElement('span');
      fallback.textContent = fallbackCode;
      fallback.style.display = 'flex';
      fallback.style.alignItems = 'center';
      fallback.style.justifyContent = 'center';
      fallback.style.width = '100%';
      fallback.style.height = '100%';
      fallback.style.border = 'none';
      fallback.style.borderRadius = '0';
      fallback.style.padding = '0';
      fallback.style.fontSize = '1.30em';
      fallback.style.lineHeight = '1';
      fallback.style.color = '#111827';
      fallback.style.background = 'transparent';
      fallback.style.fontWeight = '800';
      fallback.style.letterSpacing = '0.18em';
      fallback.style.textTransform = 'uppercase';
      fallback.style.boxShadow = 'none';
      logoTarget.innerHTML = '';
      logoTarget.appendChild(fallback);
      lastLogoUrl = logoUrl;
      lastLogoElement = fallback;
      lastSnapshot = nextSnapshot;
      return;
    }

    if (lastLogoUrl === logoUrl && lastLogoElement) {
      if (logoTarget.innerHTML !== lastLogoElement.outerHTML) {
        logoTarget.innerHTML = '';
        logoTarget.appendChild(lastLogoElement);
      }
      return;
    }

    // Creiamo l'oggetto immagine SOLO in memoria (non è ancora nel DOM)
    const imgInMemory = new Image();
    imgInMemory.src = logoUrl;

    imgInMemory.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = imgInMemory.naturalWidth;
        canvas.height = imgInMemory.naturalHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(imgInMemory, 0, 0);
          
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          
          // Colore del pixel in alto a sinistra
          const targetR = data[0];
          const targetG = data[1];
          const targetB = data[2];
          const tolerance = 30; 

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const diffR = Math.abs(r - targetR);
            const diffG = Math.abs(g - targetG);
            const diffB = Math.abs(b - targetB);
            
            if (diffR < tolerance && diffG < tolerance && diffB < tolerance) {
              data[i + 3] = 0; // Trasparente
            }
          }
          
          ctx.putImageData(imgData, 0, 0);
          
          // Ora creiamo l'elemento visuale finale con la stringa già trasparente
          const finalImg = document.createElement('img');
          finalImg.src = canvas.toDataURL(); // Sorgente già elaborata!
          finalImg.alt = icaoCompagnia.toUpperCase();
          finalImg.style.maxHeight = '68px';
          finalImg.style.maxWidth = '140px';
          finalImg.style.objectFit = 'contain';
          finalImg.style.display = 'block';
          finalImg.style.filter = 'drop-shadow(0 0 2px rgba(220, 220, 220, 0.35))';

          // Svuotiamo il target e appendiamo l'immagine già perfetta
          logoTarget.innerHTML = '';
          logoTarget.appendChild(finalImg);
          lastLogoUrl = logoUrl;
          lastLogoElement = finalImg;
        }
      } catch (e) {
        // Se il canvas fallisce, mostriamo l'immagine originale come fallback
        console.warn("Rilassamento protezione rimozione sfondo", e);
        logoTarget.innerHTML = '';
        const fallbackImg = document.createElement('img');
        fallbackImg.src = logoUrl;
        fallbackImg.style.maxHeight = '68px';
        fallbackImg.style.maxWidth = '140px';
        fallbackImg.style.objectFit = 'contain';
        logoTarget.appendChild(fallbackImg);
      }
    };

    // Se il file .png non esiste proprio sul server, mostriamo il badge verde protettivo
    imgInMemory.onerror = () => {
      const fallback = document.createElement('span');
      fallback.textContent = fallbackCode;
      fallback.style.display = 'flex';
      fallback.style.alignItems = 'center';
      fallback.style.justifyContent = 'center';
      fallback.style.width = '100%';
      fallback.style.height = '100%';
      fallback.style.border = 'none';
      fallback.style.borderRadius = '0';
      fallback.style.padding = '0';
      fallback.style.fontSize = '1.30em';
      fallback.style.lineHeight = '1';
      fallback.style.color = '#111827';
      fallback.style.background = 'transparent';
      fallback.style.fontWeight = '800';
      fallback.style.letterSpacing = '0.18em';
      fallback.style.textTransform = 'uppercase';
      fallback.style.boxShadow = 'none';
      logoTarget.innerHTML = '';
      logoTarget.appendChild(fallback);
      lastLogoUrl = logoUrl;
      lastLogoElement = fallback;
    };
  }

  lastSnapshot = nextSnapshot;
}

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}/ws`;
const socket = new WebSocket(wsUrl);

socket.onopen = () => {
  console.log("Connected successfully to Skylight's data stream!");
};

socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    if (data && data.aircraft && Array.isArray(data.aircraft)) {
      updateUI(data.aircraft);
    }
  } catch (err) {
    console.error("Error parsing data:", err);
  }
};


socket.onerror = (err) => {
  console.error("Connection error data flow:", err);
};

socket.onclose = () => {
  setTimeout(() => window.location.reload(), 5000);
};