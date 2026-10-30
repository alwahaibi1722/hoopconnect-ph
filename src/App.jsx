import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, MapPin, Calendar, Users, Zap, Grid, 
  Map as MapIcon, Plus, X, ChevronRight, CheckCircle2, Trophy, User, 
  ThumbsUp, Trash2, LogIn, LogOut, Navigation, Crosshair, ArrowRight, RotateCcw, ShieldCheck, Eye, EyeOff 
} from 'lucide-react';
import L from 'leaflet';
import { supabase } from './lib/supabase';

// Preloaded Verified Directory of Philippine Basketball Venues
const INITIAL_COURTS_DIRECTORY = [
  { name: "Iloilo Sports Complex Indoor Gym", location: "La Paz, Iloilo City", lat: 10.7105, lng: 122.5630, type: "Indoor" },
  { name: "Plazuela de Iloilo Covered Court", location: "Mandurriao, Iloilo City", lat: 10.7128, lng: 122.5512, type: "Covered" },
  { name: "Homecourt Iloilo Sports Center", location: "Lapuz Sur, Iloilo City", lat: 10.6970, lng: 122.5745, type: "Indoor" },
  { name: "Brgy. San Juan Covered Court", location: "Molo, Iloilo City", lat: 10.6985, lng: 122.5480, type: "Covered" },
  { name: "Quintin Salas Covered Court", location: "Jaro, Iloilo City", lat: 10.7280, lng: 122.5620, type: "Covered" },
  { name: "Athlete's Point Sports Center", location: "Mandurriao, Iloilo City", lat: 10.7142, lng: 122.5498, type: "Indoor" },
  { name: "Jaro Plaza Gym & Covered Court", location: "Jaro, Iloilo City", lat: 10.7231, lng: 122.5580, type: "Plaza" },
  { name: "CPU Gym (Central Philippine University)", location: "Jaro, Iloilo City", lat: 10.7275, lng: 122.5540, type: "Indoor" },
  { name: "UP Visayas Covered Court", location: "City Proper, Iloilo City", lat: 10.6938, lng: 122.5638, type: "Covered" },
  { name: "Smart Araneta Coliseum", location: "Cubao, Quezon City", lat: 14.6195, lng: 121.0511, type: "Indoor" },
  { name: "Mall of Asia Arena", location: "Pasay, Metro Manila", lat: 14.5323, lng: 120.9822, type: "Indoor" }
];

// Traditional Map Pin Design with Pointy Bottom and Basketball Icon (for saved run markers)
const createTraditionalPinIcon = () => {
  const svgHtml = `
    <div style="position: relative; width: 32px; height: 42px; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));">
      <div style="width: 32px; height: 32px; background: #f43f5e; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center;">
        <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M5.5 5.5A12 12 0 0 0 12 22"></path>
            <path d="M18.5 5.5A12 12 0 0 1 12 22"></path>
            <path d="M2 12h20"></path>
          </svg>
        </div>
      </div>
    </div>
  `;
  return L.divIcon({ html: svgHtml, className: 'traditional-map-pin', iconSize: [32, 42], iconAnchor: [16, 42], popupAnchor: [0, -38] });
};

// Blue Court Pin Icon for Courts Tab markers
const createBlueCourtPinIcon = () => {
  const svgHtml = `
    <div style="position: relative; width: 32px; height: 42px; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));">
      <div style="width: 32px; height: 32px; background: #2563eb; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center;">
        <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      </div>
    </div>
  `;
  return L.divIcon({ html: svgHtml, className: 'blue-court-map-pin', iconSize: [32, 42], iconAnchor: [16, 42], popupAnchor: [0, -38] });
};

// Traditional User GPS Pin
const createUserGpsIcon = () => {
  const svgHtml = `
    <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
      <div style="width: 18px; height: 18px; background: #2563eb; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>
    </div>
  `;
  return L.divIcon({ html: svgHtml, className: 'traditional-user-gps-pin', iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14] });
};

const INITIAL_FALLBACK_RUNS = [
  {
    id: '1',
    title: "Weekend 5v5 Full Court Battle",
    location: "Iloilo Sports Complex Indoor Gym, La Paz",
    distance: "0.8 km",
    time: "Today • 6:00 PM",
    format: "5v5",
    spots_total: 10,
    spots_filled: 8,
    is_hosted_by_me: true,
    court_type: "Indoor",
    entry_fee: "₱50 / player",
    lat: 10.7105,
    lng: 122.5630,
    is_joined: true
  }
];

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(1);
}

export default function App() {
  const [runs, setRuns] = useState(() => {
    try {
      const saved = localStorage.getItem('hoopconnect_saved_runs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Local storage read error", e);
    }
    return INITIAL_FALLBACK_RUNS;
  });

  const [courtsDirectory, setCourtsDirectory] = useState(() => {
    try {
      const savedCourts = localStorage.getItem('hoopconnect_saved_courts');
      if (savedCourts) {
        const parsed = JSON.parse(savedCourts);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Courts storage read error", e);
    }
    return INITIAL_COURTS_DIRECTORY;
  });

  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  const [activeTab, setActiveTab] = useState('home'); 
  const [viewMode, setViewMode] = useState('feed'); 
  const [formatFilter, setFormatFilter] = useState('All');
  
  const [userCoords, setUserCoords] = useState([10.7202, 122.5621]);
  const [mapCenter, setMapCenter] = useState([10.7202, 122.5621]);
  const [targetCourt, setTargetCourt] = useState(null);
  const [isGpsActive, setIsGpsActive] = useState(false);

  const [isPinningMode, setIsPinningMode] = useState(false);
  const [pinningType, setPinningType] = useState('run'); // 'run' or 'court'

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLineRef = useRef(null);
  const userMarkerRef = useRef(null);
  const targetMarkerRef = useRef(null);
  const targetMarkersRef = useRef([]);

  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const [locationSearchResults, setLocationSearchResults] = useState([]);
  const [selectedCourtForReview, setSelectedCourtForReview] = useState(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [courtReviews, setCourtReviews] = useState([]);

  const [selectedRun, setSelectedRun] = useState(null);
  const [toast, setToast] = useState(null);

  const [isAddCourtModalOpen, setIsAddCourtModalOpen] = useState(false);
  const [newCourtForm, setNewCourtForm] = useState({ name: '', location: '', type: 'Covered', lat: 10.7105, lng: 122.5630 });

  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: "Marcus 'Sky' Carter", ppg: "24.5", runs: 42, respect: 128 },
    { rank: 2, name: "Devon Reed", ppg: "21.0", runs: 38, respect: 94 },
    { rank: 3, name: "Jordan Sparks", ppg: "19.8", runs: 31, respect: 76 }
  ]);

  const [entryFeeType, setEntryFeeType] = useState('Free'); 
  const [selectedPresetFee, setSelectedPresetFee] = useState('50');
  const [customFee, setCustomFee] = useState('');
  const [newRunForm, setNewRunForm] = useState({
    title: '',
    location: 'Iloilo Sports Complex Indoor Gym, La Paz',
    format: '5v5',
    spotsTotal: 10,
    time: 'Today • 7:00 PM',
    courtType: 'Covered',
    lat: 10.7105,
    lng: 122.5630
  });

  const filteredRuns = runs.filter(run => formatFilter === 'All' || run.format === formatFilter);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleUseCurrentGpsLocation = () => {
    setNewRunForm(prev => ({
      ...prev,
      location: "My Current Live GPS Location",
      lat: userCoords[0],
      lng: userCoords[1]
    }));
    showToast("📍 Using your live GPS coordinates!");
  };

  const handleSearchLocation = async (query) => {
    setNewRunForm(prev => ({ ...prev, location: query }));
    if (query.trim().length < 2) {
      setLocationSearchResults([]);
      return;
    }

    const matchedLocal = courtsDirectory.filter(court => 
      court.name.toLowerCase().includes(query.toLowerCase()) || 
      court.location.toLowerCase().includes(query.toLowerCase())
    ).map(c => ({
      display_name: `${c.name}, ${c.location}`,
      lat: c.lat,
      lon: c.lng,
      isPreloaded: true
    }));

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Philippines')}&limit=5`
      );
      const data = await res.json();
      const osmResults = (data || []).map(p => ({
        display_name: p.display_name,
        lat: parseFloat(p.lat),
        lon: parseFloat(p.lon),
        isPreloaded: false
      }));
      setLocationSearchResults([...matchedLocal, ...osmResults]);
    } catch (err) {
      setLocationSearchResults(matchedLocal);
    }
  };

  const handleSelectLocation = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    const placeTitle = place.display_name.split(',')[0] + ', ' + (place.display_name.split(',')[1] || '');

    setNewRunForm(prev => ({ ...prev, location: placeTitle, lat: lat, lng: lng }));
    setLocationSearchResults([]);
    showToast(`📍 Selected ${place.display_name.split(',')[0]}`);
  };

  // FETCH ROAD ROUTE AND RENDER ON MAP
  const drawRoadRouteOnMap = async (destLat, destLng, title, locationName) => {
    if (!mapInstanceRef.current) return;

    mapInstanceRef.current.setView([destLat, destLng], 15, { animate: true });

    if (routeLineRef.current) mapInstanceRef.current.removeLayer(routeLineRef.current);
    if (targetMarkerRef.current) mapInstanceRef.current.removeLayer(targetMarkerRef.current);

    targetMarkerRef.current = L.marker([destLat, destLng], { icon: createBlueCourtPinIcon() })
      .addTo(mapInstanceRef.current)
      .bindPopup(`<b>📍 ${title || 'Destination'}</b><br/>${locationName || ''}`)
      .openPopup();

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userCoords[1]},${userCoords[0]};${destLng},${destLat}?overview=full&geometries=geojson`
      );
      const data = await response.json();

      if (data && data.routes && data.routes[0]) {
        const roadCoordinates = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);

        routeLineRef.current = L.polyline(roadCoordinates, {
          color: '#2563eb',
          weight: 5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(mapInstanceRef.current);
        return;
      }
    } catch (err) {
      console.warn("OSRM routing fallback:", err);
    }

    routeLineRef.current = L.polyline([userCoords, [destLat, destLng]], {
      color: '#2563eb',
      weight: 4,
      opacity: 0.85,
      dashArray: '6, 8'
    }).addTo(mapInstanceRef.current);
  };

  // CANCEL ROUTING HANDLER
  const handleCancelRouting = () => {
    setTargetCourt(null);
    if (routeLineRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }
    if (targetMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(targetMarkerRef.current);
      targetMarkerRef.current = null;
    }
    renderFilteredRunMarkers();
    showToast("🗺️ Navigation route cancelled.");
  };

  // Render Map Markers for both Runs and Courts Directory
  const renderFilteredRunMarkers = () => {
    if (!mapInstanceRef.current) return;

    targetMarkersRef.current.forEach(m => mapInstanceRef.current.removeLayer(m));
    targetMarkersRef.current = [];

    // Render all saved courts as blue pins
    courtsDirectory.forEach(court => {
      if (court.lat && court.lng) {
        const marker = L.marker([parseFloat(court.lat), parseFloat(court.lng)], { icon: createBlueCourtPinIcon() })
          .addTo(mapInstanceRef.current)
          .bindPopup(`<b>🏀 ${court.name}</b><br/>${court.location} (${court.type})`);
        targetMarkersRef.current.push(marker);
      }
    });

    // Render active game runs as red pins
    const runsToDisplay = filteredRuns;
    runsToDisplay.forEach(run => {
      if (run.lat && run.lng) {
        const marker = L.marker([parseFloat(run.lat), parseFloat(run.lng)], { icon: createTraditionalPinIcon() })
          .addTo(mapInstanceRef.current)
          .bindPopup(`<b>📍 ${run.title}</b><br/>${run.location} (${run.format})`);
        targetMarkersRef.current.push(marker);
      }
    });
  };

  // Map Navigation Handler with Road Routing
  const handleNavigateInApp = (item) => {
    const destLat = parseFloat(item.lat) || 10.7105;
    const destLng = parseFloat(item.lng) || 122.5630;
    const destTitle = item.name || item.title || 'Streetball Run';
    const destLocation = item.location || 'Iloilo City';

    setActiveTab('home');
    setViewMode('map');
    setMapCenter([destLat, destLng]);
    setTargetCourt({ lat: destLat, lng: destLng, name: destTitle, location: destLocation });

    showToast(`🗺️ Navigation route calculated to ${destTitle}`);
  };

  // Switch to Map View from any tab when Map button on top header is clicked
  const handleTopHeaderMapToggle = () => {
    if (activeTab !== 'home') {
      setActiveTab('home');
    }
    setViewMode(viewMode === 'feed' ? 'map' : 'feed');
  };

  // Initialize Map
  useEffect(() => {
    if (user && activeTab === 'home' && viewMode === 'map') {
      const timer = setTimeout(() => {
        if (!mapInstanceRef.current && mapRef.current) {
          const map = L.map(mapRef.current).setView(mapCenter, 14);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);
          mapInstanceRef.current = map;
        }

        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          mapInstanceRef.current.setView(mapCenter, 15);

          if (userMarkerRef.current) mapInstanceRef.current.removeLayer(userMarkerRef.current);
          userMarkerRef.current = L.marker(userCoords, { icon: createUserGpsIcon() })
            .addTo(mapInstanceRef.current)
            .bindPopup('📍 You are here');

          if (targetCourt) {
            drawRoadRouteOnMap(targetCourt.lat, targetCourt.lng, targetCourt.name, targetCourt.location);
          } else {
            renderFilteredRunMarkers();
          }
        }
      }, 150);

      return () => clearTimeout(timer);
    } else if (viewMode === 'feed') {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    }
  }, [user, activeTab, viewMode, mapCenter, targetCourt, runs, formatFilter, courtsDirectory]);

  const handleConfirmCenterPin = () => {
    if (mapInstanceRef.current) {
      const center = mapInstanceRef.current.getCenter();
      const customLocName = `Custom Dropped Pin (${center.lat.toFixed(3)}, ${center.lng.toFixed(3)})`;
      
      if (pinningType === 'court') {
        setNewCourtForm({
          name: 'Dropped Pin Basketball Court',
          location: customLocName,
          type: 'Covered',
          lat: center.lat,
          lng: center.lng
        });
        setIsPinningMode(false);
        setIsAddCourtModalOpen(true);
        showToast("📍 Dropped pin location selected for new court!");
      } else {
        setTargetCourt({ lat: center.lat, lng: center.lng, name: 'Dropped Pin Run Location', location: customLocName });
        setNewRunForm(prev => ({
          ...prev,
          title: prev.title || 'Dropped Pin Streetball Run',
          location: customLocName,
          lat: center.lat,
          lng: center.lng
        }));
        setIsPinningMode(false);
        setIsHostModalOpen(true);
        showToast("📍 Pin location confirmed with run details!");
      }
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const coords = [position.coords.latitude, position.coords.longitude];
          setUserCoords(coords);
          setIsGpsActive(true);
        },
        (err) => console.warn("GPS error:", err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Persistent Run Sync on Mount
  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const cachedLocalRuns = JSON.parse(localStorage.getItem('hoopconnect_saved_runs') || '[]');
        const { data } = await supabase.from('runs').select('*').order('created_at', { ascending: false });
        
        let mergedRuns = cachedLocalRuns.length > 0 ? cachedLocalRuns : INITIAL_FALLBACK_RUNS;

        if (data && data.length > 0) {
          const remoteIds = new Set(data.map(d => d.id));
          mergedRuns = [...data, ...cachedLocalRuns.filter(r => !remoteIds.has(r.id))];
        }

        setRuns(mergedRuns);
        localStorage.setItem('hoopconnect_saved_runs', JSON.stringify(mergedRuns));
      } catch (err) {
        console.warn("Sync note:", err);
      }
    };
    fetchRuns();
  }, []);

  const openCourtReviewModal = async (courtName) => {
    setSelectedCourtForReview(courtName);
    try {
      const { data } = await supabase.from('court_reviews').select('*').eq('court_name', courtName).order('created_at', { ascending: false });
      if (data) setCourtReviews(data);
    } catch (e) {
      console.warn("Court reviews fetch warning:", e);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      setIsAuthModalOpen(true);
      showToast("🔒 Please log in or sign up to post ratings!");
      return;
    }

    const newReview = { user_id: user.id, court_name: selectedCourtForReview, rating: ratingStars, comment: reviewComment, user_email: user.email };
    setCourtReviews(prev => [newReview, ...prev]);
    showToast("⭐ Rating submitted!");
    setReviewComment('');

    try {
      await supabase.from('court_reviews').insert([newReview]);
    } catch (err) {
      console.warn("DB rating backup note:", err);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (error) throw error;
        showToast("Logged in successfully! 🏀");
      } else {
        // Strict password validation rules for signup
        const hasMinLen = authPassword.length >= 8;
        const hasUpper = /[A-Z]/.test(authPassword);
        const hasLower = /[a-z]/.test(authPassword);
        const hasNumber = /[0-9]/.test(authPassword);
        const hasSpecial = /[\W_]/.test(authPassword);

        if (!hasMinLen || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
          throw new Error("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
        }

        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw error;
        showToast("Account created successfully!");
      }
      setIsAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (err) {
      showToast("⚠️ Auth Error: " + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google', 
        options: { 
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account'
          }
        } 
      });
      if (error) throw error;
    } catch (err) {
      showToast("⚠️ Google Login Error: " + err.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    showToast("Logged out successfully");
  };

  const handleToggleJoin = async (id) => {
    if (!user) {
      setIsAuthModalOpen(true);
      showToast("🔒 Please log in or sign up to join runs!");
      return;
    }

    const targetRun = runs.find(r => r.id === id);
    if (!targetRun) return;

    const newJoinedState = !targetRun.is_joined;
    const newSpotsFilled = newJoinedState ? targetRun.spots_filled + 1 : Math.max(1, targetRun.spots_filled - 1);

    const updatedRuns = runs.map(run => run.id === id ? { ...run, is_joined: newJoinedState, spots_filled: newSpotsFilled } : run);
    setRuns(updatedRuns);
    localStorage.setItem('hoopconnect_saved_runs', JSON.stringify(updatedRuns));
    showToast(newJoinedState ? "🎉 Joined spot!" : "Left run.");

    try {
      await supabase.from('runs').update({ is_joined: newJoinedState, spots_filled: newSpotsFilled }).eq('id', id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteRun = async (id) => {
    const updatedRuns = runs.filter(r => r.id !== id);
    setRuns(updatedRuns);
    localStorage.setItem('hoopconnect_saved_runs', JSON.stringify(updatedRuns));
    if (selectedRun && selectedRun.id === id) setSelectedRun(null);
    showToast("🗑️ Run removed by host.");

    try {
      await supabase.from('runs').delete().eq('id', id);
    } catch (e) {
      console.error("Failed to delete from DB:", e);
    }
  };

  // Delete Custom Added Court from Courts Tab
  const handleDeleteCourt = (courtName) => {
    const updatedCourts = courtsDirectory.filter(c => c.name !== courtName);
    setCourtsDirectory(updatedCourts);
    localStorage.setItem('hoopconnect_saved_courts', JSON.stringify(updatedCourts));
    showToast("🗑️ Court deleted successfully.");
  };

  const handleAddCourtSubmit = (e) => {
    e.preventDefault();
    if (!newCourtForm.name.trim()) {
      showToast("⚠️ Please enter a court name!");
      return;
    }

    const newCourtEntry = {
      name: newCourtForm.name.trim(),
      location: newCourtForm.location.trim() || 'Iloilo City',
      type: newCourtForm.type || 'Covered',
      lat: parseFloat(newCourtForm.lat) || userCoords[0],
      lng: parseFloat(newCourtForm.lng) || userCoords[1],
      isUserAdded: true
    };

    const updatedCourtsList = [newCourtEntry, ...courtsDirectory];
    setCourtsDirectory(updatedCourtsList);
    localStorage.setItem('hoopconnect_saved_courts', JSON.stringify(updatedCourtsList));

    setIsAddCourtModalOpen(false);
    setNewCourtForm({ name: '', location: '', type: 'Covered', lat: 10.7105, lng: 122.5630 });
    showToast("🏀 New court saved to Courts tab & map!");
  };

  const handleGiveRespect = (rank) => {
    if (!user) {
      setIsAuthModalOpen(true);
      showToast("🔒 Please log in or sign up to give respect!");
      return;
    }
    setLeaderboard(prev => prev.map(item => item.rank === rank ? { ...item, respect: item.respect + 1 } : item));
    showToast("🔥 Respect given!");
  };

  const handleCreateRun = async (e) => {
    e.preventDefault();

    if (!user) {
      setIsAuthModalOpen(true);
      showToast("🔒 Please log in or sign up to host runs!");
      return;
    }

    if (!newRunForm.title || !newRunForm.title.trim()) {
      showToast("⚠️ Please enter a run title!");
      return;
    }

    const computedFee = entryFeeType === 'Free' ? 'Free' : `₱${customFee.trim() || selectedPresetFee} / player`;

    const newCreatedRun = {
      id: Date.now().toString(),
      user_id: user.id,
      title: newRunForm.title,
      location: newRunForm.location || 'Local PH Court',
      time: newRunForm.time || 'Today • 7:00 PM',
      format: newRunForm.format || '5v5',
      spots_total: parseInt(newRunForm.spotsTotal, 10) || 10,
      spots_filled: 1,
      is_hosted_by_me: true,
      court_type: newRunForm.courtType || 'Covered',
      entry_fee: computedFee,
      lat: parseFloat(newRunForm.lat) || 10.7105,
      lng: parseFloat(newRunForm.lng) || 122.5630,
      is_joined: true
    };

    const updatedRunsList = [newCreatedRun, ...runs];
    setRuns(updatedRunsList);
    localStorage.setItem('hoopconnect_saved_runs', JSON.stringify(updatedRunsList));

    setIsHostModalOpen(false);
    showToast("🏀 Run Published & Saved!");

    try {
      await supabase.from('runs').insert([{
        user_id: user.id,
        title: newRunForm.title,
        location: newRunForm.location,
        time: newRunForm.time,
        format: newRunForm.format,
        spots_total: parseInt(newRunForm.spotsTotal, 10) || 10,
        spots_filled: 1,
        court_type: newRunForm.courtType,
        entry_fee: computedFee,
        lat: parseFloat(newRunForm.lat) || 10.7105,
        lng: parseFloat(newRunForm.lng) || 122.5630,
        is_joined: true
      }]);
    } catch (err) {
      console.warn("Supabase background save notice:", err);
    }

    setNewRunForm(prev => ({ ...prev, title: '' }));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black p-0 sm:p-4 font-sans text-neutral-100 selection:bg-rose-500 selection:text-white">
      
      {/* Mobile OS Container */}
      <div className="relative w-full max-w-[420px] h-[100vh] sm:h-[860px] bg-neutral-950 sm:rounded-[44px] shadow-2xl border-0 sm:border-8 border-neutral-900 flex flex-col overflow-hidden">
        
        {/* Status Bar */}
        <div className="px-6 pt-3 pb-2 flex justify-between items-center text-xs font-semibold z-30 select-none bg-black border-b border-neutral-900">
          <span className="text-neutral-100 font-bold">9:41</span>
          <div className="w-20 h-4 bg-black rounded-full flex justify-center items-center border border-neutral-900">
            <div className="w-3 h-3 rounded-full bg-neutral-900"></div>
          </div>
          <div className="flex items-center space-x-1.5 text-neutral-400">
            <Zap className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-neutral-400">5G</span>
          </div>
        </div>

        {/* UNAUTHENTICATED LANDING PAGE */}
        {!user ? (
          <div className="relative flex-1 flex flex-col justify-between p-6 overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover z-0 filter brightness-50 contrast-125 scale-105"
            >
              <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" />
            </video>

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30 z-10"></div>

            <div className="relative z-20 flex justify-between items-center pt-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 flex items-center justify-center shadow-2xl">
                  <Flame className="w-6 h-6 text-white fill-white" />
                </div>
                <h1 className="font-black text-xl tracking-tight text-white">
                  Hoop<span className="text-rose-500">Connect</span>
                </h1>
              </div>

              <button
                onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/20 transition-all"
              >
                Log In
              </button>
            </div>

            <div className="relative z-20 space-y-5 pb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-400">Philippine Pickup Network</span>
              </div>

              <h2 className="text-3xl font-black tracking-tight leading-none text-white">
                Find Local Streetball Runs <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-red-500 to-amber-500">Near You.</span>
              </h2>

              <p className="text-xs text-neutral-300 font-medium leading-relaxed">
                Connect with local hoopers, join open runs, rate courts, and host pickup games across Iloilo and the Philippines.
              </p>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 text-white font-black text-sm shadow-2xl shadow-rose-950/80 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  Sign Up <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>

                <button
                  onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                  className="w-full py-3.5 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800/80 border border-neutral-700 text-neutral-200 font-bold text-xs backdrop-blur-md transition-all"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED APP EXPERIENCE */
          <>
            {/* Top Header */}
            <div className="px-5 py-3 bg-black border-b border-neutral-900 sticky top-0 z-20 backdrop-blur-md flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Flame className="w-5 h-5 text-white fill-white" />
                </div>
                <h1 className="font-black text-lg tracking-tight text-neutral-100">
                  Hoop<span className="text-rose-500">Connect</span>
                </h1>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleTopHeaderMapToggle}
                  className="p-2 rounded-xl border border-rose-500/20 bg-neutral-900 hover:border-rose-500/60 transition-all flex items-center gap-1.5 text-xs font-semibold text-neutral-100 shadow-md"
                >
                  {viewMode === 'feed' ? <><MapIcon className="w-4 h-4 text-rose-500" /> Map</> : <><Grid className="w-4 h-4 text-orange-500" /> Feed</>}
                </button>

                <button onClick={handleSignOut} title="Sign Out" className="p-2 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white text-xs font-bold flex items-center gap-1">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-20">

              {toast && (
                <div className="p-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 shadow-xl flex justify-between items-center z-50 relative">
                  <span>{toast}</span>
                  <button onClick={() => setToast(null)}><X className="w-4 h-4" /></button>
                </div>
              )}

              {/* HOME TAB */}
              {activeTab === 'home' && (
                <>
                  <div className="relative overflow-hidden rounded-3xl p-5 border border-rose-500/30 bg-gradient-to-br from-neutral-900 via-rose-950/30 to-black shadow-xl">
                    <div className="relative z-10 space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border bg-rose-500/10 text-rose-400 border-rose-500/30">
                          PH Basketball Circuit
                        </span>
                        <span className="text-xs font-semibold text-neutral-400">{filteredRuns.length} runs listed</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-extrabold tracking-tight text-neutral-100">Ready to Run in PH?</h2>
                        <p className="text-xs mt-0.5 text-neutral-400">Logged in as {user.email}</p>
                      </div>
                      <button
                        onClick={() => setIsHostModalOpen(true)}
                        className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg bg-rose-600 hover:bg-rose-500 text-white"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" /> Host a Run
                      </button>
                    </div>
                  </div>

                  {/* Formats Filter */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">Game Formats</span>
                    </div>
                    <div className="flex gap-2">
                      {['All', '5v5', '3v3', '1v1'].map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setFormatFilter(fmt)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border text-center ${
                            formatFilter === fmt ? 'bg-rose-600 text-white border-transparent' : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* DROP PIN BUTTONS */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setPinningType('run');
                        setIsPinningMode(!isPinningMode);
                        setViewMode('map');
                      }}
                      className={`py-3 px-3 rounded-2xl text-xs font-extrabold border flex items-center justify-center gap-1.5 transition-all shadow-lg ${
                        isPinningMode && pinningType === 'run'
                          ? 'bg-amber-400 text-black border-amber-300 animate-pulse' 
                          : 'bg-neutral-900 text-rose-400 border-rose-500/30 hover:bg-neutral-800'
                      }`}
                    >
                      <Crosshair className="w-4 h-4 text-rose-500 shrink-0" /> {isPinningMode && pinningType === 'run' ? 'Cancel Pin' : '📍 Drop Run Pin'}
                    </button>

                    <button
                      onClick={() => {
                        setPinningType('court');
                        setIsPinningMode(!isPinningMode);
                        setViewMode('map');
                      }}
                      className={`py-3 px-3 rounded-2xl text-xs font-extrabold border flex items-center justify-center gap-1.5 transition-all shadow-lg ${
                        isPinningMode && pinningType === 'court'
                          ? 'bg-amber-400 text-black border-amber-300 animate-pulse' 
                          : 'bg-neutral-900 text-blue-400 border-blue-500/30 hover:bg-neutral-800'
                      }`}
                    >
                      <MapPin className="w-4 h-4 text-blue-500 shrink-0" /> {isPinningMode && pinningType === 'court' ? 'Cancel Pin' : '📍 Drop Court Pin'}
                    </button>
                  </div>

                  {/* MAP VIEW CONTAINER */}
                  {viewMode === 'map' && (
                    <div className="space-y-3">
                      <div className="relative w-full rounded-3xl border border-rose-500/20 overflow-hidden shadow-2xl bg-neutral-900 z-0 h-[450px]">
                        {isPinningMode && (
                          <div className="absolute inset-0 pointer-events-none z-[401] flex items-center justify-center">
                            <div className="relative -mt-10 flex flex-col items-center">
                              {/* Centered pointy down pin matching user request (pointing straight down) */}
                              <div className="relative flex flex-col items-center animate-bounce filter drop-shadow-[0_6px_8px_rgba(0,0,0,0.5)]">
                                <div className={`w-9 h-9 ${pinningType === 'court' ? 'bg-blue-600' : 'bg-rose-600'} rounded-full border-2 border-white flex items-center justify-center shadow-lg z-10`}>
                                  <span className="text-xs text-white font-bold">📍</span>
                                </div>
                                <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent ${pinningType === 'court' ? 'border-t-[12px] border-t-blue-600' : 'border-t-[12px] border-t-rose-600'} -mt-1`}></div>
                              </div>
                              <div className="mt-4 pointer-events-auto">
                                <button
                                  onClick={handleConfirmCenterPin}
                                  className={`px-5 py-2.5 ${pinningType === 'court' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-rose-600 hover:bg-rose-500'} text-white font-black text-xs rounded-2xl shadow-2xl border-2 border-white transition-all flex items-center gap-1.5`}
                                >
                                  ✓ Confirm Dropped {pinningType === 'court' ? 'Court' : 'Run'} Pin
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        <div ref={mapRef} className="w-full h-full z-0" />

                        {/* Cancel Routing Button Overlay on Map */}
                        {targetCourt && (
                          <div className="absolute top-3 right-3 z-[402]">
                            <button
                              onClick={handleCancelRouting}
                              className="px-3 py-2 bg-neutral-900/90 hover:bg-neutral-800 text-rose-400 border border-rose-500/40 rounded-xl font-bold text-xs shadow-xl backdrop-blur-md flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Cancel Routing
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* FEED VIEW CONTAINER */}
                  {viewMode === 'feed' && (
                    <div className="space-y-3.5">
                      {filteredRuns.length === 0 ? (
                        <div className="text-center py-8 space-y-2">
                          <p className="text-xs text-neutral-400">No runs found for filter "{formatFilter}".</p>
                          <button onClick={() => setFormatFilter('All')} className="text-xs text-rose-500 font-bold underline">Show All Runs</button>
                        </div>
                      ) : filteredRuns.map((run) => {
                        const spotsTotal = run.spots_total || 10;
                        const spotsFilled = run.spots_filled || 1;

                        const computedDist = (isGpsActive && run.lat && run.lng)
                          ? `${calculateDistanceKm(userCoords[0], userCoords[1], run.lat, run.lng)} km away`
                          : run.distance || 'Near you';

                        return (
                          <div key={run.id} className="rounded-3xl border border-rose-500/20 bg-neutral-900 p-4 shadow-md space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase bg-rose-500/10 text-rose-400 border-rose-500/30">{run.format}</span>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-neutral-300">{run.entry_fee || 'Free'}</span>
                                </div>
                                <h3 className="font-bold text-base text-neutral-100">{run.title}</h3>
                              </div>

                              {(run.user_id === user?.id || run.is_hosted_by_me) && (
                                <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                                  Your Run
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="p-2 rounded-xl border border-neutral-800 bg-neutral-950 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                                <div className="truncate">
                                  <p className="font-semibold truncate text-neutral-100">{run.location}</p>
                                  <p className="text-[10px] text-rose-400 font-bold">{computedDist}</p>
                                </div>
                              </div>
                              <div className="p-2 rounded-xl border border-neutral-800 bg-neutral-950 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                                <div className="truncate">
                                  <p className="font-semibold truncate text-neutral-100">{run.time}</p>
                                  <p className="text-[10px] text-neutral-400">{run.court_type || 'Court'}</p>
                                </div>
                              </div>
                            </div>

                            {/* Roster Progress Bar */}
                            <div className="p-3 rounded-2xl border border-neutral-800 bg-neutral-950">
                              <div className="flex justify-between items-center text-xs mb-1.5">
                                <span className="font-semibold flex items-center gap-1 text-neutral-400">
                                  <Users className="w-3.5 h-3.5 text-rose-400" /> Roster
                                </span>
                                <span className="font-bold text-xs text-neutral-100">
                                  <span className="text-rose-500">{spotsFilled}</span> / {spotsTotal} Players
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-1">
                                <div
                                  className="h-full bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 transition-all duration-300"
                                  style={{ width: `${(spotsFilled / spotsTotal) * 100}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleToggleJoin(run.id)}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-xs ${
                                  run.is_joined ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-600 text-white'
                                }`}
                              >
                                {run.is_joined ? '✓ Joined Game' : 'Join Spot'}
                              </button>

                              <button
                                onClick={() => handleNavigateInApp(run)}
                                className="px-3 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 text-rose-400 font-bold text-xs flex items-center gap-1.5 hover:border-rose-500"
                                title="Show Route on Map"
                              >
                                <Navigation className="w-3.5 h-3.5 fill-rose-400" /> Route
                              </button>

                              <button onClick={() => setSelectedRun(run)} className="p-2.5 rounded-xl border border-rose-500/20 bg-neutral-900 text-neutral-100">
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* DISCOVER TAB */}
              {activeTab === 'discover' && (
                <div className="space-y-4 py-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-base text-neutral-100">Philippine Courts & Venues</h3>
                    <button
                      onClick={() => setIsAddCourtModalOpen(true)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Court
                    </button>
                  </div>

                  {courtsDirectory.map((court, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl border border-neutral-800 bg-neutral-900 flex flex-col gap-3 shadow-md">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-sm text-neutral-100">{court.name}</h4>
                            {court.isUserAdded && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                                Custom
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400">{court.location} • <span className="text-rose-400 font-medium">{court.type}</span></p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 gap-1.5">
                        <button 
                          onClick={() => handleNavigateInApp(court)}
                          className="flex-1 py-2 px-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 font-bold text-xs flex items-center justify-center gap-1 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-sm"
                        >
                          <Navigation className="w-3.5 h-3.5 fill-blue-400" /> Map
                        </button>
                        <button 
                          onClick={() => openCourtReviewModal(court.name)}
                          className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-1 shadow-sm"
                        >
                          ★ Rate
                        </button>
                        <button 
                          onClick={() => {
                            if (!user) {
                              setIsAuthModalOpen(true);
                              showToast("🔒 Please log in or sign up to host runs!");
                              return;
                            }
                            setNewRunForm({ ...newRunForm, location: court.name, lat: court.lat, lng: court.lng });
                            setIsHostModalOpen(true);
                          }}
                          className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-1 shadow-sm"
                        >
                          Host
                        </button>
                        {court.isUserAdded && (
                          <button
                            onClick={() => handleDeleteCourt(court.name)}
                            className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center"
                            title="Delete Court"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* JOINED / MATCHES TAB */}
              {activeTab === 'matches' && (
                <div className="space-y-4 py-2">
                  <h3 className="font-bold text-base text-neutral-100">My Joined Runs</h3>
                  {runs.filter(r => r.is_joined).length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-6">You haven't joined any Philippine runs yet.</p>
                  ) : (
                    runs.filter(r => r.is_joined).map(run => (
                      <div key={run.id} className="p-4 rounded-2xl border border-rose-500/20 bg-neutral-900 flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-sm text-neutral-100">{run.title}</h4>
                          <p className="text-xs text-neutral-400">{run.location} • {run.time}</p>
                        </div>
                        <button 
                          onClick={() => handleNavigateInApp(run)}
                          className="px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400 font-bold text-xs flex items-center gap-1 hover:bg-blue-600 hover:text-white transition-all"
                        >
                          <Navigation className="w-3 h-3 fill-blue-400" /> Map
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* LEADERBOARD TAB */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-3 py-2">
                  <h3 className="font-bold text-base text-neutral-100">Top Streetballers</h3>
                  {leaderboard.map(player => (
                    <div key={player.rank} className="p-3.5 rounded-2xl border border-rose-500/20 bg-neutral-900 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className={`font-black text-sm ${player.rank === 1 ? 'text-amber-400' : 'text-neutral-400'}`}>#{player.rank}</span>
                        <div>
                          <h4 className="font-bold text-xs text-neutral-100">{player.name}</h4>
                          <p className="text-[10px] text-neutral-400">{player.runs} Runs Hosted</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-rose-500">{player.ppg} PPG</span>
                        <button onClick={() => handleGiveRespect(player.rank)} className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-950 text-rose-400 flex items-center gap-1 text-[10px] font-bold">
                          <ThumbsUp className="w-3 h-3" /> {player.respect}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <div className="space-y-4 text-center py-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-rose-600 to-orange-500 p-1 mx-auto shadow-lg">
                    <img src={user?.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} className="w-full h-full rounded-xl object-cover" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-neutral-100">{user.email}</h3>
                    <p className="text-xs text-neutral-400">Authenticated Baller</p>
                    <button onClick={handleSignOut} className="mt-4 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold">Log Out</button>
                  </div>
                </div>
              )}

            </div>

            {/* BOTTOM NAVIGATION */}
            <div className="px-4 py-2.5 bg-black border-t border-neutral-900 flex justify-around items-center z-30 select-none absolute bottom-0 left-0 right-0">
              {[
                { id: 'home', label: 'Home', icon: Flame },
                { id: 'discover', label: 'Courts', icon: MapPin },
                { id: 'matches', label: 'Joined', icon: CheckCircle2 },
                { id: 'leaderboard', label: 'Ranks', icon: Trophy },
                { id: 'profile', label: 'Profile', icon: User },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 ${isActive ? 'text-rose-500' : 'text-neutral-500'}`}>
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-bold">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ADD COURT MODAL */}
        {isAddCourtModalOpen && (
          <div className="absolute inset-0 z-[99999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-neutral-950 border border-neutral-800 rounded-3xl p-5 space-y-4 text-neutral-100 shadow-2xl">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                <h3 className="font-extrabold text-sm flex items-center gap-1.5"><MapPin className="w-4 h-4 text-rose-500" /> Add New Court</h3>
                <button onClick={() => setIsAddCourtModalOpen(false)}><X className="w-4 h-4 text-neutral-400" /></button>
              </div>

              <form onSubmit={handleAddCourtSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="text-neutral-400 block mb-1 font-bold">Court Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jaro Plaza Basketball Court"
                    value={newCourtForm.name}
                    onChange={e => setNewCourtForm({ ...newCourtForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1 font-bold">Location / Barangay</label>
                  <input
                    type="text"
                    placeholder="e.g. Jaro, Iloilo City"
                    value={newCourtForm.location}
                    onChange={e => setNewCourtForm({ ...newCourtForm, location: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1 font-bold">Court Type</label>
                  <select
                    value={newCourtForm.type}
                    onChange={e => setNewCourtForm({ ...newCourtForm, type: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100"
                  >
                    <option value="Covered">Covered Court</option>
                    <option value="Indoor">Indoor Gym</option>
                    <option value="Outdoor">Outdoor Asphalt / Concrete</option>
                    <option value="Plaza">Plaza Court</option>
                  </select>
                </div>

                <button type="submit" className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg">
                  Save Court to Directory
                </button>
              </form>
            </div>
          </div>
        )}

        {/* COURT RATING & REVIEWS MODAL */}
        {selectedCourtForReview && (
          <div className="absolute inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full bg-neutral-950 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 text-neutral-100 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                <div>
                  <h3 className="font-extrabold text-sm text-white">{selectedCourtForReview}</h3>
                  <p className="text-[10px] text-rose-400">Court Reviews & Community Ratings</p>
                </div>
                <button onClick={() => setSelectedCourtForReview(null)}><X className="w-4 h-4 text-neutral-400" /></button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-3 bg-neutral-900 p-3 rounded-2xl border border-neutral-800">
                <label className="text-xs font-bold block text-neutral-300">Rate this court:</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRatingStars(star)}
                      className={`text-xl transition-all ${star <= ratingStars ? 'text-amber-400 scale-110' : 'text-neutral-700'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  required
                  placeholder="e.g. Good hardwood, lights work until 10 PM!"
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-rose-500"
                />

                <button type="submit" className="w-full py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md">
                  Post Rating
                </button>
              </form>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-400">Recent Ratings ({courtReviews.length})</h4>
                {courtReviews.length === 0 ? (
                  <p className="text-[11px] text-neutral-500 py-2 text-center">No reviews yet. Be the first to rate!</p>
                ) : (
                  courtReviews.map((rev, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-neutral-200">{rev.user_email ? rev.user_email.split('@')[0] : 'Baller'}</span>
                        <span className="text-amber-400 font-bold">{'★'.repeat(rev.rating)}</span>
                      </div>
                      <p className="text-neutral-400 text-[11px]">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* AUTH MODAL */}
        {isAuthModalOpen && (
          <div className="absolute inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-neutral-950 border border-neutral-800 rounded-3xl p-5 space-y-4 text-neutral-100 shadow-2xl">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                <h3 className="font-extrabold text-sm flex items-center gap-2"><Flame className="w-4 h-4 text-rose-500" /> {authMode === 'login' ? 'Log In' : 'Sign Up'}</h3>
                <button onClick={() => setIsAuthModalOpen(false)}><X className="w-4 h-4" /></button>
              </div>

              <button type="button" onClick={handleGoogleLogin} className="w-full py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-200 hover:bg-neutral-800 transition-all flex items-center justify-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Choose Google Account
              </button>

              <div className="flex items-center my-2 text-neutral-600 text-[10px]">
                <div className="flex-1 border-t border-neutral-800"></div>
                <span className="px-2 uppercase">or email</span>
                <div className="flex-1 border-t border-neutral-800"></div>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="text-neutral-400 block mb-1">Email</label>
                  <input type="email" required placeholder="baller@hoopconnect.ph" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-rose-500" />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1 flex justify-between">
                    <span>Password</span>
                    {authMode === 'signup' && <span className="text-[9px] text-rose-400">Strict rules apply</span>}
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      placeholder="••••••••" 
                      value={authPassword} 
                      onChange={e => setAuthPassword(e.target.value)} 
                      className="w-full px-3 py-2 pr-9 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-rose-500" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {authMode === 'signup' && (
                    <p className="text-[10px] text-neutral-500 mt-1 leading-tight">
                      Min 8 chars, 1 uppercase, 1 lowercase, 1 number & 1 special character.
                    </p>
                  )}
                </div>
                <button type="submit" disabled={authLoading} className="w-full py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs">{authLoading ? '...' : authMode === 'login' ? 'Sign In' : 'Sign Up'}</button>
              </form>

              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="w-full text-center text-[11px] text-rose-400 hover:underline">
                {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
              </button>
            </div>
          </div>
        )}

        {/* HOST RUN MODAL */}
        {isHostModalOpen && user && (
          <div className="absolute inset-0 z-[99999] bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
            <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-3xl flex flex-col max-h-[85vh] overflow-hidden shadow-2xl text-neutral-100">
              
              <div className="flex justify-between items-center px-5 py-4 border-b border-neutral-800 bg-neutral-950 z-20 shrink-0">
                <h3 className="font-extrabold text-sm flex items-center gap-1.5"><Flame className="w-4 h-4 text-rose-500" /> Host a Run</h3>
                <button onClick={() => setIsHostModalOpen(false)}><X className="w-4 h-4 text-neutral-400 hover:text-white" /></button>
              </div>

              <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
                <form onSubmit={handleCreateRun} className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-neutral-400 block mb-1 font-bold">Run Title</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. 5v5 Full Court Night Battle" 
                      value={newRunForm.title} 
                      onChange={e => setNewRunForm({ ...newRunForm, title: e.target.value })} 
                      className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 focus:outline-none focus:border-rose-500" 
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-neutral-400 font-bold">Court Location / Search</label>
                      <button
                        type="button"
                        onClick={handleUseCurrentGpsLocation}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/30"
                      >
                        🎯 Use My GPS Location
                      </button>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        required 
                        placeholder="Type court or click 'Use My GPS Location'" 
                        value={newRunForm.location} 
                        onChange={e => handleSearchLocation(e.target.value)} 
                        className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-rose-500" 
                      />

                      {locationSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl z-50 max-h-36 overflow-y-auto">
                          {locationSearchResults.map((place, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectLocation(place)}
                              className="w-full p-2 text-left text-xs border-b border-neutral-800/50 hover:bg-rose-500/10 hover:text-rose-400 transition-all block truncate"
                            >
                              <span className="font-bold flex items-center justify-between text-neutral-100">
                                <span>{place.display_name.split(',')[0]}</span>
                                {place.isPreloaded && (
                                  <span className="text-[8px] px-1 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                                    Verified
                                  </span>
                                )}
                              </span>
                              <span className="text-[9px] text-neutral-400 truncate block">{place.display_name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-neutral-400 block mb-1">Format</label>
                      <select value={newRunForm.format} onChange={e => setNewRunForm({ ...newRunForm, format: e.target.value })} className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100">
                        <option value="5v5">5v5 Full Court</option>
                        <option value="3v3">3v3 Half Court</option>
                        <option value="1v1">1v1 King of Court</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-neutral-400 block mb-1">Total Spots</label>
                      <input type="number" min="2" max="30" value={newRunForm.spotsTotal} onChange={e => setNewRunForm({ ...newRunForm, spotsTotal: e.target.value })} className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-100" />
                    </div>
                  </div>

                  <div className="space-y-2 p-3 rounded-2xl border border-neutral-800 bg-neutral-900/60">
                    <label className="text-neutral-400 block font-bold">Entry Fee / Share Option</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEntryFeeType('Free')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                          entryFeeType === 'Free' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                        }`}
                      >
                        🆓 Free Play
                      </button>
                      <button
                        type="button"
                        onClick={() => setEntryFeeType('Paid')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                          entryFeeType === 'Paid' ? 'bg-rose-600 text-white border-transparent' : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                        }`}
                      >
                        ₱ Share / Fee
                      </button>
                    </div>

                    {entryFeeType === 'Paid' && (
                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] text-neutral-400">Select standard share per player:</p>
                        <div className="flex gap-1.5">
                          {['20', '30', '50', '100'].map(fee => (
                            <button
                              type="button"
                              key={fee}
                              onClick={() => { setSelectedPresetFee(fee); setCustomFee(''); }}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold border ${
                                selectedPresetFee === fee && !customFee ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                              }`}
                            >
                              ₱{fee}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Or enter custom share (e.g. 75)"
                          value={customFee}
                          onChange={e => setCustomFee(e.target.value)}
                          className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button 
                      type="submit" 
                      className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/50 transition-all cursor-pointer"
                    >
                      Publish Run
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* SELECTED RUN DETAIL MODAL */}
        {selectedRun && (
          <div className="absolute inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-neutral-950 border border-rose-500/30 rounded-3xl p-5 space-y-3 text-neutral-100 shadow-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase bg-rose-500/10 text-rose-400 border-rose-500/30">
                    {selectedRun.format}
                  </span>
                  <h3 className="font-extrabold text-sm mt-1 text-white">{selectedRun.title}</h3>
                </div>
                <button onClick={() => setSelectedRun(null)}><X className="w-4 h-4 text-neutral-400" /></button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">{selectedRun.location}</p>
                    <p className="text-neutral-400">{selectedRun.court_type || 'Court'}</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-white">{selectedRun.time}</p>
                    <p className="text-neutral-400">Entry: {selectedRun.entry_fee || 'Free'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => handleToggleJoin(selectedRun.id)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs ${
                    selectedRun.is_joined 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {selectedRun.is_joined ? '✓ Leave Run' : 'Join Spot'}
                </button>

                {(selectedRun.user_id === user?.id || selectedRun.is_hosted_by_me) && (
                  <button
                    onClick={() => handleDeleteRun(selectedRun.id)}
                    className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}