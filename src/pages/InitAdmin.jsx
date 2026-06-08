import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { useRef } from "react"


const emptyDay = {
  day_number: "",
  day_date: "",
  title: "",
  subtitle: "",
  summary: "",
  weather_location: "",
  weather_note: "",
  route_url: "",
  bag_checklist: "",
}

const emptyItem = {
  category: "visite",
  title: "",
  event_time: "",
  price: "",
  phone: "",
  website: "",
  address: "",
  maps_url: "",
  notes: "",
  is_booked: false,
  is_optional: false,
  sort_order: "",
}

const emptyMediaForm = {
  program_item_id: "",
  title: "",
  media_type: "screenshot",
}

const categories = [
  "transport",
  "visite",
  "restaurant",
  "hotel",
  "bateau",
  "photo",
  "todo",
]

export default function InitAdmin() {
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [message, setMessage] = useState("")

  const [trip, setTrip] = useState(null)
  const [days, setDays] = useState([])
  const [selectedDayId, setSelectedDayId] = useState("")
  const [dayForm, setDayForm] = useState(emptyDay)
  const [itemForm, setItemForm] = useState(emptyItem)
  const [mediaForm, setMediaForm] = useState(emptyMediaForm)
  const [programItems, setProgramItems] = useState([])
  const [mediaItems, setMediaItems] = useState([])
  const anecdoteFormRef = useRef(null)
  
  const [editingItemId, setEditingItemId] = useState(null)
  const [anecdotes, setAnecdotes] = useState([])

  const [anecdoteForm, setAnecdoteForm] = useState({
    title: "",
    content: "",
    sort_order: "",
  })
  
  const [editingAnecdoteId, setEditingAnecdoteId] = useState(null)
  const programFormRef = useRef(null)
 
  const selectedDay = days.find((day) => day.id === selectedDayId)

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    if (!selectedDayId) {
      setProgramItems([])
      setMediaItems([])
      return
    }

    loadProgramItems(selectedDayId)
    loadAnecdotes(selectedDayId)
    loadMediaItems(selectedDayId)
  }, [selectedDayId])

  async function init() {
  const { data: tripData } = await supabase
    .from("trip")
    .select("*")

  const currentTrip = tripData?.[0] || null

  setTrip(currentTrip)

  await loadDays()

  setLoading(false)
}
  function editAnecdote(anecdote) {
  setEditingAnecdoteId(anecdote.id)

    

  setAnecdoteForm({
    title: anecdote.title || "",
    content: anecdote.content || "",
    sort_order: anecdote.sort_order || "",
  })

  anecdoteFormRef.current?.scrollIntoView({
  behavior: "smooth",
  block: "start",
})
}
  async function saveAnecdote(event) {
  event.preventDefault()

  if (!selectedDayId) {
    setMessage("Sélectionne un jour.")
    return
  }

  const payload = {
    day_id: selectedDayId,
    title: anecdoteForm.title,
    content: anecdoteForm.content,
    sort_order:
      anecdoteForm.sort_order === ""
        ? 0
        : Number(anecdoteForm.sort_order),
  }

  let error

  if (editingAnecdoteId) {
    const result = await supabase
      .from("anecdotes")
      .update(payload)
      .eq("id", editingAnecdoteId)

    error = result.error
  } else {
    const result = await supabase
      .from("anecdotes")
      .insert(payload)

    error = result.error
  }

  if (error) {
    console.error(error)
    setMessage("Erreur sauvegarde anecdote.")
    return
  }

  setAnecdoteForm({
    title: "",
    content: "",
    sort_order: "",
  })

  setEditingAnecdoteId(null)

  await loadAnecdotes(selectedDayId)

  setMessage(
    editingAnecdoteId
      ? "Anecdote modifiée."
      : "Anecdote ajoutée."
  )
}
  async function deleteAnecdote(id) {
  const confirmed = window.confirm(
    "Supprimer cette anecdote ?"
  )

  if (!confirmed) return

  const { error } = await supabase
    .from("anecdotes")
    .delete()
    .eq("id", id)

  if (error) {
    console.error(error)
    setMessage("Erreur suppression anecdote.")
    return
  }

  await loadAnecdotes(selectedDayId)

  setMessage("Anecdote supprimée.")
}
  async function loadDays() {
    const { data, error } = await supabase
      .from("days")
      .select("*")
      .order("day_number")

    if (error) {
      console.error(error)
      setMessage("Erreur chargement des jours.")
      return
    }

    setDays(data || [])
  }

  async function loadProgramItems(dayId) {
    const { data, error } = await supabase
      .from("program_items")
      .select("*")
      .eq("day_id", dayId)
      .order("sort_order")

    if (error) {
      console.error(error)
      setMessage("Erreur chargement du programme.")
      return
    }

    setProgramItems(data || [])
  }
  async function loadAnecdotes(dayId) {
    const { data, error } = await supabase
      .from("anecdotes")
      .select("*")
      .eq("day_id", dayId)
      .order("sort_order")
  
    if (error) {
      console.error(error)
      setMessage("Erreur chargement anecdotes.")
      return
    }
  
    setAnecdotes(data || [])
  }
  async function loadMediaItems(dayId) {
    const { data, error } = await supabase
      .from("media")
      .select(
        `
        *,
        program_items (
          title
        )
      `
      )
      .eq("day_id", dayId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(error)
      setMessage("Erreur chargement des images.")
      return
    }

    setMediaItems(data || [])
  }

  function selectExistingDay(dayId) {
    const day = days.find((item) => item.id === dayId)

    setSelectedDayId(dayId)
    setDayForm(day || emptyDay)
    setItemForm(emptyItem)
    setMediaForm(emptyMediaForm)
    setEditingItemId(null)
    setEditingAnecdoteId(null)
    setMessage("")
  }

  function startNewDay() {
    setSelectedDayId("")
    setDayForm(emptyDay)
    setProgramItems([])
    setMediaItems([])
    setAnecdotes([])
    setItemForm(emptyItem)
    setMediaForm(emptyMediaForm)
    setMessage("")
  }

  function updateDayField(field, value) {
    setDayForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateItemField(field, value) {
    setItemForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateMediaField(field, value) {
    setMediaForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function saveDay(event) {
    event.preventDefault()

    if (!trip?.id) {
      setMessage("Aucun voyage trouvé dans la table trip.")
      return
    }

    setSaving(true)
    setMessage("")

    const payload = {
      trip_id: trip.id,
      day_number: Number(dayForm.day_number),
      day_date: dayForm.day_date || null,
      title: dayForm.title,
      subtitle: dayForm.subtitle,
      summary: dayForm.summary,
      weather_location: dayForm.weather_location,
      weather_note: dayForm.weather_note,
      route_url: dayForm.route_url,
      bag_checklist: dayForm.bag_checklist,
    }

    const request = selectedDayId
      ? supabase.from("days").update(payload).eq("id", selectedDayId).select()
      : supabase.from("days").insert(payload).select()

    const { data, error } = await request.single()

    setSaving(false)

    if (error) {
      console.error(error)
      setMessage("Erreur sauvegarde du jour.")
      return
    }

    await loadDays()
    setSelectedDayId(data.id)
    setDayForm(data)
    setMessage("Jour sauvegardé.")
  }
  function editProgramItem(item) {
    setEditingItemId(item.id)
  
    setItemForm({
      category: item.category || "visite",
      title: item.title || "",
      event_time: item.event_time || "",
      price: item.price || "",
      phone: item.phone || "",
      website: item.website || "",
      address: item.address || "",
      maps_url: item.maps_url || "",
      notes: item.notes || "",
      is_booked: item.is_booked || false,
      is_optional: item.is_optional || false,
      sort_order: item.sort_order || "",
    })
  
   programFormRef.current?.scrollIntoView({
  behavior: "smooth",
  block: "start",
})
  }
  async function addProgramItem(event) {
    event.preventDefault()

    if (!selectedDayId) {
      setMessage("Sauvegarde ou sélectionne d'abord un jour.")
      return
    }

    setSaving(true)
    setMessage("")

    const payload = {
      day_id: selectedDayId,
      category: itemForm.category,
      title: itemForm.title,
      event_time: itemForm.event_time,
      price: itemForm.price,
      phone: itemForm.phone,
      website: itemForm.website,
      address: itemForm.address,
      maps_url: itemForm.maps_url,
      notes: itemForm.notes,
      is_booked: itemForm.is_booked,
      is_optional: itemForm.is_optional,
      sort_order: itemForm.sort_order === "" ? 0 : Number(itemForm.sort_order),
    }

    let error

    if (editingItemId) {
      const result = await supabase
        .from("program_items")
        .update(payload)
        .eq("id", editingItemId)
    
      error = result.error
    } else {
      const result = await supabase
        .from("program_items")
        .insert(payload)
    
      error = result.error
    }

    setSaving(false)

    if (error) {
      console.error(error)
      setMessage("Erreur ajout programme.")
      return
    }

    setItemForm(emptyItem)
    setEditingItemId(null)
    await loadProgramItems(selectedDayId)
    setMessage(
  editingItemId
    ? "Élément modifié."
    : "Élément ajouté au programme."
)
  }
async function moveProgramItem(itemId, direction) {
  const currentIndex = programItems.findIndex(
    (item) => item.id === itemId
  )

  if (currentIndex === -1) return

  const targetIndex =
    direction === "up"
      ? currentIndex - 1
      : currentIndex + 1

  if (
    targetIndex < 0 ||
    targetIndex >= programItems.length
  ) {
    return
  }

  const currentItem = programItems[currentIndex]
  const targetItem = programItems[targetIndex]

  const currentOrder = currentItem.sort_order
  const targetOrder = targetItem.sort_order

  const { error: error1 } = await supabase
    .from("program_items")
    .update({ sort_order: targetOrder })
    .eq("id", currentItem.id)

  if (error1) {
    console.error(error1)
    return
  }

  const { error: error2 } = await supabase
    .from("program_items")
    .update({ sort_order: currentOrder })
    .eq("id", targetItem.id)

  if (error2) {
    console.error(error2)
    return
  }

  await loadProgramItems(selectedDayId)
}
  async function deleteProgramItem(itemId) {
    const confirmed = window.confirm("Supprimer cet élément du programme ?")
    if (!confirmed) return

    const { error } = await supabase
      .from("program_items")
      .delete()
      .eq("id", itemId)

    if (error) {
      console.error(error)
      setMessage("Erreur suppression programme.")
      return
    }

    await loadProgramItems(selectedDayId)
    setMessage("Élément supprimé.")
  }

  function getPublicImageUrl(imagePath) {
    return supabase.storage.from("voyage-images").getPublicUrl(imagePath).data
      .publicUrl
  }

  function compressImage(file, maxWidth = 1600, quality = 0.78) {
    return new Promise((resolve, reject) => {
      const image = new Image()
      const reader = new FileReader()

      reader.onload = () => {
        image.src = reader.result
      }

      reader.onerror = reject

      image.onload = () => {
        const scale = Math.min(1, maxWidth / image.width)
        const width = Math.round(image.width * scale)
        const height = Math.round(image.height * scale)

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        const context = canvas.getContext("2d")
        context.drawImage(image, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Compression impossible"))
              return
            }

            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, ".jpg"),
              {
                type: "image/jpeg",
                lastModified: Date.now(),
              }
            )

            resolve(compressedFile)
          },
          "image/jpeg",
          quality
        )
      }

      image.onerror = reject
      reader.readAsDataURL(file)
    })
  }
async function uploadFile(file) {
  if (!file || !selectedDayId) {
    setMessage("Sélectionne d'abord un jour.")
    return
  }

  setSaving(true)
  setMessage("")

  try {
     const compressedFile = await compressImage(file)
      const safeName = file.name
        .replace(/\.[^.]+$/, ".jpg")
        .replace(/[^a-zA-Z0-9._-]/g, "-")
      const fileName = `${Date.now()}-${safeName}`
      const filePath = `${selectedDayId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("voyage-images")
        .upload(filePath, compressedFile, {
          contentType: "image/jpeg",
        })

      if (uploadError) {
        console.error(uploadError)
        setMessage("Erreur upload image.")
        return
      }

      const { error: insertError } = await supabase.from("media").insert({
        day_id: selectedDayId,
        program_item_id: mediaForm.program_item_id || null,
        title: mediaForm.title || file.name,
        media_type: mediaForm.media_type,
        image_path: filePath,
      })

      if (insertError) {
        console.error(insertError)
        setMessage("Image envoyée, mais erreur en base.")
        return
      }

      setMediaForm(emptyMediaForm)
      await loadMediaItems(selectedDayId)
      setMessage("Image ajoutée.")
    } catch (error) {
      console.error(error)
      setMessage("Erreur préparation image.")
    } finally {
      setSaving(false)
    }
  }

async function uploadMedia(event) {
  const file = event.target.files?.[0]

  if (!file) return

  await uploadFile(file)

  event.target.value = ""
}
async function handlePaste(event) {
  const items = event.clipboardData?.items || []

  for (const item of items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile()

      if (file) {
        await uploadFile(file)
      }

      break
    }
  }
}
  async function handleDrop(event) {
  event.preventDefault()

  setDragActive(false)

  const file = event.dataTransfer.files?.[0]

  if (file) {
    await uploadFile(file)
  }
}
  function handleDragOver(event) {
  event.preventDefault()
  setDragActive(true)
}

function handleDragLeave(event) {
  event.preventDefault()
  setDragActive(false)
}
  async function deleteMedia(mediaItem) {
    const confirmed = window.confirm("Supprimer cette image ?")
    if (!confirmed) return

    const { error: storageError } = await supabase.storage
      .from("voyage-images")
      .remove([mediaItem.image_path])

    if (storageError) {
      console.error(storageError)
      setMessage("Erreur suppression fichier.")
      return
    }

    const { error: dbError } = await supabase
      .from("media")
      .delete()
      .eq("id", mediaItem.id)

    if (dbError) {
      console.error(dbError)
      setMessage("Erreur suppression en base.")
      return
    }

    await loadMediaItems(selectedDayId)
    setMessage("Image supprimée.")
  }

  if (loading) {
    return <div style={styles.page}>Chargement...</div>
  }



  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Initialisation du carnet</h1>
          <p style={styles.subtitle}>
            Page temporaire admin. À supprimer après la saisie.
          </p>
        </div>

        <a href="/" style={styles.homeLink}>
          Retour app
        </a>
      </header>

      {message && <div style={styles.message}>{message}</div>}
      <div style={styles.adminLayout}>
      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>Jours</h2>
          <button type="button" onClick={startNewDay} style={styles.button}>
            Nouveau jour
          </button>
        </div>

        <div style={styles.daysList}>
          {days.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => selectExistingDay(day.id)}
              style={{
                ...styles.dayTab,
                ...(selectedDayId === day.id ? styles.dayTabActive : {}),
              }}
            >
              J{day.day_number} • {day.title || "Sans titre"}
            </button>
          ))}
        </div>
      </section>
        <div style={styles.adminContent}>

<form onSubmit={saveDay} style={styles.panel}>
        <h2 style={styles.panelTitle}>
          {selectedDay ? `Modifier J${selectedDay.day_number}` : "Créer un jour"}
        </h2>

        <div style={styles.grid}>
          <Field
            label="Numéro du jour"
            type="number"
            value={dayForm.day_number}
            onChange={(value) => updateDayField("day_number", value)}
          />
          <Field
            label="Date"
            type="date"
            value={dayForm.day_date}
            onChange={(value) => updateDayField("day_date", value)}
          />
          <Field
            label="Titre"
            value={dayForm.title}
            onChange={(value) => updateDayField("title", value)}
          />
          <Field
            label="Sous-titre"
            value={dayForm.subtitle}
            onChange={(value) => updateDayField("subtitle", value)}
          />
          <Field
            label="Lieu météo"
            value={dayForm.weather_location}
            onChange={(value) => updateDayField("weather_location", value)}
          />
          <Field
            label="Note météo"
            value={dayForm.weather_note}
            onChange={(value) => updateDayField("weather_note", value)}
          />
        </div>

        <Field
          label="Itinéraire Google Maps du jour"
          value={dayForm.route_url}
          onChange={(value) => updateDayField("route_url", value)}
        />
        <TextArea
          label="Résumé du jour"
          value={dayForm.summary}
          onChange={(value) => updateDayField("summary", value)}
        />
        <TextArea
          label="Aujourd'hui dans le sac"
          value={dayForm.bag_checklist}
          onChange={(value) => updateDayField("bag_checklist", value)}
        />

        <button type="submit" disabled={saving} style={styles.primaryButton}>
          {saving ? "Sauvegarde..." : "Sauvegarder le jour"}
        </button>
      </form>

      <form
  ref={programFormRef}
  onSubmit={addProgramItem}
  style={styles.panel}
>
        <h2 style={styles.panelTitle}>Ajouter au programme</h2>

        {!selectedDayId && (
          <p style={styles.help}>Sélectionne ou crée un jour avant d'ajouter le programme.</p>
        )}

        <div style={styles.grid}>
          <label style={styles.label}>
            Catégorie
            <select
              value={itemForm.category}
              onChange={(event) => updateItemField("category", event.target.value)}
              style={styles.input}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <Field
            label="Titre"
            value={itemForm.title}
            onChange={(value) => updateItemField("title", value)}
          />
          <Field
            label="Heure"
            value={itemForm.event_time}
            onChange={(value) => updateItemField("event_time", value)}
          />
          <Field
            label="Prix"
            value={itemForm.price}
            onChange={(value) => updateItemField("price", value)}
          />
          <Field
            label="Téléphone"
            value={itemForm.phone}
            onChange={(value) => updateItemField("phone", value)}
          />
          <Field
            label="Site web"
            value={itemForm.website}
            onChange={(value) => updateItemField("website", value)}
          />
          <Field
            label="Adresse"
            value={itemForm.address}
            onChange={(value) => updateItemField("address", value)}
          />
          <Field
            label="Lien Maps"
            value={itemForm.maps_url}
            onChange={(value) => updateItemField("maps_url", value)}
          />
          <Field
            label="Ordre"
            type="number"
            value={itemForm.sort_order}
            onChange={(value) => updateItemField("sort_order", value)}
          />
        </div>

        <TextArea
          label="Notes"
          value={itemForm.notes}
          onChange={(value) => updateItemField("notes", value)}
        />

        <div style={styles.checks}>
          <label>
            <input
              type="checkbox"
              checked={itemForm.is_booked}
              onChange={(event) => updateItemField("is_booked", event.target.checked)}
            />{" "}
            Réservé
          </label>

          <label>
            <input
              type="checkbox"
              checked={itemForm.is_optional}
              onChange={(event) => updateItemField("is_optional", event.target.checked)}
            />{" "}
            Plan B
          </label>
        </div>

        <button
          type="submit"
          disabled={saving || !selectedDayId}
          style={{
            ...styles.primaryButton,
            background: editingItemId
              ? "#f59e0b"
              : "#2563eb",
          }}
        >
          {editingItemId
            ? "Mettre à jour l'élément"
            : "Ajouter l'élément"}
        </button>
        {editingItemId && (
          <button
            type="button"
            onClick={() => {
              setEditingItemId(null)
              setItemForm(emptyItem)
            }}
            style={{
              ...styles.button,
              width: "100%",
              marginTop: "10px",
            }}
          >
            Annuler la modification
          </button>
        )}
      </form>

      {selectedDayId && (
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Programme déjà saisi</h2>

          {programItems.length === 0 ? (
            <p style={styles.help}>Aucun élément pour ce jour.</p>
          ) : (
            <div style={styles.list}>
              {programItems.map((item) => (
                <div key={item.id} style={styles.listItem}>
                  <div>
                    <strong>{item.title}</strong>
                    <div style={styles.meta}>
                      {item.category} · ordre {item.sort_order}
                      {item.is_optional ? " · Plan B" : ""}
                      {item.is_booked ? " · Réservé" : ""}
                    </div>
                  </div>

                  <div
  style={{
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  }}
>
  <button
    type="button"
    onClick={() =>
      moveProgramItem(item.id, "up")
    }
    style={styles.button}
  >
    ↑
  </button>

  <button
    type="button"
    onClick={() =>
      moveProgramItem(item.id, "down")
    }
    style={styles.button}
  >
    ↓
  </button>

  <button
    type="button"
    onClick={() => editProgramItem(item)}
    style={styles.button}
  >
    Modifier
  </button>

  <button
    type="button"
    onClick={() => deleteProgramItem(item.id)}
    style={styles.dangerButton}
  >
    Supprimer
  </button>
</div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      <section style={styles.panel}>
  <h2 style={styles.panelTitle}>
    💡 Anecdotes
  </h2>

  <form onSubmit={saveAnecdote}>
    <Field
      label="Titre"
      value={anecdoteForm.title}
      onChange={(value) =>
        setAnecdoteForm((current) => ({
          ...current,
          title: value,
        }))
      }
    />

    <TextArea
      label="Contenu"
      value={anecdoteForm.content}
      onChange={(value) =>
        setAnecdoteForm((current) => ({
          ...current,
          content: value,
        }))
      }
    />

    <Field
      label="Ordre"
      type="number"
      value={anecdoteForm.sort_order}
      onChange={(value) =>
        setAnecdoteForm((current) => ({
          ...current,
          sort_order: value,
        }))
      }
    />

    <button
      type="submit"
      style={styles.primaryButton}
    >
      {editingAnecdoteId
        ? "Mettre à jour l'anecdote"
        : "Ajouter l'anecdote"}
    </button>
  </form>

  <div
    style={{
      marginTop: "20px",
      display: "grid",
      gap: "10px",
    }}
  >
    {anecdotes.map((anecdote) => (
      <div
        key={anecdote.id}
        style={styles.listItem}
      >
        <div>
          <strong>{anecdote.title}</strong>

          <div style={styles.meta}>
            ordre {anecdote.sort_order}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
          }}
        >
          <button
            type="button"
            onClick={() =>
              editAnecdote(anecdote)
            }
            style={styles.button}
          >
            Modifier
          </button>

          <button
            type="button"
            onClick={() =>
              deleteAnecdote(anecdote.id)
            }
            style={styles.dangerButton}
          >
            Supprimer
          </button>
        </div>
      </div>
    ))}
  </div>
</section>
      {selectedDayId && (
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>Photos et captures</h2>

          <p style={styles.help}>
            Ajoute une image au jour sélectionné, ou rattache-la à une activité
            précise.
          </p>

          <div style={styles.grid}>
            <label style={styles.label}>
              Rattacher à
              <select
                value={mediaForm.program_item_id}
                onChange={(event) =>
                  updateMediaField("program_item_id", event.target.value)
                }
                style={styles.input}
              >
                <option value="">Jour entier</option>
                {programItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.label}>
              Type
              <select
                value={mediaForm.media_type}
                onChange={(event) =>
                  updateMediaField("media_type", event.target.value)
                }
                style={styles.input}
              >
                <option value="screenshot">Capture d'écran</option>
                <option value="photo">Photo</option>
              </select>
            </label>

            <Field
              label="Titre interne"
              value={mediaForm.title}
              onChange={(value) => updateMediaField("title", value)}
            />
          </div>

          <div
  onPaste={handlePaste}
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  tabIndex={0}
  style={{
    ...styles.uploadBox,

    background: dragActive
      ? "#dbeafe"
      : "#eff6ff",

    borderColor: dragActive
      ? "#2563eb"
      : "#93c5fd",
  }}
>
  <div>
    📷 Déposez ou collez une image

    <div
      style={{
        marginTop: "8px",
        fontSize: "13px",
        fontWeight: 500,
      }}
    >
      ⌘+V ou glisser-déposer
    </div>

    <label
      style={{
        display: "block",
        marginTop: "12px",
      }}
    >
      <input
        type="file"
        accept="image/*"
        onChange={uploadMedia}
        style={{ display: "none" }}
      />

      <span style={styles.button}>
        Choisir un fichier
      </span>
    </label>
  </div>
</div>


          {mediaItems.length > 0 && (
            <div style={styles.mediaGrid}>
              {mediaItems.map((item) => {
                const imageUrl = getPublicImageUrl(item.image_path)

                return (
                  <div key={item.id} style={styles.mediaCard}>
                    <img src={imageUrl} alt="" style={styles.mediaImage} />

                    <div style={styles.mediaInfo}>
                      <strong>{item.title || "Image"}</strong>
                      <div style={styles.meta}>
                        {item.program_items?.title || "Jour entier"} ·{" "}
                        {item.media_type}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteMedia(item)}
                      style={styles.dangerButton}
                    >
                      Supprimer
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}
          </div>   {/* adminContent */}
</div>   {/* adminLayout */}
    </div>

  )
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label style={styles.label}>
      {label}
      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        style={styles.input}
      />
    </label>
  )
}

function TextArea({ label, value, onChange }) {
  return (
    <label style={styles.label}>
      {label}
      <textarea
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        rows={5}
        style={{
          ...styles.input,
          resize: "vertical",
          lineHeight: 1.5,
        }}
      />
    </label>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: 20,
    background: "#f8fafc",
    color: "#111827",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  title: {
    margin: 0,
    fontSize: 28,
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
  },
adminLayout: {
  display: "grid",
  gridTemplateColumns: "280px minmax(0, 1fr)",
  gap: "24px",
  alignItems: "start",
},
  daysSidebar: {
  background: "#fff",
  borderRadius: "20px",
  padding: "20px",
  border: "1px solid #e5e7eb",
  position: "sticky",
    height: "fit-content",
  top: "20px",
},
adminContent: {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
},
  daysList: {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
},
  homeLink: {
    padding: "10px 14px",
    borderRadius: 999,
    background: "#111827",
    color: "white",
    textDecoration: "none",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
panel: {
  padding: 18,
  borderRadius: 16,
  background: "white",
  border: "1px solid #e5e7eb",
  boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
},
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  panelTitle: {
    margin: "0 0 14px",
    fontSize: 22,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  label: {
    display: "grid",
    gap: 6,
    marginBottom: 12,
    fontWeight: 700,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    font: "inherit",
    background: "white",
  },
  button: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
  primaryButton: {
    width: "100%",
    minHeight: 48,
    border: "none",
    borderRadius: 14,
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 16,
    marginTop: 8,
  },
  dangerButton: {
    padding: "9px 12px",
    border: "none",
    borderRadius: 999,
    background: "#fee2e2",
    color: "#991b1b",
    cursor: "pointer",
    fontWeight: 700,
  },

dayTab: {
  width: "100%",
  textAlign: "left",
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1px solid #d1d5db",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 600,
},
dayTabActive: {
  background: "#2563eb",
  color: "#fff",
  borderColor: "#2563eb",
},
  checks: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    margin: "8px 0 12px",
    fontWeight: 700,
  },
  message: {
    maxWidth: 980,
    margin: "0 auto 18px",
    padding: "12px 14px",
    borderRadius: 12,
    background: "#ecfdf5",
    color: "#065f46",
    fontWeight: 700,
  },
  help: {
    color: "#6b7280",
  },
  list: {
    display: "grid",
    gap: 10,
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #e5e7eb",
  },
  meta: {
    marginTop: 4,
    color: "#6b7280",
    fontSize: 14,
  },
  uploadBox: {
    minHeight: 96,
    marginTop: 8,
    borderRadius: 16,
    border: "2px dashed #93c5fd",
    background: "#eff6ff",
    color: "#1d4ed8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontWeight: 800,
    textAlign: "center",
    padding: 16,
  },
  mediaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginTop: 16,
  },
  mediaCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    overflow: "hidden",
    background: "#ffffff",
  },
  mediaImage: {
    width: "100%",
    height: 150,
    objectFit: "cover",
    display: "block",
  },
  mediaInfo: {
    padding: 12,
  },
}
