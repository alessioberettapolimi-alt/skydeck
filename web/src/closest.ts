import { getClosestFilteredAircraft } from '@shared/geo';
import { DEFAULT_CONFIG } from '@shared/config';

const HOME_LAT = DEFAULT_CONFIG.centerLat; //45.718685; 
const HOME_LON = DEFAULT_CONFIG.centerLon; //9.203072;

const MAX_DISTANCE_MILES = 15;
const MIN_ALTITUDE_FT = 2000;
const MAX_ALTITUDE_FT = 25000;

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
    container.innerHTML = '<div class="no-aircraft">Nessun aereo nel range (15 mi, 2k-25k ft)</div>';
    return;
  }

  const haTratta = closestVolo.origin && closestVolo.destination;
  const rottaString = haTratta ? `${closestVolo.origin} ➔ ${closestVolo.destination}` : 'N/A';
  const callsign = closestVolo.flight ? closestVolo.flight.trim() : '';

  const icaoCompagnia = callsign.substring(0, 3).toLowerCase();
  const logoUrl = callsign.length >= 3 ? `/logos/${icaoCompagnia}.png` : '';

  // 1. Generiamo la struttura base senza tag img o stringhe rotte nell'innerHTML
  container.innerHTML = `
    <div class="widget-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00ff00; padding-bottom: 10px; margin-bottom: 12px;">
      <div class="header-left">
        <span class="value" style="font-size: 1.8em; letter-spacing: 1px; line-height: 1.1;">${callsign || 'N/A'}</span>
      </div>
      <div class="header-right" id="logo-target" style="display: flex; align-items: center; min-width: 90px; justify-content: flex-end;">
        </div>
    </div>

    <div class="widget-body">
      <div class="data-row">AIRLINE: <span class="value">${closestVolo.airline || 'N/A'}</span></div>
      <div class="data-row">A/C TYPE: <span class="value">${(closestVolo as any).typeName || (closestVolo as any).typeCode || 'N/A'}</span></div>
      <div class="data-row">LEG: <span class="value" style="color: #ffff00;">${rottaString}</span></div>
      <div class="data-row">DIST (3D): <span class="value">${closestVolo.distanceMiles.toFixed(1)} mi</span></div>
      <div class="data-row">ALTITUDE: <span class="value">${closestVolo.altBaro.toLocaleString()} ft</span></div>
      <div class="data-row">GS: <span class="value">${closestVolo.gs ? `${Math.round(closestVolo.gs)} kts` : 'N/A'}</span></div>
      <div class="data-row">HDG: <span class="value">${closestVolo.track ? `${Math.round(closestVolo.track)}°` : 'N/A'}</span></div>
    </div>
  `;

// 2. Iniettiamo l'immagine in modo sicuro manipolando il DOM direttamente
 // 2. Elaboriamo l'immagine in memoria per evitare il flickering
  const logoTarget = document.getElementById('logo-target');
  if (logoTarget && logoUrl) {
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
          finalImg.style.maxHeight = '38px';
          finalImg.style.maxWidth = '90px';
          finalImg.style.objectFit = 'contain';
          finalImg.style.display = 'block';
          finalImg.style.filter = 'drop-shadow(0 0 2px rgba(0, 255, 0, 0.5))';

          // Svuotiamo il target e appendiamo l'immagine già perfetta
          logoTarget.innerHTML = '';
          logoTarget.appendChild(finalImg);
        }
      } catch (e) {
        // Se il canvas fallisce, mostriamo l'immagine originale come fallback
        console.warn("Rilassamento protezione rimozione sfondo", e);
        logoTarget.innerHTML = '';
        const fallbackImg = document.createElement('img');
        fallbackImg.src = logoUrl;
        fallbackImg.style.maxHeight = '38px';
        fallbackImg.style.maxWidth = '90px';
        fallbackImg.style.objectFit = 'contain';
        logoTarget.appendChild(fallbackImg);
      }
    };

    // Se il file .png non esiste proprio sul server, mostriamo il badge verde protettivo
    imgInMemory.onerror = () => {
      logoTarget.innerHTML = `
        <span style="border: 1px solid #00ff00; padding: 3px 8px; border-radius: 4px; font-size: 0.8em; color: #00ff00; background: rgba(0,255,0,0.1); font-weight: bold;">
          ${icaoCompagnia.toUpperCase()}
        </span>
      `;
    };
  }
}

const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}/ws`;
const socket = new WebSocket(wsUrl);

socket.onopen = () => {
  console.log("Connesso con successo al flusso dati di Skylight!");
};

socket.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    if (data && data.aircraft && Array.isArray(data.aircraft)) {
      updateUI(data.aircraft);
    }
  } catch (err) {
    console.error("Errore nel parsing dei dati:", err);
  }
};

socket.onerror = (err) => {
  console.error("Errore connessione flusso dati:", err);
};

socket.onclose = () => {
  setTimeout(() => window.location.reload(), 5000);
};