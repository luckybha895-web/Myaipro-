import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  processImageRequest,
  type AspectRatio,
  type ImageResolution,
  type ImageStylePreset,
  type ImageFocusArea,
  type UnifiedImageRequestBody,
} from "@/lib/gemini-image-service";

const imageRequestSchema = z.object({
  action: z.enum(["generate", "analyze", "edit"]),
  prompt: z.string().max(4000).optional(),
  image: z
    .object({
      data: z.string().min(1, "Base64 image data is required"),
      mimeType: z.string().default("image/jpeg"),
    })
    .optional(),
  aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9", "1:4", "1:8", "4:1", "8:1"]).optional(),
  imageSize: z.enum(["512px", "1K", "2K", "4K"]).optional(),
  stylePreset: z
    .enum([
      "auto",
      "photorealistic",
      "cinematic",
      "anime",
      "digital-art",
      "3d-render",
      "oil-painting",
      "watercolor",
      "cyberpunk",
      "sketch",
      "vector",
      "minimalist",
      "vintage",
      "isometric",
      "fantasy",
    ])
    .optional(),
  focusArea: z.enum(["general", "ocr", "math", "diagram", "ui", "objects"]).optional(),
  editType: z.enum(["reimagine", "style-transfer", "add-remove", "enhance", "custom"]).optional(),
  negativePrompt: z.string().max(500).optional(),
  seed: z.number().int().optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
});

export const Route = createFileRoute("/api/image")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({
          status: "ok",
          service: "Gemini Image & Vision Unified Engine",
          actions: ["generate", "analyze", "edit"],
          capabilities: {
            aspectRatios: ["1:1", "3:4", "4:3", "9:16", "16:9", "1:4", "1:8", "4:1", "8:1"],
            resolutions: ["512px", "1K", "2K", "4K"],
            styles: [
              "auto",
              "photorealistic",
              "cinematic",
              "anime",
              "digital-art",
              "3d-render",
              "oil-painting",
              "watercolor",
              "cyberpunk",
              "sketch",
              "vector",
              "minimalist",
              "vintage",
              "isometric",
              "fantasy",
            ],
            focusAreas: ["general", "ocr", "math", "diagram", "ui", "objects"],
            editTypes: ["reimagine", "style-transfer", "add-remove", "enhance", "custom"],
          },
        });
      },

      POST: async ({ request }) => {
        try {
          const json = await request.json();
          const parsed = imageRequestSchema.safeParse(json);

          if (!parsed.success) {
            return Response.json(
              {
                success: false,
                error: "Invalid image request payload",
                details: parsed.error.format(),
              },
              { status: 400 },
            );
          }

          const body: UnifiedImageRequestBody = {
            action: parsed.data.action,
            prompt: parsed.data.prompt,
            image: parsed.data.image,
            aspectRatio: parsed.data.aspectRatio as AspectRatio | undefined,
            imageSize: parsed.data.imageSize as ImageResolution | undefined,
            stylePreset: parsed.data.stylePreset as ImageStylePreset | undefined,
            focusArea: parsed.data.focusArea as ImageFocusArea | undefined,
            editType: parsed.data.editType,
            negativePrompt: parsed.data.negativePrompt,
            seed: parsed.data.seed,
            model: parsed.data.model,
            apiKey: parsed.data.apiKey,
          };

          const result = await processImageRequest(body, parsed.data.apiKey);
          return Response.json(result);
        } catch (err) {
          console.error("Image API handler error:", err);
          return Response.json(
            {
              success: false,
              error: err instanceof Error ? err.message : "Internal image processing failure",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
