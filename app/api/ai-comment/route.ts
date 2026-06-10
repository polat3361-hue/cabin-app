import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { outfitName, category, brand } = await req.json()

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Sen bir moda uzmanısın. Kullanıcı "${outfitName}" adlı "${category}" kategorisinde "${brand}" markasının kıyafetini denedi. SADECE kıyafet, ayakkabı, çanta veya takı gibi moda ürünleri öner. Elektronik, telefon, teknoloji ürünleri kesinlikle önerme. Sadece JSON formatında yanıt ver, başka hiçbir şey yazma:
{
  "comment": "2 cümle samimi yorum emoji kullan",
  "score": 85-98 arası sayı,
  "colorSuggestion": "renk önerisi tek cümle",
  "styleTip": "stil ipucu tek cümle",
  "combinations": [
    { "item": "kısa kıyafet/ayakkabı/aksesuar adı", "reason": "neden yakışır tek cümle", "search": "trendyol arama terimi" },
    { "item": "kısa kıyafet/ayakkabı/aksesuar adı", "reason": "neden yakışır tek cümle", "search": "hepsiburada arama terimi" },
    { "item": "kısa kıyafet/ayakkabı/aksesuar adı", "reason": "neden yakışır tek cümle", "search": "zara arama terimi" }
  ]
}`
      }]
    })
  })

  const data = await response.json()

  try {
    const text = data.content[0].text
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    return NextResponse.json(parsed, { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
  } catch {
    return NextResponse.json({
      comment: 'Bu kombinasyon sana çok yakışmış! 🔥',
      score: 92,
      colorSuggestion: '',
      styleTip: '',
      combinations: [
        { item: 'Slim Fit Jean', reason: 'Casual ve şık bir kombin oluşturur', search: 'slim fit jean' },
        { item: 'Beyaz Sneaker', reason: 'Her kombine uyan klasik seçim', search: 'beyaz spor ayakkabı' },
        { item: 'Minimal Saat', reason: 'Kombini tamamlayan şık aksesuar', search: 'minimal kol saati' }
      ]
    }, { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
  }
}
