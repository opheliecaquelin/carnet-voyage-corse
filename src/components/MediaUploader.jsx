import { supabase } from "../lib/supabase"
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
export default function MediaUploader({
  dayId,
  programItemId,
  onUploadSuccess,
}) {
  async function handleFileChange(event) {
    const { data: auth } =
    await supabase.auth.getUser()

    const email = auth.user?.email

    if (
    email !== "ophelie.caquelin@gmail.com"
    ) {
    alert(
        "Seule Ophélie peut ajouter des images."
    )
    return
    }
    const file = event.target.files?.[0]

    if (!file) return

    const compressedFile = await compressImage(file)

    const safeName = file.name
      .replace(/\.[^.]+$/, ".jpg")
      .replace(/[^a-zA-Z0-9._-]/g, "-")

    const fileName = `${Date.now()}-${safeName}`
    const filePath = `${dayId}/${fileName}`

    const { error: uploadError } =
      await supabase.storage
        .from("voyage-images")
        .upload(filePath, compressedFile, {
          contentType: "image/jpeg",
        })

    if (uploadError) {
        console.error("UPLOAD ERROR", uploadError)

        alert(
        JSON.stringify(uploadError, null, 2)
        )
      return
    }

    const { error: insertError } =
        await supabase
        .from("media")
        .insert({
            day_id: dayId,
            program_item_id: programItemId,
            title: file.name,
            media_type: "screenshot",
            image_path: filePath,
        })

    if (insertError) {
      console.error(insertError)
      alert("Erreur base")
      return
    }

    onUploadSuccess()
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  )
}