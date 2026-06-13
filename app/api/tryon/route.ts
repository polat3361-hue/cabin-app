import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const ACCESSORY_CATS = ['Ayakkabi', 'Canta', 'Gozluk', 'Aksesuar', 'Taki', 'Sapka']

const CATEGORY_MAP: Record<string, string> = {
  'Ust': 'tops', 'Alt': 'bottoms', 'Elbise': 'one-pieces', 'Ceket': 'tops', 'Dis Giyim': 'tops',
}

const ACCESSORY_PROMPTS: Record<string, string> = {
  'Ayakkabi': "Place the shoes naturally on the person's feet",
  'Sapka':    "Place the hat naturally on the person's head",
  'Gozluk':   "Place the glasses naturally on the person's face",
  'Canta':    "Place the bag naturally on the person's shoulder or hand",
  'Taki':     "Place the jewelry naturally on the person",
  'Aksesuar': '',
}

function normalizeCategory(cat: string): string {
  return (cat ?? '')
    .replace(/ü/g,'u').replace(/Ü/g,'U')
    .replace(/ş/g,'s').replace(/Ş/g,'S')
    .replace(/ı/g,'i').replace(/İ/g,'I')
    .replace(/ğ/g,'g').replace(/Ğ/g,'G')
    .replace(/ç/g,'c').replace(/Ç/g,'C')
    .replace(/ö/g,'o').replace(/Ö/g,'O')
}

function getCost(normalizedCategory: string): number {
  return ACCESSORY_CATS.includes(normalizedCategory) ? 2 : 1
}

export async function POST(req: NextRequest) {
  // ── 1. Kullanıcıyı doğrula (JWT sunucuda kontrol edilir) ──────────────────
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'yetkisiz' }, { status: 401 })

  // ── 2. İstek gövdesi ──────────────────────────────────────────────────────
  const { modelImage, garmentImage, category } = await req.json()
  if (!modelImage || !garmentImage) {
    return NextResponse.json({ error: 'eksik parametre' }, { status: 400 })
  }

  const apiKey = process.env.FASHN_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key yok' }, { status: 500 })

  const normalized = normalizeCategory(category)
  const cost = getCost(normalized)

  // ── 3. Mevcut krediyi oku ─────────────────────────────────────────────────
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  if (!profile || profile.credits < cost) {
    return NextResponse.json(
      { error: 'yetersiz_kredi', credits: profile?.credits ?? 0 },
      { status: 402 }
    )
  }

  // ── 4. FASHN API çağrısı ──────────────────────────────────────────────────
  const isAccessory = ACCESSORY_CATS.includes(normalized)
  const modelName   = isAccessory ? 'tryon-max' : 'tryon-v1.6'
  const prompt      = ACCESSORY_PROMPTS[normalized] ?? ''
  const inputs      = isAccessory
    ? { product_image: garmentImage, model_image: modelImage, ...(prompt ? { prompt } : {}) }
    : { model_image: modelImage, garment_image: garmentImage, category: CATEGORY_MAP[normalized] ?? 'auto', garment_photo_type: 'auto', mode: 'quality' }

  try {
    const runRes = await fetch('https://api.fashn.ai/v1/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({ model_name: modelName, inputs }),
    })
    const runData = await runRes.json()
    if (!runRes.ok) return NextResponse.json({ error: 'run hatasi', detail: runData }, { status: runRes.status })

    const predictionId = runData.id

    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 2000))
      const statusRes  = await fetch('https://api.fashn.ai/v1/status/' + predictionId, {
        headers: { 'Authorization': 'Bearer ' + apiKey },
      })
      const statusData = await statusRes.json()

      if (statusData.status === 'completed') {
        const output = statusData.output?.[0] || statusData.outputs?.[0]

        // ── 5. Başarılı → krediyi sunucuda düş ──────────────────────────────
        await supabaseAdmin
          .from('profiles')
          .update({ credits: profile.credits - cost })
          .eq('id', user.id)

        return NextResponse.json({ output })
      }

      if (statusData.status === 'failed') {
        return NextResponse.json({ error: 'basarisiz', detail: statusData.error }, { status: 500 })
      }
    }
    return NextResponse.json({ error: 'zaman asimi' }, { status: 504 })
  } catch (err) {
    return NextResponse.json({ error: 'sunucu hatasi', detail: String(err) }, { status: 500 })
  }
}
