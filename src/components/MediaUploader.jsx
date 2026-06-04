import { supabase } from "../lib/supabase"

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

    const fileName =
      Date.now() + "-" + file.name

    const filePath =
      `${dayId}/${fileName}`

    const { error: uploadError } =
      await supabase.storage
        .from("voyage-images")
        .upload(filePath, file)

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