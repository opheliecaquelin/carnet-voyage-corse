import { useEffect, useState } from "react"
import MediaUploader from "../components/MediaUploader"
import { supabase } from "../lib/supabase"

const jours = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"]


const corsicanWords = [
  {
    corsican: "Bonghjornu",
    french: "Bonjour",
    note: "Salutation courante en journée.",
  },
  {
    corsican: "Bona sera",
    french: "Bonsoir",
    note: "À utiliser en fin de journée.",
  },
  {
    corsican: "À ringrazià vi",
    french: "Merci",
    note: "Forme polie pour remercier.",
  },
  {
    corsican: "Per piacè",
    french: "S'il vous plaît",
    note: "Très utile au restaurant ou à l'hôtel.",
  },
  {
    corsican: "Iè",
    french: "Oui",
    note: "Se prononce comme 'yé'.",
  },
  {
    corsican: "Innò",
    french: "Non",
    note: "Simple et pratique.",
  },
  {
    corsican: "Induve hè... ?",
    french: "Où est... ?",
    note: "Pour demander son chemin.",
  },
  {
    corsican: "Quantu costa ?",
    french: "Combien ça coûte ?",
    note: "Utile dans les marchés et boutiques.",
  },
  {
    corsican: "Salute",
    french: "Santé / Salut",
    note: "Pour trinquer ou saluer familièrement.",
  },
  {
    corsican: "À prestu",
    french: "À bientôt",
    note: "Pour prendre congé.",
  },
]

export default function Home() {

  // Données principales du voyage
  const [trip, setTrip] = useState(null)
  const [days, setDays] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)

  //dico
  const [dictionaryOpen, setDictionaryOpen] = useState(false)
  const [dictionarySearch, setDictionarySearch] = useState("")

  // Programme, médias
  const [programItems, setProgramItems] = useState([])
  const [allItems, setAllItems] = useState([])
  const [media, setMedia] = useState([])

  // Météo du jour sélectionné
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)


  // Interface
  const [expandedItems, setExpandedItems] = useState({})
  const [activePanel, setActivePanel] = useState(null)
  const [galleryImages, setGalleryImages] = useState([])
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState(null)
  
  //flèche vers le haut
  const [showScrollTop, setShowScrollTop] = useState(false)

  //anecdotes
  const [anecdotes, setAnecdotes] = useState([])
  const [showAnecdotes, setShowAnecdotes] = useState(false)

  // Sépare le programme principal des plans optionnels.
  const mainItems = programItems.filter(
    (item) =>
      !item.is_optional &&
      item.category !== "hotel"
  )
  const activityItems = mainItems.filter(
    (item) => item.category !== "restaurant"
  )
  
  const restaurantItems = mainItems.filter(
    (item) => item.category === "restaurant"
  )
  const optionalItems = programItems.filter((item) => item.is_optional)

  // hors ligne
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  //dico
  const filteredCorsicanWords = corsicanWords.filter((word) => {
    const search = dictionarySearch.toLowerCase().trim()

    if (!search) return true

    return (
      word.corsican.toLowerCase().includes(search) ||
      word.french.toLowerCase().includes(search) ||
      word.note.toLowerCase().includes(search)
    )
  })

  //mode sombre
  const [darkMode, setDarkMode] = useState(() => {
  return localStorage.getItem("darkMode") === "true"
  })
  const theme = {
  page: darkMode ? "#111827" : "#eef2f7",
  card: darkMode ? "#1f2937" : "#ffffff",
  softCard: darkMode ? "#374151" : "#f9fafb",
  text: darkMode ? "#f9fafb" : "#111827",
  muted: darkMode ? "#d1d5db" : "#6b7280",
  border: darkMode ? "#374151" : "#e5e7eb",
  button: darkMode ? "#374151" : "#e5e7eb",
}

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    if (!selectedDay ) return

    loadProgramItems(selectedDay.id)

    setShowAnecdotes(false)
    
    loadMedia(selectedDay.id)
    loadWeather(selectedDay.weather_location, selectedDay.day_date)
    loadAnecdotes(selectedDay.id)
  }, [selectedDay])
  // hors ligne
  useEffect(() => {
    function updateOnlineStatus() {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode ? "true" : "false")

    document.body.style.background = darkMode ? "#111827" : "#f9fafb"
    document.body.style.color = darkMode ? "#f9fafb" : "#111827"
  }, [darkMode])
  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 500)
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])
  function saveOfflineData(key, value) {
    localStorage.setItem(key, JSON.stringify(value))
  }

  function getOfflineData(key, fallback = null) {
    const saved = localStorage.getItem(key)

    if (!saved) return fallback

    try {
      return JSON.parse(saved)
    } catch {
      return fallback
    }
  }
  async function loadAnecdotes(dayId) {
   const { data } = await supabase
    .from("anecdotes")
    .select("*")
    .eq("day_id", dayId)
    .order("sort_order")

  setAnecdotes(data || []) 
  /*
  const { data, error } = await supabase
    .from("anecdotes")
    .select("*")
    .eq("day_id", dayId)
    .order("sort_order")

  console.log("DAY ID =", dayId)
  console.log("ANECDOTES =", data)
  console.log("ERROR =", error)

  setAnecdotes(data || [])*/
}
  async function init() {
    


    await loadAllItems()

    try {
      const { data: tripData } = await supabase.from("trip").select("*")

      saveOfflineData("offline-trip", tripData?.[0] || null)
      setTrip(tripData?.[0] || null)
    } catch {
      setTrip(getOfflineData("offline-trip", null))
    }

let daysData = []

    try {
      const result = await supabase
        .from("days")
        .select("*")
        .order("day_number")

      daysData = result.data || []
      saveOfflineData("offline-days", daysData)
    } catch {
      daysData = getOfflineData("offline-days", [])
    }

    setDays(daysData)

    if (daysData.length) {
      setSelectedDay(getDefaultDay(daysData))
    }
  }

  async function loadAllItems() {
    const { data, error } = await supabase
      .from("program_items")
      .select(
        `
        *,
        days (
          day_number
        )
      `
      )
      .order("sort_order")

    if (error) {
      console.error(error)
      setAllItems(getOfflineData("offline-all-items", []))
      return
    }

    saveOfflineData("offline-all-items", data || [])
    setAllItems(data || [])
  }

  async function loadProgramItems(dayId) {
    const { data, error } = await supabase
      .from("program_items")
      .select("*")
      .eq("day_id", dayId)
      .order("sort_order")

    if (error) {
      console.error(error)
      setProgramItems(getOfflineData(`offline-program-${dayId}`, []))
      return
    }

    saveOfflineData(`offline-program-${dayId}`, data || [])
    setProgramItems(data || [])
  }

  async function loadMedia(dayId) {
    const { data, error } = await supabase
      .from("media")
      .select("*")
      .eq("day_id", dayId)

    if (error) {
      console.error(error)
      setMedia(getOfflineData(`offline-media-${dayId}`, []))
      return
    }

    saveOfflineData(`offline-media-${dayId}`, data || [])
    setMedia(data || [])
  }

  async function loadWeather(location, dayDate) {
    if (!location || !dayDate) {
      setWeather(null)
      return
    }

    setWeatherLoading(true)

    try {
      // Recherche des coordonnées à partir du lieu stocké dans days.weather_location.
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          location
        )}&count=1&language=fr&format=json`
      )

      const geoData = await geoResponse.json()

      if (!geoData.results?.length) {
        setWeather(null)
        return
      }

      const place = geoData.results[0]

      // Prévision météo pour la date du jour sélectionné, pas pour la date réelle du jour.
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&daily=weathercode,temperature_2m_max,precipitation_probability_max,windspeed_10m_max&timezone=Europe%2FParis&start_date=${dayDate}&end_date=${dayDate}`
      )

      const weatherData = await weatherResponse.json()

      setWeather({
        location: place.name,
        temperature: weatherData.daily.temperature_2m_max?.[0],
        rain: weatherData.daily.precipitation_probability_max?.[0],
        wind: weatherData.daily.windspeed_10m_max?.[0],
        code: weatherData.daily.weathercode?.[0],
      })
    } catch (error) {
      console.error(error)
      setWeather(null)
    } finally {
      setWeatherLoading(false)
    }
  }
  function getChecklistItems(text) {
    if (!text) return []

    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        return line.replace(/^[-•*☐✅\s]+/, "")
      })
  }
  function getDefaultDay(daysData) {
    const today = new Date()
    const start = new Date("2026-06-13")
    const end = new Date("2026-06-27")

    if (today < start) {
      return daysData[0]
    }

    if (today > end) {
      return daysData[daysData.length - 1]
    }

    const found = daysData.find((day) => {
      const date = new Date(day.day_date)
      return date.toDateString() === today.toDateString()
    })

    return found || daysData[0]
  }

  function label(day) {
    const date = new Date(day.day_date)
    return `J${day.day_number} • ${jours[date.getDay()]} ${date.getDate()}`
  }

  function getCategoryIcon(category) {
    switch (category) {
      case "transport":
        return "✈️"
      case "visite":
        return "🏛️"
      case "restaurant":
        return "🍴"
      case "hotel":
        return "🏨"
      case "bateau":
        return "⛵"
      case "photo":
        return "📷"
      case "todo":
        return "☐"
      default:
        return "📍"
    }
    
  }
  function getCategoryColor(category) {
  switch (category) {
    case "transport":
      return "#3b82f6" // bleu

    case "visite":
      return "#8b5cf6" // violet

    case "restaurant":
      return "#f59e0b" // orange

    case "hotel":
      return "#10b981" // vert

    case "photo":
      return "#ec4899" // rose

    case "bateau":
      return "#06b6d4" // turquoise

    case "todo":
      return "#6b7280" // gris

    default:
      return "#94a3b8"
  }
}

  function getWeatherLabel(code) {
    const labels = {
      0: "Ensoleillé",
      1: "Plutôt ensoleillé",
      2: "Un peu nuageux",
      3: "Couvert",
      45: "Brouillard",
      48: "Brouillard givrant",
      51: "Bruine légère",
      53: "Bruine modérée",
      55: "Bruine forte",
      61: "Pluie faible",
      63: "Pluie modérée",
      65: "Pluie forte",
      71: "Neige faible",
      73: "Neige modérée",
      75: "Neige forte",
      80: "Averses faibles",
      81: "Averses modérées",
      82: "Averses fortes",
      95: "Orage",
    }

    return labels[code] || "Conditions variables"
  }

  function getPublicImageUrl(imagePath) {
    return supabase.storage.from("voyage-images").getPublicUrl(imagePath).data
      .publicUrl
  }

  function getMapsHref(value) {
    if (!value) return null

    // Si Supabase contient déjà une URL Maps complète, on l'utilise telle quelle.
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value
    }

    // Sinon, on transforme l'adresse ou le texte en recherche Google Maps.
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      value
    )}`
  }

  function toggleExpanded(itemId) {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }



  async function deleteMedia(mediaItem) {
    

    const confirmed = window.confirm("Supprimer cette image ?")
    if (!confirmed) return

    const { error: storageError } = await supabase.storage
      .from("voyage-images")
      .remove([mediaItem.image_path])

    if (storageError) {
      console.error(storageError)
      alert("Erreur suppression fichier")
      return
    }

    const { error: dbError } = await supabase
      .from("media")
      .delete()
      .eq("id", mediaItem.id)

    if (dbError) {
      console.error(dbError)
      alert("Erreur suppression base")
      return
    }

    loadMedia(selectedDay.id)
  }
  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }
  const hotelOfDay = programItems.find((item) => item.category === "hotel")

  const hotelMedia = hotelOfDay
    ? media.filter((item) => item.program_item_id === hotelOfDay.id)
    : []

  const hotelImage = hotelMedia.length
    ? getPublicImageUrl(hotelMedia[0].image_path)
    : null
  const bagItems =
    selectedDay 
      ? getChecklistItems(selectedDay.bag_checklist)
      : []
    return (
      <div
        style={{
          minHeight: "100vh",
          background: theme.page,
          color: theme.text,
          transition: "background 0.2s ease, color 0.2s ease",
          maxWidth: "760px",
          margin: "0 auto",
          paddingBottom: "96px",
          maxWidth: "760px",
          width: "100%",
          boxSizing: "border-box",
          padding: "16px",
        }}
      >
        <button
        onClick={() => setDarkMode(!darkMode)}
        style={{
          position: "fixed",
          right: "18px",
          bottom: "18px",
          zIndex: 1000,
          width: "52px",
          height: "52px",
          borderRadius: "999px",
          border: `1px solid ${theme.border}`,
          background: theme.card,
          color: theme.text,
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          cursor: "pointer",
          fontSize: "22px",
        }}
        aria-label={darkMode ? "Activer le mode clair" : "Activer le mode sombre"}
      >
        {darkMode ? "☀️" : "🌙"}
      </button>
          {showScrollTop && (
      <button
        onClick={scrollToTop}
        style={{
          position: "fixed",
          left: "18px",
          bottom: "18px",
          zIndex: 1000,
          width: "52px",
          height: "52px",
          borderRadius: "999px",
          border: `1px solid ${theme.border}`,
          background: theme.card,
          color: theme.text,
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          cursor: "pointer",
          fontSize: "24px",
        }}
        aria-label="Retour en haut"
      >
        ↑
      </button>
    )}
      <button
        onClick={() => setDictionaryOpen(!dictionaryOpen)}
        style={{
          position: "fixed",
          right: "18px",
          bottom: "82px",
          zIndex: 1000,
          width: "52px",
          height: "52px",
          borderRadius: "999px",
          border: `1px solid ${theme.border}`,
          background: theme.card,
          color: theme.text,
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          cursor: "pointer",
          fontSize: "22px",
        }}
        aria-label="Ouvrir le dictionnaire corse"
      >
        🗣️
      </button>

      {dictionaryOpen && (
        <div
          style={{
            position: "fixed",
            right: "18px",
            bottom: "146px",
            zIndex: 1000,
            width: "min(360px, calc(100vw - 36px))",
            maxHeight: "60vh",
            overflow: "auto",
            borderRadius: "18px",
            border: `1px solid ${theme.border}`,
            background: theme.card,
            color: theme.text,
            boxShadow: "0 18px 48px rgba(0,0,0,0.28)",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <h3
              style={{
                margin: 0,
                color: theme.text,
              }}
            >
              🗣️ Expressions corses
            </h3>

            <button
              onClick={() => setDictionaryOpen(false)}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "999px",
                border: "none",
                background: theme.button,
                color: theme.text,
                cursor: "pointer",
                fontSize: "18px",
              }}
              aria-label="Fermer le dictionnaire"
            >
              ×
            </button>
          </div>

          <input
            value={dictionarySearch}
            onChange={(event) => setDictionarySearch(event.target.value)}
            placeholder="Chercher un mot..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              marginBottom: "12px",
              padding: "12px 14px",
              borderRadius: "12px",
              border: `1px solid ${theme.border}`,
              background: darkMode ? "#111827" : "#ffffff",
              color: theme.text,
              fontSize: "16px",
            }}
          />

          <div
            style={{
              display: "grid",
              gap: "10px",
            }}
          >
            {filteredCorsicanWords.map((word) => (
              <div
                key={word.corsican}
                style={{
                  padding: "12px",
                  borderRadius: "14px",
                  background: theme.softCard,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: theme.text,
                  }}
                >
                  {word.corsican}
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    fontWeight: "600",
                    color: theme.muted,
                  }}
                >
                  {word.french}
                </div>

                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "14px",
                    color: theme.muted,
                    lineHeight: "1.4",
                  }}
                >
                  {word.note}
                </div>
              </div>
            ))}

            {filteredCorsicanWords.length === 0 && (
              <div
                style={{
                  color: theme.muted,
                  textAlign: "center",
                  padding: "12px",
                }}
              >
                Aucun mot trouvé
              </div>
            )}
          </div>
        </div>
      )}
      <h1
        style={{
          fontSize: "30px",
          textAlign: "center",
          marginBottom: "30px",
          color: theme.text,
        }}
      >
        {trip?.name}
      </h1>

      {trip && (
        <p
          style={{
            textAlign: "center",
            color: theme.muted,
            marginTop: "-20px",
            marginBottom: "30px",
            fontSize: "18px",
          }}
        >
          13 → 27 juin 2026 • 15 jours
        </p>
      )}

      <div className="hide-scrollbar"
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          marginBottom: "24px",
          whiteSpace: "nowrap",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        onWheel={(e) => {
          e.currentTarget.scrollLeft += e.deltaY
        }}
      >
        {days.map((day) => (
          <button
            key={day.id}
            onClick={() => setSelectedDay(day)}
            style={{
              padding: "10px 16px",
              borderRadius: "999px",
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 700,
              whiteSpace: "nowrap",
              border:
                selectedDay?.id === day.id
                  ? "1px solid #2563eb"
                  : `1px solid ${theme.border}`,
              background:
                selectedDay?.id === day.id
                  ? "#2563eb"
                  : theme.card,
              color:
                selectedDay?.id === day.id
                  ? "#ffffff"
                  : theme.text,
              boxShadow:
                selectedDay?.id === day.id
                  ? "0 6px 16px rgba(37,99,235,0.35)"
                  : "none",
            }}
          >
            {label(day)}
          </button>
        ))}


      </div>



      {selectedDay  && (
        <div>
          <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  }}
>
  <button
    onClick={() => {
      const index = days.findIndex(
        (d) => d.id === selectedDay.id
      )

      if (index > 0) {
        setSelectedDay(days[index - 1])
      }
    }}
    disabled={
      days.findIndex((d) => d.id === selectedDay.id) === 0
    }
    style={{
      padding: "10px 14px",
      borderRadius: "999px",
      border: "none",
      background: theme.button,
      color: theme.text,
    }}
  >
    ◀
  </button>

  <div
    style={{
      fontWeight: "700",
      color: theme.text,
    }}
  >
    {selectedDay.day_number} / {days.length}
  </div>

  <button
    onClick={() => {
      const index = days.findIndex(
        (d) => d.id === selectedDay.id
      )

      if (index < days.length - 1) {
        setSelectedDay(days[index + 1])
      }
    }}
    disabled={
      days.findIndex((d) => d.id === selectedDay.id) ===
      days.length - 1
    }
    style={{
      padding: "10px 14px",
      borderRadius: "999px",
      border: "none",
      background: theme.button,
      color: theme.text,
    }}
  >
    ▶
  </button>
</div>
          <div
  style={{
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  }}
>
  <button
    onClick={() =>
      setSelectedDay(getDefaultDay(days))
    }
    style={{
      padding: "10px 18px",
      borderRadius: "999px",
      border: "none",
      background: "#2563eb",
      color: "white",
      fontWeight: "600",
      cursor: "pointer",
    }}
  >
    📅 Aujourd'hui
  </button>
</div>
          <h2
            style={{
              textAlign: "center",
              fontSize: "32px",
              marginBottom: 8,
              color: theme.text,
            }}
          >
            Jour {selectedDay.day_number}
          </h2>

          <p
            style={{
              textAlign: "center",
              color: theme.muted,
              marginBottom: 32,
            }}
          >
            {new Date(selectedDay.day_date).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          <h1
            style={{
              textAlign: "center",
              fontSize: "30px",
              marginBottom: "16px",
              color: theme.text,
            }}
          >
            {selectedDay.title}
          </h1>
          <h3
            style={{
              textAlign: "center",
              color: theme.muted,
              fontSize: "22px",
              marginTop: 0,
              marginBottom: 40,
            }}
          >
            {selectedDay.subtitle}
          </h3>
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
          {selectedDay.route_url && (
            <a
              href={getMapsHref(selectedDay.route_url)}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "12px 18px",
                borderRadius: "999px",
                border: `1px solid ${theme.border}`,
                cursor: "pointer",
                fontWeight: "600",
                background: theme.button,
                color: theme.text,
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              🗺️ Itinéraire
            </a>
          )}

            <button
              onClick={() =>
                setActivePanel(activePanel === "bag" ? null : "bag")
              }
              style={{
                padding: "12px 18px",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                background: activePanel === "bag" ? "#2563eb" : theme.button,
                color: activePanel === "bag" ? "white" : theme.text,
                transition: "all 0.15s ease",
              }}
            >
              🎒 Sac
            </button>

            <button
              onClick={() =>
                setActivePanel(activePanel === "planb" ? null : "planb")
              }
              style={{
                padding: "12px 18px",
                borderRadius: "999px",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                background: activePanel === "planb" ? "#2563eb" : theme.button,
                color: activePanel === "planb" ? "white" : theme.text,
                transition: "all 0.15s ease",
              }}
            >
              ☔ Plan B
            </button>
          </div>



            {weatherLoading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                margin: "12px 0 20px",
                color: theme.muted,
                fontSize: "14px",
              }}
            >
              Météo...
            </div>
          ) : weather ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                margin: "10px 0 22px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  maxWidth: "100%",
                  padding: "9px 14px",
                  borderRadius: "999px",
                  border: `1px solid ${theme.border}`,
                  background: theme.card,
                  color: theme.text,
                  boxShadow: darkMode
                    ? "none"
                    : "0 4px 14px rgba(15,23,42,0.06)",
                  fontSize: "14px",
                  fontWeight: "600",
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                }}
              >
                <span>☀️ {weather.location}</span>
                <span>{weather.temperature}°C</span>
                <span>{getWeatherLabel(weather.code)}</span>
                <span>💨 {weather.wind} km/h</span>
                <span>🌧️ {weather.rain}%</span>
              </div>
            </div>
          ) : null}

          

         {activePanel === "bag" && bagItems.length > 0 && (
          <div
            style={{
              maxWidth: "700px",
              margin: "20px auto",
              background: darkMode ? "#1f2937" : "#fff8e1",
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: "16px",
              padding: "20px",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                color: theme.text,
              }}
            >
              🎒 Aujourd'hui dans le sac
            </h3>

            <div
              style={{
                display: "grid",
                gap: "10px",
              }}
            >
              {bagItems.map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    padding: "12px 14px",
                    borderRadius: "14px",
                    background: darkMode ? "#111827" : "#ffffff",
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    fontWeight: "600",
                  }}
                >


                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

          {activePanel === "planb" && optionalItems.length > 0 && (
            <div
              style={{
                maxWidth: "700px",
                margin: "20px auto",
                background: darkMode ? "#1f2937" : "#fff8e1",
                color: darkMode ? "#f9fafb" : "#111827",
                border: `1px solid ${theme.border}`,
                borderRadius: "16px",
                padding: "20px",
              }}
            >
              <h3>☔ Plans B</h3>

              {optionalItems.map((item) => (
                <div key={item.id} style={{ marginBottom: "12px" }}>
                  ⭐ {item.title}
                </div>
              ))}
            </div>
          )}

          {selectedDay.summary && (
            <p
              style={{
                textAlign: "center",
                maxWidth: "900px",
                margin: "0 auto 40px auto",
              }}
            >
              {selectedDay.summary}
            </p>
          )}

   
          {anecdotes.length > 0 && (
  <div
    style={{
      maxWidth: "700px",
      margin: "0 auto 40px auto",
    }}
  >
    <button
      onClick={() => setShowAnecdotes(!showAnecdotes)}
      style={{
        width: "100%",
        border: "none",
        cursor: "pointer",
        borderRadius: "16px",
        padding: "16px",
        background: theme.card,
        color: theme.text,
        textAlign: "left",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        fontSize: "16px",
        fontWeight: "600",
      }}
    >
      💡 Le saviez-vous ? ({anecdotes.length})

      <span style={{ float: "right" }}>
        {showAnecdotes ? "▲" : "▼"}
      </span>
    </button>

    {showAnecdotes && (
      <div
        style={{
          marginTop: "12px",
          background: theme.card,
          borderRadius: "16px",
          padding: "18px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        {anecdotes.map((anecdote, index) => (
          <div
            key={anecdote.id}
            style={{
              paddingBottom:
                index < anecdotes.length - 1
                  ? "18px"
                  : "0",
              marginBottom:
                index < anecdotes.length - 1
                  ? "18px"
                  : "0",
              borderBottom:
                index < anecdotes.length - 1
                  ? `1px solid ${theme.border}`
                  : "none",
            }}
          >
            <div
              style={{
                fontWeight: "700",
                marginBottom: "8px",
                color: theme.text,
              }}
            >
              💡 {anecdote.title}
            </div>

            <div
              style={{
                lineHeight: "1.7",
                color: theme.muted,
              }}
            >
              {anecdote.content}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}

          {hotelOfDay && (
            <div
              style={{
                maxWidth: "700px",
                margin: "20px auto 40px auto",
                background: theme.card,
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                borderLeft: `6px solid ${getCategoryColor("hotel")}`,
              }}
            >


              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "700",
                  marginBottom: "12px",
                }}
              >
                🏨 Hôtel du jour
              </div>

              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                {hotelOfDay.title}
                {hotelOfDay.address && (
                  <a
                    href={getMapsHref(hotelOfDay.maps_url || hotelOfDay.address)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "10px",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      background: theme.softCard,
                      border: `1px solid ${theme.border}`,
                      color: theme.text,
                      textDecoration: "none",
                      fontSize: "15px",
                      lineHeight: "1.5",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>📍</span>
                    <span>{hotelOfDay.address}</span>
                  </a>
                )}
                
              </div>

              {hotelOfDay.event_time && (
                <div
                  style={{
                    marginTop: "8px",
                    color: theme.muted,
                  }}
                >
                  🕒 {hotelOfDay.event_time}
                </div>
              )}

              {hotelOfDay.notes && (
                <>
                  <button
                    onClick={() => toggleExpanded(`hotel-${hotelOfDay.id}`)}
                    style={{
                      marginTop: "16px",
                      border: "none",
                      background: theme.button,
                      borderRadius: "12px",
                      padding: "10px 14px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "400",
                    }}
                  >
                    {expandedItems[`hotel-${hotelOfDay.id}`]
                      ? "▲ Réduire"
                      : "▼ Informations hôtel"}
                  </button>

                  {expandedItems[`hotel-${hotelOfDay.id}`] && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "14px",
                        borderRadius: "12px",
                        background: theme.softCard,
                        lineHeight: "1.6",
                      }}
                    >
                      {hotelOfDay.notes}

                      {hotelMedia.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            flexWrap: "wrap",
                            marginTop: "14px",
                          }}
                        >
                          {hotelMedia.map((img) => {
                            const imageUrl = getPublicImageUrl(img.image_path)

                            return (
                              <img
                                key={img.id}
                                src={imageUrl}
                                alt=""
                                onClick={() => {
                                  setGalleryImages(
                                    hotelMedia.map((m) =>
                                      getPublicImageUrl(m.image_path)
                                    )
                                  )
                                  setGalleryIndex(
                                    hotelMedia.findIndex((m) => m.id === img.id)
                                  )
                                }}
                                style={{
                                  width: "90px",
                                  height: "90px",
                                  borderRadius: "12px",
                                  border: `2px solid ${theme.border}`,
                                  objectFit: "cover",
                                  cursor: "pointer",
                                }}
                              />
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "center",
                  marginTop: "16px",
                }}
              >

                {hotelOfDay.phone && (
                  <a
                    href={`tel:${hotelOfDay.phone}`}
                    style={{
                      padding: "12px 18px",
                      background: "#ecfdf5",
                      borderRadius: "999px",
                      textDecoration: "none",
                    }}
                  >
                    📞 Appeler
                  </a>
                )}
              </div>
            </div>
          )}

          <h2
            style={{
              color: theme.text,
            }}
          >
            🎯 Programme
          </h2>

          <p
            style={{
              color: theme.muted,
              marginBottom: "20px",
            }}
          >
            {mainItems.length} activité(s)
          </p>

          {mainItems.length === 0 ? (
            <p>Aucune activité pour le moment</p>
          ) : (
            activityItems.map((item) => {
              const itemMedia = media.filter(
                (mediaItem) => mediaItem.program_item_id === item.id
              )

              return (
                <div
                  key={item.id}
                  style={{
                      background: theme.card,
                      borderRadius: "16px",
                      overflow: "hidden",
                      boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                      marginBottom: "20px",
                      borderLeft: `6px solid ${getCategoryColor(item.category)}`,
                    }}
                >
                  

                  <div style={{ padding: "16px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "22px",
                            fontWeight: "700",
                            lineHeight: "1.45",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                            width: "100%",
                          }}
                        >
                          {getCategoryIcon(item.category)} {item.title}
                        </div>

                        <div
  style={{
    marginTop: "10px",
  }}
>
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 12px",
      borderRadius: "999px",
      fontSize: "13px",
      fontWeight: "600",

      background: item.is_booked
        ? (darkMode ? "#064e3b" : "#dcfce7")
        : (darkMode ? "#78350f" : "#fef3c7"),

      color: item.is_booked
        ? (darkMode ? "#bbf7d0" : "#166534")
        : (darkMode ? "#fde68a" : "#92400e"),
    }}
  >
    {item.is_booked ? "✓ Réservé" : "⚠ À réserver"}
  </span>
</div>
                      </div>
                    </div>

                    {item.event_time && (
                      <div
                        style={{
                          marginTop: "8px",
                          color: theme.muted,
                          fontSize: "15px",
                          fontWeight: "500",
                        }}
                      >
                        🕒 {item.event_time}
                      </div>
                    )}

                    {item.address && (
                      <div
                        style={{
                          marginTop: "12px",
                          color: theme.muted,
                          fontSize: "15px",
                          lineHeight: "1.5",
                        }}
                      >
                        📍 {item.address}
                      </div>
                    )}

                    {item.notes && (
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        style={{
                          marginTop: "12px",
                          border: "none",
                          background: theme.button,
                          borderRadius: "12px",
                          padding: "10px 14px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "400",
                          color: theme.text,
                        }}
                      >
                        {expandedItems[item.id]
                          ? "▲ Réduire"
                          : "▼ Plus d'informations"}
                      </button>
                    )}

                    {expandedItems[item.id] && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "14px",
                          borderRadius: "12px",
                          background: theme.softCard,
                          lineHeight: "1.6",
                          color: theme.text,
                        }}
                      >
                        {item.notes && (
                          <div style={{ marginBottom: itemMedia.length ? "14px" : 0 }}>
                            {item.notes}
                          </div>
                        )}

                        {itemMedia.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              flexWrap: "wrap",
                              marginTop: "12px",
                            }}
                          >
                            {itemMedia.map((img) => {
                              const imageUrl = getPublicImageUrl(img.image_path)

                              return (
                                <img
                                  key={img.id}
                                  src={imageUrl}
                                  alt=""
                                  onClick={() => {
                                    setGalleryImages(
                                      itemMedia.map((m) =>
                                        getPublicImageUrl(m.image_path)
                                      )
                                    )

                                    setGalleryIndex(
                                      itemMedia.findIndex((m) => m.id === img.id)
                                    )
                                  }}
                                  style={{
                                    width: "90px",
                                    height: "90px",
                                    borderRadius: "12px",
                                    border: `2px solid ${theme.border}`,
                                    objectFit: "cover",
                                    cursor: "pointer",
                                  }}
                                />
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}



                    

                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        overflowX: "auto",
                        paddingBottom: "6px",
                        marginTop: "12px",
                      }}
                    >
                      {item.maps_url && (
                        <a
                          href={getMapsHref(item.maps_url)}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            flex: 1,
                            minHeight: "48px",
                            borderRadius: "999px",
                            background: theme.button,
                            color: theme.text,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            textDecoration: "none",
                            fontWeight: "600",
                          }}
                        >
                          📍 Itinéraire
                        </a>
                      )}

                      {item.phone && (
                        <a
                          href={`tel:${item.phone}`}
                          style={{
                            minWidth: "48px",
                            minHeight: "48px",
                            borderRadius: "999px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            textDecoration: "none",
                            background: "#ecfdf5",
                          }}
                        >
                          📞
                        </a>
                      )}

                      {item.website && (
                        <a
                          href={item.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            minWidth: "48px",
                            minHeight: "48px",
                            borderRadius: "999px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            textDecoration: "none",
                            background: theme.button,
                          }}
                        >
                          🌐
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          {restaurantItems.length > 0 && (
  <div
    style={{
      marginTop: "40px",
    }}
  >
    <h2
      style={{
        color: theme.text,
        marginBottom: "12px",
      }}
    >
      🍴 Restaurants
    </h2>

    <div
      style={{
        background: theme.card,
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        borderLeft: `6px solid ${getCategoryColor("restaurant")}`,
      }}
    >
      {restaurantItems.map((item, index) => (
        <div
          key={item.id}
          style={{
            padding: "16px",
            borderBottom:
              index < restaurantItems.length - 1
                ? `1px solid ${theme.border}`
                : "none",
          }}
        >
          <div
            style={{
              fontWeight: "700",
              fontSize: "18px",
              color: theme.text,
            }}
          >
            🍴 {item.title}
            <div
  style={{
    marginTop: "8px",
  }}
>
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "6px 12px",
      borderRadius: "999px",
      fontSize: "13px",
      fontWeight: "600",

      background: item.is_booked
        ? (darkMode ? "#064e3b" : "#dcfce7")
        : (darkMode ? "#78350f" : "#fef3c7"),

      color: item.is_booked
        ? (darkMode ? "#bbf7d0" : "#166534")
        : (darkMode ? "#fde68a" : "#92400e"),
    }}
  >
    {item.is_booked
      ? "✓ Réservé"
      : "⚠ À réserver"}
  </span>
</div>
          </div>

          {item.event_time && (
            <div
              style={{
                marginTop: "4px",
                color: theme.muted,
                fontSize: "14px",
              }}
            >
              🕒 {item.event_time}
            </div>
          )}

          {item.address && (
            <div
              style={{
                marginTop: "4px",
                color: theme.muted,
                fontSize: "14px",
              }}
            >
              📍 {item.address}
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "10px",
            }}
          >
            {item.maps_url && (
              <a
                href={getMapsHref(item.maps_url)}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "8px 12px",
                  borderRadius: "999px",
                  background: theme.button,
                  color: theme.text,
                  textDecoration: "none",
                  fontSize: "14px",
                }}
              >
                📍 Itinéraire
              </a>
            )}

            {item.phone && (
              <a
                href={`tel:${item.phone}`}
                style={{
                  padding: "8px 12px",
                  borderRadius: "999px",
                  background: "#ecfdf5",
                  textDecoration: "none",
                }}
              >
                📞
              </a>
            )}

            {item.website && (
              <a
                href={item.website}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "8px 12px",
                  borderRadius: "999px",
                  background: theme.button,
                  textDecoration: "none",
                }}
              >
                🌐
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
        </div>
      )}

      {galleryImages.length > 0 && (
          <div
            onClick={() => {
              setGalleryImages([])
              setGalleryIndex(0)
            }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.95)",
              zIndex: 9999,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "20px",
            }}
          >
            {/* Bouton fermer */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setGalleryImages([])
                setGalleryIndex(0)
              }}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                width: "48px",
                height: "48px",
                borderRadius: "999px",
                border: "none",
                background: "rgba(255,255,255,0.2)",
                color: "white",
                fontSize: "24px",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            {/* Flèche gauche */}
            {galleryImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()

                  setGalleryIndex((prev) =>
                    prev === 0
                      ? galleryImages.length - 1
                      : prev - 1
                  )
                }}
                style={{
                  position: "absolute",
                  left: "20px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "52px",
                  height: "52px",
                  borderRadius: "999px",
                  border: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                ◀
              </button>
            )}

            {/* Image */}
            <img
  src={galleryImages[galleryIndex]}
  alt=""
  onTouchStart={(e) => {
    setTouchStartX(
      e.touches[0].clientX
    )
  }}
  onTouchEnd={(e) => {
    if (touchStartX === null) return

    const endX =
      e.changedTouches[0].clientX

    const delta =
      touchStartX - endX

    if (
      delta > 50 &&
      galleryImages.length > 1
    ) {
      setGalleryIndex((prev) =>
        prev === galleryImages.length - 1
          ? 0
          : prev + 1
      )
    }

    if (
      delta < -50 &&
      galleryImages.length > 1
    ) {
      setGalleryIndex((prev) =>
        prev === 0
          ? galleryImages.length - 1
          : prev - 1
      )
    }
  }}
              
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                borderRadius: "12px",
              }}
            />

            {/* Compteur */}
            {galleryImages.length > 1 && (
              <div
                style={{
                  position: "absolute",
                  bottom: "20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  color: "white",
                  fontWeight: "600",
                  background: "rgba(0,0,0,0.4)",
                  padding: "8px 14px",
                  borderRadius: "999px",
                }}
              >
                {galleryIndex + 1} / {galleryImages.length}
              </div>
            )}

            {/* Flèche droite */}
            {galleryImages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()

                  setGalleryIndex((prev) =>
                    prev === galleryImages.length - 1
                      ? 0
                      : prev + 1
                  )
                }}
                style={{
                  position: "absolute",
                  right: "20px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "52px",
                  height: "52px",
                  borderRadius: "999px",
                  border: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                ▶
              </button>
            )}
          </div>

      )}
       
              {!isOnline && (
      <div
        style={{
          position: "fixed",
          top: "12px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1200,
          padding: "10px 16px",
          borderRadius: "999px",
          background: "#f59e0b",
          color: "white",
          fontWeight: "700",
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        }}
      >
        Mode hors ligne
      </div>
    )}
    </div>

  )
}
