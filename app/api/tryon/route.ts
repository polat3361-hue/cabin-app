import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { modelImage, garmentImage, category } = await req.json()

  if (!modelImage || !garmentImage) {
    return NextResponse.json({ error: 'eksik parametre' }, { status: 400 })
  }

  const apiKey = process.env.FASHN_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'API key yok' }, { status: 500 })

  // Aksesuar/ayakkabı kategorileri → tryon-max
  const accessoryCats = ['Ayakkabi', 'Canta', 'Gozluk', 'Aksesuar', 'Taki', 'Sapka']
  // Kıyafet kategorisi → tryon-v1.6 category map
  const categoryMap: Record<string, string> = {
    'Ust': 'tops', 'Alt': 'bottoms', 'Elbise': 'one-pieces', 'Ceket': 'tops', 'Dis Giyim': 'tops'
  }
  // tryon-max prompt'ları: doğal yerleştirme için yönlendirme
  const accessoryPrompts: Record<string, string> = {
    'Ayakkabi': 'Place the shoes naturally on the person\'s feet',
    'Sapka':    'Place the hat naturally on the person\'s head',
    'Gozluk':   'Place the glasses naturally on the person\'s face',
    'Canta':    'Place the bag naturally on the person\'s shoulder or hand',
    'Taki':     'Place the jewelry naturally on the person',
    'Aksesuar': '',
  }

  const normalized = category
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')

  console.log('category:', category, 'normalized:', normalized)

  const isAccessory = accessoryCats.includes(normalized)
  const modelName = isAccessory ? 'tryon-max' : 'tryon-v1.6'

  const prompt = accessoryPrompts[normalized] ?? ''
  const inputs = isAccessory
    ? { product_image: garmentImage, model_image: modelImage, ...(prompt ? { prompt } : {}) }
    : { model_image: modelImage, garment_image: garmentImage, category: categoryMap[normalized] ?? 'auto', garment_photo_type: 'auto' }

  try {
    const runRes = await fetch('https://api.fashn.ai/v1/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({ model_name: modelName, inputs }),
    })

    const runData = await runRes.json()
    console.log('runData:', JSON.stringify(runData))
    if (!runRes.ok) return NextResponse.json({ error: 'run hatasi', detail: runData }, { status: runRes.status })

    const predictionId = runData.id

    for (let i = 0; i < 40; i++) {
      await new Promise(r => setTimeout(r, 2000))
      const statusRes = await fetch('https://api.fashn.ai/v1/status/' + predictionId, {
        headers: { 'Authorization': 'Bearer ' + apiKey },
      })
      const statusData = await statusRes.json()
      console.log('status:', statusData.status)
      if (statusData.status === 'completed') {
        console.log('output:', JSON.stringify(statusData.output))
        const output = statusData.output?.[0] || statusData.outputs?.[0]
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
