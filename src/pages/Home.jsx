import MediaUploader from "../components/MediaUploader"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"

const jours = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"]

export default function Home() {
  const [trip, setTrip] = useState(null)
  const [days, setDays] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [programItems, setProgramItems] = useState([])
  const [media, setMedia] = useState([])
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [viewerMode, setViewerMode] = useState(false)
  const [expandedItems, setExpandedItems] = useState({})
  const [fullscreenImage, setFullscreenImage] =
  useState(null)
  const [allItems, setAllItems] =
  useState([])
  const toBook = allItems.filter(
  (item) => !item.is_booked
)
const isAdmin =
  userEmail === "ophelie.caquelin@gmail.com" &&
  !viewerMode

  const navigate = useNavigate()

  useEffect(() => {
    init()
  }, [])
useEffect(() => {
  if (
  selectedDay &&
  selectedDay !== "preparation"
) {
    loadProgramItems(selectedDay.id)
    loadMedia(selectedDay.id)

    loadWeather(
      selectedDay.weather_location,
      selectedDay.day_date
    )
  }
}, [selectedDay])
async function loadAllItems() {
  const { data } = await supabase
    .from("program_items")
    .select(`
      *,
      days (
        day_number
      )
    `)

  setAllItems(data || [])
}
  async function init() {
  
    const { data: auth } = await supabase.auth.getUser()
    
    setUserEmail(auth.user?.email || "")

    if (!auth.user) {
      navigate("/login")
      return
    }
    await loadAllItems()
    const result = await supabase
     .from("trip")
     .select("*")

   

    const tripData = result.data?.[0]
    setTrip(tripData)



    const { data: daysData } = await supabase
      .from("days")
      .select("*")
      .order("day_number")

    setDays(daysData || [])

    if (daysData?.length) {
      setSelectedDay(getDefaultDay(daysData))
    }
  }
async function loadProgramItems(dayId) {
  const { data, error } = await supabase
    .from("program_items")
    .select("*")
    .eq("day_id", dayId)
    .order("sort_order")

  if (error) {
    console.error(error)
    return
  }

  setProgramItems(data || [])
}
async function loadMedia(dayId) {
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .eq("day_id", dayId)

  if (error) {
    console.error(error)
    return
  }

  setMedia(data || [])
}
async function loadWeather(location, dayDate) {
  if (!location || !dayDate) return

  setWeatherLoading(true)

  try {
    // Recherche des coordonnées
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

    // Prévisions météo
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&daily=weathercode,temperature_2m_max,precipitation_probability_max,windspeed_10m_max&timezone=Europe%2FParis&start_date=${dayDate}&end_date=${dayDate}`
    )

    const weatherData = await weatherResponse.json()

    setWeather({
      location: place.name,
      temperature:
        weatherData.daily.temperature_2m_max?.[0],
      rain:
        weatherData.daily
          .precipitation_probability_max?.[0],
      wind:
        weatherData.daily.windspeed_10m_max?.[0],
      code:
        weatherData.daily.weathercode?.[0],
    })
  } catch (error) {
    console.error(error)
    setWeather(null)
  } finally {
    setWeatherLoading(false)
  }
}
function getWeatherLabel(code) {
  const labels = {
    0: "Ensoleillé",
    1: "Principalement ensoleillé",
    2: "Partiellement nuageux",
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

async function toggleBooked(item) {
  const { error } = await supabase
    .from("program_items")
    .update({
      is_booked: !item.is_booked,
    })
    .eq("id", item.id)

  if (error) {
    console.error(error)
    return
  }

  loadProgramItems(selectedDay.id)
        if (selectedDay === "preparation") {
        loadAllItems()
        }
}
async function deleteMedia(mediaItem) {
  const confirmed = window.confirm(
    "Supprimer cette image ?"
  )

  if (!confirmed) return

  const { error: storageError } =
    await supabase.storage
      .from("voyage-images")
      .remove([mediaItem.image_path])

  if (storageError) {
    console.error(storageError)
    alert("Erreur suppression fichier")
    return
  }

  const { error: dbError } =
    await supabase
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

    const found = daysData.find((d) => {
      const date = new Date(d.day_date)
      return date.toDateString() === today.toDateString()
    })

    return found || daysData[0]
  }

  function label(day) {
    const date = new Date(day.day_date)

    return `J${day.day_number} • ${
      jours[date.getDay()]
    } ${date.getDate()}`
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
function toggleExpanded(itemId) {
  setExpandedItems((prev) => ({
    ...prev,
    [itemId]: !prev[itemId],
  }))
}
const hotelOfDay = programItems.find(
  (item) => item.category === "hotel"
)
const hotelMedia = hotelOfDay
  ? media.filter(
      (m) => m.program_item_id === hotelOfDay.id
    )
  : []

const hotelImage =
  hotelMedia.length > 0
    ? supabase.storage
        .from("voyage-images")
        .getPublicUrl(
          hotelMedia[0].image_path
        ).data.publicUrl
    : null
  return (
    <div style={{ padding: 20 }}>
      <h1
        style={{
            fontSize: "36px",
            textAlign: "center",
            marginBottom: "30px",
        }}
        >
        {trip?.name}
        </h1>
    {trip && (
  <p
    style={{
      textAlign: "center",
      color: "#6b7280",
      marginTop: "-20px",
      marginBottom: "30px",
      fontSize: "18px",
    }}
  >
    13 → 27 juin 2026 • 15 jours
  </p>

)}

    <div
    style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        marginBottom: 24,
        paddingBottom: 4,
        whiteSpace: "nowrap",
    }}
    >   
        {days.map((day) => (
          <button
            key={day.id}
            onClick={() => setSelectedDay(day)}
            style={{
                padding: "10px 16px",
                borderRadius: 12,
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 600,
                whiteSpace: "nowrap",

                border:
                    selectedDay?.id === day.id
                    ? "1px solid #2563eb"
                    : "1px solid #d1d5db",

                background:
                    selectedDay?.id === day.id
                    ? "#2563eb"
                    : "#ffffff",

                color:
                    selectedDay?.id === day.id
                    ? "#ffffff"
                    : "#111827",
                }}
          >
            {label(day)}
          </button>
        ))}
        <button
        onClick={() => setSelectedDay("preparation")}
        style={{
            padding: "10px 16px",
            borderRadius: 12,
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 600,
            whiteSpace: "nowrap",

            border:
            selectedDay === "preparation"
                ? "1px solid #2563eb"
                : "1px solid #d1d5db",

            background:
            selectedDay === "preparation"
                ? "#2563eb"
                : "#ffffff",

            color:
            selectedDay === "preparation"
                ? "#ffffff"
                : "#111827",
        }}
        >
        📋 Préparation
        </button>
      </div>
            {selectedDay === "preparation" && (
            <div>

                <h2
                style={{
                    textAlign: "center",
                    marginBottom: "30px",
                }}
                >
                📋 A réserver
                </h2>

                <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                    "repeat(auto-fit, minmax(350px, 1fr))",
                    gap: "16px",
                }}
                >

                {days.map((day) => {
                    const dayItems = allItems.filter(
                    (item) =>
                      item.day_id === day.id &&
                      !item.is_booked
                  )

                    if (dayItems.length === 0)
                    return null
                    
                    return (
                    <div
                        key={day.id}
                        style={{
                        border:
                            "1px solid #e5e7eb",
                        borderRadius: "12px",
                        padding: "16px",
                        background: "white",
                        }}
                    >
                        <h3
                        style={{
                            marginTop: 0,
                        }}
                        >
                        Jour {day.day_number}
                        </h3>

                        <div
                        style={{
                            color: "#6b7280",
                            fontSize: "14px",
                            marginBottom: "12px",
                        }}
                        >
                        {dayItems.length} réservation(s)
                        à effectuer
                        </div>

                        {dayItems.map((item) => (
                        <div
                            key={item.id}
                            style={{
                            padding: "8px 0",
                            borderTop:
                                "1px solid #f3f4f6",
                            }}
                        >
                            <div
                            style={{
                                fontWeight: "600",
                            }}
                            >
                            {getCategoryIcon(
                                item.category
                            )}{" "}
                            {item.title}
                            </div>

                           
                            <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: "20px",
                                marginTop: "12px",
                            }}
                            >

                            <button
                                onClick={() =>
                                toggleBooked(item)
                                }
                                style={{
                                border: "none",
                                background:
                                    "transparent",
                                cursor: "pointer",
                                fontWeight: "bold",
                                color:
                                    item.is_booked
                                    ? "#059669"
                                    : "#d97706",
                                }}
                            >
                                {item.is_booked
                                ? "✓ Réservé"
                                : "⚠ À réserver"}
                            </button>

                            

                            </div>
                        </div>
                        ))}
                    </div>
                    )
                })}
                </div>
                {userEmail ===
                  "ophelie.caquelin@gmail.com" && (
                  <div
                    style={{
                      marginTop: "40px",
                      textAlign: "center",
                      paddingTop: "20px",
                      borderTop: "1px solid #e5e7eb",
                    }}
                  >
                    <button
                      onClick={() =>
                        setViewerMode(!viewerMode)
                      }
                      style={{
                        padding: "10px 20px",
                        borderRadius: "999px",
                        border: "1px solid #d1d5db",
                        background: viewerMode
                          ? "#f59e0b"
                          : "#2563eb",
                        color: "white",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      {viewerMode
                        ? "👀 Mode visiteur"
                        : "👩 Mode admin"}
                    </button>
                  </div>
                )}
            </div>
            )}
                {selectedDay &&
                selectedDay !== "preparation" && (
                    <div>
                        <h2
                        style={{
                            textAlign: "center",
                            fontSize: "42px",
                            marginBottom: 8,
                        }}
                        >
                        Jour {selectedDay.day_number}
                        </h2>

            <p
            style={{
                textAlign: "center",
                color: "#6b7280",
                marginBottom: 32,
            }}
            >
            {new Date(selectedDay.day_date).toLocaleDateString(
                "fr-FR",
                {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                }
            )}
            </p>

            <h1
            style={{
                textAlign: "center",
                fontSize: "36px",
                marginBottom: "16px",
            }}
            >
            {selectedDay.title}
            </h1>
                {selectedDay.route_url && (
                <a
                    href={selectedDay.route_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                    display: "inline-block",
                    marginTop: "15px",
                    padding: "10px 18px",
                    background: "#2563eb",
                    color: "white",
                    borderRadius: "999px",
                    textDecoration: "none",
                    fontWeight: "bold",
                    marginBottom: "10px",
                    }}
                >
                    🗺️ Itinéraire du jour
                </a>
                )}
            <h3
            style={{
                textAlign: "center",
                color: "#6b7280",
                fontSize: "28px",
                marginTop: 0,
                marginBottom: 40,
            }}
            >
            {selectedDay.subtitle}
            </h3>
            {weatherLoading ? (
            <div
                style={{
                textAlign: "center",
                margin: "20px 0",
                }}
            >
                Chargement météo...
            </div>
            ) : weather ? (
            <div
                style={{
                maxWidth: "420px",
                margin: "20px auto",
                padding: "16px",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                textAlign: "center",
                background: "#f9fafb",
                }}
            >
                <div
                style={{
                    fontWeight: "bold",
                    marginBottom: "8px",
                }}
                >
                ☀️ Météo prévue à {weather.location}
                </div>

                <div
                style={{
                    fontSize: "20px",
                    marginBottom: "8px",
                }}
                >
                {weather.temperature}°C •{" "}
                {getWeatherLabel(weather.code)}
                </div>

                <div>
                💨 Vent : {weather.wind} km/h
                </div>

                <div>
                🌧️ Pluie : {weather.rain} %
                </div>
            </div>
            ) : null}


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
            {hotelOfDay && (
              <div
                style={{
                  maxWidth: "700px",
                  margin: "20px auto 40px auto",
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "20px",
                  boxShadow:
                    "0 2px 12px rgba(0,0,0,0.08)",
                }}
              >
                {hotelImage && (
                  <img
                    src={hotelImage}
                    alt=""
                    onClick={() =>
                      setFullscreenImage(hotelImage)
                    }
                    style={{
                      width: "100%",
                      height: "220px",
                      objectFit: "cover",
                      borderRadius: "12px",
                      marginBottom: "16px",
                      cursor: "pointer",
                    }}
                  />
                )}
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
                  {hotelOfDay.hotel_address && (
                    <div
                      style={{
                        marginTop: "8px",
                        color: "#6b7280",
                        fontSize: "15px",
                      }}
                    >
                      📍 {hotelOfDay.address}
                    </div>
                  )}
                </div>

                {hotelOfDay.event_time && (
                  <div
                    style={{
                      marginTop: "8px",
                      color: "#6b7280",
                    }}
                  >
                    🕒 {hotelOfDay.event_time}
                  </div>
                )}

              {hotelOfDay.notes && (
                <>
                  <button
                    onClick={() =>
                      toggleExpanded(
                        `hotel-${hotelOfDay.id}`
                      )
                    }
                    style={{
                      marginTop: "16px",
                      border: "none",
                      background: "#f3f4f6",
                      borderRadius: "12px",
                      padding: "10px 14px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                    }}
                  >
                    {expandedItems[
                      `hotel-${hotelOfDay.id}`
                    ]
                      ? "▲ Réduire"
                      : "▼ Informations hôtel"}
                  </button>

                  {expandedItems[
                    `hotel-${hotelOfDay.id}`
                  ] && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "14px",
                        borderRadius: "12px",
                        background: "#f9fafb",
                        lineHeight: "1.6",
                      }}
                    >
                      {hotelOfDay.notes}
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
                {hotelOfDay.maps_url && (
                  <a
                    href={hotelOfDay.maps_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "12px 18px",
                      background: "#2563eb",
                      color: "white",
                      borderRadius: "999px",
                      textDecoration: "none",
                      fontWeight: "600",
                    }}
                  >
                    📍 Itinéraire
                  </a>
                )}

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
            <hr style={{ margin: "40px 0" }} />

            <h2>🎯 Programme</h2>

            <p
              style={{
                color: "#6b7280",
                marginBottom: "20px",
              }}
            >
              {programItems.length} activité(s)
            </p>

            {programItems.length === 0 ? (
            <p>Aucune activité pour le moment</p>
            ) : (
            programItems.map((item) => {
            const itemMedia = media.filter(
                (m) => m.program_item_id === item.id
            )
            const firstImage =
            itemMedia.length > 0
              ? supabase.storage
                  .from("voyage-images")
                  .getPublicUrl(
                    itemMedia[0].image_path
                  ).data.publicUrl
              : null
            
            return (
              <div
                key={item.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow:
                    "0 2px 12px rgba(0,0,0,0.08)",
                  marginBottom: "20px",
                }}
              >
              {firstImage && (
                <div
                  style={{
                    position: "relative",
                  }}
                >
                  <img
                    src={firstImage}
                    alt=""
                    onClick={() =>
                      setFullscreenImage(firstImage)
                    }
                    style={{
                      width: "100%",
                      height: "220px",
                      objectFit: "cover",
                      cursor: "pointer",
                    }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: item.is_booked
                        ? "#059669"
                        : "#d97706",
                      color: "white",
                      padding: "6px 12px",
                      borderRadius: "999px",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    {item.is_booked
                      ? "✓ Réservé"
                      : "⚠ À réserver"}
                  </div>
                </div>
              )}
                
                      <div
                      style={{
                        padding: "16px",
                      }}
                    >
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
                          lineHeight: 1.3,
                        }}
                      >
                        {getCategoryIcon(item.category)} {item.title}
                      </div>

                      <div
                          style={{
                          marginTop: "6px",
                          fontSize: "14px",
                          fontWeight: "bold",
                          textAlign: "left",
                          }}
                      >
                      <div style={{ marginTop: "6px" }}>
                      {isAdmin ? (
                          <button
                          onClick={() => toggleBooked(item)}
                          style={{
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              padding: 0,
                              fontSize: "14px",
                              fontWeight: "bold",
                              color: item.is_booked
                              ? "#059669"
                              : "#d97706",
                          }}
                          >
                          {item.is_booked
                              ? "✓ Réservé"
                              : "⚠ À réserver"}
                          </button>
                      ) : (
                          <span
                          style={{
                              color: item.is_booked
                              ? "#059669"
                              : "#d97706",
                          }}
                          >
                          {item.is_booked
                              ? "✓ Réservé"
                              : "⚠ À réserver"}
                          </span>
                      )}
                      </div>
                      </div>
  
                  </div>  
                </div>

                  {item.event_time && (
                    <div
                      style={{
                        marginTop: "8px",
                        color: "#6b7280",
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
                      color: "#6b7280",
                      fontSize: "15px",
                      lineHeight: "1.5",
                    }}
                  >
                    📍 {item.address}
                  </div>
                )}

                {item.notes && (
                  <button
                    onClick={() =>
                      toggleExpanded(item.id)
                    }
                    style={{
                      marginTop: "12px",
                      border: "none",
                      background: "#f3f4f6",
                      borderRadius: "12px",
                      padding: "10px 14px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    {expandedItems[item.id]
                      ? "▲ Réduire"
                      : "▼ Plus d'informations"}
                  </button>
                )}
                {expandedItems[item.id] &&
                  item.notes && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "14px",
                        borderRadius: "12px",
                        background: "#f9fafb",
                        lineHeight: "1.6",
                        color: "#374151",
                      }}
                    >
                      {item.notes}
                    </div>
                  )}
                <div
                style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    marginTop: "12px",
                }}
                >
                {itemMedia.map((img) => {
                    const imageUrl =
                    supabase.storage
                        .from("voyage-images")
                        .getPublicUrl(img.image_path)
                        .data.publicUrl

                    return (
                    <div
                        key={img.id}
                        style={{
                        position: "relative",
                        }}
                    >
                        <img
                        src={imageUrl}
                        alt=""
                        onClick={() =>
                          setFullscreenImage(imageUrl)
                        }
                        style={{
                            width: "140px",
                            height: "100px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            cursor: "pointer",
                        }}
                        />

                        {isAdmin && (
                        <button
                            onClick={() =>
                            deleteMedia(img)
                            }
                            style={{
                            position: "absolute",
                            top: "-8px",
                            right: "-8px",
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            border: "none",
                            cursor: "pointer",
                            background: "#dc2626",
                            color: "white",
                            fontWeight: "bold",
                            }}
                        >
                            ×
                        </button>
                        )}
                    </div>
                    
                    )
                })}
                </div>

                {isAdmin && (
                <MediaUploader
                    dayId={selectedDay.id}
                    programItemId={item.id}
                    onUploadSuccess={() =>
                    loadMedia(selectedDay.id)
                    }
                />
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
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.maps_url)}`}
                    target="_blank"
                    rel="noreferrer"
                   style={{
                        flex: 1,
                        minHeight: "48px",
                        borderRadius: "999px",
                        background: "#2563eb",
                        color: "white",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        textDecoration: "none",
                        fontWeight: "600",
                      }}
                    >
                    📍 Ouvrir l'itinéraire
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
                        background: "#f3f4f6",
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



        </div>
      )}
      {fullscreenImage && (
  <div
    onClick={() =>
      setFullscreenImage(null)
    }
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
    <button
      onClick={() =>
        setFullscreenImage(null)
      }
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

    <img
      src={fullscreenImage}
      alt=""
      style={{
        maxWidth: "100%",
        maxHeight: "100%",
        objectFit: "contain",
        borderRadius: "12px",
      }}
    />
  </div>
)}
    </div>
  )
}
