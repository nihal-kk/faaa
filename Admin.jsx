import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../hooks/useAuth.js'

const CATEGORIES = [
  'bridal',
  'arabic',
  'minimal',
  'floral',
  'mandala',
  'royal',
  'other'
]

// =====================================================
// UPLOAD MODAL
// =====================================================

function UploadModal({ onClose, onUploaded, authHeaders }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)

  const [form, setForm] = useState({
    title: '',
    category: 'bridal',
    description: ''
  })

  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const fileRef = useRef(null)

  // =====================================================
  // N8N WEBHOOK
  // =====================================================

  const N8N_WEBHOOK_URL =
    'https://n8n.muhammadnihal.in/webhook-test/zeina-upload'

  // =====================================================
  // HANDLE FILE SELECT
  // =====================================================

  const handleFile = (e) => {
    const f = e.target.files[0]

    if (!f) return

    if (!f.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (f.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB')
      return
    }

    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError('')

    if (!form.title) {
      setForm((prev) => ({
        ...prev,
        title: f.name
          .replace(/\.[^.]+$/, '')
          .replace(/[-_]/g, ' ')
      }))
    }
  }

  // =====================================================
  // HANDLE DRAG & DROP
  // =====================================================

  const handleDrop = (e) => {
    e.preventDefault()

    const f = e.dataTransfer.files[0]

    if (!f) return

    if (!f.type.startsWith('image/')) {
      setError('Please drop an image file')
      return
    }

    if (f.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB')
      return
    }

    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError('')

    if (!form.title) {
      setForm((prev) => ({
        ...prev,
        title: f.name
          .replace(/\.[^.]+$/, '')
          .replace(/[-_]/g, ' ')
      }))
    }
  }

  // =====================================================
  // UPLOAD
  // BACKEND + N8N
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!file) {
      setError('Please select an image')
      return
    }

    if (!form.title.trim()) {
      setError('Please enter a title')
      return
    }

    setUploading(true)
    setError('')

    try {
      // =================================================
      // STEP 1 — UPLOAD IMAGE TO YOUR BACKEND
      // =================================================

      const backendFormData = new FormData()

      backendFormData.append('image', file)

      console.log('Uploading image to backend...')

      const { data: uploaded } = await axios.post(
        '/api/upload',
        backendFormData,
        {
          headers: {
            ...authHeaders,
            // IMPORTANT:
            // Do not manually set Content-Type.
            // Browser/Axios will add multipart boundary.
          },
          timeout: 60000
        }
      )

      console.log('Backend upload successful:', uploaded)

      // =================================================
      // STEP 2 — SEND SAME IMAGE + DETAILS TO N8N
      // =================================================

      const n8nFormData = new FormData()

      n8nFormData.append('image', file)

      n8nFormData.append(
        'title',
        form.title.trim()
      )

      n8nFormData.append(
        'category',
        form.category
      )

      n8nFormData.append(
        'description',
        form.description.trim()
      )

      n8nFormData.append(
        'originalName',
        file.name
      )

      n8nFormData.append(
        'mimeType',
        file.type
      )

      n8nFormData.append(
        'size',
        file.size.toString()
      )

      console.log('Sending image to n8n...')

      const n8nResponse = await axios.post(
        N8N_WEBHOOK_URL,
        n8nFormData,
        {
          headers: {
            // Keep auth headers if required
            ...authHeaders

            // DO NOT set Content-Type manually.
          },
          timeout: 60000
        }
      )

      console.log(
        'n8n response:',
        n8nResponse.data
      )

      // =================================================
      // STEP 3 — SAVE WORK DETAILS TO MONGODB
      // =================================================

      console.log(
        'Saving work details to database...'
      )

      await axios.post(
        '/api/works',
        {
          title: form.title.trim(),
          category: form.category,
          description: form.description.trim(),

          // Information returned from backend upload
          filename: uploaded.filename,
          originalName:
            uploaded.originalName || file.name,
          mimeType:
            uploaded.mimeType || file.type,
          size:
            uploaded.size || file.size
        },
        {
          headers: authHeaders,
          timeout: 60000
        }
      )

      console.log(
        'Work saved successfully to MongoDB'
      )

      // =================================================
      // STEP 4 — REFRESH ADMIN GALLERY
      // =================================================

      await onUploaded()

      // =================================================
      // STEP 5 — CLOSE MODAL
      // =================================================

      onClose()

    } catch (err) {
      console.error(
        'Upload process error:',
        err
      )

      let message = 'Upload failed'

      if (err.code === 'ECONNABORTED') {
        message =
          'Request timed out. Please try again.'
      }

      else if (err.response?.data?.message) {
        message =
          err.response.data.message
      }

      else if (err.response?.data?.error) {
        message =
          err.response.data.error
      }

      else if (err.message) {
        message =
          err.message
      }

      setError(message)

    } finally {
      setUploading(false)
    }
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">

      <div className="bg-[#2d1a17] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden">

        {/* Header */}

        <div className="flex items-center justify-between p-6 border-b border-white/10">

          <h2 className="font-serif text-xl text-gold">
            Upload New Work
          </h2>

          <button
            onClick={onClose}
            disabled={uploading}
            className="text-ivory/30 hover:text-ivory transition-colors text-2xl leading-none disabled:opacity-50"
          >
            &times;
          </button>

        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4"
        >

          {/* Drop Zone */}

          <div
            className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-gold/40 transition-colors duration-300"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
          >

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />

            {preview ? (

              <img
                src={preview}
                alt="preview"
                className="w-32 h-32 object-cover rounded-xl mx-auto mb-2"
              />

            ) : (

              <div className="text-5xl mb-2">
                🌸
              </div>

            )}

            <p className="text-ivory/40 text-sm">
              {file
                ? file.name
                : 'Click or drag image here'}
            </p>

            <p className="text-ivory/20 text-xs mt-1">
              JPG, PNG, WebP up to 10MB
            </p>

          </div>

          {/* Title */}

          <input
            required
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value
              })
            }
            placeholder="Title (e.g. Bridal Mandala)"
            className="w-full bg-white/10 border border-white/10 text-ivory rounded-xl px-4 py-3 text-sm placeholder-ivory/30 focus:outline-none focus:border-gold transition-all"
          />

          {/* Category */}

          <select
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value
              })
            }
            className="w-full bg-white/10 border border-white/10 text-ivory rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold transition-all"
          >

            {CATEGORIES.map((c) => (

              <option
                key={c}
                value={c}
                className="bg-[#2d1a17] capitalize"
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>

            ))}

          </select>

          {/* Description */}

          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value
              })
            }
            placeholder="Description (optional)"
            rows={2}
            className="w-full bg-white/10 border border-white/10 text-ivory rounded-xl px-4 py-3 text-sm placeholder-ivory/30 focus:outline-none focus:border-gold transition-all resize-none"
          />

          {/* Error */}

          {error && (

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">

              <p className="text-red-400 text-xs">
                {error}
              </p>

            </div>

          )}

          {/* Buttons */}

          <div className="flex gap-3">

            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="flex-1 border border-white/20 text-ivory/60 py-3 rounded-xl text-sm hover:bg-white/5 transition-all disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={uploading}
              className="flex-1 bg-gold text-brown font-semibold py-3 rounded-xl text-sm hover:bg-gold-light transition-all disabled:opacity-50"
            >
              {uploading
                ? 'Uploading...'
                : 'Upload & Save'}
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}


// =====================================================
// EDIT MODAL
// =====================================================

function EditModal({
  work,
  onClose,
  onSaved,
  authHeaders
}) {

  const [form, setForm] = useState({
    title: work.title,
    category: work.category,
    description: work.description || ''
  })

  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {

    e.preventDefault()

    setSaving(true)

    try {

      await axios.patch(
        `/api/works/${work._id}`,
        form,
        {
          headers: authHeaders
        }
      )

      onSaved()
      onClose()

    } catch (err) {

      console.error(
        'Edit error:',
        err
      )

    } finally {

      setSaving(false)

    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">

      <div className="bg-[#2d1a17] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden">

        <div className="flex items-center justify-between p-6 border-b border-white/10">

          <h2 className="font-serif text-xl text-gold">
            Edit Work
          </h2>

          <button
            onClick={onClose}
            disabled={saving}
            className="text-ivory/30 hover:text-ivory text-2xl leading-none disabled:opacity-50"
          >
            &times;
          </button>

        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4"
        >

          <input
            required
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value
              })
            }
            placeholder="Title"
            className="w-full bg-white/10 border border-white/10 text-ivory rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold transition-all"
          />

          <select
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value
              })
            }
            className="w-full bg-white/10 border border-white/10 text-ivory rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold transition-all"
          >

            {CATEGORIES.map((c) => (

              <option
                key={c}
                value={c}
                className="bg-[#2d1a17] capitalize"
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>

            ))}

          </select>

          <textarea
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value
              })
            }
            placeholder="Description"
            rows={2}
            className="w-full bg-white/10 border border-white/10 text-ivory rounded-xl px-4 py-3 text-sm placeholder-ivory/30 focus:outline-none focus:border-gold transition-all resize-none"
          />

          <div className="flex gap-3">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 border border-white/20 text-ivory/60 py-3 rounded-xl text-sm hover:bg-white/5 transition-all disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gold text-brown font-semibold py-3 rounded-xl text-sm hover:bg-gold-light transition-all disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : 'Save Changes'}
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}


// =====================================================
// ADMIN PAGE
// =====================================================

export default function Admin() {

  const {
    token,
    logout,
    authHeaders
  } = useAuth()

  const navigate = useNavigate()

  const [works, setWorks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [editWork, setEditWork] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [deleting, setDeleting] = useState(null)

  // =====================================================
  // CHECK LOGIN
  // =====================================================

  useEffect(() => {

    if (!token) {
      navigate('/admin/login')
      return
    }

    fetchWorks()

  }, [token])

  // =====================================================
  // GET WORKS
  // =====================================================

  const fetchWorks = async () => {

    setLoading(true)

    try {

      const { data } = await axios.get(
        '/api/works'
      )

      setWorks(data)

    } catch (err) {

      console.error(
        'Fetch works error:',
        err
      )

    } finally {

      setLoading(false)

    }
  }

  // =====================================================
  // DELETE WORK
  // =====================================================

  const handleDelete = async (id) => {

    if (!confirm(
      'Delete this work? This cannot be undone.'
    )) {
      return
    }

    setDeleting(id)

    try {

      await axios.delete(
        `/api/works/${id}`,
        {
          headers: authHeaders
        }
      )

      setWorks((prev) =>
        prev.filter(
          (w) => w._id !== id
        )
      )

    } catch (err) {

      console.error(
        'Delete error:',
        err
      )

    } finally {

      setDeleting(null)

    }
  }

  // =====================================================
  // FILTER
  // =====================================================

  const filtered =
    activeCategory === 'all'
      ? works
      : works.filter(
          (w) =>
            w.category === activeCategory
        )

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="min-h-screen bg-[#150905] text-ivory">

      {/* Header */}

      <header className="border-b border-white/10 bg-[#1a0a08]/80 backdrop-blur-md sticky top-0 z-40">

        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          <div className="flex items-center gap-4">

            <a
              href="/"
              className="font-serif text-gold text-lg"
            >
              Zeina Mehandi
            </a>

            <span className="text-ivory/20 text-xs">
              / Admin
            </span>

          </div>

          <div className="flex items-center gap-4">

            <span className="text-ivory/30 text-xs hidden md:block">
              {works.length} works
            </span>

            <button
              onClick={() =>
                setShowUpload(true)
              }
              className="bg-gold text-brown text-sm font-semibold px-5 py-2 rounded-full hover:bg-gold-light transition-all"
            >
              + Upload
            </button>

            <button
              onClick={() => {
                logout()
                navigate('/admin/login')
              }}
              className="text-ivory/30 text-xs hover:text-ivory transition-colors"
            >
              Sign Out
            </button>

          </div>

        </div>

      </header>


      {/* Main */}

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Stats */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">

          {[
            {
              label: 'Total Works',
              value: works.length
            },
            {
              label: 'Bridal',
              value: works.filter(
                (w) =>
                  w.category === 'bridal'
              ).length
            },
            {
              label: 'Arabic',
              value: works.filter(
                (w) =>
                  w.category === 'arabic'
              ).length
            },
            {
              label: 'Other Styles',
              value: works.filter(
                (w) =>
                  ![
                    'bridal',
                    'arabic'
                  ].includes(w.category)
              ).length
            }
          ].map((s) => (

            <div
              key={s.label}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
            >

              <p className="text-3xl font-serif text-gold font-bold">
                {s.value}
              </p>

              <p className="text-ivory/40 text-xs tracking-wider uppercase mt-1">
                {s.label}
              </p>

            </div>

          ))}

        </div>


        {/* Category Filter */}

        <div className="flex flex-wrap gap-2 mb-6">

          {[
            'all',
            ...CATEGORIES
          ].map((cat) => (

            <button
              key={cat}
              onClick={() =>
                setActiveCategory(cat)
              }
              className={`px-3 py-1.5 rounded-full text-xs tracking-widest uppercase transition-all ${
                activeCategory === cat
                  ? 'bg-gold text-brown font-semibold'
                  : 'border border-white/20 text-ivory/50 hover:border-gold/40'
              }`}
            >
              {cat}
            </button>

          ))}

        </div>


        {/* Grid */}

        {loading ? (

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">

            {[...Array(10)].map((_, i) => (

              <div
                key={i}
                className="aspect-square rounded-xl bg-white/5 animate-pulse"
              />

            ))}

          </div>

        ) : filtered.length === 0 ? (

          <div className="text-center py-24 text-ivory/20">

            <div className="text-5xl mb-4">
              🌸
            </div>

            <p className="font-serif text-xl">
              No works yet
            </p>

            <p className="text-sm mt-2">
              Click "Upload" to add your first design
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">

            {filtered.map((work) => (

              <div
                key={work._id}
                className="group relative rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-gold/30 transition-all duration-300"
              >

                {/* Image */}

                <div className="aspect-square overflow-hidden">

                  <img
                    src={`/uploads/${work.filename}`}
                    alt={work.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                </div>


                {/* Info */}

                <div className="p-3">

                  <p className="text-gold/60 text-[9px] tracking-widest uppercase">
                    {work.category}
                  </p>

                  <p className="text-ivory text-sm font-medium truncate">
                    {work.title}
                  </p>

                  {work.description && (

                    <p className="text-ivory/30 text-xs truncate mt-0.5">
                      {work.description}
                    </p>

                  )}

                </div>


                {/* Actions */}

                <div className="flex gap-2 px-3 pb-3">

                  <button
                    onClick={() =>
                      setEditWork(work)
                    }
                    className="flex-1 bg-white/10 hover:bg-white/20 text-ivory/70 text-xs py-1.5 rounded-lg transition-all"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(work._id)
                    }
                    disabled={
                      deleting === work._id
                    }
                    className="flex-1 bg-red-900/30 hover:bg-red-900/60 text-red-400 text-xs py-1.5 rounded-lg transition-all disabled:opacity-50"
                  >
                    {deleting === work._id
                      ? '...'
                      : 'Delete'}
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>


      {/* Upload Modal */}

      {showUpload && (

        <UploadModal
          onClose={() =>
            setShowUpload(false)
          }
          onUploaded={fetchWorks}
          authHeaders={authHeaders}
        />

      )}


      {/* Edit Modal */}

      {editWork && (

        <EditModal
          work={editWork}
          onClose={() =>
            setEditWork(null)
          }
          onSaved={fetchWorks}
          authHeaders={authHeaders}
        />

      )}

    </div>
  )
}
