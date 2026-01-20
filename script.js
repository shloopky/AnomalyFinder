import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function UploadPost() {
  const [file, setFile] = useState(null)
  const [tags, setTags] = useState("")

  async function handleUpload() {
    const user = supabase.auth.user()
    const fileName = `${Date.now()}_${file.name}`
    
    // 1. Upload file to Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('forum-files')
      .upload(fileName, file)

    if (storageError) return alert("Upload failed")

    // 2. Get Public URL
    const { publicURL } = supabase.storage.from('forum-files').getPublicUrl(fileName)

    // 3. Save to Database with Tags (just like a booru)
    const tagArray = tags.split(' ').map(t => t.trim())
    const { error } = await supabase.from('posts').insert([
      { 
        user_id: user.id, 
        file_url: publicURL, 
        tags: tagArray 
      }
    ])
    
    if (!error) alert("Post created!")
  }

  return (
    <div className="aero-glass p-6 max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold text-blue-800 mb-4">New Post</h2>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} className="mb-4 block w-full" />
      <input 
        placeholder="Tags (space separated)..." 
        className="w-full p-2 mb-4 rounded-md border"
        onChange={(e) => setTags(e.target.value)}
      />
      <button onClick={handleUpload} className="glossy-button px-4 py-2 rounded-full w-full font-bold">
        Upload to Forum
      </button>
    </div>
  )
}
