import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;
    const compressionLevel = formData.get("compressionLevel") as string;

    if (!image) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    let quality: number;

    switch (compressionLevel) {
      case "low":
        quality = 80;
        break;
      case "high":
        quality = 40;
        break;
      default: // medium
        quality = 60;
    }

    const imageProcessor = sharp(buffer);
    const metadata = await imageProcessor.metadata();

    if (!metadata.format) {
      return NextResponse.json(
        { error: "Invalid image format" },
        { status: 400 }
      );
    }

    let processedBuffer: Buffer;
    const format = metadata.format as keyof sharp.FormatEnum;

    // Process based on image format
    switch (format) {
      case "jpeg":
      case "jpg":
        processedBuffer = await imageProcessor
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();
        break;
      case "png":
        processedBuffer = await imageProcessor
          .png({ quality, compressionLevel: 9 })
          .toBuffer();
        break;
      case "webp":
        processedBuffer = await imageProcessor.webp({ quality }).toBuffer();
        break;
      default:
        // Convert unsupported formats to WebP
        processedBuffer = await imageProcessor.webp({ quality }).toBuffer();
    }

    // Convert to base64 for frontend preview
    const compressedDataUrl = `data:image/${format};base64,${processedBuffer.toString(
      "base64"
    )}`;

    return NextResponse.json({
      compressedDataUrl,
      size: processedBuffer.length,
      format,
    });
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
