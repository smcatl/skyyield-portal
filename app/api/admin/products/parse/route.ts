import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

interface ParsedProduct {
  name: string
  description: string
  sku: string
  category: string
  manufacturer: string
  msrp: number
  storePrice: number
  markup: number
  features: string
  typeLayer: string
  availability: string
  productUrl: string
  images: string[]
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Read file buffer
    const buffer = await file.arrayBuffer()
    
    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[]

    if (!rawData || rawData.length === 0) {
      return NextResponse.json({ error: "No data found in file" }, { status: 400 })
    }

    // Map Excel columns to our product format
    const products: ParsedProduct[] = rawData.map(row => {
      // Handle different possible column names
      const name = (row["Product Name"] || row["Name"] || row["product_name"] || "") as string
      const sku = (row["SKU"] || row["sku"] || "") as string
      const category = (row["Category"] || row["category"] || "Uncategorized") as string
      const manufacturer = (row["Manufacturer"] || row["manufacturer"] || row["Brand"] || "") as string
      const msrp = parseFloat(String(row["Price (USD)"] || row["MSRP"] || row["msrp"] || row["Price"] || 0))
      const markup = parseFloat(String(row["Markup"] || row["markup"] || 0.2))
      const storePrice = parseFloat(String(row["SkyYield Store Price"] || row["Store Price"] || row["store_price"] || 0)) || (msrp * (1 + markup))
      const description = (row["Description"] || row["description"] || "") as string
      const features = (row["Key Features"] || row["Features"] || row["features"] || "") as string
      const typeLayer = (row["Type/Layer"] || row["Type"] || row["Layer"] || "") as string
      const availability = (row["Availability"] || row["availability"] || row["Stock"] || "In Stock") as string
      const productUrl = (row["Product URL"] || row["URL"] || row["url"] || "") as string
      
      // Handle images
      const image1 = (row["Image 1 URL"] || row["Image1"] || row["image1"] || "") as string
      const image2 = (row["Image 2 URL"] || row["Image2"] || row["image2"] || "") as string
      const image3 = (row["Image 3 URL"] || row["Image3"] || row["image3"] || "") as string

      return {
        name,
        description,
        sku,
        category,
        manufacturer,
        msrp,
        storePrice,
        markup,
        features,
        typeLayer,
        availability,
        productUrl,
        images: [image1, image2, image3].filter(img => img),
      }
    }).filter(product => product.name) // Filter out rows without a name

    return NextResponse.json({ 
      products,
      count: products.length,
    })
  } catch (error) {
    console.error("Error parsing file:", error)
    return NextResponse.json(
      { error: "Failed to parse file. Make sure it's a valid Excel or CSV file." },
      { status: 500 }
    )
  }
}